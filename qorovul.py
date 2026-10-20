"""Qorovul: bot har 4 soatlik shamni vaqtida qayta ishlayaptimi, tekshiradi (qorovul.yml har 30 daqiqada ishga tushiradi).

Bot ishlamayotgan bo'lsa (bot.yml hech qayerda yurmayapti) uni qayta ishga tushiradi. Bot oxirgi shamni
45 daqiqadan ko'proq kechiktirsa Telegramga ogohlantirish yuboradi, tuzalganda xabar beradi.
Holat qorovul.json da saqlanadi (faqat o'zgarganda yoziladi)."""
import json
import os
import subprocess
import time
import urllib.request
from pathlib import Path

SHAM = 4 * 3600
KECHIKISH = 45 * 60  # sham yopilgandan keyin shuncha vaqt ichida bot uni qayta ishlashi kerak
ESLATMA = 6 * 3600  # muammo davom etsa shuncha vaqtda bir eslatiladi
FAYL = Path(__file__).with_name("qorovul.json")


def yubor(chat_id, matn):
    url = f"https://api.telegram.org/bot{os.environ['TELEGRAM_TOKEN']}/sendMessage"
    sorov = urllib.request.Request(url, json.dumps({"chat_id": chat_id, "text": matn}).encode(),
                                   {"Content-Type": "application/json"})
    urllib.request.urlopen(sorov, timeout=30).read()


def bot_yuryaptimi():
    """bot.yml ning ishlayotgan yoki navbatda turgan nusxasi bormi."""
    for holat in ("in_progress", "queued"):
        r = subprocess.run(["gh", "run", "list", "--workflow", "bot.yml", "--status", holat, "--json", "databaseId"],
                           capture_output=True, text=True)
        if r.returncode != 0:
            return True  # bilmasak, tegmaymiz
        if json.loads(r.stdout or "[]"):
            return True
    return False


def main():
    h = json.loads(Path("holat.json").read_text(encoding="utf-8"))
    q = json.loads(FAYL.read_text(encoding="utf-8")) if FAYL.exists() else {"muammo": False, "ogohlantirish": 0}
    hozir = time.time()
    joriy = int(hozir // SHAM) * SHAM  # hozir ochiq turgan sham boshlangan vaqt
    kutilgan = time.strftime("%Y-%m-%d %H:%M", time.gmtime(joriy - SHAM))  # oxirgi yopilgan sham
    eski = (h.get("oxirgi_sana") or "") < kutilgan and hozir - joriy > KECHIKISH

    qayta = False
    if not bot_yuryaptimi():
        qayta = subprocess.run(["gh", "workflow", "run", "bot.yml", "--ref", "main"]).returncode == 0
        print("bot.yml yurmayotgan edi, qayta ishga tushirildi:", qayta)

    chat = h.get("chat_id")
    yangi = dict(q)
    if eski:
        if not q["muammo"] or hozir - q["ogohlantirish"] > ESLATMA:
            matn = (f"⚠️ Qorovul: bot oxirgi shamni qayta ishlamadi (oxirgisi {h.get('oxirgi_sana')} UTC, "
                    f"kutilgani {kutilgan}).")
            matn += " Botni qayta ishga tushirdim." if qayta else " Bot yoqilgan, lekin ishlay olmayapti, tekshirish kerak."
            chat and yubor(chat, matn)
            yangi.update(muammo=True, ogohlantirish=hozir)
    elif q["muammo"]:
        chat and yubor(chat, "✅ Qorovul: bot yana normal ishlayapti.")
        yangi.update(muammo=False)
    print("kutilgan:", kutilgan, "bot:", h.get("oxirgi_sana"), "eski:", eski)
    if yangi != q:
        FAYL.write_text(json.dumps(yangi, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
