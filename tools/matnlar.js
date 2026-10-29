// Ilovada speak() ga tushishi mumkin bo'lgan barcha matnlar
const fs = require("fs"), vm = require("vm");
const dir = process.argv[2];
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ["words.js", "lessons.js", "gapirish.js"]) vm.runInContext(fs.readFileSync(dir + "/" + f, "utf8").replace(/^const (PACKS|LESSONS|TEST|SAVOLLAR|HIKOYALAR)\b/gm, "var $1"), ctx);
const tokens = (s) => s.replace(/[.,!?;:—]/g, " ").split(/\s+/).filter((x) => /[a-z0-9]/i.test(x));
const sayable = (s) => s.replace(/\.\.\.|…|\(.*?\)/g, "").replace(/\s*(→|\/)\s*/g, ", ").replace(/\s+([?,.!])/g, "$1").replace(/\s+/g, " ").trim();
const S = new Set(["Hi! How are you today?", "Nice to meet you. I'm learning English."]);
const add = (x) => { if (x && String(x).trim()) S.add(String(x).trim()); };
for (const p of ctx.PACKS) for (const w of p.words) { add(w.en); add(w.ex); tokens(w.ex).forEach(add); }
for (const B of ctx.TEST) ctx.LESSONS.push({ rows: [], tasks: B.tasks });
for (const q of ctx.SAVOLLAR) { add(q.q); add(q.m); }
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
console.log(JSON.stringify([...S]));
