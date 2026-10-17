# Treyder AI bot

4 soatlik trend tizimi asosidagi Telegram signal boti. GitHub Actions har 15 daqiqada `bulut.py` ni ishga tushiradi.

- Qoida (4h): narx EMA150 dan yuqori, 60 shamda o'sgan va EMA600 dan yuqori bo'lsa, LONG; aks holda naqd.
- 10 tanga: BTC, ETH, SOL, BNB, XRP, DOGE, ADA, AVAX, LINK, LTC.
- Har bir signal ostida Ha/Yo'q tugmalari; qog'oz futures portfel (1000 USDT, x2).
- Telegram tokeni repo sozlamasida `TELEGRAM_TOKEN` yashirin o'zgaruvchisida.
- Holat `holat.json` da saqlanadi.
- Miya (`miya.py`, `miya.npz`): noldan o'qitilgan kichik transformer, oxirgi 64 ta 4 soatlik shamni o'qib, keyingi 2 kun uchun bashorat beradi. Har signal ostida uning fikri ("rozi" / "rozi emas") yoziladi; qarorni foydalanuvchi qiladi.
