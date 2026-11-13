"use strict";
// ---------- YO'L: IELTS asoslari, har kun bitta mavzu ----------
// Har dars: tush (tushuntirish kartalari), nam (namuna), mashq (kichik mashqlar), main (asosiy vazifa), sinov (kichik test).
// Karta: { h: sarlavha, p: [matn (html)], ex: [[inglizcha, o'zbekcha]], txt: inglizcha parcha, chart: Task 1 grafigi, note: eslatma }
const yP = (q, a, o, why) => ({ k: "pick", q, a, o, why });
const yF = (s, a, o, uz, why) => ({ k: "fill", s, a, o, uz, why });
const yT = (pre, s, a, uz, why) => ({ k: "type", pre, s, a, uz, why });
const yO = (en, uz, extra) => ({ k: "order", en, uz, extra });
const yS = (en, uz) => ({ k: "speak", en, uz });
// eshitib yozish (a: to'g'ri javoblar) yoki eshitib tanlash (o: noto'g'ri variantlar)
const yD = (en, a, q, o, why) => ({ k: "dict", en, a, q, o, why });
const yTx = (t, s) => `<span class="ytx">${t}</span>${s ? `<b>${s}</b>` : ""}`;
const TFN = (text, st, a, why) => yP(yTx(text, st), a, ["TRUE", "FALSE", "NOT GIVEN"].filter((x) => x !== a), why);
const YNN = (text, st, a, why) => yP(yTx(text, st), a, ["YES", "NO", "NOT GIVEN"].filter((x) => x !== a), why);

const YT_A = "The Green Market opened in 1987. It sells fresh fruit, vegetables and bread. More than 5,000 customers visit it every weekend.";
const YT_B = "Lake Tana is the largest lake in Ethiopia. Around 3 million people live near it, and most of them work in fishing or farming. In 2015 it became a protected area.";
const YT_C = "Coffee was first drunk in Ethiopia. It reached Europe in the 1600s, where it quickly became popular. Today, Brazil produces more coffee than any other country.";
const YT_D = "The Blue Bridge was built in 1932. It is 400 metres long and was the longest bridge in the country until 1975. Cars are no longer allowed to cross it.";

const YOL = [
  // ================= 1-HAFTA =================
  {
    id: "k01", sk: "Umumiy", ic: "🧭", t: "IELTS qanday tuzilgan", goal: "Imtihon nechta qismdan iborat, ball qanday qo'yiladi va 6.5 uchun nima kerakligini bilib olasan.",
    tush: [
      { h: "IELTS: 4 ta qism", p: ["IELTS ingliz tilini 4 tomondan tekshiradi:", "🎧 <b>Listening</b>: 30 daqiqa, 40 savol<br>📖 <b>Reading</b>: 60 daqiqa, 40 savol<br>✍️ <b>Writing</b>: 60 daqiqa, 2 ta vazifa<br>🎤 <b>Speaking</b>: 11–14 daqiqa, imtihonchi bilan suhbat", "Senga <b>Academic</b> turi kerak: universitet va grantlar aynan shuni so'raydi."] },
      { h: "Ball qanday qo'yiladi", p: ["Har qism 0 dan 9 gacha baholanadi. Bu <b>band</b> deyiladi.", "Umumiy ball = 4 ta qismning o'rtachasi. U eng yaqin yarimtaga yaxlitlanadi.", "Masalan: Listening 6.5, Reading 6.5, Writing 6.0, Speaking 6.5. O'rtacha 6.375, demak umumiy ball <b>6.5</b>."], note: "Bir qism past chiqsa ham, boshqasi uni ko'tarib ketadi." },
      { h: "6.5 uchun nechta to'g'ri javob kerak", p: ["Listening: 40 tadan <b>26–29 ta</b> to'g'ri = 6.5", "Reading: 40 tadan <b>27–29 ta</b> to'g'ri = 6.5", "Ya'ni 40 tadan 11–13 tasida xato qilsang ham 6.5 olasan. Hammasini bilish shart emas."], note: "Xato javob uchun ball ayirilmaydi. Shuning uchun hech qachon bo'sh joy qoldirma." },
      { h: "Bu yo'l qanday ishlaydi", p: ["Har kuni <b>bitta mavzu</b>. Uni 5 qadamda o'rganasan:", "1. Tushuntirish (o'zbekcha)<br>2. Namuna: qanday qilinadi<br>3. Kichik mashqlar<br>4. Asosiy vazifa: haqiqiy IELTS topshirig'i<br>5. Kichik test", "Testdan o'tsang, kun yopiladi va ertaga keyingi mavzu ochiladi. 4 haftada imtihonning hamma qismini birma-bir o'rganib chiqamiz."] },
    ],
    nam: [
      { h: "Imtihon kuni qanday o'tadi", p: ["Listening, Reading va Writing ketma-ket, tanaffussiz o'tadi: jami 2 soat 40 daqiqacha.", "Speaking alohida: o'sha kuni yoki boshqa kuni, imtihonchi bilan yakkama-yakka."] },
      { h: "Eng muhim 3 qoida", p: ["<b>1. Bo'sh joy qoldirma.</b> Bilmasang ham taxmin qilib yoz.", "<b>2. So'z limitiga qara.</b> “NO MORE THAN TWO WORDS” deyilgan bo'lsa, 3 ta so'z yozsang, javob xato.", "<b>3. Imlo muhim.</b> So'z noto'g'ri yozilsa, javob xato hisoblanadi."] },
    ],
    mashq: [
      yP("IELTS'da nechta qism bor?", "4 ta", ["2 ta", "3 ta", "5 ta"]),
      yP("Reading qismi qancha davom etadi?", "60 daqiqa", ["30 daqiqa", "40 daqiqa", "90 daqiqa"]),
      yP("Javobni bilmasang, nima qilasan?", "Taxmin qilib bo'lsa ham yozaman", ["Bo'sh qoldiraman", "Savolni o'tkazib yuboraman"], "Xato javob uchun ball ayirilmaydi. Bo'sh joy esa aniq 0 ball."),
      yP("Ko'rsatma: <b>NO MORE THAN TWO WORDS</b>. Qaysi javob xato hisoblanadi?", "the city centre", ["city centre", "centre", "bus station"], "<b>the city centre</b> 3 ta so'z. Limit 2 ta so'z edi."),
      yP("Ballaring: Listening 6.5, Reading 6.5, Writing 6.0, Speaking 6.0. Umumiy ball nechchi?", "6.5", ["6.0", "7.0"], "O'rtacha 6.25. U yuqoriga, eng yaqin yarimtaga yaxlitlanadi: 6.5."),
    ],
    main: [],
    sinov: [
      yP("Listening'da nechta savol bor?", "40 ta", ["20 ta", "30 ta", "60 ta"]),
      yP("Writing qismida nechta vazifa bor?", "2 ta", ["1 ta", "3 ta", "4 ta"]),
      yP("Speaking qanday o'tadi?", "Imtihonchi bilan yuzma-yuz suhbat", ["Javoblar qog'ozga yoziladi", "Guruh bo'lib bahslashiladi"]),
      yP("Reading'da 40 tadan taxminan nechta to'g'ri javob 6.5 beradi?", "27–29 ta", ["15–18 ta", "20–22 ta", "38–40 ta"]),
      yP("Javobda imlo xatosi bo'lsa (masalan <b>enviroment</b>), nima bo'ladi?", "Javob xato hisoblanadi", ["Yarim ball beriladi", "Baribir to'g'ri hisoblanadi"]),
    ],
  },
  {
    id: "k02", sk: "Listening", ic: "🎧", t: "Listening Part 1: raqam, sana va ismlar", goal: "Telefon raqami, sana, narx va harflab aytilgan ismni eshitib, xatosiz yozishni o'rganasan.",
    tush: [
      { h: "Part 1 nima", p: ["Ikki kishi oddiy vaziyatda gaplashadi: kursga yozilish, kvartira ijarasi, sport zaliga a'zo bo'lish.", "Sen esa forma to'ldirasan: ism, telefon, sana, narx.", "Bu Listening'ning eng oson qismi. Bu yerda 10 tadan 9–10 ta ball yig'ish kerak."] },
      { h: "Raqamlar", p: ["Telefon raqami bittalab aytiladi. <b>0</b> ko'pincha <b>oh</b> deb o'qiladi.", "<b>double five</b> = 55, <b>triple two</b> = 222.", "Eng ko'p xato: <b>thirteen</b> (13) va <b>thirty</b> (30). 13 da urg'u oxirida: thir-TEEN. 30 da boshida: THIR-ty."], ex: [["My number is oh seven seven, double five, three one two.", "07755312"], ["It costs thirteen pounds.", "13 funt"], ["It costs thirty pounds.", "30 funt"]] },
      { h: "Sana va narx", p: ["Sana: <b>the twenty-first of March</b>. Yozishda: <b>21 March</b> yoki <b>March 21</b>. Ikkalasi ham to'g'ri.", "Narx: <b>fifteen pounds fifty</b> = £15.50.", "Formada £ yoki $ belgisi allaqachon turgan bo'lsa, faqat raqamni yoz."], ex: [["The course starts on the twenty-first of March.", "Kurs 21-martda boshlanadi."]] },
      { h: "Ismni harflab aytish", p: ["Ism va familiya deyarli har doim harflab aytiladi. Harflar nomini bilish shart.", "Chalkashadiganlar: <b>A</b> (ey), <b>E</b> (i), <b>I</b> (ay). <b>G</b> (ji) va <b>J</b> (jey).", "<b>double L</b> = LL."], ex: [["My surname is Karimov. That's K, A, R, I, M, O, V.", "Familiyam Karimov."]] },
    ],
    nam: [
      { h: "Avval formani o'qi", p: ["Audio boshlanishidan oldin 30 soniya vaqt beriladi. Shu vaqtda har bo'sh joyga <b>nima turi</b> kerakligini taxmin qil:", "Name: ______ → ism (harflab aytiladi)<br>Phone: ______ → raqam<br>Start date: ______ → kun va oy<br>Fee: £______ → narx", "Nima kutayotganingni bilsang, eshitish ancha oson bo'ladi."] },
      { h: "Namuna", p: ["Formada: <b>Surname: ______</b>", "Javob: <b>Sadikov</b>. Harflarni eshitayotganda darhol yozib bor, keyinga qoldirma."], ex: [["Can I take your surname, please?", "Familiyangizni yozib olsam maylimi?"], ["Yes, it's Sadikov. That's S, A, D, I, K, O, V.", "Ha, Sadikov."]] },
    ],
    mashq: [
      yD("My phone number is oh seven seven, double five, three one two.", ["07755312"], "Telefon raqamini yoz", null, "oh = 0, double five = 55."),
      yD("The course starts on the thirteenth of May.", ["13 may", "may 13", "13th may", "may 13th", "13 of may"], "Kurs qachon boshlanadi? Kun va oyni yoz", null, "thirteenth = 13. Urg'u oxirida: thir-TEENTH."),
      yD("My surname is Rakhimov. That's R, A, K, H, I, M, O, V.", ["rakhimov"], "Familiyani yoz"),
      yD("The ticket costs thirty pounds.", ["30", "30 pounds"], "Chipta necha funt? Raqam yoz", null, "THIR-ty = 30. Urg'u boshida."),
      yD("Your room is number fifteen.", ["15"], "Xona raqami nechchi?", null, "fif-TEEN = 15. Urg'u oxirida."),
    ],
    main: [{ k: "ls", a: { id: "l_course" } }],
    sinov: [
      yD("My number is oh nine eight, double two, four six one.", ["09822461"], "Telefon raqamini yoz"),
      yD("The class starts on the thirtieth of June.", ["30 june", "june 30", "30th june", "june 30th", "30 of june"], "Dars qachon boshlanadi? Kun va oyni yoz"),
      yD("Her surname is Jensen. That's J, E, N, S, E, N.", ["jensen"], "Familiyani yoz"),
      yD("It costs fourteen dollars a week.", ["14", "14 dollars"], "Haftasiga necha dollar? Raqam yoz"),
      yP("Audio'da <b>double seven</b> deyildi. Nima yozasan?", "77", ["7", "27", "777"]),
    ],
  },
  {
    id: "k03", sk: "Reading", ic: "📖", t: "Reading: kalit so'z va sinonimlar", goal: "Matnni to'liq o'qimasdan, kerakli javobni tez topishni o'rganasan.",
    tush: [
      { h: "Matnni to'liq o'qima", p: ["Reading'da 60 daqiqada 3 ta matn va 40 ta savol bor. Har so'zni o'qishga vaqt yetmaydi.", "Ikki usul kerak:", "<b>Skimming</b>: matnga 2 daqiqada ko'z yugurtirib, har paragraf nima haqida ekanini bilib olish.", "<b>Scanning</b>: aniq bir so'zni, raqamni yoki ismni ko'z bilan qidirish."] },
      { h: "Kalit so'z", p: ["Savolni o'qi va eng muhim so'zlarni top. Eng yaxshilari: <b>ismlar, raqamlar, yillar, joy nomlari</b>.", "Ular matnda o'zgarmaydi, shuning uchun tez topiladi.", "Masalan savol: “The market opened in ___.” Kalit so'z: <b>market, opened</b>. Javob: yil bo'lishi kerak."] },
      { h: "Sinonim tuzog'i", p: ["Savol matndagi so'zni ko'chirmaydi. O'sha ma'noni <b>boshqa so'z</b> bilan aytadi.", "Shuning uchun bir xil so'zni emas, bir xil <b>ma'noni</b> qidir."], ex: [["Driving became expensive.", "Matnda"], ["Car travel became more costly.", "Savolda: xuddi shu ma'no"], ["The number fell sharply.", "Matnda"], ["The figure dropped quickly.", "Savolda: xuddi shu ma'no"]] },
      { h: "Bo'sh joyni to'ldirish qoidasi", p: ["Javob matndan <b>aynan ko'chiriladi</b>. So'zni o'zgartirmaysan, sinonim yozmaysan.", "So'z limitiga qara: “ONE WORD ONLY” bo'lsa, faqat bitta so'z.", "Yozganingdan keyin gapni o'qib ko'r: grammatik to'g'ri chiqishi kerak."] },
    ],
    nam: [
      { h: "Namuna: 4 qadam", txt: "In 1995, the city of Portland opened its first tram line. At first, only 12,000 people used it each day, but after ticket prices were cut in 2001, the number of daily passengers doubled.", p: ["Savol: <b>After 2001, the number of daily ___ doubled.</b>", "1. Kalit so'z: <b>2001</b> va <b>doubled</b>.<br>2. Matndan shu so'zlarni top: oxirgi gapda.<br>3. Atrofini o'qi: “the number of daily passengers doubled”.<br>4. So'zni aynan ko'chir: <b>passengers</b>."] },
      { h: "Sinonimli savol", txt: "In 1995, the city of Portland opened its first tram line. At first, only 12,000 people used it each day, but after ticket prices were cut in 2001, the number of daily passengers doubled.", p: ["Savol: <b>Tickets became cheaper in ___.</b>", "Matnda “cheaper” so'zi yo'q. Lekin “ticket prices were cut” bor: narxlar tushirildi = arzonlashdi.", "Javob: <b>2001</b>."] },
    ],
    mashq: [
      yT(YT_A, "The market opened in ___.", ["1987"], "Bozor ...-yilda ochilgan.", "Kalit so'z: opened. Matnda: “opened in 1987”."),
      yT(YT_A, "Over 5,000 ___ come to the market every weekend.", ["customers"], "Har dam olish kuni bozorga 5000 dan ortiq ... keladi.", "more than = over, visit = come. So'z matndan aynan olinadi: customers."),
      yP("Matnda: <b>The price of oil rose sharply.</b><br>Qaysi gap shu ma'noni beradi?", "Oil became much more expensive.", ["Oil became cheaper.", "Oil was hard to find."], "rose sharply = keskin o'sdi. Narx o'sdi = qimmatlashdi."),
      yP("<b>Scanning</b> nima?", "Matndan aniq so'z yoki raqamni tez qidirish", ["Matnni boshidan oxirigacha sekin o'qish", "Matnni tarjima qilish"]),
      yP("Ko'rsatma: <b>ONE WORD ONLY</b>.<br>Matn: “...a serious shortage of clean water”.<br>Savol: “The village suffered from a ___ of clean water.”", "shortage", ["serious shortage", "lack", "water"], "Faqat bitta so'z va matndan aynan: shortage. “lack” ma'nosi to'g'ri, lekin u matnda yo'q."),
    ],
    main: [{ k: "rd", a: { id: "r_bike", only: ["gap", "mcq"], xt: 1.5 } }],
    sinov: [
      yT(YT_B, "About 3 million people ___ close to the lake.", ["live"], "3 millionga yaqin odam ko'l yaqinida ..."),
      yT(YT_B, "The lake became a protected area in ___.", ["2015"], "Ko'l ...-yilda qo'riqlanadigan hududga aylangan."),
      yP("Matnda: <b>The number of visitors fell.</b><br>Savolda qaysi so'z shu ma'noni beradi?", "decreased", ["increased", "stayed the same", "doubled"]),
      yP("Savolda qaysi so'zlarni birinchi qidirasan?", "Ismlar, raqamlar va yillarni", ["the, a, of kabi kichik so'zlarni", "Eng uzun so'zlarni"]),
      yP("Bo'sh joyni to'ldirishda javobni qayerdan olasan?", "Matndan aynan ko'chiraman", ["O'z so'zim bilan yozaman", "Sinonimini yozaman"]),
    ],
  },
  {
    id: "k04", sk: "Writing Task 1", ic: "📊", t: "Task 1: grafikka kirish va overview", goal: "Chiziqli grafik uchun birinchi ikki qismni yozishni o'rganasan: kirish va overview.",
    tush: [
      { h: "Task 1 nima", p: ["Senga grafik beriladi. 20 daqiqada, kamida 150 so'z bilan uni tasvirlaysan.", "O'z fikringni yozmaysan. Faqat ko'rganingni aytasan.", "Javob har doim 4 qismdan iborat:", "1. <b>Kirish</b> (1 gap)<br>2. <b>Overview</b> (2 gap)<br>3. <b>Tafsilot 1</b><br>4. <b>Tafsilot 2</b>", "Bugun faqat birinchi ikkitasini o'rganamiz."] },
      { h: "Kirish: savolni boshqa so'z bilan ayt", p: ["Kirish bitta gap. Formulasi:", "<b>The line graph shows</b> + nima + qayerda + qachon.", "Savolni so'zma-so'z ko'chirma. 2–3 ta so'zni almashtir:", "shows → <b>illustrates</b><br>the percentage of → <b>the proportion of</b><br>between 2000 and 2020 → <b>from 2000 to 2020</b>"], ex: [["The graph shows the percentage of households with internet access between 2000 and 2020.", "Savol"], ["The line graph illustrates the proportion of households that had internet access from 2000 to 2020.", "Sening kirishing"]] },
      { h: "O'sish va pasayish so'zlari", p: ["⬆️ o'sdi: <b>rose, increased, grew</b>", "⬇️ tushdi: <b>fell, decreased, dropped</b>", "➡️ o'zgarmadi: <b>stayed the same, remained stable</b>", "Qanday tezlikda:", "<b>sharply</b> = keskin<br><b>steadily</b> = bir tekis<br><b>slightly</b> = ozgina"], ex: [["The number rose sharply.", "Son keskin o'sdi."], ["Prices fell slightly.", "Narxlar ozgina tushdi."]] },
      { h: "Overview: eng katta rasm", p: ["Overview 2 gap. Unda <b>raqam yo'q</b>, faqat umumiy manzara.", "O'zingga 2 ta savol ber:", "1. Umuman olganda o'sdimi yoki tushdimi?<br>2. Kim eng baland, kim eng past?", "Har doim <b>Overall,</b> so'zi bilan boshlanadi."], note: "Overview bo'lmasa, Task 1 dan 5 dan yuqori ball olib bo'lmaydi. Bu eng muhim qism." },
    ],
    nam: [
      { h: "1-qadam: grafikka 30 soniya qara", chart: "w1_internet", p: ["Yozishdan oldin faqat qarab, 3 ta narsani top:", "• Uchala chiziq ham yuqoriga ketyapti.<br>• Country A doim eng baland.<br>• Oxiriga kelib oradagi farq kichraygan.", "Overview aynan shu uch narsadan yasaladi."] },
      { h: "2-qadam: kirish va overview", chart: "w1_internet", p: ["<b>Kirish:</b>"], ex: [["The line graph illustrates the proportion of households that had internet access in three countries from 2000 to 2020.", "Savol boshqa so'zlar bilan aytildi."], ["Overall, internet access grew in all three countries, and Country A had the highest level during the whole period.", "Overview 1: umumiy yo'nalish va eng baland."], ["By 2020, the gap between the countries became much smaller.", "Overview 2: farq kichraydi. Raqam yo'q."]] },
    ],
    mashq: [
      yF("The number of users ___ from 10% to 48%.", "rose", ["rose", "fell", "stayed"], "Foydalanuvchilar soni 10% dan 48% ga o'sdi.", "10 dan 48 ga: yuqoriga, demak rose."),
      yP("<b>fell sharply</b> nimani bildiradi?", "Keskin tushdi", ["Sekin o'sdi", "O'zgarmadi", "Ozgina tushdi"]),
      yP("Overview qaysi so'z bilan boshlanadi?", "Overall,", ["In my opinion,", "For example,", "Firstly,"]),
      yP("Qaysi gap overview uchun to'g'ri keladi?", "Overall, sales increased in both countries.", ["In 2005, sales were 45% in France.", "I think sales will grow in the future."], "Overview'da raqam ham, shaxsiy fikr ham bo'lmaydi. Faqat umumiy yo'nalish."),
      yO("The line graph illustrates the number of visitors from 2010 to 2020.", "Chiziqli grafik 2010-yildan 2020-yilgacha tashrif buyuruvchilar sonini ko'rsatadi."),
    ],
    main: [{ k: "w1", a: { id: "w1_internet", minW: 40, lim: 15, tpl: true, lbl: "Yozish: kirish va overview", part: "Bugun faqat kirish va overview yoz: jami 3 ta gap. Tafsilotlarni keyingi Writing darsida qo'shamiz.", model: "The line graph illustrates the proportion of households that had internet access in three countries from 2000 to 2020.\n\nOverall, internet access grew in all three countries, and Country A had the highest level during the whole period. By 2020, the gap between the countries became much smaller.", chk: ["Kirishda savolni ko'chirmadim, so'zlarni almashtirdim", "Overview “Overall,” bilan boshlanadi", "Overview'da raqam yo'q", "O'z fikrimni yozmadim"] } }],
    sinov: [
      yF("Prices ___ steadily between 2000 and 2010.", "fell", ["fell", "rose", "remained"], "Narxlar 2000–2010 yillarda bir tekis pasaydi."),
      yP("Task 1 kirishida <b>shows</b> o'rniga qaysi so'zni yozsa bo'ladi?", "illustrates", ["thinks", "increases", "believes"]),
      yP("Overview'da nima bo'lmaydi?", "Aniq raqamlar", ["Asosiy yo'nalish", "Kim eng baland ekani"]),
      yP("Task 1 da qaysi gapni yozish mumkin emas?", "I think this is a good change.", ["Overall, the figure rose.", "The graph shows data for three cities."], "Task 1 da shaxsiy fikr yozilmaydi."),
      yP("<b>slightly</b> nimani bildiradi?", "Ozgina", ["Keskin", "Bir tekis", "Ikki barobar"]),
    ],
  },
  {
    id: "k05", sk: "Speaking", ic: "🎤", t: "Speaking Part 1: javobni kengaytirish", goal: "Qisqa “yes/no” o'rniga 2–3 gapli to'liq javob berishni o'rganasan.",
    tush: [
      { h: "Part 1 nima", p: ["4–5 daqiqa. Imtihonchi sen haqingda oddiy savollar beradi: ishing, uying, yoqtirgan narsalaring.", "U bilimingni emas, <b>qanday gapirishingni</b> baholaydi. To'g'ri yoki noto'g'ri javob yo'q."] },
      { h: "Eng katta xato: qisqa javob", p: ["“Do you like your job?” deb so'rashsa, “Yes.” deyish yetarli emas. Imtihonchi baholay oladigan narsa qolmaydi.", "Formula: <b>Javob + Sabab + Misol</b>. Jami 2–3 gap."], ex: [["Yes, I do.", "Javob"], ["It keeps me active because I move around all day.", "Sabab"], ["For example, I walk about ten kilometres at work.", "Misol"]] },
      { h: "O'ylashga vaqt beradigan so'zlar", p: ["Javobni darhol topa olmasang, jim turma. Shu so'zlar bilan boshla:"], ex: [["Well, I usually cook at home.", "Xo'sh, ..."], ["To be honest, I don't watch TV very often.", "Rostini aytsam, ..."], ["Actually, I prefer tea to coffee.", "Aslida, ..."], ["I've never thought about it, but I guess it's important.", "Bu haqda o'ylamaganman, lekin ..."]] },
      { h: "Nima baholanadi", p: ["4 ta narsa: <b>ravonlik</b>, <b>so'z boyligi</b>, <b>grammatika</b>, <b>talaffuz</b>.", "Xato qilsang, to'xtama va uzr so'rama. Shunchaki davom et. To'xtab qolish xatodan ko'ra ko'proq ball oladi."] },
    ],
    nam: [
      { h: "Savol: What do you do?", p: ["Zaif javob: <span class=\"ybad\">I am worker.</span>", "Kuchli javob:"], ex: [["I work in a warehouse.", "Javob"], ["I load and unload boxes, so it is quite a physical job.", "Tushuntirish"], ["To be honest, it is tiring, but it keeps me fit.", "Fikr"]] },
      { h: "Savol: Would you like to change your job?", p: ["Kuchli javob:"], ex: [["Yes, definitely.", "Javob"], ["I'm planning to study abroad because I want a better career.", "Sabab"], ["That's why I'm learning English every day.", "Natija"]] },
    ],
    mashq: [
      yP("<b>Do you like music?</b><br>Part 1 uchun eng yaxshi javob qaysi?", "Yes, I do. I listen to music every day because it helps me relax.", ["Yes.", "Yes, I like."], "Javob + sabab bor. “Yes, I like” grammatik xato: like dan keyin nima yoqishi aytilishi kerak."),
      yO("I like it because it keeps me active.", "Menga yoqadi, chunki u meni harakatda ushlab turadi."),
      yF("To be ___, I don't cook very often.", "honest", ["honest", "true", "real"], "Rostini aytsam, men tez-tez ovqat pishirmayman."),
      yP("Part 1 javobi formulasi qaysi?", "Javob + sabab + misol", ["Faqat ha yoki yo'q", "Savolni takrorlash"]),
      yS("I work in a warehouse, so it is quite a physical job.", "Men omborda ishlayman, shuning uchun bu ancha jismoniy ish."),
    ],
    main: [{ k: "sp1", a: { id: "p1_work" } }],
    sinov: [
      yP("<b>Where do you live?</b><br>Eng yaxshi javob qaysi?", "I live in Tashkent. It's a big city, so there is always something to do.", ["Tashkent.", "I live Tashkent city."]),
      yF("I enjoy my job ___ I meet new people.", "because", ["because", "but", "so"], "Ishim menga yoqadi, chunki yangi odamlar bilan tanishaman."),
      yP("Savolga nima deyishni bilmayapsan. Qaysi javob yaxshi?", "I've never thought about it, but I guess it's important.", ["I don't know.", "No answer."]),
      yP("Part 1 da bitta javob qancha bo'lishi kerak?", "2–3 gap", ["1 ta so'z", "1 daqiqalik nutq"]),
      yP("Gapirayotib xato qilding. Nima qilasan?", "To'xtamay davom etaman", ["Jim bo'lib qolaman", "Uzr so'rab, boshidan boshlayman"]),
    ],
  },
  { id: "t1", rev: true, ic: "🔁", t: "1-hafta takrori", of: ["k01", "k02", "k03", "k04", "k05"], extra: { k: "ls", a: { id: "l_gym" } } },
  {
    id: "k06", sk: "Speaking", ic: "🎤", t: "Speaking Part 1: to'g'ri zamon va odatlar", goal: "Savol qaysi zamonda bo'lsa, o'sha zamonda javob berishni va odatlaring haqida gapirishni o'rganasan.",
    tush: [
      { h: "Savoldagi zamonni ushla", p: ["Savol qanday boshlansa, javob ham shunday boshlanadi:", "<b>Do you...?</b> → Yes, I do. / No, I don't.<br><b>Did you...?</b> → Yes, I did. / No, I didn't.<br><b>Have you ever...?</b> → Yes, I have. / No, I haven't.<br><b>Would you like...?</b> → Yes, I'd like to ..."], note: "Savol o'tgan zamonda bo'lsa-yu, sen hozirgi zamonda javob bersang, bu grammatik xato sanaladi." },
      { h: "Odatlar haqida", p: ["Qanchalik tez-tez: <b>always, usually, often, sometimes, hardly ever, never</b>.", "Bu so'zlar fe'ldan <b>oldin</b> turadi."], ex: [["I usually get up at six.", "Odatda oltida turaman."], ["I hardly ever eat fast food.", "Fastfudni deyarli yemayman."]] },
      { h: "Faqat “I like” dema", p: ["Bir xil so'zni takrorlasang, so'z boyligi bali tushadi. Darajalar:"], ex: [["I'm really into football.", "Futbolga juda qiziqaman."], ["I quite like cooking.", "Ovqat pishirish menga ancha yoqadi."], ["I don't mind getting up early.", "Erta turishga qarshi emasman."], ["I'm not a big fan of horror films.", "Qo'rqinchli filmlarni unchalik yoqtirmayman."], ["I can't stand traffic jams.", "Tirbandlikka chiday olmayman."]] },
      { h: "Ilgari va hozir", p: ["Ilgari bo'lgan, hozir yo'q narsa uchun: <b>used to</b>."], ex: [["I used to play football, but now I don't have time.", "Ilgari futbol o'ynardim, hozir vaqtim yo'q."], ["There used to be a park here.", "Bu yerda ilgari park bor edi."]] },
    ],
    nam: [
      { h: "Savol: Has your hometown changed much?", p: ["Savol <b>Has ...?</b> bilan boshlangan, javob ham <b>it has</b> bilan:"], ex: [["Yes, it has changed a lot.", "Javob"], ["There used to be small shops, but now there are big shopping centres.", "Ilgari va hozir"]] },
      { h: "Savol: What do you like most about your home?", p: ["“I like” o'rniga boshqa ibora va odat so'zi:"], ex: [["I'm really into my small corner by the window.", "Javob"], ["I usually study there in the evening because it is quiet.", "Odat + sabab"]] },
    ],
    mashq: [
      yP("<b>Did you play sports as a child?</b><br>To'g'ri javob qaysi?", "Yes, I did. I used to play football after school.", ["Yes, I do. I play football after school.", "Yes, I am play football."], "Savol Did bilan, demak javob ham o'tgan zamonda: I did."),
      yF("I ___ get up at six on weekdays.", "usually", ["usually", "yesterday", "already"], "Ish kunlari odatda oltida turaman."),
      yF("I'm not a big ___ of horror films.", "fan", ["fan", "like", "love"], "Qo'rqinchli filmlarni unchalik yoqtirmayman."),
      yO("I used to live in a small village.", "Men ilgari kichik qishloqda yashardim."),
      yS("It has changed a lot since I was a child.", "U mening bolaligimdan beri ancha o'zgardi."),
    ],
    main: [{ k: "sp1", a: { id: "p1_hometown" } }, { k: "sp1", a: { id: "p1_home" } }],
    sinov: [
      yP("<b>Have you ever been abroad?</b><br>To'g'ri javob qaysi?", "No, I haven't, but I'd love to visit Korea.", ["No, I didn't go.", "No, I don't."]),
      yF("I hardly ___ eat fast food.", "ever", ["ever", "never", "always"], "Men fastfudni deyarli yemayman."),
      yF("There ___ to be a cinema here, but it closed.", "used", ["used", "use", "was"], "Bu yerda ilgari kinoteatr bor edi, lekin yopildi."),
      yP("<b>I don't mind cooking.</b><br>Bu nimani bildiradi?", "Ovqat pishirishga qarshi emasman", ["Ovqat pishirishni juda yaxshi ko'raman", "Ovqat pishirishni yomon ko'raman"]),
      yP("<b>Would you like to live in another country?</b><br>To'g'ri javob qaysi?", "Yes, I'd like to live in Korea because I want to study there.", ["Yes, I like live Korea.", "Yes, I lived in Korea."]),
    ],
  },
  // ================= 2-HAFTA =================
  {
    id: "k07", sk: "Reading", ic: "📖", t: "Reading: True / False / Not Given", goal: "Eng ko'p uchraydigan savol turini, ayniqsa FALSE va NOT GIVEN farqini o'rganasan.",
    tush: [
      { h: "Uch xil javob", p: ["Senga gap beriladi. Uni matn bilan solishtirasan:", "<b>TRUE</b>: matn shu gapni tasdiqlaydi.<br><b>FALSE</b>: matn buning aksini aytadi.<br><b>NOT GIVEN</b>: matnda bu haqda ma'lumot yo'q."] },
      { h: "FALSE va NOT GIVEN farqi", p: ["Eng qiyin joyi shu. O'zingga bitta savol ber:", "“Matn bu gapni <b>rad etadimi</b>?”", "Ha, rad etadi → <b>FALSE</b>.<br>Matn bu haqda jim → <b>NOT GIVEN</b>."], note: "O'z bilimingni ishlatma. Hayotda to'g'ri bo'lgan narsa matnda yo'q bo'lsa, javob NOT GIVEN." },
      { h: "Tuzoq so'zlar", p: ["Bu so'zlar gap ma'nosini butunlay o'zgartiradi: <b>all, always, only, never, most, some</b>.", "Matn: “<b>Most</b> students passed.”<br>Savol: “<b>All</b> students passed.”", "Ko'pchilik ≠ hammasi. Javob: <b>FALSE</b>."] },
      { h: "Savollar tartib bilan keladi", p: ["Javoblar matnda savollar tartibida joylashgan.", "1-savol javobini topdingmi? 2-savolniki undan keyinroqda bo'ladi. Ortga qaytib qidirma."] },
    ],
    nam: [
      { h: "Namuna", txt: "The first public library in the town opened in 1890. It was paid for by a local businessman, and at first only men were allowed to borrow books.", p: ["<b>1. The library was opened in the nineteenth century.</b><br>1890-yil = 19-asr. Matn tasdiqlaydi: <b>TRUE</b>.", "<b>2. Women could borrow books from the first day.</b><br>Matnda: “only men were allowed”. Aksini aytyapti: <b>FALSE</b>.", "<b>3. The library had more than 1,000 books.</b><br>Kitoblar soni haqida hech narsa yo'q: <b>NOT GIVEN</b>."] },
    ],
    mashq: [
      TFN(YT_C, "Coffee was first drunk in Brazil.", "FALSE", "Matnda: “first drunk in Ethiopia”. Aksini aytyapti."),
      TFN(YT_C, "Brazil is the world's biggest coffee producer today.", "TRUE", "“produces more coffee than any other country” = eng katta ishlab chiqaruvchi."),
      TFN(YT_C, "Coffee is more popular than tea in Europe.", "NOT GIVEN", "Matnda choy haqida hech narsa yo'q. Rad ham etilmagan, tasdiqlanmagan ham."),
      TFN("Most of the workers arrive by bus.", "All of the workers arrive by bus.", "FALSE", "most = ko'pchiligi, all = hammasi. Ma'no boshqa."),
      yP("Matnda bu haqda hech narsa yozilmagan. Javob qaysi?", "NOT GIVEN", ["TRUE", "FALSE"]),
    ],
    main: [{ k: "rd", a: { id: "r_sleep", xt: 1.3 } }],
    sinov: [
      TFN(YT_D, "The bridge was built before 1950.", "TRUE"),
      TFN(YT_D, "The bridge is still the longest in the country.", "FALSE", "“until 1975”: 1975-yilgacha eng uzuni edi, hozir emas."),
      TFN(YT_D, "Drivers can use the bridge today.", "FALSE", "“Cars are no longer allowed”: mashinalarga endi ruxsat yo'q."),
      TFN(YT_D, "The bridge was designed by a foreign engineer.", "NOT GIVEN"),
      TFN("Some shops close on Sundays.", "Every shop closes on Sundays.", "FALSE", "some = ba'zilari, every = har biri."),
    ],
  },
  {
    id: "k08", sk: "Listening", ic: "🎧", t: "Listening Part 1: tuzoqlar", goal: "Gapiruvchi javobni o'zgartirganda yoki ikkita variant aytganda adashmaslikni o'rganasan.",
    tush: [
      { h: "Javob o'zgaradi", p: ["Gapiruvchi avval bir narsa aytadi, keyin o'zini to'g'rilaydi. To'g'ri javob: <b>oxirgisi</b>.", "Signal so'zlar: <b>sorry, actually, no wait, I mean, but</b>. Shularni eshitsang, oldingi javobni o'chir."], ex: [["It's on Monday. Oh no, sorry, it's on Tuesday.", "Javob: Tuesday"]] },
      { h: "Ikki variant aytiladi", p: ["Audio'da ikkita raqam yoki narx keladi. Qaysi biri kerakligini <b>savol</b> hal qiladi.", "Savol: “Student price: £___” bo'lsa, talabalar narxini kutasan."], ex: [["A single ticket is twelve pounds, but students pay only nine.", "Talaba narxi: 9"]] },
      { h: "Formadagi so'z audio'da boshqacha", p: ["Formada: <b>Cost</b>. Audio'da: price, fee, “it's ... pounds”.", "Formada: <b>Start date</b>. Audio'da: “it begins on ...”.", "Bir xil so'zni emas, bir xil ma'noni kut."] },
      { h: "Yozish qoidalari", p: ["• So'z limitidan oshma.<br>• Ism va joy nomlari bosh harf bilan.<br>• Formada £ turgan bo'lsa, o'zing yana “pounds” deb yozma: faqat raqam."] },
    ],
    nam: [
      { h: "Namuna: sana o'zgardi", p: ["Formada: <b>Start: ______</b>", "“Actually” eshitildi, demak birinchi javob bekor. To'g'ri javob: <b>Wednesday 7th</b>."], ex: [["So the course starts on Monday the fifth?", "Demak kurs dushanba, 5-sanada boshlanadimi?"], ["Actually, it's been moved to Wednesday the seventh.", "Aslida u chorshanba, 7-sanaga ko'chirildi."]] },
    ],
    mashq: [
      yD("The meeting is on Tuesday. Oh no, sorry, it's on Thursday.", ["thursday"], "Uchrashuv qaysi kuni? Inglizcha yoz", null, "“sorry” dan keyingisi to'g'ri: Thursday."),
      yD("A single room is sixty pounds, but with breakfast it's seventy-five.", ["75"], "Nonushta bilan xona necha funt? Raqam yoz", null, "Savol nonushta bilan narxni so'rayapti: 75."),
      yD("My flat number is sixteen. No wait, I mean seventeen.", ["17"], "Kvartira raqami nechchi?", null, "“No wait, I mean” dan keyingisi to'g'ri."),
      yP("Qaysi so'z javob o'zgarishini bildiradi?", "actually", ["and", "also", "because"]),
      yD("The bus leaves at half past eight, but on Sundays it leaves at nine.", ["9", "nine", "9:00", "9.00", "9 00"], "Yakshanba kuni avtobus soat nechada ketadi?"),
    ],
    main: [{ k: "ls", a: { id: "l_flat" } }],
    sinov: [
      yD("We open at ten. Actually, on Saturdays we open at eleven.", ["11", "eleven", "11:00", "11.00", "11 00"], "Shanba kuni soat nechada ochiladi?"),
      yD("The price is forty dollars, but members pay thirty.", ["30"], "A'zolar necha dollar to'laydi? Raqam yoz"),
      yD("Her name is Anna Clark. That's C, L, A, R, K.", ["clark"], "Familiyasini yoz"),
      yD("I'd like to book for Friday. Sorry, I mean Saturday.", ["saturday"], "Qaysi kunga bron qilyapti? Inglizcha yoz"),
      yP("Formada <b>Fee: £___</b> yozilgan. Audio: “It costs twenty pounds.”<br>Bo'sh joyga nima yozasan?", "20", ["twenty pounds £", "£20 pounds", "cost 20"]),
    ],
  },
  {
    id: "k09", sk: "Writing Task 1", ic: "📊", t: "Task 1: tafsilot paragraflari", goal: "Raqamlarni to'g'ri yozish va taqqoslashni o'rganib, birinchi to'liq Task 1 ni yozasan.",
    tush: [
      { h: "Tafsilot paragraflari nima", p: ["Overview'dan keyin 2 ta paragraf keladi. Endi <b>aniq raqamlar</b> yoziladi.", "Hamma raqamni yozma. Faqat muhimlarini tanla:", "• boshlanishi va oxiri<br>• eng baland va eng past nuqta<br>• chiziqlar kesishgan joy"] },
      { h: "Raqam yozish qoliplari", p: ["Bu 4 ta qolip deyarli har grafikka yetadi:"], ex: [["It rose from 10% to 48%.", "10% dan 48% ga o'sdi."], ["It reached 95% in 2020.", "2020-yilda 95% ga yetdi."], ["It stood at 40% in 2000.", "2000-yilda 40% edi."], ["By 2010, it had reached 78%.", "2010-yilga kelib 78% ga yetgan edi."]] },
      { h: "Taqqoslash", p: ["Task 1 da solishtirish shart. Eng oson yo'llari:", "<b>compared with</b> = ...ga nisbatan<br><b>while</b> = esa<br><b>higher than / lower than</b>"], ex: [["In 2000, 40% of households in Country A had internet access, compared with only 10% in Country B.", "A davlatda 40%, B davlatda esa atigi 10%."], ["Coffee rose to 15 cups, while tea fell to 11.", "Qahva o'sdi, choy esa tushdi."]] },
      { h: "Guruhlash", p: ["O'xshash chiziqlarni bitta paragrafga sol.", "Masalan: baland boshlagan davlat 1-paragrafda, pastdan o'sgan ikkitasi 2-paragrafda.", "Yoki: o'sganlar bir paragrafda, tushganlar ikkinchisida."] },
    ],
    nam: [
      { h: "Tafsilot 1", chart: "w1_internet", p: ["Eng baland boshlagan Country A va taqqoslash:"], ex: [["In 2000, 40% of households in Country A had the internet, compared with only 10% in Country B and 2% in Country C.", "Boshlanish nuqtasi + taqqoslash"], ["Country A rose quickly to 78% in 2010 and reached 95% in 2020.", "O'rtasi va oxiri"]] },
      { h: "Tafsilot 2", chart: "w1_internet", p: ["Pastdan o'sgan ikki davlat:"], ex: [["Country B grew steadily from 10% to 48% in 2010 and then to 86% in 2020.", "from ... to ..."], ["Country C stayed under 15% until 2010, but after that it increased sharply to 71%.", "Eng katta o'zgarish"]] },
    ],
    mashq: [
      yF("The figure rose ___ 10% to 48%.", "from", ["from", "at", "in"], "Ko'rsatkich 10% dan 48% ga o'sdi."),
      yF("It ___ 95% in 2020.", "reached", ["reached", "arrived", "grew up"], "2020-yilda 95% ga yetdi."),
      yF("In 2000, the figure for Country A ___ at 40%.", "stood", ["stood", "sat", "put"], "2000-yilda A davlat ko'rsatkichi 40% edi."),
      yF("Country A had 40%, ___ with only 10% in Country B.", "compared", ["compared", "similar", "than"], "A davlatda 40%, B davlatdagi atigi 10% ga nisbatan."),
      yO("Tea consumption fell steadily over the period.", "Choy iste'moli butun davr mobaynida bir tekis tushdi."),
    ],
    main: [{ k: "w1", a: { id: "w1_drinks", minW: 120, lim: 25, tpl: true, lbl: "Yozish: to'liq Task 1 (shablon bilan)" } }],
    sinov: [
      yF("Sales fell ___ 50 to 20.", "from", ["from", "by", "at"], "Savdo 50 dan 20 ga tushdi."),
      yF("___ 2020, the figure had reached 71%.", "By", ["By", "At", "On"], "2020-yilga kelib ko'rsatkich 71% ga yetgan edi."),
      yP("Tafsilot paragrafiga nimani yozasan?", "Eng muhim raqamlar va taqqoslashlarni", ["Grafikdagi hamma raqamlarni", "O'z fikrim va maslahatimni"]),
      yF("Coffee rose to 15 cups, ___ tea fell to 11.", "while", ["while", "because", "so"], "Qahva 15 piyolaga o'sdi, choy esa 11 ga tushdi."),
      yP("<b>It stood at 40%.</b><br>Bu nimani bildiradi?", "40% edi", ["40% ga o'sdi", "40% ga tushdi"]),
    ],
  },
  {
    id: "k10", sk: "Writing Task 2", ic: "✍️", t: "Task 2: savol turlari va kirish", goal: "Insho savolining turini aniqlashni va 2 gapli kirish yozishni o'rganasan.",
    tush: [
      { h: "Task 2 nima", p: ["40 daqiqa, kamida 250 so'z. Bu <b>insho</b>: senga fikr beriladi, sen unga javob yozasan.", "Writing balining uchdan ikki qismi shu vazifadan keladi.", "Tuzilishi har doim bir xil:", "1. <b>Kirish</b> (2 gap)<br>2. <b>Asosiy paragraf 1</b><br>3. <b>Asosiy paragraf 2</b><br>4. <b>Xulosa</b> (2 gap)"] },
      { h: "Savol turlari", p: ["Yozishdan oldin savol turini aniqla:", "<b>1. Fikr:</b> “To what extent do you agree or disagree?”<br><b>2. Ikki fikr:</b> “Discuss both views and give your opinion.”<br><b>3. Muammo va yechim:</b> “What problems does this cause? How can they be solved?”<br><b>4. Afzallik va kamchilik:</b> “Do the advantages outweigh the disadvantages?”"], note: "Savolga to'liq javob bermasang (masalan faqat bitta tomonni yozsang), ball tushadi." },
      { h: "Kirish = 2 gap", p: ["<b>1-gap:</b> savolni o'z so'zing bilan qayta ayt.<br><b>2-gap:</b> o'z fikringni aniq yoz.", "Savol: “University education should be free for everyone.”"], ex: [["It is often argued that higher education should cost nothing for all students.", "1-gap: savol boshqa so'zlar bilan"], ["I partly agree with this view because it gives everyone a fair chance, but it is very expensive for the government.", "2-gap: mening fikrim"]] },
      { h: "Savolni qanday o'zgartirish", p: ["<b>Sinonim qo'y:</b><br>university education → higher education<br>free → cost nothing<br>everyone → all students", "<b>Boshlanishini o'zgartir:</b><br>“It is often argued that ...”<br>“Many people think that ...”<br>“Some people believe that ...”"], note: "Savoldan so'zma-so'z ko'chirilgan gaplar umumiy so'z soniga qo'shilmaydi." },
    ],
    nam: [
      { h: "Yana bir namuna", p: ["Savol: <b>Mobile phones should be banned in schools.</b>"], ex: [["Many people think that students should not be allowed to use mobile phones at school.", "1-gap: banned → should not be allowed"], ["I completely agree with this idea because phones distract children from learning.", "2-gap: fikr + sabab"]] },
      { h: "Fikr bildirish qoliplari", p: ["Shu uchtasidan birini tanlaysan:"], ex: [["I completely agree with this view because it helps students.", "To'liq qo'shilaman"], ["I partly agree with this view.", "Qisman qo'shilaman"], ["I disagree with this idea.", "Qo'shilmayman"]] },
    ],
    mashq: [
      yP("<b>To what extent do you agree or disagree?</b><br>Bu qaysi tur?", "Fikr inshosi (agree/disagree)", ["Muammo va yechim inshosi", "Ikki fikrni muhokama qilish"]),
      yP("<b>What problems does this cause, and how can they be solved?</b><br>Bu qaysi tur?", "Muammo va yechim inshosi", ["Fikr inshosi (agree/disagree)", "Afzallik va kamchilik"]),
      yF("It is often ___ that cities are too crowded.", "argued", ["argued", "arguing", "argue"], "Shaharlar haddan tashqari gavjum, deb tez-tez aytiladi."),
      yP("Kirishning 2-gapida nima yoziladi?", "Mening fikrim", ["Misol", "Xulosa"]),
      yO("I partly agree with this view.", "Men bu fikrga qisman qo'shilaman."),
    ],
    main: [{ k: "w2", a: { id: "w2_uni_free", minW: 30, lim: 15, tpl: true, lbl: "Yozish: insho kirishi", part: "Bugun faqat kirish yoz: 2 ta gap. Birinchisi savolni o'z so'zing bilan, ikkinchisi sening fikring.", model: "It is often argued that higher education should cost nothing for all students. I partly agree with this view because it gives everyone a fair chance, but it is very expensive for the government.", chk: ["Savolni ko'chirmadim, so'zlarni almashtirdim", "Fikrimni aniq yozdim (agree / partly agree / disagree)", "Fikrimga qisqa sabab qo'shdim"] } }],
    sinov: [
      yP("Task 2 da kamida nechta so'z yoziladi?", "250", ["150", "100", "400"]),
      yP("<b>Discuss both views and give your own opinion.</b><br>Bu qaysi tur?", "Ikki fikrni muhokama qilish", ["Muammo va yechim inshosi", "Faqat afzalliklar"]),
      yP("<b>university education</b> o'rniga nima yozsa bo'ladi?", "higher education", ["high school", "education university", "school lessons"]),
      yF("I completely ___ with this idea.", "agree", ["agree", "agreeing", "am agree"], "Men bu fikrga to'liq qo'shilaman."),
      yP("Kirishda savolni so'zma-so'z ko'chirsang nima bo'ladi?", "O'sha so'zlar sanalmaydi va ball tushadi", ["Hech narsa, bu yaxshi", "Ball oshadi"]),
    ],
  },
  {
    id: "k11", sk: "Speaking", ic: "🎤", t: "Speaking Part 2: kartochka", goal: "1 daqiqa tayyorlanib, 1–2 daqiqa to'xtamay gapirishni o'rganasan.",
    tush: [
      { h: "Part 2 nima", p: ["Senga kartochka beriladi: mavzu va 3–4 ta yo'naltiruvchi savol.", "<b>1 daqiqa</b> tayyorlanasan (qog'oz va qalam beriladi).", "Keyin <b>1–2 daqiqa</b> yolg'iz o'zing gapirasan. Imtihonchi jim tinglaydi."] },
      { h: "1 daqiqani qanday ishlatish", p: ["To'liq gap yozma: ulgurmaysan.", "Har savol uchun <b>2–3 ta kalit so'z</b> yoz. Masalan:", "who → uncle, driver<br>how → family, childhood<br>what → taught me to work hard<br>why → never gives up"] },
      { h: "Nutq tuzilishi", p: ["1. <b>Kirish gapi</b><br>2. Savollar tartibi bilan<br>3. <b>“Why”</b> qismi: eng uzun bo'lsin<br>4. <b>Yakun gapi</b>"], ex: [["I'd like to talk about my uncle, who has had a big influence on my life.", "Kirish"], ["That's why I still follow his advice today.", "Yakun"]] },
      { h: "Vaqtni qanday to'ldirish", p: ["Gaping tez tugab qolsa, shularni qo'sh: kichik hikoya, his-tuyg'u, misol.", "So'z esingga kelmasa, to'xtama. Boshqacha tushuntir:"], ex: [["What I mean is, he is very kind.", "Aytmoqchimanki, ..."], ["He taught me that hard work is more important than talent.", "Kichik hikoya / saboq"]] },
    ],
    nam: [
      { h: "Kartochka", p: ["<b>Describe a person who has influenced you.</b><br>You should say:<br>• who this person is<br>• how you know this person<br>• what this person has done<br>and explain why this person has had such an influence on you."] },
      { h: "Namuna javob", p: ["Qisqa, lekin hamma qismi bor:"], ex: [["I'd like to talk about my uncle, who has had a big influence on my life.", "Kirish + who"], ["I have known him since I was a child because he lived next door.", "how"], ["He taught me that hard work is more important than talent.", "what"], ["I admire him because he never gives up, even when life is difficult.", "why"], ["That's why I still follow his advice today.", "Yakun"]] },
    ],
    mashq: [
      yO("I'd like to talk about my best friend.", "Men eng yaqin do'stim haqida gapirmoqchiman."),
      yP("Tayyorlanish daqiqasida nima yozasan?", "Har savol uchun 2–3 ta kalit so'z", ["To'liq matnni", "Hech narsa yozmayman"]),
      yF("That's ___ I admire him so much.", "why", ["why", "because", "what"], "Shuning uchun men unga juda havas qilaman."),
      yP("Part 2 da qancha vaqt gapirasan?", "1–2 daqiqa", ["10–15 soniya", "5 daqiqa"]),
      yS("I'd like to talk about a person who has influenced me.", "Menga ta'sir qilgan bir inson haqida gapirmoqchiman."),
    ],
    main: [{ k: "sp2", a: { id: "p2_person" } }],
    sinov: [
      yP("Kartochkaning qaysi qismiga eng ko'p vaqt ajratasan?", "Oxirgi “explain why” qismiga", ["Birinchi savolga", "Hech biriga, tezroq tugataman"]),
      yF("I'd like to talk ___ a place I visited last year.", "about", ["about", "for", "on"], "O'tgan yili borgan joyim haqida gapirmoqchiman."),
      yP("So'z esingga kelmadi. Qaysi yo'l to'g'ri?", "What I mean is, he is very kind.", ["Sorry, I forgot the word.", "I don't know this word."], "To'xtab qolma: o'sha fikrni boshqa so'zlar bilan tushuntir."),
      yP("Tayyorlanishga qancha vaqt beriladi?", "1 daqiqa", ["10 soniya", "5 daqiqa"]),
      yO("He taught me to work hard.", "U menga qattiq ishlashni o'rgatdi."),
    ],
  },
  { id: "t2", rev: true, ic: "🔁", t: "2-hafta takrori", of: ["k06", "k07", "k08", "k09", "k10", "k11"], extra: { k: "rd", a: { id: "r_plastic", xt: 1.2 } } },
  {
    id: "k12", sk: "Speaking", ic: "🎤", t: "Speaking Part 3: muhokama", goal: "Jamiyat haqidagi chuqurroq savollarga fikr, sabab va misol bilan javob berishni o'rganasan.",
    tush: [
      { h: "Part 3 nima", p: ["4–5 daqiqa. Part 2 dagi mavzu davom etadi, lekin savollar endi <b>umumiy</b>.", "Part 1 da sen haqingda so'rashadi. Part 3 da esa odamlar va jamiyat haqida.", "Masalan Part 2 da “senga ta'sir qilgan inson” bo'lsa, Part 3 da: “Mashhur odamlar yoshlarga yaxshi o'rnakmi?”"] },
      { h: "Javob formulasi", p: ["<b>Fikr + Sabab + Misol</b>. Xohlasang oxirida qarama-qarshi tomonni ham qo'sh."], ex: [["I think role models are important because young people copy what they see.", "Fikr + sabab"], ["For example, many teenagers follow famous athletes.", "Misol"], ["However, not all celebrities behave well.", "Qarama-qarshi tomon"]] },
      { h: "Fikr bildirish iboralari", p: ["Har safar “I think” dema. Almashtirib tur:"], ex: [["In my opinion, parents are the best role models.", "Mening fikrimcha, ..."], ["It seems to me that people read less these days.", "Menga shunday tuyuladiki, ..."], ["I agree to some extent, but there are problems too.", "Qisman qo'shilaman, ..."]] },
      { h: "Umumlashtirish va kelajak", p: ["Hamma haqida gapirganda: <b>most people, in general, these days</b>.", "O'tmish bilan solishtirish: <b>compared to the past</b>.", "Kelajak: <b>I think it will ...</b>, <b>it might ...</b>"], ex: [["Compared to the past, people travel much more today.", "O'tmishga nisbatan, ..."], ["I think travel will become cheaper in the future.", "Kelajak haqida taxmin"]] },
    ],
    nam: [
      { h: "Savol: Why do some people give up on their goals?", p: ["Namuna javob:"], ex: [["I think the main reason is that results come slowly.", "Fikr + sabab"], ["For example, when people start learning a language, they expect to speak well in a month.", "Misol"], ["When that doesn't happen, they lose motivation.", "Natija"]] },
    ],
    mashq: [
      yO("In my opinion, parents are the best role models.", "Mening fikrimcha, ota-onalar eng yaxshi o'rnakdir."),
      yF("I agree to some ___, but there are problems too.", "extent", ["extent", "way", "agree"], "Qisman qo'shilaman, lekin muammolar ham bor."),
      yP("Part 3 savollari nima haqida bo'ladi?", "Jamiyat va umumiy mavzular haqida", ["Faqat mening oilam haqida", "Grammatika qoidalari haqida"]),
      yF("___ to the past, people travel much more today.", "Compared", ["Compared", "Different", "Than"], "O'tmishga nisbatan, bugun odamlar ancha ko'p sayohat qiladi."),
      yS("I think the main reason is that results come slowly.", "Menimcha, asosiy sabab shuki, natija sekin keladi."),
    ],
    main: [{ k: "sp3", a: { id: "p2_person" } }],
    sinov: [
      yP("<b>Are celebrities good role models?</b><br>Eng yaxshi javob qaysi?", "It depends. Some of them work hard and help others, but others behave badly in public.", ["Yes, they are good.", "I like celebrities."]),
      yF("It ___ to me that people read less these days.", "seems", ["seems", "sees", "says"], "Menga shunday tuyuladiki, odamlar hozir kamroq o'qiydi."),
      yP("Part 3 javobi formulasi qaysi?", "Fikr + sabab + misol", ["Ha yoki yo'q", "Faqat misol"]),
      yF("I think travel ___ become cheaper in the future.", "will", ["will", "is", "did"], "Menimcha, kelajakda sayohat arzonlashadi."),
      yP("<b>in general</b> nimani bildiradi?", "Umuman olganda", ["Masalan", "Aksincha"]),
    ],
  },
];
