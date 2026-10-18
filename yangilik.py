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
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

LENTALAR = [
    "https://www.coindesk.com/arc/outboundfeeds/rss/",
    "https://cointelegraph.com/rss",
    "https://decrypt.co/feed",
    "https://bitcoinmagazine.com/feed",
]
BELGILAR = ("BTC", "ETH", "SOL", "BNB", "XRP")
MODEL_URLLAR = ["https://models.github.ai/inference/chat/completions",
               "https://models.inference.ai.azure.com/chat/completions"]
MODELLAR = ["openai/gpt-4.1-mini", "openai/gpt-4o-mini", "meta/Llama-3.3-70B-Instruct"]
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
    print(len(yangiliklar), "ta yangilik")
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
    javob = None
    for url in MODEL_URLLAR:
        for model in MODELLAR:
            nom = model if "github.ai" in url else model.split("/")[-1]
            try:
                so = urllib.request.Request(url, json.dumps({
                    "model": nom, "temperature": 0.2, "messages": [{"role": "user", "content": sorov}],
                }).encode(), {"Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}",
                              "Content-Type": "application/json", "Accept": "application/json",
                              "User-Agent": "treyder-ai"}, method="POST")
                with urllib.request.urlopen(so, timeout=60) as j:
                    xom = j.read()
                    if not xom.strip():
                        print("bo'sh javob:", url, nom, j.status, j.geturl(), dict(j.headers))
                        continue
                javob = json.loads(xom)
                break
            except urllib.error.HTTPError as xato:
                print("model xatosi:", url, nom, xato.code, xato.read()[:300])
            except Exception as xato:
                print("model xatosi:", url, nom, repr(xato)[:300])
        if javob:
            break
    if javob is None:
        return {}
    matn = javob["choices"][0]["message"]["content"]
    javob["choices"][0]["message"]["content"] = matn[matn.find("{"):matn.rfind("}") + 1]
    natija = json.loads(javob["choices"][0]["message"]["content"])
    natija["vaqt"] = time.strftime("%Y-%m-%d %H:%M", time.gmtime())
    natija["soni"] = len(yangiliklar)
    for b in belgilar:
        t = natija.setdefault("tangalar", {}).setdefault(b, {"baho": 0.0, "izoh": "Muhim yangilik yo'q."})
        t["baho"] = max(-1.0, min(1.0, float(t.get("baho", 0))))
    return natija


if __name__ == "__main__":
    print(json.dumps(tahlil(), ensure_ascii=False, indent=1))
