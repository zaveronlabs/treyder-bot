# Treyder AI bot

4 soatlik trend tizimi asosidagi Telegram signal boti. GitHub Actions har 15 daqiqada `bulut.py` ni ishga tushiradi.

- Qoida (4h): narx EMA150 dan yuqori, 60 shamda o'sgan va EMA600 dan yuqori bo'lsa, LONG; aks holda naqd.
- Signal 5 ta tanga bo'yicha: BTC, ETH, SOL, BNB, XRP (miya 10 tangani kuzatadi).
- Avto sinov rejimi (3 oy): 8 ta qog'oz portfel parallel (faqat qoida, faqat miya, qoida + miya, qoida + miya + yangiliklar, AI treyder, miya short: miya -0.1 dan past bashorat bersa short) va 7-yo'l: asosiy yo'l naqdda turganda short miyasi (`miya_short.npz`, tushish ehtimoli) 0.45 dan yuqori desa short; 8-yo'l: faqat qoida, lekin foydadagi pozitsiya eng yuqori nuqtasidan 5 ATR qaytsa yopiladi (iz chiqish). Hisobotda yo'llar birikmalari (⚖️, 🔀) ham ko'rsatiladi. Asosiysi: qoida va miya rozi bo'lsa (miya bashorati 0.02 dan yuqori) long, aks holda yopadi (1000 USDT, har tangaga 200 USDT, x2, 0.05% komissiya). Har savdo Telegramga yoziladi, har hafta hisobot; /hisobot, /holat, /jurnal, /yangilik, /ai.
- Telegram tokeni repo sozlamasida `TELEGRAM_TOKEN` yashirin o'zgaruvchisida.
- Holat `holat.json` da saqlanadi.
- Miya (`miya.py`, `miya.npz`): noldan o'qitilgan kichik transformer, oxirgi 64 ta 4 soatlik shamni o'qib, keyingi 2 kun uchun bashorat beradi. Har signal ostida uning fikri ("rozi" / "rozi emas") yoziladi; qarorni foydalanuvchi qiladi.
- Miya har oy yangi ma'lumotda o'zi qayta o'qiydi (`oqit.py`, `oqitish.yml`): bot oy almashganini `miya_sana.txt` dan bilib, o'qitishni ishga tushiradi. Asosiy miya 2019 dan beri tarixda (amalda 2020-09 dan, hamma tanga bor bo'lgan davr) o'qiydi, short miyasi 2022-10 dan.
- Futures ma'lumoti (`futures_yig.py`, `futures_yigish.yml`): oyda bir marta Gate.io dan ochiq pozitsiyalar, longchi/shortchi nisbati, likvidatsiyalar va funding `futures-malumot` shoxobchasiga yig'iladi (keyinchalik miyani o'qitish uchun).
- Yangilik AI (`yangilik.py`, `yangilik.yml`): har 4 soatlik sham yopilishidan oldin kripto saytlarining so'nggi 24 soatlik sarlavhalarini o'qiydi, ochiq til modeli (Qwen 2.5 7B, Ollama orqali shu serverda) har biriga -2..+2 baho beradi, natija `yangilik.json` ga yoziladi. 4-yo'l yangiliklar salbiy bo'lsa (-0.2 dan past) kirmaydi.
- AI treyder (`treyder_ai.py`, `struktura.py`, `ai_treyder.yml`): har 4 soatlik sham yopilgandan keyin kod har tanga uchun treyder strukturalarini hisoblaydi (cho'qqi/tublar, tayanch va qarshilik, sinishlar, RSI, hajm, EMA, kunlik grafik), Qwen 2.5 14B ularni trend qoidasi, miya va yangiliklar bilan birga o'qib, long yoki kutish qarorini sabablari bilan beradi (`treyder_ai.json`). U o'z pozitsiyasini, tajriba xotirasini (`tajriba.py`: 2022 dan beri 10 tangadagi eng o'xshash 50 ta holat va ulardan keyin narx nima bo'lgani) va Fear & Greed indeksini ham ko'radi. `orqaga.py` uni o'tgan shamlarda sinaydi. Bot bu qarorlarni 5-yo'lda joriy narxda bajaradi.
- Real pul ijrochisi (`ijro.py`, `ijro.bat`): Binance futures'ga ruxsat bor kompyuterda ishlaydi (GitHub serverlari Binance futures'ga kira olmaydi). `holat.json` dan tanlangan yo'llar (standart: 🔀 uchga bo'lish: faqat qoida + faqat miya + asosiy+short) pozitsiyalarini o'qib, har tanga bo'yicha bitta pozitsiyaga birlashtiradi va limit (maker) order bilan bajaradi. Izolyatsiya marja; leverage zinapoyasi x2 (30 kun foydada) → x3 (14 kun) → x4 (14 kun) → x5, pog'onadagi cho'qqidan 20% tushsa bir pog'ona past. Har pozitsiyaga birjada himoya stopi (marjaning 60% i yo'qolsa), kunlik zarar 10% dan oshsa hammasi yopiladi, bulutdagi bot to'xtasa yangi pozitsiya ochilmaydi. Telegramda /toxtat (hammasini yopib to'xtatish) va /davom. Kalitlar faqat kompyuterdagi `ijro_sozlama.json` da (`python ijro.py sozla`), repoga yozilmaydi. Kalitsiz sinov rejimi (`"quruq": true`): narxlar haqiqiy Binance'dan, 1000 USDT soxta hisob va savdolar kompyuterda (`ijro_quruq.json`) yoziladi.

## Qorovul

`qorovul.yml` har 30 daqiqada `qorovul.py` ni ishga tushiradi: `bot.yml` hech qayerda yurmayotgan bo'lsa uni qayta yoqadi, bot oxirgi 4 soatlik shamni 45 daqiqadan ko'proq kechiktirsa Telegramga ⚠️ yozadi (6 soatda bir eslatadi), tuzalganda ✅ xabar beradi.

## Rasmli hisobot

`rasm.py` haftalik hisobotga va Telegramdagi /rasm buyrug'iga rasm chizadi: 1000$ "uchga bo'lish" (🔀), "yarmi qoida + yarmi short" (⚖) va shunchaki BTC ushlab turishda qanday o'zgargani. Tarix alohida saqlanmaydi, qog'oz yo'llar jurnali va 4 soatlik narxlardan qayta hisoblanadi.

## Real pul tekshiruvi

`tekshir.bat` (`python ijro.py tekshir`): haqiqiy Binance kaliti bilan XRPUSDT da ~6 USDT lik bitta savdo ochadi, birjaga himoya stopi qo'yadi va yopadi (marja ~3 USDT, futures hisobida kamida ~4 USDT kerak). Kalitlar, ruxsatlar va order yo'lini tekshiradi; kalitsiz sinov rejimini o'zgartirmaydi.

## Kichik pul rejimi

Kerakli pozitsiya Binance eng kam order hajmidan kichik, lekin uning yarmidan katta bo'lsa, ijrochi uni eng kamigacha oshiradi (shu orderning marjasi pulning 30% idan oshmasa). Tarixda (2024..hozir, 🔀) 100-300$ hisoblarda o'tkazib yuborishdan yaxshiroq: masalan 200$ da x4.2 o'rniga x5.2. Birja chegaralari ishga tushganda `ijro_qoidalar.json` ga yoziladi.

## Oltin yo'li (sinov)

9-qog'oz yo'l `oltin`: PAXGUSDT kunlik yopilishi 50 kunlik o'rtachadan yuqori va 20 kunda o'sgan bo'lsa long (2x). Hisobotdagi 🥇 qatori: 80% 🔀 + 20% oltin (oltin yo'li butun pulga keltirilgan). Tarixda (2024..hozir, 0.1% xarajat) 🔀 3581$ (eng chuqur -39%) o'rniga 3445$ (-28%). 4 soatlik qoida oltinda zarar ko'rsatdi.

## Katta miya sinovi (videokartada)

`katta_miya.bat` (`katta_miya.py`): Gojo kompyuteridagi NVIDIA videokartada hozirgi miya bilan bir xil ma'lumot va walk-forward sinovda (2024-01 dan 6 ta yarim yil, 3 seed) kichik (0.17M), o'rta (1M) va katta (5.3M parametr) modellarni o'qitadi. Natija va jurnal `katta/` papkasida; to'xtab qolsa qayta ishga tushirilganda davom etadi.

`kop_miya.bat` (`python katta_miya.py kop`): xuddi shu sinov, lekin miya 30 ta tangada o'qiydi (3 baravar ko'p misol), baho faqat asosiy 10 tangada; kichik va o'rta model. Natija `katta/natija_kop_<o'lcham>.json`.

## Ikki tub shakli (sinov)

6 ta grafik shakli (double top/bottom, head&shoulders va teskarisi, rising/falling wedge) 2022-10..2026-10 tarixda (10 tanga, 4 soatlik) avtomatik topilib sinaldi: faqat ikki tub (double bottom) ishladi (12 shamda o'rtacha +1.03% vs oddiy +0.08%, ikkala yarim davrda musbat). `ikki_tub` yo'li: shakl bo'yni yorilganda long, 12 sham (2 kun) ushlaydi. `qoida_tub`: qoida yoki ikki tub; hisobotdagi 🔲 qatori 🔀 dagi qoida o'rniga shuni oladi (tarixda 3581$ -> 3847$).
