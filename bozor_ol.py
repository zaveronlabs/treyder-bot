# Kriptodan tashqari bozorlar tarixi (kunlik) + Binance futuresda qaysilari bor
import json, urllib.request, urllib.parse, time, csv, os
H = {"User-Agent": "Mozilla/5.0"}
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=30).read()
YAH = {"kumush": "SI=F", "oltin_f": "GC=F", "neft": "CL=F", "gaz": "NG=F", "mis": "HG=F", "sp500": "^GSPC", "nasdaq": "^NDX",
       "nikkei": "^N225", "dax": "^GDAXI", "obligatsiya": "TLT", "dollar": "DX-Y.NYB", "eurusd": "EURUSD=X", "yen": "JPY=X",
       "bugdoy": "ZW=F", "platina": "PL=F"}
os.makedirs("bozor", exist_ok=True); hisobot = {}
for nom, s in YAH.items():
    try:
        j = json.loads(get(f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(s)}?period1=1546300800&period2={int(time.time())}&interval=1d"))
        r = j["chart"]["result"][0]; ts = r["timestamp"]; q = r["indicators"]["quote"][0]
        with open(f"bozor/{nom}.csv", "w", newline="") as f:
            w = csv.writer(f); w.writerow(["t", "o", "h", "l", "c"])
            for i, t in enumerate(ts):
                if q["close"][i] is not None: w.writerow([t, q["open"][i], q["high"][i], q["low"][i], q["close"][i]])
        hisobot[nom] = f"{len(ts)} kun"
    except Exception as e:
        hisobot[nom] = "xato " + repr(e)[:100]
for u in ["https://fapi.binance.com/fapi/v1/exchangeInfo", "https://www.binance.com/fapi/v1/exchangeInfo"]:
    try:
        j = json.loads(get(u)); syms = [x["symbol"] for x in j["symbols"] if x.get("status") == "TRADING"]
        hisobot["binance_futures_soni"] = len(syms)
        hisobot["binance_nokripto"] = [x["symbol"] + ":" + x.get("underlyingType", "") + ":" + ",".join(x.get("underlyingSubType", [])) for x in j["symbols"]
                                       if x.get("status") == "TRADING" and (x.get("underlyingType") not in ("COIN",) or any(k in x["symbol"] for k in ("XAU", "XAG", "PAXG")))]
        break
    except Exception as e:
        hisobot["binance_" + u.split("/")[2]] = "xato " + repr(e)[:100]
for s in ["XAUUSDT", "XAGUSDT", "PAXGUSDT", "TSLAUSDT", "SPXUSDT"]:
    try:
        x = get(f"https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/monthly/klines/{s}/4h/").decode()
        hisobot["vision_" + s] = x.count("<Key>")
    except Exception as e:
        hisobot["vision_" + s] = "xato " + repr(e)[:80]
json.dump(hisobot, open("bozor/hisobot.json", "w"), indent=1, ensure_ascii=False)
print(json.dumps(hisobot, indent=1, ensure_ascii=False)[:3000])
