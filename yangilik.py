"""Yangilik o'qiydigan AI: kripto yangiliklar saytlarining RSS lentalaridan so'nggi sarlavhalarni yig'adi va
GitHub Models'dagi til modeliga (GitHub Actions ichida bepul, kalit kerak emas) tahlil qildiradi.

Natija: {"vaqt": ..., "bozor": {"baho", "izoh"}, "tangalar": {belgi: {"baho", "izoh"}}}, baho -1 (yomon) .. +1 (yaxshi).
Faqat standart kutubxona.
"""

import email.utils
import json
import os
import re
import time
import urllib.request
import xml.etree.ElementTree as ET

LENTALAR = [
    "https://www.coindesk.com/arc/outboundfeeds/rss/",
    "https://cointelegraph.com/rss",
    "https://decrypt.co/feed",
    "https://bitcoinmagazine.com/feed",
]
BELGILAR = ("BTC", "ETH", "SOL", "BNB", "XRP")
MODEL_URL = "https://models.github.ai/inference/chat/completions"
MODEL = "openai/gpt-4.1-mini"
OYNA_SOAT = 24


def _ol(url, malumot=None, sarlavha=None):
    so = urllib.request.Request(url, json.dumps(malumot).encode() if malumot else None,
                                {"User-Agent": "Mozilla/5.0 treyder-ai", **(sarlavha or {})})
    with urllib.request.urlopen(so, timeout=40) as j:
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
            nom = (item.findtext("title") or "").strip()
            sana = item.findtext("pubDate")
            try:
                t = email.utils.parsedate_to_datetime(sana).timestamp()
            except Exception:
                continue
            if t < chegara or not nom or nom.lower() in korilgan:
                continue
            korilgan.add(nom.lower())
            matn = re.sub(r"<[^>]+>", " ", item.findtext("description") or "")
            natija.append((t, nom, " ".join(matn.split())[:200]))
    return sorted(natija, reverse=True)


def tahlil(belgilar=BELGILAR):
    yangiliklar = sarlavhalar()[:60]
    if not yangiliklar:
        return {}
    royxat = "\n".join(f"- {nom} | {matn}" for _, nom, matn in yangiliklar)
    sorov = (
        "Sen kripto bozor tahlilchisisan. Quyida so'nggi 24 soatdagi yangiliklar sarlavhalari bor. "
        f"Har bir tanga ({', '.join(belgilar)}) va umumiy bozor uchun keyingi 1-2 kunda narxga ta'siri qanday "
        "bo'lishini baholab ber: baho -1 (juda salbiy) dan +1 (juda ijobiy) gacha, yangilik bo'lmasa 0. "
        "izoh: o'zbek tilida (lotin), oddiy so'zlar bilan, bitta qisqa gap. Faqat JSON qaytar, shu ko'rinishda: "
        '{"bozor": {"baho": 0.0, "izoh": "..."}, "tangalar": {"BTC": {"baho": 0.0, "izoh": "..."}}}\n\n'
        f"Yangiliklar:\n{royxat}"
    )
    javob = json.loads(_ol(MODEL_URL, {
        "model": MODEL, "temperature": 0.2, "response_format": {"type": "json_object"},
        "messages": [{"role": "user", "content": sorov}],
    }, {"Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}", "Content-Type": "application/json"}))
    natija = json.loads(javob["choices"][0]["message"]["content"])
    natija["vaqt"] = time.strftime("%Y-%m-%d %H:%M", time.gmtime())
    natija["soni"] = len(yangiliklar)
    for b in belgilar:
        t = natija.setdefault("tangalar", {}).setdefault(b, {"baho": 0.0, "izoh": "Muhim yangilik yo'q."})
        t["baho"] = max(-1.0, min(1.0, float(t.get("baho", 0))))
    return natija


if __name__ == "__main__":
    print(json.dumps(tahlil(), ensure_ascii=False, indent=1))
