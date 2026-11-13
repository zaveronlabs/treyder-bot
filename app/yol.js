"use strict";
// ---------- YO'L: har kun bitta mavzu, birin-ketin ----------
// Ustozning asosiy darsi (asosiy blok) endi shu yo'ldan olinadi: tushuntirish → namuna → mashq → asosiy vazifa → test.
// Kun yopilmaguncha keyingisi ochilmaydi. Yo'l tugagach, eski aralash mashq tartibi (va shanba sinovlari) qaytadi.
// Holat: S.ust.yol { from, end, i, done{id:ts}, prog{u, done}, miss{id:n}, intro }
const yU = (id) => YOL.find((x) => x.id === id) || null;
const yIdx = (id) => YOL.findIndex((x) => x.id === id);
const yNum = (U) => yIdx(U.id) + 1;
const yName = (U) => `${yNum(U)}-kun: ${U.t}`;
const yState = () => (S.ust && S.ust.yol) || null;
function yOnAt(t) { const y = yState(); return !!(y && t >= y.from && (!y.end || t < y.end)); }
function yCur() { const y = yState(); return y ? YOL[y.i] || null : null; }
function yInit() {
  const u = S.ust;
  if (!u || !u.on || u.yol) return;
  const now = Date.now(), rec = u.days[todayStr(now)];
  const mainDone = !!rec && ["asosiy", "mock", "gapir"].some((id) => rec.fin[id]);
  u.yol = { from: mainDone ? addDays(now, 1) : startOfDay(now), t0: now, i: 0, done: {}, miss: {}, intro: 1 };
  if (!mainDone && rec && !rec.fin.asosiy) { delete rec.plan.asosiy; delete rec.done.asosiy; }
  u.debt = [];
  save();
}
// blok qaysi kunni ko'rsatadi: rejasi tuzilgan bo'lsa o'sha, bugungi bo'lsa navbatdagi
function yBlockUnit(b) {
  const rec = S.ust.days[b.dk], plan = rec && rec.plan[b.id];
  if (plan && plan[0] && plan[0].a && plan[0].a.u) return yU(plan[0].a.u);
  return b.dk === todayStr() ? yCur() : null;
}
function uTitle(b) {
  if (b.kind !== "yol") return KIND[b.kind].t;
  const U = yBlockUnit(b);
  return U ? yName(U) : KIND.yol.t;
}
function yPlan(b) {
  const y = S.ust.yol, U = YOL[y.i];
  if (!U) return [];
  const out = [], st = (k, a) => out.push({ id: "s" + out.length, k, a: Object.assign({ u: U.id }, a || {}) });
  if (U.rev) { st("yrevq"); st("yweak"); if (U.extra) st(U.extra.k, U.extra.a); }
  else {
    st("ytush"); st("ynam"); st("ymashq");
    if (Array.isArray(U.main)) U.main.forEach((m) => st(m.k, m.a)); else if (U.main) st("ymain");
    st("ysinov");
  }
  // kecha boshlangan kun bugun o'sha joyidan davom etadi
  if (y.prog && y.prog.u === U.id) uDay(b.dk).done[b.id] = Object.assign({}, y.prog.done);
  return out;
}
function yMirror(ctx) {
  if (!ctx || !ctx.b || ctx.b.kind !== "yol") return;
  const steps = uSteps(ctx);
  if (!steps.length || !steps[0].a.u) return;
  S.ust.yol.prog = { u: steps[0].a.u, done: Object.assign({}, uDoneMap(ctx)) };
  save();
}
function yDone(b) {
  const y = S.ust.yol, plan = uDay(b.dk).plan[b.id], id = plan && plan[0] && plan[0].a.u;
  if (!id || y.done[id]) return;
  y.done[id] = Date.now(); y.prog = null;
  const i = yIdx(id);
  if (i >= y.i) y.i = i + 1;
  if (y.i >= YOL.length) y.end = addDays(Date.now(), 1);
  save();
}
const yBack = () => (UCTX ? ustozBack() : yRoad());
function yMiss(id) { const y = yState(); if (!y || !id) return; y.miss = y.miss || {}; y.miss[id] = (y.miss[id] || 0) + 1; save(); }
const yQ = (U, list) => list.map((t) => Object.assign({}, t, { type: t.k, yu: U.id }));

// ---------- qadam turlari ----------
const yA = (a) => yU(a.u) || {};
Object.assign(USTEP, {
  ytush: { t: "Tushuntirish", d: (a) => yA(a).goal || "", min: 8, ev: "ytush", go: (a) => yCards(yU(a.u), "tush", () => { ustozEvent("ytush", {}); yBack(); }) },
  ynam: { t: "Namuna: qanday qilinadi", d: "Tayyor misolni qadam-baqadam ko'rib chiqamiz", min: 5, ev: "ynam", go: (a) => yCards(yU(a.u), "nam", () => { ustozEvent("ynam", {}); yBack(); }) },
  ymashq: { t: "Kichik mashqlar", d: (a) => `${(yA(a).mashq || []).length} ta savol. Xato qilsang, sababini ko'rasan`, min: 8, ev: "ymashq", go: (a) => yMashq(yU(a.u)) },
  ymain: { t: (a) => (yA(a).main || {}).t || "Asosiy mashq", d: "Bugungi mavzu bo'yicha kattaroq mashq", min: (a) => (yA(a).main || {}).min || 12, ev: "ymain", go: (a) => yMain(yU(a.u)) },
  ysinov: { t: "Kichik test", d: (a) => { const n = (yA(a).sinov || []).length; return `${n} ta savol. ${Math.ceil(n * 0.8)} tasi to'g'ri bo'lsa, kun yopiladi`; }, min: 5, ev: "ysinov", ok: (d) => d.pass, go: (a) => ySinov(yU(a.u)) },
  yrevq: { t: "Hafta testi", d: "Shu haftada o'tilgan mavzulardan savollar", min: 10, ev: "yrevq", ok: (d) => d.pass, go: (a) => yRevQ(yU(a.u)) },
  yweak: { t: (a) => { const W = yWeak(yU(a.u)); return W ? `Qayta o'qish: ${W.t}` : "Qayta o'qish"; }, d: "Bu hafta eng ko'p xato qilgan mavzuing", min: 6, ev: "yweak", go: (a) => { const W = yWeak(yU(a.u)); if (!W) { ustozEvent("yweak", {}); return yBack(); } yCards(W, "tush", () => { ustozEvent("yweak", {}); yBack(); }); } },
});

// ---------- kartalar: tushuntirish va namuna ----------
function yCards(U, key, done, backFn) {
  const cards = U[key] || [], back = backFn || yBack;
  if (!cards.length) return done();
  let i = 0;
  const draw = () => {
    const c = cards[i], last = i === cards.length - 1;
    html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><div class="prog"><i style="width:${(i / cards.length) * 100}%"></i></div><span class="stage">${i + 1}/${cards.length}</span></div>
      <div class="task-title">${key === "tush" ? "Tushuntirish" : "Namuna"} · ${esc(U.t)}</div>
      <section class="card ycard"><h3>${esc(c.h)}</h3>
        ${c.chart ? ieChart(ieGet("w1", c.chart)) : ""}
        ${c.txt ? `<div class="ytx">${esc(c.txt)}</div>` : ""}
        ${(c.p || []).map((p) => `<p>${p}</p>`).join("")}
        ${(c.ex || []).map((e, j) => `<button class="ex yex" data-e="${j}" type="button"><span class="en">${esc(e[0])}</span><span class="uz">${esc(e[1])}</span><i>${SPK}</i></button>`).join("")}
        ${c.note ? `<div class="ynote">${c.note}</div>` : ""}
      </section>
      <div class="grow"></div>
      <div class="ynav">${i ? `<button class="btn ghost" id="pv" type="button">Orqaga</button>` : ""}<button class="btn main" id="nx" type="button">${last ? "Tushundim" : "Keyingi"}</button></div>`);
    $("quit").onclick = back;
    if ($("pv")) $("pv").onclick = () => { i--; draw(); };
    $("nx").onclick = () => { if (last) return done(); i++; draw(); };
    on("[data-e]", (e) => speak(c.ex[+e.currentTarget.dataset.e][0]));
  };
  draw();
}
function yMashq(U) {
  runQueue(yQ(U, U.mashq), { back: yBack, onMiss: (t) => yMiss(t.yu), onDone: () => { addXP(10); bumpStreak(); ustozEvent("ymashq", {}); yBack(); } });
}
function yMain(U) {
  runQueue(yQ(U, U.main.tasks), { back: yBack, onMiss: (t) => yMiss(t.yu), onDone: () => { addXP(20); bumpStreak(); ustozEvent("ymain", {}); yBack(); } });
}
function ySinov(U) {
  const n = U.sinov.length, need = Math.ceil(n * 0.8);
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>Kichik test</h2></div>
    <div class="card"><span class="tag pink">${esc(yName(U))}</span><h3>${n} ta savol, yordamsiz</h3><span class="muted">Birinchi urinish hisoblanadi. ${n} tadan kamida ${need} tasini to'g'ri topsang, bugungi kun yopiladi va ertaga keyingi mavzu ochiladi.</span></div>
    <div class="grow"></div>
    <button class="btn main" id="go" type="button">Testni boshlash</button>`);
  $("quit").onclick = yBack;
  $("go").onclick = () => runQueue(shuffle(yQ(U, U.sinov)), { back: yBack, onMiss: (t) => yMiss(t.yu), onDone: (m, ok, tot) => ySinovRes(U, ok, tot) });
}
function ySinovRes(U, ok, n) {
  const need = Math.ceil(n * 0.8), pass = ok >= need, nx = YOL[yIdx(U.id) + 1];
  addXP(pass ? 30 : 10); bumpStreak(); save();
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Chiqish">×</button><h2>${pass ? "Kun yopildi" : "Hali to'liq emas"}</h2></div>
    <div class="score">${ok}/${n}</div>
    <p class="center muted">${pass ? `Barakalla! “${esc(U.t)}” mavzusi o'zlashtirildi.${nx ? ` Keyingisi: <b>${esc(yName(nx))}</b>.` : ""}` : `O'tish uchun ${n} tadan ${need} tasi kerak. Tushuntirishni yana bir ko'rib chiq va testni qayta topshir. Bu jazo emas: mavzu mustahkam o'rnashishi kerak.`}</p>
    <p class="center"><span class="xpgain">+${pass ? 30 : 10} XP</span></p>
    <div class="grow"></div>
    ${pass ? `<button class="btn main" id="go" type="button">Davom etish</button>` : `<button class="btn main" id="rd" type="button">Tushuntirishni qayta o'qish</button><button class="btn ghost" id="rt" type="button">Testni qayta topshirish</button>`}`);
  if (pass) ustozEvent("ysinov", { pass: true });
  $("quit").onclick = yBack;
  if ($("go")) $("go").onclick = yBack;
  if ($("rd")) $("rd").onclick = () => yCards(U, "tush", () => ySinov(U));
  if ($("rt")) $("rt").onclick = () => ySinov(U);
}
// hafta takrori: o'tilgan har mavzudan 2 tadan savol
function yRevQ(R) {
  const q = [];
  R.of.forEach((id) => { const U = yU(id); if (U) shuffle(U.sinov).slice(0, 2).forEach((t) => q.push(Object.assign({}, t, { type: t.k, yu: U.id }))); });
  const n = q.length, need = Math.ceil(n * 0.7);
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>Hafta testi</h2></div>
    <div class="card"><span class="tag pink">${esc(yName(R))}</span><h3>${n} ta savol: ${R.of.length} ta mavzudan</h3><span class="muted">Shu haftada o'rganganlaringni aralash tekshiramiz. ${n} tadan kamida ${need} tasi birinchi urinishda to'g'ri bo'lishi kerak.</span>
      <ul class="cando">${R.of.map((id) => `<li>${esc(yU(id).t)}</li>`).join("")}</ul></div>
    <div class="grow"></div>
    <button class="btn main" id="go" type="button">Boshlash</button>`);
  $("quit").onclick = yBack;
  $("go").onclick = () => runQueue(shuffle(q), { back: yBack, onMiss: (t) => yMiss(t.yu), onDone: (m, ok, tot) => {
    const pass = ok >= need;
    addXP(pass ? 30 : 10); bumpStreak(); save();
    html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Chiqish">×</button><h2>${pass ? "Hafta testi topshirildi" : "Yana bir urinish kerak"}</h2></div>
      <div class="score">${ok}/${tot}</div>
      <p class="center muted">${pass ? "Zo'r. Bu haftaning mavzulari esingda turibdi." : `O'tish uchun ${tot} tadan ${need} tasi kerak. Xato qilgan savollaringning sababini o'qiding, endi qayta urinib ko'r.`}</p>
      <div class="grow"></div>
      <button class="btn main" id="go" type="button">${pass ? "Davom etish" : "Qayta topshirish"}</button>`);
    if (pass) ustozEvent("yrevq", { pass: true });
    $("quit").onclick = yBack;
    $("go").onclick = pass ? yBack : () => yRevQ(R);
  } });
}
function yWeak(R) {
  if (!R || !R.of) return null;
  const m = (yState() || {}).miss || {};
  return R.of.map((id) => yU(id)).filter(Boolean).sort((a, b) => (m[b.id] || 0) - (m[a.id] || 0))[0] || null;
}

// eshit va yoz / eshit va tanla
const dictNorm = (s) => String(s || "").toLowerCase().replace(/[£$€]/g, "").replace(/(\d)(st|nd|rd|th)\b/g, "$1").replace(/[^a-z0-9: ]/g, " ").replace(/\b(the|of|pounds?|dollars?)\b/g, " ").replace(/\s+/g, " ").trim();
function taskDict(head, t, finish) {
  const mc = Array.isArray(t.o) && t.o.length > 1, right = mc ? t.o[0] : [].concat(t.a)[0], opts = mc ? shuffle(t.o) : null;
  html(`${head}
    <div class="task-title">${mc ? "Eshit va tanla" : "Eshit va yoz"}</div>
    <div class="card ydict"><button class="btn ghost" id="pl" type="button">${SPK} Eshitish</button><div class="rule">${esc(t.q)}</div><span class="muted small">Mashqda xohlagancha qayta eshitsang bo'ladi. Imtihonda esa faqat bir marta.</span><div id="tr"></div></div>
    ${mc ? "" : `<div class="row aitype"><input id="inp" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Javobni yoz"></div>`}
    <div class="grow"></div>
    ${mc ? `<div class="opts sent">${opts.map((o, k) => `<button class="opt" data-k="${k}" type="button">${esc(o)}</button>`).join("")}</div>` : `<button class="btn main" id="chk" type="button" disabled>Tekshirish</button>`}`);
  const play = () => speak(t.en);
  $("pl").onclick = play;
  later(play, 400);
  let locked = false;
  const end = (ok) => { $("tr").innerHTML = `<div class="ev">“${esc(t.en)}”</div>`; finish(ok, null, right); };
  if (mc) {
    on(".opt", (e) => {
      if (locked) return; locked = true;
      const ok = opts[+e.currentTarget.dataset.k] === right;
      e.currentTarget.classList.add(ok ? "right" : "wrong");
      if (!ok) [...$app.querySelectorAll(".opt")].find((x) => opts[+x.dataset.k] === right).classList.add("right");
      end(ok);
    });
    return;
  }
  const inp = $("inp");
  inp.oninput = () => { $("chk").disabled = !inp.value.trim(); };
  inp.onkeydown = (e) => { if (e.key === "Enter" && inp.value.trim()) $("chk").click(); };
  $("chk").onclick = () => {
    if (locked) return; locked = true; inp.disabled = true;
    const n = dictNorm(inp.value), sq = (x) => x.replace(/ /g, "");
    end([].concat(t.a).some((x) => dictNorm(x) === n || sq(dictNorm(x)) === sq(n)));
  };
}

// ---------- yo'l xaritasi ----------
function yHomeCard() {
  const y = yState();
  if (!y) return "";
  if (!yOnAt(Date.now())) {
    if (!y.end) return "";
    return `<section class="card yhome"><div class="mhead"><b>Asoslar bosqichi tugadi 🎉</b><button class="yg" id="yroad" type="button">Yo'lni ko'rish</button></div><span class="muted">Endi mashq bosqichi: har kuni navbat bilan Reading, Writing, Listening va Speaking, shanba kuni esa to'liq sinov imtihoni.</span></section>`;
  }
  const n = YOL.filter((U) => y.done[U.id]).length, U = yCur();
  return `<section class="card yhome"><div class="mhead"><b>Yo'l: IELTS asoslari</b><button class="yg" id="yroad" type="button">Hamma kunlar</button></div>
    <div class="meter"><i style="width:${(n / YOL.length) * 100}%"></i></div>
    <span class="muted">${n} / ${YOL.length} kun yopildi${U ? ` · navbatda: <b>${esc(yName(U))}</b>` : ""}</span>
    ${y.intro ? `<div class="ynote">Yangi tartib: endi har kuni <b>bitta mavzu</b>, 5 qadamda: tushuntirish, namuna, mashq, asosiy vazifa va test. Kun yopilsa, keyingisi ochiladi. Eski qarzlar o'chirildi, toza sahifadan boshlaymiz. <button class="yg" id="yok" type="button">Tushundim</button></div>` : ""}</section>`;
}
function yBindHome() {
  if ($("yroad")) $("yroad").onclick = yRoad;
  if ($("yok")) $("yok").onclick = () => { delete S.ust.yol.intro; save(); ustozHome(); };
}
function yRoad() {
  const y = yState();
  if (!y) return ustozHome();
  UCTX = null;
  let out = "";
  YOL.forEach((U, i) => {
    const done = !!y.done[U.id], cur = !done && i === y.i, lock = !done && !cur;
    if (i % 7 === 0) out += `${i ? "</div>" : ""}<div class="sec">${i / 7 + 1}-hafta</div><div class="list">`;
    out += `<button class="item ${done ? "done" : cur ? "next" : "locked"}" data-y="${U.id}" type="button"><span class="num">${done ? CHECK : i + 1}</span><span class="body"><span class="title">${U.ic} ${esc(U.t)}</span><span class="sub">${U.rev ? "Hafta testi va takrorlash" : esc(U.sk)}${cur ? " · navbatdagi kun" : ""}</span></span>${lock ? `<span class="end">${LOCK}</span>` : ""}</button>`;
  });
  out += `</div>`;
  const n = YOL.filter((U) => y.done[U.id]).length;
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>Yo'l: IELTS asoslari</h2></div>
    <section class="card"><span class="tag pink">${n} / ${YOL.length} kun</span><span class="muted">Har kuni bitta mavzu. Kun 5 qadamdan iborat va testdan o'tsang yopiladi. Yopilgan kunlarning tushuntirishini istagan payt qayta o'qishing mumkin.</span><div class="meter"><i style="width:${(n / YOL.length) * 100}%"></i></div></section>
    ${out}`);
  $("quit").onclick = ustozHome;
  on("[data-y]", (e) => {
    const U = yU(e.currentTarget.dataset.y), done = !!y.done[U.id];
    if (done) return yView(U);
    if (YOL[y.i] !== U) return lateToast("Bu kun hali yopiq. Avval oldingi kunlarni yop.");
    const b = uBlocks(Date.now()).find((x) => x.kind === "yol");
    if (b && !uDay(b.dk).fin[b.id] && Date.now() < b.dead) return uBlockView({ t: b.start, bid: b.id });
    lateToast("Bu mavzu keyingi asosiy darsda ochiladi.");
  });
}
// yopilgan kunni qayta ko'rish (hisobga kirmaydi)
function yView(U) {
  if (U.rev) return lateToast("Bu hafta takrori yopilgan.");
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>${esc(yName(U))}</h2></div>
    <section class="card"><span class="tag pink">${esc(U.sk)} · yopilgan</span><span class="muted">${esc(U.goal || "")}</span></section>
    <div class="list">
      <button class="item" id="v1" type="button"><span class="num">1</span><span class="body"><span class="title">Tushuntirish</span><span class="sub">Qoidalarni qayta o'qish</span></span></button>
      <button class="item" id="v2" type="button"><span class="num">2</span><span class="body"><span class="title">Namuna</span><span class="sub">Tayyor misol</span></span></button>
      <button class="item" id="v3" type="button"><span class="num">3</span><span class="body"><span class="title">Mashqlarni qayta ishlash</span><span class="sub">${U.mashq.length + U.sinov.length} ta savol</span></span></button>
    </div>`);
  const back = () => yView(U);
  $("quit").onclick = yRoad;
  $("v1").onclick = () => yCards(U, "tush", back, back);
  $("v2").onclick = () => yCards(U, "nam", back, back);
  $("v3").onclick = () => runQueue(yQ(U, U.mashq.concat(U.sinov)), { back, onDone: back });
}
