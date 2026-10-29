// Yodla — daraja testi, "O'zim haqimda" savollari va "Soya" hikoyalari
// TEST: har daraja 6 ta savol; daraja 4 tadan kam to'g'ri bo'lsa, test shu yerda to'xtaydi
const TEST = [
  { lv: "A1", tasks: [
    { k: "fill", s: "My sister ___ a teacher.", a: "is", o: ["is", "are", "am"], uz: "Singlim o'qituvchi." },
    { k: "fill", s: "They ___ like coffee.", a: "don't", o: ["don't", "doesn't", "isn't"], uz: "Ular qahvani yoqtirmaydi." },
    { k: "fill", s: "I ___ swim very well.", a: "can", o: ["can", "am", "do"], uz: "Men juda yaxshi suza olaman." },
    { k: "tr", uz: "Sening isming nima?", a: "What is your name?", o: ["What your name is?", "What is you name?"] },
    { k: "listen", en: "Where do you live?", uz: "Qayerda yashaysan?", o: ["Qayerga ketyapsan?", "Qachon kelasan?", "Nima qilyapsan?"] },
    { k: "fill", s: "There ___ two chairs in the room.", a: "are", o: ["are", "is", "be"], uz: "Xonada ikkita stul bor." },
  ]},
  { lv: "A2", tasks: [
    { k: "fill", s: "I ___ to the cinema yesterday.", a: "went", o: ["went", "go", "have gone"], uz: "Kecha kinoga bordim." },
    { k: "fill", s: "She is ___ than her brother.", a: "taller", o: ["taller", "more tall", "tallest"], uz: "U akasidan bo'yliroq." },
    { k: "fill", s: "You ___ smoke here. It's not allowed.", a: "mustn't", o: ["mustn't", "don't have to", "aren't"], uz: "Bu yerda chekish mumkin emas. Ruxsat yo'q." },
    { k: "tr", uz: "Ertaga nima qilmoqchisan?", a: "What are you going to do tomorrow?", o: ["What you will do tomorrow?", "What are you go to do tomorrow?"] },
    { k: "listen", en: "Have you ever been to London?", uz: "Hech Londonda bo'lganmisan?", o: ["Londonga qachon borasan?", "Londonda yashaysanmi?", "London senga yoqdimi?"] },
    { k: "fill", s: "We ___ watching TV when you called.", a: "were", o: ["were", "was", "are"], uz: "Sen qo'ng'iroq qilganingda televizor ko'rayotgan edik." },
  ]},
  { lv: "B1", tasks: [
    { k: "fill", s: "I have lived here ___ 2015.", a: "since", o: ["since", "for", "from"], uz: "2015-yildan beri shu yerda yashayman." },
    { k: "fill", s: "If I ___ more money, I would buy a house.", a: "had", o: ["had", "have", "will have"], uz: "Pulim ko'proq bo'lganida, uy olardim." },
    { k: "fill", s: "This bridge ___ built in 1990.", a: "was", o: ["was", "is", "has"], uz: "Bu ko'prik 1990-yilda qurilgan." },
    { k: "fill", s: "The man ___ called you is my uncle.", a: "who", o: ["who", "which", "what"], uz: "Senga qo'ng'iroq qilgan odam mening amakim." },
    { k: "tr", uz: "Ilgari men ko'p o'yin o'ynardim.", a: "I used to play a lot of games.", o: ["I use to play a lot of games.", "I was used play a lot of games."] },
    { k: "listen", en: "If you need anything, let me know.", uz: "Biror narsa kerak bo'lsa, menga ayt.", o: ["Hech narsa kerak emas, rahmat.", "Menga hamma narsani aytib ber.", "Nima kerakligini bilmayman."] },
  ]},
  { lv: "B2", tasks: [
    { k: "fill", s: "I wish I ___ more time to study.", a: "had", o: ["had", "have", "will have"], uz: "Kashki o'qishga ko'proq vaqtim bo'lsa." },
    { k: "fill", s: "If I had known, I ___ have helped you.", a: "would", o: ["would", "will", "should had"], uz: "Bilganimda, senga yordam bergan bo'lardim." },
    { k: "fill", s: "By next year, I ___ finished university.", a: "will have", o: ["will have", "will", "have"], uz: "Kelasi yilga borib universitetni tugatgan bo'laman." },
    { k: "fill", s: "She asked me where I ___.", a: "lived", o: ["lived", "do live", "did live"], uz: "U mendan qayerda yashashimni so'radi." },
    { k: "tr", uz: "Uning kelishi dargumon.", a: "He is unlikely to come.", o: ["He is unlike to come.", "He unlikely comes to."] },
    { k: "fill", s: "I'm not used to ___ up so early.", a: "getting", o: ["getting", "get", "got"], uz: "Bunchalik erta turishga o'rganmaganman." },
  ]},
];
const LV_NAME = { A1: "Boshlang'ich", A2: "Asosiy", B1: "O'rta", B2: "O'rtadan yuqori" };

// O'zim haqimda: Andrew savol beradi, sen o'zing haqingda erkin javob berasan; keyin namunaviy javobni tinglaysan
const SAVOLLAR = [
  { lv: "A1", q: "What's your name?", uz: "Isming nima?", m: "My name is Gojo.", mUz: "Mening ismim Gojo." },
  { lv: "A1", q: "Where are you from?", uz: "Qayerliksan?", m: "I'm from Uzbekistan.", mUz: "Men O'zbekistondanman." },
  { lv: "A1", q: "How old are you?", uz: "Necha yoshdasan?", m: "I'm twenty years old.", mUz: "Men yigirma yoshdaman." },
  { lv: "A1", q: "What do you do?", uz: "Nima ish qilasan?", m: "I'm a student, and I also work.", mUz: "Men talabaman, ishlayman ham." },
  { lv: "A1", q: "Do you like music?", uz: "Musiqani yoqtirasanmi?", m: "Yes, I love rap music.", mUz: "Ha, rep musiqani yaxshi ko'raman." },
  { lv: "A1", q: "What's your favorite food?", uz: "Eng yoqtirgan taoming nima?", m: "My favorite food is plov.", mUz: "Eng yoqtirgan taomim palov." },
  { lv: "A2", q: "What did you do yesterday?", uz: "Kecha nima qilding?", m: "Yesterday I worked, and in the evening I watched a movie.", mUz: "Kecha ishladim, kechqurun esa kino ko'rdim." },
  { lv: "A2", q: "What are you going to do this weekend?", uz: "Shu dam olish kunlari nima qilmoqchisan?", m: "I'm going to meet my friends and play football.", mUz: "Do'stlarim bilan uchrashib, futbol o'ynamoqchiman." },
  { lv: "A2", q: "What do you usually do in the morning?", uz: "Ertalab odatda nima qilasan?", m: "I usually wake up at seven, wash my face, and have breakfast.", mUz: "Odatda yettida uyg'onaman, yuzimni yuvaman va nonushta qilaman." },
  { lv: "A2", q: "Tell me about your family.", uz: "Oilang haqida gapirib ber.", m: "I have a small family: my mother, my father and my brother.", mUz: "Oilam kichkina: onam, otam va ukam." },
  { lv: "A2", q: "Why are you learning English?", uz: "Nega ingliz tilini o'rganyapsan?", m: "I want to talk with people from other countries.", mUz: "Boshqa davlatlardagi odamlar bilan gaplashmoqchiman." },
  { lv: "A2", q: "Have you ever been abroad?", uz: "Hech chet elda bo'lganmisan?", m: "No, I haven't, but I want to visit America.", mUz: "Yo'q, bo'lmaganman, lekin Amerikaga borishni xohlayman." },
  { lv: "B1", q: "What would you do if you had a million dollars?", uz: "Million dollaring bo'lsa, nima qilarding?", m: "I would buy a house for my parents and travel around the world.", mUz: "Ota-onamga uy olib, dunyo bo'ylab sayohat qilardim." },
  { lv: "B1", q: "How long have you been learning English?", uz: "Qancha vaqtdan beri ingliz tilini o'rganyapsan?", m: "I've been learning English for about a year.", mUz: "Taxminan bir yildan beri ingliz tilini o'rganyapman." },
  { lv: "B1", q: "What do you think about social media?", uz: "Ijtimoiy tarmoqlar haqida qanday fikrdasan?", m: "I think it's useful, but people spend too much time on it.", mUz: "Menimcha, foydali, lekin odamlar unga juda ko'p vaqt sarflaydi." },
  { lv: "B1", q: "What did you use to do when you were a child?", uz: "Bolaligingda nima qilarding?", m: "I used to play outside with my friends all day.", mUz: "Kun bo'yi do'stlarim bilan tashqarida o'ynardim." },
  { lv: "B1", q: "What is your biggest goal?", uz: "Eng katta maqsading nima?", m: "My biggest goal is to speak English fluently and get a good job.", mUz: "Eng katta maqsadim inglizcha ravon gapirish va yaxshi ish topish." },
  { lv: "B1", q: "Describe your best friend.", uz: "Eng yaqin do'stingni ta'riflab ber.", m: "My best friend is funny and kind. We've known each other since school.", mUz: "Eng yaqin do'stim quvnoq va mehribon. Maktabdan beri bir-birimizni taniymiz." },
];

// Soya (shadowing): Andrew gapni aytadi, sen darhol uning ohangida takrorlaysan
const HIKOYALAR = [
  { lv: "A1", title: "Mening kunim", lines: [
    ["Every day I wake up at seven.", "Har kuni soat yettida uyg'onaman."],
    ["I drink tea and eat breakfast.", "Choy ichib, nonushta qilaman."],
    ["Then I go to work by bus.", "Keyin avtobusda ishga boraman."],
    ["I work in a big office.", "Katta ofisda ishlayman."],
    ["In the evening I play football with my friends.", "Kechqurun do'stlarim bilan futbol o'ynayman."],
    ["At night I learn English for twenty minutes.", "Kechasi yigirma daqiqa ingliz tili o'rganaman."],
  ]},
  { lv: "A2", title: "Samarqandga sayohat", lines: [
    ["Last summer I went to Samarkand with my brother.", "O'tgan yozda akam bilan Samarqandga bordim."],
    ["We took the fast train, and it was very comfortable.", "Tezyurar poyezdga o'tirdik, juda qulay edi."],
    ["The weather was hot, but the city was beautiful.", "Havo issiq edi, lekin shahar go'zal edi."],
    ["We visited the Registan and took a lot of photos.", "Registonni ko'rdik va ko'p rasmga tushdik."],
    ["In the evening we ate plov at a small cafe.", "Kechqurun kichkina kafeda palov yedik."],
    ["It was the best trip of my life.", "Bu hayotimdagi eng zo'r sayohat edi."],
  ]},
  { lv: "A2", title: "Ko'cha: shanba kechasi", lines: [
    ["Yo, let me tell you about last Saturday.", "Hey, o'tgan shanba haqida aytib beray."],
    ["Me and the squad went to a party at my homie's crib.", "Jamoa bilan oshnamning uyidagi bazmga bordik."],
    ["The music was fire, and the vibe was crazy.", "Musiqa zo'r, muhit esa aqldan ozdiradigan edi."],
    ["My boy dropped a freestyle, and everybody went wild.", "Oshnam tayyorlanmasdan rep o'qidi, hamma jinni bo'lib ketdi."],
    ["I was broke, but it didn't even matter.", "Cho'ntagim bo'sh edi, lekin bu umuman muhim emasdi."],
    ["Real talk, it was the best night ever.", "Rostini aytsam, eng zo'r kecha bo'ldi."],
  ]},
  { lv: "B1", title: "Nega ingliz tili", lines: [
    ["I've been learning English for a few months now.", "Bir necha oydan beri ingliz tilini o'rganyapman."],
    ["At first it was hard, because I was afraid to speak.", "Avvaliga qiyin edi, chunki gapirishdan qo'rqardim."],
    ["Now I practice a little every day, even when I'm tired.", "Endi charchagan bo'lsam ham, har kuni ozgina mashq qilaman."],
    ["If I keep going like this, I'll be able to speak fluently.", "Shunday davom etsam, ravon gapira olaman."],
    ["My dream is to travel to America and talk to people there.", "Orzuim Amerikaga borib, u yerdagi odamlar bilan gaplashish."],
    ["I know it takes time, but I'm not going to give up.", "Bilaman, bu vaqt oladi, lekin taslim bo'lmayman."],
  ]},
];
