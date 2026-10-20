"""Haftalik hisobot rasmi: 1000$ har bir pul taqsimlash usulida qanday o'zgargani (bulut.py chaqiradi).

Tarix alohida saqlanmaydi: qog'oz yo'llarning jurnali va 4 soatlik yopilish narxlaridan har sham uchun qayta hisoblanadi."""
import io

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402


def yol_tarixi(pf, narxlar, vaqtlar, boshlangich, ulush, leverage, komissiya):
    """Har sham yopilishidagi jami pul: boshlang'ich + yopilgan savdolar natijasi + ochiqlarining joriy natijasi."""
    savdolar = list(pf["jurnal"]) + [{"belgi": b, **p} for b, p in pf["portfel"].items()]
    kirish_kom = ulush * leverage * komissiya
    tarix = []
    for t in vaqtlar:
        pul = boshlangich
        for s in savdolar:
            if s["kirish_sana"] > t:
                continue
            pul -= kirish_kom
            if s.get("chiqish_sana") and s["chiqish_sana"] <= t:
                pul += s["foyda"]
            else:
                narx = narxlar[s["belgi"]].get(t, s["kirish_narx"])
                miqdor = s.get("miqdor", ulush * leverage / s["kirish_narx"])
                pul += max(s.get("yon", 1) * miqdor * (narx - s["kirish_narx"]), -ulush)
        tarix.append(pul)
    return tarix


def chiz(h, natijalar, boshlangich, ulush, leverage, komissiya):
    """PNG baytlari yoki None (tarix hali juda qisqa bo'lsa)."""
    boshi = h.get("sinov_boshi")
    narxlar = {b: {s[0]: s[4] for s in sham} for b, sham in natijalar.items()}
    vaqtlar = [s[0] for s in natijalar["BTC"] if s[0] >= boshi]
    if len(vaqtlar) < 3:
        return None
    pf = h["portfellar"]
    yol = {y: yol_tarixi(pf[y], narxlar, vaqtlar, boshlangich, ulush, leverage, komissiya)
           for y in ("qoida", "miya", "longshort", "short") if y in pf}
    chiziqlar = []
    if {"qoida", "miya", "longshort"} <= yol.keys():
        chiziqlar.append(("Uchga bo'lish (asosiy nomzod)", [sum(v) / 3 for v in zip(yol["qoida"], yol["miya"], yol["longshort"])],
                          dict(color="#1a9850", lw=2.6)))
    if {"qoida", "short"} <= yol.keys():
        chiziqlar.append(("Yarmi qoida + yarmi short", [sum(v) / 2 for v in zip(yol["qoida"], yol["short"])],
                          dict(color="#2c7bb6", lw=1.8)))
    btc0 = narxlar["BTC"][vaqtlar[0]]
    chiziqlar.append(("Shunchaki BTC sotib olib qo'ysang", [boshlangich * narxlar["BTC"][t] / btc0 for t in vaqtlar],
                      dict(color="#999999", lw=1.4, ls="--")))

    x = list(range(len(vaqtlar)))
    fig, ax = plt.subplots(figsize=(9, 5), dpi=110)
    ax.axhline(boshlangich, color="#444444", lw=0.8, ls=":")
    ax.text(0, boshlangich, " boshlang'ich pul", va="bottom", fontsize=8, color="#444444")
    for nom, qiymat, uslub in chiziqlar:
        ax.plot(x, qiymat, label=f"{nom}: {qiymat[-1]:.0f}$", **uslub)
    kunlar = [i for i, t in enumerate(vaqtlar) if t.endswith("00:00")]  # har kun boshida bitta belgi
    qadam = max(1, len(kunlar) // 10)
    ax.set_xticks(kunlar[::qadam], [vaqtlar[i][5:10] for i in kunlar[::qadam]])
    ax.set_title(f"{boshlangich:.0f}$ qanday o'zgardi ({boshi[:10]} dan beri, qog'ozda)")
    ax.set_ylabel("$")
    ax.grid(alpha=0.25)
    ax.legend(loc="best", fontsize=9)
    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    return buf.getvalue()
