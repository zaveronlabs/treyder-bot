"use strict";
// ---------- USTOZ: qat'iy IELTS o'qituvchisi ----------
// Jadval Gojo hayotiga moslangan: ish 9:00–18:00, uyga ~19:15, uyqu 23:00–6:30.
// Har blok aniq qadamlardan iborat, qadamlar tartib bilan bajariladi. Vaqti kelgan blok tugaguncha
// boshqa bo'limlar yopiq. Bajarilmagan asosiy dars ertangi qarzga o'tadi. Telefon vaqtida va qayta-qayta eslatadi.

const UZ_HAFTA = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const UZ_QISQA = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
const UZ_OY = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
const UDEF = { morn: "06:40", main: "20:00", eve: "22:15", wk: "08:30", sleep: "23:00", work: [1, 2, 3, 4, 5] };
const MAIN_OF = { 0: "speaking", 1: "reading", 2: "writing2", 3: "listening", 4: "speaking", 5: "writing1", 6: "mixed" };
const KIND = {
  words: { t: "Ertalabki so'zlar", ic: "📘", d: "Takrorlash va yangi IELTS so'zlari", why: "Yangi so'z ertalab yaxshi kiradi. Ishga chiqishdan oldin 30 daqiqa." },
  listen: { t: "Yo'lda tinglash", ic: "🎧", d: "Yo'lda 60 daqiqa inglizcha podkast yoki video", why: "Quloq har kuni ishlasa, Listening o'zi o'sadi. Yodla o'zi sanaydi." },
  lunch: { t: "Tushlikda 15 daqiqa", ic: "🍽", d: "Qisqa takrorlash (ixtiyoriy)", why: "Imkon bo'lsa. Majburiy emas, lekin ball qo'shadi." },
  reading: { t: "Reading", ic: "📖", d: "IELTS matnlari vaqt bilan, keyin xatolar tahlili", why: "Imtihondagidek: vaqt ketyapti, har xatoning sababini topamiz." },
  writing2: { t: "Writing Task 2", ic: "✍️", d: "40 daqiqada insho va grammatika darsi", why: "Writing eng qiyin qism. Har hafta yozmasang, o'smaydi." },
  listening: { t: "Listening", ic: "🎧", d: "IELTS audio, faqat bir marta eshitiladi", why: "Imtihonda audio qaytarilmaydi. Shunga hozirdan o'rganamiz." },
  speaking: { t: "Speaking", ic: "🎤", d: "Part 1, 2, 3 va AI imtihonchi", why: "Ovoz chiqarib gapirmasang, imtihonda til tutiladi." },
  writing1: { t: "Writing Task 1 va grammatika", ic: "📊", d: "Grafik tasviri 20 daqiqada va grammatika", why: "Task 1 qisqa, lekin ballning uchdan biri." },
  mixed: { t: "Reading va Listening", ic: "🔀", d: "Bittadan matn va audio", why: "Ish kuni bo'lgani uchun qisqaroq aralash dars." },
  mock: { t: "Sinov imtihoni", ic: "🏁", d: "Listening, Reading va Writing imtihondagidek", why: "Har shanba balingni o'lchaymiz. Shunda o'sish ko'rinadi." },
  analysis: { t: "Xatolar tahlili", ic: "🔍", d: "Haftaning xatolarini qayta ishlash", why: "Xatoni tushunmasang, u imtihonda yana qaytadi." },
  speakday: { t: "Speaking kuni", ic: "🎤", d: "To'liq speaking imtihoni va AI imtihonchi", why: "Dam olish kunida ovoz chiqarib uzoqroq gapiramiz." },
  week: { t: "Hafta yakuni", ic: "📈", d: "Haftalik hisobot va takrorlash", why: "Qayerda o'sding, qayerda ortda qolding: rejani shunga qarab to'g'rilaymiz." },
  eve: { t: "Kun yakuni", ic: "🌙", d: "Bugungi so'zlar, qisqa", why: "Uxlashdan oldingi takror xotirada mustahkam qoladi." },
};
const hm = (s) => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ""); return m ? +m[1] * 60 + +m[2] : 0; };
const hhmm = (ms) => { const d = new Date(ms); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const addDays = (t, n) => { const d = new Date(startOfDay(t)); d.setDate(d.getDate() + n); return d.getTime(); };
const uval = (x, a) => (typeof x === "function" ? x(a || {}) : x);
const dur = (ms) => { const m = Math.max(0, Math.round(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)} soat${m % 60 ? ` ${m % 60} daqiqa` : ""}` : `${m} daqiqa`; };
const dateUz = (t) => { const d = new Date(t); return `${UZ_HAFTA[d.getDay()]}, ${d.getDate()}-${UZ_OY[d.getMonth()]}`; };
const hsh = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
const dpick = (a, seed) => a[hsh(seed) % a.length];
let UCTX = null;

function uOn() {
  const u = S.ust;
  if (!u || !u.on) return false;
  if (u.offAt && Date.now() >= u.offAt) { u.on = false; delete u.offAt; save(); uSync(); return false; }
  return true;
}
// jadval sozlamasi: o'zgartirish ertadan kuchga kiradi (dars vaqtini qochirib bo'lmaydi)
function ucfg(t = Date.now()) {
  const u = S.ust;
  if (u.pc && t >= u.pc.from) {
    if (Date.now() >= u.pc.from) { u.c = u.pc.c; delete u.pc; save(); return u.c; }
    return u.pc.c;
  }
  return u.c || UDEF;
}
function uBlocks(t) {
  const c = ucfg(t), d0 = startOfDay(t), dow = new Date(t).getDay(), dk = todayStr(t), out = [];
  const add = (id, kind, s, len, dead, o) => out.push(Object.assign({ id, kind, dk, key: dk + "|" + id, start: d0 + s * 60000, end: d0 + (s + len) * 60000, dead: d0 + dead * 60000, len }, o || {}));
  const sl = hm(c.sleep) || 23 * 60;
  if (c.work.includes(dow)) {
    const m = hm(c.morn), mn = hm(c.main);
    add("ert", "words", m, 30, m + 60, { core: true, light: true });
    add("yol", "listen", m + 60, 0, sl - 15, { passive: true });
    add("tush", "lunch", 13 * 60, 15, 14 * 60, { opt: true });
    add("asosiy", MAIN_OF[dow], mn, 90, sl - 15, { core: true, main: true });
    add("kech", "eve", Math.max(hm(c.eve), mn + 95), 20, sl, { core: true, light: true });
  } else {
    const w = hm(c.wk);
    if (dow === 6) {
      add("mock", "mock", w, 180, Math.min(w + 7 * 60, sl - 30), { core: true, main: true });
      add("tahlil", "analysis", Math.max(15 * 60, w + 240), 60, sl - 15, { core: true, main: true });
    } else {
      add("gapir", "speakday", w, 90, Math.min(w + 6 * 60, sl - 30), { core: true, main: true });
      add("hafta", "week", w + 100, 45, sl - 15, { core: true });
    }
    add("kech", "eve", sl - 35, 20, sl, { core: true, light: true });
  }
  return out;
}
function uDay(dk) { const D = S.ust.days; return D[dk] || (D[dk] = { plan: {}, done: {}, fin: {}, exc: {} }); }

// ---------- kontent tanlash: eng kam ishlatilgani birinchi ----------
function uLeast(list, kind, n, avoid) {
  const used = (S.ust.used[kind] = S.ust.used[kind] || {});
  const ids = list.map((x, i) => [x.id, (used[x.id] || 0) + (avoid && avoid.includes(x.id) ? 99 : 0), i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).slice(0, n).map((x) => x[0]);
  ids.forEach((id) => { used[id] = (used[id] || 0) + 1; });
  return ids;
}
function uNextPack() {
  let i = PACKS.findIndex((p) => p.ielts && !S.packs[p.title]);
  const wr = lvRank(workLv());
  if (i < 0) i = PACKS.findIndex((p) => !p.free && !p.ielts && !S.packs[p.title] && lvRank(p.lv) >= wr);
  if (i < 0) i = PACKS.findIndex((p) => !p.free && !S.packs[p.title]);
  return i;
}
function uNextLesson() {
  const ok = (l) => !l.dialog && deepOf(l) && !ldone(l), wr = lvRank(workLv());
  let li = LORDER.find((i) => ok(LESSONS[i]) && lvRank(LESSONS[i].lv) >= wr);
  if (li === undefined) li = LORDER.find((i) => ok(LESSONS[i]));
  return li === undefined ? -1 : li;
}
const uPackOf = (a) => (a.pi >= 0 && PACKS[a.pi] && !S.packs[PACKS[a.pi].title] ? a.pi : uNextPack());
const uLessonOf = (a) => { const i = LESSONS.findIndex((l) => l.id === a.lid); return i >= 0 && !ldone(LESSONS[i]) ? i : uNextLesson(); };
function uShadowOf(a) {
  if (a.h >= 0 && HIKOYALAR[a.h]) return a.h;
  const lv = workLv(), done = (S.stats && S.stats.sh) || {};
  let k = HIKOYALAR.findIndex((h, j) => h.lv === lv && !done[j]);
  if (k < 0) k = HIKOYALAR.findIndex((h, j) => !done[j]);
  return k < 0 ? Math.floor(Math.random() * HIKOYALAR.length) : k;
}
const uTodayWords = () => Object.entries(S.words).filter(([id, v]) => v.box === 0 && v.due === startOfDay() + INTERVALS[0] * DAY && BY[id]).map(([id]) => id);
const aiReady = () => { try { return aiAvail() && aiState().bor; } catch { return false; } };

// ---------- qadam turlari ----------
const USTEP = {
  rev: { t: "So'zlarni takrorlash", d: () => `${dueWords().length} ta so'zni eslash vaqti keldi`, min: 8, ev: "review", go: () => review(), auto: () => !dueWords().length },
  pack: { t: (a) => { const i = uPackOf(a); return i >= 0 ? `Yangi so'zlar: ${PACKS[i].title}` : "Yangi so'zlar"; }, d: (a) => { const i = uPackOf(a); return i >= 0 ? PACKS[i].words.map((w) => w.en).join(", ") : ""; }, min: 10, ev: "pack", go: (a) => { const i = uPackOf(a); if (i >= 0) learn(i); else ustozBack(); }, auto: () => uNextPack() < 0 },
  lesson: { t: (a) => { const i = uLessonOf(a); return i >= 0 ? `Grammatika: ${LESSONS[i].title}` : "Grammatika"; }, d: "Chuqur dars. Yakuniy sinovdan 80% bilan o'tish shart", min: 25, ev: "lesson", ok: (d) => d.pass, go: (a) => { const i = uLessonOf(a); if (i >= 0) lessonTheory(i); else ustozBack(); }, auto: () => uNextLesson() < 0 },
  lrev: { t: "Darslarni takrorlash", d: () => `${dueRev().length} ta dars qoidasi esdan chiqmasin`, min: 8, ev: "lrev", go: () => reviewLessons(), auto: () => !dueRev().length },
  mist: { t: "Xatolar daftari", d: "Oldingi grammatika xatolaringni qayta ishlash", min: 8, ev: "practice", go: () => mistPractice(), auto: () => !mistList().length },
  speak: { t: "Ovoz chiqarib gapirish", d: "8 ta gap, ilova talaffuzni tekshiradi", min: 8, ev: "practice", go: () => practiceSpeak() },
  shadow: { t: (a) => `Soya: ${HIKOYALAR[uShadowOf(a)].title}`, d: "Andrew'dan keyin darhol takrorla: talaffuz va ravonlik", min: 10, ev: "practice", go: (a) => shadow(uShadowOf(a)) },
  listen: { t: (a) => `${a.m || 60} daqiqa inglizcha tinglash`, d: () => `Bugun: ${listenToday()} / 60 daqiqa. Yodla o'zi sanaydi`, min: 60, passive: true, go: () => uListen(), auto: (a) => listenToday() >= (a.m || 60) },
  today: { t: "Bugungi so'zlar", d: "Bugun o'rgangan va adashgan so'zlaringni mustahkamlash", min: 5, ev: "today", go: () => uTodayQuiz(), auto: () => !uTodayWords().length },
  rd: { t: (a) => `Reading: ${ieTitle("reading", a.id)}`, d: (a) => ieDesc("reading", a.id), min: (a) => ieMin("reading", a.id), ev: "rd", ok: (d, st) => d.id === st.a.id, go: (a) => ieReading(a.id, a) },
  ls: { t: (a) => `Listening: ${ieTitle("listening", a.id)}`, d: (a) => ieDesc("listening", a.id), min: (a) => ieMin("listening", a.id), ev: "ls", ok: (d, st) => d.id === st.a.id, go: (a) => ieListening(a.id, a) },
  w2: { t: "Writing Task 2: insho", d: (a) => ieDesc("w2", a.id), min: 40, ev: "w2", go: (a) => ieWriting("w2", a.id, a) },
  w1: { t: "Writing Task 1: grafik tasviri", d: (a) => ieDesc("w1", a.id), min: 20, ev: "w1", go: (a) => ieWriting("w1", a.id, a) },
  model: { t: "Namunaviy insho: tuzilishni o'rgan", d: "Band 7 insho qanday qurilganini ko'r", min: 10, ev: "model", go: (a) => ieModel(a.id) },
  sp1: { t: "Speaking Part 1", d: (a) => `Mavzu: ${ieTitle("p1", a.id)} · 4 savol`, min: 5, ev: "sp", ok: (d) => d.part === 1, go: (a) => ieSpeaking(1, a) },
  sp2: { t: "Speaking Part 2: kartochka", d: (a) => ieTitle("p2", a.id), min: 5, ev: "sp", ok: (d) => d.part === 2, go: (a) => ieSpeaking(2, a) },
  sp3: { t: "Speaking Part 3: muhokama", d: "3 ta chuqurroq savol", min: 6, ev: "sp", ok: (d) => d.part === 3, go: (a) => ieSpeaking(3, a) },
  ai: { t: "AI imtihonchi bilan suhbat", d: "Kamida 6 marta javob ber, oxirida baho so'ra", min: 12, ev: "ai", ok: (d) => d.turns >= 6, go: () => aiChat(AI_TOPICS.find((x) => x.id === "ielts")) },
  report: { t: "Haftalik hisobot", d: "Natijalar va keyingi hafta rejasi", min: 5, ev: "report", go: () => uReport(true) },
  mockres: { t: "Sinov natijasi", d: "Bugungi taxminiy ballaring", min: 3, ev: "mockres", go: () => uMockResult(true) },
  irev: { t: "IELTS xatolarini qayta ishlash", d: () => `${ieMistList().length} ta savol: qayta javob ber va sababini o'qi`, min: 15, ev: "irev", go: () => ieMistakes(), auto: () => !ieMistList().length },
};

// blok qadamlari: blok boshlanganda tuziladi (kontent shu payt tanlanadi va o'zgarmaydi)
function uPlan(b, isDebt) {
  const out = [], st = (k, a) => out.push({ id: "s" + out.length, k, a: a || {} });
  const due = dueWords().length, rec = uDay(b.dk);
  const pk = () => st("pack", { pi: uNextPack() });
  const ls = () => { const i = uNextLesson(); if (i >= 0) st("lesson", { lid: LESSONS[i].id }); else if (dueRev().length) st("lrev"); };
  const sp = () => {
    const p1 = uLeast(IELTS.p1, "p1", 1)[0], p2 = uLeast(IELTS.p2, "p2", 1)[0];
    st("sp1", { id: p1 }); st("sp2", { id: p2 }); st("sp3", { id: p2 }); st(aiReady() ? "ai" : "speak");
  };
  switch (b.kind) {
    case "words": if (due) st("rev"); pk(); break;
    case "listen": st("listen", { m: 60 }); break;
    case "lunch": if (dueRev().length) st("lrev"); else if (due) st("rev"); else if (mistList().length) st("mist"); else st("speak"); break;
    case "reading": uLeast(IELTS.reading, "rd", 2).forEach((id) => st("rd", { id })); pk(); break;
    case "writing2": { if ((S.ust.hist.wr || []).filter((w) => w.k === "w2").length < 3) st("model", { id: uLeast(IELTS.models.filter((m) => m.k === "w2"), "model", 1)[0] }); st("w2", { id: uLeast(IELTS.w2, "w2", 1)[0] }); ls(); break; }
    case "listening": uLeast(IELTS.listening, "ls", 2).forEach((id) => st("ls", { id })); st("shadow", { h: uShadowOf({}) }); break;
    case "speaking": case "speakday": sp(); break;
    case "writing1": { const w1m = IELTS.models.filter((m) => m.k === "w1"); if (w1m.length && (S.ust.hist.wr || []).filter((w) => w.k === "w1").length < 2) st("model", { id: uLeast(w1m, "model", 1)[0] }); st("w1", { id: uLeast(IELTS.w1, "w1", 1)[0] }); ls(); if (dueRev().length) st("lrev"); break; }
    case "mixed": st("rd", { id: uLeast(IELTS.reading, "rd", 1)[0] }); st("ls", { id: uLeast(IELTS.listening, "ls", 1)[0] }); break;
    case "mock": uLeast(IELTS.listening, "ls", 2).forEach((id) => st("ls", { id, mock: true })); uLeast(IELTS.reading, "rd", 2).forEach((id) => st("rd", { id, mock: true })); st("w2", { id: uLeast(IELTS.w2, "w2", 1)[0], mock: true }); st("mockres"); break;
    case "analysis": if (ieMistList().length) st("irev"); if (mistList().length) st("mist"); if (due) st("rev"); if (!out.length) st("speak"); break;
    case "week": st("report"); if (due) st("rev"); if (dueRev().length) st("lrev"); break;
    case "eve": if (!isDebt && uBlocks(b.start).some((x) => x.id === "ert" && x.start >= S.ust.start) && !rec.fin.ert && !rec.exc.ert) pk(); if (due) st("rev"); if (uTodayWords().length) st("today"); break;
  }
  return out;
}
function uEnsure(b, force) {
  const rec = uDay(b.dk);
  if (!rec.plan[b.id] && (force || Date.now() >= b.start - 30 * 60000)) { rec.plan[b.id] = uPlan(b); save(); }
  return rec.plan[b.id] || null;
}
// holat: qadamlar va bloklarning bajarilgani
function uDoneMap(ctx) { if (ctx.debt) return ctx.debt.done; const rec = uDay(ctx.b.dk); return (rec.done[ctx.b.id] = rec.done[ctx.b.id] || {}); }
function uSteps(ctx) { return ctx.debt ? ctx.debt.steps : uEnsure(ctx.b, true) || []; }
function uAutoMark(ctx) {
  const steps = uSteps(ctx), done = uDoneMap(ctx);
  let ch = false;
  for (const st of steps) { const K = USTEP[st.k]; if (!done[st.id] && K && K.auto && K.auto(st.a)) { done[st.id] = Date.now(); ch = true; } }
  if (ch) save();
  if (steps.every((st) => done[st.id])) uFinish(ctx);
}
function uFinish(ctx) {
  const now = Date.now();
  if (ctx.debt) {
    const i = S.ust.debt.indexOf(ctx.debt);
    if (i < 0) return;
    S.ust.debt.splice(i, 1);
    const rec = uDay(ctx.debt.dk); rec.late = rec.late || {}; rec.late[ctx.debt.bid] = now;
    save(); uSync(); lateToast("Qarz yopildi ✓");
    return;
  }
  const rec = uDay(ctx.b.dk);
  if (rec.fin[ctx.b.id]) return;
  rec.fin[ctx.b.id] = now; save();
  try { if (NATIVE && NATIVE.ustozTugadi) NATIVE.ustozTugadi(ctx.b.key); } catch {}
  uSync();
  if (!ctx.b.passive) { addXP(ctx.b.main ? 50 : 20); lateToast(`${KIND[ctx.b.kind].ic} ${esc(KIND[ctx.b.kind].t)} bajarildi! <small>+${ctx.b.main ? 50 : 20} XP</small>`); }
}
function uFindCtx(c) {
  if (!c) return null;
  if (c.debt) { const d = S.ust.debt.find((x) => x.id === c.debt); return d ? { debt: d } : null; }
  const b = uBlocks(c.t).find((x) => x.id === c.bid);
  return b ? { b } : null;
}
// ilovaning boshqa joylaridan keladigan voqealar (paket tugadi, dars o'tildi, test topshirildi...)
function ustozEvent(type, d) {
  if (!uOn()) return;
  const c = UCTX;
  if (!c) return;
  const ctx = uFindCtx(c);
  if (!ctx) return;
  const st = uSteps(ctx).find((x) => x.id === c.sid), K = st && USTEP[st.k];
  if (!K || K.ev !== type || (K.ok && !K.ok(d || {}, st))) return;
  const done = uDoneMap(ctx);
  if (done[st.id]) return;
  done[st.id] = Date.now(); c.fresh = true; save();
  uAutoMark(ctx);
}

// ---------- o'tgan kunlar: bajarilmagan asosiy dars qarzga o'tadi ----------
function uProcess() {
  if (!uOn()) return;
  const u = S.ust, today0 = startOfDay();
  if (u.procAt === today0) return;
  let t = u.procAt || startOfDay(u.start);
  for (let guard = 0; t < today0 && guard < 60; guard++) {
    const mid = t + 12 * 3600000, rec = uDay(todayStr(mid));
    for (const b of uBlocks(mid)) {
      if (!b.core || rec.fin[b.id] || rec.exc[b.id] || b.start < u.start) continue;
      rec.miss = rec.miss || [];
      if (!rec.miss.includes(b.id)) rec.miss.push(b.id);
      if (b.main) uAddDebt(b, rec);
    }
    t = addDays(t, 1);
  }
  u.procAt = today0;
  for (const k of Object.keys(u.days)) { const [y, m, d] = k.split("-").map(Number); if (new Date(y, m - 1, d).getTime() < addDays(today0, -70)) delete u.days[k]; }
  if (u.imist && u.imist.length > 200) u.imist = u.imist.slice(-200);
  save();
}
function uAddDebt(b, rec) {
  const u = S.ust, id = b.key;
  if (u.debt.some((x) => x.id === id)) return;
  const steps = rec.plan[b.id] || uPlan(b, true);
  u.debt.push({ id, dk: b.dk, bid: b.id, kind: b.kind, steps, done: Object.assign({}, rec.done[b.id] || {}), at: Date.now() });
  while (u.debt.length > 2) { u.debt.shift(); u.lost = (u.lost || 0) + 1; }
}
// intizom: o'z vaqtida bajarilgan asosiy bloklar ulushi (kech yopilgan qarz yarim ball)
function uDisc(days) {
  const u = S.ust; let tot = 0, got = 0;
  for (let k = days - 1; k >= 0; k--) {
    const mid = addDays(Date.now(), -k) + 12 * 3600000, dk = todayStr(mid), rec = u.days[dk] || { fin: {}, exc: {} };
    for (const b of uBlocks(mid)) {
      if (!b.core || (b.start < u.start && !rec.fin[b.id]) || rec.exc[b.id]) continue;
      if (k === 0 && Date.now() < b.dead && !rec.fin[b.id]) continue;
      tot++;
      if (rec.fin[b.id]) got++; else if (rec.late && rec.late[b.id]) got += 0.5;
    }
  }
  return tot ? Math.round((got / tot) * 100) : null;
}
function uFullDays() {
  const u = S.ust; let n = 0;
  for (let k = 1; k < 120; k++) {
    const mid = addDays(Date.now(), -k) + 12 * 3600000;
    if (mid < startOfDay(u.start)) break;
    const rec = u.days[todayStr(mid)] || { fin: {}, exc: {} };
    if (uBlocks(mid).filter((b) => b.core && (b.start >= u.start || rec.fin[b.id])).every((b) => rec.fin[b.id] || rec.exc[b.id])) n++; else break;
  }
  const rec = u.days[todayStr()] || { fin: {}, exc: {} };
  const tb = uBlocks(Date.now()).filter((b) => b.core && (b.start >= u.start || rec.fin[b.id]));
  if (tb.length && tb.every((b) => rec.fin[b.id] || rec.exc[b.id])) n++;
  return n;
}
const isoWeek = (t = Date.now()) => { const d = new Date(startOfDay(t)); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day + 3); const w1 = new Date(d.getFullYear(), 0, 4); return d.getFullYear() + "-W" + (1 + Math.round(((d - w1) / DAY - 3 + ((w1.getDay() + 6) % 7)) / 7)); };

// ---------- qulf: dars vaqtida boshqa bo'limlar yopiq ----------
function uActive(now = Date.now()) {
  const rec = uDay(todayStr(now));
  return uBlocks(now).find((b) => b.core && now >= b.start && now < b.dead && !rec.fin[b.id] && !rec.exc[b.id]) || null;
}
function uStudyTime(now = Date.now()) {
  const c = ucfg(now), m = (now - startOfDay(now)) / 60000, dow = new Date(now).getDay(), sl = hm(c.sleep);
  if (c.work.includes(dow)) return (m >= hm(c.morn) && m < hm(c.morn) + 60) || (m >= hm(c.main) - 45 && m < sl);
  return m >= hm(c.wk) && m < sl;
}
function uGate(now = Date.now()) {
  if (!uOn()) return null;
  const a = uActive(now);
  if (a) { const plan = uEnsure(a, true); const ctx = { b: a }; uAutoMark(ctx); if (!uDay(a.dk).fin[a.id]) return { b: a, plan }; }
  if (S.ust.debt.length && uStudyTime(now)) return { debt: S.ust.debt[0] };
  return null;
}
function ustozLock(t) {
  if (t === "ustoz" || !uOn()) return false;
  const g = uGate();
  if (!g) return false;
  document.querySelectorAll(".sheet").forEach((e) => e.remove());
  const what = g.b ? `${KIND[g.b.kind].ic} <b>${esc(KIND[g.b.kind].t)}</b> (${hhmm(g.b.start)})` : `qarz: <b>${esc(KIND[g.debt.kind].t)}</b> (${esc(dateUz(dkMs(g.debt.dk)))})`;
  const el = document.createElement("div");
  el.className = "sheet ulock";
  el.innerHTML = `<div class="in"><h3>🔒 Hozir dars vaqti</h3><p>Avval ${what}. Tugatsang, boshqa bo'limlar o'zi ochiladi.</p><button class="btn main" id="ulgo" type="button">Darsga o'tish</button><button class="btn ghost" id="ulx" type="button">Yopish</button></div>`;
  document.body.appendChild(el);
  el.querySelector("#ulgo").onclick = () => { el.remove(); g.b ? uBlockView({ t: g.b.start, bid: g.b.id }) : uBlockView({ debt: g.debt.id }); };
  el.querySelector("#ulx").onclick = () => el.remove();
  return true;
}
const dkMs = (dk) => { const [y, m, d] = dk.split("-").map(Number); return new Date(y, m - 1, d, 12).getTime(); };

// ---------- telefon eslatmalari: keyingi 14 kun ----------
const NAGS = ["Hali boshlamading. Ustoz kutyapti.", "Vaqt ketyapti. Bugun qilmasang, ertaga qarz bo'lib qaytadi.", "Hoziroq boshla. Har kungi 90 daqiqa seni Koreyaga yaqinlashtiradi.", "Oxirgi eslatma. Bugungi darsni yopmasdan uxlama."];
function uStartMsg(b) {
  const K = KIND[b.kind];
  if (b.kind === "words") return "30 daqiqa: takrorlash va yangi so'zlar. Keyin yo'lga.";
  if (b.kind === "listen") return "Quloqchinni tak: yo'lda inglizcha podkast yoki video. Yodla o'zi sanaydi.";
  if (b.kind === "lunch") return "Imkoning bo'lsa, 15 daqiqa takrorla.";
  if (b.kind === "eve") return "Bugungi so'zlarni takrorla, keyin uxlashga tayyorlan.";
  return `${K.d}. Telefonni ol, hozir boshlaymiz.`;
}
function uEvents() {
  const ev = [], now = Date.now();
  for (let k = 0; k < 14; k++) {
    const mid = addDays(now, k) + 12 * 3600000, dk = todayStr(mid), rec = S.ust.days[dk] || { fin: {}, exc: {} };
    const c = ucfg(mid);
    for (const b of uBlocks(mid)) {
      if (rec.fin[b.id] || rec.exc[b.id] || b.dead < now) continue;
      const K = KIND[b.kind], title = `${K.ic} ${hhmm(b.start)} · ${K.t}`;
      ev.push({ at: b.start, k: b.key, t: title, m: uStartMsg(b), o: b.main ? 1 : 0 });
      if (b.opt || b.passive) continue;
      (b.main ? [10, 25, 45, 70] : [15, 35]).forEach((n, j) => {
        const at = b.start + n * 60000;
        if (at < b.dead - 5 * 60000) ev.push({ at, k: b.key, t: `${K.ic} ${K.t} kutyapti`, m: NAGS[b.main ? j : j + 1], o: b.main ? 1 : 0 });
      });
    }
    ev.push({ at: startOfDay(mid) + (hm(c.sleep) - 15) * 60000, k: "", t: "🌙 15 daqiqadan keyin uxlash", m: "Telefonni qo'y. Yaxshi uyqu = ertaga yaxshi xotira." });
  }
  if (S.ust.debt.length) {
    const c = ucfg(), d = S.ust.debt[0], dow = new Date().getDay();
    const at = startOfDay() + (c.work.includes(dow) ? hm(c.main) - 40 : hm(c.wk) + 5) * 60000;
    if (at > now) ev.push({ at, k: "qarz", t: `⚠️ Qarzing bor: ${KIND[d.kind].t}`, m: "Bugun qarzni yop. Ikki kundan oshgan qarz kuyadi va intizomga ta'sir qiladi." });
  }
  return ev.filter((e) => e.at > now - 60000).sort((a, b) => a.at - b.at).slice(0, 400);
}
function uDoneKeys() {
  const out = [];
  for (let k = 0; k < 14; k++) {
    const mid = addDays(Date.now(), k) + 12 * 3600000, rec = S.ust.days[todayStr(mid)];
    if (rec) uBlocks(mid).forEach((b) => { if (rec.fin[b.id] || rec.exc[b.id]) out.push(b.key); });
  }
  return out;
}
let uSyncT = 0;
function uSync() {
  if (!NATIVE || !NATIVE.ustozJadval) return;
  clearTimeout(uSyncT);
  uSyncT = setTimeout(() => {
    try {
      const on = !!(S.ust && S.ust.on);
      const busy = on && S.ust.busy && S.ust.busy.until > Date.now() ? S.ust.busy : null;
      const mn = on ? hm(ucfg().main) : 20 * 60;
      // fb: jadval tugab qolsa (ilova uzoq ochilmasa) telefon har kuni shu vaqtda eslatadi
      NATIVE.ustozJadval(JSON.stringify({ on, ev: on ? uEvents() : [], done: on ? uDoneKeys() : [], busy, fb: { h: Math.floor(mn / 60), m: mn % 60 } }));
    } catch (e) { console.error(e); }
  }, 250);
}

// ---------- qadamni boshlash va qaytish ----------
function uGo(c, st) {
  UCTX = Object.assign({}, c, { sid: st.id });
  const key = c.debt ? "qarz" : uBlocks(c.t).find((x) => x.id === c.bid).key;
  S.ust.busy = { k: key, until: Date.now() + Math.max(30, uval(USTEP[st.k].min, st.a) + 20) * 60000 }; save(); uSync();
  try { USTEP[st.k].go(st.a); } catch (e) { console.error(e); UCTX = null; ustozHome(); }
}
function ustozBack() {
  const c = UCTX;
  UCTX = null;
  if (S.ust && S.ust.busy) { S.ust.busy = null; save(); uSync(); }
  if (c) {
    const ctx = uFindCtx(c);
    if (ctx) { uAutoMark(ctx); if (ctx.debt ? S.ust.debt.includes(ctx.debt) : !uDay(ctx.b.dk).fin[ctx.b.id]) return uBlockView(c, c.fresh); }
  }
  ustozHome();
}
window.yodlaUstoz = () => { if (uOn() && !UCTX) ustozHome(); };

// ---------- ekranlar ----------
function uStatus(b, rec, now) {
  if (rec.fin[b.id]) return "done";
  if (rec.exc[b.id]) return "exc";
  if (b.passive) return listenToday() >= 60 ? "done" : now >= b.dead ? "miss" : now >= b.start ? "now" : "wait";
  if (now >= b.dead) return b.opt ? "skip" : rec.late && rec.late[b.id] ? "late" : "miss";
  if (now >= b.start) return "now";
  return "wait";
}
const ST_TXT = { done: "✓ bajarildi", exc: "uzrli", now: "hozir", wait: "kutyapti", miss: "✗ o'tkazildi", skip: "o'tkazildi", late: "kech yopildi" };
function uMsg(g, disc) {
  const seed = todayStr() + (g ? (g.b ? g.b.id : "q") : "");
  if (g && g.b) return dpick([`${KIND[g.b.kind].t} vaqti. Bahona yo'q: boshlaymiz.`, "Hozir telefon faqat dars uchun. Qolgani keyin.", "Bugungi dars bugun bajariladi. Boshla.", "Charchagansan, bilaman. Lekin shu 90 daqiqa seni Koreyaga olib boradi."], seed);
  if (g && g.debt) return "Qarzing bor. Avval qarzni yopamiz, keyin dam.";
  if (disc !== null && disc < 50) return `Intizom ${disc}%. Bu tezlikda maqsadga yetmaymiz. Ertadan boshlab har kun to'liq.`;
  if (disc !== null && disc < 80) return `Intizom ${disc}%. Yomon emas, lekin 6.5 uchun kamida 85% kerak.`;
  if (disc !== null && disc >= 95) return dpick(["Zo'r ketyapsan. Shu tezlikni ushla.", "Intizoming a'lo. Imtihonga shunday tayyorlanadi.", "Rejadan chiqmayapsan. Mana shu seni boshqalardan ajratadi."], seed);
  return dpick(["Har kuni ozgina, lekin har kuni.", "Reja aniq: faqat bajarish qoldi.", "Bugun qilgan ishing ertangi ballingga qo'shiladi."], seed);
}
function uSkillsHtml() {
  const bd = ieBands(), tgt = S.ust.target || 6.5;
  const cell = (k, n) => { const v = bd[k]; return `<div class="ubs"><span>${n}</span><b>${v ? v.toFixed(1) : "—"}</b><i class="meter sm"><i style="width:${v ? Math.min(100, (v / 9) * 100) : 0}%"></i></i></div>`; };
  return `<div class="ubands">${cell("r", "Reading")}${cell("l", "Listening")}${cell("w", "Writing")}${cell("s", "Speaking")}</div>
    <div class="qrow"><span>Umumiy taxmin: <b>${bd.all ? bd.all.toFixed(1) : "—"}</b> · maqsad <b>${tgt.toFixed(1)}</b></span><small>${uExamLeft()}</small></div>`;
}
function uExamLeft() {
  const [y, m] = String(S.ust.exam || "2027-06").split("-").map(Number), t = new Date(y, m - 1, 15).getTime();
  const d = Math.round((t - startOfDay()) / DAY);
  return d > 0 ? `IELTS'gacha ${d} kun` : "imtihon vaqti";
}
function ustozHome() {
  if (!S.ust) return ustozIntro();
  if (!uOn()) return ustozIntro(false);
  uProcess();
  UCTX = null;
  const now = Date.now(), g = uGate(now), disc = uDisc(7), rec = uDay(todayStr(now)), blocks = uBlocks(now);
  blocks.forEach((b) => { if (b.passive && listenToday() >= 60 && !rec.fin[b.id]) uFinish({ b }); });
  const next = blocks.find((b) => !b.opt && !b.passive && now < b.start && !rec.fin[b.id] && !rec.exc[b.id]);
  const tm = new Date(addDays(now, 1) + 12 * 3600000), tb = uBlocks(tm.getTime()).find((b) => b.core);
  let big;
  if (g && g.b) {
    const steps = g.plan || [], done = rec.done[g.b.id] || {}, n = steps.filter((s) => done[s.id]).length;
    big = `<div class="ubig now"><span class="tag pink">Hozir · ${hhmm(g.b.start)}–${hhmm(g.b.end)}</span><h2>${KIND[g.b.kind].ic} ${esc(KIND[g.b.kind].t)}</h2>
      <p>${n}/${steps.length} qadam · tugatish muddati ${hhmm(g.b.dead)}</p><div class="meter"><i style="width:${steps.length ? (n / steps.length) * 100 : 0}%"></i></div>
      <button class="btn main" id="ugo" type="button">${n ? "Davom etish" : "Boshlash"}</button></div>`;
  } else if (g && g.debt) {
    const d = g.debt, n = d.steps.filter((s) => d.done[s.id]).length;
    big = `<div class="ubig debt"><span class="tag pink">Qarz · ${esc(dateUz(dkMs(d.dk)))}</span><h2>${KIND[d.kind].ic} ${esc(KIND[d.kind].t)}</h2>
      <p>${n}/${d.steps.length} qadam. Qarz yopilmaguncha boshqa bo'limlar yopiq.</p><button class="btn main" id="ugo" type="button">Qarzni yopish</button></div>`;
  } else if (next) {
    big = `<div class="ubig"><span class="tag pink">Keyingi · ${hhmm(next.start)}</span><h2>${KIND[next.kind].ic} ${esc(KIND[next.kind].t)}</h2>
      <p data-cd="${next.start}">${dur(next.start - now)}dan keyin boshlanadi</p><span class="muted">Hozir erkin vaqt: istagan bo'limda mashq qilsang bo'ladi.</span></div>`;
  } else {
    big = `<div class="ubig ok"><span class="tag pink">Bugun</span><h2>Bugungi reja bajarildi</h2><p>${tb ? `Ertaga ${hhmm(tb.start)}: ${esc(KIND[tb.kind].t)}.` : ""} Vaqtida uxla.</p></div>`;
  }
  const tl = blocks.map((b) => {
    const s = uStatus(b, rec, now), K = KIND[b.kind];
    const steps = rec.plan[b.id], dn = rec.done[b.id] || {};
    const prog = b.passive ? `${Math.min(60, listenToday())}/60 daq` : steps ? `${steps.filter((x) => dn[x.id]).length}/${steps.length}` : `${b.len} daq`;
    return `<button class="tli ${s}" data-b="${b.id}" type="button"><span class="tt">${hhmm(b.start)}</span><span class="tic">${K.ic}</span><span class="tb"><b>${esc(K.t)}${b.opt ? " <small>ixtiyoriy</small>" : ""}</b><small>${esc(K.d)}</small></span><span class="ts"><em>${ST_TXT[s]}</em><small>${prog}</small></span></button>`;
  }).join("");
  const debts = S.ust.debt.map((d) => `<button class="tli miss" data-q="${esc(d.id)}" type="button"><span class="tt">qarz</span><span class="tic">${KIND[d.kind].ic}</span><span class="tb"><b>${esc(KIND[d.kind].t)}</b><small>${esc(dateUz(dkMs(d.dk)))}dan qolgan</small></span><span class="ts"><em>${d.steps.filter((s) => d.done[s.id]).length}/${d.steps.length}</em></span></button>`).join("");
  const days = [...Array(7)].map((_, k) => {
    const mid = addDays(now, k - 6) + 12 * 3600000, r = S.ust.days[todayStr(mid)] || { fin: {}, exc: {} };
    const bl = uBlocks(mid).filter((b) => b.core && (b.start >= S.ust.start || r.fin[b.id]));
    const pend = k === 6 && bl.some((b) => now < b.dead && !r.fin[b.id]);
    const cls = !bl.length ? "na" : bl.every((b) => r.fin[b.id] || r.exc[b.id]) ? "ok" : pend ? "cur" : bl.some((b) => r.fin[b.id]) ? "half" : "no";
    return `<span class="wd ${cls}"><i></i>${UZ_QISQA[new Date(mid).getDay()]}</span>`;
  }).join("");
  html(`${topBar()}
    <section class="panel hero uhero">
      <div class="uh"><div><h2>Ustoz</h2><p>${esc(dateUz(now))}</p></div><div class="udisc"><b>${disc === null ? "—" : disc + "%"}</b><small>intizom</small></div></div>
      ${big}
      <p class="usay">“${esc(uMsg(g, disc))}”</p>
    </section>
    ${uPhoneCard()}
    <div class="sec">Bugungi jadval</div>
    <div class="tline">${tl}</div>
    ${debts ? `<div class="sec">Qarzlar</div><div class="tline">${debts}</div>` : ""}
    <section class="card"><div class="mhead"><b>IELTS ballaring</b><button class="yg" id="uprog" type="button">Batafsil</button></div>${uSkillsHtml()}</section>
    <section class="card"><div class="mhead"><b>Oxirgi 7 kun</b><span class="muted">to'liq kunlar ketma-ket: ${uFullDays()}</span></div><div class="week">${days}</div></section>
    <div class="row2"><button class="btn ghost" id="uhub" type="button">IELTS zali</button><button class="btn ghost" id="uset" type="button">Jadval va qoidalar</button></div>
  `, "ustoz");
  bindTop();
  if ($("ugo")) $("ugo").onclick = () => (g.b ? uBlockView({ t: g.b.start, bid: g.b.id }) : uBlockView({ debt: g.debt.id }));
  on("[data-b]", (e) => uBlockView({ t: now, bid: e.currentTarget.dataset.b }));
  on("[data-q]", (e) => uBlockView({ debt: e.currentTarget.dataset.q }));
  $("uprog").onclick = () => uProgress();
  $("uset").onclick = () => ustozSettings();
  $("uhub").onclick = () => { if (uGate()) return ustozLock("hub"); IEFROM = "ustoz"; ieHub(); };
  uBindPhone();
  uSync();
}
function uRefresh() {
  document.querySelectorAll("[data-cd]").forEach((el) => { const t = +el.dataset.cd; el.textContent = `${dur(t - Date.now())}dan keyin boshlanadi`; });
}

// blok sahifasi: qadamlar tartib bilan
function uBlockView(c, fresh) {
  const ctx = uFindCtx(c);
  if (!ctx) return ustozHome();
  const now = Date.now();
  let steps, done, K, head, sub, canGo = true, isToday = false, b = ctx.b;
  if (ctx.debt) {
    steps = ctx.debt.steps; done = ctx.debt.done; K = KIND[ctx.debt.kind];
    head = `Qarz: ${K.t}`; sub = `${dateUz(dkMs(ctx.debt.dk))}dan qolgan. Yopilmaguncha boshqa bo'limlar yopiq.`;
  } else {
    K = KIND[b.kind]; isToday = b.dk === todayStr(now);
    if (now < b.start - 30 * 60000 && !uDay(b.dk).plan[b.id]) {
      html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>${K.ic} ${esc(K.t)}</h2></div>
        <div class="card"><span class="tag pink">${hhmm(b.start)} da boshlanadi</span><b>${esc(K.d)}</b><span class="muted">${esc(K.why)}</span><span class="muted">Qadamlar dars boshlanishiga 30 daqiqa qolganda tuziladi: o'sha paytgi takrorlash va xatolaringga qarab.</span></div>`);
      $("quit").onclick = ustozHome;
      return;
    }
    steps = uEnsure(b, true); done = uDoneMap(ctx);
    head = `${K.t}`; sub = `${hhmm(b.start)}–${hhmm(b.end)} · muddat ${hhmm(b.dead)}`;
    const s = uStatus(b, uDay(b.dk), now);
    if (s === "miss" || s === "skip") canGo = !!b.opt;
  }
  uAutoMark(ctx);
  const fin = ctx.debt ? !S.ust.debt.includes(ctx.debt) : !!uDay(b.dk).fin[b.id];
  const cur = steps.findIndex((s) => !done[s.id]);
  const wk = isoWeek(), excUsed = (S.ust.exc && S.ust.exc[wk]) || 0;
  const canExc = !ctx.debt && b && b.core && isToday && !fin && now < b.dead && !excUsed;
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>${K.ic} ${esc(head)}</h2></div>
    <div class="card"><span class="tag pink">${esc(sub)}</span><span class="muted">${esc(K.why)}</span>${fresh ? `<span class="ugood">✓ Qadam bajarildi. Keyingisiga o'tamiz.</span>` : ""}</div>
    ${fin ? `<div class="card ubig ok"><h2>✓ Bajarildi</h2><p>Barakalla. ${ctx.debt ? "Qarz yopildi." : "Bu blok yopildi."}</p></div>` : ""}
    <div class="steps">${steps.map((s, i) => {
      const St = USTEP[s.k], ok = !!done[s.id], lock = !ok && i > cur && cur >= 0;
      return `<button class="ustep ${ok ? "ok" : i === cur ? "cur" : lock ? "lock" : ""}" data-s="${i}" type="button" ${lock || ok ? 'aria-disabled="true"' : ""}>
        <span class="un">${ok ? CHECK : lock ? LOCK : i + 1}</span><span class="ub"><b>${esc(uval(St.t, s.a))}</b><small>${esc(uval(St.d, s.a) || "")}</small></span><span class="um">${uval(St.min, s.a)} daq</span></button>`;
    }).join("")}</div>
    <div class="grow"></div>
    ${!fin && cur >= 0 && canGo ? `<button class="btn main" id="sgo" type="button">${cur ? "Keyingi qadam" : "Boshlash"}: ${esc(uval(USTEP[steps[cur].k].t, steps[cur].a))}</button>` : ""}
    ${!canGo && !fin ? `<p class="center muted">Bu blok vaqti o'tib ketgan. ${b && b.main ? "U ertaga qarz bo'lib qaytadi." : ""}</p>` : ""}
    ${canExc ? `<button class="btn ghost" id="exc" type="button">Uzrli sabab (haftasiga 1 marta)</button>` : !ctx.debt && b && b.core && isToday && !fin && excUsed ? `<p class="center muted small">Bu haftalik uzr ishlatilgan.</p>` : ""}
  `);
  $("quit").onclick = ustozHome;
  const go = (i) => { const s = steps[i]; if (!s || done[s.id]) return; uGo(c, s); };
  if ($("sgo")) $("sgo").onclick = () => go(cur);
  on("[data-s]", (e) => { const i = +e.currentTarget.dataset.s; if (i === cur && canGo && !fin) go(i); });
  if ($("exc")) $("exc").onclick = () => uExcuse(b, c);
}
function uExcuse(b, c) {
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>Uzrli sabab</h2></div>
    <div class="card"><b>Bugun ${esc(KIND[b.kind].t)} qila olmaysanmi?</b><span class="muted">Haftasiga faqat bitta uzr bor. Uzr qarz bo'lmaydi, lekin ishlatsang, bu hafta boshqa uzr yo'q. Rost sabab bo'lsagina tanla.</span></div>
    <div class="opts">${["Kasalman", "Ishda kech qoldim", "Oilaviy ish", "Boshqa jiddiy sabab"].map((r) => `<button class="opt" data-r="${esc(r)}" type="button">${esc(r)}</button>`).join("")}</div>
    <div class="grow"></div>
    <button class="btn main" id="back" type="button">Yo'q, darsni qilaman</button>`);
  $("quit").onclick = () => uBlockView(c);
  $("back").onclick = () => uBlockView(c);
  on("[data-r]", (e) => {
    const rec = uDay(b.dk);
    rec.exc[b.id] = e.currentTarget.dataset.r;
    S.ust.exc = S.ust.exc || {}; S.ust.exc[isoWeek()] = 1; save();
    try { if (NATIVE && NATIVE.ustozTugadi) NATIVE.ustozTugadi(b.key); } catch {}
    uSync(); ustozHome();
  });
}

// yo'lda tinglash: Yodla o'zi sanaydi
function uListen() {
  const links = [["BBC 6 Minute English", "BBC Learning English 6 Minute English"], ["IELTS Listening testlari", "IELTS listening practice test with answers"], ["TED-Ed qisqa darslar", "TED-Ed"], ["Podkast: All Ears English", "All Ears English podcast IELTS"]];
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>Yo'lda tinglash</h2></div>
    <div class="card"><b>Bugungi maqsad: 60 daqiqa</b><span class="muted">Ishga ketayotganda va qaytayotganda tingla. Avto-sanash yoqilgan bo'lsa, YouTube va Spotify'dagi inglizcha narsa o'zi yoziladi.</span></div>
    ${listenCard()}
    <div class="sec">Nima tinglash kerak</div>
    <div class="list">${links.map(([n, q], i) => `<button class="item" data-yt="${i}" type="button"><span class="num">${M_LISTEN}</span><span class="body"><span class="title">${esc(n)}</span><span class="sub">YouTube'da ochiladi</span></span></button>`).join("")}</div>
  `);
  bindListen();
  $("quit").onclick = ustozBack;
  on("[data-yt]", (e) => { const u = ytSearch(links[+e.currentTarget.dataset.yt][1]); quloqSync(false); try { NATIVE && NATIVE.och ? NATIVE.och(u) : window.open(u, "_blank"); } catch {} });
}
// bugungi so'zlar: kechqurun qisqa mustahkamlash
function uTodayQuiz() {
  const ids = shuffle(uTodayWords()).slice(0, 12);
  if (!ids.length) return ustozBack();
  const types = ["choose", "chooseUz", "build"];
  const queue = ids.map((id, i) => ({ type: types[i % 3], w: BY[id] }));
  runQueue(queue, { back: ustozBack, onDone: (m, ok, n) => { ustozEvent("today", {}); practiceDone("Bugungi so'zlar", ok, n, uTodayQuiz); } });
}

// ---------- birinchi tanishuv va sozlamalar ----------
function uTimeFields(c) {
  const f = (id, label, v) => `<label class="ufield"><span>${label}</span><input type="time" id="${id}" value="${v}"></label>`;
  return `${f("u_morn", "Ertalabki so'zlar (ish kuni)", c.morn)}${f("u_main", "Kechki asosiy dars", c.main)}${f("u_eve", "Kun yakuni", c.eve)}${f("u_wk", "Dam olish kuni boshlanishi", c.wk)}${f("u_sleep", "Uxlash", c.sleep)}
    <span class="muted small">Ish kunlari (bosib belgilang):</span>
    <div class="wdays">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<button class="opt ${c.work.includes(d) ? "sel" : ""}" data-wd="${d}" type="button">${UZ_QISQA[d]}</button>`).join("")}</div>`;
}
function uReadTimes(base) {
  const c = Object.assign({}, base, { work: base.work.slice() });
  ["morn", "main", "eve", "wk", "sleep"].forEach((k) => { const v = $("u_" + k) && $("u_" + k).value; if (/^\d{1,2}:\d{2}$/.test(v || "")) c[k] = v; });
  return c;
}
function uBindDays(c) { on("[data-wd]", (e) => { const d = +e.currentTarget.dataset.wd, i = c.work.indexOf(d); if (i >= 0) c.work.splice(i, 1); else c.work.push(d); e.currentTarget.classList.toggle("sel", i < 0); }); }
function ustozIntro(first) {
  const c = Object.assign({}, UDEF, { work: UDEF.work.slice() });
  let tgt = 6.5, ex = "2027-06";
  html(`${topBar()}
    <section class="panel hero"><div><h2>Ustoz rejimi</h2><p>Endi men tavsiya qilmayman: jadval bo'yicha o'qishga majbur qilaman. Maqsad aniq: IELTS ${tgt} va GKS granti bilan Koreya.</p></div></section>
    <section class="card"><b>Qoidalar</b><ol class="urules">
      <li>Har kuni aniq jadval: ertalab so'zlar, yo'lda tinglash, kechqurun 90 daqiqalik asosiy dars (Reading, Writing, Listening, Speaking navbat bilan), uxlashdan oldin qisqa takror. Shanba sinov imtihoni, yakshanba speaking.</li>
      <li>Dars vaqti kelganda ilova faqat shu darsni ochadi. Dars tugaguncha boshqa bo'limlar yopiq.</li>
      <li>Qadamlar tartib bilan bajariladi. Grammatika darsi sinovdan 80% bilan o'tmaguncha yopilmaydi.</li>
      <li>Telefon vaqtida eslatadi va boshlamaguningcha qayta-qayta eslatadi.</li>
      <li>Bajarilmagan asosiy dars ertaga qarz bo'lib qaytadi. Ikkitadan ortiq qarz kuyadi va intizomni tushiradi.</li>
      <li>Haftasiga bitta uzrli sabab mumkin.</li>
      <li>Jadvalni o'zgartirish ertadan, Ustozni o'chirish esa 24 soatdan keyin kuchga kiradi.</li>
    </ol></section>
    <section class="card"><b>Jadvalingni tekshir</b>${uTimeFields(c)}</section>
    <section class="card"><b>Maqsad va imtihon</b>
      <div class="grid3">${[6, 6.5, 7].map((b) => `<button class="opt ${b === tgt ? "sel" : ""}" data-tg="${b}" type="button">Band ${b.toFixed(1)}</button>`).join("")}</div>
      <div class="grid3">${["2027-05", "2027-06", "2027-07"].map((m) => `<button class="opt ${m === ex ? "sel" : ""}" data-ex="${m}" type="button">${UZ_OY[+m.slice(5) - 1]} ${m.slice(0, 4)}</button>`).join("")}</div>
      <span class="muted small">GKS uchun 6.5 yaxshi ochko beradi. Natija 2 yil amal qiladi.</span></section>
    <button class="btn main" id="ugo" type="button">Qabul qilaman, boshlaymiz</button>
    ${first !== false ? `<div class="foot"><button id="ulater" type="button">Hozircha yo'q</button></div>` : ""}
  `, "ustoz");
  bindTop(); uBindDays(c);
  on("[data-tg]", (e) => { tgt = +e.currentTarget.dataset.tg; $app.querySelectorAll("[data-tg]").forEach((x) => x.classList.toggle("sel", x === e.currentTarget)); });
  on("[data-ex]", (e) => { ex = e.currentTarget.dataset.ex; $app.querySelectorAll("[data-ex]").forEach((x) => x.classList.toggle("sel", x === e.currentTarget)); });
  if ($("ulater")) $("ulater").onclick = () => { S.ust = { on: false, later: Date.now() }; save(); home(); };
  $("ugo").onclick = () => {
    const cfg = uReadTimes(c);
    if (!cfg.work.length) cfg.work = UDEF.work.slice();
    const old = S.ust && S.ust.hist ? S.ust : null;
    S.ust = Object.assign({ days: {}, debt: [], lost: 0, exc: {}, hist: S.ieh || { rd: [], ls: [], wr: [], sp: [] }, used: {}, imist: S.iem || [] }, old || {}, { on: true, start: Date.now(), c: cfg, target: tgt, exam: ex, procAt: startOfDay() });
    delete S.ust.offAt; delete S.ust.pc; delete S.ust.later; delete S.ieh; delete S.iem;
    save();
    try { if (NATIVE && NATIVE.bildirishRuxsat) NATIVE.bildirishRuxsat(); } catch {}
    uSync(); ustozHome();
  };
}
function uPhoneState() { try { return NATIVE && NATIVE.ustozHolat ? JSON.parse(NATIVE.ustozHolat()) : null; } catch { return null; } }
function uPhoneCard() {
  const p = uPhoneState();
  if (!p || (p.bildirish && p.batareya && p.aniq && (!p.xiaomi || S.ust.xmOk))) return "";
  return `<section class="card uphone"><b>📵 Eslatmalar ishlashi uchun</b><span class="muted">Telefon Ustozni uxlatib qo'ymasligi kerak. Pastdagi tugmalarni bir marta bos.</span>${uPhoneBtns(p)}</section>`;
}
function uPhoneBtns(p) {
  const r = (k, ok, t) => `<button class="mrow ${ok ? "on" : ""}" data-px="${k}" type="button"><span class="mchk">${ok ? CHECK : ""}</span><span>${t}</span></button>`;
  return `${r("bildirish", p.bildirish, "Bildirishnomalarga ruxsat")}${r("batareya", p.batareya, "Batareya cheklovini olib tashlash")}${p.aniq ? "" : r("aniq", false, "Aniq vaqtli eslatmalar")}${p.xiaomi ? r("xiaomi", !!S.ust.xmOk, "Xiaomi: Avto-ishga tushirish (Autostart) yoqish") : ""}`;
}
function uBindPhone() {
  on("[data-px]", (e) => {
    const k = e.currentTarget.dataset.px;
    if (k === "xiaomi") { S.ust.xmOk = 1; save(); }
    try { NATIVE.ustozRuxsat(k); } catch {}
  });
}
function ustozSettings() {
  const u = S.ust, c = Object.assign({}, ucfg(addDays(Date.now(), 1) + 12 * 3600000));
  c.work = c.work.slice();
  const p = uPhoneState();
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>Jadval va qoidalar</h2></div>
    <section class="card"><b>Jadval</b>${uTimeFields(c)}<span class="muted small">O'zgarish ertadan kuchga kiradi.${u.pc ? ` Kutilayotgan o'zgarish bor.` : ""}</span><button class="btn ghost" id="usv" type="button">Saqlash</button></section>
    <section class="card"><b>Maqsad: band ${(u.target || 6.5).toFixed(1)} · ${uExamLeft()}</b>
      <div class="grid3">${[6, 6.5, 7].map((b) => `<button class="opt ${b === u.target ? "sel" : ""}" data-tg="${b}" type="button">Band ${b.toFixed(1)}</button>`).join("")}</div>
      <div class="grid3">${["2027-05", "2027-06", "2027-07"].map((m) => `<button class="opt ${m === u.exam ? "sel" : ""}" data-ex="${m}" type="button">${UZ_OY[+m.slice(5) - 1]} ${m.slice(0, 4)}</button>`).join("")}</div></section>
    ${p ? `<section class="card"><b>Telefon sozlamalari</b>${uPhoneBtns(p)}<button class="btn ghost" id="utest" type="button">Sinov eslatmasi (5 soniyada)</button></section>` : ""}
    <section class="card"><b>Ustozni to'xtatish</b>
      ${u.offAt ? `<span class="muted">Ustoz ${hhmm(u.offAt)} da (${dateUz(u.offAt)}) o'chadi. Fikringdan qaytsang, bekor qil.</span><button class="btn main" id="uon" type="button">Bekor qilish, davom etamiz</button>`
        : `<span class="muted">O'chirish 24 soatdan keyin kuchga kiradi. Bu vaqtda hamma qoidalar ishlayveradi.</span><button class="btn ghost" id="uoff" type="button">O'chirish so'rovi</button>`}</section>
    <section class="card"><b>Eski 6 oylik reja</b><span class="muted">Boblar, yutuqlar va tinglash rejasi.</span><button class="btn ghost" id="uold" type="button">Ochish</button></section>
  `);
  $("quit").onclick = ustozHome;
  uBindDays(c); uBindPhone();
  $("usv").onclick = () => { const n = uReadTimes(c); if (!n.work.length) return; u.pc = { c: n, from: addDays(Date.now(), 1) }; save(); uSync(); lateToast("Saqlandi: ertadan kuchga kiradi"); ustozSettings(); };
  on("[data-tg]", (e) => { u.target = +e.currentTarget.dataset.tg; save(); ustozSettings(); });
  on("[data-ex]", (e) => { u.exam = e.currentTarget.dataset.ex; save(); ustozSettings(); });
  if ($("utest")) $("utest").onclick = () => { try { NATIVE.ustozSinov(); lateToast("5 soniyadan keyin eslatma keladi"); } catch {} };
  if ($("uoff")) $("uoff").onclick = () => { u.offAt = Date.now() + DAY; save(); ustozSettings(); };
  if ($("uon")) $("uon").onclick = () => { delete u.offAt; save(); ustozSettings(); };
  $("uold").onclick = () => { if (uGate()) return ustozLock("plan"); planTabRaw(); };
}

// ---------- natijalar: hafta hisoboti, sinov natijasi, ballar ----------
function uWeekStats() {
  const u = S.ust, from = addDays(Date.now(), -6), inW = (x) => x.at >= from;
  const mins = [...Array(7)].reduce((s, _, k) => s + (listenRec().days[todayStr(addDays(Date.now(), -k) + 3600e3)] || 0), 0);
  let tot = 0, got = 0; const missed = [];
  for (let k = 6; k >= 0; k--) {
    const mid = addDays(Date.now(), -k) + 12 * 3600000, rec = u.days[todayStr(mid)] || { fin: {}, exc: {} };
    for (const b of uBlocks(mid)) {
      if (!b.core || (b.start < u.start && !rec.fin[b.id]) || rec.exc[b.id] || (k === 0 && Date.now() < b.dead && !rec.fin[b.id])) continue;
      tot++; if (rec.fin[b.id]) got++; else missed.push(`${UZ_QISQA[new Date(mid).getDay()]}: ${KIND[b.kind].t}`);
    }
  }
  const H = u.hist;
  return {
    tot, got, missed, mins,
    packs: Object.values(S.packs).filter((p) => p.at >= from).length,
    lessons: Object.values(S.lessons).filter((l) => l.at >= from && l.m).length,
    rd: H.rd.filter(inW), ls: H.ls.filter(inW), wr: H.wr.filter(inW), sp: H.sp.filter(inW),
  };
}
function uReport(asStep) {
  const w = uWeekStats(), disc = w.tot ? Math.round((w.got / w.tot) * 100) : null, bd = ieBands();
  const avg = (a) => (a.length ? (a.reduce((s, x) => s + x.band, 0) / a.length).toFixed(1) : "—");
  const verdict = disc === null ? "Birinchi hafta. Keyingi yakshanba natijani ko'ramiz." : disc >= 90 ? "A'lo hafta. Shunday davom etsang, maqsadga yetamiz." : disc >= 70 ? "Yaxshi, lekin bo'shliqlar bor. Keyingi hafta o'tkazib yuborma." : disc >= 50 ? "Yetarli emas. Rejaning yarmi bajarilsa, natija ham yarim bo'ladi." : "Bu hafta yomon o'tdi. Bahona emas, ertadan boshlab har kun to'liq.";
  const weak = ["r", "l", "w", "s"].filter((k) => bd[k]).sort((a, b) => bd[a] - bd[b])[0];
  const wn = { r: "Reading", l: "Listening", w: "Writing", s: "Speaking" };
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>Haftalik hisobot</h2></div>
    <section class="panel hero"><div><h2>Intizom: ${disc === null ? "—" : disc + "%"}</h2><p>${w.got} / ${w.tot} blok o'z vaqtida bajarildi</p></div><p class="usay">“${esc(verdict)}”</p></section>
    <div class="stats"><div class="stat"><b>${Math.round(w.mins / 6) / 10}</b><span>soat tinglash</span></div><div class="stat"><b>${w.packs * 5}</b><span>yangi so'z</span></div><div class="stat"><b>${w.lessons}</b><span>dars o'tildi</span></div></div>
    <section class="card"><b>IELTS mashqlari</b>
      <div class="qrow"><span>Reading: ${w.rd.length} ta matn</span><small>o'rtacha ${avg(w.rd)}</small></div>
      <div class="qrow"><span>Listening: ${w.ls.length} ta audio</span><small>o'rtacha ${avg(w.ls)}</small></div>
      <div class="qrow"><span>Writing: ${w.wr.length} ta</span><small>${w.wr.length ? Math.round(w.wr.reduce((s, x) => s + x.words, 0) / w.wr.length) + " so'z o'rtacha" : ""}</small></div>
      <div class="qrow"><span>Speaking: ${w.sp.length} ta qism</span><small></small></div>
    </section>
    <section class="card"><b>Ballar</b>${uSkillsHtml()}${weak ? `<span class="muted">Keyingi hafta e'tibor: <b>${wn[weak]}</b>. Shu qismda eng past balling.</span>` : ""}</section>
    ${w.missed.length ? `<section class="card"><b>O'tkazib yuborilganlar</b><ul class="cando">${w.missed.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>` : ""}
    <div class="grow"></div>
    <button class="btn main" id="ok" type="button">${asStep ? "Tushundim" : "Yopish"}</button>`);
  const fin = () => { if (asStep) ustozEvent("report", {}); UCTX ? ustozBack() : ustozHome(); };
  $("quit").onclick = () => (UCTX ? ustozBack() : ustozHome());
  $("ok").onclick = fin;
}
function uMockResult(asStep) {
  const from = startOfDay(), H = S.ust.hist, pick2 = (a) => a.filter((x) => x.at >= from && x.mock);
  const rd = pick2(H.rd), ls = pick2(H.ls), wr = pick2(H.wr);
  const sum = (a) => a.reduce((s, x) => s + x.ok, 0), cnt = (a) => a.reduce((s, x) => s + x.n, 0);
  const rb = rd.length ? bandOf(RBAND, sum(rd), cnt(rd)) : null, lb = ls.length ? bandOf(LBAND, sum(ls), cnt(ls)) : null;
  const wb = wr.length ? wr[wr.length - 1].band || null : null;
  const parts = [rb, lb, wb].filter((x) => x !== null);
  const all = parts.length ? ieRound(parts.reduce((s, x) => s + x, 0) / parts.length) : null;
  S.ust.hist.mock = S.ust.hist.mock || [];
  if (asStep && !S.ust.hist.mock.some((m) => m.at >= from)) { S.ust.hist.mock.push({ at: Date.now(), r: rb, l: lb, w: wb, all }); save(); }
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>Sinov natijasi</h2></div>
    <div class="score">${all !== null ? all.toFixed(1) : "—"}</div><p class="center muted">taxminiy umumiy ball (Speaking'siz)</p>
    <section class="card">
      <div class="qrow"><span>Listening</span><small>${ls.length ? `${sum(ls)}/${cnt(ls)} · ${lb.toFixed(1)}` : "—"}</small></div>
      <div class="qrow"><span>Reading</span><small>${rd.length ? `${sum(rd)}/${cnt(rd)} · ${rb.toFixed(1)}` : "—"}</small></div>
      <div class="qrow"><span>Writing</span><small>${wb ? wb.toFixed(1) + " (taxmin)" : wr.length ? "yozildi, baho Claude'dan" : "—"}</small></div>
    </section>
    <span class="muted">Writing'ni loyihadagi suhbatga yubor: aniq bahoni men beraman va natijaga qo'shamiz.</span>
    <div class="grow"></div>
    <button class="btn main" id="ok" type="button">${asStep ? "Tushundim" : "Yopish"}</button>`);
  $("quit").onclick = () => (UCTX ? ustozBack() : ustozHome());
  $("ok").onclick = () => { if (asStep) ustozEvent("mockres", {}); UCTX ? ustozBack() : ustozHome(); };
}
function uProgress() {
  const H = S.ust.hist, bd = ieBands();
  const spark = (a) => {
    const v = a.slice(-12).map((x) => x.band).filter((x) => x);
    if (v.length < 2) return "";
    const w = 260, h = 46, mn = 3, mx = 9, pts = v.map((b, i) => `${(i / (v.length - 1)) * w},${h - ((b - mn) / (mx - mn)) * h}`).join(" ");
    return `<svg class="spark" viewBox="-4 -4 ${w + 8} ${h + 8}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  };
  const row = (n, a, b) => `<section class="card"><div class="mhead"><b>${n}</b><span class="muted">${b ? "≈ " + b.toFixed(1) : "hali yo'q"} · ${a.length} ta urinish</span></div>${spark(a)}</section>`;
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>IELTS ballaring</h2></div>
    <section class="panel hero"><div><h2>Umumiy: ${bd.all ? bd.all.toFixed(1) : "—"}</h2><p>Maqsad ${(S.ust.target || 6.5).toFixed(1)} · ${uExamLeft()}</p></div></section>
    ${row("Reading", H.rd, bd.r)}${row("Listening", H.ls, bd.l)}${row("Writing", H.wr, bd.w)}${row("Speaking", H.sp, bd.s)}
    <span class="muted small">Reading va Listening: oxirgi natijalar, imtihon jadvali bo'yicha. Writing va Speaking: Claude yoki AI bahosi, bo'lmasa ilovaning taxmini. Haqiqiy imtihonda farq qilishi mumkin.</span>
    ${(H.mock || []).length ? `<section class="card"><b>Sinov imtihonlari</b>${H.mock.slice(-6).map((m) => `<div class="qrow"><span>${esc(dateUz(m.at))}</span><small>${m.all ? m.all.toFixed(1) : "—"}</small></div>`).join("")}</section>` : ""}
  `);
  $("quit").onclick = ustozHome;
}

// ---------- ilovaga ulash ----------
TABS.ustoz = () => ustozHome();
function ustozStart() {
  if (!S.ust) return ustozIntro(true);
  if (!uOn()) return home();
  uProcess();
  uSync();
  ustozHome();
}
// mashq tugagach yoki chiqilganda: Ustoz ichida bo'lsa, Ustozga qaytadi; dars vaqtida boshqa bo'limlar yopiq
const planTabRaw = planTab;
["home", "lessonsTab", "practiceTab", "planTab", "aiHome", "storiesList", "dialogsList"].forEach((n) => {
  const f = window[n];
  if (typeof f !== "function") return;
  window[n] = function (...a) {
    if (uOn()) {
      if (UCTX) return ustozBack();
      if (["home", "lessonsTab", "practiceTab", "planTab"].includes(n) && uGate()) return ustozHome();
    }
    return f.apply(this, a);
  };
});
function uResume() {
  if (!uOn()) return;
  uProcess();
  const onTab = !!document.querySelector(".tabs"), onUst = !!document.querySelector(".tab.on[data-t=ustoz]");
  if (!UCTX && onTab && (onUst || uGate())) ustozHome();
}
const _qaytdi = window.yodlaQaytdi;
window.yodlaQaytdi = () => { try { if (_qaytdi) _qaytdi(); } finally { uResume(); } };
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") uResume(); });
let uLastGate = null;
setInterval(() => {
  if (!uOn() || document.visibilityState !== "visible") return;
  const g = uGate(), key = g ? (g.b ? g.b.key : "q") : "";
  const onTab = !!document.querySelector(".tabs"), onUst = !!document.querySelector(".tab.on[data-t=ustoz]");
  if (key !== uLastGate) { uLastGate = key; if (!UCTX && onTab && !document.querySelector(".sheet") && (onUst || g)) return ustozHome(); }
  if (onUst) uRefresh();
}, 30000);
