"""Bir martalik: Binance'dagi eng ko'p savdo qilinadigan ~120 ta USDT juftligining 4 soatlik tarixini yuklaydi."""
import csv, gzip, json, time, urllib.request

API = "https://data-api.binance.vision/api/v3"
BOSH = int(time.mktime(time.strptime("2022-10-18", "%Y-%m-%d")) * 1000)
STABIL = {"USDC", "FDUSD", "TUSD", "USDP", "DAI", "EUR", "BUSD", "AEUR", "USDE", "XUSD", "USD1", "PAXG", "WBTC",
          "WBETH", "BFUSD", "EURI", "RLUSD", "USDS"}
ASOSIY = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK", "LTC"]


def ol(url):
    for i in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "treyder"}), timeout=30) as j:
                return json.load(j)
        except Exception as x:
            print("qayta:", url, x)
            time.sleep(3 * (i + 1))
    raise RuntimeError(url)


tick = ol(f"{API}/ticker/24hr")
juft = [(float(t["quoteVolume"]), t["symbol"][:-4]) for t in tick if t["symbol"].endswith("USDT")]
juft = [b for v, b in sorted(juft, reverse=True) if b not in STABIL and not b.endswith(("UP", "DOWN", "BULL", "BEAR"))]
belgilar = ASOSIY + [b for b in juft if b not in ASOSIY][:110]
jami = 0
with gzip.open("4h.csv.gz", "wt", newline="") as f:
    w = csv.writer(f)
    w.writerow(["belgi", "vaqt", "o", "h", "l", "c", "v"])
    for b in belgilar:
        since, n = BOSH, 0
        while True:
            s = ol(f"{API}/klines?symbol={b}USDT&interval=4h&limit=1000&startTime={since}")
            s = [k for k in s if k[6] < time.time() * 1000]
            for k in s:
                w.writerow([b, k[0], *k[1:6]])
            n += len(s)
            if len(s) < 999:
                break
            since = s[-1][0] + 1
            time.sleep(0.2)
        jami += n
        print(b, n, flush=True)
json.dump({"belgilar": belgilar, "hajm_tartibi": juft[:150]}, open("royxat.json", "w"))
print("jami", jami)
