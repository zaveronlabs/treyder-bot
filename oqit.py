"""Miyani qayta o'qitish (oyda bir marta, GitHub Actions'da): 10 tanganing 2022-10 dan hozirgacha 4 soatlik
tarixini yuklaydi, 3 ta transformer nusxasini noldan o'qitadi va og'irliklarni miya.npz ga yozadi.

Belgilar (features) miya.py dagi funksiya bilan hisoblanadi, shuning uchun bot ko'radigan narsa bilan bir xil.
"""

import json
import math
import sys
import time
import urllib.request

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

import miya

BELGILAR = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK", "LTC"]  # bulut.py bilan bir xil
TF = "4h"
NARX_MANBALARI = ["https://data-api.binance.vision", "https://api.binance.com"]

H, BATCH, EPOX, SEEDS = 12, 256, 4, [0, 1, 2]
BOSH_MS = 1666051200000  # 2022-10-18
L, D, QAT, BOSH = miya.L, miya.D, miya.QAT, miya.BOSH


def tarix(belgi):
    """[(vaqt_ms, o, h, l, c, v)]: 2022-10 dan hozirgacha yopilgan shamlar."""
    for manba in NARX_MANBALARI:
        try:
            natija, since = [], BOSH_MS
            while True:
                url = f"{manba}/api/v3/klines?symbol={belgi}USDT&interval={TF}&limit=1000&startTime={since}"
                with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "treyder-ai"}), timeout=30) as j:
                    s = [k for k in json.load(j) if k[6] < time.time() * 1000]
                natija += [(k[0], *map(float, k[1:6])) for k in s]
                if len(s) < 999:
                    return natija
                since = s[-1][0] + 1
        except Exception as xato:
            print(f"{manba} {belgi}: {xato}")
    raise RuntimeError(f"{belgi} tarixini olib bo'lmadi")


def tayyorla(shamlar, short=False):
    """shamlar: {belgi: [(vaqt, o, h, l, c, v)]} -> X [C, T, F] tensor, Y [T, C], ok [T, C]."""
    umumiy = sorted(set.intersection(*({s[0] for s in q} for q in shamlar.values())))
    umumiy_set = set(umumiy)
    tanla = {b: [s[1:] for s in q if s[0] in umumiy_set] for b, q in shamlar.items()}
    x, _ = miya.belgilar_jadvali(tanla, len(umumiy))
    c = np.array([[s[3] for s in tanla[b]] for b in tanla], float).T
    r = np.vstack([np.full((1, c.shape[1]), np.nan), np.log(c[1:] / c[:-1])])
    vol = np.stack([miya._rolling(r[:, j], 100, lambda w: w.std(ddof=1), 50) for j in range(c.shape[1])], 1)
    kelajak = np.full_like(r, np.nan)
    for t in range(len(r) - H):
        kelajak[t] = r[t + 1:t + H + 1].sum(0)
    z = kelajak / (vol * math.sqrt(H))
    # short miyasi: keyingi 2 kunda sezilarli tushish (0.5 volatillikdan ko'p) bo'ladimi
    y = (np.where(np.isnan(z), np.nan, z < -0.5) if short else np.clip(z, -3, 3)).astype(np.float32)
    ok = ~np.isnan(vol)
    ok[:150] = False  # isinish: hajm va volatillik o'rtachalari hali to'lmagan
    return torch.from_numpy(x.astype(np.float32)).permute(1, 0, 2).contiguous(), y, ok


class RMSNorm(nn.Module):
    def __init__(s, d):
        super().__init__()
        s.w = nn.Parameter(torch.ones(d))

    def forward(s, x):
        return x * torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + 1e-6) * s.w


def rope(x):
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
        q, k, v = s.qkv(s.n1(x)).view(B, Ln, 3, BOSH, D // BOSH).permute(2, 0, 3, 1, 4)
        a = F.scaled_dot_product_attention(rope(q), rope(k), v, is_causal=True, dropout_p=0.1 if s.training else 0)
        x = x + s.drop(s.o(a.transpose(1, 2).reshape(B, Ln, D)))
        y = s.n2(x)
        return x + s.drop(s.w2(F.silu(s.w1(y)) * s.w3(y)))


class Miya(nn.Module):
    def __init__(s, nf):
        super().__init__()
        s.kir = nn.Linear(nf, D)
        s.bloklar = nn.ModuleList([Blok() for _ in range(QAT)])
        s.n, s.chiq = RMSNorm(D), nn.Linear(D, 1)

    def forward(s, x):
        x = s.kir(x)
        for b in s.bloklar:
            x = b(x)
        return s.chiq(s.n(x[:, -1])).squeeze(-1)


def orgat(X, Y, idx, seed, short=False):
    torch.manual_seed(seed)
    np.random.seed(seed)
    m = Miya(X.shape[-1])
    opt = torch.optim.AdamW(m.parameters(), lr=1e-3, weight_decay=0.05)
    sch = torch.optim.lr_scheduler.OneCycleLR(opt, 1e-3, total_steps=EPOX * math.ceil(len(idx) / BATCH))
    yt = torch.tensor([Y[t, j] for t, j in idx])
    for _ in range(EPOX):
        m.train()
        p = np.random.permutation(len(idx))
        for i in range(0, len(idx), BATCH):
            b = p[i:i + BATCH]
            xb = torch.stack([X[idx[k][1], idx[k][0] - L + 1:idx[k][0] + 1] for k in b])
            loss = (F.binary_cross_entropy_with_logits if short else F.huber_loss)(m(xb), yt[b])
            opt.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(m.parameters(), 1.0)
            opt.step()
            sch.step()
    return m


def main(shamlar=None, short=False):
    shamlar = shamlar or {b: tarix(b) for b in BELGILAR}
    X, Y, ok = tayyorla(shamlar, short)
    T, C = Y.shape
    boshlash = 150 + L
    idx = [(t, j) for t in range(boshlash, T - H, 2) for j in range(C) if ok[t, j] and not np.isnan(Y[t, j])]
    print(f"{T} sham, {len(idx)} namuna", flush=True)
    og = {}
    for s in SEEDS:
        t0 = time.time()
        m = orgat(X, Y, idx, s, short)
        og.update({f"{s}.{k}": v.numpy() for k, v in m.state_dict().items()})
        print(f"nusxa {s} tayyor, {time.time() - t0:.0f}s", flush=True)
    fayl = miya.SHORT_FAYL if short else miya.OGIRLIK_FAYL
    np.savez_compressed(fayl, **og)
    sinov = miya.bashorat({b: [s[1:] for s in q[-2000:]] for b, q in shamlar.items()}, fayl=fayl)
    assert all(np.isfinite(v) for v in sinov.values()), sinov
    print("yangi miya bashorati:", {b: round(v, 3) for b, v in sinov.items()})


if __name__ == "__main__":
    shamlar = {b: tarix(b) for b in BELGILAR}
    main(shamlar)
    if "short" in sys.argv[1:]:
        main(shamlar, short=True)
