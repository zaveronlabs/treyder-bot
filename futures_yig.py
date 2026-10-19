"""Futures bozorining "ichki ma'lumoti"ni yig'ish (Gate.io, GitHub'dan ochiq): ochiq pozitsiyalar hajmi,
longchi/shortchi nisbatlari, likvidatsiyalar, funding. Gate faqat oxirgi ~330 kunlik 4 soatlik va ~3 yillik
kunlik tarixni beradi, shuning uchun oyda bir marta yangilarini futures_malumot/ ga qo'shib boramiz:
keyinchalik miyani shu ma'lumotda ham o'qitish uchun.
"""

import csv
import json
import time
import urllib.request
from pathlib import Path

BELGILAR = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK", "LTC"]
MAYDONLAR = ["time", "open_interest_usd", "lsr_account", "lsr_taker", "top_lsr_size", "top_lsr_account",
             "long_liq_usd", "short_liq_usd", "long_taker_size", "short_taker_size", "mark_price", "last_funding_rate"]
PAPKA = Path(__file__).with_name("futures_malumot")


def ol(belgi, oraliq):
    url = f"https://api.gateio.ws/api/v4/futures/usdt/contract_stats?contract={belgi}_USDT&interval={oraliq}&limit=2000"
    for urinish in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "treyder-bot"}), timeout=30) as j:
                return json.load(j)
        except Exception as xato:
            print(belgi, oraliq, xato)
            time.sleep(5)
    return []


def qosh(belgi, oraliq):
    fayl = PAPKA / f"{belgi}_{oraliq}.csv"
    eski = {}
    if fayl.exists():
        with open(fayl) as f:
            eski = {int(q["time"]): q for q in csv.DictReader(f)}
    for q in ol(belgi, oraliq):
        eski[int(q["time"])] = {k: q.get(k, "") for k in MAYDONLAR}
    with open(fayl, "w", newline="") as f:
        w = csv.DictWriter(f, MAYDONLAR)
        w.writeheader()
        w.writerows(eski[t] for t in sorted(eski))
    return len(eski)


if __name__ == "__main__":
    PAPKA.mkdir(exist_ok=True)
    for b in BELGILAR:
        print(b, {o: qosh(b, o) for o in ("4h", "1d")})
