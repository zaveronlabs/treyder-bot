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
from decimal import ROUND_DOWN, ROUND_HALF_UP, Decimal
from pathlib import Path

BELGILAR = ["BTC", "ETH", "SOL", "BNB", "XRP"]  # bulut.py SIGNAL_BELGILAR bilan bir xil
YOL_ULUSHI = 200 / 1000  # qog'oz yo'l har tangaga pulining 20% ini marja qiladi (ULUSH / BOSHLANG_ICH_PUL)
HOLAT_URL = "https://api.github.com/repos/zaveronlabs/treyder-bot/contents/holat.json"
BAZA = {True: "https://demo-fapi.binance.com", False: "https://fapi.binance.com"}
ZINAPOYA = [2, 3, 4, 5]  # leverage pog'onalari
ZINA_KUN = [30, 14, 14]  # keyingi pog'onaga o'tishdan oldin shu pog'onada necha kun foydada turish kerak
TUSHISH = 0.20  # pog'ona ichidagi cho'qqidan shuncha tushsa bir pog'ona pastga
KUNLIK_ZARAR = 0.10  # kun boshidagi puldan shuncha yo'qotilsa hammasi yopiladi, ertasigacha savdo yo'q
STOP_ULUSH = 0.6  # pozitsiya marjasining 60% i yo'qolsa birja stopi yopadi (likvidatsiyadan oldin)
PUL_ULUSHI = 0.97  # komissiya va narx siljishi uchun pulning 3% i chetda turadi
ESKIRISH = 8.5 * 3600  # bulutdagi bot shuncha vaqt yangi shamni qayta ishlamasa xabar beriladi
LIMIT_URINISH, LIMIT_KUTISH = 5, 60  # limit orderni 5 marta, har birini 60 soniya kutib qayta narxlaydi

PAPKA = Path(__file__).parent
SOZLAMA = {"sinov": True, "kombinatsiya": {"qoida": 0.5, "short": 0.5}, "bozor_zaxira": True}
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


def yaxlit(x, qadam, usul=ROUND_DOWN):
    q = Decimal(qadam).normalize()
    return format((Decimal(str(abs(x))) / q).to_integral_value(usul) * q, "f")


# ---------- Telegram va bulut holati ----------

class Xabarchi:
    def __init__(self, token, sinov):
        self.token, self.belgi, self.chat_id, self.oxirgi = token, "[SINOV] " if sinov else "", None, {}

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
    sorov = urllib.request.Request(HOLAT_URL, headers={"Accept": "application/vnd.github.raw+json",
                                                       "User-Agent": "treyder-ai"})
    with urllib.request.urlopen(sorov, timeout=30) as javob:
        return json.load(javob)


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
            self.h, self.h_vaqt = bulut_holati(), hozir
            self.x.chat_id = self.h.get("chat_id")
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


def sozla():
    """Kalitlarni so'rab ijro_sozlama.json yaratadi (kalitlar faqat shu kompyuterda qoladi).
    Binance ulanishi ishlamaguncha qayta so'raydi."""
    f = PAPKA / "ijro_sozlama.json"
    s = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
    print("Kalitni joylash: sichqonchaning O'NG tugmasini bos (Ctrl+V emas), keyin Enter.\n")
    s["sinov"] = input("Sinov (demo) hisobimi? [Enter = ha, real bo'lsa: yo'q]: ").strip().lower() not in (
        "yo'q", "yoq", "n", "no")
    while True:
        s["api_key"] = kalit_tozala(input("API Key: "))
        s["api_secret"] = kalit_tozala(input("Secret Key: "))
        print(f"  API Key {len(s['api_key'])} belgi ({s['api_key'][:4]}...), Secret {len(s['api_secret'])} belgi"
              f" (odatda ikkalasi 64 belgi)")
        try:
            birja = Binance(s.get("baza") or BAZA[s["sinov"]], s["api_key"], s["api_secret"])
            pul = birja.hisob()[0]
            break
        except BinanceXato as e:
            print(f"\n❌ Binance rad etdi: {e}\n   {XATO_MASLAHAT.get(e.kod, '')}\n   Qaytadan kirit.\n")
        except Exception as e:
            print(f"\n❌ Ulanib bo'lmadi: {e}\n   Internetni tekshirib, qaytadan kirit.\n")
    if not eski_token() and not s.get("telegram_token"):
        s["telegram_token"] = getpass.getpass("Telegram bot tokeni (ko'rinmaydi): ").strip()
    f.write_text(json.dumps(s, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n✅ Binance ulanishi ishladi, futures hisobida {pul:.2f} USDT. Saqlandi.\n")


def main():
    if sys.argv[1:] == ["sozla"]:
        return sozla()
    s, token = sozlamani_oqi()
    x = Xabarchi(token, s["sinov"])
    st = json.loads(HOLAT_FAYL.read_text(encoding="utf-8")) if HOLAT_FAYL.exists() else yangi_holat()
    try:
        birja = Binance(s.get("baza") or BAZA[s["sinov"]], s["api_key"], s["api_secret"])
        rejim = birja.sorov("GET", "/fapi/v1/positionSide/dual", True)
        if rejim.get("dualSidePosition"):
            birja.sorov("POST", "/fapi/v1/positionSide/dual", True, dualSidePosition=False)  # bir tomonlama rejim
    except BinanceXato as e:
        print(f"\nBinance rad etdi: {e}\n{XATO_MASLAHAT.get(e.kod, '')}\nKalitni qayta kiritamiz.\n")
        return sozla()
    ij = Ijrochi(birja, x, s, st)
    while True:
        try:
            ij.qadam()
            ij.saqla()
        except Exception as e:
            log("XATO:", repr(e))
            x.yubor(f"⚠️ Ijrochida xato: {e}", "xato:" + type(e).__name__)
        time.sleep(60)


if __name__ == "__main__":
    main()
