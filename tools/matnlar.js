// Ilovada speak() ga tushishi mumkin bo'lgan barcha matnlar
const fs = require("fs"), vm = require("vm");
const dir = process.argv[2], mode = process.argv[3] || "asosiy";
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ["words.js", "lessons.js", "chuqur.js", "gapirish.js", "ielts.js"]) if (fs.existsSync(dir + "/" + f)) vm.runInContext(fs.readFileSync(dir + "/" + f, "utf8").replace(/^const (PACKS|LESSONS|TEST|SAVOLLAR|HIKOYALAR|DEEP|IELTS)\b/gm, "var $1"), ctx);
// IELTS ovozlari alohida paketda (ielts.mp3): kalit "§ovoz§matn", har xil aksentlar
if (mode === "ielts") {
  const EXAM_V = /const EXAM_V = "([^"]+)"/.exec(fs.readFileSync(dir + "/imtihon.js", "utf8"))[1];
  const I = ctx.IELTS, out = new Set(), k = (v, t) => { if (t && String(t).trim()) out.add("§" + v + "§" + String(t).trim()); };
  for (const L of I.listening) for (const [who, t] of L.lines) if (who !== "P") k((L.v && L.v[who]) || EXAM_V, t);
  for (const P of I.p1) P.q.forEach((q) => k(EXAM_V, q));
  for (const P of I.p2) { k(EXAM_V, I.cueIntro(P.t)); (P.f || []).forEach((q) => k(EXAM_V, q)); (P.p3 || []).forEach((q) => k(EXAM_V, q)); }
  console.log(JSON.stringify([...out]));
  process.exit(0);
}
const tokens = (s) => s.replace(/[.,!?;:—]/g, " ").split(/\s+/).filter((x) => /[a-z0-9]/i.test(x));
const sayable = (s) => s.replace(/\.\.\.|…|\(.*?\)/g, "").replace(/\s*(→|\/)\s*/g, ", ").replace(/\s+([?,.!])/g, "$1").replace(/\s+/g, " ").trim();
const S = new Set(["Hi! How are you today?", "Nice to meet you. I'm learning English."]);
const add = (x) => { if (x && String(x).trim()) S.add(String(x).trim()); };
for (const p of ctx.PACKS) for (const w of p.words) { add(w.en); add(w.ex); tokens(w.ex).forEach(add); }
for (const B of ctx.TEST) ctx.LESSONS.push({ rows: [], tasks: B.tasks });
for (const q of ctx.SAVOLLAR) { add(q.q); add(q.m); }
if (ctx.IELTS) for (const R of ctx.IELTS.reading) (R.gl || []).forEach((g) => add(g[0]));
for (const h of ctx.HIKOYALAR) h.lines.forEach((l) => add(l[0]));
for (const L of ctx.LESSONS) {
  for (const r of L.rows || []) add(r.length === 3 ? r[1] : sayable(r[0]));
  for (const r of L.ex || []) add(r[0]);
  for (const t of L.tasks || []) {
    if (t.k === "fill") { const [a, b] = t.s.split("___"); add(a + t.a + b); }
    if (t.k === "order") { add(t.en); tokens(t.en).forEach(add); (t.extra || []).forEach(add); }
    if (t.k === "tr") add(t.a);
    if (t.k === "listen") add(t.en);
  }
}
const P = (x) => String(x).replace(/\*/g, "");
const isEn = (s) => /^[A-Z"'][^:]*[.?!]$/.test(s) && !/[oOgG]'(?!s\b)|\b(va|emas|uchun|bilan|yo'q)\b/.test(s);
const task = (t) => {
  if (t.k === "fill") { const [a, b] = t.s.split("___"); add(a + t.a + b); }
  if (t.k === "type") { const [a, b] = t.s.split("___"); add(a + [].concat(t.a)[0] + b); }
  if (t.k === "order") { add(t.en); tokens(t.en).forEach(add); (t.extra || []).forEach(add); }
  if (t.k === "tr") add(t.a);
  if (t.k === "listen" || t.k === "speak") add(t.en);
  if (t.k === "pick") { if (t.s) add(P(t.s)); else if (isEn(t.a)) add(t.a); }
  if (t.k === "spot") add(t.s);
};
for (const id in ctx.DEEP || {}) {
  const D = ctx.DEEP[id];
  D.story.lines.forEach((l) => add(P(l[1])));
  (D.notice || []).forEach((t) => add(t.s));
  (D.ccq || []).forEach((t) => { if (t.s) add(P(t.s)); else if (isEn(t.a)) add(t.a); });
  (D.parts || []).forEach((p) => (p.rows || []).forEach((r) => { if (!/\+|[oOgG]'(?!s\b)|\.\.\./.test(r[0])) add(sayable(P(r[0]))); }));
  (D.say || []).forEach((t) => add(t.en));
  (D.tasks || []).forEach(task); (D.final || []).forEach(task);
}
console.log(JSON.stringify([...S]));
