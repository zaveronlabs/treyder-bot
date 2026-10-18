"""AI treyder: katta ochiq til modeli (Qwen 2.5 14B, Ollama orqali shu serverda) har 4 soatlik sham yopilganda
5 ta tanganing grafik strukturalarini (struktura.py), trend qoidasi, miya fikri va yangiliklarni o'qib, tajribali
futures treyder kabi qaror qiladi: long yoki kutish (short ixtiyoriy, hozircha faqat sinovda).

Natija treyder_ai.json ga yoziladi: {"sham", "vaqt", "model", "tangalar": {belgi: {"qaror", "ishonch", "sabablar"}}}.
Model o'z tahlilini (inglizcha) yozadi; Telegram uchun o'zbekcha sabablar kod tomonidan aniq raqamlardan olinadi.
"""

import json
import os
import sys
import time
import urllib.request

import struktura
import tajriba

BELGILAR = ("BTC", "ETH", "SOL", "BNB", "XRP")
NARX_MANBALARI = ["https://data-api.binance.vision", "https://api.binance.com"]
OLLAMA = os.environ.get("OLLAMA_URL", "http://localhost:11434")
MODEL = os.environ.get("TREYDER_MODEL", "qwen2.5:14b")
FAYL = "treyder_ai.json"
SABABLAR = {
    "trend_yuqori": "trend yuqoriga",
    "trend_past": "trend pastga",
    "struktura_ijobiy": "cho'qqi va tublar ko'tarilmoqda",
    "struktura_salbiy": "cho'qqi va tublar pasaymoqda",
    "qarshilik_yaqin": "narx qarshilik darajasiga yaqin",
    "tayanch_yaqin": "narx tayanch darajasiga yaqin",
    "sinish_yuqori": "qarshilik yuqoriga sindirildi",
    "sinish_past": "tayanch pastga sindirildi",
    "rsi_juda_baland": "RSI juda baland, narx qizib ketgan",
    "rsi_juda_past": "RSI juda past, narx ko'p tushgan",
    "hajm_oshmoqda": "savdo hajmi oshmoqda",
    "hajm_kam": "savdo hajmi kam",
    "kunlik_ijobiy": "kunlik grafik ham yuqoriga",
    "kunlik_salbiy": "kunlik grafik pastga",
    "miya_rozi": "miya ham o'sish kutyapti",
    "miya_qarshi": "miya tushish kutyapti",
    "yangilik_ijobiy": "yangiliklar ijobiy",
    "yangilik_salbiy": "yangiliklar salbiy",
    "bozor_kuchli": "umumiy bozor kuchli",
    "bozor_kuchsiz": "umumiy bozor kuchsiz",
    "juda_tez_osgan": "narx juda tez o'sib ketgan, orqaga qaytishi mumkin",
    "noaniq": "aniq signal yo'q",
}


def faktlar(f):
    """Raqamlardan aniq faktlar: [(kod, +1 ijobiy / -1 salbiy)]."""
    natija = [("trend_yuqori", 1) if f["trend_qoidasi"] else ("trend_past", -1)]
    if f["struktura"].startswith("ko'tariluvchi"):
        natija.append(("struktura_ijobiy", 1))
    elif f["struktura"].startswith("tushuvchi"):
        natija.append(("struktura_salbiy", -1))
    if f["sinish"].startswith("oxirgi cho'qqi"):
        natija.append(("sinish_yuqori", 1))
    elif f["sinish"].startswith("oxirgi tub"):
        natija.append(("sinish_past", -1))
    if f["qarshilikkacha_%"] < 1.5:
        natija.append(("qarshilik_yaqin", -1))
    if f["tayanchgacha_%"] > -1.5:
        natija.append(("tayanch_yaqin", 1))
    if f["rsi14"] > 70:
        natija.append(("rsi_juda_baland", -1))
    elif f["rsi14"] < 30:
        natija.append(("rsi_juda_past", 1))
    if f["hajm_oxirgi6_ga_o'rtacha50_nisbati"] > 1.3:
        natija.append(("hajm_oshmoqda", 1))
    elif f["hajm_oxirgi6_ga_o'rtacha50_nisbati"] < 0.7:
        natija.append(("hajm_kam", -1))
    if f["kunlik_struktura"] == "ko'tariluvchi":
        natija.append(("kunlik_ijobiy", 1))
    elif f["kunlik_struktura"] == "tushuvchi":
        natija.append(("kunlik_salbiy", -1))
    if f.get("miya_bashorati") is not None:
        natija.append(("miya_rozi", 1) if f["miya_bashorati"] > 0 else ("miya_qarshi", -1))
    if (f.get("yangiliklar_bahosi") or 0) >= 0.2:
        natija.append(("yangilik_ijobiy", 1))
    elif (f.get("yangiliklar_bahosi") or 0) <= -0.2:
        natija.append(("yangilik_salbiy", -1))
    if f["o'zgarish_42_shamda_%"] > 25:
        natija.append(("juda_tez_osgan", -1))
    return natija


def sabablar(f, qaror):
    """Qarorni qo'llab-quvvatlovchi faktlar (eng ko'pi 4 ta)."""
    ishora = 1 if qaror == "long" else -1
    return [k for k, x in faktlar(f) if x == ishora][:4] or ["noaniq"]


def http(url, malumot=None, vaqt=30):
    so = urllib.request.Request(url, json.dumps(malumot).encode() if malumot else None,
                                {"User-Agent": "treyder-ai", "Content-Type": "application/json"})
    with urllib.request.urlopen(so, timeout=vaqt) as j:
        return json.load(j)


def yopilishlar(belgi):
    hozir = time.time() * 1000
    for manba in NARX_MANBALARI:
        try:
            url = f"{manba}/api/v3/klines?symbol={belgi}USDT&interval=4h&limit=1000"
            oxirgi = http(url)
            oldingi = http(f"{url}&endTime={oxirgi[0][0] - 1}")
            return [(time.strftime("%Y-%m-%d %H:00", time.gmtime(s[0] / 1000)), *map(float, s[1:6]))
                    for s in oldingi + oxirgi if s[6] < hozir]
        except Exception as xato:
            print(f"{manba} {belgi}: {xato}")
    raise RuntimeError(f"{belgi} narxini olib bo'lmadi")


def _oqi(fayl):
    try:
        with open(fayl) as f:
            return json.load(f)
    except Exception:
        return {}


def malumotlar():
    shamlar = {b: yopilishlar(b) for b in BELGILAR}
    sham = shamlar["BTC"][-1][0]
    holat, yangilik = _oqi("holat.json"), _oqi("yangilik.json")
    miya = holat.get("miya", {}) if holat.get("oxirgi_sana") == sham else {}
    try:
        xotira = tajriba.Xotira({b: tajriba.tarix(b) for b in tajriba.BELGILAR})
    except Exception as xato:
        print("tajriba xotirasi ishlamadi:", xato)
        xotira = None
    pozitsiyalar = holat.get("portfellar", {}).get("ai", {}).get("portfel", {})
    tangalar = tangalar_tuz(shamlar, miya, yangilik, xotira, pozitsiyalar, sham)
    return sham, tangalar, yangilik.get("bozor", {}).get("baho"), tajriba.qorquv(tajriba.qorquv_tarixi(), sham)


def pozitsiya_matni(p, narx):
    if not p:
        return "none (in cash)"
    return {"holat": "short ochiq" if p.get("yon") == -1 else "long ochiq",
            "kirish_narxi": p["kirish_narx"], "ochilgan_vaqt": p["kirish_sana"],
            "kirishdan_beri_narx_o'zgarishi_%": round((narx / p["kirish_narx"] - 1) * 100, 2)}


def tangalar_tuz(shamlar, miya, yangilik, xotira=None, pozitsiyalar=None, sham=None):
    tangalar = {}
    for b, s in shamlar.items():
        f = struktura.tahlil(s) | struktura.kunlik_tahlil(s)
        if pozitsiyalar is not None:
            f["pozitsiya"] = pozitsiya_matni(pozitsiyalar.get(b), f["narx"])
        t = xotira.soraq(b, sham) if xotira else None
        if t:
            f["tajriba"] = t
        if b in miya:
            f["miya_bashorati"] = round(miya[b], 3)  # musbat: keyingi 2 kunda o'sish kutadi
        y = yangilik.get("tangalar", {}).get(b)
        if y:
            f["yangiliklar_bahosi"] = y["baho"]  # -1 .. +1
        tangalar[b] = f
    return tangalar


QOIDALAR = (
    "You are a professional crypto futures trader with 10+ years of experience and zero emotion. "
    "You trade 4-hour candles, long only, 2x leverage, holding positions from a few candles to a few weeks. "
    "Use classic price action and market structure: trend (EMA 50/150/600), higher highs/higher lows vs lower "
    "highs/lower lows, support and resistance, breakouts, RSI extremes (above 70 overbought, below 30 oversold), "
    "volume confirmation, daily timeframe alignment, the BTC/market context, plus the ML model forecast and news "
    "score when given. Protect capital first: go long only when the setup is clearly favorable; otherwise wait "
    "(stay in cash). Long-term backtests show the trend rule (trend_qoidasi=true) has a real edge, so do not "
    "fight a clean trend without a strong reason.\n"
    "Field names are Uzbek: narx=price, struktura=structure, cho'qqi=swing high, tub=swing low, "
    "qarshilik=resistance, tayanch=support, sinish=breakout, hajm=volume, o'zgarish=change, kunlik=daily, "
    "shamda=candles, miya_bashorati=ML forecast (positive = expects rise), yangiliklar_bahosi=news (-1..1).\n"
    "pozitsiya = your current position in this coin. If you already hold it, 'long' means keep holding and "
    "'kutish' means close it: keep a position while its trend and structure are intact and exit when the setup "
    "breaks; do not flip in and out on small noise (every trade costs fees). "
    "tajriba = your experience: statistics of the 50 most similar past situations (10 coins since 2022) and "
    "what happened next (o'sganlar_% = share that rose, o'rtacha_o'zgarish = average change). "
    "Fear & Greed index: 0 = extreme fear, 100 = extreme greed."
)


def _chat(sorov, sxema=None, uzunlik=None):
    so = {"model": MODEL, "stream": False, "options": {"temperature": 0, "num_ctx": 6144},
          "messages": [{"role": "user", "content": sorov}]}
    if sxema:
        so["format"] = sxema
    if uzunlik:
        so["options"]["num_predict"] = uzunlik
    return http(f"{OLLAMA}/api/chat", so, vaqt=1200)["message"]["content"]


SHORT_QOIDA = (
    "\nShorts are allowed: 'short' means open or keep a short position (profit when price falls). Backtests show "
    "naive shorting loses money in crypto (strong long-term up drift, short squeezes), so short only in a clear "
    "downtrend: price below EMA 150 and 600, lower highs and lower lows, daily structure bearish, ML forecast "
    "negative. Close shorts quickly when the downtrend structure breaks. If you hold a short, 'short' keeps it, "
    "'long' flips to long and 'kutish' closes it."
)


def qaror_ber(sham, tangalar, bozor_yangilik, qorquv=None, faqat=None, bahs=False, short=False):
    """Har tanga uchun alohida so'rov: model avval qisqa tahlil yozadi, keyin qaror qiladi."""
    sxema = {
        "type": "object", "required": ["tahlil", "qaror", "ishonch"],
        "properties": {
            "tahlil": {"type": "string"},
            "qaror": {"type": "string", "enum": ["long", "short", "kutish"] if short else ["long", "kutish"]},
            "ishonch": {"type": "integer", "minimum": 0, "maximum": 100},
        },
    }
    natija = {}
    for b, f in tangalar.items():
        if faqat and b not in faqat:
            continue
        bozor = "" if b == "BTC" else (
            "Market context (BTC): " + json.dumps({k: tangalar["BTC"][k] for k in (
                "trend_qoidasi", "struktura", "kunlik_struktura", "o'zgarish_6_shamda_%", "o'zgarish_42_shamda_%")},
                ensure_ascii=False) + "\n")
        malumot = (
            f"Last closed 4h candle: {sham} UTC. Market news score: {bozor_yangilik}. "
            f"Fear & Greed: {qorquv}.\n{bozor}"
            f"{b}/USDT data:\n{json.dumps(f, ensure_ascii=False, indent=1)}\n\n"
        )
        t0 = time.time()
        dalillar = ""
        if bahs:  # bahs: bir tahlilchi o'sish, ikkinchisi tushish tarafini himoya qiladi, bosh treyder hal qiladi
            tomonlar = {"BULL": "the strongest honest case for being long this coin now",
                        "BEAR": "the strongest honest case against being long now (why it may fall or chop)"}
            for nom, vazifa in tomonlar.items():
                matn = _chat(f"{QOIDALAR}\n\n{malumot}You are the {nom} analyst on the desk. In 3-4 sentences, "
                             f"argue {vazifa}, citing specific numbers from the data.", uzunlik=220)
                dalillar += f"{nom} analyst: {matn.strip()}\n\n"
            dalillar = "Your analysts argued:\n\n" + dalillar + "Weigh both sides as the head trader.\n"
        qoidalar = QOIDALAR + (SHORT_QOIDA if short else "")
        sorov = (
            f"{qoidalar}\n\n{malumot}{dalillar}"
            "First write 'tahlil': 3-5 sentences reading this specific chart like a trader (trend, structure, "
            "where price sits between support and resistance, momentum, risk). Then 'qaror': "
            + ("\"long\", \"short\" or \"kutish\" (wait)" if short else "\"long\" or \"kutish\" (wait)")
            + " and 'ishonch': confidence 0-100. Answer only JSON."
        )
        natija[b] = json.loads(_chat(sorov, sxema))
        natija[b]["sabablar"] = sabablar(f, natija[b]["qaror"])
        print(f"{b}: {time.time() - t0:.0f}s, {natija[b]['qaror']} ({natija[b]['ishonch']}%): {natija[b]['tahlil']}",
              flush=True)
    return natija


def main():
    sham, tangalar, bozor_yangilik, qorquv = malumotlar()
    qarorlar = qaror_ber(sham, tangalar, bozor_yangilik, qorquv)
    natija = {"sham": sham, "vaqt": time.strftime("%Y-%m-%d %H:%M", time.gmtime()), "model": MODEL,
              "tangalar": {b: q | {"narx": tangalar[b]["narx"]} for b, q in qarorlar.items()}}
    print(json.dumps(natija, ensure_ascii=False, indent=1))
    if len(qarorlar) < len(BELGILAR):
        sys.exit(1)
    with open(FAYL, "w") as f:
        json.dump(natija, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
