"use strict";
// ---------- GRAMMATIKA YO'LI: har kuni bitta grammatika mavzusi ----------
// Gojo (2026-11-13): "mavzu" deganda am/is/are, to be, going to, since/for, zamonlar va ularga mos test va mashqlarni nazarda tutgan.
// Yo'lning 1-bosqichi: 8 hafta, har haftada 6 ta mavzu + hafta takrori. Keyin 2-bosqich: IELTS ko'nikmalari (yol_data*.js).
// Kun qadamlari: chuqur dars (hikoya, qoida, tushunish, mashq, yakuniy sinov 80%) → qo'shimcha mashq → o'zing gap tuz → eski mavzularni takrorlash.
const GWEEKS = [
  ["be", "be-neg", "my", "obj", "this", "a-an"],
  ["there", "prep", "simple", "do", "wh", "can"],
  ["ing", "simpcont", "some", "was", "past", "past2"],
  ["pastcont", "compare", "future", "should", "haveto", "perfect"],
  ["ppvsps", "since", "ppc", "used", "gerund", "might"],
  ["tenses", "if1", "if2", "passive", "who", "sotoo"],
  ["pastperf", "reported", "if3", "wish", "musthave", "linking"],
  ["phrasal", "tags", "mixed", "inversion", "cleft", "hedge"],
];
const GT = {
  be: "to be: am, is, are", "be-neg": "to be: inkor va savol", my: "my, your, his, her", obj: "me, him, her, them", this: "this, that, these, those", "a-an": "a, an va ko'plik",
  there: "there is, there are", prep: "in, on, at, under", simple: "Present simple: I work, he works", do: "Present simple: don't, Do you...?", wh: "Savol so'zlari: what, where, why", can: "can, can't",
  ing: "Present continuous: I am working", simpcont: "I work yoki I'm working?", some: "some, any, much, many", was: "Past: was, were", past: "Past simple: -ed", past2: "Past simple: noto'g'ri fe'llar",
  pastcont: "Past continuous: I was working", compare: "bigger, the biggest", future: "Kelajak: going to va will", should: "should: maslahat", haveto: "have to, must", perfect: "Present perfect: Have you ever...?",
  ppvsps: "I've done yoki I did? (just, already, yet)", since: "for va since", ppc: "I've been working (perfect continuous)", used: "used to", gerund: "I enjoy playing, I want to play", might: "may, might, could",
  tenses: "Zamonlar xaritasi", if1: "Shart gap: If it rains, I'll...", if2: "Shart gap: If I were you, I'd...", passive: "Majhul nisbat: It was made in...", who: "who, which, that", sotoo: "so, such, too, enough",
  pastperf: "Past perfect: I had already left", reported: "O'zlashtirma gap: He said that...", if3: "Shart gap: If I had known...", wish: "I wish I could...", musthave: "must have, can't have", linking: "although, despite, however",
  phrasal: "Phrasal verbs: give up, find out", tags: "Qisqa savollar: ..., isn't it?", mixed: "Aralash shart gaplar", inversion: "Never have I seen...", cleft: "What I need is...", hedge: "Speaking: To be honest, it depends",
};
// o'zing gap tuz: p — vazifa, re — har gapda bo'lishi kerak bo'lgan shakl, ex — namuna gaplar
const GYOZ = {
  be: { p: "O'zing va oilang haqida 5 ta gap yoz. Har gapda am, is yoki are bo'lsin.", re: "\\b(am|is|are)\\b|'m\\b|'s\\b|'re\\b", ex: ["I am nineteen years old.", "My brother is a driver.", "We are from Tashkent."] },
  "be-neg": { p: "5 ta gap: 3 ta inkor (I'm not, isn't, aren't) va 2 ta savol (Are you...? Is he...?).", re: "\\b(not|isn't|aren't)\\b|^\\s*(am|is|are)\\b", ex: ["I'm not tired.", "My father isn't at home.", "Are you a student?"] },
  my: { p: "Oilang haqida 5 ta gap: my, your, his, her, our, their so'zlarini ishlat.", re: "\\b(my|your|his|her|our|their|its)\\b", ex: ["My mother's name is Dilnoza.", "His car is white.", "Their house is big."] },
  obj: { p: "5 ta gap: me, him, her, us, them so'zlaridan foydalan.", re: "\\b(me|him|her|us|them)\\b", ex: ["My friends always help me.", "I call her every day.", "I miss them."] },
  this: { p: "Atrofingdagi narsalar haqida 5 ta gap: this, that, these, those.", re: "\\b(this|that|these|those)\\b", ex: ["This is my phone.", "Those boxes are heavy.", "That man is my boss."] },
  "a-an": { p: "Uyingda nima bor? 5 ta gap: a, an va ko'plik (-s).", re: "\\b(a|an)\\b|[a-z]{2,}s\\b", ex: ["I have a brother and two sisters.", "There is an apple on the table.", "I need three boxes."] },
  there: { p: "Shahring yoki xonang haqida 5 ta gap: there is / there are.", re: "\\bthere\\s+(is|are|isn't|aren't|was|were)\\b|\\bthere's\\b", ex: ["There is a big park near my house.", "There are two beds in my room.", "There isn't a cinema in my street."] },
  prep: { p: "Narsalar qayerda? 5 ta gap: in, on, at, under, next to.", re: "\\b(in|on|at|under|next to|behind|between|near)\\b", ex: ["My phone is on the table.", "I work at a warehouse.", "The cat is under the bed."] },
  simple: { p: "Odatiy kuning haqida 5 ta gap (I get up..., my brother works...). he / she bilan -s ni unutma.", re: "\\b(every|usually|always|often|never|sometimes)\\b|\\bon [a-z]+days?\\b|\\b(he|she|it|brother|sister|mother|mom|father|dad|friend|wife|husband|son|daughter|boss|teacher)\\s+[a-z]+s\\b|\\b(i|you|we|they)\\s+(get|go|work|live|like|love|want|need|have|drink|eat|play|watch|study|read|sleep|walk|drive|speak|cook|clean|help|start|finish|know|take|come|wake)\\b", ex: ["I get up at six every day.", "My brother works in a shop.", "She usually drinks tea."] },
  do: { p: "5 ta gap: 2 ta inkor (don't, doesn't) va 3 ta savol (Do you...? Does he...?).", re: "\\b(do|does|don't|doesn't)\\b", ex: ["I don't like coffee.", "Does your sister work?", "Do you speak English?"] },
  wh: { p: "Do'stingga 5 ta savol ber: what, where, when, why, how.", re: "^\\s*(what|where|when|why|how|who|which|whose)\\b", ex: ["Where do you live?", "What time do you get up?", "Why are you tired?"] },
  can: { p: "Nima qila olasan, nima qila olmaysan? 5 ta gap: can / can't.", re: "\\b(can|can't|cannot|could)\\b", ex: ["I can drive a car.", "I can't swim.", "Can you speak Korean?"] },
  ing: { p: "Hozir atrofingda nima bo'lyapti? 5 ta gap: am / is / are + -ing.", re: "(\\b(am|is|are)|'m|'s|'re)\\s+(not\\s+)?[a-z]+ing\\b", ex: ["I'm sitting in my room.", "My mother is cooking.", "It's raining outside."] },
  simpcont: { p: "5 ta gap: odat (every day, usually) va hozirgi ish (now, today) aralash.", re: "[a-z]+ing\\b|\\b(every|usually|always|often|never|sometimes)\\b", ex: ["I usually work until six.", "Today I'm resting at home.", "My friend plays football every Sunday."] },
  some: { p: "Uyda nima bor, nima yo'q? 5 ta gap: some, any, much, many, a lot of.", re: "\\b(some|any|much|many|a lot of|lots of)\\b", ex: ["I have some money.", "We don't have any milk.", "How many friends do you have?"] },
  was: { p: "Kecha yoki bolaligingda qanday eding? 5 ta gap: was / were.", re: "\\b(was|were|wasn't|weren't)\\b", ex: ["I was at work yesterday.", "My parents were happy.", "The weather wasn't nice."] },
  past: { p: "Kecha nima qilding? 5 ta gap: -ed fe'llar (worked, watched) va didn't.", re: "[a-z]+ed\\b|\\b(did|didn't)\\b", ex: ["I worked until seven.", "I watched a film.", "I didn't call my friend."] },
  past2: { p: "O'tgan dam olish kuning: 5 ta gap noto'g'ri fe'llar bilan (went, saw, ate, bought...).", re: "\\b(went|saw|ate|bought|had|made|took|got|came|met|did|drank|slept|wrote|read|said|told|gave|found|left|thought|felt|knew|ran|sat|spoke|forgot|lost|paid|sent|spent|brought|began|chose|drove|fell|flew|heard|kept|learnt|put|rode|sang|sold|stood|swam|taught|understood|woke|won|wore|was|were)\\b", ex: ["I went to the bazaar.", "I saw my cousin.", "We ate plov together."] },
  pastcont: { p: "Kecha soat 8 da, 10 da nima qilayotgan eding? 5 ta gap: was / were + -ing (when, while bilan ham).", re: "\\b(was|were|wasn't|weren't)\\s+(not\\s+)?[a-z]+ing\\b", ex: ["At eight I was working.", "I was eating when my friend called.", "While I was walking home, it started to rain."] },
  compare: { p: "Narsalarni solishtir: 5 ta gap (bigger than, more expensive, the best...).", re: "[a-z]+er\\s+than\\b|\\bmore\\s+[a-z]+|\\bless\\s+[a-z]+|\\b(best|worst|most|better|worse)\\b|[a-z]{3,}est\\b", ex: ["Tashkent is bigger than Bukhara.", "My phone is older than yours.", "This is the best day of my life."] },
  future: { p: "Kelajak rejalaring: 5 ta gap — going to (reja) va will (va'da, qaror).", re: "\\bgoing to\\b|\\b(will|won't)\\b|'ll\\b", ex: ["I'm going to study in Korea.", "I will call you tomorrow.", "I'm going to buy a new phone."] },
  should: { p: "Do'stingga 5 ta maslahat ber: should / shouldn't.", re: "\\b(should|shouldn't)\\b", ex: ["You should sleep more.", "You shouldn't eat fast food every day.", "Should I learn Korean?"] },
  haveto: { p: "Ishda va uyda nima majburiysan? 5 ta gap: have to, has to, must, don't have to.", re: "\\b(have to|has to|had to|must|mustn't)\\b", ex: ["I have to get up at six.", "I don't have to work on Sunday.", "You must wear a helmet."] },
  perfect: { p: "Hayotingda nimalarni qilgansan, nimalarni qilmagansan? 5 ta gap: I have..., I've never..., Have you ever...?", re: "\\b(have|has|haven't|hasn't)\\b|'ve\\b", ex: ["I have been to Samarkand.", "I've never tried sushi.", "Have you ever seen snow?"] },
  ppvsps: { p: "5 ta gap: 3 tasi just, already, yet bilan va 2 tasi yesterday yoki ago bilan.", re: "\\b(just|already|yet|yesterday|ago|last)\\b", ex: ["I've just finished work.", "I haven't eaten yet.", "I called my mother two hours ago."] },
  since: { p: "Qachondan beri? 5 ta gap for / since bilan (I have ... for / since ...).", re: "\\b(for|since)\\b", ex: ["I have lived in Tashkent since 2007.", "I've known my best friend for ten years.", "I have worked here since March."] },
  ppc: { p: "Qancha vaqtdan beri qilyapsan? 5 ta gap: have been + -ing.", re: "(\\b(have|has)|'ve|'s)\\s+([a-z]+\\s+)?been\\s+[a-z]+ing\\b", ex: ["I've been learning English for a year.", "I have been working all day.", "How long have you been waiting?"] },
  used: { p: "Bolaligingda nima qilarding, endi qilmaysan? 5 ta gap: used to / didn't use to.", re: "\\b(used to|use to)\\b", ex: ["I used to play football every day.", "I didn't use to like vegetables.", "My father used to smoke."] },
  gerund: { p: "5 ta gap: enjoy / like / stop + -ing va want / decide / need + to.", re: "[a-z]+ing\\b|\\b(want|wants|wanted|decided|decide|need|needs|plan|hope|try|tried)\\s+to\\b", ex: ["I enjoy listening to music.", "I want to study in Korea.", "I stopped eating sugar."] },
  might: { p: "Ertaga nima bo'lishi mumkin? 5 ta gap: may, might, could.", re: "\\b(may|might|could)\\b", ex: ["It might rain tomorrow.", "I may go to the gym tonight.", "He could be at home."] },
  tenses: { n: 6, p: "O'zing haqingda 6 ta gap, har biri boshqa zamonda: odat, hozir, kecha, o'tmishdagi jarayon, for / since bilan, reja.", re: "", ex: ["I work in a warehouse.", "Right now I'm learning English.", "Yesterday I worked late.", "At ten I was still working.", "I've studied English for a year.", "Next year I'm going to take IELTS."] },
  if1: { p: "5 ta shart gap: If ..., I will ... (if dan keyin will qo'yma!).", re: "\\bif\\b", ex: ["If it rains, I'll stay home.", "If I pass IELTS, I will go to Korea.", "I'll call you if I have time."] },
  if2: { p: "Xayoliy holat: 5 ta gap If I were / If I had ..., I would ...", re: "\\bwould\\b|'d\\b", ex: ["If I were rich, I would buy a house for my parents.", "If I had more time, I'd read more books.", "If I lived in Seoul, I would speak Korean."] },
  passive: { p: "5 ta majhul gap: is made, was built, are sold...", re: "\\b(is|are|was|were|been|be|isn't|aren't|wasn't|weren't)\\s+[a-z]+(ed|en|wn|ght|t)\\b|\\b(is|are|was|were)\\s+(made|built|sold|spoken|written|done|held|grown|kept|found|sent|paid|told|taught|bought|cut|put|read)\\b", ex: ["Plov is made with rice and meat.", "This mosque was built in the fifteenth century.", "English is spoken all over the world."] },
  who: { p: "5 ta gap who, which, that bilan (odam yoki narsani aniqlab).", re: "\\b(who|which|that|where|whose)\\b", ex: ["My friend who lives in Korea is a student.", "This is the phone that I bought last year.", "I like people who are honest."] },
  sotoo: { p: "5 ta gap: so, such, too, enough.", re: "\\b(so|such|too|enough)\\b", ex: ["The box is too heavy.", "I'm not old enough to drive.", "It was such a long day."] },
  pastperf: { p: "5 ta gap: had + 3-shakl (biri ikkinchisidan oldin bo'lgan).", re: "\\bhad\\s+(already\\s+|just\\s+|never\\s+|not\\s+)?[a-z]+|\\bhadn't\\b|'d\\s+(already\\s+|never\\s+)?[a-z]+(ed|en|wn|ght|t)\\b", ex: ["When I arrived, the bus had already left.", "I had never seen snow before.", "She had finished her work before I came."] },
  reported: { p: "Kim nima dedi? 5 ta gap: He said that..., She told me..., He asked if...", re: "\\b(said|told|asked|explained|says)\\b", ex: ["My boss said that I was late.", "She told me she was tired.", "He asked if I could help him."] },
  if3: { p: "O'tmishni o'zgartirsa bo'lsa: 5 ta gap If I had ..., I would have ...", re: "\\b(would|could|might|wouldn't)\\s+have\\b|\\bwould've\\b", ex: ["If I had studied more, I would have passed.", "If I had known, I would have come.", "If he hadn't been late, he wouldn't have lost the job."] },
  wish: { p: "5 ta orzu: I wish I were / I wish I could / I wish I had ...", re: "\\b(wish|wishes|if only)\\b", ex: ["I wish I could speak English fluently.", "I wish I had more free time.", "I wish I lived near the sea."] },
  musthave: { p: "Taxmin qil: 5 ta gap must have / can't have / might have + 3-shakl.", re: "\\b(must|can't|cannot|might|may|could|couldn't)\\s+have\\b", ex: ["He must have forgotten.", "She can't have seen me.", "They might have missed the bus."] },
  linking: { p: "Bitta mavzu (masalan, telefonlar) haqida 5 ta gap: although, however, despite, because, so.", re: "\\b(although|though|however|despite|in spite of|because|so|but|while|whereas|moreover|therefore)\\b", ex: ["Although it was raining, I went to work.", "Phones are useful. However, they waste time.", "Despite the cold, we played football."] },
  phrasal: { p: "5 ta gap phrasal verb bilan (give up, find out, look for, get up...).", re: "\\b(up|out|off|on|for|after|down|back|over|away|into|around)\\b", ex: ["I never give up.", "I'm looking for a new job.", "I found out the truth."] },
  tags: { p: "5 ta gap, oxirida qisqa savol bilan: ..., isn't it? / ..., don't you?", re: ",\\s*[a-z']+\\s+[a-z]+\\s*\\?\\s*$", ex: ["It's cold today, isn't it?", "You like plov, don't you?", "He can't swim, can he?"] },
  mixed: { p: "5 ta aralash shart gap: If I had ..., I would be ... now.", re: "\\bif\\b", ex: ["If I had learned English earlier, I would be in Korea now.", "If I had slept more, I wouldn't be tired now.", "If I were braver, I would have asked her."] },
  inversion: { p: "5 ta ta'kidli gap: Never have I..., Not only... but also, Rarely do I...", re: "^\\s*(never|rarely|seldom|not only|hardly|no sooner|only|little|under no|not until)\\b", ex: ["Never have I seen such a big city.", "Not only is he smart, but he is also kind.", "Rarely do I eat fast food."] },
  cleft: { p: "5 ta ta'kidli gap: What I need is..., It was ... who..., The thing I like is...", re: "^\\s*(what|it\\s+(is|was)|it's|the (thing|reason|place|person)|all)\\b", ex: ["What I need is a good night's sleep.", "It was my mother who taught me to read.", "The thing I like most is the food."] },
  hedge: { p: "IELTS Speaking uchun 5 ta javob: To be honest, It depends, I'd say, I suppose...", re: "\\b(to be honest|it depends|i'd say|i would say|i suppose|i guess|in my opinion|personally|i think|i believe|generally|actually)\\b", ex: ["To be honest, I prefer tea.", "It depends on the weather.", "I'd say my city is quite busy."] },
};
const GLV = (g) => { const L = LESSONS.find((x) => x.id === g); return L ? L.lv : ""; };
(function () {
  const units = [];
  GWEEKS.forEach((w, k) => {
    w.forEach((g) => { const D = (typeof DEEP !== "undefined" && DEEP[g]) || {}; units.push({ id: "g_" + g, g, st: 1, ic: "📗", t: GT[g] || g, sk: `Grammatika · ${GLV(g)}`, goal: D.goal || "" }); });
    units.push({ id: "gr" + (k + 1), st: 1, grev: true, rev: true, ic: "🔁", t: `${k + 1}-hafta takrori`, sk: "Grammatika", of: w.map((g) => "g_" + g) });
  });
  YOL.forEach((U) => { U.st = U.st || 2; });
  YOL.unshift(...units);
})();
const gLi = (g) => LESSONS.findIndex((l) => l.id === g);
const gL = (g) => LESSONS[gLi(g)] || null;
const GTOPICS = () => YOL.filter((U) => U.g);
// mavzu bo'yicha savollar: oddiy dars mashqlari + chuqur dars mashqlari va sinovi
function gPool(g, only) {
  const L = gL(g), D = (typeof DEEP !== "undefined" && DEEP[g]) || {};
  const src = only === "extra" ? (L ? L.tasks : []) : [].concat(L ? L.tasks : [], D.final || [], D.tasks || []);
  return src.filter((t) => t && t.k && t.k !== "spot");
}
const gUzPool = (q) => [...new Set(q.map((t) => t.uz).filter(Boolean))];
const gTask = (t, U) => Object.assign({}, t, { type: t.k, yu: U.id, lid: U.g });
function gWeak(R) {
  if (!R || !R.of) return null;
  const m = (yState() || {}).miss || {}, sc = (U) => (m[U.id] || 0) + (1 - (((S.lessons || {})[U.g] || {}).sc || 0.8)) * 5;
  return R.of.map(yU).filter(Boolean).sort((a, b) => sc(b) - sc(a))[0] || null;
}

if (typeof USTEP !== "undefined") Object.assign(USTEP, {
  gdars: { t: (a) => { const L = gL(a.g); return `Dars: ${L ? L.title : ""}`; }, d: "Hikoya, qoida, tushunish savollari, mashq va yakuniy sinov. Sinovdan 80% bilan o'tish shart", min: 30, ev: "lesson", ok: (d, st) => !!d.pass && (!st || d.id === st.a.g),
    go: (a) => { const i = gLi(a.g); if (i >= 0) lessonTheory(i); else ustozBack(); } },
  gmashq: { t: "Qo'shimcha mashq: yangi misollar", d: (a) => `${gPool(a.g, "extra").length + 2} ta yangi savol. Xato qilsang, keyinroq qayta so'raladi`, min: 10, ev: "gmashq", go: (a) => gMashq(yU(a.u), () => { addXP(10); bumpStreak(); ustozEvent("gmashq", {}); yBack(); }) },
  gyoz: { t: (a) => (yA(a).grev ? "Hafta yozuvi: 6 ta gap" : "O'zing gap tuz"), d: (a) => (yA(a).grev ? "Bu haftaning mavzularidan foydalanib 6 ta gap" : (GYOZ[a.g] || {}).p || "Bugungi mavzu bilan o'z gaplaringni yoz"), min: 10, ev: "gyoz", go: (a) => gYoz(yU(a.u)) },
  gtak: { t: "Takrorlash: oldingi mavzular", d: "O'tgan kunlardan 8 ta savol, unutib qo'ymaslik uchun", min: 8, ev: "gtak", go: (a) => gTak(yU(a.u)) },
  grevq: { t: "Hafta testi", d: (a) => `Shu haftaning ${(yA(a).of || []).length} ta mavzusidan aralash savollar`, min: 15, ev: "grevq", ok: (d) => d.pass, go: (a) => gRevQ(yU(a.u)) },
  gweak: { t: (a) => { const W = gWeak(yU(a.u)); return W ? `Qayta: ${W.t}` : "Qayta o'rganish"; }, d: "Bu hafta eng qiyin bo'lgan mavzu: qoidani qayta o'qib, yangi mashq qilamiz", min: 12, ev: "gweak",
    go: (a) => { const W = gWeak(yU(a.u)), fin = () => { addXP(10); ustozEvent("gweak", {}); yBack(); }; if (!W || gLi(W.g) < 0) return fin(); deepRule(gLi(W.g), () => gMashq(W, fin)); } },
});

function gMashq(U, done) {
  const L = gL(U.g);
  if (!L) return done();
  const q = shuffle(gPool(U.g, "extra")).map((t) => gTask(t, U));
  shuffle(lessonSay(L)).slice(0, 2).forEach((t) => q.push(Object.assign({}, t, { type: "speak", yu: U.id })));
  runQueue(q, { back: yBack, pool: L.tasks.filter((t) => t.uz).map((t) => t.uz), onMiss: (t) => yMiss(t.yu), onDone: done });
}

// takrorlash: oraliqli (1, 2, 4, 7, 12, 20 mavzu oldin) + eng qiyin mavzu
function gTak(U) {
  const T = GTOPICS(), k = T.findIndex((x) => x.id === U.id), pick = [];
  [1, 2, 4, 7, 12, 20].forEach((d) => { if (k - d >= 0) pick.push(T[k - d]); });
  const m = (yState() || {}).miss || {}, prev = T.slice(0, Math.max(0, k)).sort((a, b) => (m[b.id] || 0) - (m[a.id] || 0))[0];
  if (prev && !pick.includes(prev)) pick.push(prev);
  const q = [];
  for (let r = 0; q.length < 8 && r < 4; r++) pick.forEach((P) => { if (q.length >= 8) return; const t = shuffle(gPool(P.g))[0]; if (t && !q.some((x) => x.s === t.s && x.en === t.en && x.uz === t.uz)) q.push(gTask(t, P)); });
  if (!q.length) { ustozEvent("gtak", {}); return yBack(); }
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>Takrorlash</h2></div>
    <div class="card"><span class="tag pink">${q.length} ta savol</span><h3>Oldingi mavzular esingdami?</h3><span class="muted">Qoida bir marta o'qilsa, tez unutiladi. Shuning uchun har kuni eski mavzulardan bir nechta savol beraman.</span>
      <ul class="cando">${pick.map((P) => `<li>${esc(P.t)}</li>`).join("")}</ul></div>
    <div class="grow"></div>
    <button class="btn main" id="go" type="button">Boshlash</button>`);
  $("quit").onclick = yBack;
  $("go").onclick = () => runQueue(shuffle(q), { back: yBack, pool: gUzPool(q), onMiss: (t) => yMiss(t.yu), onDone: () => { addXP(10); bumpStreak(); ustozEvent("gtak", {}); yBack(); } });
}

// hafta testi: har mavzudan 3 tadan savol, 75% dan o'tish
function gRevQ(R) {
  const q = [];
  R.of.forEach((id) => { const U = yU(id); if (U) shuffle(gPool(U.g)).slice(0, 3).forEach((t) => q.push(gTask(t, U))); });
  const n = q.length, need = Math.ceil(n * 0.75);
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>Hafta testi</h2></div>
    <div class="card"><span class="tag pink">${esc(yName(R))}</span><h3>${n} ta savol: ${R.of.length} ta mavzudan</h3><span class="muted">Shu haftada o'rganganlaring aralash. ${n} tadan kamida ${need} tasi birinchi urinishda to'g'ri bo'lishi kerak.</span>
      <ul class="cando">${R.of.map((id) => `<li>${esc(yU(id).t)}</li>`).join("")}</ul></div>
    <div class="grow"></div>
    <button class="btn main" id="go" type="button">Boshlash</button>`);
  $("quit").onclick = yBack;
  $("go").onclick = () => runQueue(shuffle(q), { back: yBack, pool: gUzPool(q), onMiss: (t) => yMiss(t.yu), onDone: (m, ok, tot) => {
    const pass = ok >= need;
    addXP(pass ? 40 : 10); bumpStreak(); save();
    const W = gWeak(R);
    html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Chiqish">×</button><h2>${pass ? "Hafta testi topshirildi" : "Yana bir urinish kerak"}</h2></div>
      <div class="score">${ok}/${tot}</div>
      <p class="center muted">${pass ? "Zo'r. Bu haftaning mavzulari esingda turibdi." : `O'tish uchun ${tot} tadan ${need} tasi kerak. Xato qilgan savollaringning sababini o'qiding, endi qayta urinib ko'r.`}${W ? ` Eng ko'p qiynagan mavzu: <b>${esc(W.t)}</b>, uni keyingi qadamda qayta ko'ramiz.` : ""}</p>
      <div class="grow"></div>
      <button class="btn main" id="go" type="button">${pass ? "Davom etish" : "Qayta topshirish"}</button>`);
    if (pass) ustozEvent("grevq", { pass: true });
    $("quit").onclick = yBack;
    $("go").onclick = pass ? yBack : () => gRevQ(R);
  } });
}

// o'zing gap tuz: gaplarni sanaydi, har gapda bugungi shakl bormi tekshiradi, keyin o'zini tekshirish ro'yxati
const gSplit = (s) => String(s || "").split(/\n+|(?<=[.!?])\s+/).map((x) => x.trim()).filter((x) => /[a-z]/i.test(x));
const gWords = (s) => s.split(/\s+/).filter((w) => /[a-z]/i.test(w)).length;
function gYoz(U) {
  const y = yState(), rev = !!U.grev, G = rev ? null : GYOZ[U.g] || { p: "Bugungi mavzu bilan 5 ta gap yoz.", re: "", ex: [] };
  const n = rev ? 6 : G.n || 5, minW = rev ? 4 : 3, re = G && G.re ? new RegExp(G.re, "i") : null;
  const topics = rev ? U.of.map(yU).filter(Boolean) : [];
  const ex = rev ? topics.map((T) => (GYOZ[T.g] || { ex: [] }).ex[0]).filter(Boolean) : G.ex;
  y.yoz = y.yoz || {};
  const D = rev ? null : (typeof DEEP !== "undefined" && DEEP[U.g]) || null;
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>${rev ? "Hafta yozuvi" : "O'zing gap tuz"}</h2></div>
    <section class="card"><span class="tag pink">${esc(U.t)}</span><div class="rule">${esc(rev ? `Bu haftaning mavzularidan foydalanib ${n} ta gap yoz. Har mavzudan kamida bittadan bo'lsa yaxshi.` : G.p)}</div>
      ${rev ? `<ul class="cando" id="tp">${topics.map((T) => `<li data-g="${T.g}">${esc(T.t)}</li>`).join("")}</ul>` : ""}</section>
    <details class="card wqd"><summary><b>Namuna</b> <span class="muted">(ko'chirma, o'zingnikini yoz)</span></summary>${ex.map((e, j) => `<button class="ex yex" data-e="${j}" type="button"><span class="en">${esc(e)}</span><i>${SPK}</i></button>`).join("")}</details>
    <textarea id="tx" class="wbox gtx" spellcheck="false" autocapitalize="sentences" placeholder="Har gapni yangi qatordan yoz"></textarea>
    <div id="chk" class="gchk"></div>
    <div class="grow"></div>
    <button class="btn main" id="go" type="button" disabled>Tekshirish</button>`);
  const tx = $("tx");
  tx.value = y.yoz[U.id] || "";
  $("quit").onclick = yBack;
  on("[data-e]", (e) => speak(ex[+e.currentTarget.dataset.e]));
  const judge = () => gSplit(tx.value).map((s) => ({ s, short: gWords(s) < minW, miss: !!re && !re.test(s) }));
  let tSave = null;
  const upd = () => {
    const J = judge(), good = J.filter((x) => !x.short && !x.miss).length;
    $("go").disabled = !J.length;
    $("go").textContent = good >= n && J.every((x) => !x.short && !x.miss) ? "Tayyor, tekshirish" : `${Math.min(good, n)} / ${n} gap tayyor`;
    if (rev) $app.querySelectorAll("#tp li").forEach((li) => { const g = GYOZ[li.dataset.g]; li.classList.toggle("ok", !!(g && g.re && J.some((x) => new RegExp(g.re, "i").test(x.s)))); });
    y.yoz[U.id] = tx.value; clearTimeout(tSave); tSave = setTimeout(save, 700);
  };
  tx.oninput = () => { $("chk").innerHTML = ""; upd(); };
  upd();
  $("go").onclick = () => {
    const J = judge(), good = J.filter((x) => !x.short && !x.miss).length, bad = J.filter((x) => x.short || x.miss);
    if (good >= n && !bad.length) return gYozRes(U, J.map((x) => x.s), D, rev);
    $("chk").innerHTML = `<section class="card"><b>${good >= n ? "Bir-ikki gapni tuzat" : `Yana ${n - good} ta gap kerak`}</b>
      ${J.map((x) => `<div class="gline ${x.short || x.miss ? "no" : "yes"}">${x.short || x.miss ? "✗" : "✓"} ${esc(x.s)}${x.short ? `<small>Gap juda qisqa: kamida ${minW} ta so'z bo'lsin.</small>` : x.miss ? `<small>Bu gapda bugungi mavzu ko'rinmayapti. ${esc(G.p)}</small>` : ""}</div>`).join("")}</section>`;
    $("chk").scrollIntoView({ behavior: "smooth", block: "start" });
  };
}
function gYozRes(U, lines, D, rev) {
  const bads = D ? D.parts.reduce((a, p) => a.concat(p.bad || []), []) : [];
  addXP(15); bumpStreak(); save();
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Chiqish">×</button><h2>Gaplaring tayyor</h2></div>
    <section class="card"><b>Sening gaplaring</b>${lines.map((s, j) => `<div class="gline">${j + 1}. ${esc(s)}</div>`).join("")}</section>
    ${bads.length ? `<section class="card"><b>O'zingni tekshir</b><span class="muted">Bu mavzudagi eng ko'p xatolar. Gaplaringda shulardan biri bormi? Bo'lsa, orqaga qaytib tuzat.</span><div class="badl">${bads.map((b) => `<div class="bad"><div class="no">✗ ${esc(b[0])}</div><div class="yes">✓ ${esc(b[1])}</div></div>`).join("")}</div></section>` : ""}
    <section class="card"><b>Claude'ga yubor: aniq tekshiruv</b><span class="muted">Nusxa ol va loyihadagi suhbatga joylashtir. Xatolaringni tuzatib, sababini tushuntiraman.</span><button class="btn ghost" id="cp" type="button">Nusxa olish</button></section>
    <div class="grow"></div>
    <div class="ynav"><button class="btn ghost" id="ed" type="button">Tuzatish</button><button class="btn main" id="go" type="button">Tayyor</button></div>`);
  $("quit").onclick = yBack;
  $("ed").onclick = () => gYoz(U);
  $("cp").onclick = () => { ieCopy(`Grammatika mashqi: ${U.t}\nVazifa: ${rev ? "hafta mavzularidan 6 ta gap" : (GYOZ[U.g] || {}).p || ""}\nMening gaplarim:\n${lines.map((s, j) => `${j + 1}. ${s}`).join("\n")}\n\nXatolarimni tuzatib, sababini o'zbekcha tushuntir.`); lateToast("Nusxa olindi"); };
  $("go").onclick = () => { ustozEvent("gyoz", {}); yBack(); };
}
// yopilgan grammatika kunini qayta ko'rish (hisobga kirmaydi)
function gView(U) {
  const li = gLi(U.g), back = () => gView(U);
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>${esc(yName(U))}</h2></div>
    <section class="card"><span class="tag pink">${esc(U.sk)} · yopilgan</span><span class="muted">${U.goal || ""}</span></section>
    <div class="list">
      <button class="item" id="v1" type="button"><span class="num">1</span><span class="body"><span class="title">Qoidani qayta o'qish</span><span class="sub">Tushuntirish va xatolar ro'yxati</span></span></button>
      <button class="item" id="v2" type="button"><span class="num">2</span><span class="body"><span class="title">Mashqlarni qayta ishlash</span><span class="sub">${gPool(U.g).length} ta savoldan 12 tasi</span></span></button>
    </div>`);
  $("quit").onclick = yRoad;
  $("v1").onclick = () => (li >= 0 ? deepRule(li, back) : back());
  $("v2").onclick = () => { const q = shuffle(gPool(U.g)).slice(0, 12).map((t) => gTask(t, U)); runQueue(q, { back, pool: gUzPool(gPool(U.g)), onDone: back }); };
}
