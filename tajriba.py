"""Tajriba xotirasi: hozirgi holatga eng o'xshash o'tgan holatlar (10 tanga, 2022-10 dan beri) va ulardan keyin
narx nima bo'lgani. O'xshashlik miya.py dagi treyder strukturasi belgilari bo'yicha o'lchanadi; faqat natijasi
o'sha paytda allaqachon ma'lum bo'lgan holatlar olinadi.
"""

import calendar
import json
import time
import urllib.request

import numpy as np

import miya

BELGILAR = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK", "LTC"]
NARX_MANBALARI = ["https://data-api.binance.vision", "https://api.binance.com"]
BOSH_MS = 1666051200000  # 2022-10-18
# struktura, qarshilik/tayanchgacha, sinish, RSI, EMA 50/150/600, diapazon, 24 sham, volatillik, hajm
TANLOV = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 4, 3]
K, H2, H7 = 50, 12, 42


def tarix(belgi):
    """[(vaqt, o, h, l, c, v)]: 2022-10 dan hozirgacha yopilgan 4 soatlik shamlar."""
    for manba in NARX_MANBALARI:
        try:
            natija, since = [], BOSH_MS
            while True:
                url = f"{manba}/api/v3/klines?symbol={belgi}USDT&interval=4h&limit=1000&startTime={since}"
                with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "treyder-ai"}),
                                            timeout=30) as j:
                    s = [k for k in json.load(j) if k[6] < time.time() * 1000]
                natija += [(time.strftime("%Y-%m-%d %H:00", time.gmtime(k[0] / 1000)), *map(float, k[1:6])) for k in s]
                if len(s) < 999:
                    return natija
                since = s[-1][0] + 1
        except Exception as xato:
            print(f"{manba} {belgi}: {xato}")
    raise RuntimeError(f"{belgi} tarixini olib bo'lmadi")


class Xotira:
    def __init__(self, shamlar):
        """shamlar: {belgi: [(vaqt, o, h, l, c, v)]} uzoq tarix."""
        umumiy = sorted(set.intersection(*({s[0] for s in q} for q in shamlar.values())))
        u = set(umumiy)
        tanla = {b: [s[1:] for s in q if s[0] in u] for b, q in shamlar.items()}
        x, self.belgilar = miya.belgilar_jadvali(tanla, len(umumiy))
        self.vaqtlar = umumiy
        self.f = x[:, :, TANLOV]
        c = np.log(np.array([[s[3] for s in tanla[b]] for b in self.belgilar]).T)
        self.k2 = np.full_like(c, np.nan)
        self.k7 = np.full_like(c, np.nan)
        self.k2[:-H2] = c[H2:] - c[:-H2]
        self.k7[:-H7] = c[H7:] - c[:-H7]

    def soraq(self, belgi, vaqt):
        """`vaqt` dagi shamga o'xshash o'tgan holatlar statistikasi (shu paytgacha ma'lum natijalar bilan)."""
        if vaqt not in self.vaqtlar:
            return None
        t = self.vaqtlar.index(vaqt)
        oxir = t - H7  # 1 haftalik natija ham t gacha ma'lum bo'lsin
        if oxir < 1100:
            return None
        tar = self.f[600:oxir].reshape(-1, self.f.shape[-1])
        k2 = self.k2[600:oxir].reshape(-1)
        k7 = self.k7[600:oxir].reshape(-1)
        q = self.f[t, self.belgilar.index(belgi)]
        eng = np.argpartition(((tar - q) ** 2).sum(1), K)[:K]
        return {
            "o'xshash_holatlar_soni": K,
            "2_kundan_keyin_o'sganlar_%": round(float((k2[eng] > 0).mean() * 100)),
            "2_kunlik_o'rtacha_o'zgarish_%": round(float(np.expm1(k2[eng]).mean() * 100), 2),
            "1_haftadan_keyin_o'sganlar_%": round(float((k7[eng] > 0).mean() * 100)),
            "1_haftalik_o'rtacha_o'zgarish_%": round(float(np.expm1(k7[eng]).mean() * 100), 2),
        }


def qorquv_tarixi():
    """{sana: Fear & Greed qiymati} (0 = juda qo'rquv, 100 = juda ochko'zlik)."""
    try:
        with urllib.request.urlopen(urllib.request.Request("https://api.alternative.me/fng/?limit=0",
                                                           headers={"User-Agent": "treyder-ai"}), timeout=30) as j:
            return {time.strftime("%Y-%m-%d", time.gmtime(int(d["timestamp"]))): int(d["value"])
                    for d in json.load(j)["data"]}
    except Exception as xato:
        print("Fear & Greed:", xato)
        return {}


def qorquv(tarix_, vaqt):
    """Sham yopilgan kungacha e'lon qilingan oxirgi qiymat (kunlik qiymat ertasiga ma'lum deb olinadi)."""
    kun = time.strftime("%Y-%m-%d", time.gmtime(calendar.timegm(time.strptime(vaqt[:10], "%Y-%m-%d")) - 86400))
    return tarix_.get(kun)
