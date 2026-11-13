"use strict";
// ---------- YO'L: 3- va 4-hafta ----------
const YP_1 = "In the 1950s, the town had only one school. Today there are twelve, and two new ones are being built. The number of students has grown every year.";
const YP_2 = "Tea needs a warm climate and plenty of rain. It grows best on hills, where water does not stay around the roots. For this reason, most tea farms are found in mountain areas.";
const YP_3 = "Electric cars are quiet and clean. However, they are still too expensive for most families, and there are not enough charging stations. Until these problems are solved, sales will stay low.";
const YP_4 = "Sleep is not a waste of time. While we sleep, the brain stores what we learned during the day. Students who sleep well remember more.";
const YP_5 = "The festival began in 1970 with only 200 visitors. By 2000 it attracted 50,000 people, and last year more than 150,000 came.";
const YP_6 = "Plastic bags are cheap and light. But they take hundreds of years to break down, and many end up in the sea, where animals eat them.";
const YT_E = "Some experts argue that homework should be banned. I disagree. A small amount of homework helps children remember what they learned. However, giving young children more than an hour a day is clearly too much.";
const YT_F = "Public transport in the city is getting better, but it is still far from perfect. In my opinion, the new metro line was the best decision of the last ten years. Unfortunately, ticket prices have risen too quickly.";
const yHead = (para, a, o, why) => yP(yTx(para) + "Bu paragrafga qaysi sarlavha mos?", a, o, why);

YOL.push(
  // ================= 3-HAFTA =================
  {
    id: "k13", sk: "Reading", ic: "📖", t: "Reading: paragrafga sarlavha tanlash", goal: "Paragrafning asosiy g'oyasini topib, unga mos sarlavhani tanlashni o'rganasan.",
    tush: [
      { h: "Vazifa qanday", p: ["Matn paragraflarga bo'lingan: A, B, C... Har biriga ro'yxatdan mos <b>sarlavha</b> tanlaysan.", "Sarlavhalar paragraflardan ko'p bo'ladi. Ya'ni bir nechtasi ortiqcha: ular tuzoq."] },
      { h: "Asosiy g'oyani top", p: ["Sarlavha paragrafning <b>umumiy mazmunini</b> aytadi, bitta tafsilotni emas.", "Asosiy g'oya odatda <b>birinchi 1–2 gapda</b> va <b>oxirgi gapda</b> bo'ladi. O'rtadagi gaplar ko'pincha misol va tafsilot."] },
      { h: "Tuzoq", p: ["Sarlavhadagi so'z paragrafda aynan uchraydi, lekin u faqat bitta mayda tafsilot.", "Shuning uchun <b>so'zga emas, ma'noga</b> qarab tanla.", "To'g'ri sarlavha ko'pincha paragrafdagi so'zlarni ishlatmaydi: sinonimlar bilan yozilgan bo'ladi."] },
      { h: "Ishlash tartibi", p: ["1. Avval sarlavhalar ro'yxatini o'qi.<br>2. Paragrafni tez o'qi.<br>3. O'zingcha 3–4 so'zli sarlavha qo'y.<br>4. Ro'yxatdan eng yaqinini tanla.<br>5. Ishlatilgan sarlavhani o'chir."], note: "Ikki sarlavha orasida ikkilansang, o'tib ket. Boshqa paragraflarni yechganingda bittasi o'zi chiqib ketadi." },
    ],
    nam: [
      { h: "Namuna", txt: "Many people believe that bats are blind, but this is not true. In fact, most bats can see quite well, and some species see even better than humans. The idea probably comes from the fact that bats fly at night.", p: ["Sarlavhalar:<br><b>i.</b> How bats hunt at night<br><b>ii.</b> A common mistake about bats<br><b>iii.</b> Why bats are in danger", "Paragraf nima haqida? “Odamlar ko'rshapalakni ko'r deb o'ylaydi, lekin bu noto'g'ri.”", "Javob: <b>ii</b>. “night” so'zi paragrafda bor, lekin ov qilish haqida hech narsa yo'q: i tuzoq."] },
    ],
    mashq: [
      yHead(YP_1, "The growth of education in the town", ["A school that closed down", "Problems with new buildings"], "Bitta maktabdan o'n ikkitaga: paragraf o'sish haqida."),
      yHead(YP_2, "The best conditions for growing tea", ["The history of tea drinking", "Why tea is expensive"], "Iqlim, yomg'ir, tepaliklar: choy o'sishi uchun sharoitlar."),
      yP("Asosiy g'oya odatda paragrafning qayerida bo'ladi?", "Birinchi va oxirgi gaplarida", ["Faqat o'rtasida", "Eng uzun gapida"]),
      yHead(YP_3, "What stops people from buying electric cars", ["The advantages of electric cars", "How electric cars are made"], "Birinchi gap afzallik haqida, lekin “However” dan keyin asosiy g'oya keladi: narx va stansiyalar muammosi."),
      yP("Sarlavhadagi so'z paragrafda aynan uchradi. Demak shu sarlavha to'g'rimi?", "Shart emas: ma'noga qarash kerak", ["Ha, albatta", "Yo'q, hech qachon"]),
    ],
    main: [{ k: "rd", a: { id: "r_aral", xt: 1.3 } }],
    sinov: [
      yHead(YP_4, "Why sleep helps learning", ["How many hours students sleep", "Dreams and their meaning"]),
      yHead(YP_5, "A festival that keeps growing", ["The first festival in 1970", "Why visitors stopped coming"]),
      yHead(YP_6, "The environmental cost of plastic bags", ["Why plastic bags are popular", "How plastic is produced"], "Birinchi gap afzallik, lekin “But” dan keyin asosiy g'oya: tabiatga zarari."),
      yP("Sarlavhalar soni paragraflardan ko'p. Nega?", "Ortiqcha, tuzoq sarlavhalar bor", ["Har paragrafga ikkitadan kerak", "Bu xato bosilgan"]),
      yP("Bu savol turida birinchi qadam nima?", "Sarlavhalar ro'yxatini o'qib chiqish", ["Matnni so'zma-so'z tarjima qilish", "Oxirgi paragrafdan boshlash"]),
    ],
  },
  {
    id: "k14", sk: "Listening", ic: "🎧", t: "Listening Part 2: bitta odam gapiradi", goal: "A/B/C savollaridagi tuzoqlarni va sinonimlarni eshitib ajratishni o'rganasan.",
    tush: [
      { h: "Part 2 nima", p: ["Endi bitta odam gapiradi: ekskursiya boshlovchisi, radio e'lon, muzey xodimi.", "Savollar ikki xil: variantli (A, B, C) va bo'sh joy to'ldirish."] },
      { h: "A/B/C tuzog'i", p: ["Eng muhim narsa: <b>uchala variant ham audio'da tilga olinadi</b>.", "Lekin faqat bittasi savolga javob. Qolgan ikkitasi rad etiladi yoki boshqa narsaga tegishli.", "Rad etuvchi so'zlar: <b>used to, not anymore, unfortunately, but</b>."], ex: [["The museum used to open at nine, but since last year the doors open at ten.", "Javob: 10. “used to” = ilgari shunday edi, hozir emas."]] },
      { h: "Sinonimni kut", p: ["Variantda yozilgan so'z audio'da boshqacha aytiladi."], ex: [["There's no charge for children below the age of twelve.", "Variantda: “Children under 12 enter free”"], ["Guided tours are free on weekdays.", "Variantda: “no cost from Monday to Friday”"]] },
      { h: "Yo'l ko'rsatuvchi so'zlar", p: ["Gapiruvchi mavzuni almashtirganda signal beradi. Bu yangi savol boshlanganini bildiradi:", "<b>First, ... / Next, ... / After that, ... / Finally, ...</b><br><b>Now let's move on to ...</b>"] },
    ],
    nam: [
      { h: "Namuna", p: ["Savol: <b>At weekends, a guided tour costs</b><br>A. nothing<br>B. five pounds<br>C. ten pounds", "“free” so'zi eshitiladi, lekin u ish kunlari uchun. Savol dam olish kunlari haqida. Javob: <b>B</b>."], ex: [["Guided tours are free on weekdays. At weekends, however, they cost five pounds.", "Ikkala narx ham aytildi."]] },
    ],
    mashq: [
      yD("The cafe used to be on the first floor, but now it is next to the main entrance.", null, "Kafe hozir qayerda?", ["Asosiy kirish yonida", "Birinchi qavatda", "Ikkinchi qavatda"], "“used to be” = ilgari. Hozir: next to the main entrance."),
      yD("Tickets are ten pounds for adults. Children under twelve get in free.", null, "11 yoshli bola uchun chipta qancha?", ["Bepul", "10 funt", "12 funt"], "under twelve = 12 yoshdan kichik. 11 yosh shunga kiradi."),
      yD("Unfortunately, the garden is closed today because of the rain.", null, "Bog' bugun ochiqmi?", ["Yo'q, yopiq", "Ha, ochiq", "Faqat tushdan keyin"]),
      yP("A/B/C savolida odatda nechta variant audio'da tilga olinadi?", "Uchalasi ham", ["Faqat to'g'risi", "Hech biri"]),
      yD("First, we will visit the old town. After that, we will have lunch by the river.", null, "Tushlikdan oldin qayerga boriladi?", ["Eski shaharga", "Daryo bo'yiga", "Muzeyga"]),
    ],
    main: [{ k: "ls", a: { id: "l_museum" } }],
    sinov: [
      yD("The tour used to start at nine, but this year it starts at half past nine.", null, "Ekskursiya soat nechada boshlanadi?", ["9:30", "9:00", "10:00"]),
      yD("Parking is free for visitors, but only for the first two hours.", null, "Mashina qo'yish qancha vaqt bepul?", ["Birinchi 2 soat", "Butun kun", "Umuman bepul emas"]),
      yD("There's no charge for students, but you must show your card.", null, "Talabalar qancha to'laydi?", ["Hech narsa", "Yarim narx", "To'liq narx"]),
      yP("<b>Now let's move on to ...</b><br>Bu nimani bildiradi?", "Yangi mavzu yoki savol boshlanyapti", ["Audio tugadi", "Savol takrorlanadi"]),
      yD("The gift shop is on the left, just after the ticket office.", null, "Sovg'alar do'koni qayerda?", ["Chapda, kassadan keyin", "O'ngda, kassadan oldin", "Tashqarida"]),
    ],
  },
  {
    id: "k15", sk: "Writing Task 1", ic: "📊", t: "Task 1: ustunli diagramma", goal: "Toifalarni bir-biri bilan taqqoslashni va ustunli diagrammani tasvirlashni o'rganasan.",
    tush: [
      { h: "Ustunli diagramma nimasi bilan boshqacha", p: ["Chiziqli grafikda asosiy narsa vaqt o'tishi edi. Ustunli diagrammada esa <b>toifalarni taqqoslash</b>.", "Agar ikki yil berilgan bo'lsa, o'zgarishni ham aytasan: nima o'sdi, nima kamaydi."] },
      { h: "Eng katta va eng kichik", p: ["<b>the most popular</b> = eng ommabop<br><b>the highest / the lowest</b> = eng baland / eng past<br><b>the least common</b> = eng kam uchraydigan"], ex: [["Car was the most popular way of travelling in 2010.", "2010-yilda mashina eng ommabop yo'l edi."], ["Bicycle was the least common choice.", "Velosiped eng kam tanlangan."]] },
      { h: "Farq qanchalik katta", p: ["<b>slightly more than</b> = ozgina ko'p<br><b>far more than</b> = ancha ko'p<br><b>twice as many as</b> = ikki barobar ko'p<br><b>the same as</b> = bir xil", "Ikki barobar o'sdi: <b>doubled</b>. Yarmiga tushdi: <b>halved</b>."], ex: [["Metro use doubled from 10% to 20%.", "Metrodan foydalanish ikki barobar o'sdi."]] },
      { h: "Reja", p: ["1. <b>Kirish:</b> The bar chart compares ...<br>2. <b>Overview:</b> eng katta ko'rsatkich + eng katta o'zgarish<br>3. <b>Tafsilot 1:</b> kamayganlar<br>4. <b>Tafsilot 2:</b> o'sganlar va o'zgarmaganlar"] },
    ],
    nam: [
      { h: "Kirish va overview", chart: "w1_transport", p: ["Avval qarab ol: mashina keskin kamaygan, velosiped va metro o'sgan."], ex: [["The bar chart compares how students at one university travelled to the campus in 2010 and 2020.", "Kirish: shows → compares"], ["Overall, cars became much less popular, while cycling and the metro grew.", "Overview 1: eng katta o'zgarishlar"], ["By 2020, bus and bicycle were the most common ways of travelling.", "Overview 2: eng kattasi"]] },
      { h: "Tafsilotlar", chart: "w1_transport", p: ["Raqamlar va taqqoslash:"], ex: [["In 2010, 35% of students came by car, but this figure fell to 15% in 2020.", "Kamaygan"], ["By contrast, the share of cyclists rose from 10% to 25%, and metro use doubled from 10% to 20%.", "O'sganlar"], ["Walking stayed the same at 15%.", "O'zgarmagan"]] },
    ],
    mashq: [
      yF("Car was the ___ popular way of travelling in 2010.", "most", ["most", "more", "much"], "2010-yilda mashina eng ommabop yo'l edi."),
      yF("Metro use ___ from 10% to 20%.", "doubled", ["doubled", "halved", "twice"], "Metrodan foydalanish 10% dan 20% ga, ikki barobar o'sdi."),
      yF("Twice as ___ people chose the bus as the train.", "many", ["many", "much", "more"], "Avtobusni poyezdga qaraganda ikki barobar ko'p odam tanladi."),
      yP("<b>the least common</b> nimani bildiradi?", "Eng kam uchraydigan", ["Eng ko'p uchraydigan", "Bir xil"]),
      yO("Walking remained the least popular choice.", "Piyoda yurish eng kam tanlangan yo'l bo'lib qoldi."),
    ],
    main: [{ k: "w1", a: { id: "w1_transport", minW: 130, lim: 25, tpl: true, lbl: "Yozish: ustunli diagramma (shablon bilan)" } }],
    sinov: [
      yF("Bus was slightly ___ popular than the metro.", "more", ["more", "most", "much"], "Avtobus metrodan ozgina ommaboproq edi."),
      yF("The number of drivers ___ from 35% to 15%.", "fell", ["fell", "rose", "doubled"], "Haydovchilar soni 35% dan 15% ga tushdi."),
      yP("<b>far more than</b> nimani bildiradi?", "Ancha ko'p", ["Ozgina ko'p", "Bir xil"]),
      yP("Ustunli diagramma overview'ida nima yoziladi?", "Eng katta ko'rsatkich va eng katta o'zgarish", ["Hamma raqamlar", "O'z fikrim"]),
      yF("Sales in 2020 were ___ as high as in 2010.", "twice", ["twice", "two", "second"], "2020-yilda savdo 2010-yildagidan ikki barobar yuqori edi."),
    ],
  },
  {
    id: "k16", sk: "Writing Task 2", ic: "✍️", t: "Task 2: asosiy paragraf", goal: "Bitta g'oyani 4–5 gapda ochib beradigan asosiy paragraf yozishni o'rganasan.",
    tush: [
      { h: "Bitta paragraf = bitta g'oya", p: ["Asosiy paragraf 4 qismdan iborat. Qisqacha <b>PEEL</b>:", "<b>P</b>oint: asosiy fikr (1 gap)<br><b>E</b>xplain: nega shunday, tushuntir<br><b>E</b>xample: misol<br><b>L</b>ink: natija yoki savolga qaytish"], note: "Bir paragrafga 2–3 ta g'oyani tiqishtirma. Bitta g'oyani chuqur ochgan yaxshi." },
      { h: "Point: asosiy fikr", p: ["Paragrafning birinchi gapi. Qisqa va aniq bo'lsin. O'quvchi shu gapdan paragraf nima haqida ekanini bilishi kerak."], ex: [["Firstly, free university education gives everyone a fair chance.", "Birinchidan, bepul ta'lim hammaga teng imkoniyat beradi."]] },
      { h: "Explain va Example", p: ["Tushuntirish <b>This is because ...</b> bilan boshlanadi.", "Misol <b>For example, ...</b> bilan. Misol hayotiy bo'lsa yetarli, aniq statistika shart emas."], ex: [["This is because talented students from poor families can study without worrying about money.", "Tushuntirish"], ["For example, a bright student from a small village could become a doctor instead of leaving school to work.", "Misol"]] },
      { h: "Bog'lovchi so'zlar", p: ["<b>Firstly, / Secondly,</b> = birinchidan, ikkinchidan<br><b>In addition,</b> = bundan tashqari<br><b>However,</b> = lekin<br><b>For example,</b> = masalan<br><b>As a result,</b> = natijada<br><b>This means that</b> = bu degani"], ex: [["As a result, the whole country benefits from their skills.", "Link: natija"]] },
    ],
    nam: [
      { h: "To'liq paragraf", p: ["Savol: <b>University education should be free for everyone.</b> To'rt qism ketma-ket:"], ex: [["Firstly, free university education gives everyone a fair chance.", "P: asosiy fikr"], ["This is because talented students from poor families can study without worrying about money.", "E: tushuntirish"], ["For example, a bright student from a small village could become a doctor instead of leaving school to work.", "E: misol"], ["As a result, the whole country benefits from their skills.", "L: natija"]] },
    ],
    mashq: [
      yP("Asosiy paragrafning birinchi gapi nima bo'lishi kerak?", "Asosiy fikr (Point)", ["Misol", "Xulosa"]),
      yF("This is ___ students can focus on their studies.", "because", ["because", "but", "however"], "Buning sababi, talabalar o'qishga e'tibor qarata oladi."),
      yF("For ___, many countries offer free schools.", "example", ["example", "addition", "result"], "Masalan, ko'p davlatlar bepul maktablar taklif qiladi."),
      yP("Qaysi ibora natijani bildiradi?", "As a result,", ["For example,", "However,", "Firstly,"]),
      yO("Secondly, it is very expensive for the government.", "Ikkinchidan, bu hukumat uchun juda qimmat."),
    ],
    main: [{ k: "w2", a: { id: "w2_uni_free", minW: 55, lim: 20, tpl: true, lbl: "Yozish: bitta asosiy paragraf", part: "Bugun bitta asosiy paragraf yoz: 4–5 gap. Asosiy fikr, tushuntirish, misol va natija.", model: "Firstly, free university education gives everyone a fair chance. This is because talented students from poor families can study without worrying about money. For example, a bright student from a small village could become a doctor instead of leaving school to work. As a result, the whole country benefits from their skills.", chk: ["Birinchi gap asosiy fikrni aytadi", "“This is because” bilan tushuntirdim", "“For example” bilan misol keltirdim", "Paragrafda faqat bitta g'oya bor"] } }],
    sinov: [
      yP("PEEL'dagi ikkinchi E nima?", "Example: misol", ["End: tugash", "Easy: oson"]),
      yF("___, phones distract students during lessons.", "Firstly", ["Firstly", "Because", "Example"], "Birinchidan, telefonlar dars paytida o'quvchilarni chalg'itadi."),
      yF("Phones are useful. ___, they can also be a problem.", "However", ["However", "Because", "For example"], "Telefonlar foydali. Lekin ular muammo ham bo'lishi mumkin."),
      yP("Bitta asosiy paragrafda nechta asosiy g'oya bo'ladi?", "Bitta", ["Uchta", "Qancha ko'p bo'lsa, shuncha yaxshi"]),
      yF("As a ___, their grades improve.", "result", ["result", "reason", "example"], "Natijada ularning baholari yaxshilanadi."),
    ],
  },
  {
    id: "k17", sk: "Grammatika", ic: "🧩", t: "Grammatika: gaplarni bog'lash", goal: "Ikki oddiy gapni bitta murakkab gapga aylantirishni o'rganasan. Bu Writing va Speaking balini ko'taradi.",
    tush: [
      { h: "Nega kerak", p: ["Faqat qisqa, oddiy gaplar bilan yozsang yoki gapirsang, grammatika bali 5 dan oshmaydi.", "6 va undan yuqori ball uchun <b>murakkab gaplar</b> kerak: ikki fikr bitta gapda bog'langan."], ex: [["The city is crowded. Many people move there.", "Ikki oddiy gap"], ["Although the city is crowded, many people move there.", "Bitta murakkab gap"]] },
      { h: "because, so, although", p: ["<b>because</b> = chunki (sabab)<br><b>so</b> = shuning uchun (natija)<br><b>although</b> = garchi, ...sa ham (kutilmagan narsa)"], ex: [["She stayed at home because she was ill.", "U uyda qoldi, chunki kasal edi."], ["It was cold, so I wore a coat.", "Sovuq edi, shuning uchun palto kiydim."], ["Although it was late, he continued working.", "Kech bo'lsa ham, u ishlashda davom etdi."]], note: "Although gap boshida kelsa, o'rtaga vergul qo'yiladi." },
      { h: "who va which", p: ["Odam haqida qo'shimcha ma'lumot: <b>who</b>.<br>Narsa yoki joy haqida: <b>which</b>."], ex: [["I have a friend who lives in Korea.", "Koreyada yashaydigan do'stim bor."], ["I live in Tashkent, which is the capital of Uzbekistan.", "Men O'zbekiston poytaxti bo'lgan Toshkentda yashayman."]] },
      { h: "if, when, while", p: ["<b>if</b> = agar<br><b>when</b> = ...ganda<br><b>while</b> = esa (ikki narsani solishtirish)"], ex: [["If I pass the exam, I will study in Korea.", "Agar imtihondan o'tsam, Koreyada o'qiyman."], ["Tea fell, while coffee rose.", "Choy tushdi, qahva esa o'sdi."]], note: "if dan keyin will qo'yilmaydi: “If I pass”, “If I will pass” emas." },
    ],
    nam: [
      { h: "Ikki gapni birlashtirish", p: ["Qadam: ikki gap orasidagi munosabatni top (sabab? natija? qarama-qarshilik?), keyin mos so'zni qo'y."], ex: [["I study every day. I want a high score.", "Munosabat: sabab"], ["I study every day because I want a high score.", "because bilan"], ["Tashkent is a big city. It has a metro.", "Munosabat: qo'shimcha ma'lumot"], ["Tashkent is a big city which has a metro.", "which bilan"]] },
    ],
    mashq: [
      yF("___ it was late, he continued working.", "Although", ["Although", "Because", "So"], "Kech bo'lsa ham, u ishlashda davom etdi."),
      yF("She stayed at home ___ she was ill.", "because", ["because", "although", "so"], "U uyda qoldi, chunki kasal edi."),
      yF("It was cold, ___ I wore a coat.", "so", ["so", "because", "although"], "Sovuq edi, shuning uchun palto kiydim."),
      yF("I have a friend ___ lives in Korea.", "who", ["who", "which", "where"], "Koreyada yashaydigan do'stim bor.", "friend odam, shuning uchun who."),
      yO("If I pass the exam, I will study abroad.", "Agar imtihondan o'tsam, chet elda o'qiyman."),
    ],
    main: { k: "ymain", t: "Asosiy mashq: 10 ta gapni bog'lash", min: 12, tasks: [
      yF("This is the book ___ changed my life.", "which", ["which", "who", "where"], "Bu mening hayotimni o'zgartirgan kitob.", "book narsa, shuning uchun which."),
      yF("___ I was tired, I finished my homework.", "Although", ["Although", "Because", "If"], "Charchagan bo'lsam ham, uy vazifamni tugatdim."),
      yO("Although it is expensive, many people buy it.", "Qimmat bo'lsa ham, ko'p odamlar uni sotib oladi."),
      yF("Car use fell, ___ cycling became more popular.", "while", ["while", "because", "if"], "Mashinadan foydalanish kamaydi, velosiped esa ommalashdi."),
      yF("I study every day ___ I want a high score.", "because", ["because", "although", "which"], "Men har kuni o'qiyman, chunki yuqori ball olmoqchiman."),
      yO("I live in a city which has a long history.", "Men uzoq tarixga ega shaharda yashayman."),
      yF("___ you practise every day, you will improve.", "If", ["If", "Although", "Which"], "Agar har kuni mashq qilsang, o'sasan."),
      yF("The teacher ___ taught me English was very kind.", "who", ["who", "which", "when"], "Menga ingliz tilini o'rgatgan o'qituvchi juda mehribon edi."),
      yO("It was raining, so we stayed at home.", "Yomg'ir yog'ayotgan edi, shuning uchun uyda qoldik."),
      yF("I will call you ___ I arrive.", "when", ["when", "which", "although"], "Yetib borganimda senga qo'ng'iroq qilaman."),
    ] },
    sinov: [
      yF("___ he is rich, he is not happy.", "Although", ["Although", "Because", "So"], "U boy bo'lsa ham, baxtli emas."),
      yF("We were hungry, ___ we ordered pizza.", "so", ["so", "although", "because"], "Biz och edik, shuning uchun pitsa buyurtma qildik."),
      yF("Seoul, ___ is the capital of Korea, is a huge city.", "which", ["which", "who", "what"], "Koreya poytaxti bo'lgan Seul ulkan shahar."),
      yF("If it ___ tomorrow, we will stay at home.", "rains", ["rains", "will rain", "rained"], "Agar ertaga yomg'ir yog'sa, uyda qolamiz.", "if dan keyin will qo'yilmaydi: If it rains."),
      yP("Qaysi biri murakkab gap?", "I stayed at home because I was ill.", ["I stayed at home.", "I was ill."]),
    ],
  },
  { id: "t3", rev: true, ic: "🔁", t: "3-hafta takrori", of: ["k12", "k13", "k14", "k15", "k16", "k17"], extra: { k: "rd", a: { id: "r_silk", xt: 1.2 } } },
  {
    id: "k18", sk: "Speaking", ic: "🎤", t: "Speaking Part 2: joy va voqeani tasvirlash", goal: "Joy haqida gapirishni va o'tgan voqeani to'g'ri zamonda aytib berishni o'rganasan.",
    tush: [
      { h: "O'tgan voqea: qaysi zamon", p: ["Bo'lib o'tgan ish: <b>Past Simple</b> (went, saw, visited).", "O'sha paytdagi fon: <b>was / were + -ing</b>."], ex: [["I went there with my family two years ago.", "Asosiy voqea"], ["It was raining when we arrived.", "Fon: yomg'ir yog'ayotgan edi"]] },
      { h: "Joyni tasvirlash", p: ["Shu 4 ta qolip har qanday joyga yaraydi:"], ex: [["It is located in the north of the country.", "U ...da joylashgan."], ["It is famous for its old buildings.", "U ... bilan mashhur."], ["You can walk along the river there.", "U yerda ... qilish mumkin."], ["What I like most is the peaceful atmosphere.", "Menga eng yoqadigani ..."]] },
      { h: "His-tuyg'u so'zlari", p: ["“good” va “nice” o'rniga:", "<b>amazing</b> = ajoyib<br><b>peaceful</b> = tinch<br><b>crowded</b> = gavjum<br><b>unforgettable</b> = unutilmas"], ex: [["I was really impressed by the view.", "Manzara menga juda ta'sir qildi."]] },
      { h: "Yakun", p: ["Nutqni “That's all” bilan tugatma. Kartochkadagi oxirgi savolga qaytib yakunla:"], ex: [["That's why I would recommend it to anyone.", "Shuning uchun men uni hammaga tavsiya qilardim."]] },
    ],
    nam: [
      { h: "Namuna: tavsiya qiladigan joy", p: ["<b>Describe a place in your country that you would recommend to visitors.</b>"], ex: [["I'd like to talk about Samarkand, which is one of the oldest cities in Uzbekistan.", "Kirish + where"], ["It is famous for its blue mosques and old squares.", "Nimasi bilan mashhur"], ["I went there with my family two years ago, and I was really impressed by the buildings.", "Kichik hikoya, o'tgan zamon"], ["What I like most is the peaceful atmosphere in the evening.", "Menga yoqadigani"], ["That's why I would recommend it to anyone.", "Yakun"]] },
    ],
    mashq: [
      yF("It is famous ___ its old buildings.", "for", ["for", "of", "about"], "U qadimiy binolari bilan mashhur."),
      yF("I ___ there with my family two years ago.", "went", ["went", "go", "have gone"], "Ikki yil oldin u yerga oilam bilan bordim.", "two years ago: aniq o'tgan vaqt, shuning uchun Past Simple."),
      yO("What I like most is the peaceful atmosphere.", "Menga eng yoqadigani tinch muhit."),
      yP("<b>crowded</b> nimani bildiradi?", "Gavjum, odam ko'p", ["Tinch", "Arzon"]),
      yS("It is famous for its blue mosques and old squares.", "U moviy masjidlari va qadimiy maydonlari bilan mashhur."),
    ],
    main: [{ k: "sp2", a: { id: "p2_place" } }, { k: "sp3", a: { id: "p2_place" } }],
    sinov: [
      yF("It is ___ in the north of the country.", "located", ["located", "placing", "stay"], "U mamlakat shimolida joylashgan."),
      yF("I was really impressed ___ the view.", "by", ["by", "of", "at"], "Manzara menga juda ta'sir qildi."),
      yF("It ___ raining when we arrived.", "was", ["was", "is", "has"], "Biz yetib kelganimizda yomg'ir yog'ayotgan edi."),
      yP("O'tgan voqeani aytib berishda asosan qaysi zamon ishlatiladi?", "Past Simple", ["Present Simple", "Future Simple"]),
      yO("That's why I would recommend it to anyone.", "Shuning uchun men uni hammaga tavsiya qilardim."),
    ],
  },
  // ================= 4-HAFTA =================
  {
    id: "k19", sk: "Reading", ic: "📖", t: "Reading: Yes / No / Not Given", goal: "Yozuvchining fikrini topishni va uni boshqalarning fikridan ajratishni o'rganasan.",
    tush: [
      { h: "True/False'dan farqi", p: ["True/False/Not Given <b>faktlarni</b> tekshiradi.", "Yes/No/Not Given esa <b>yozuvchining fikrini</b> tekshiradi:", "<b>YES</b>: yozuvchi shunday deb o'ylaydi.<br><b>NO</b>: yozuvchi aksini o'ylaydi.<br><b>NOT GIVEN</b>: yozuvchining bu haqdagi fikri noma'lum."] },
      { h: "Fikr so'zlarini top", p: ["Yozuvchi o'z fikrini shu so'zlar bilan bildiradi:", "<b>I believe, in my view, in my opinion</b><br><b>clearly, surprisingly, unfortunately</b><br><b>should, must</b>", "Shu so'zlar atrofida javob bo'ladi."] },
      { h: "Boshqalarning fikri ≠ yozuvchi fikri", p: ["Matnda ko'pincha avval boshqalarning fikri aytiladi, keyin yozuvchi unga javob beradi.", "“Some people claim that ... <b>However</b>, this is wrong.”", "Bu yerda yozuvchi o'sha fikrga <b>qo'shilmayapti</b>."], note: "“Some experts argue”, “Many parents think” degani yozuvchining fikri emas. Keyingi gapni o'qi." },
      { h: "Ehtiyotkor so'zlar", p: ["Yozuvchi ko'pincha qat'iy gapirmaydi: <b>may, might, probably, tend to</b>.", "Savolda esa qat'iy so'z bo'lishi mumkin: <b>always, all, never</b>. Bunday paytda ikki gapni diqqat bilan solishtir."] },
    ],
    nam: [
      { h: "Namuna", txt: "Many parents think that video games are a waste of time. In my view, this is too simple. Some games clearly improve problem-solving skills, although playing for many hours every day is probably harmful.", p: ["<b>1. The writer agrees that video games are a waste of time.</b><br>Bu ota-onalar fikri. Yozuvchi: “this is too simple”. Javob: <b>NO</b>.", "<b>2. The writer thinks some games can develop useful skills.</b><br>“clearly improve problem-solving skills”. Javob: <b>YES</b>.", "<b>3. The writer plays video games every day.</b><br>Yozuvchining o'zi o'ynashi haqida hech narsa yo'q. Javob: <b>NOT GIVEN</b>."] },
    ],
    mashq: [
      YNN(YT_E, "The writer wants homework to be banned.", "NO", "Bu ekspertlar fikri. Yozuvchi: “I disagree”."),
      YNN(YT_E, "The writer believes a little homework is useful.", "YES", "“A small amount of homework helps children”."),
      YNN(YT_E, "The writer thinks more than one hour a day is fine for young children.", "NO", "“more than an hour a day is clearly too much”: aksini aytyapti."),
      YNN(YT_E, "The writer was a teacher in the past.", "NOT GIVEN", "Yozuvchining kasbi haqida hech narsa aytilmagan."),
      yP("Yes / No / Not Given savollari nimani tekshiradi?", "Yozuvchining fikrini", ["Faqat raqam va sanalarni", "So'zlarning tarjimasini"]),
    ],
    main: [{ k: "rd", a: { id: "r_lang", xt: 1.2 } }],
    sinov: [
      YNN(YT_F, "The writer thinks public transport is now perfect.", "NO", "“still far from perfect”."),
      YNN(YT_F, "The writer approves of the new metro line.", "YES", "“the best decision of the last ten years”."),
      YNN(YT_F, "The writer is unhappy about the rise in ticket prices.", "YES", "“Unfortunately, ticket prices have risen too quickly”."),
      YNN(YT_F, "The writer uses the metro every day.", "NOT GIVEN"),
      yP("Matn: <b>Some people claim X. However, this is wrong.</b><br>Yozuvchi X ga qo'shiladimi?", "Yo'q", ["Ha", "Noma'lum"]),
    ],
  },
  {
    id: "k20", sk: "Listening", ic: "🎧", t: "Listening Part 3–4: ma'ruza", goal: "Uzun ma'ruzada adashmaslikni va konspektdagi bo'sh joylarni to'ldirishni o'rganasan.",
    tush: [
      { h: "Part 3 va Part 4", p: ["<b>Part 3:</b> 2–3 kishi o'qish haqida gaplashadi (talabalar loyiha muhokama qiladi).", "<b>Part 4:</b> bitta odam ma'ruza o'qiydi. O'rtada tanaffus yo'q, shuning uchun eng qiyin qism."] },
      { h: "Konspekt = xarita", p: ["Part 4 da savollar konspekt (notes) ko'rinishida: sarlavhalar va bo'sh joyli qisqa gaplar.", "Ma'ruza <b>aynan shu tartibda</b> boradi. Audio boshlanishidan oldin sarlavhalarni o'qi: qayerda ekaningni shulardan bilasan."] },
      { h: "Yo'l ko'rsatuvchi so'zlar", p: ["Ma'ruzachi bo'limdan bo'limga o'tganda signal beradi:", "<b>Let's start with ...</b> = boshlanish<br><b>Now let's turn to ...</b> = keyingi bo'lim<br><b>For example, ...</b> = misol<br><b>On the other hand, ...</b> = qarama-qarshi fikr<br><b>To sum up, ...</b> = xulosa"], note: "Bir javobni o'tkazib yuborsang, vahima qilma. Signal so'zni kut va keyingi savolga o't." },
      { h: "Qanday so'z kerakligini taxmin qil", p: ["Bo'sh joy atrofidagi so'zlarga qara:", "“a new ___ of transport” → ot kerak (type, form)<br>“very ___” → sifat kerak<br>“in ___” → yil yoki joy", "Part 4 da javoblar ko'pincha <b>ot</b> bo'ladi."] },
    ],
    nam: [
      { h: "Namuna", p: ["Konspektda: <b>Tea: first used as a ______</b>", "“as a” dan keyin ot kerak. Audio'da “not as a drink, but as a medicine”: birinchisi rad etildi. Javob: <b>medicine</b>."], ex: [["Tea was first used not as a drink, but as a medicine.", "Choy dastlab ichimlik emas, dori sifatida ishlatilgan."]] },
    ],
    mashq: [
      yD("Let's start with the history of the city. After that, I'll talk about its economy.", null, "Ma'ruzachi birinchi nima haqida gapiradi?", ["Shahar tarixi haqida", "Iqtisodiyoti haqida", "Aholisi haqida"]),
      yD("Tea was first used as a medicine.", ["medicine"], "Bo'sh joyni yoz: Tea was first used as a ___."),
      yD("Birds in cities sing louder because of traffic noise.", ["noise"], "Bo'sh joyni yoz: Birds sing louder because of traffic ___."),
      yP("<b>Now let's turn to ...</b><br>Ma'ruzachi nima qilyapti?", "Keyingi bo'limga o'tyapti", ["Xulosa qilyapti", "Misol keltiryapti"]),
      yP("Konspektda: <b>a new ___ of transport</b>.<br>Bo'sh joyga qanday so'z kerak?", "Ot (masalan: type, form)", ["Fe'l (masalan: go)", "Sifat (masalan: fast)"]),
    ],
    main: [{ k: "ls", a: { id: "l_tea" } }],
    sinov: [
      yD("A habit takes about two months to form.", ["two", "2"], "Bo'sh joyni yoz: A habit takes about ___ months to form."),
      yD("To sum up, small changes are easier to keep than big ones.", null, "Ma'ruzachi nima qilyapti?", ["Xulosa qilyapti", "Yangi mavzu boshlayapti", "Misol keltiryapti"]),
      yD("The main cause of the problem is pollution.", ["pollution"], "Bo'sh joyni yoz: The main cause of the problem is ___."),
      yP("Part 4 da nechta odam gapiradi?", "Bitta", ["Ikkita", "To'rtta"]),
      yP("<b>On the other hand, ...</b><br>Bu nimani bildiradi?", "Qarama-qarshi fikr kelyapti", ["Misol kelyapti", "Ma'ruza tugadi"]),
    ],
  },
  {
    id: "k21", sk: "Writing Task 1", ic: "📊", t: "Task 1: doiraviy diagramma va jadval", goal: "Ulushlarni (foiz, chorak, yarim) tasvirlashni va ko'p raqam ichidan muhimini tanlashni o'rganasan.",
    tush: [
      { h: "Doiraviy diagramma", p: ["U butunning <b>ulushlarini</b> ko'rsatadi. Asosiy so'zlar:", "<b>accounted for</b> / <b>made up</b> = tashkil qildi<br><b>the largest share</b> = eng katta ulush"], ex: [["Coal accounted for 45% of electricity in 2000.", "2000-yilda ko'mir elektrning 45% ini tashkil qilgan."], ["Gas made up the largest share in 2020.", "2020-yilda eng katta ulush gazga to'g'ri kelgan."]] },
      { h: "Foiz o'rniga kasr", p: ["Bir xil “percent” ni takrorlamaslik uchun:", "<b>a half</b> = 50%<br><b>a third</b> = taxminan 33%<br><b>a quarter</b> = 25%<br><b>a fifth</b> = 20%", "Taxminiy bo'lsa:", "<b>just under</b> = sal kam<br><b>just over</b> = sal ko'p<br><b>around / approximately</b> = taxminan"], ex: [["Just under a quarter of electricity came from solar and wind.", "Elektrning chorakdan sal kami quyosh va shamoldan olingan."]] },
      { h: "Ikki diagrammani taqqoslash", p: ["Uch savolga javob ber:", "1. Nima o'sdi?<br>2. Nima kamaydi?<br>3. Nima o'zgarmadi?", "Overview'ga eng katta ulush va eng katta o'zgarishni yoz."] },
      { h: "Jadval", p: ["Jadvalda raqam juda ko'p bo'ladi. Hammasini yozsang, vaqt ham, so'z ham yetmaydi.", "Faqat shularni tanla: <b>eng kattasi, eng kichigi va eng qiziq farq</b>.", "Qator yoki ustun bo'yicha guruhla: masalan avval eng ko'p sarflagan davlat, keyin qolganlari."] },
    ],
    nam: [
      { h: "Kirish va overview", chart: "w1_energy", p: ["Qarab ol: ko'mir kamaygan, quyosh va shamol keskin o'sgan, ikkitasi o'zgarmagan."], ex: [["The pie charts compare the sources of electricity in one country in 2000 and 2020.", "Kirish"], ["Overall, coal was the main source in 2000, but by 2020 gas had become the largest, and solar and wind power had grown dramatically.", "Overview"]] },
      { h: "Tafsilotlar", chart: "w1_energy", p: ["Uch savolga javob:"], ex: [["Coal accounted for 45% of electricity in 2000, but this fell to 20% in 2020.", "Kamaygan"], ["By contrast, solar and wind rose from only 2% to 22%.", "O'sgan"], ["Gas increased slightly from 30% to 35%, while hydro and nuclear power remained the same at 15% and 8%.", "Ozgina o'sgan va o'zgarmaganlar"]] },
    ],
    mashq: [
      yF("Coal ___ for 45% of electricity in 2000.", "accounted", ["accounted", "counted", "made"], "2000-yilda ko'mir elektrning 45% ini tashkil qilgan."),
      yP("<b>a quarter</b> necha foiz?", "25%", ["20%", "33%", "50%"]),
      yF("Gas made ___ the largest share in 2020.", "up", ["up", "of", "for"], "2020-yilda eng katta ulush gazga to'g'ri kelgan."),
      yP("<b>just under 50%</b> qaysi raqamga mos keladi?", "48%", ["52%", "50%", "30%"]),
      yO("Hydro power remained the same in both years.", "Gidroenergiya ikkala yilda ham o'zgarmadi."),
    ],
    main: [{ k: "w1", a: { id: "w1_energy", minW: 140, lim: 25, tpl: true, lbl: "Yozish: doiraviy diagramma (shablon bilan)" } }],
    sinov: [
      yP("<b>a third</b> taxminan necha foiz?", "33%", ["25%", "50%", "3%"]),
      yF("Nuclear power ___ up 8% of the total.", "made", ["made", "did", "took"], "Atom energiyasi jamining 8% ini tashkil qilgan."),
      yP("<b>just over 20%</b> qaysi raqamga mos keladi?", "21%", ["19%", "25%", "12%"]),
      yP("Jadvalda raqam juda ko'p. Nima qilasan?", "Eng muhimlarini tanlab yozaman", ["Hammasini ketma-ket yozaman", "Umuman raqam yozmayman"]),
      yF("Food accounted ___ the largest share of spending.", "for", ["for", "of", "to"], "Xarajatlarning eng katta ulushi oziq-ovqatga to'g'ri kelgan."),
    ],
  },
  {
    id: "k22", sk: "Writing Task 2", ic: "✍️", t: "Task 2: to'liq insho va xulosa", goal: "Reja tuzib, kirishdan xulosagacha birinchi to'liq inshoingni yozasan.",
    tush: [
      { h: "Avval reja: 5 daqiqa", p: ["Rejasiz yozsang, o'rtasida g'oya tugab qoladi. Qog'ozga 4 qator yoz:", "1. Savol turi qaysi?<br>2. Mening fikrim nima?<br>3. 1-sabab + misol<br>4. 2-sabab + misol"] },
      { h: "Ikkinchi asosiy paragraf", p: ["Ikki yo'l bor:", "<b>1. Ikkinchi sabab:</b> “Secondly, ...”", "<b>2. Qarama-qarshi tomon va unga javob:</b> “On the other hand, ... However, I believe ...”"], ex: [["On the other hand, phones help parents contact their children.", "Qarama-qarshi tomon"], ["However, I believe this can be done after lessons.", "Unga javob"]] },
      { h: "Xulosa = 2 gap", p: ["<b>In conclusion,</b> bilan boshlanadi.", "Kirishdagi fikringni <b>boshqa so'zlar bilan</b> qayta aytasan va asosiy sababni eslatasan.", "Xulosaga <b>yangi g'oya qo'shilmaydi</b>."], ex: [["In conclusion, although mobile phones can be useful for learning, I believe they should not be used during lessons because they reduce concentration.", "Fikr + asosiy sabab"]] },
      { h: "40 daqiqani bo'lish", p: ["<b>5 daqiqa</b> reja<br><b>30 daqiqa</b> yozish<br><b>5 daqiqa</b> tekshirish", "Tekshirganda 4 narsaga qara:", "• he/she/it dan keyin -s (works, goes)<br>• zamon bir xilmi<br>• a / the<br>• imlo"] },
    ],
    nam: [
      { h: "Insho rejasi", p: ["Savol: <b>Mobile phones should be banned in schools. To what extent do you agree or disagree?</b>", "<b>Kirish:</b> savol boshqa so'zlar bilan + “I completely agree”<br><b>Asosiy 1:</b> telefon darsdan chalg'itadi → baholar tushadi<br><b>Asosiy 2:</b> ota-onalar bog'lanishi kerak, lekin buni darsdan keyin qilsa bo'ladi<br><b>Xulosa:</b> dars paytida ishlatilmasin"] },
      { h: "Namuna xulosa", p: ["Fikr takrorlandi, lekin kirishdagi so'zlar bilan emas:"], ex: [["In conclusion, although mobile phones can be useful for learning, I believe they should not be used during lessons because they reduce concentration.", "Xulosa"]] },
    ],
    mashq: [
      yP("Xulosa qaysi ibora bilan boshlanadi?", "In conclusion,", ["For example,", "Firstly,", "On the other hand,"]),
      yP("Xulosada nima bo'lmaydi?", "Yangi g'oya", ["Fikrimning takrori", "Asosiy sababning qisqa eslatmasi"]),
      yF("On the other ___, phones help parents contact their children.", "hand", ["hand", "side", "way"], "Boshqa tomondan, telefonlar ota-onalarga farzandlari bilan bog'lanishga yordam beradi."),
      yP("40 daqiqani qanday bo'lasan?", "5 reja + 30 yozish + 5 tekshirish", ["40 daqiqa to'xtamay yozish", "20 reja + 20 yozish"]),
      yO("In conclusion, I believe that phones should be banned.", "Xulosa qilib aytganda, menimcha telefonlar taqiqlanishi kerak."),
    ],
    main: [{ k: "w2", a: { id: "w2_phones_school", minW: 200, lim: 45, tpl: true, lbl: "Yozish: to'liq insho (shablon bilan)" } }],
    sinov: [
      yF("In ___, I completely agree with this view.", "conclusion", ["conclusion", "conclude", "the end"], "Xulosa qilib aytganda, men bu fikrga to'liq qo'shilaman."),
      yP("To'liq inshoda nechta paragraf bo'ladi?", "4–5 ta", ["1 ta", "2 ta", "10 ta"]),
      yP("Yozishdan oldin birinchi ish nima?", "5 daqiqa reja tuzish", ["Darhol yozishni boshlash", "So'zlarni sanash"]),
      yF("She ___ to school by bus.", "goes", ["goes", "go", "going"], "U maktabga avtobusda boradi.", "she dan keyin fe'lga -s / -es qo'shiladi: goes."),
      yP("Ikkinchi asosiy paragraf qaysi so'z bilan boshlanishi mumkin?", "Secondly,", ["In conclusion,", "Overall,"]),
    ],
  },
  {
    id: "k23", sk: "Strategiya", ic: "⏱", t: "Imtihonda vaqtni boshqarish", goal: "Reading va Listening'da vaqtni to'g'ri taqsimlashni o'rganib, birinchi marta to'liq vaqt bilan matn yechasan.",
    tush: [
      { h: "Reading: 60 daqiqa, 3 ta matn", p: ["Har matnga taxminan <b>20 daqiqa</b>.", "1-matn eng oson: unga 15–17 daqiqa sarfla, tejagan vaqtingni 3-matnga qoldir.", "Bitta savolda 1 daqiqadan ortiq tiqilib qolma: <b>belgila va o'tib ket</b>. Oxirida qaytasan."] },
      { h: "Ishlash tartibi", p: ["1. Savollarga ko'z yugurt: nima qidirishni bilib ol.<br>2. Matnni 2 daqiqada skim qil.<br>3. Savolma-savol javob qidir.<br>4. Oxirgi 2–3 daqiqa: bo'sh qolganlarni to'ldir."] },
      { h: "Listening", p: ["Audio faqat bir marta eshitiladi.", "Bir javobni eshitmay qoldingmi? <b>Ortga o'ylama</b>, keyingi savolga o't. Aks holda keyingisini ham boy berasan.", "Oxirida tekshir: imlo va ko'plik qo'shimchasi (<b>book</b> emas, <b>books</b> deyilgan bo'lsa, -s siz javob xato)."] },
      { h: "Hech narsa bo'sh qolmasin", p: ["Vaqt tugayaptimi? Qolgan kataklarni taxmin bilan to'ldir.", "Xato javob uchun ball ayirilmaydi. Bo'sh katak esa aniq 0."] },
    ],
    nam: [
      { h: "20 daqiqalik matn rejasi", p: ["<b>0–2 daqiqa:</b> savollar va matnga ko'z yugurtirish<br><b>2–17 daqiqa:</b> savollarga javob<br><b>17–20 daqiqa:</b> tekshirish va bo'shlarni to'ldirish", "Bugungi asosiy vazifada soat qo'shimcha vaqtsiz ishlaydi. Shu rejaga amal qilib ko'r."] },
    ],
    mashq: [
      yP("Bitta Reading matniga taxminan qancha vaqt ajratiladi?", "20 daqiqa", ["5 daqiqa", "40 daqiqa"]),
      yP("Bir savol javobini 1 daqiqada topa olmading. Nima qilasan?", "Belgilab, keyingisiga o'taman", ["Topmaguncha qidiraman", "Testni tashlab ketaman"]),
      yP("Listening'da bir javobni eshitmay qolding. Nima qilasan?", "Keyingi savolga o'taman", ["Audio'ni to'xtatishni so'rayman", "Yozishni to'xtataman"]),
      yP("Sen <b>book</b> deb yozding, audio'da esa <b>books</b> deyilgan edi. Natija?", "Xato", ["To'g'ri", "Yarim ball"]),
      yP("2 daqiqa qoldi, 3 ta katak bo'sh. Nima qilasan?", "Taxmin bilan to'ldiraman", ["Bo'sh qoldiraman"]),
    ],
    main: [{ k: "rd", a: { id: "r_solar" } }],
    sinov: [
      yP("Reading matnini nimadan boshlaysan?", "Savollarga ko'z yugurtirishdan", ["Matnni tarjima qilishdan", "Eng oxirgi savoldan"]),
      yP("Reading'ga jami necha daqiqa beriladi?", "60", ["30", "40", "90"]),
      yP("Qaysi matn odatda eng oson?", "Birinchisi", ["Uchinchisi", "Hammasi bir xil"]),
      yP("Taxmin qilib yozgan javobing xato chiqsa nima bo'ladi?", "Ball ayirilmaydi", ["1 ball ayiriladi", "Test bekor bo'ladi"]),
      yP("Listening oxirida nimani tekshirasan?", "Imlo va ko'plik qo'shimchasini", ["Hech narsani", "Faqat ismimni"]),
    ],
  },
  { id: "t4", rev: true, ic: "🔁", t: "4-hafta takrori", of: ["k18", "k19", "k20", "k21", "k22", "k23"], extra: { k: "rd", a: { id: "r_kwave", xt: 1.1 } } },
  {
    id: "k24", sk: "Speaking", ic: "🎤", t: "Speaking: to'liq imtihon", goal: "Uchala qismni ketma-ket, imtihondagidek topshirasan.",
    tush: [
      { h: "Imtihon tartibi", p: ["<b>Part 1</b> (4–5 daqiqa): sen haqingda oddiy savollar.<br><b>Part 2</b> (3–4 daqiqa): kartochka, 1 daqiqa tayyorgarlik, 1–2 daqiqa nutq.<br><b>Part 3</b> (4–5 daqiqa): umumiy muhokama.", "Jami 11–14 daqiqa."] },
      { h: "Uch formula", p: ["<b>Part 1:</b> javob + sabab + misol (2–3 gap).", "<b>Part 2:</b> kirish gapi → savollar tartibi bilan → “why” eng uzun → yakun gapi.", "<b>Part 3:</b> fikr + sabab + misol."] },
      { h: "Savolni tushunmasang", p: ["Qayta so'rash mumkin. Bu ballni tushirmaydi. Jim qolish esa tushiradi."], ex: [["Could you repeat the question, please?", "Savolni takrorlay olasizmi?"], ["Sorry, could you explain what you mean?", "Nimani nazarda tutganingizni tushuntira olasizmi?"], ["That's an interesting question. Let me think.", "Qiziq savol. O'ylab ko'ray."]] },
      { h: "Yodlangan javob", p: ["Butun javobni yodlab kelma. Imtihonchi buni darhol sezadi va ball tushadi.", "Qoliplarni bil (I'd like to talk about ..., That's why ...), gapning o'zini esa o'sha yerda tuz."] },
    ],
    nam: [
      { h: "Qutqaruvchi iboralar", p: ["Shu uchtasini yodlab ol. Ular har qanday vaziyatda vaqt yutib beradi:"], ex: [["Could you repeat the question, please?", "Savolni eshitmasang"], ["That's an interesting question. Let me think.", "O'ylashga vaqt kerak bo'lsa"], ["What I mean is, it depends on the person.", "Fikrni boshqacha tushuntirish uchun"]] },
    ],
    mashq: [
      yO("Could you repeat the question, please?", "Savolni takrorlay olasizmi?"),
      yP("Speaking jami qancha davom etadi?", "11–14 daqiqa", ["2–3 daqiqa", "30 daqiqa"]),
      yP("Savolni tushunmading. Nima deysan?", "Could you repeat the question, please?", ["I don't understand English.", "Next question."]),
      yF("That's an interesting question. Let me ___.", "think", ["think", "thinking", "to think"], "Qiziq savol. O'ylab ko'ray."),
      yS("That's an interesting question. Let me think.", "Qiziq savol. O'ylab ko'ray."),
    ],
    main: [{ k: "sp1", a: { id: "p1_english" } }, { k: "sp2", a: { id: "p2_goal" } }, { k: "sp3", a: { id: "p2_goal" } }],
    sinov: [
      yP("Qaysi qismda 1 daqiqa tayyorlanasan?", "Part 2", ["Part 1", "Part 3"]),
      yP("Yodlab olingan tayyor javobni aytsang nima bo'ladi?", "Imtihonchi sezadi va ball tushadi", ["Ball oshadi", "Hech narsa bo'lmaydi"]),
      yP("Savolni takrorlashni so'rash mumkinmi?", "Mumkin, bu ballni tushirmaydi", ["Taqiqlangan", "Imtihon to'xtatiladi"]),
      yF("Sorry, could you ___ what you mean?", "explain", ["explain", "explaining", "explained"], "Uzr, nimani nazarda tutganingizni tushuntira olasizmi?"),
      yP("Part 1 da savollar nima haqida bo'ladi?", "O'zim va kundalik hayotim haqida", ["Siyosat haqida", "Grafiklar haqida"]),
    ],
  },
);
