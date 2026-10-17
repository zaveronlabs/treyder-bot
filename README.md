# Treyder AI bot

4 soatlik trend tizimi asosidagi Telegram signal boti. GitHub Actions har 15 daqiqada `bulut.py` ni ishga tushiradi.

- Qoida (4h): narx EMA150 dan yuqori, 60 shamda o'sgan va EMA600 dan yuqori bo'lsa, LONG; aks holda naqd.
- Signal 5 ta tanga bo'yicha: BTC, ETH, SOL, BNB, XRP (miya 10 tangani kuzatadi).
- Avto sinov rejimi (3 oy): qoida va miya rozi bo'lsa bot qog'oz portfelda o'zi long ochadi, aks holda yopadi (1000 USDT, har tangaga 200 USDT, x2, 0.05% komissiya). Har savdo Telegramga yoziladi, har hafta hisobot; /hisobot, /holat, /jurnal.
- Telegram tokeni repo sozlamasida `TELEGRAM_TOKEN` yashirin o'zgaruvchisida.
- Holat `holat.json` da saqlanadi.
- Miya (`miya.py`, `miya.npz`): noldan o'qitilgan kichik transformer, oxirgi 64 ta 4 soatlik shamni o'qib, keyingi 2 kun uchun bashorat beradi. Har signal ostida uning fikri ("rozi" / "rozi emas") yoziladi; qarorni foydalanuvchi qiladi.
- Miya har oy yangi ma'lumotda o'zi qayta o'qiydi (`oqit.py`, `oqitish.yml`): bot oy almashganini `miya_sana.txt` dan bilib, o'qitishni ishga tushiradi.
