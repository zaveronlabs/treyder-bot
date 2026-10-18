"""Treyder AI: bulut versiyasi (GitHub Actions).

Workflow uni har daqiqada ishga tushiradi:
  1. Telegramdagi yangi buyruqlarni (/holat, /jurnal, /hisobot) qayta ishlaydi,
  2. yangi 4 soatlik sham yopilgan bo'lsa, qoida va miyani tekshirib, qog'oz portfelda o'zi savdo qiladi.
Hamma holat holat.json da saqlanadi, workflow uni har safar repoga qaytarib yozadi.

Qoida (4 soatlik grafik): narx EMA150 dan yuqori, 60 shamda o'sgan VA EMA600 dan yuqori.
Avto rejim: qoida VA miya (miya.py, noldan o'qitilgan kichik transformer) rozi bo'lsa long, aks holda naqd.
Qog'oz futures portfel: 1000 USDT, har tangaga ULUSH USDT marja x LEVERAGE.
"""

import calendar
import json
import os
import time
import urllib.request
from pathlib import Path

BELGILAR = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK", "LTC"]  # miya 10 tangani o'qiydi
SIGNAL_BELGILAR = BELGILAR[:5]  # signal faqat 5 ta eng katta tanga bo'yicha
TF, EMA_N, MOMENTUM_N, FILTR_N = "4h", 150, 60, 600
BOSHLANG_ICH_PUL, ULUSH, LEVERAGE = 1000.0, 200.0, 2
REJIM = f"{TF}-{len(SIGNAL_BELGILAR)}-avto3"
KOMISSIYA, SINOV_KUN = 0.0005, 90  # har tomonga 0.05%; sinov muddati 3 oy
HOLAT_FAYL = Path(__file__).with_name("holat.json")
TOKEN = os.environ["TELEGRAM_TOKEN"]
NARX_MANBALARI = ["https://data-api.binance.vision", "https://api.binance.com"]


def http_json(url, malumot=None):
    sorov = urllib.request.Request(
        url, json.dumps(malumot).encode() if malumot is not None else None,
        {"Content-Type": "application/json", "User-Agent": "treyder-ai"},
    )
    with urllib.request.urlopen(sorov, timeout=30) as javob:
        return json.load(javob)


def tg(metod, **p):
    return http_json(f"https://api.telegram.org/bot{TOKEN}/{metod}", p)["result"]


def yubor(h, matn, tugmalar=None):
    if not h.get("chat_id"):
        return
    p = {"chat_id": h["chat_id"], "text": matn}
    if tugmalar:
        p["reply_markup"] = {"inline_keyboard": [tugmalar]}
    tg("sendMessage", **p)


# ---------- Narxlar va trend ----------

def yopilishlar(belgi):
    """Oxirgi ~2000 ta YOPILGAN 4 soatlik shamning (vaqt, open, high, low, close, hajm) ro'yxati."""
    hozir = time.time() * 1000
    for manba in NARX_MANBALARI:
        try:
            url = f"{manba}/api/v3/klines?symbol={belgi}USDT&interval={TF}&limit=1000"
            oxirgi = http_json(url)
            oldingi = http_json(f"{url}&endTime={oxirgi[0][0] - 1}")
            return [(time.strftime("%Y-%m-%d %H:00", time.gmtime(s[0] / 1000)), *map(float, s[1:6]))
                    for s in oldingi + oxirgi if s[6] < hozir]
        except Exception as xato:
            print(f"{manba} {belgi}: {xato}")
    raise RuntimeError(f"{belgi} narxini olib bo'lmadi")


def ema(narxlar, n):
    k, e = 2 / (n + 1), narxlar[0]
    for c in narxlar[1:]:
        e = c * k + e * (1 - k)
    return e


def trend_holati(yop):
    narxlar = [s[4] for s in yop]
    oxirgi = narxlar[-1]
    e, filtr = ema(narxlar, EMA_N), ema(narxlar, FILTR_N)
    mom = oxirgi / narxlar[-1 - MOMENTUM_N] - 1
    return int(oxirgi > e and mom > 0 and oxirgi > filtr), oxirgi, oxirgi / e - 1, mom


def miya_fikri(natijalar):
    """{belgi: bashorat}; miya ishlamay qolsa bo'sh lug'at (bot baribir ishlayveradi)."""
    try:
        import miya
        umumiy = set.intersection(*({s[0] for s in yop} for yop in natijalar.values()))
        return miya.bashorat({b: [s[1:] for s in yop if s[0] in umumiy] for b, yop in natijalar.items()})
    except Exception as xato:
        print("miya xatosi:", xato)
        return {}


YOLLAR = {"ikkalasi": "Qoida + miya (asosiy)", "qoida": "Faqat qoida", "miya": "Faqat miya",
          "yangilik": "Qoida + miya + yangiliklar"}
YANGILIK_CHEGARA = -0.2  # yangiliklar bundan salbiyroq bo'lsa 4-yo'l kirmaydi


def yangi_portfel():
    return {"portfel": {}, "jurnal": [], "naqd": BOSHLANG_ICH_PUL, "komissiya": 0.0}


def yangilik_fikri(h):
    """Yangilik AI tahlili (yangilik.json, alohida ish har 4 soatda yangilaydi); 12 soatdan eski bo'lsa ishlatilmaydi."""
    try:
        with open(HOLAT_FAYL.with_name("yangilik.json")) as f:
            natija = json.load(f)
        t = calendar.timegm(time.strptime(natija["vaqt"], "%Y-%m-%d %H:%M"))
        if time.time() - t < 12 * 3600:
            return natija
    except Exception as xato:
        print("yangilik xatosi:", xato)
    return {}


def yangilik_qatori(h, b):
    t = h.get("yangilik", {}).get("tangalar", {}).get(b)
    return f"\n📰 Yangiliklar ({t['baho']:+.1f}): {t.get('izoh', '')}" if t else ""


def yangilik_matni(h):
    y = yangilik_fikri(h)
    if not y:
        return "Hali yangilik tahlili yo'q (har 4 soatda yangilanadi)."
    q = [f"📰 Yangiliklar tahlili ({y.get('vaqt', '')} UTC, {y.get('soni', 0)} ta sarlavha)",
         f"Bozor ({y.get('bozor', {}).get('baho', 0):+.1f}): {y.get('bozor', {}).get('izoh', '')}"]
    q += [f"{b} ({t['baho']:+.1f}): {t.get('izoh', '')}" for b, t in y.get("tangalar", {}).items()]
    return "\n".join(q)


def signallarni_tekshir(h):
    """Avto rejim: 4 ta qog'oz portfel parallel yuritiladi (faqat qoida, faqat miya, ikkalasi rozi bo'lsa,
    ikkalasi + yangiliklar salbiy emas). Telegramga asosiy (ikkalasi) portfel savdolari yoziladi."""
    natijalar = {b: yopilishlar(b) for b in BELGILAR}
    sana = natijalar["BTC"][-1][0]
    if h.get("oxirgi_sana") == sana:
        return
    birinchi = h.get("rejim") != REJIM
    if birinchi:
        h.update(rejim=REJIM, sinov_boshi=sana, oxirgi_hisobot=time.time(), btc_boshi=natijalar["BTC"][-1][4],
                 portfellar={y: yangi_portfel() for y in YOLLAR})
        for k in ["portfel", "jurnal", "naqd", "komissiya", "signallar"]:
            h.pop(k, None)
    for y in YOLLAR:  # keyin qo'shilgan yo'l boshqalarini nolga tushirmasdan qo'shiladi
        h["portfellar"].setdefault(y, yangi_portfel())
    h["miya"] = miya_fikri(natijalar)
    h["yangilik"] = yangilik_fikri(h)
    h["holat"] = {}
    for b in SIGNAL_BELGILAR:
        yangi, narx, farq, mom = trend_holati(natijalar[b])
        h["narx"][b], h["holat"][b] = narx, yangi
        p = h["miya"].get(b)
        miya_ha = p is not None and p > 0
        kerak = {"qoida": bool(yangi), "miya": miya_ha, "ikkalasi": bool(yangi) and (miya_ha or p is None)}
        yb = h["yangilik"].get("tangalar", {}).get(b, {}).get("baho")
        kerak["yangilik"] = kerak["ikkalasi"] and (yb is None or yb >= YANGILIK_CHEGARA)
        for y, pf in h["portfellar"].items():
            if kerak[y] and b not in pf["portfel"]:
                och(pf, b, narx, sana)
                if y == "ikkalasi":
                    miya_matn = f"miya ✅ {p:+.2f}" if p is not None else "miya ishlamadi"
                    yubor(h, f"🤖🟢 {b}: long ochildi\nNarx: {narx:g}, {ULUSH:.0f} USDT x{LEVERAGE}\n"
                             f"Sabab: trend ✅ (10 kunda {mom:+.1%}), {miya_matn}" + yangilik_qatori(h, b))
            elif not kerak[y] and b in pf["portfel"]:
                if y in ("ikkalasi", "yangilik"):
                    sabab = "trend tugadi" if not yangi else f"miya rozi emas ({p:+.2f})" if not miya_ha else \
                            f"yangiliklar salbiy ({yb:+.1f})"
                else:
                    sabab = "trend tugadi" if y == "qoida" else f"miya salbiy ({p:+.2f})" if p is not None else "miya yo'q"
                foyda = yop(pf, b, narx, sana, sabab)
                if y == "ikkalasi":
                    yubor(h, f"🤖🔴 {b}: yopildi\nNarx: {narx:g}, natija {foyda:+.2f} USDT\nSabab: {sabab}"
                             + yangilik_qatori(h, b))
    h["oxirgi_sana"] = sana
    if birinchi:
        tugash = time.strftime("%Y-%m-%d", time.gmtime(time.time() + SINOV_KUN * 86400))
        yubor(h, f"🤖 Avto rejim boshlandi: bot {len(SIGNAL_BELGILAR)} ta tangada o'zi savdo qiladi (qog'ozda). "
                 f"Sinov muddati: {tugash} gacha.\n3 xil yo'l parallel yoziladi, har biriga {BOSHLANG_ICH_PUL:.0f} USDT: "
                 f"faqat qoida, faqat miya, qoida + miya (asosiy). Bu yerga asosiy yo'l savdolari yoziladi, "
                 f"har hafta uchalasi solishtirilgan hisobot keladi. /hisobot, /holat, /jurnal, /yangilik\n\n" + holat_matni(h))
    if time.time() - h.get("oxirgi_hisobot", 0) >= 7 * 86400:
        h["oxirgi_hisobot"] = time.time()
        yubor(h, "📊 Haftalik hisobot\n" + hisobot_matni(h))


# ---------- Qog'oz portfel ----------

def natija_usdt(p, narx):
    return max(p["miqdor"] * (narx - p["kirish_narx"]), -ULUSH)


def och(pf, b, narx, sana):
    kom = ULUSH * LEVERAGE * KOMISSIYA
    pf["portfel"][b] = {"miqdor": ULUSH * LEVERAGE / narx, "kirish_narx": narx, "kirish_sana": sana}
    pf["naqd"] -= ULUSH + kom
    pf["komissiya"] += kom


def yop(pf, b, narx, sana, sabab):
    p = pf["portfel"].pop(b)
    kom = p["miqdor"] * narx * KOMISSIYA
    foyda = natija_usdt(p, narx) - kom
    pf["naqd"] += ULUSH + foyda
    pf["komissiya"] += kom
    pf["jurnal"].append({"belgi": b, "kirish_sana": p["kirish_sana"], "kirish_narx": p["kirish_narx"],
                         "chiqish_sana": sana, "chiqish_narx": narx, "foyda": foyda, "sabab": sabab})
    return foyda


def jami_pul(h, pf):
    return pf["naqd"] + sum(ULUSH + natija_usdt(p, h["narx"][b]) for b, p in pf["portfel"].items())


def holat_matni(h):
    m = h.get("miya", {})
    asosiy = h.get("portfellar", {}).get("ikkalasi", {"portfel": {}})
    qatorlar = [f"{b}/USDT: {'LONG ochiq' if b in asosiy['portfel'] else 'naqd'}, trend {'✅' if s else '❌'}"
                + (f", miya {m[b]:+.2f}" if b in m else "") for b, s in sorted(h["holat"].items())]
    qatorlar.append("")
    for y, nom in YOLLAR.items():
        if y in h.get("portfellar", {}):
            qatorlar.append(f"{nom}: {jami_pul(h, h['portfellar'][y]):.2f} USDT")
    return "\n".join(qatorlar)


def hisobot_matni(h):
    btc = h["narx"].get("BTC", 0) / h["btc_boshi"] - 1 if h.get("btc_boshi") else 0
    qatorlar = [f"Sinov boshi: {h.get('sinov_boshi', '?')} (har yo'lga {BOSHLANG_ICH_PUL:.0f} USDT)",
                f"Taqqoslash: shu davrda BTC {btc:+.1%}"]
    for y, nom in YOLLAR.items():
        pf = h["portfellar"][y]
        j, pul = pf["jurnal"], jami_pul(h, pf)
        yutuq = sum(x["foyda"] > 0 for x in j)
        qatorlar += ["", f"{nom}: {pul:.2f} USDT ({pul / BOSHLANG_ICH_PUL - 1:+.1%})",
                     f"  savdolar {len(j)} (foydali {yutuq}, zararli {len(j) - yutuq}), komissiya {pf['komissiya']:.2f}",
                     f"  ochiq: {', '.join(pf['portfel']) or 'yo`q'}"]
    return "\n".join(qatorlar)


def jurnal_matni(h):
    pf = h["portfellar"]["ikkalasi"]
    ochiq = [f"{b}: {p['kirish_sana']} dan beri ochiq ({p['kirish_narx']:g})" for b, p in pf["portfel"].items()]
    yopiq = [f"{j['belgi']}: {j['kirish_sana']} -> {j['chiqish_sana']}, {j['foyda']:+.2f} USDT ({j['sabab']})"
             for j in pf["jurnal"][-10:][::-1]]
    return "Asosiy yo'l (qoida + miya):\n" + ("\n".join(ochiq + yopiq) or "Hali savdo yo'q.")


def yangilanishlar(h):
    for u in tg("getUpdates", offset=h["update_id"] + 1, timeout=0):
        h["update_id"] = u["update_id"]
        if "callback_query" in u:
            tg("answerCallbackQuery", callback_query_id=u["callback_query"]["id"])
            yubor(h, "Bot endi avto rejimda: savdolarni o'zi qiladi, tugma kerak emas.")
        elif "message" in u:
            matn = u["message"].get("text", "")
            if not h.get("chat_id"):
                h["chat_id"] = u["message"]["chat"]["id"]
                yubor(h, "Salom! Endi savdolar shu yerga yoziladi.")
            if matn.startswith("/holat"):
                yubor(h, holat_matni(h))
            elif matn.startswith("/jurnal"):
                yubor(h, jurnal_matni(h) if h.get("portfellar") else "Hali savdo yo'q.")
            elif matn.startswith("/yangilik"):
                yubor(h, yangilik_matni(h))
            elif matn.startswith("/hisobot"):
                yubor(h, hisobot_matni(h) if h.get("portfellar") else "Avto rejim keyingi 4 soatlik shamda boshlanadi.")


def main():
    h = json.loads(HOLAT_FAYL.read_text(encoding="utf-8")) if HOLAT_FAYL.exists() else {}
    for k, v in [("chat_id", None), ("update_id", 0), ("oxirgi_sana", None), ("holat", {}),
                 ("narx", {})]:
        h.setdefault(k, v)
    try:
        yangilanishlar(h)
        if h.get("chat_id"):
            signallarni_tekshir(h)
    finally:
        HOLAT_FAYL.write_text(json.dumps(h, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
