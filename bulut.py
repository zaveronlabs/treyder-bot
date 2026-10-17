"""Treyder AI: bulut versiyasi (GitHub Actions).

Doimiy ishlamaydi: har 15 daqiqada bir marta ishga tushadi va
  1. Telegramdagi yangi xabar va Ha/Yo'q bosishlarini qayta ishlaydi,
  2. yangi 4 soatlik sham yopilgan bo'lsa, qoida va miyani tekshirib, qog'oz portfelda o'zi savdo qiladi.
Hamma holat holat.json da saqlanadi, workflow uni har safar repoga qaytarib yozadi.
Faqat Python standart kutubxonasi ishlatiladi.

Qoida (4 soatlik grafik): narx EMA150 dan yuqori, 60 shamda o'sgan VA EMA600 dan yuqori
(katta trend ham o'sishda) -> LONG ushlab tur, aks holda naqd.
Qog'oz futures portfel: 1000 USDT, har tangaga 100 USDT marja x LEVERAGE.
Avto rejim: qoida VA miya (miya.py, noldan o'qitilgan kichik transformer) rozi bo'lsa long, aks holda naqd.
"""

import json
import os
import time
import urllib.request
from pathlib import Path

BELGILAR = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK", "LTC"]  # miya 10 tangani o'qiydi
SIGNAL_BELGILAR = BELGILAR[:5]  # signal faqat 5 ta eng katta tanga bo'yicha
TF, EMA_N, MOMENTUM_N, FILTR_N = "4h", 150, 60, 600
BOSHLANG_ICH_PUL, ULUSH, LEVERAGE = 1000.0, 200.0, 2
REJIM = f"{TF}-{len(SIGNAL_BELGILAR)}-avto"
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


def signallarni_tekshir(h):
    """Avto rejim: qoida ham, miya ham rozi bo'lsa long ushlab turadi, aks holda yopadi (qog'ozda)."""
    natijalar = {b: yopilishlar(b) for b in BELGILAR}
    sana = natijalar["BTC"][-1][0]
    if h.get("oxirgi_sana") == sana:
        return
    birinchi = h.get("rejim") != REJIM
    if birinchi:
        h.update(rejim=REJIM, sinov_boshi=sana, oxirgi_hisobot=time.time(), portfel={}, jurnal=[],
                 naqd=BOSHLANG_ICH_PUL, komissiya=0.0, btc_boshi=natijalar["BTC"][-1][4])
    h["miya"] = miya_fikri(natijalar)
    h["holat"] = {}
    for b in SIGNAL_BELGILAR:
        yangi, narx, farq, mom = trend_holati(natijalar[b])
        h["narx"][b], h["holat"][b] = narx, yangi
        p = h["miya"].get(b)
        kerak = bool(yangi) and (p is None or p > 0)
        miya_matn = f"miya {'✅' if p is not None and p > 0 else '⚠️'} {p:+.2f}" if p is not None else "miya yo'q"
        if kerak and b not in h["portfel"]:
            och(h, b, narx, sana)
            yubor(h, f"🤖🟢 {b}: long ochildi\nNarx: {narx:g}, {ULUSH:.0f} USDT x{LEVERAGE}\n"
                     f"Sabab: trend ✅ (10 kunda {mom:+.1%}), {miya_matn}")
        elif not kerak and b in h["portfel"]:
            sabab = "trend tugadi" if not yangi else f"miya rozi emas ({p:+.2f})"
            foyda = yop(h, b, narx, sana, sabab)
            yubor(h, f"🤖🔴 {b}: yopildi\nNarx: {narx:g}, natija {foyda:+.2f} USDT\nSabab: {sabab}")
    h["oxirgi_sana"] = sana
    if birinchi:
        tugash = time.strftime("%Y-%m-%d", time.gmtime(time.time() + SINOV_KUN * 86400))
        yubor(h, f"🤖 Avto rejim boshlandi: bot {len(SIGNAL_BELGILAR)} ta tangada o'zi savdo qiladi (qog'ozda, "
                 f"{BOSHLANG_ICH_PUL:.0f} USDT). Sinov muddati: {tugash} gacha.\n"
                 f"Har bir savdo shu yerga yoziladi, har hafta hisobot keladi. /hisobot, /holat, /jurnal\n\n"
                 + holat_matni(h))
    if time.time() - h.get("oxirgi_hisobot", 0) >= 7 * 86400:
        h["oxirgi_hisobot"] = time.time()
        yubor(h, "📊 Haftalik hisobot\n" + hisobot_matni(h))


# ---------- Qog'oz portfel ----------

def natija_usdt(p, narx):
    return max(p["miqdor"] * (narx - p["kirish_narx"]), -ULUSH)


def och(h, b, narx, sana):
    kom = ULUSH * LEVERAGE * KOMISSIYA
    h["portfel"][b] = {"miqdor": ULUSH * LEVERAGE / narx, "kirish_narx": narx, "kirish_sana": sana}
    h["naqd"] -= ULUSH + kom
    h["komissiya"] = h.get("komissiya", 0) + kom


def yop(h, b, narx, sana, sabab):
    p = h["portfel"].pop(b)
    kom = p["miqdor"] * narx * KOMISSIYA
    foyda = natija_usdt(p, narx) - kom
    h["naqd"] += ULUSH + foyda
    h["komissiya"] = h.get("komissiya", 0) + kom
    h["jurnal"].append({"belgi": b, "kirish_sana": p["kirish_sana"], "kirish_narx": p["kirish_narx"],
                        "chiqish_sana": sana, "chiqish_narx": narx, "foyda": foyda, "sabab": sabab})
    return foyda


def jami_pul(h):
    return h["naqd"] + sum(ULUSH + natija_usdt(p, h["narx"][b]) for b, p in h["portfel"].items())


def holat_matni(h):
    m = h.get("miya", {})
    qatorlar = [f"{b}/USDT: {'LONG ochiq' if b in h['portfel'] else 'naqd'}, trend {'✅' if s else '❌'}"
                + (f", miya {m[b]:+.2f}" if b in m else "") for b, s in sorted(h["holat"].items())]
    qatorlar.append(f"\nQog'oz portfel (x{LEVERAGE}): {jami_pul(h):.2f} USDT (boshida {BOSHLANG_ICH_PUL:.0f})")
    return "\n".join(qatorlar)


def hisobot_matni(h):
    j = h["jurnal"]
    yutuq = [x for x in j if x["foyda"] > 0]
    pul = jami_pul(h)
    btc = h["narx"].get("BTC", 0) / h["btc_boshi"] - 1 if h.get("btc_boshi") else 0
    qatorlar = [f"Sinov boshi: {h.get('sinov_boshi', '?')}",
                f"Portfel: {pul:.2f} USDT ({pul / BOSHLANG_ICH_PUL - 1:+.1%})",
                f"Taqqoslash: shu davrda BTC {btc:+.1%}",
                f"Yopilgan savdolar: {len(j)} (foydali {len(yutuq)}, zararli {len(j) - len(yutuq)})",
                f"Ochiq: {', '.join(h['portfel']) or 'yo`q'}",
                f"To'langan komissiya: {h.get('komissiya', 0):.2f} USDT"]
    if j:
        eng = max(j, key=lambda x: x["foyda"]), min(j, key=lambda x: x["foyda"])
        qatorlar.append(f"Eng yaxshi: {eng[0]['belgi']} {eng[0]['foyda']:+.2f}, eng yomon: {eng[1]['belgi']} {eng[1]['foyda']:+.2f}")
    return "\n".join(qatorlar)


def jurnal_matni(h):
    ochiq = [f"{b}: {p['kirish_sana']} dan beri ochiq ({p['kirish_narx']:g})" for b, p in h["portfel"].items()]
    yopiq = [f"{j['belgi']}: {j['kirish_sana']} -> {j['chiqish_sana']}, {j['foyda']:+.2f} USDT ({j.get('sabab', '')})"
             for j in h["jurnal"][-10:][::-1]]
    return "\n".join(ochiq + yopiq) or "Hali savdo yo'q."


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
                yubor(h, jurnal_matni(h))
            elif matn.startswith("/hisobot"):
                yubor(h, hisobot_matni(h) if h.get("sinov_boshi") else "Avto rejim keyingi 4 soatlik shamda boshlanadi.")


def main():
    h = json.loads(HOLAT_FAYL.read_text(encoding="utf-8")) if HOLAT_FAYL.exists() else {}
    for k, v in [("chat_id", None), ("update_id", 0), ("oxirgi_sana", None), ("holat", {}),
                 ("narx", {}), ("signallar", {}), ("portfel", {}), ("jurnal", []),
                 ("naqd", BOSHLANG_ICH_PUL)]:
        h.setdefault(k, v)
    try:
        yangilanishlar(h)
        if h.get("chat_id"):
            signallarni_tekshir(h)
    finally:
        HOLAT_FAYL.write_text(json.dumps(h, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
