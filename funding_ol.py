# Binance USDT-M funding tarixi (data.binance.vision oylik fayllari) + spot va futures 8h narx
import urllib.request, zipfile, io, csv, os, json
H = {"User-Agent": "Mozilla/5.0"}
os.makedirs("funding", exist_ok=True); hisob = {}
oylar = [f"{y}-{m:02d}" for y in range(2022, 2027) for m in range(1, 13) if f"{y}-{m:02d}" <= "2026-09"]
for s in ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT", "ADAUSDT", "LINKUSDT", "AVAXUSDT", "LTCUSDT"]:
    qator, xato = [], 0
    for oy in oylar:
        u = f"https://data.binance.vision/data/futures/um/monthly/fundingRate/{s}/{s}-fundingRate-{oy}.zip"
        try:
            z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=30).read()))
            for r in csv.reader(io.TextIOWrapper(z.open(z.namelist()[0]))):
                if r and r[0][0].isdigit(): qator.append(r)
        except Exception:
            xato += 1
    with open(f"funding/{s}.csv", "w", newline="") as f: csv.writer(f).writerows(qator)
    hisob[s] = f"{len(qator)} qator, {xato} oy topilmadi"
json.dump(hisob, open("funding/hisobot.json", "w"), indent=1); print(hisob)
