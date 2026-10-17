"""Treyder AI: bulut versiyasi (GitHub Actions).

Doimiy ishlamaydi: har 15 daqiqada bir marta ishga tushadi va
  1. Telegramdagi yangi xabar va Ha/Yo'q bosishlarini qayta ishlaydi,
  2. yangi kunlik sham yopilgan bo'lsa, trend qoidasini tekshirib signal yuboradi.
Hamma holat holat.json da saqlanadi, workflow uni har safar repoga qaytarib yozadi.
Faqat Python standart kutubxonasi ishlatiladi.

Qoida: narx 50 kunlik EMA dan yuqori VA 20 kunda o'sgan -> LONG ushlab tur, aks holda naqd.
Qog'oz futures portfel: 1000 USDT, har tangaga 100 USDT marja x LEVERAGE.
"""

import json
import os
import time
import urllib.request
from pathlib import Path

BELGILAR = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK", "LTC"]
EMA_KUN, MOMENTUM_KUN = 50, 20
BOSHLANG_ICH_PUL, ULUSH, LEVERAGE = 1000.0, 100.0, 2
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

def kunlik_yopilishlar(belgi):
    """Oxirgi 300 ta YOPILGAN kunlik shamning (sana, close) ro'yxati."""
    hozir = time.time() * 1000
    for manba in NARX_MANBALARI:
        try:
            shamlar = http_json(f"{manba}/api/v3/klines?symbol={belgi}USDT&interval=1d&limit=300")
            return [(time.strftime("%Y-%m-%d", time.gmtime(s[0] / 1000)), float(s[4]))
                    for s in shamlar if s[6] < hozir]
        except Exception as xato:
            print(f"{manba} {belgi}: {xato}")
    raise RuntimeError(f"{belgi} narxini olib bo'lmadi")


def trend_holati(yopilishlar):
    narxlar = [c for _, c in yopilishlar]
    k = 2 / (EMA_KUN + 1)
    ema = narxlar[0]
    for c in narxlar[1:]:
        ema = c * k + ema * (1 - k)
    oxirgi = narxlar[-1]
    mom = oxirgi / narxlar[-1 - MOMENTUM_KUN] - 1
    return int(oxirgi > ema and mom > 0), oxirgi, oxirgi / ema - 1, mom


def signallarni_tekshir(h):
    natijalar = {b: kunlik_yopilishlar(b) for b in BELGILAR}
    sana = natijalar["BTC"][-1][0]
    if h.get("oxirgi_sana") == sana:
        return
    birinchi = h.get("oxirgi_sana") is None
    for b, yop in natijalar.items():
        yangi, narx, farq, mom = trend_holati(yop)
        h["narx"][b] = narx
        eski = h["holat"].get(b)
        h["holat"][b] = yangi
        if birinchi or eski is None or eski == yangi:
            continue
        tur = "LONG OCH" if yangi else "LONG YOP"
        sid = str(len(h["signallar"]) + 1)
        h["signallar"][sid] = {"sana": sana, "belgi": b, "tur": tur, "narx": narx, "qaror": None}
        yubor(
            h,
            f"{'🟢' if yangi else '🔴'} {b}/USDT: {tur}\nNarx: {narx:g}\n"
            f"EMA50 dan {farq:+.1%}, 20 kunda {mom:+.1%}\n"
            f"Qog'oz portfelda: {ULUSH:.0f} USDT marja x{LEVERAGE}",
            [{"text": "✅ Ha", "callback_data": f"ha:{sid}"},
             {"text": "❌ Yo'q", "callback_data": f"yoq:{sid}"}],
        )
    h["oxirgi_sana"] = sana
    if birinchi:
        yubor(h, "Bot bulutda ishga tushdi. Hozirgi holat:\n" + holat_matni(h))


# ---------- Qog'oz portfel ----------

def natija_usdt(p, narx):
    return max(p["miqdor"] * (narx - p["kirish_narx"]), -ULUSH)


def holat_matni(h):
    qatorlar = [f"{b}/USDT: {'USHLAB TUR' if s else 'naqd'}" for b, s in sorted(h["holat"].items())]
    jami = h["naqd"] + sum(ULUSH + natija_usdt(p, h["narx"][b]) for b, p in h["portfel"].items())
    qatorlar.append(f"\nQog'oz portfel (x{LEVERAGE}): {jami:.2f} USDT (boshida {BOSHLANG_ICH_PUL:.0f})")
    return "\n".join(qatorlar)


def jurnal_matni(h):
    ochiq = [f"{b}: {p['kirish_sana']} dan beri ochiq" for b, p in h["portfel"].items()]
    yopiq = [f"{j['belgi']}: {j['kirish_sana']} -> {j['chiqish_sana']}, {j['foyda']:+.2f} USDT"
             for j in h["jurnal"][-10:][::-1]]
    return "\n".join(ochiq + yopiq) or "Hali savdo yo'q."


def qaror(h, ha, sid):
    s = h["signallar"].get(sid)
    if not s or s["qaror"]:
        return "Bu signal bo'yicha qaror allaqachon qabul qilingan."
    s["qaror"] = "ha" if ha else "yoq"
    b, narx = s["belgi"], s["narx"]
    if not ha:
        return f"{b} {s['tur']}: o'tkazib yuborildi."
    if s["tur"] == "LONG OCH":
        if b in h["portfel"]:
            return f"{b} portfelda allaqachon bor."
        if h["naqd"] < ULUSH:
            return "Qog'oz portfelda naqd yetmaydi."
        h["portfel"][b] = {"miqdor": ULUSH * LEVERAGE / narx, "kirish_narx": narx, "kirish_sana": s["sana"]}
        h["naqd"] -= ULUSH
        return f"{b}: {narx:g} narxda long ochildi, {ULUSH:.0f} USDT marja x{LEVERAGE} (qog'ozda)."
    p = h["portfel"].pop(b, None)
    if not p:
        return f"{b} portfelda yo'q edi."
    foyda = natija_usdt(p, narx)
    h["naqd"] += ULUSH + foyda
    h["jurnal"].append({"belgi": b, "kirish_sana": p["kirish_sana"], "chiqish_sana": s["sana"], "foyda": foyda})
    return f"{b}: {narx:g} narxda yopildi, natija {foyda:+.2f} USDT (qog'ozda)."


def yangilanishlar(h):
    for u in tg("getUpdates", offset=h["update_id"] + 1, timeout=0):
        h["update_id"] = u["update_id"]
        if "callback_query" in u:
            cq = u["callback_query"]
            tur, sid = cq["data"].split(":")
            tg("answerCallbackQuery", callback_query_id=cq["id"])
            yubor(h, qaror(h, tur == "ha", sid))
        elif "message" in u:
            matn = u["message"].get("text", "")
            if not h.get("chat_id"):
                h["chat_id"] = u["message"]["chat"]["id"]
                yubor(h, "Salom! Endi signallar shu yerga keladi.")
            if matn.startswith("/holat"):
                yubor(h, holat_matni(h))
            elif matn.startswith("/jurnal"):
                yubor(h, jurnal_matni(h))


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
