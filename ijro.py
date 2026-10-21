"""Real pul ijrochisi: Binance USDⓈ-M futures.

Bulutdagi bot (bulut.py) qaror qiladi va holat.json ni repoga yozadi. Bu dastur Binance'ga ruxsat bor joyda
(Gojoning kompyuteri yoki server) to'xtovsiz ishlaydi va:
  1. holat.json dan tanlangan yo'llarning (kombinatsiya) qog'oz pozitsiyalarini o'qiydi,
  2. ularni har tanga bo'yicha bitta pozitsiyaga birlashtiradi (bir yo'l long, boshqasi short bo'lsa = 0),
  3. farqni Binance'da limit (maker) order bilan bajaradi, bo'lmasa oxirida bozor narxida,
  4. har pozitsiyaga birjaning o'zida himoya stopini qo'yadi (kompyuter o'chsa ham ishlaydi).

Leverage zinapoyasi: 2x da 30 kun foydada bo'lsa 3x, keyin 14 kundan foydada bo'lsa 4x, 5x. Shu bosqichdagi
cho'qqidan 20% tushsa bir pog'ona pastga. Kunlik zarar 10% dan oshsa hammasi yopiladi va ertasigacha dam.
Telegramdagi /toxtat (bulut.py orqali holat.json ga yoziladi) hammasini yopib to'xtatadi, /davom qayta yoqadi.

Sozlama: ijro_sozlama.json (repoga YOZILMAYDI), `python ijro.py sozla` savol berib o'zi yaratadi. Namuna:
  {"api_key": "...", "api_secret": "...", "sinov": true, "kombinatsiya": {"qoida": 0.5, "short": 0.5}}
sinov=true: demo.binance.com hisobi (soxta pul). Kalitga faqat "Futures" ruxsati, pul yechish YO'Q, IP cheklovi bilan.
"""

import calendar
import hashlib
import hmac
import json
import getpass
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from decimal import ROUND_DOWN, ROUND_HALF_UP, ROUND_UP, Decimal
from pathlib import Path

BELGILAR = ["BTC", "ETH", "SOL", "BNB", "XRP"]  # bulut.py SIGNAL_BELGILAR bilan bir xil
YOL_ULUSHI = 200 / 1000  # qog'oz yo'l har tangaga pulining 20% ini marja qiladi (ULUSH / BOSHLANG_ICH_PUL)
HOLAT_URL = "https://api.github.com/repos/zaveronlabs/treyder-bot/contents/holat.json"
HOLAT_RAW = "https://raw.githubusercontent.com/zaveronlabs/treyder-bot/main/holat.json"
XATO_CHIDASH = 5  # bir lahzalik server xatolari: shuncha daqiqa ketma-ket bo'lsagina Telegramga yoziladi
BAZA = {True: "https://demo-fapi.binance.com", False: "https://fapi.binance.com"}
ZINAPOYA = [2, 3, 4, 5]  # leverage pog'onalari
ZINA_KUN = [30, 14, 14]  # keyingi pog'onaga o'tishdan oldin shu pog'onada necha kun foydada turish kerak
TUSHISH = 0.20  # pog'ona ichidagi cho'qqidan shuncha tushsa bir pog'ona pastga
KUNLIK_ZARAR = 0.10  # kun boshidagi puldan shuncha yo'qotilsa hammasi yopiladi, ertasigacha savdo yo'q
STOP_ULUSH = 0.6  # pozitsiya marjasining 60% i yo'qolsa birja stopi yopadi (likvidatsiyadan oldin)
PUL_ULUSHI = 0.97  # komissiya va narx siljishi uchun pulning 3% i chetda turadi
YAXLITLASH = 0.5  # kichik pul: kerakli hajm birja eng kamining shu qismidan katta bo'lsa eng kamigacha oshiriladi
YAXLITLASH_CHEGARA = 0.3  # ...lekin eng kam order marjasi pulning 30% idan oshmasa
ESKIRISH = 8.5 * 3600  # bulutdagi bot shuncha vaqt yangi shamni qayta ishlamasa xabar beriladi
LIMIT_URINISH, LIMIT_KUTISH = 5, 60  # limit orderni 5 marta, har birini 60 soniya kutib qayta narxlaydi

PAPKA = Path(__file__).parent
# 🔀 uchga bo'lish: 2019 dan o'qigan miya bilan 2024..2026 da ⚖ (qoida + short) dan ikkala yarmida ham yaxshi
SOZLAMA = {"sinov": True, "kombinatsiya": {"qoida": 1 / 3, "miya": 1 / 3, "longshort": 1 / 3}, "bozor_zaxira": True}
KOD_URL = "https://raw.githubusercontent.com/zaveronlabs/treyder-bot/main/ijro.py"
HOLAT_FAYL = PAPKA / "ijro_holat.json"


def log(*a):
    print(time.strftime("%Y-%m-%d %H:%M:%S"), *a, flush=True)


# ---------- Binance ----------

class BinanceXato(Exception):
    def __init__(self, kod, xabar):
        super().__init__(f"{kod}: {xabar}")
        self.kod = kod


class Binance:
    def __init__(self, baza, kalit, sir):
        self.baza, self.kalit, self.sir, self.farq = baza, kalit, sir, 0
        self.farq = self.sorov("GET", "/fapi/v1/time")["serverTime"] - int(time.time() * 1000)

    def sorov(self, usul, yol, imzo=False, **p):
        p = {k: ("true" if v is True else "false" if v is False else v) for k, v in p.items() if v is not None}
        if imzo:
            p.update(timestamp=int(time.time() * 1000) + self.farq, recvWindow=10000)
        q = urllib.parse.urlencode(p)
        if imzo:
            q += "&signature=" + hmac.new(self.sir.encode(), q.encode(), hashlib.sha256).hexdigest()
        sorov = urllib.request.Request(self.baza + yol + ("?" + q if q else ""), method=usul,
                                       headers={"X-MBX-APIKEY": self.kalit, "User-Agent": "treyder-ai"})
        try:
            with urllib.request.urlopen(sorov, timeout=20) as javob:
                return json.load(javob)
        except urllib.error.HTTPError as e:
            matn = e.read().decode(errors="replace")
            try:
                d = json.loads(matn)
                raise BinanceXato(d.get("code"), d.get("msg")) from None
            except ValueError:
                raise BinanceXato(e.code, matn[:200]) from None

    def qoidalar(self):
        """{belgi: (narx qadami, miqdor qadami, eng kichik miqdor, eng kichik order hajmi USDT)}"""
        q = {}
        for s in self.sorov("GET", "/fapi/v1/exchangeInfo")["symbols"]:
            f = {x["filterType"]: x for x in s["filters"]}
            q[s["symbol"]] = (f["PRICE_FILTER"]["tickSize"], f["LOT_SIZE"]["stepSize"], f["LOT_SIZE"]["minQty"],
                              float(f.get("MIN_NOTIONAL", {}).get("notional", 5)))
        return q

    def hisob(self):
        """(jami pul = hamyon + ochiq foyda/zarar, {belgi: (miqdor, kirish narxi, leverage)})"""
        a = self.sorov("GET", "/fapi/v2/account", True)
        poz = {p["symbol"]: (float(p["positionAmt"]), float(p["entryPrice"]), int(p["leverage"]))
               for p in a["positions"]}
        return float(a["totalMarginBalance"]), poz

    def kitob(self, belgi):
        d = self.sorov("GET", "/fapi/v1/ticker/bookTicker", symbol=belgi)
        return float(d["bidPrice"]), float(d["askPrice"])

    def order(self, **p):
        return self.sorov("POST", "/fapi/v1/order", True, **p)

    def order_holati(self, belgi, oid):
        return self.sorov("GET", "/fapi/v1/order", True, symbol=belgi, orderId=oid)

    def bekor(self, belgi, oid):
        try:
            return self.sorov("DELETE", "/fapi/v1/order", True, symbol=belgi, orderId=oid)
        except BinanceXato as e:
            if e.kod != -2011:  # allaqachon bajarilgan yoki bekor qilingan
                raise
            return self.order_holati(belgi, oid)

    def stoplarni_bekor(self, belgi):
        for yol in ("/fapi/v1/algoOpenOrders", "/fapi/v1/allOpenOrders"):
            try:
                self.sorov("DELETE", yol, True, symbol=belgi)
            except BinanceXato as e:
                log("stop bekor:", belgi, yol, e)

    def stop(self, belgi, yon, narx):
        """Butun pozitsiyani yopadigan STOP_MARKET (birjaning o'zida turadi). Yangi algo API, bo'lmasa eski."""
        p = dict(symbol=belgi, side="SELL" if yon > 0 else "BUY", type="STOP_MARKET", closePosition=True,
                 workingType="MARK_PRICE")
        try:
            return self.sorov("POST", "/fapi/v1/algoOrder", True, algoType="CONDITIONAL", triggerPrice=narx, **p)
        except BinanceXato as e:
            log("algo stop ishlamadi, eski usul:", e)
            return self.order(stopPrice=narx, **p)


class QuruqBirja:
    """Kalitsiz sinov: narxlar va qoidalar haqiqiy Binance'dan, hisob va savdolar shu kompyuterda yoziladi.
    Limit order darhol shu narxda bajarilgan deb olinadi (0.02%), bozor order 0.05%; funding hisobga olinmaydi."""

    FAYL = PAPKA / "ijro_quruq.json"

    def __init__(self, baza, pul=1000.0):
        self.real = Binance(baza, "", "")
        self.d = json.loads(self.FAYL.read_text(encoding="utf-8")) if self.FAYL.exists() else \
            {"naqd": pul, "poz": {}, "lev": {}, "stop": {}, "savdolar": []}
        self.oid = 0

    def saqla(self):
        self.FAYL.write_text(json.dumps(self.d, ensure_ascii=False, indent=1), encoding="utf-8")

    def qoidalar(self):
        return self.real.qoidalar()

    def kitob(self, belgi):
        return self.real.kitob(belgi)

    def _toldir(self, belgi, tomon, miqdor, narx, kom):
        q = float(miqdor) * (1 if tomon == "BUY" else -1)
        eski, e = self.d["poz"].get(belgi, (0.0, 0.0))
        yangi = round(eski + q, 9)
        if eski and (eski > 0) != (q > 0):  # kamaytirish yoki yopish: foyda/zarar naqdga o'tadi
            yopildi = min(abs(q), abs(eski)) * (1 if eski > 0 else -1)
            self.d["naqd"] += yopildi * (narx - e)
            if abs(q) > abs(eski):
                e = narx
        else:
            e = (eski * e + q * narx) / yangi
        self.d["naqd"] -= abs(q) * narx * kom
        if yangi:
            self.d["poz"][belgi] = (yangi, e)
        else:
            self.d["poz"].pop(belgi, None)
        self.d["savdolar"].append([time.strftime("%Y-%m-%d %H:%M"), belgi, tomon, abs(q), narx])
        self.saqla()

    def hisob(self):
        pul, poz = self.d["naqd"], {}
        for belgi, (q, e) in list(self.d["poz"].items()):
            bid, ask = self.kitob(belgi)
            narx = (bid + ask) / 2
            st = self.d["stop"].get(belgi)
            if st and ((q > 0 and narx <= st) or (q < 0 and narx >= st)):  # birja stopi ishladi
                self._toldir(belgi, "SELL" if q > 0 else "BUY", abs(q), narx, 0.0005)
                self.d["stop"].pop(belgi)
                continue
            pul += q * (narx - e)
            poz[belgi] = (q, e, self.d["lev"].get(belgi, 2))
        return pul, poz

    def order(self, symbol, side, type, quantity, price=None, **_):
        bid, ask = self.kitob(symbol)
        narx, kom = (float(price), 0.0002) if type == "LIMIT" else ((ask if side == "BUY" else bid), 0.0005)
        self._toldir(symbol, side, quantity, narx, kom)
        self.oid += 1
        return {"orderId": self.oid, "status": "FILLED", "executedQty": quantity, "avgPrice": str(narx)}

    def stoplarni_bekor(self, belgi):
        self.d["stop"].pop(belgi, None)
        self.saqla()

    def stop(self, belgi, yon, narx):
        self.d["stop"][belgi] = float(narx)
        self.saqla()

    def sorov(self, usul, yol, imzo=False, **p):
        if yol == "/fapi/v1/leverage":
            self.d["lev"][p["symbol"]] = p["leverage"]
            self.saqla()
        return [] if yol == "/fapi/v1/income" else {}


def yaxlit(x, qadam, usul=ROUND_DOWN):
    q = Decimal(qadam).normalize()
    return format((Decimal(str(abs(x))) / q).to_integral_value(usul) * q, "f")


# ---------- Telegram va bulut holati ----------

class Xabarchi:
    def __init__(self, token, belgi=""):
        self.token, self.belgi, self.chat_id, self.oxirgi = token, belgi, None, {}

    def yubor(self, matn, kalit=None, oraliq=3600):
        """kalit berilsa, bir xil ogohlantirish `oraliq` soniyada bir martadan ko'p yuborilmaydi."""
        log("TG:", matn.replace("\n", " | "))
        if kalit and time.time() - self.oxirgi.get(kalit, 0) < oraliq:
            return
        self.oxirgi[kalit] = time.time()
        if not (self.token and self.chat_id):
            return
        try:
            urllib.request.urlopen(urllib.request.Request(
                f"https://api.telegram.org/bot{self.token}/sendMessage",
                json.dumps({"chat_id": self.chat_id, "text": "💵 " + self.belgi + matn}).encode(),
                {"Content-Type": "application/json"}), timeout=20).read()
        except Exception as e:
            log("telegram xato:", e)


def bulut_holati():
    """holat.json: avval GitHub API, u xato bersa raw.githubusercontent (keshsiz)."""
    xato = None
    for url, sarlavha in ((HOLAT_URL, {"Accept": "application/vnd.github.raw+json"}),
                          (f"{HOLAT_RAW}?t={int(time.time())}", {})):
        try:
            sorov = urllib.request.Request(url, headers={"User-Agent": "treyder-ai", **sarlavha})
            with urllib.request.urlopen(sorov, timeout=30) as javob:
                return json.load(javob)
        except Exception as e:
            xato = e
    raise xato


def maqsadlar(h, komb):
    """Har tanga uchun pulning qancha qismi marja bo'lishi: + long, - short, 0 naqd."""
    f = {}
    for b in BELGILAR:
        s = 0.0
        for y, w in komb.items():
            p = h["portfellar"][y]["portfel"].get(b)
            if p is not None:
                s += w * p.get("yon", 1) * YOL_ULUSHI
        f[b] = round(s, 6)
    return f


def sana_soniya(sana):
    return calendar.timegm(time.strptime(sana, "%Y-%m-%d %H:%M"))


# ---------- Ijrochi ----------

class Ijrochi:
    def __init__(self, birja, xabarchi, sozlama, holat):
        self.b, self.x, self.s, self.st = birja, xabarchi, sozlama, holat
        self.q = birja.qoidalar()
        try:  # birja chegaralari faylga yoziladi (kichik pul rejimini tekshirish uchun)
            (PAPKA / "ijro_qoidalar.json").write_text(json.dumps(
                {b + "USDT": self.q.get(b + "USDT") for b in BELGILAR}, indent=1), encoding="utf-8")
        except OSError:
            pass
        self.h, self.h_vaqt = None, 0

    def lev(self):
        return ZINAPOYA[self.st["daraja"]]

    def saqla(self):
        HOLAT_FAYL.write_text(json.dumps(self.st, ensure_ascii=False, indent=1), encoding="utf-8")

    # --- birja ustida amallar ---

    def sozla(self, belgi):
        """Izolyatsiya marja va joriy leverage (bir marta, pog'ona o'zgarganda qayta)."""
        if self.st["sozlangan"].get(belgi) == self.lev():
            return
        try:
            self.b.sorov("POST", "/fapi/v1/marginType", True, symbol=belgi, marginType="ISOLATED")
        except BinanceXato as e:
            if e.kod != -4046:  # allaqachon izolyatsiya
                raise
        self.b.sorov("POST", "/fapi/v1/leverage", True, symbol=belgi, leverage=self.lev())
        self.st["sozlangan"][belgi] = self.lev()

    def bajar(self, belgi, yon, miqdor, kamaytir):
        """Limit (maker) order bilan `miqdor` ni sotib olish (yon>0) yoki sotish; bo'lmasa bozor narxida.
        Bajarilgan miqdor va o'rtacha narxni qaytaradi."""
        tick, qadam, eng_kam, _ = self.q[belgi]
        tomon, qoldi, bajarildi, summa = ("BUY" if yon > 0 else "SELL"), miqdor, 0.0, 0.0
        for _ in range(LIMIT_URINISH):
            if float(yaxlit(qoldi, qadam)) < float(eng_kam):
                break
            bid, ask = self.b.kitob(belgi)
            narx = yaxlit(bid if yon > 0 else ask, tick)
            try:
                o = self.b.order(symbol=belgi, side=tomon, type="LIMIT", timeInForce="GTX", price=narx,
                                 quantity=yaxlit(qoldi, qadam), reduceOnly=kamaytir or None)
            except BinanceXato as e:
                if e.kod == -5022:  # maker bo'lolmadi (narx o'zgardi): qayta urinish
                    time.sleep(2)
                    continue
                raise
            tugash = time.time() + LIMIT_KUTISH
            while o["status"] in ("NEW", "PARTIALLY_FILLED") and time.time() < tugash:
                time.sleep(5)
                o = self.b.order_holati(belgi, o["orderId"])
            if o["status"] in ("NEW", "PARTIALLY_FILLED"):
                o = self.b.bekor(belgi, o["orderId"])
            n = float(o.get("executedQty", 0))
            if n:
                bajarildi += n
                summa += n * float(o.get("avgPrice") or narx)
                qoldi -= n
        if self.s.get("bozor_zaxira") and float(yaxlit(qoldi, qadam)) >= float(eng_kam):
            o = self.b.order(symbol=belgi, side=tomon, type="MARKET", quantity=yaxlit(qoldi, qadam),
                             reduceOnly=kamaytir or None, newOrderRespType="RESULT")
            n = float(o.get("executedQty", 0))
            bajarildi += n
            summa += n * float(o.get("avgPrice") or 0)
        return bajarildi, (summa / bajarildi if bajarildi else 0.0)

    def stop_yangila(self, belgi):
        self.b.stoplarni_bekor(belgi)
        miqdor, kirish, lev = self.b.hisob()[1].get(belgi, (0, 0, 1))
        self.st["ochiq"][belgi[:-4]] = bool(miqdor)
        if not miqdor:
            return
        yon = 1 if miqdor > 0 else -1
        narx = yaxlit(kirish * (1 - yon * STOP_ULUSH / lev), self.q[belgi][0], ROUND_HALF_UP)
        self.b.stop(belgi, yon, narx)
        log("stop", belgi, narx)

    def joyla(self, b, ulush, pul, poz, sabab):
        """Tanga pozitsiyasini `ulush` (pulning marja qismi, ishorasi yo'nalish) ga keltiradi."""
        belgi = b + "USDT"
        tick, qadam, eng_kam, eng_kam_usdt = self.q[belgi]
        hozir = poz.get(belgi, (0.0, 0.0, 0))[0]
        bid, ask = self.b.kitob(belgi)
        narx = (bid + ask) / 2
        kerak = ulush * pul * PUL_ULUSHI * self.lev() / narx
        kerak = float(yaxlit(kerak, qadam, ROUND_HALF_UP)) * (1 if kerak > 0 else -1)
        if kerak and eng_kam_usdt * YAXLITLASH <= abs(kerak) * narx < eng_kam_usdt:
            # kichik pul rejimi: kerakli hajm birja eng kamining yarmidan katta bo'lsa, eng kamigacha oshiriladi
            # (tarixda 100-300$ hisoblarda o'tkazib yuborishdan yaxshiroq natija berdi), marjasi juda katta bo'lmasa
            eng_kam_miqdor = float(yaxlit(eng_kam_usdt * 1.02 / narx, qadam, ROUND_UP))
            if eng_kam_miqdor * narx / self.lev() <= pul * YAXLITLASH_CHEGARA:
                kerak = eng_kam_miqdor * (1 if kerak > 0 else -1)
        if kerak and abs(kerak) * narx < eng_kam_usdt:
            self.x.yubor(f"{b}: kerakli pozitsiya {abs(kerak) * narx:.0f} USDT, birja eng kami {eng_kam_usdt:.0f} USDT. "
                         f"Pul kam bo'lgani uchun bu tanga o'tkazib yuborildi.", f"kam_{b}", 86400)
            kerak = 0.0
        if hozir and (not kerak or (kerak > 0) != (hozir > 0)):  # yopish yoki yo'nalish almashishi
            n, o_narx = self.bajar(belgi, -1 if hozir > 0 else 1, abs(hozir), True)
            self.x.yubor(f"🔴 {b}: {'long' if hozir > 0 else 'short'} yopildi, {n:g} ta, narx {o_narx:g}\nSabab: {sabab}")
            hozir = 0.0
        farq = kerak - hozir
        if kerak and abs(farq) * narx >= max(eng_kam_usdt, 0.1 * abs(kerak) * narx):  # mayda farqlar uchun savdo yo'q
            kamaytir = abs(kerak) < abs(hozir)
            if not kamaytir:
                self.sozla(belgi)
            n, o_narx = self.bajar(belgi, 1 if farq > 0 else -1, abs(farq), kamaytir)
            if kamaytir:
                self.sozla(belgi)  # leverage pasaytirish pozitsiya kichraygandan keyin
            nom = "long" if kerak > 0 else "short"
            amal = "kamaytirildi" if kamaytir else "ochildi" if not hozir else "ko'paytirildi"
            self.x.yubor(f"🟢 {b}: {nom} {amal}, {n:g} ta (≈{n * o_narx:.0f} USDT, x{self.lev()}), narx {o_narx:g}\n"
                         f"Sabab: {sabab}")
        self.stop_yangila(belgi)

    def hammasini_yop(self, sabab):
        _, poz = self.b.hisob()
        for b in BELGILAR:
            miqdor = poz.get(b + "USDT", (0,))[0]
            if miqdor:
                self.joyla(b, 0.0, 1.0, poz, sabab)
        self.st["maqsad"] = {b: 0.0 for b in BELGILAR}

    # --- asosiy qadam ---

    def pul_kuzat(self, pul, hozir):
        """O'tkazmalar, kun boshi, leverage zinapoyasi va kunlik zarar. Bo'sh bo'lmagan qaytgan matn =
        hamma pozitsiyalar shu sabab bilan qayta hisoblansin."""
        st, qayta = self.st, ""
        for t in self.b.sorov("GET", "/fapi/v1/income", True, incomeType="TRANSFER",
                              startTime=st["oxirgi_otkazma"] + 1, limit=1000):
            if t["asset"] == "USDT":
                x = float(t["income"])  # pul qo'shish yoki yechish natija hisoblanmaydi
                st["choqqi"] += x
                st["daraja_boshi_pul"] += x
                st["kun_boshi_pul"] += x
                self.x.yubor(f"Hisobga {x:+.2f} USDT o'tkazildi, endi {pul:.2f} USDT.")
                qayta = "hisobdagi pul o'zgardi"
            st["oxirgi_otkazma"] = max(st["oxirgi_otkazma"], int(t["time"]))
        kun = time.strftime("%Y-%m-%d", time.gmtime(hozir))
        if st["kun"] != kun:
            if st["kun"]:
                o = pul / st["kun_boshi_pul"] - 1 if st["kun_boshi_pul"] else 0
                self.x.yubor(f"📅 Kunlik: {pul:.2f} USDT (bugun {o:+.1%}), leverage x{self.lev()}, "
                             "maqsad: " + (", ".join(f"{b} {v:+.0%}" for b, v in st["maqsad"].items() if v) or "naqd"))
            st.update(kun=kun, kun_boshi_pul=pul)
            if st["toxtagan"] == "kunlik":
                st["toxtagan"] = None
                self.x.yubor("Yangi kun: savdo qayta yoqildi.")
                qayta = "savdo qayta yoqildi"
        st["choqqi"] = max(st["choqqi"], pul)
        d = st["daraja"]
        if pul < st["choqqi"] * (1 - TUSHISH):
            if d > 0:
                d -= 1
                sabab = f"cho'qqidan {pul / st['choqqi'] - 1:+.0%} tushdi"
            else:
                self.x.yubor(f"⚠️ x2 da ham cho'qqidan {pul / st['choqqi'] - 1:+.0%}. Ko'rib chiqish kerak.",
                             "x2_tushish", 86400)
        elif d < len(ZINA_KUN) and hozir - st["daraja_boshi"] >= ZINA_KUN[d] * 86400 and pul > st["daraja_boshi_pul"]:
            d += 1
            sabab = f"{ZINA_KUN[d - 1]} kunda {pul / st['daraja_boshi_pul'] - 1:+.1%}"
        if d != st["daraja"]:
            eski = self.lev()
            st.update(daraja=d, daraja_boshi=hozir, daraja_boshi_pul=pul, choqqi=pul)
            self.x.yubor(f"🪜 Leverage x{eski} → x{self.lev()} ({sabab}).")
            qayta = f"x{self.lev()} ga moslash"
        if not st["toxtagan"] and pul < st["kun_boshi_pul"] * (1 - KUNLIK_ZARAR):
            self.hammasini_yop(f"kunlik zarar chegarasi ({KUNLIK_ZARAR:.0%})")
            st["toxtagan"] = "kunlik"
            self.x.yubor(f"⛔ Bugun {pul / st['kun_boshi_pul'] - 1:+.1%}: hammasi yopildi, ertaga qayta boshlanadi.")
        return qayta

    def qadam(self):
        hozir = time.time()
        if hozir - self.h_vaqt > 120:
            try:
                self.h, self.h_vaqt = bulut_holati(), hozir
                self.x.chat_id = self.h.get("chat_id")
            except Exception as e:
                if self.h is None:
                    raise
                log("bulut holati olinmadi, oldingisi ishlatiladi:", repr(e))  # uzoq davom etsa ESKIRISH ushlaydi
        h, st = self.h, self.st
        pul, poz = self.b.hisob()
        if st["choqqi"] is None:  # birinchi ishga tushish
            st.update(choqqi=pul, daraja_boshi=hozir, daraja_boshi_pul=pul, kun_boshi_pul=pul,
                      kun=time.strftime("%Y-%m-%d", time.gmtime(hozir)), oxirgi_otkazma=int(hozir * 1000))
            self.x.yubor(f"Ijrochi ishga tushdi: {pul:.2f} USDT, leverage x{self.lev()}, "
                         f"yo'llar: " + ", ".join(f"{y} {w:.0%}" for y, w in self.s["kombinatsiya"].items()))
        qayta = self.pul_kuzat(pul, hozir)
        if h.get("ijro_toxtat"):
            if st["toxtagan"] != "buyruq":
                self.hammasini_yop("/toxtat buyrug'i")
                st["toxtagan"] = "buyruq"
                self.x.yubor("⏸ To'xtatildi: hammasi yopildi. Qayta yoqish: /davom")
            return
        if st["toxtagan"] == "buyruq":
            st["toxtagan"] = None
            qayta = "savdo qayta yoqildi"
            self.x.yubor("▶️ Savdo qayta yoqildi.")
        if st["toxtagan"]:
            return
        eski = hozir - sana_soniya(h["oxirgi_sana"]) > ESKIRISH
        if eski:
            self.x.yubor(f"⚠️ Bulutdagi bot yangi shamni qayta ishlamayapti (oxirgisi {h['oxirgi_sana']} UTC). "
                         f"Yangi pozitsiya ochilmaydi, borlari stop bilan himoyada.", "eski")
        maqsad = maqsadlar(h, self.s["kombinatsiya"])
        for b in BELGILAR:  # birja stopi ishlagan bo'lsa, signal o'zgarmaguncha qayta kirilmaydi
            belgi = b + "USDT"
            if st["ochiq"].get(b) and not poz.get(belgi, (0,))[0] and b not in st["stop_blok"]:
                st["stop_blok"][b] = st["maqsad"][b]
                self.x.yubor(f"🛑 {b}: himoya stopi ishladi, pozitsiya yopildi. Signal o'zgarmaguncha kirilmaydi.")
            if b in st["stop_blok"] and st["stop_blok"][b] != maqsad[b]:
                del st["stop_blok"][b]
        sana_yangi = st["sana"] != h["oxirgi_sana"]
        tartib = sorted(BELGILAR, key=lambda b: abs(maqsad[b]) > abs(st["maqsad"].get(b, 0)))  # avval kamaytirish
        for b in tartib:
            m = 0.0 if b in st["stop_blok"] else maqsad[b]
            if m == st["maqsad"].get(b) and not qayta:
                continue
            if eski and abs(m) > abs(st["maqsad"].get(b, 0)):
                continue  # bulut ishlamayotganda pozitsiya kattalashtirilmaydi
            yollar = [y for y in self.s["kombinatsiya"] if b in h["portfellar"][y]["portfel"]]
            sabab = ("signal: " + ", ".join(yollar)) if yollar else "signal tugadi"
            if b in st["stop_blok"]:
                sabab = "stop ishlagan"
            self.joyla(b, m, pul, poz, sabab if sana_yangi or not qayta else qayta)
            st["maqsad"][b] = m
            self.saqla()
        st["sana"] = h["oxirgi_sana"]


def yangi_holat():
    return {"daraja": 0, "daraja_boshi": None, "daraja_boshi_pul": None, "choqqi": None, "kun": None,
            "kun_boshi_pul": None, "oxirgi_otkazma": 0, "maqsad": {}, "ochiq": {}, "stop_blok": {}, "sozlangan": {},
            "toxtagan": None, "sana": None}


def sozlamani_oqi():
    s = dict(SOZLAMA)
    s.update(json.loads((PAPKA / "ijro_sozlama.json").read_text(encoding="utf-8")))
    if abs(sum(s["kombinatsiya"].values()) - 1) > 1e-6:
        sys.exit("kombinatsiya ulushlari yig'indisi 1 bo'lishi kerak")
    return s, s.get("telegram_token") or os.environ.get("TELEGRAM_TOKEN") or eski_token()


def eski_token():
    """Noutbukdagi eski bot telegram.json idagi tokenni (qaysi kalit ostida bo'lmasin) topadi."""
    f = PAPKA / "telegram.json"
    t = re.search(r"\d{6,}:[\w-]{30,}", f.read_text(encoding="utf-8")) if f.exists() else None
    return t.group(0) if t else None


XATO_MASLAHAT = {
    -1109: "Futures hisobi ochilmagan yoki kalit futures hisobi ochilishidan oldin yaratilgan: yangi kalit yarat.",
    -2015: "Kalit noto'g'ri, boshqa hisobniki (demo/real aralashgan) yoki Futures ruxsati yo'q.",
    -2014: "API Key noto'g'ri nusxalangan (to'liq emas yoki ortiqcha belgi bor).",
    -1022: "Secret Key noto'g'ri nusxalangan (to'liq emas yoki boshqa kalitniki).",
}


def kalit_tozala(matn):
    return matn.strip().strip('"').strip("'").replace(" ", "")


def kalit_kirit(s):
    """API kalitlarini so'raydi va Binance ulanishi ishlamaguncha qayta so'raydi. (birja, futures puli) qaytaradi."""
    print("Kalitni joylash: sichqonchaning O'NG tugmasini bos (Ctrl+V emas), keyin Enter.\n")
    while True:
        s["api_key"] = kalit_tozala(input("API Key: "))
        s["api_secret"] = kalit_tozala(input("Secret Key: "))
        print(f"  API Key {len(s['api_key'])} belgi ({s['api_key'][:4]}...), Secret {len(s['api_secret'])} belgi"
              f" (odatda ikkalasi 64 belgi)")
        try:
            birja = Binance(s.get("baza") or BAZA[s["sinov"]], s["api_key"], s["api_secret"])
            return birja, birja.hisob()[0]
        except BinanceXato as e:
            print(f"\n❌ Binance rad etdi: {e}\n   {XATO_MASLAHAT.get(e.kod, '')}\n   Qaytadan kirit.\n")
        except Exception as e:
            print(f"\n❌ Ulanib bo'lmadi: {e}\n   Internetni tekshirib, qaytadan kirit.\n")


TEKSHIR_BELGI, TEKSHIR_HAJM = "XRPUSDT", 6.0  # tekshiruv savdosi: ~6 USDT pozitsiya (birja eng kami 5), marjasi ~3 USDT


def tekshir():
    """Real pul bilan bitta eng kichik savdo: ochadi, birjaga himoya stopi qo'yadi, yopadi va natijani aytadi.
    Kalitlar, ruxsatlar va order yo'li ishlashini tekshiradi. Asosiy ijrochi rejimini o'zgartirmaydi."""
    f = PAPKA / "ijro_sozlama.json"
    s = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
    s = {**SOZLAMA, **s}
    x = Xabarchi(s.get("telegram_token") or os.environ.get("TELEGRAM_TOKEN") or eski_token(), "")
    try:
        x.chat_id = bulut_holati().get("chat_id")
    except Exception as e:
        log("bulut holati o'qilmadi:", repr(e))
    if s.get("api_key") and s.get("sinov") is False:
        birja, pul = Binance(BAZA[False], s["api_key"], s["api_secret"]), None
    else:
        print("Haqiqiy Binance hisobi kaliti kerak (Futures ruxsati yoqilgan, pul yechish O'CHIQ).\n")
        s["sinov"] = False
        birja, pul = kalit_kirit(s)
        f.write_text(json.dumps(s, ensure_ascii=False, indent=1), encoding="utf-8")  # quruq rejim o'z holicha qoladi
    rejim = birja.sorov("GET", "/fapi/v1/positionSide/dual", True)
    if rejim.get("dualSidePosition"):
        birja.sorov("POST", "/fapi/v1/positionSide/dual", True, dualSidePosition=False)
    boshi = birja.hisob()[0]
    print(f"Futures hisobida {boshi:.2f} USDT.")
    if boshi < TEKSHIR_HAJM / 2 + 1:
        print(f"❌ Tekshiruv uchun kamida {TEKSHIR_HAJM / 2 + 1:.0f} USDT kerak (Spot'dan Futures'ga o'tkaz).")
        return
    ij = Ijrochi(birja, x, s, yangi_holat())
    belgi = TEKSHIR_BELGI
    tick, qadam, eng_kam, eng_kam_usdt = ij.q[belgi]
    try:
        ij.sozla(belgi)
        bid, ask = birja.kitob(belgi)
        miqdor = float(yaxlit(max(TEKSHIR_HAJM, eng_kam_usdt * 1.1) / ask, qadam, ROUND_HALF_UP))
        print(f"1/3 {belgi}: {miqdor:g} ta sotib olinyapti (limit order, bir necha daqiqagacha kutishi mumkin)...")
        n, narx = ij.bajar(belgi, 1, miqdor, False)
        print(f"   ✅ sotib olindi: {n:g} ta, narx {narx:g}")
        print("2/3 Birjaga himoya stopi qo'yilyapti...")
        ij.stop_yangila(belgi)
        print("   ✅ stop qo'yildi")
    finally:
        q = birja.hisob()[1].get(belgi, (0, 0, 0))[0]
        if q:
            print("3/3 Pozitsiya yopilyapti...")
            n2, narx2 = ij.bajar(belgi, -1 if q > 0 else 1, abs(q), True)
            print(f"   ✅ sotildi: {n2:g} ta, narx {narx2:g}")
        birja.stoplarni_bekor(belgi)
    oxiri = birja.hisob()[0]
    matn = (f"Real pul tekshiruvi o'tdi: {belgi} da kichik savdo ochildi, stop qo'yildi va yopildi. "
            f"Xarajat {boshi - oxiri:.3f} USDT. Hisobda {oxiri:.2f} USDT.")
    print("\n" + matn)
    x.yubor(matn)


def sozla():
    """Kalitlarni so'rab ijro_sozlama.json yaratadi (kalitlar faqat shu kompyuterda qoladi).
    Binance ulanishi ishlamaguncha qayta so'raydi."""
    f = PAPKA / "ijro_sozlama.json"
    s = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
    if input("Kalitsiz sinovmi (Binance kaliti kerak emas, savdo kompyuterda yoziladi)? [Enter = ha, kalit "
             "bilan bo'lsa: yo'q]: ").strip().lower() not in ("yo'q", "yoq", "n", "no"):
        s.update(quruq=True, sinov=True)
        if not eski_token() and not s.get("telegram_token"):
            s["telegram_token"] = getpass.getpass("Telegram bot tokeni (ko'rinmaydi): ").strip()
        f.write_text(json.dumps(s, ensure_ascii=False, indent=1), encoding="utf-8")
        print("\n✅ Kalitsiz sinov rejimi saqlandi: 1000 USDT soxta pul, narxlar haqiqiy Binance'dan.\n")
        return
    s["quruq"] = False
    s["sinov"] = input("Sinov (demo) hisobimi? [Enter = ha, real bo'lsa: yo'q]: ").strip().lower() not in (
        "yo'q", "yoq", "n", "no")
    birja, pul = kalit_kirit(s)
    if not eski_token() and not s.get("telegram_token"):
        s["telegram_token"] = getpass.getpass("Telegram bot tokeni (ko'rinmaydi): ").strip()
    f.write_text(json.dumps(s, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n✅ Binance ulanishi ishladi, futures hisobida {pul:.2f} USDT. Saqlandi.\n")


def yangi_versiya_bor():
    try:
        with urllib.request.urlopen(urllib.request.Request(f"{KOD_URL}?t={int(time.time())}",
                                                           headers={"User-Agent": "treyder-ai"}), timeout=30) as j:
            yangi = j.read()
        return yangi.strip() != Path(__file__).read_bytes().replace(b"\r\n", b"\n").strip() and b"def main" in yangi
    except Exception as e:
        log("versiya tekshirilmadi:", repr(e))
        return False


def main():
    if sys.argv[1:] == ["sozla"]:
        return sozla()
    if sys.argv[1:] == ["tekshir"]:
        return tekshir()
    global HOLAT_FAYL
    s, token = sozlamani_oqi()
    if s.get("quruq"):
        HOLAT_FAYL = PAPKA / "ijro_quruq_holat.json"  # real pulga o'tganda zinapoya noldan boshlanadi
    x = Xabarchi(token, "[KALITSIZ SINOV] " if s.get("quruq") else "[DEMO] " if s["sinov"] else "")
    st = json.loads(HOLAT_FAYL.read_text(encoding="utf-8")) if HOLAT_FAYL.exists() else yangi_holat()
    if s.get("quruq"):
        birja = QuruqBirja(BAZA[False])
    else:
        try:
            birja = Binance(s.get("baza") or BAZA[s["sinov"]], s["api_key"], s["api_secret"])
            rejim = birja.sorov("GET", "/fapi/v1/positionSide/dual", True)
            if rejim.get("dualSidePosition"):
                birja.sorov("POST", "/fapi/v1/positionSide/dual", True, dualSidePosition=False)  # bir tomonlama rejim
        except BinanceXato as e:
            print(f"\nBinance rad etdi: {e}\n{XATO_MASLAHAT.get(e.kod, '')}\nKalitni qayta kiritamiz.\n")
            return sozla()
    ij = Ijrochi(birja, x, s, st)
    ketma_ket, kod_vaqt = 0, time.time()
    while True:
        if time.time() - kod_vaqt > 1800:  # yangi versiya chiqqan bo'lsa chiqadi, ijro.bat uni yuklab qayta ishga tushiradi
            kod_vaqt = time.time()
            if yangi_versiya_bor():
                x.yubor("🔄 Ijrochining yangi versiyasi topildi, qayta ishga tushyapti.")
                return
        try:
            ij.qadam()
            ij.saqla()
            ketma_ket = 0
        except Exception as e:
            ketma_ket += 1
            log("XATO:", repr(e))
            if ketma_ket >= XATO_CHIDASH:
                x.yubor(f"⚠️ Ijrochi {ketma_ket} daqiqadan beri ishlay olmayapti: {e}", "xato:" + type(e).__name__)
        time.sleep(60)


if __name__ == "__main__":
    main()
