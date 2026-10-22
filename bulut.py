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
SHAM_SONIYA = 4 * 3600
TINGLASH = 50  # har ishga tushishda Telegram buyruqlarini shuncha soniya tinglaydi (workflow keyin darhol qayta chaqiradi)
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


def rasm_yubor(h, natijalar=None, izoh=""):
    """Haftalik rasm (rasm.py): 1000$ har bir pul taqsimlash usulida qanday o'zgargani."""
    try:
        import rasm
    except ImportError:  # eski workflow nusxasida matplotlib o'rnatilmagan bo'lishi mumkin
        import subprocess, sys
        subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "matplotlib"], check=True)
        import rasm
    natijalar = natijalar or {b: yopilishlar(b) for b in SIGNAL_BELGILAR}
    png = rasm.chiz(h, natijalar, BOSHLANG_ICH_PUL, ULUSH, LEVERAGE, KOMISSIYA)
    if not png:
        return yubor(h, "Rasm uchun tarix hali juda qisqa.")
    chegara = "treyderchegara"
    qism = lambda nom, qiymat: f'--{chegara}\r\nContent-Disposition: form-data; name="{nom}"\r\n\r\n{qiymat}\r\n'.encode()
    tana = (qism("chat_id", h["chat_id"]) + qism("caption", izoh or "Chiziq tepaga ketsa foyda, pastga ketsa zarar.")
            + f'--{chegara}\r\nContent-Disposition: form-data; name="photo"; filename="hisobot.png"\r\n'
              f'Content-Type: image/png\r\n\r\n'.encode() + png + f"\r\n--{chegara}--\r\n".encode())
    sorov = urllib.request.Request(f"https://api.telegram.org/bot{TOKEN}/sendPhoto", tana,
                                   {"Content-Type": f"multipart/form-data; boundary={chegara}"})
    urllib.request.urlopen(sorov, timeout=60).read()


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
          "yangilik": "Qoida + miya + yangiliklar", "ai": "AI treyder (Qwen 14B)", "short": "Miya short (sinov)",
          "longshort": "Asosiy + short miyasi (sinov)", "qoida_iz": "Faqat qoida + iz chiqish (sinov)",
          "oltin": "Oltin kunlik qoida (sinov)", "ikki_tub": "Ikki tub shakli (sinov)",
          "qoida_tub": "Qoida yoki ikki tub (sinov)", "hakam": "Shakl + miya hakam (sinov)"}
MIYA_CHEGARA = 0.02  # miya bundan yuqori bashorat bersagina "rozi" (juda zaif "ha" hisobga olinmaydi)
SHORT_CHEGARA = -0.1  # miya bundan pastroq bashorat bersa short yo'li short ochadi
SHORT_EHTIMOL = 0.45  # short miyasi tushish ehtimolini bundan yuqori desa (asosiy yo'l naqdda bo'lsa) short
YANGILIK_CHEGARA = -0.2  # yangiliklar bundan salbiyroq bo'lsa 4-yo'l kirmaydi
IZ_ATR = 5  # iz chiqish: foydadagi pozitsiya eng yuqori nuqtasidan 5 ATR qaytsa yopiladi (qolgan foydani himoyalash)


def iz_tekshir(h, b, sham, sana):
    """qoida_iz yo'li: pozitsiya foydada bo'lib, narx eng yuqori nuqtadan IZ_ATR * ATR qaytsa yopadi.
    True qaytarsa shu shamda yopildi (trend qayta yangilanmaguncha kirilmaydi)."""
    pf = h["portfellar"]["qoida_iz"]
    p = pf["portfel"].get(b)
    if not p:
        return False
    atr = sum((s[2] - s[3]) / s[4] for s in sham[-15:-1]) / 14  # oldingi 14 sham, joriy shamsiz
    eng = p.get("eng", p["kirish_narx"])
    chegara = eng * (1 - IZ_ATR * atr)
    _, o, hi, lo, c, _ = sham[-1]
    if lo <= chegara and chegara > p["kirish_narx"]:
        yop(pf, b, min(chegara, o), sana, f"iz chiqish: eng yuqori {eng:g} dan {IZ_ATR} ATR qaytdi")
        pf.setdefault("blok", {})[b] = True
        return True
    p["eng"] = max(eng, hi)
    return False


def short_miya_fikri(natijalar):
    """{belgi: tushish ehtimoli 0..1}; short miyasi bo'lmasa yoki ishlamasa bo'sh."""
    try:
        import miya
        if not miya.SHORT_FAYL.exists():
            return {}
        umumiy = set.intersection(*({s[0] for s in yop} for yop in natijalar.values()))
        return miya.bashorat({b: [s[1:] for s in yop if s[0] in umumiy] for b, yop in natijalar.items()},
                             fayl=miya.SHORT_FAYL)
    except Exception as xato:
        print("short miya xatosi:", xato)
        return {}


TUB_K, TUB_TENG, TUB_CHUQUR, TUB_KUT, TUB_USHLASH = 5, 0.015, 0.03, 40, 12


def ikki_tub(sham):
    """Oxirgi yopilgan shamda "ikki tub" (double bottom) bo'yni yuqoriga yorildimi.
    Tub-cho'qqi-tub (K sham chap/o'ngda tasdiqlangan), tublar 1.5% ichida teng, cho'qqi tublardan kamida 3% baland;
    ikkinchi tub tasdiqlangandan keyin 40 sham ichida yopilish cho'qqidan birinchi marta oshsa signal
    (oraliqda narx tublardan 1% pastga tushsa shakl bekor). Tarixda 2024..: 12 sham ichida o'rtacha +1%."""
    hi, lo, cl = [x[2] for x in sham], [x[3] for x in sham], [x[4] for x in sham]
    n, K = len(sham), TUB_K
    piv = []
    for i in range(K, n - K):
        if hi[i] == max(hi[i - K:i + K + 1]):
            piv.append((i, "H", hi[i]))
        if lo[i] == min(lo[i - K:i + K + 1]):
            piv.append((i, "L", lo[i]))
    alt = []
    for p in piv:  # cho'qqi va tublar almashib kelsin
        if alt and alt[-1][1] == p[1]:
            if (p[1] == "H" and p[2] > alt[-1][2]) or (p[1] == "L" and p[2] < alt[-1][2]):
                alt[-1] = p
        else:
            alt.append(p)
    t = n - 1
    for k in range(2, len(alt)):
        l1, h1, l2 = alt[k - 2:k + 1]
        if (l1[1], h1[1], l2[1]) != ("L", "H", "L") or not l2[0] + K <= t < l2[0] + K + TUB_KUT:
            continue
        if abs(l2[2] / l1[2] - 1) >= TUB_TENG or h1[2] / max(l1[2], l2[2]) - 1 <= TUB_CHUQUR:
            continue
        bekor = min(l1[2], l2[2]) * 0.99
        if any(cl[tt] > h1[2] or lo[tt] < bekor for tt in range(l2[0] + K, t)):
            continue  # oldinroq yorilgan yoki shakl buzilgan
        if cl[t] > h1[2]:
            return True
    return False


def sana_soniya(sana):
    return calendar.timegm(time.strptime(sana, "%Y-%m-%d %H:%M"))


SHAKL_NOMI = {"ikki_chuqqi": "ikki cho'qqi", "ikki_tub": "ikki tub", "bosh_yelka": "bosh-yelka",
              "teskari_bosh_yelka": "teskari bosh-yelka", "kotariluvchi_pona": "ko'tariluvchi pona",
              "tushuvchi_pona": "tushuvchi pona"}
HAKAM_CHEGARA, HAKAM_USHLASH = 0.2, 12  # miya shakl tomoniga kamida 0.2 bersa kiriladi, 12 sham (2 kun) ushlanadi


def shakllar(sham):
    """Oxirgi yopilgan shamda yorilgan grafik shakllari: [(nom, yon)], yon 1 = narx ko'tarilishi, -1 = tushishi kutiladi.
    6 shakl (ikki cho'qqi/tub, bosh-yelka, teskari bosh-yelka, ko'tariluvchi/tushuvchi pona), qoidalar katta_miya.py dagi
    bilan bir xil. "Hakam" yo'li faqat miya shu tomonga rozi bo'lgan shakllarda savdo qiladi (2024..: hakamsiz x1.1 va
    -67% tushish, hakam bilan x2.4 va -16%)."""
    hi, lo, cl = [x[2] for x in sham], [x[3] for x in sham], [x[4] for x in sham]
    n, K, TOL, KUT = len(sham), TUB_K, 0.015, 40
    piv = []
    for i in range(K, n - K):
        if hi[i] == max(hi[i - K:i + K + 1]):
            piv.append((i, "H", hi[i]))
        if lo[i] == min(lo[i - K:i + K + 1]):
            piv.append((i, "L", lo[i]))
    alt = []
    for p in piv:
        if alt and alt[-1][1] == p[1]:
            if (p[1] == "H" and p[2] > alt[-1][2]) or (p[1] == "L" and p[2] < alt[-1][2]):
                alt[-1] = p
        else:
            alt.append(p)
    natija, t = set(), n - 1

    def signal(nom, yon, t0, chiziq, bekor):
        if not t0 <= t < t0 + KUT:
            return
        for tt in range(t0, t + 1):
            if (yon < 0 and cl[tt] < chiziq(tt)) or (yon > 0 and cl[tt] > chiziq(tt)):
                if tt == t:
                    natija.add((nom, yon))
                return  # birinchi yorilish (oldinroq bo'lgan bo'lsa yangi signal emas)
            if (yon < 0 and hi[tt] > bekor) or (yon > 0 and lo[tt] < bekor):
                return  # shakl buzildi
    for k in range(len(alt)):
        turlar = [a[1] for a in alt[max(0, k - 4):k + 1]]
        if turlar[-3:] == ["H", "L", "H"]:
            h1, l1, h2 = alt[k - 2:k + 1]
            if abs(h2[2] / h1[2] - 1) < TOL and min(h1[2], h2[2]) / l1[2] - 1 > 0.03:
                signal("ikki_chuqqi", -1, h2[0] + K, lambda x, v=l1[2]: v, max(h1[2], h2[2]) * 1.01)
        if turlar[-3:] == ["L", "H", "L"]:
            l1, h1, l2 = alt[k - 2:k + 1]
            if abs(l2[2] / l1[2] - 1) < TOL and h1[2] / max(l1[2], l2[2]) - 1 > 0.03:
                signal("ikki_tub", 1, l2[0] + K, lambda x, v=h1[2]: v, min(l1[2], l2[2]) * 0.99)
        if turlar == ["H", "L", "H", "L", "H"]:
            s1, n1, hd, n2, s2 = alt[k - 4:k + 1]
            if hd[2] > s1[2] * 1.02 and hd[2] > s2[2] * 1.02 and abs(s2[2] / s1[2] - 1) < 0.04:
                sl = (n2[2] - n1[2]) / (n2[0] - n1[0])
                signal("bosh_yelka", -1, s2[0] + K, lambda x, a=n1, s=sl: a[2] + s * (x - a[0]), hd[2])
        if turlar == ["L", "H", "L", "H", "L"]:
            s1, n1, hd, n2, s2 = alt[k - 4:k + 1]
            if hd[2] < s1[2] * 0.98 and hd[2] < s2[2] * 0.98 and abs(s2[2] / s1[2] - 1) < 0.04:
                sl = (n2[2] - n1[2]) / (n2[0] - n1[0])
                signal("teskari_bosh_yelka", 1, s2[0] + K, lambda x, a=n1, s=sl: a[2] + s * (x - a[0]), hd[2])
        if k >= 3:
            oxir = alt[k - 3:k + 1]
            H_, L_ = [a for a in oxir if a[1] == "H"], [a for a in oxir if a[1] == "L"]
            if len(H_) == 2 and len(L_) == 2:
                sh = (H_[1][2] - H_[0][2]) / (H_[1][0] - H_[0][0])
                sl = (L_[1][2] - L_[0][2]) / (L_[1][0] - L_[0][0])
                t0 = oxir[-1][0] + K
                if sh > 0 and sl > 0 and sl > sh * 1.2:
                    signal("kotariluvchi_pona", -1, t0, lambda x, a=L_[1], s=sl: a[2] + s * (x - a[0]),
                           max(H_[0][2], H_[1][2]) * 1.02)
                if sh < 0 and sl < 0 and sh < sl * 1.2:
                    signal("tushuvchi_pona", 1, t0, lambda x, a=H_[1], s=sh: a[2] + s * (x - a[0]),
                           min(L_[0][2], L_[1][2]) * 0.98)
    return sorted(natija)


def oltin_tekshir(h, sana):
    """Oltin yo'li (PAXG): kunlik yopilish 50 kunlik o'rtachadan yuqori va 20 kunda o'sgan bo'lsa long.
    Hisobotda oltin yo'li 5 baravar kattalashtirilib (butun pul x2) 80% 🔀 + 20% oltin birikmasida ishlatiladi."""
    try:
        kunlar = http_json(f"{NARX_MANBALARI[0]}/api/v3/klines?symbol=PAXGUSDT&interval=1d&limit=60")
        sham = yopilishlar("PAXG")
    except Exception as xato:
        print("oltin:", xato)
        return
    yopiq = [float(k[4]) for k in kunlar if k[6] < time.time() * 1000]
    narx = sham[-1][4]
    h["narx"]["PAXG"] = narx
    kerak = len(yopiq) >= 50 and yopiq[-1] > sum(yopiq[-50:]) / 50 and yopiq[-1] > yopiq[-21]
    pf = h["portfellar"]["oltin"]
    if kerak and "PAXG" not in pf["portfel"]:
        och(pf, "PAXG", narx, sana)
    elif not kerak and "PAXG" in pf["portfel"]:
        yop(pf, "PAXG", narx, sana, "oltin trendi tugadi")


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


def joriy_narx(belgi):
    for manba in NARX_MANBALARI:
        try:
            return float(http_json(f"{manba}/api/v3/ticker/price?symbol={belgi}USDT")["price"])
        except Exception as xato:
            print(f"{manba} {belgi}: {xato}")
    raise RuntimeError(f"{belgi} narxini olib bo'lmadi")


def ai_sabab(q):
    import treyder_ai
    return ", ".join(treyder_ai.SABABLAR.get(x, x) for x in q.get("sabablar", []))


def ai_tekshir(h):
    """AI treyder (treyder_ai.json, sham yopilgandan keyin alohida ishda tayyorlanadi): yangi qarorlar kelganda
    5-yo'l portfelida joriy narxda ochadi/yopadi."""
    try:
        with open(HOLAT_FAYL.with_name("treyder_ai.json")) as f:
            ai = json.load(f)
    except Exception:
        return
    # faqat shu shamga tegishli yangi qaror (qayta ishlash xavfsiz: faqat portfeldan farq qilsa savdo qiladi)
    if "portfellar" not in h or ai.get("vaqt") in (None, h.get("ai_vaqt")) or ai.get("sham") != h.get("oxirgi_sana"):
        return
    h["ai_vaqt"], h["ai"] = ai["vaqt"], ai
    pf = h["portfellar"].setdefault("ai", yangi_portfel())
    sana = time.strftime("%Y-%m-%d %H:%M", time.gmtime())
    for b, q in ai.get("tangalar", {}).items():
        kerak = q.get("qaror") == "long"
        if kerak == (b in pf["portfel"]):
            continue
        narx = joriy_narx(b)
        h["narx"][b] = narx
        if kerak:
            och(pf, b, narx, sana)
            yubor(h, f"🧠🟢 AI treyder: {b} long ochdi\nNarx: {narx:g}, ishonch {q.get('ishonch', 0)}%\n"
                     f"Sabab: {ai_sabab(q)}")
        else:
            foyda = yop(pf, b, narx, sana, "AI: " + ai_sabab(q))
            yubor(h, f"🧠🔴 AI treyder: {b} yopdi\nNarx: {narx:g}, natija {foyda:+.2f} USDT\nSabab: {ai_sabab(q)}")


def ai_matni(h):
    ai = h.get("ai")
    if not ai:
        return "AI treyder hali qaror bermadi (har 4 soatlik sham yopilgandan keyin keladi)."
    q = [f"🧠 AI treyder fikri ({ai['sham']} shami, {ai.get('model', '')})"]
    q += [f"{b}: {'LONG' if t['qaror'] == 'long' else 'kutish'} ({t.get('ishonch', 0)}%), {ai_sabab(t)}"
          for b, t in ai.get("tangalar", {}).items()]
    return "\n".join(q)


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
    kutilgan = time.strftime("%Y-%m-%d %H:00", time.gmtime((time.time() // SHAM_SONIYA - 1) * SHAM_SONIYA))
    if h.get("oxirgi_sana") == kutilgan and h.get("rejim") == REJIM:
        return  # yangi sham hali yopilmagan: narxlarni har daqiqada qayta yuklash shart emas
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
        if y == "qoida_tub" and y not in h["portfellar"] and "qoida" in h["portfellar"]:
            h["portfellar"][y] = json.loads(json.dumps(h["portfellar"]["qoida"]))  # qoida tarixidan boshlanadi
        h["portfellar"].setdefault(y, yangi_portfel())
    h["miya"] = miya_fikri(natijalar)
    h["short_miya"] = short_miya_fikri(natijalar)
    h["yangilik"] = yangilik_fikri(h)
    h["holat"] = {}
    for b in SIGNAL_BELGILAR:
        yangi, narx, farq, mom = trend_holati(natijalar[b])
        h["narx"][b], h["holat"][b] = narx, yangi
        p = h["miya"].get(b)
        miya_ha = p is not None and p > MIYA_CHEGARA
        kerak = {"qoida": bool(yangi), "miya": miya_ha, "ikkalasi": bool(yangi) and (miya_ha or p is None)}
        tp = h["portfellar"]["ikki_tub"]["portfel"].get(b)
        kerak["ikki_tub"] = ikki_tub(natijalar[b]) or bool(
            tp and sana_soniya(sana) - sana_soniya(tp["kirish_sana"]) < TUB_USHLASH * 4 * 3600)
        kerak["qoida_tub"] = bool(yangi) or kerak["ikki_tub"]
        hakam_sig = [nm for nm, yn in shakllar(natijalar[b]) if p is not None and p * yn > HAKAM_CHEGARA]
        hp = h["portfellar"]["hakam"]["portfel"].get(b)
        yon_h = (1 if p > 0 else -1) if hakam_sig else hp.get("yon", 1) if hp else 1
        kerak["hakam"] = bool(hakam_sig) or bool(
            hp and sana_soniya(sana) - sana_soniya(hp.get("signal_sana", hp["kirish_sana"])) < HAKAM_USHLASH * 4 * 3600)
        yb = h["yangilik"].get("tangalar", {}).get(b, {}).get("baho")
        kerak["yangilik"] = kerak["ikkalasi"] and (yb is None or yb >= YANGILIK_CHEGARA)
        kerak["short"] = p is not None and p < SHORT_CHEGARA
        ps = h["short_miya"].get(b)
        kerak["longshort"] = kerak["ikkalasi"] or (ps is not None and ps > SHORT_EHTIMOL)
        blok = h["portfellar"]["qoida_iz"].setdefault("blok", {})
        if not yangi:
            blok.pop(b, None)  # trend tugadi: keyingi trendda yana kirish mumkin
        iz_tekshir(h, b, natijalar[b], sana)
        kerak["qoida_iz"] = bool(yangi) and not blok.get(b)
        yon_ls = 1 if kerak["ikkalasi"] else -1
        for y, pf in h["portfellar"].items():
            if y not in kerak:  # AI treyder o'z qarorlari bilan alohida (ai_tekshir)
                continue
            yon_y = {"short": -1, "longshort": yon_ls, "hakam": yon_h}.get(y, 1)
            if y in ("longshort", "hakam") and b in pf["portfel"] and kerak[y] and pf["portfel"][b].get("yon", 1) != yon_y:
                yop(pf, b, narx, sana, "yo'nalish o'zgardi")  # long <-> short almashadi
            if kerak[y] and b not in pf["portfel"]:
                och(pf, b, narx, sana, yon_y)
                if y == "hakam":
                    yubor(h, f"🧑‍⚖️🟢 {b}: {'long' if yon_y > 0 else 'short'} ochildi (shakl + miya hakam, sinov)\n"
                             f"Narx: {narx:g}. Sabab: {', '.join(SHAKL_NOMI[nm] for nm in hakam_sig)} yorildi, miya rozi ({p:+.2f})")
                if y == "ikkalasi":
                    miya_matn = f"miya ✅ {p:+.2f}" if p is not None else "miya ishlamadi"
                    yubor(h, f"🤖🟢 {b}: long ochildi\nNarx: {narx:g}, {ULUSH:.0f} USDT x{LEVERAGE}\n"
                             f"Sabab: trend ✅ (10 kunda {mom:+.1%}), {miya_matn}" + yangilik_qatori(h, b))
            elif not kerak[y] and b in pf["portfel"]:
                if y in ("ikkalasi", "yangilik"):
                    sabab = "trend tugadi" if not yangi else f"miya rozi emas ({p:+.2f})" if not miya_ha else \
                            f"yangiliklar salbiy ({yb:+.1f})"
                elif y == "longshort":
                    sabab = "signal tugadi"
                elif y == "short":
                    sabab = f"miya endi tushish kutmayapti ({p:+.2f})" if p is not None else "miya yo'q"
                elif y == "hakam":
                    sabab = "shakldan keyin 2 kun o'tdi"
                elif y in ("ikki_tub", "qoida_tub"):
                    sabab = "ikki tubdan keyin 2 kun o'tdi" if y == "ikki_tub" or not yangi else "trend tugadi"
                else:
                    sabab = "trend tugadi" if y in ("qoida", "qoida_iz") else f"miya salbiy ({p:+.2f})" if p is not None else "miya yo'q"
                foyda = yop(pf, b, narx, sana, sabab)
                if y == "hakam":
                    yubor(h, f"🧑‍⚖️🔴 {b}: yopildi, natija {foyda:+.2f} USDT ({sabab})")
                if y == "ikkalasi":
                    yubor(h, f"🤖🔴 {b}: yopildi\nNarx: {narx:g}, natija {foyda:+.2f} USDT\nSabab: {sabab}"
                             + yangilik_qatori(h, b))
            if y == "hakam" and hakam_sig and b in pf["portfel"]:
                pf["portfel"][b]["signal_sana"] = sana  # yangi shakl: 2 kun shu shamdan qayta sanaladi
    oltin_tekshir(h, sana)
    h["oxirgi_sana"] = sana
    if birinchi:
        tugash = time.strftime("%Y-%m-%d", time.gmtime(time.time() + SINOV_KUN * 86400))
        yubor(h, f"🤖 Avto rejim boshlandi: bot {len(SIGNAL_BELGILAR)} ta tangada o'zi savdo qiladi (qog'ozda). "
                 f"Sinov muddati: {tugash} gacha.\n3 xil yo'l parallel yoziladi, har biriga {BOSHLANG_ICH_PUL:.0f} USDT: "
                 f"faqat qoida, faqat miya, qoida + miya (asosiy). Bu yerga asosiy yo'l savdolari yoziladi, "
                 f"har hafta uchalasi solishtirilgan hisobot keladi. /hisobot, /rasm, /holat, /jurnal, /yangilik\n\n" + holat_matni(h))
    if time.time() - h.get("oxirgi_hisobot", 0) >= 7 * 86400:
        h["oxirgi_hisobot"] = time.time()
        yubor(h, "📊 Haftalik hisobot\n" + hisobot_matni(h))
        try:
            rasm_yubor(h, natijalar)
        except Exception as xato:
            print("rasm:", xato)


# ---------- Qog'oz portfel ----------

def natija_usdt(p, narx):
    return max(p.get("yon", 1) * p["miqdor"] * (narx - p["kirish_narx"]), -ULUSH)


def och(pf, b, narx, sana, yon=1):
    """yon: 1 = long, -1 = short."""
    kom = ULUSH * LEVERAGE * KOMISSIYA
    pf["portfel"][b] = {"miqdor": ULUSH * LEVERAGE / narx, "kirish_narx": narx, "kirish_sana": sana}
    if yon == -1:
        pf["portfel"][b]["yon"] = -1
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
        pf = h["portfellar"].get(y)
        if pf is None:  # yangi qo'shilgan yo'l keyingi 4 soatlik shamdan boshlanadi
            continue
        j, pul = pf["jurnal"], jami_pul(h, pf)
        yutuq = sum(x["foyda"] > 0 for x in j)
        qatorlar += ["", f"{nom}: {pul:.2f} USDT ({pul / BOSHLANG_ICH_PUL - 1:+.1%})",
                     f"  savdolar {len(j)} (foydali {yutuq}, zararli {len(j) - yutuq}), komissiya {pf['komissiya']:.2f}",
                     f"  ochiq: {', '.join(pf['portfel']) or 'yo`q'}"]
    if {"qoida", "short"} <= h["portfellar"].keys():  # teskari ishlaydigan ikki yo'lga pulni teng bo'lish
        pul = (jami_pul(h, h["portfellar"]["qoida"]) + jami_pul(h, h["portfellar"]["short"])) / 2
        qatorlar += ["", f"⚖️ Yarmi faqat qoida + yarmi miya short: {pul:.2f} USDT ({pul / BOSHLANG_ICH_PUL - 1:+.1%})"]
    if {"qoida", "miya", "longshort"} <= h["portfellar"].keys():  # oldingi ma'lumot bilan halol tanlangan birikma
        pul = sum(jami_pul(h, h["portfellar"][y]) for y in ("qoida", "miya", "longshort")) / 3
        qatorlar += [f"🔀 Uchga bo'lib (faqat qoida + faqat miya + asosiy+short): {pul:.2f} USDT ({pul / BOSHLANG_ICH_PUL - 1:+.1%})"]
    if {"qoida_tub", "miya", "longshort"} <= h["portfellar"].keys():
        pul = sum(jami_pul(h, h["portfellar"][y]) for y in ("qoida_tub", "miya", "longshort")) / 3
        qatorlar += [f"🔲 Uchga bo'lib, qoida o'rniga qoida yoki ikki tub: {pul:.2f} USDT ({pul / BOSHLANG_ICH_PUL - 1:+.1%})"]
    if {"qoida", "miya", "longshort", "oltin"} <= h["portfellar"].keys():  # oltin yo'li butun pulga (x5) keltiriladi
        komb = sum(jami_pul(h, h["portfellar"][y]) for y in ("qoida", "miya", "longshort")) / 3
        oltin = BOSHLANG_ICH_PUL + 5 * (jami_pul(h, h["portfellar"]["oltin"]) - BOSHLANG_ICH_PUL)
        pul = 0.8 * komb + 0.2 * oltin
        qatorlar += [f"🥇 80% uchga bo'lish + 20% oltin: {pul:.2f} USDT ({pul / BOSHLANG_ICH_PUL - 1:+.1%})"]
    return "\n".join(qatorlar)


def jurnal_matni(h):
    pf = h["portfellar"]["ikkalasi"]
    ochiq = [f"{b}: {p['kirish_sana']} dan beri ochiq ({p['kirish_narx']:g})" for b, p in pf["portfel"].items()]
    yopiq = [f"{j['belgi']}: {j['kirish_sana']} -> {j['chiqish_sana']}, {j['foyda']:+.2f} USDT ({j['sabab']})"
             for j in pf["jurnal"][-10:][::-1]]
    return "Asosiy yo'l (qoida + miya):\n" + ("\n".join(ochiq + yopiq) or "Hali savdo yo'q.")


def yangilanishlar(h, kutish=0):
    """kutish > 0: Telegram yangi xabarni shuncha soniyagacha kutadi (long polling), kelishi bilan javob beriladi."""
    for u in tg("getUpdates", offset=h["update_id"] + 1, timeout=kutish):
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
            elif matn.startswith("/ai"):
                yubor(h, ai_matni(h))
            elif matn.startswith("/yangilik"):
                yubor(h, yangilik_matni(h))
            elif matn.startswith(("/toxtat", "/davom")) and u["message"]["chat"]["id"] == h["chat_id"]:
                h["ijro_toxtat"] = matn.startswith("/toxtat")  # real pul ijrochisi (ijro.py) shuni o'qiydi
                yubor(h, "⏸ Real savdo to'xtatilmoqda: ijrochi hammasini yopadi." if h["ijro_toxtat"] else
                         "▶️ Real savdo qayta yoqilmoqda.")
            elif matn.startswith("/rasm"):
                try:
                    rasm_yubor(h) if h.get("portfellar") else yubor(h, "Hali savdo yo'q.")
                except Exception as xato:
                    yubor(h, f"Rasmni chizib bo'lmadi: {xato}")
            elif matn.startswith("/hisobot"):
                yubor(h, hisobot_matni(h) if h.get("portfellar") else "Avto rejim keyingi 4 soatlik shamda boshlanadi.")


def main():
    h = json.loads(HOLAT_FAYL.read_text(encoding="utf-8")) if HOLAT_FAYL.exists() else {}
    for k, v in [("chat_id", None), ("update_id", 0), ("oxirgi_sana", None), ("holat", {}),
                 ("narx", {})]:
        h.setdefault(k, v)
    boshi = time.time()
    saqla = lambda: HOLAT_FAYL.write_text(json.dumps(h, ensure_ascii=False, indent=1), encoding="utf-8")
    try:
        yangilanishlar(h)
        if h.get("chat_id"):
            signallarni_tekshir(h)
            ai_tekshir(h)
        saqla()
        while (qoldi := TINGLASH - (time.time() - boshi)) > 3:  # buyruqlarga darhol javob berish uchun kutib turamiz
            yangilanishlar(h, int(min(qoldi, 25)))
            saqla()
    finally:
        saqla()


if __name__ == "__main__":
    main()
