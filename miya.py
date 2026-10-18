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


K = 5  # swing: chap va o'ngda K shamdan baland/past bo'lgan nuqta (K sham keyin tasdiqlanadi)


def _swing(x, eng):
    """Oxirgi tasdiqlangan pivot (s1) va undan oldingisi (s2), har vaqt uchun."""
    s1, s2 = np.full_like(x, np.nan), np.full_like(x, np.nan)
    a = b = np.nan
    for t in range(2 * K, len(x)):
        w = x[t - 2 * K:t + 1]
        if x[t - K] == (w.max() if eng == "max" else w.min()):
            a, b = x[t - K], a
        s1[t], s2[t] = a, b
    return s1, s2


def _ewm(x, alfa):
    chiq, e = np.full_like(x, np.nan), np.nan
    for t, q in enumerate(x):
        if not np.isnan(q):
            e = q if np.isnan(e) else alfa * q + (1 - alfa) * e
        chiq[t] = e
    return chiq


def _struktura(h, l, c, vol):
    """Treyder strukturalari (bitta tanga): swing, tayanch/qarshilikka masofa, sinish, RSI, EMA, diapazon."""
    sh1, sh2 = _swing(h, "max")
    sl1, sl2 = _swing(l, "min")
    dlt = np.concatenate([[np.nan], np.diff(c)])
    rs = _ewm(np.clip(dlt, 0, None), 1 / 14) / _ewm(-np.clip(dlt, None, 0), 1 / 14)
    mx = np.array([h[t - 19:t + 1].max() if t >= 19 else np.nan for t in range(len(h))])
    mn = np.array([l[t - 19:t + 1].min() if t >= 19 else np.nan for t in range(len(l))])
    c24 = np.concatenate([np.full(24, np.nan), c[:-24]])
    f = [(np.sign(sh1 - sh2) + np.sign(sl1 - sl2)) / 2,
         np.log(c / sh1) / vol / 5, np.log(c / sl1) / vol / 5,
         (c > sh1).astype(float) - (c < sl1).astype(float),
         ((100 - 100 / (1 + rs)) - 50) / 20]
    f += [np.log(c / _ewm(c, 2 / (n + 1))) / vol / 10 for n in (50, 150, 600)]
    f += [(c - mn) / (mx - mn) * 2 - 1, np.log(c / c24) / (vol * math.sqrt(24))]
    return np.stack(f, -1)


def belgilar_jadvali(shamlar, kerak):
    """shamlar: {belgi: [(o, h, l, c, v), ...]} bir xil vaqtlarda. Oxirgi `kerak` qator uchun [T, C, 17] belgilar
    (7 ta asosiy + 10 ta treyder strukturasi)."""
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
        st = np.stack([_struktura(h[:, j], l[:, j], c[:, j], vol[:, j]) for j in range(len(belgilar))], 1)
    x = np.concatenate([np.stack(f, -1), st], -1)[-kerak:]
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
    x = x[..., :w[nusxalar[0] + ".kir.weight"].shape[1]]  # eski (7 belgili) og'irliklar ham ishlayveradi
    natija = {}
    for j, b in enumerate(belgilar):
        qiymatlar = [_model(w, s + ".", x[t - L:t, j]) for t in range(L, L + silliq) for s in nusxalar]
        natija[b] = float(np.mean(qiymatlar))
    return natija
