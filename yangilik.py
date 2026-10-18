"""Yangilik o'qiydigan AI: kripto yangiliklar saytlarining RSS lentalaridan so'nggi sarlavhalarni yig'adi va
o'sha GitHub serverining o'zida ishlaydigan ochiq til modeliga (Ollama orqali, bepul, kalit kerak emas)
har bir sarlavhaning narxga ta'sirini baholatadi. Tangalarga tegishli sarlavhalar kalit so'zlar bilan topiladi.

Natija yangilik.json ga yoziladi:
{"vaqt", "soni", "bozor": {"baho", "izoh"}, "tangalar": {belgi: {"baho", "izoh"}}}, baho -1 (yomon) .. +1 (yaxshi).
Faqat standart kutubxona.
"""

import email.utils
import json
import os
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET

LENTALAR = [
    "https://www.coindesk.com/arc/outboundfeeds/rss/",
    "https://cointelegraph.com/rss",
    "https://decrypt.co/feed",
    "https://bitcoinmagazine.com/feed",
    "https://cryptoslate.com/feed/",
    "https://www.theblock.co/rss.xml",
    "https://news.bitcoin.com/feed/",
]
BELGILAR = ("BTC", "ETH", "SOL", "BNB", "XRP")
KALIT_SOZLAR = {
    "BTC": ["bitcoin", "btc"],
    "ETH": ["ethereum", "ether", "eth"],
    "SOL": ["solana", "sol"],
    "BNB": ["bnb", "binance"],
    "XRP": ["xrp", "ripple"],
}
NOMLAR = {"BTC": "Bitcoin", "ETH": "Ethereum", "SOL": "Solana", "BNB": "BNB", "XRP": "XRP"}
OLLAMA = os.environ.get("OLLAMA_URL", "http://localhost:11434")
MODEL = os.environ.get("YANGILIK_MODEL", "qwen2.5:7b")
OYNA_SOAT = 24
FAYL = "yangilik.json"


def _ol(url, malumot=None, vaqt=40):
    so = urllib.request.Request(url, json.dumps(malumot).encode() if malumot else None,
                                {"User-Agent": "Mozilla/5.0 treyder-ai", "Content-Type": "application/json"})
    with urllib.request.urlopen(so, timeout=vaqt) as j:
        return j.read()


def sarlavhalar():
    """So'nggi OYNA_SOAT soatdagi [(vaqt, sarlavha, qisqa matn)], yangisi birinchi."""
    chegara = time.time() - OYNA_SOAT * 3600
    natija, korilgan = [], set()
    for url in LENTALAR:
        try:
            ildiz = ET.fromstring(_ol(url))
        except Exception as xato:
            print("lenta ochilmadi:", url, xato)
            continue
        for item in ildiz.iter("item"):
            nom = " ".join((item.findtext("title") or "").split())
            sana = item.findtext("pubDate")
            try:
                t = email.utils.parsedate_to_datetime(sana).timestamp()
            except Exception:
                continue
            if t < chegara or not nom or nom.lower() in korilgan:
                continue
            korilgan.add(nom.lower())
            matn = re.sub(r"<[^>]+>", " ", item.findtext("description") or "")
            natija.append((t, nom, " ".join(matn.split())[:160]))
    return sorted(natija, reverse=True)


def baholat(yangiliklar):
    """Har bir sarlavha uchun -2..+2 baho (model). Qaytaradi: [int]."""
    royxat = "\n".join(f"{i + 1}. {nom}" for i, (_, nom, _) in enumerate(yangiliklar))
    sorov = (
        "You are an experienced crypto futures trader. For each news headline below, rate its likely effect on "
        "crypto prices over the next 1-2 days: -2 very bearish, -1 bearish, 0 neutral or unrelated, "
        "1 bullish, 2 very bullish. Be strict: most headlines are 0. "
        f'Answer only JSON like {{"scores": [0, 1, -1, ...]}} with exactly {len(yangiliklar)} integers in order.\n\n'
        f"{royxat}"
    )
    for urinish in range(3):
        javob = json.loads(_ol(f"{OLLAMA}/api/chat", {
            "model": MODEL, "stream": False, "format": "json",
            "options": {"temperature": 0, "num_ctx": 8192},
            "messages": [{"role": "user", "content": sorov}],
        }, vaqt=900))
        try:
            baholar = json.loads(javob["message"]["content"])["scores"]
            baholar = [max(-2, min(2, int(round(float(x))))) for x in baholar]
        except Exception as xato:
            print("model javobi tushunarsiz:", xato, javob.get("message", {}).get("content", "")[:300])
            continue
        if len(baholar) == len(yangiliklar):
            return baholar
        print(f"baholar soni mos emas: {len(baholar)} != {len(yangiliklar)}")
    raise RuntimeError("model baho bermadi")


def _tegishli(matn, belgi):
    matn = matn.lower()
    return any(re.search(rf"\b{s}\b", matn) for s in KALIT_SOZLAR[belgi])


def _izoh(baholar, kimga):
    yaxshi = sum(x > 0 for x in baholar)
    yomon = sum(x < 0 for x in baholar)
    qism = f"{kimga} {len(baholar)} ta yangilik: {yaxshi} tasi yaxshi, {yomon} tasi yomon, qolgani betaraf."
    if yaxshi > yomon * 2 and yaxshi:
        return qism + " Kayfiyat ijobiy."
    if yomon > yaxshi * 2 and yomon:
        return qism + " Kayfiyat salbiy."
    return qism + " Kayfiyat aralash."


def tahlil(belgilar=BELGILAR):
    yangiliklar = sarlavhalar()[:50]
    print(len(yangiliklar), "ta yangilik", flush=True)
    if not yangiliklar:
        return {}
    t0 = time.time()
    baholar = baholat(yangiliklar)
    print(f"model {MODEL}: {time.time() - t0:.0f}s", flush=True)
    for b, (_, nom, _) in zip(baholar, yangiliklar):
        print(f"{b:+d}  {nom}")
    bozor = sum(baholar) / len(baholar) / 2
    natija = {"vaqt": time.strftime("%Y-%m-%d %H:%M", time.gmtime()), "soni": len(yangiliklar), "model": MODEL,
              "bozor": {"baho": round(bozor, 2), "izoh": _izoh(baholar, "Umumiy bozor bo'yicha")}, "tangalar": {}}
    for b in belgilar:
        oz = [x for x, (_, nom, matn) in zip(baholar, yangiliklar) if _tegishli(f"{nom} {matn}", b)]
        if oz:
            baho = 0.5 * bozor + 0.5 * sum(oz) / len(oz) / 2
            izoh = _izoh(oz, f"{NOMLAR[b]} haqida")
        else:
            baho, izoh = bozor, "Alohida yangilik yo'q, umumiy bozor kayfiyatiga qaraldi."
        natija["tangalar"][b] = {"baho": round(max(-1.0, min(1.0, baho)), 2), "izoh": izoh}
    return natija


if __name__ == "__main__":
    natija = tahlil()
    print(json.dumps(natija, ensure_ascii=False, indent=1))
    if not natija:
        sys.exit(1)
    with open(FAYL, "w") as f:
        json.dump(natija, f, ensure_ascii=False, indent=1)
