"""Uzun tarix sinovi: miya 2019 dan (uzun) yoki 2022-10 dan (qisqa) o'qitilsa, test natijasi qanday o'zgaradi.
Ishlatish: python3 uzun_miya.py <fold 0..5> <uzun|qisqa>
"""
import json, sys, time, math, urllib.request
import numpy as np, pandas as pd, torch, torch.nn as nn, torch.nn.functional as F

torch.set_num_threads(4)
FOLD, VARIANT = int(sys.argv[1]), sys.argv[2]
TF = "4h"
L, H = 64, 12
D, QAT, BOSH, EPOX, BATCH = 64, 4, 4, 4, 256
TEST_BOSHI, QADAM_OY = "2024-01-01", 6
SEEDS = [0, 1, 2]
ORG_BOSHI = pd.Timestamp("2022-10-18 20:00" if VARIANT == "qisqa" else "2019-01-01")
# yangi: uzun + bozorlararo belgilar + vaqt; kesishma: uzun + faqat bozorlararo belgilar


def yukla(b):
    natija, since = [], 1546300800000
    while True:
        url = f"https://data-api.binance.vision/api/v3/klines?symbol={b}USDT&interval=4h&limit=1000&startTime={since}"
        for k in range(5):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "x"}), timeout=30) as j:
                    s = json.load(j); break
            except Exception as e:
                print(b, e); time.sleep(5)
        s = [k for k in s if k[0] < 1792238400000 + 1]  # 2026-10-17 12:00 gacha (sandbox bazasi bilan bir xil)
        natija += [(b + "/USDT", k[0], *map(float, k[1:6])) for k in s]
        if len(s) < 999: return natija
        since = s[-1][0] + 1


B10 = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK", "LTC"]
d = pd.DataFrame(sum((yukla(b) for b in B10), []), columns=["belgi", "vaqt", "open", "high", "low", "close", "hajm"])
d["t"] = pd.to_datetime(d.vaqt, unit="ms")
pv = lambda col: d.pivot(index="t", columns="belgi", values=col).sort_index()
o, h, l, c, v = (pv(x) for x in ["open", "high", "low", "close", "hajm"])
belgilar = list(c.columns)
r = np.log(c / c.shift(1))
vol = r.rolling(100, min_periods=50).std()
fe = {
    "r": r / vol,
    "hl": np.log(h / l) / vol,
    "oc": np.log(c / o) / vol,
    "v": np.log(v / v.rolling(50, min_periods=20).mean()),
    "vl": np.log(vol / vol.rolling(500, min_periods=100).mean()),
}
fe["btc"] = pd.DataFrame({b: fe["r"]["BTC/USDT"] for b in belgilar})
fe["bozor"] = pd.DataFrame({b: fe["r"].mean(axis=1) for b in belgilar})
# treyder strukturalari (faqat o'tmishga qaraydi): cho'qqi/tub (swing), tayanch/qarshilikka masofa, sinish, RSI, EMA
K = 5  # swing: K sham chap va o'ngda eng baland/past; K sham keyin tasdiqlanadi


def swing(seriya, eng):
    oyna = seriya.rolling(2 * K + 1).max() if eng == "max" else seriya.rolling(2 * K + 1).min()
    piv = seriya.shift(K).where(seriya.shift(K) == oyna)  # t-K dagi pivot, t da tasdiqlangan
    s1 = piv.ffill()
    s2 = pd.DataFrame({b: piv[b].dropna().shift(1).reindex(piv.index).ffill() for b in piv.columns})
    return s1, s2


sh1, sh2 = swing(h, "max")
sl1, sl2 = swing(l, "min")
fe["str"] = (np.sign(sh1 - sh2) + np.sign(sl1 - sl2)) / 2  # +1: ko'tariluvchi cho'qqi va tublar, -1: tushuvchi
fe["d_q"] = np.log(c / sh1) / vol / 5   # oxirgi qarshilikka masofa
fe["d_t"] = np.log(c / sl1) / vol / 5   # oxirgi tayanchga masofa
fe["sin"] = (c > sh1).astype(float) - (c < sl1).astype(float)  # sinish: yuqoriga +1, pastga -1
dlt = c.diff()
rs = dlt.clip(lower=0).ewm(alpha=1 / 14, adjust=False).mean() / (-dlt.clip(upper=0)).ewm(alpha=1 / 14, adjust=False).mean()
fe["rsi"] = ((100 - 100 / (1 + rs)) - 50) / 20
for n in (50, 150, 600):
    fe[f"e{n}"] = np.log(c / c.ewm(span=n, adjust=False).mean()) / vol / 10
mx, mn = h.rolling(20).max(), l.rolling(20).min()
fe["joy"] = (c - mn) / (mx - mn) * 2 - 1  # 20 shamlik diapazondagi o'rni
fe["r24"] = np.log(c / c.shift(24)) / (vol * math.sqrt(24))
if VARIANT in ("yangi", "kesishma"):
    g = pd.DataFrame(yukla("PAXG"), columns=["belgi", "vaqt", "open", "high", "low", "close", "hajm"])
    g["t"] = pd.to_datetime(g.vaqt, unit="ms")
    gc = g.set_index("t").close.reindex(c.index)
    gr = np.log(gc / gc.shift(1)); gv = gr.rolling(100, min_periods=50).std()
    hamma = lambda s: pd.DataFrame({b: s for b in belgilar})
    fe["oltin"] = hamma((gr / gv).fillna(0))                                   # oltin harakati
    fe["oltin24"] = hamma((np.log(gc / gc.shift(24)) / (gv * math.sqrt(24))).fillna(0))
    eb = np.log(c["ETH/USDT"] / c["BTC/USDT"])
    fe["ethbtc"] = hamma(((eb - eb.shift(24)) / (vol["BTC/USDT"] * math.sqrt(24))).fillna(0))  # altlar kuchimi
    fe["nisbiy"] = fe["r24"].sub(fe["r24"].mean(axis=1), axis=0)              # tanga bozordan kuchlimi
    fe["kenglik"] = hamma((c > c.ewm(span=150, adjust=False).mean()).mean(axis=1) * 2 - 1)  # nechta tanga trendda
    fe["btc_e150"] = hamma(fe["e150"]["BTC/USDT"])
    if VARIANT == "yangi":
        soat = c.index.hour.values / 24 * 2 * math.pi; kun = c.index.dayofweek.values / 7 * 2 * math.pi
        for nom, qiymat in (("soat_s", np.sin(soat)), ("soat_c", np.cos(soat)), ("kun_s", np.sin(kun)), ("kun_c", np.cos(kun))):
            fe[nom] = pd.DataFrame({b: qiymat for b in belgilar}, index=c.index)
FN = list(fe)
print("belgilar soni:", len(FN), FN, flush=True)
X = np.stack([fe[k].clip(-6, 6).values for k in FN], -1).astype(np.float32)  # [T, C, F]
kelajak = r.rolling(H).sum().shift(-H)
Y = (kelajak / (vol * math.sqrt(H))).clip(-3, 3).values.astype(np.float32)   # [T, C]
T, C, NF = X.shape
vaqt = c.index
ok_x = np.array([[not np.isnan(X[max(0, t - L + 1):t + 1, j]).any() and t >= L for j in range(C)] for t in range(T)])
Xt = torch.from_numpy(np.nan_to_num(X)).permute(1, 0, 2).contiguous()  # [C, T, F]


def oyna(idx):  # idx: [(t, c)] -> [B, L, F]
    return torch.stack([Xt[j, t - L + 1:t + 1] for t, j in idx])


class RMSNorm(nn.Module):
    def __init__(s, d):
        super().__init__(); s.w = nn.Parameter(torch.ones(d))
    def forward(s, x):
        return x * torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + 1e-6) * s.w


def rope(x):  # x: [B, h, L, dh]
    dh = x.shape[-1]
    f = 1.0 / (10000 ** (torch.arange(0, dh, 2) / dh))
    a = torch.arange(x.shape[2])[:, None] * f[None]
    cos, sin = a.cos(), a.sin()
    x1, x2 = x[..., ::2], x[..., 1::2]
    return torch.stack([x1 * cos - x2 * sin, x1 * sin + x2 * cos], -1).flatten(-2)


class Blok(nn.Module):
    def __init__(s):
        super().__init__()
        s.n1, s.n2 = RMSNorm(D), RMSNorm(D)
        s.qkv, s.o = nn.Linear(D, 3 * D, bias=False), nn.Linear(D, D, bias=False)
        s.w1, s.w3, s.w2 = nn.Linear(D, 2 * D, bias=False), nn.Linear(D, 2 * D, bias=False), nn.Linear(2 * D, D, bias=False)
        s.drop = nn.Dropout(0.1)
    def forward(s, x):
        B, Ln, _ = x.shape
        q, k, vv = s.qkv(s.n1(x)).view(B, Ln, 3, BOSH, D // BOSH).permute(2, 0, 3, 1, 4)
        a = F.scaled_dot_product_attention(rope(q), rope(k), vv, is_causal=True, dropout_p=0.1 if s.training else 0)
        x = x + s.drop(s.o(a.transpose(1, 2).reshape(B, Ln, D)))
        y = s.n2(x)
        return x + s.drop(s.w2(F.silu(s.w1(y)) * s.w3(y)))


class Miya(nn.Module):
    def __init__(s):
        super().__init__()
        s.kir = nn.Linear(NF, D)
        s.bloklar = nn.ModuleList([Blok() for _ in range(QAT)])
        s.n, s.chiq = RMSNorm(D), nn.Linear(D, 1)
    def forward(s, x):
        x = s.kir(x)
        for b in s.bloklar:
            x = b(x)
        return s.chiq(s.n(x[:, -1])).squeeze(-1)


def orgat(idx, seed):
    torch.manual_seed(seed); np.random.seed(seed)
    m = Miya()
    opt = torch.optim.AdamW(m.parameters(), lr=1e-3, weight_decay=0.05)
    qadamlar = EPOX * math.ceil(len(idx) / BATCH)
    sch = torch.optim.lr_scheduler.OneCycleLR(opt, 1e-3, total_steps=qadamlar)
    yt = torch.tensor([Y[t, j] for t, j in idx])
    for e in range(EPOX):
        m.train(); p = np.random.permutation(len(idx)); jami = 0
        for i in range(0, len(idx), BATCH):
            b = p[i:i + BATCH]
            loss = F.huber_loss(m(oyna([idx[k] for k in b])), yt[b])
            opt.zero_grad(); loss.backward(); nn.utils.clip_grad_norm_(m.parameters(), 1.0); opt.step(); sch.step()
            jami += loss.item() * len(b)
    return m


@torch.no_grad()
def bashorat(m, idx):
    m.eval()
    return torch.cat([m(oyna(idx[i:i + 1024])) for i in range(0, len(idx), 1024)]).numpy()


bosh = pd.Timestamp(TEST_BOSHI) + pd.DateOffset(months=QADAM_OY * FOLD)
keyin = bosh + pd.DateOffset(months=QADAM_OY)
ti = np.where(vaqt < bosh)[0][-1] - H  # embargo: maqsad test boshidan oldin tugaydi
t_org0 = int(np.searchsorted(vaqt, ORG_BOSHI))
org = [(t, j) for t in range(max(L, t_org0 + L), ti, 2) for j in range(C) if ok_x[t, j] and not np.isnan(Y[t, j])]
sin = [(t, j) for t in np.where((vaqt >= bosh) & (vaqt < keyin))[0] for j in range(C) if ok_x[t, j]]
t0 = time.time(); ps = []
for s_ in SEEDS:
    m = orgat(org, s_)
    ps.append(bashorat(m, sin))
pr = np.mean(ps, 0)
yy = np.array([Y[t, j] for t, j in sin]); okk = ~np.isnan(yy)
ic = np.corrcoef(pr[okk], yy[okk])[0, 1]
print(f"{VARIANT} {bosh:%Y-%m}..{keyin:%Y-%m}: o'qitish {len(org)} namuna, test {len(sin)}, IC {ic:+.3f}, {time.time() - t0:.0f}s", flush=True)
json.dump({"ic": float(ic), "namuna": len(org), "p": [[str(vaqt[t]), belgilar[j], float(p)] for (t, j), p in zip(sin, pr)]},
          open(f"uzun_{VARIANT}_{FOLD}.json", "w"))
