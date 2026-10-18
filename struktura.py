"""Treyder strukturalari: grafikda tajribali treyder qaraydigan narsalarni aniq hisoblaydi (faqat standart kutubxona).

Kirish: [(vaqt, o, h, l, c, v)] yopilgan shamlar (eskisi birinchi). Natija: raqamli faktlar lug'ati,
uni AI treyder (til modeli) o'qib, xulosa qiladi.
"""

K = 5  # swing: chap va o'ngda K shamdan baland/past bo'lgan nuqta


def ema_qator(narxlar, n):
    k, e, natija = 2 / (n + 1), narxlar[0], []
    for c in narxlar:
        e = c * k + e * (1 - k)
        natija.append(e)
    return natija


def rsi(narxlar, n=14):
    osish = tushish = 0.0
    for i in range(1, len(narxlar)):
        d = narxlar[i] - narxlar[i - 1]
        osish = (osish * (n - 1) + max(d, 0)) / n
        tushish = (tushish * (n - 1) + max(-d, 0)) / n
    return 100.0 if tushish == 0 else 100 - 100 / (1 + osish / tushish)


def swinglar(shamlar):
    """Tasdiqlangan cho'qqilar va tublar: ([(i, narx)], [(i, narx)])."""
    yuqori, past = [], []
    for i in range(K, len(shamlar) - K):
        oyna = shamlar[i - K:i + K + 1]
        if shamlar[i][2] == max(s[2] for s in oyna):
            yuqori.append((i, shamlar[i][2]))
        if shamlar[i][3] == min(s[3] for s in oyna):
            past.append((i, shamlar[i][3]))
    return yuqori, past


def kunlik(shamlar):
    """4 soatlik shamlarni UTC kunlarga yig'adi (oxirgi tugallanmagan kun ham kiradi)."""
    kunlar = {}
    for vaqt, o, h, l, c, v in shamlar:
        k = vaqt[:10]
        if k not in kunlar:
            kunlar[k] = [k, o, h, l, c, v]
        else:
            q = kunlar[k]
            q[2], q[3], q[4], q[5] = max(q[2], h), min(q[3], l), c, q[5] + v
    return [tuple(q) for q in kunlar.values()]


def tahlil(shamlar):
    c = [s[4] for s in shamlar]
    narx = c[-1]
    e50, e150, e600 = (ema_qator(c, n)[-1] for n in (50, 150, 600))
    yuqori, past = swinglar(shamlar)
    yq, ps = yuqori[-3:], past[-3:]
    if len(yq) >= 2 and len(ps) >= 2:
        hh, hl = yq[-1][1] > yq[-2][1], ps[-1][1] > ps[-2][1]
        struktura = ("ko'tariluvchi (HH+HL)" if hh and hl else "tushuvchi (LH+LL)" if not hh and not hl
                     else "aralash (HH+LL)" if hh else "aralash (LH+HL)")
    else:
        struktura = "noma'lum"
    darajalar = [p for _, p in yuqori[-12:] + past[-12:]]
    ustida = [p for p in darajalar if p > narx * 1.002]
    ostida = [p for p in darajalar if p < narx * 0.998]
    qarshilik = min(ustida) if ustida else max(s[2] for s in shamlar[-120:])
    tayanch = max(ostida) if ostida else min(s[3] for s in shamlar[-120:])
    tr = [max(s[2], c[i - 1]) - min(s[3], c[i - 1]) for i, s in enumerate(shamlar) if i > 0]
    hajm = [s[5] for s in shamlar]
    oxirgi_cho_qqi = yq[-1][1] if yq else None
    oxirgi_tub = ps[-1][1] if ps else None
    return {
        "narx": narx,
        "trend_qoidasi": bool(narx > e150 and narx > c[-61] and narx > e600),
        "ema50_ga_nisbatan_%": round((narx / e50 - 1) * 100, 2),
        "ema150_ga_nisbatan_%": round((narx / e150 - 1) * 100, 2),
        "ema600_ga_nisbatan_%": round((narx / e600 - 1) * 100, 2),
        "struktura": struktura,
        "oxirgi_3_cho'qqi": [round(p, 6) for _, p in yq],
        "oxirgi_3_tub": [round(p, 6) for _, p in ps],
        "eng_yaqin_qarshilik": round(qarshilik, 6),
        "qarshilikkacha_%": round((qarshilik / narx - 1) * 100, 2),
        "eng_yaqin_tayanch": round(tayanch, 6),
        "tayanchgacha_%": round((tayanch / narx - 1) * 100, 2),
        "sinish": ("oxirgi cho'qqi yuqoriga sindi" if oxirgi_cho_qqi and narx > oxirgi_cho_qqi else
                   "oxirgi tub pastga sindi" if oxirgi_tub and narx < oxirgi_tub else "yo'q"),
        "rsi14": round(rsi(c[-300:]), 1),
        "atr14_%": round(sum(tr[-14:]) / 14 / narx * 100, 2),
        "hajm_oxirgi6_ga_o'rtacha50_nisbati": round(sum(hajm[-6:]) / 6 / (sum(hajm[-50:]) / 50), 2),
        "o'zgarish_1_shamda_%": round((narx / c[-2] - 1) * 100, 2),
        "o'zgarish_6_shamda_%": round((narx / c[-7] - 1) * 100, 2),
        "o'zgarish_42_shamda_%": round((narx / c[-43] - 1) * 100, 2),
    }


def kunlik_tahlil(shamlar):
    k = kunlik(shamlar)
    c = [s[4] for s in k]
    yuqori, past = swinglar(k)
    yq, ps = yuqori[-2:], past[-2:]
    if len(yq) == 2 and len(ps) == 2:
        hh, hl = yq[1][1] > yq[0][1], ps[1][1] > ps[0][1]
        struktura = "ko'tariluvchi" if hh and hl else "tushuvchi" if not hh and not hl else "aralash"
    else:
        struktura = "noma'lum"
    return {
        "kunlik_struktura": struktura,
        "kunlik_ema50_ga_nisbatan_%": round((c[-1] / ema_qator(c, 50)[-1] - 1) * 100, 2),
        "kunlik_ema200_ga_nisbatan_%": round((c[-1] / ema_qator(c, 200)[-1] - 1) * 100, 2),
        "kunlik_rsi14": round(rsi(c[-200:]), 1),
        "o'zgarish_30_kunda_%": round((c[-1] / c[-31] - 1) * 100, 2),
    }
