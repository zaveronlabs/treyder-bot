"""Botning "miyasi": noldan o'qitilgan kichik Llama-uslubidagi transformer (faqat numpy bilan ishlaydi).

U har tanganing oxirgi 64 ta 4 soatlik shamini o'qib, keyingi 12 sham (2 kun) uchun bashorat beradi.
Musbat bashorat = miya o'sish kutyapti. Og'irliklar miya.npz da (3 ta model, natija o'rtachasi olinadi).
"""

import math
import warnings
from pathlib import Path

import numpy as np

L, D, QAT, BOSH = 64, 64, 4, 4
OGIRLIK_FAYL = Path(__file__).with_name("miya.npz")


def _rolling(x, n, fn, min_n):
    """pandas rolling(n, min_periods=min_n) ning soddalashtirilgan nusxasi (NaN larni tashlab)."""
    chiq = np.full_like(x, np.nan)
    for t in range(len(x)):
        w = x[max(0, t - n + 1):t + 1]
        w = w[~np.isnan(w)]
        if len(w) >= min_n:
            chiq[t] = fn(w)
    return chiq


def belgilar_jadvali(shamlar, kerak):
    """shamlar: {belgi: [(o, h, l, c, v), ...]} bir xil vaqtlarda. Oxirgi `kerak` qator uchun [T, C, 7] belgilar."""
    belgilar = list(shamlar)
    o, h, l, c, v = (np.array([[s[i] for s in shamlar[b]] for b in belgilar], float).T for i in range(5))
    r = np.vstack([np.full((1, c.shape[1]), np.nan), np.log(c[1:] / c[:-1])])
    std = lambda w: w.std(ddof=1)
    vol = np.stack([_rolling(r[:, j], 100, std, 50) for j in range(len(belgilar))], 1)
    vm = np.stack([_rolling(v[:, j], 50, np.mean, 20) for j in range(len(belgilar))], 1)
    volm = np.stack([_rolling(vol[:, j], 500, np.mean, 100) for j in range(len(belgilar))], 1)
    with np.errstate(divide="ignore", invalid="ignore"), warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)
        rn = r / vol
        bozor = np.nanmean(rn, axis=1)
        btc = rn[:, belgilar.index("BTC")]
        f = [rn, np.log(h / l) / vol, np.log(c / o) / vol, np.log(v / vm), np.log(vol / volm),
             np.repeat(btc[:, None], len(belgilar), 1), np.repeat(bozor[:, None], len(belgilar), 1)]
    x = np.stack(f, -1)[-kerak:]
    return np.nan_to_num(np.clip(x, -6, 6)), belgilar


def _rms(x, w):
    return x / np.sqrt((x * x).mean(-1, keepdims=True) + 1e-6) * w


def _rope(x):  # [h, L, dh]
    dh = x.shape[-1]
    f = 1.0 / (10000 ** (np.arange(0, dh, 2) / dh))
    a = np.arange(x.shape[1])[:, None] * f[None]
    cos, sin = np.cos(a), np.sin(a)
    x1, x2 = x[..., ::2], x[..., 1::2]
    return np.stack([x1 * cos - x2 * sin, x1 * sin + x2 * cos], -1).reshape(x.shape)


def _model(w, p, x):  # x: [L, F] -> son
    silu = lambda z: z / (1 + np.exp(-z))
    x = x @ w[p + "kir.weight"].T + w[p + "kir.bias"]
    n, dh = x.shape[0], D // BOSH
    niqob = np.triu(np.full((n, n), -np.inf), 1)
    for i in range(QAT):
        b = f"{p}bloklar.{i}."
        q, k, v = (x_ := _rms(x, w[b + "n1.w"]) @ w[b + "qkv.weight"].T).reshape(n, 3, BOSH, dh).transpose(1, 2, 0, 3)
        q, k = _rope(q), _rope(k)
        s = q @ k.transpose(0, 2, 1) / math.sqrt(dh) + niqob
        s = np.exp(s - s.max(-1, keepdims=True))
        a = (s / s.sum(-1, keepdims=True)) @ v
        x = x + a.transpose(1, 0, 2).reshape(n, D) @ w[b + "o.weight"].T
        y = _rms(x, w[b + "n2.w"])
        x = x + (silu(y @ w[b + "w1.weight"].T) * (y @ w[b + "w3.weight"].T)) @ w[b + "w2.weight"].T
    return float(_rms(x[-1], w[p + "n.w"]) @ w[p + "chiq.weight"][0] + w[p + "chiq.bias"][0])


def bashorat(shamlar, silliq=3):
    """{belgi: bashorat}: oxirgi `silliq` ta shamdagi bashoratlar o'rtachasi (sinovda shunday ishlatilgan)."""
    w = dict(np.load(OGIRLIK_FAYL))
    nusxalar = sorted({k.split(".")[0] for k in w})
    x, belgilar = belgilar_jadvali(shamlar, L + silliq - 1)
    natija = {}
    for j, b in enumerate(belgilar):
        qiymatlar = [_model(w, s + ".", x[t - L:t, j]) for t in range(L, L + silliq) for s in nusxalar]
        natija[b] = float(np.mean(qiymatlar))
    return natija
