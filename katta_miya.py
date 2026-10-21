"""Katta miya sinovi (Gojo kompyuteridagi RTX 3050 da): hozirgi kichik miya bilan bir xil ma'lumot va bir xil
walk-forward sinov (2024-01 dan 6 ta yarim yil), lekin kattaroq modellar. Natija katta/natija_<o'lcham>.json ga yoziladi.
Ishlatish: python katta_miya.py   (katta_miya.bat orqali)
"""
import csv, json, sys, time, math, urllib.request
from pathlib import Path
import numpy as np, pandas as pd, torch, torch.nn as nn, torch.nn.functional as F

PAPKA = Path(__file__).with_name("katta"); PAPKA.mkdir(exist_ok=True)
QURILMA = "cuda" if torch.cuda.is_available() else "cpu"
H = 12
TEST_BOSHI, QADAM_OY, FOLDLAR = "2024-01-01", 6, 6
SEEDS = [0, 1, 2]
ORG_BOSHI = pd.Timestamp("2019-01-01")
OLCHAMLAR = {  # nom: (D, qatlam, bosh, oyna L, epoxa, batch)
    "kichik": (64, 4, 4, 64, 4, 256),      # hozirgi miya (taqqoslash uchun shu kompyuterda qayta)
    "orta": (128, 6, 4, 96, 4, 256),
    "katta": (256, 8, 8, 128, 4, 128),
}
TUTUN = {"tutun": (16, 1, 2, 16, 1, 512)}  # faqat dastur ishlashini tez tekshirish uchun (standart ro'yxatda yo'q)


def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)
    with open(PAPKA / "jurnal.txt", "a", encoding="utf-8") as f:
        print(time.strftime("%Y-%m-%d %H:%M:%S"), *a, file=f)


def yukla(b):
    fayl = PAPKA / f"{b}_4h.csv"
    if fayl.exists() and time.time() - fayl.stat().st_mtime < 86400:
        return [tuple([r[0], int(r[1]), *map(float, r[2:])]) for r in csv.reader(open(fayl))]
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
        if len(s) < 999:
            csv.writer(open(fayl, "w", newline="")).writerows(natija)
            return natija
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
FN = list(fe)
X = np.stack([fe[k].clip(-6, 6).values for k in FN], -1).astype(np.float32)  # [T, C, F]
kelajak = r.rolling(H).sum().shift(-H)
Y = (kelajak / (vol * math.sqrt(H))).clip(-3, 3).values.astype(np.float32)   # [T, C]
T, C, NF = X.shape
vaqt = c.index
nan_bor = np.isnan(X).any(-1)  # [T, C]
Xt = torch.from_numpy(np.nan_to_num(X)).permute(1, 0, 2).contiguous().to(QURILMA)  # [C, T, F]


def ok_x(L):
    """t da oxirgi L shamda NaN yo'q va t >= L."""
    cs = np.cumsum(np.vstack([np.zeros((1, C)), nan_bor]), 0)
    ok = np.zeros((T, C), bool)
    ok[L:] = (cs[L + 1:] - cs[1:T - L + 1]) == 0
    return ok


def oyna(tt, jj, L):  # -> [B, L, F]
    ar = torch.arange(L, device=QURILMA)
    return Xt[jj[:, None], tt[:, None] - L + 1 + ar[None]]


class RMSNorm(nn.Module):
    def __init__(s, d):
        super().__init__(); s.w = nn.Parameter(torch.ones(d))
    def forward(s, x):
        return x * torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + 1e-6) * s.w


def rope(x):
    dh = x.shape[-1]
    f = 1.0 / (10000 ** (torch.arange(0, dh, 2, device=x.device) / dh))
    a = torch.arange(x.shape[2], device=x.device)[:, None] * f[None]
    cos, sin = a.cos(), a.sin()
    x1, x2 = x[..., ::2], x[..., 1::2]
    return torch.stack([x1 * cos - x2 * sin, x1 * sin + x2 * cos], -1).flatten(-2)


class Blok(nn.Module):
    def __init__(s, D, B):
        super().__init__()
        s.D, s.B = D, B
        s.n1, s.n2 = RMSNorm(D), RMSNorm(D)
        s.qkv, s.o = nn.Linear(D, 3 * D, bias=False), nn.Linear(D, D, bias=False)
        s.w1, s.w3, s.w2 = nn.Linear(D, 2 * D, bias=False), nn.Linear(D, 2 * D, bias=False), nn.Linear(2 * D, D, bias=False)
        s.drop = nn.Dropout(0.1)
    def forward(s, x):
        Bt, Ln, _ = x.shape
        q, k, vv = s.qkv(s.n1(x)).view(Bt, Ln, 3, s.B, s.D // s.B).permute(2, 0, 3, 1, 4)
        a = F.scaled_dot_product_attention(rope(q), rope(k), vv, is_causal=True, dropout_p=0.1 if s.training else 0)
        x = x + s.drop(s.o(a.transpose(1, 2).reshape(Bt, Ln, s.D)))
        y = s.n2(x)
        return x + s.drop(s.w2(F.silu(s.w1(y)) * s.w3(y)))


class Miya(nn.Module):
    def __init__(s, D, Q, B):
        super().__init__()
        s.kir = nn.Linear(NF, D)
        s.bloklar = nn.ModuleList([Blok(D, B) for _ in range(Q)])
        s.n, s.chiq = RMSNorm(D), nn.Linear(D, 1)
    def forward(s, x):
        x = s.kir(x)
        for b in s.bloklar:
            x = b(x)
        return s.chiq(s.n(x[:, -1])).squeeze(-1)


def orgat(tt, jj, yt, seed, D, Q, B, L, EPOX, BATCH):
    torch.manual_seed(seed); np.random.seed(seed)
    m = Miya(D, Q, B).to(QURILMA)
    opt = torch.optim.AdamW(m.parameters(), lr=1e-3 if D <= 128 else 5e-4, weight_decay=0.05)
    qadamlar = EPOX * math.ceil(len(tt) / BATCH)
    sch = torch.optim.lr_scheduler.OneCycleLR(opt, opt.param_groups[0]["lr"], total_steps=qadamlar)
    amp = QURILMA == "cuda"
    for e in range(EPOX):
        m.train(); p = torch.randperm(len(tt), device=QURILMA)
        for i in range(0, len(tt), BATCH):
            b = p[i:i + BATCH]
            with torch.autocast(QURILMA, dtype=torch.bfloat16, enabled=amp):
                loss = F.huber_loss(m(oyna(tt[b], jj[b], L)).float(), yt[b])
            opt.zero_grad(); loss.backward(); nn.utils.clip_grad_norm_(m.parameters(), 1.0); opt.step(); sch.step()
    return m


@torch.no_grad()
def bashorat(m, tt, jj, L):
    m.eval()
    with torch.autocast(QURILMA, dtype=torch.bfloat16, enabled=QURILMA == "cuda"):
        return torch.cat([m(oyna(tt[i:i + 1024], jj[i:i + 1024], L)).float() for i in range(0, len(tt), 1024)]).cpu().numpy()


def sinov(nom):
    D, Q, B, L, EPOX, BATCH = {**OLCHAMLAR, **TUTUN}[nom]
    fayl = PAPKA / f"natija_{nom}.json"
    natija = json.loads(fayl.read_text()) if fayl.exists() else {"ic": {}, "p": []}
    okx = ok_x(L)
    t_org0 = int(np.searchsorted(vaqt, ORG_BOSHI))
    for fold in range(FOLDLAR):
        if str(fold) in natija["ic"]:
            continue  # oldin tugagan (to'xtab qolgan bo'lsa davom ettiradi)
        bosh = pd.Timestamp(TEST_BOSHI) + pd.DateOffset(months=QADAM_OY * fold)
        keyin = bosh + pd.DateOffset(months=QADAM_OY)
        ti = np.where(vaqt < bosh)[0][-1] - H
        org = [(t, j) for t in range(max(L, t_org0 + L), ti, 2) for j in range(C) if okx[t, j] and not np.isnan(Y[t, j])]
        sin = [(t, j) for t in np.where((vaqt >= bosh) & (vaqt < keyin))[0] for j in range(C) if okx[t, j]]
        to = torch.tensor([t for t, _ in org], device=QURILMA); jo = torch.tensor([j for _, j in org], device=QURILMA)
        yt = torch.tensor([Y[t, j] for t, j in org], device=QURILMA)
        ts = torch.tensor([t for t, _ in sin], device=QURILMA); js = torch.tensor([j for _, j in sin], device=QURILMA)
        t0 = time.time(); ps = []
        for s_ in SEEDS:
            m = orgat(to, jo, yt, s_, D, Q, B, L, EPOX, BATCH)
            ps.append(bashorat(m, ts, js, L))
            del m; torch.cuda.empty_cache() if QURILMA == "cuda" else None
        pr = np.mean(ps, 0)
        yy = np.array([Y[t, j] for t, j in sin]); okk = ~np.isnan(yy)
        ic = float(np.corrcoef(pr[okk], yy[okk])[0, 1])
        natija["ic"][str(fold)] = [ic, len(org)]
        natija["p"] += [[str(vaqt[t]), belgilar[j], float(p)] for (t, j), p in zip(sin, pr)]
        fayl.write_text(json.dumps(natija))
        log(f"{nom} {bosh:%Y-%m}: IC {ic:+.3f}, {time.time() - t0:.0f} soniya")
    ics = [natija["ic"][str(f)][0] for f in range(FOLDLAR)]
    log(f"=== {nom}: o'rtacha IC {np.mean(ics):+.3f} ({', '.join(f'{x:+.3f}' for x in ics)})")


if __name__ == "__main__":
    log("qurilma:", QURILMA, torch.cuda.get_device_name(0) if QURILMA == "cuda" else "", "| belgilar:", NF, "| namunalar davri:", vaqt[0], "..", vaqt[-1])
    for nom in (sys.argv[1:] or list(OLCHAMLAR)):
        sinov(nom)
    log("TAYYOR")
