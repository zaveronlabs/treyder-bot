"use strict";
// ---------- IELTS dvigatellari: Reading, Listening, Writing, Speaking ----------
// Natijalar S.ust.hist ga yoziladi (Ustoz yoqilmagan bo'lsa S.ieh ga), xatolar Shanba tahlili uchun saqlanadi.

const RBAND = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [0, 1]];
const LBAND = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [11, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [0, 1]];
const bandOf = (tbl, ok, n) => { const raw = Math.round((ok / Math.max(1, n)) * 40); return tbl.find(([r]) => raw >= r)[1]; };
const ieRound = (x) => { const f = Math.floor(x), r = x - f; return r < 0.25 ? f : r < 0.75 ? f + 0.5 : f + 1; };
const LET = "ABCDEFGHIJKL";
const ROM = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
const mmss = (s) => { const neg = s < 0; s = Math.abs(Math.round(s)); return (neg ? "+" : "") + Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const EXAM_V = "en-GB-RyanNeural";
function ieH() {
  if (S.ust && S.ust.hist) { const h = S.ust.hist; ["rd", "ls", "wr", "sp"].forEach((k) => { h[k] = h[k] || []; }); return h; }
  S.ieh = S.ieh || { rd: [], ls: [], wr: [], sp: [] };
  return S.ieh;
}
function ieMistStore() { if (S.ust && S.ust.hist) return (S.ust.imist = S.ust.imist || []); return (S.iem = S.iem || []); }
function ieList(kind) { return { reading: IELTS.reading, listening: IELTS.listening, w2: IELTS.w2, w1: IELTS.w1, p1: IELTS.p1, p2: IELTS.p2, model: IELTS.models }[kind] || []; }
function ieGet(kind, id) { const l = ieList(kind); return l.find((x) => x.id === id) || l[0]; }
function ieTitle(kind, id) { const x = ieGet(kind, id); return x ? x.title || x.t || "" : ""; }
function ieDesc(kind, id) {
  const x = ieGet(kind, id);
  if (!x) return "";
  if (kind === "reading") return `${x.min} daqiqa · ${x.qs.length} savol`;
  if (kind === "listening") return `${x.part}-qism · ${x.qs.length} savol · bir marta eshitiladi`;
  if (kind === "w2" || kind === "w1") return x.q.length > 96 ? x.q.slice(0, 94) + "…" : x.q;
  return "";
}
function ieMin(kind, id) { const x = ieGet(kind, id); if (!x) return 15; if (kind === "reading") return x.min; if (kind === "listening") return Math.max(6, Math.round(x.lines.length / 4) + 5); return 10; }
let IEFROM = null;
// erkin mashqda ishlatilgan material Ustoz rejasida keyinroq chiqadi (darhol takrorlanmasin)
function ieUsed(kind, id) {
  if (UCTX || !S.ust || !S.ust.used) return;
  const u = (S.ust.used[kind] = S.ust.used[kind] || {});
  u[id] = (u[id] || 0) + 1;
}
const KIND_UZ = { line: "Chiziqli grafik", bar: "Ustunli diagramma", pie: "Doiraviy diagramma", table: "Jadval" };
const ieBack = () => (UCTX ? ustozBack() : ieHub());
function ieAsk(title, text, stay, leave, onLeave) {
  document.querySelectorAll(".sheet").forEach((e) => e.remove());
  const el = document.createElement("div");
  el.className = "sheet ulock";
  el.innerHTML = `<div class="in"><h3>${title}</h3><p>${text}</p><button class="btn main" type="button">${stay}</button><button class="btn ghost" type="button">${leave}</button></div>`;
  document.body.appendChild(el);
  const [b1, b2] = el.querySelectorAll("button");
  b1.onclick = () => el.remove();
  b2.onclick = () => { el.remove(); onLeave(); };
}
function ieCopy(text) {
  try { if (NATIVE && NATIVE.nusxa) { NATIVE.nusxa(text); return true; } } catch {}
  try { navigator.clipboard.writeText(text); return true; } catch { return false; }
}

// ---------- savollar (Reading va Listening uchun umumiy) ----------
const QINS = {
  tfng: ["Do the following statements agree with the information given in the text? Choose TRUE, FALSE or NOT GIVEN.", "TRUE: matnda shunday yozilgan. FALSE: matnda buning aksi yozilgan. NOT GIVEN: matnda bu haqda ma'lumot yo'q."],
  ynng: ["Do the following statements agree with the claims of the writer? Choose YES, NO or NOT GIVEN.", "YES: muallif shunday fikrda. NO: muallif aksini aytadi. NOT GIVEN: muallif bu haqda fikr aytmagan."],
  mcq: ["Choose the correct letter.", "To'g'ri variantni tanla."],
  gap: (lim) => [`Complete the notes. Write ${lim || "NO MORE THAN TWO WORDS"} for each answer.`, "Javobni matndan yoki audiodan aynan yoz. So'z soni chegarasidan oshma, imloga e'tibor ber."],
  head: ["Choose the correct heading for each paragraph from the list of headings below.", "Har paragrafga mos sarlavhani tanla. Sarlavhalar paragraflardan ko'p, ortiqchalari bor."],
};
const OPTS = { tfng: ["TRUE", "FALSE", "NOT GIVEN"], ynng: ["YES", "NO", "NOT GIVEN"] };
function ieQHtml(X) {
  const qs = X.qs;
  let out = "", i = 0;
  while (i < qs.length) {
    const k = qs[i].k;
    let j = i;
    while (j < qs.length && qs[j].k === k) j++;
    const ins = typeof QINS[k] === "function" ? QINS[k](X.lim) : QINS[k];
    out += `<section class="qgrp"><b class="qh">Questions ${i + 1}${j - 1 > i ? "–" + j : ""}</b><p class="qi">${esc(ins[0])}</p><small class="muted">${esc(ins[1])}</small>`;
    if (k === "head") out += `<ol class="heads">${X.heads.map((h, z) => `<li><b>${ROM[z]}</b> ${esc(h)}</li>`).join("")}</ol>`;
    for (let q = i; q < j; q++) out += ieQOne(qs[q], q, X);
    out += `</section>`;
    i = j;
  }
  return out;
}
function ieQOne(q, i, X) {
  const num = `<b class="qn">${i + 1}</b>`;
  if (q.k === "tfng" || q.k === "ynng") return `<div class="qq" data-q="${i}">${num}<p>${esc(q.s)}</p><div class="ch3">${OPTS[q.k].map((o) => `<button class="opt" data-a="${o}" type="button">${o}</button>`).join("")}</div></div>`;
  if (q.k === "mcq") return `<div class="qq" data-q="${i}">${num}<p>${esc(q.s)}</p><div class="opts sent">${q.o.map((o, z) => `<button class="opt" data-a="${z}" type="button"><b>${LET[z]}</b>${esc(o)}</button>`).join("")}</div></div>`;
  if (q.k === "gap") { const [a, b] = q.s.split("___"); return `<div class="qq" data-q="${i}">${num}<p>${esc(a)}<input class="gapin" data-g="${i}" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${i + 1}-javob">${esc(b || "")}</p></div>`; }
  if (q.k === "head") return `<div class="qq" data-q="${i}">${num}<p>Paragraph <b>${LET[q.p]}</b></p><select data-h="${i}"><option value="">—</option>${X.heads.map((h, z) => `<option value="${z}">${ROM[z]}. ${esc(h.length > 38 ? h.slice(0, 36) + "…" : h)}</option>`).join("")}</select></div>`;
  return "";
}
function ieBindQs(ans, onCh) {
  on(".qq .opt", (e) => { const b = e.currentTarget, w = b.closest(".qq"), i = +w.dataset.q; ans[i] = b.dataset.a; w.querySelectorAll(".opt").forEach((x) => x.classList.toggle("sel", x === b)); onCh(); });
  $app.querySelectorAll(".gapin").forEach((x) => { x.oninput = () => { ans[+x.dataset.g] = x.value.trim() || null; onCh(); }; x.onkeydown = (e) => { if (e.key === "Enter") x.blur(); }; });
  $app.querySelectorAll("select[data-h]").forEach((x) => { x.onchange = () => { ans[+x.dataset.h] = x.value === "" ? null : x.value; onCh(); }; });
}
const gapNorm = (s) => String(s || "").toLowerCase().replace(/[’‘`]/g, "'").replace(/(\d),(\d)/g, "$1$2").replace(/[^a-z0-9'%$£.\- ]/g, " ").replace(/\s+/g, " ").trim().replace(/^(the|a|an) /, "").replace(/[ .]+$/, "").replace(/-/g, " ");
function ieCorrect(q, v) {
  if (v === null || v === undefined || v === "") return false;
  if (q.k === "tfng" || q.k === "ynng") return v === q.a;
  if (q.k === "mcq" || q.k === "head") return +v === q.a;
  if (q.k === "gap") return [].concat(q.a).some((x) => gapNorm(x) === gapNorm(v));
  return false;
}
const ieShow = (q, v, X) => (v === null || v === undefined || v === "" ? "javob yo'q" : q.k === "mcq" ? `${LET[+v]}. ${q.o[+v]}` : q.k === "head" ? `${ROM[+v]}. ${X.heads[+v]}` : v);
const ieRight = (q, X) => (q.k === "mcq" ? `${LET[q.a]}. ${q.o[q.a]}` : q.k === "head" ? `${ROM[q.a]}. ${X.heads[q.a]}` : [].concat(q.a)[0]);

// ---------- READING ----------
function ieReading(id, a) {
  a = a || {};
  const R0 = ieGet("reading", id);
  let R = R0;
  // yo'l darslarida faqat o'tilgan savol turlari beriladi (qi: asl savol raqamlari)
  if (a.only) { const qi = []; R0.qs.forEach((q, i) => { if (a.only.includes(q.k)) qi.push(i); }); R = Object.assign({}, R0, { qs: qi.map((i) => R0.qs[i]), qi }); }
  const n = R.qs.length, ans = new Array(n).fill(null), lim = Math.round(R.min * 60 * (a.xt || 1)), t0 = Date.now();
  let over = false;
  html(`<div class="bar iebar"><button class="x" id="quit" type="button" aria-label="Chiqish">×</button><div class="ietime" id="tm">${mmss(lim)}</div><button class="btn main iesub" id="sub" type="button">Topshirish</button></div>
    <div class="seg"><button class="on" data-v="m" type="button">Matn</button><button data-v="q" type="button">Savollar · <span id="qc">0/${n}</span></button></div>
    <article id="vm" class="iepass"><span class="tag pink">${a.mock ? "Sinov imtihoni · " : ""}Reading · ${Math.round(lim / 60)} daqiqa</span><h2>${esc(R.title)}</h2>${R.paras.map((p, i) => `<p>${R.heads ? `<b class="plet">${LET[i]}</b>` : ""}${esc(p)}</p>`).join("")}
      <button class="btn ghost" id="toq" type="button">Savollarga o'tish →</button></article>
    <div id="vq" class="ieqs" hidden>${ieQHtml(R)}<button class="btn main" id="sub2" type="button">Topshirish</button></div>`);
  const pos = { m: 0, q: 0 };
  let view = "m";
  const show = (v) => {
    if (v === view) return;
    pos[view] = window.scrollY; view = v;
    $("vm").hidden = v !== "m"; $("vq").hidden = v !== "q";
    $app.querySelectorAll(".seg button").forEach((b) => b.classList.toggle("on", b.dataset.v === v));
    window.scrollTo(0, pos[v]);
  };
  on(".seg button", (e) => show(e.currentTarget.dataset.v));
  $("toq").onclick = () => show("q");
  ieBindQs(ans, () => { $("qc").textContent = `${ans.filter((x) => x !== null).length}/${n}`; });
  const submit = () => { stopTimers(); ieResult("rd", R, ans, (Date.now() - t0) / 1000, a); };
  const trySub = () => {
    const left = ans.filter((x) => x === null).length;
    if (left && !over) ieAsk("Topshirasanmi?", `${left} ta savol javobsiz qoldi. Imtihonda bo'sh joy = 0 ball, taxmin bo'lsa ham yoz.`, "Qaytish", "Baribir topshirish", submit);
    else submit();
  };
  $("sub").onclick = trySub; $("sub2").onclick = trySub;
  $("quit").onclick = () => ieAsk("Chiqasanmi?", "Chiqsang, bu test hisoblanmaydi va qadam bajarilmaydi.", "Davom etish", "Chiqish", ieBack);
  every(() => {
    const left = lim - (Date.now() - t0) / 1000, el = $("tm");
    if (!el) return;
    el.textContent = mmss(Math.max(0, left)); el.classList.toggle("low", left < 120);
    if (left <= 0 && !over) { over = true; lateToast("Vaqt tugadi. Javoblar topshirildi."); submit(); }
  }, 1000);
}

// ---------- LISTENING ----------
let PACK2 = null, pack2Loading = null, ieAudio = null;
const URL2 = {};
function loadPack2() {
  if (!window.AUDIO2) return Promise.resolve();
  if (PACK2) return Promise.resolve();
  if (!pack2Loading) pack2Loading = fetch("ielts.mp3").then((r) => (r.ok ? r.arrayBuffer() : null)).then((b) => { PACK2 = b; }).catch(() => {});
  return pack2Loading;
}
function clip2(voice, text) {
  const A = window.AUDIO2, e = A && A.files["§" + voice + "§" + String(text).trim()];
  if (!e || !PACK2) return null;
  const k = e[0] + ":" + e[1];
  if (!URL2[k]) URL2[k] = URL.createObjectURL(new Blob([PACK2.slice(e[0], e[0] + e[1])], { type: "audio/mpeg" }));
  return URL2[k];
}
function nativeSay(text, cb) {
  if (NATIVE && NATIVE.gapir) {
    window.__nsay = cb;
    try { NATIVE.gapir(text, 0.95); } catch { window.__nsay = null; later(cb, 400); return; }
    later(() => { if (window.__nsay === cb) { window.__nsay = null; cb(); } }, 2500 + text.split(/\s+/).length * 520);
    return;
  }
  let f = false;
  const d = () => { if (!f) { f = true; cb(); } };
  ttsSpeak(text, 0.95, d);
  later(d, 2500 + text.split(/\s+/).length * 520);
}
function ieSay(text, voice, cb) {
  let fired = false;
  const done = () => { if (!fired) { fired = true; if (cb) cb(); } };
  const url = clip2(voice, text) || clipUrl(text);
  try { if (curAudio) curAudio.pause(); } catch {}
  try { if (ieAudio) ieAudio.pause(); } catch {}
  if (url) {
    try {
      const au = new Audio(url);
      ieAudio = au; au.onended = done; au.onerror = done;
      au.play().catch(() => nativeSay(text, done));
      return;
    } catch {}
  }
  nativeSay(text, done);
}
function ieStopAudio() { try { if (ieAudio) ieAudio.pause(); } catch {} try { if (NATIVE && NATIVE.gapirToxtat) NATIVE.gapirToxtat(); } catch {} window.__nsay = null; }
function iePlay(L, onLine, onEnd) {
  let i = 0, stopped = false, paused = false, pending = null;
  const step = () => {
    if (stopped) return;
    if (paused) { pending = step; return; }
    if (i >= L.lines.length) return onEnd();
    const [who, text] = L.lines[i];
    onLine(i);
    if (who === "P") { i++; return later(step, (+text || 5) * 1000); }
    ieSay(text, L.v[who] || EXAM_V, () => {
      if (stopped) return;
      const nx = L.lines[i + 1];
      i++;
      later(step, !nx ? 0 : nx[0] !== who ? 600 : 300);
    });
  };
  step();
  return {
    stop: () => { stopped = true; ieStopAudio(); },
    pause: () => { paused = true; try { if (ieAudio) ieAudio.pause(); } catch {} },
    resume: () => { paused = false; if (pending) { const p = pending; pending = null; p(); } else { try { if (ieAudio && ieAudio.paused && !ieAudio.ended) ieAudio.play(); } catch {} } },
    get paused() { return paused; },
  };
}
function ieListening(id, a) {
  a = a || {};
  const L = ieGet("listening", id), n = L.qs.length, ans = new Array(n).fill(null);
  let phase = "read", player = null, t0 = 0, pauses = 0;
  html(`<div class="bar iebar"><button class="x" id="quit" type="button" aria-label="Chiqish">×</button><div class="ietime" id="tm">Tayyorlan</div><button class="btn main iesub" id="sub" type="button" disabled>Topshirish</button></div>
    <div class="card lsnow"><span class="tag pink">${a.mock ? "Sinov imtihoni · " : ""}Listening · ${L.part}-qism</span><b>${esc(L.title)}</b><span class="muted">${esc(L.ctx)}</span>
      <div class="meter"><i id="lp" style="width:0%"></i></div><span class="muted small" id="lst">Audio faqat bir marta eshittiriladi. Avval savollarni o'qib chiq.</span>
      <div class="row2"><button class="btn main" id="play" type="button">Tayyorman: boshlash</button>${a.mock ? "" : `<button class="btn ghost" id="pz" type="button" disabled>Pauza</button>`}</div></div>
    <div class="ieqs">${ieQHtml(L)}</div>`);
  ieBindQs(ans, () => {});
  loadPack2();
  let readLeft = 30;
  every(() => {
    if (phase === "read") { readLeft--; const el = $("tm"); if (el) el.textContent = `0:${String(Math.max(0, readLeft)).padStart(2, "0")}`; if (readLeft <= 0) start(); }
    else if (phase === "check") { checkLeft--; const el = $("tm"); if (el) { el.textContent = mmss(Math.max(0, checkLeft)); el.classList.toggle("low", checkLeft < 10); } if (checkLeft <= 0) submit(); }
  }, 1000);
  let checkLeft = 30;
  const start = () => {
    if (phase !== "read") return;
    phase = "play"; t0 = Date.now();
    $("play").disabled = true; $("play").textContent = "Tinglanmoqda...";
    if ($("pz")) $("pz").disabled = false;
    $("tm").textContent = "▶";
    loadPack2().then(() => {
      if (!document.body.contains($("lp"))) return;
      player = iePlay(L, (i) => { const el = $("lp"); if (el) el.style.width = `${(i / L.lines.length) * 100}%`; const s = $("lst"); if (s) s.textContent = `${i + 1} / ${L.lines.length}`; }, () => {
        phase = "check"; const el = $("lp"); if (el) el.style.width = "100%";
        const s = $("lst"); if (s) s.textContent = "Audio tugadi. Javoblarni tekshirish uchun 30 soniya.";
        $("sub").disabled = false;
      });
    });
  };
  $("play").onclick = start;
  if ($("pz")) $("pz").onclick = () => {
    if (!player) return;
    if (player.paused) { player.resume(); $("pz").textContent = "Pauza"; }
    else { player.pause(); pauses++; $("pz").textContent = "Davom"; }
  };
  const submit = () => { if (phase === "done") return; phase = "done"; stopTimers(); if (player) player.stop(); ieResult("ls", L, ans, (Date.now() - (t0 || Date.now())) / 1000, Object.assign({ pauses }, a)); };
  $("sub").onclick = () => { const left = ans.filter((x) => x === null).length; if (left) ieAsk("Topshirasanmi?", `${left} ta savol javobsiz. Taxmin bo'lsa ham yoz.`, "Qaytish", "Baribir topshirish", submit); else submit(); };
  $("quit").onclick = () => ieAsk("Chiqasanmi?", "Chiqsang, bu test hisoblanmaydi.", "Davom etish", "Chiqish", () => { if (player) player.stop(); ieBack(); });
}

// ---------- natija: xatolarni ochib ko'rmaguncha davom etib bo'lmaydi ----------
function ieResult(kind, X, ans, sec, a) {
  const qs = X.qs, n = qs.length, okv = qs.map((q, i) => ieCorrect(q, ans[i])), ok = okv.filter(Boolean).length;
  const band = bandOf(kind === "rd" ? RBAND : LBAND, ok, n), H = ieH();
  H[kind].push({ id: X.id, ok, n, band, sec: Math.round(sec), at: Date.now(), mock: !!a.mock });
  ieUsed(kind, X.id);
  const ms = ieMistStore();
  qs.forEach((q, i) => { if (!okv[i]) ms.push({ k: kind, id: X.id, q: X.qi ? X.qi[i] : i, u: ans[i], at: Date.now() }); });
  addXP(10 + ok * 3); bumpStreak(); save();
  ustozEvent(kind, { id: X.id, ok, n });
  const wrong = qs.map((q, i) => i).filter((i) => !okv[i]), seen = new Set();
  const pct = ok / n;
  const say = pct >= 0.85 ? "A'lo. Shu darajani ushlab tur." : pct >= 0.65 ? "Yaxshi. Endi xatolarning sababini top: har birini och." : pct >= 0.45 ? "O'rtacha. Har bir xatoni ochib, dalilni matndan top." : "Qiyin bo'ldi. Xatolarni diqqat bilan ko'r: aynan shu yerda o'sasan.";
  const lineBtn = (q) => (kind === "ls" && q.line >= 0 ? `<button class="say sm" data-ln="${q.line}" type="button" aria-label="Qayta eshitish">${SPK}</button>` : "");
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Chiqish">×</button><h2>${kind === "rd" ? "Reading" : "Listening"} natijasi</h2></div>
    <div class="score">${ok}/${n}</div>
    <p class="center"><span class="bandchip">Band ≈ ${band.toFixed(1)}</span> <span class="muted">· ${mmss(sec)}${a.pauses ? ` · ${a.pauses} pauza` : ""}</span></p>
    <p class="center muted">${say}</p>
    <div class="qres">${qs.map((q, i) => {
      const good = okv[i];
      return `<details class="qr ${good ? "ok" : "no"}" data-w="${i}"><summary><span class="mk">${good ? "✓" : "✗"}</span><span><b>${i + 1}.</b> ${esc(q.s ? q.s.replace("___", "____") : `Paragraph ${LET[q.p]}`)}</span></summary>
        <div class="qbody"><div class="qrow"><span>Sening javobing: <b>${esc(ieShow(q, ans[i], X))}</b></span></div><div class="qrow"><span>To'g'ri javob: <b class="okc">${esc(ieRight(q, X))}</b></span>${lineBtn(q)}</div>
        ${q.ev ? `<div class="ev">“${esc(q.ev)}”</div>` : kind === "ls" && q.line >= 0 ? `<div class="ev">“${esc(X.lines[q.line][1])}”</div>` : ""}${q.uz ? `<div class="ex">${esc(q.uz)}</div>` : ""}</div></details>`;
    }).join("")}</div>
    ${kind === "rd" && X.gl ? `<div class="sec">Matndagi muhim so'zlar</div><div class="res">${X.gl.map((g) => `<button class="resw" data-say="${esc(g[0])}" type="button"><div><b>${esc(g[0])}</b><small>${esc(g[1])}</small></div>${SPK}</button>`).join("")}</div>` : ""}
    ${kind === "ls" ? `<details class="card"><summary><b>To'liq matn (transcript)</b></summary><div class="trs">${X.lines.filter((l) => l[0] !== "P").map((l) => `<p><b>${esc(l[0] === "N" ? "" : l[0])}</b> ${esc(l[1])}</p>`).join("")}</div></details>` : ""}
    <div class="grow"></div>
    <p class="center muted small" id="wleft">${wrong.length ? `Har bir xatoni ochib ko'r: 0/${wrong.length}` : ""}</p>
    <button class="btn main" id="go" type="button" ${wrong.length ? "disabled" : ""}>Davom etish</button>`);
  $app.querySelectorAll("details.qr.no").forEach((d) => d.addEventListener("toggle", () => {
    if (!d.open) return;
    seen.add(+d.dataset.w);
    $("wleft").textContent = seen.size >= wrong.length ? "Barakalla, hammasini ko'rib chiqding." : `Har bir xatoni ochib ko'r: ${seen.size}/${wrong.length}`;
    $("go").disabled = seen.size < wrong.length;
  }));
  on("[data-say]", (e) => speak(e.currentTarget.dataset.say));
  if (kind === "ls") { loadPack2(); on("[data-ln]", (e) => { e.preventDefault(); const l = X.lines[+e.currentTarget.dataset.ln]; ieSay(l[1], X.v[l[0]] || EXAM_V); }); }
  $("go").onclick = ieBack;
  $("quit").onclick = () => { if (wrong.length && seen.size < wrong.length) return ieAsk("Xatolarni ko'rmadingmi?", "Ustoz talabi: har bir xatoni ochib, sababini o'qi. Shundan keyin davom etasan.", "Ko'rib chiqaman", "Baribir chiqish", ieBack); ieBack(); };
}

// ---------- WRITING ----------
const LINKERS = ["however", "moreover", "furthermore", "in addition", "on the other hand", "therefore", "as a result", "consequently", "for example", "for instance", "in conclusion", "to conclude", "although", "whereas", "while", "despite", "in contrast", "similarly", "firstly", "secondly", "finally", "overall", "in my opinion", "nevertheless", "this means that", "such as", "because", "since", "thus", "hence", "by contrast", "meanwhile", "in particular", "to sum up", "it is clear that", "one reason", "another"];
const STOPW = new Set("the a an and or but if then than that this these those there their they them it its is are was were be been being to of in on at for with by from as into about over after before not no so such can could will would should may might must do does did have has had i you he she we our your my me him her his who whom which what when where why how all any each more most other some very also just only many much one two three people".split(" "));
function wrStats(text, kind) {
  const toks = text.trim().match(/\S+/g) || [];
  const words = (text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).map((w) => w.toLowerCase());
  const paras = text.split(/\n+/).map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 8).length;
  const sents = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 3);
  const lt = text.toLowerCase();
  const links = LINKERS.filter((l) => new RegExp(`(^|[^a-z])${l.replace(/ /g, "\\s+")}([^a-z]|$)`).test(lt));
  const contr = [...new Set((text.match(/\b[A-Za-z]+n't\b|\b(?:I'm|it's|that's|there's|I've|I'd|you're|they're|we're|let's)\b/gi) || []).map((x) => x.toLowerCase()))];
  const content = words.filter((w) => !STOPW.has(w) && w.length > 3);
  const freq = {};
  content.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  const topic = new Set(((kind === "w1" ? "percentage percent proportion number figure figures period years year total chart graph table shows shown compared" : "") + " " + (WR_TOPIC || "")).split(/\s+/));
  const over = Object.entries(freq).filter(([w, c]) => c >= 4 && !topic.has(w)).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const acadSet = new Set(IELTS.acad.concat(PACKS.filter((p) => p.ielts || p.lv === "C1").flatMap((p) => p.words.map((w) => w.en.toLowerCase()))));
  const acad = [...new Set(words.filter((w) => acadSet.has(w)))];
  const complex = (lt.match(/\b(although|though|whereas|which|who|whose|if|unless|because|since|while|when|despite|so that|in order to|not only|whether)\b/g) || []).length;
  return {
    wc: toks.length, paras, sents: sents.length, avgLen: toks.length / Math.max(1, sents.length), links, contr, over, acad, complex,
    ttr: new Set(content).size / Math.max(1, content.length),
    conc: /\b(in conclusion|to conclude|to sum up|in summary|all things considered)\b/i.test(text),
    ovw: /\b(overall|in general|it is clear that|it is evident that|generally speaking)\b/i.test(text),
    nums: (text.match(/\d+(?:[.,]\d+)?%?/g) || []).length, first: /\b(I|my|me|I'm|I think)\b/.test(text),
  };
}
let WR_TOPIC = "";
function wrBand(s, kind) {
  const min = kind === "w2" ? 250 : 150;
  let tr = 6, cc = 6, lr = 6, gr = 6;
  if (s.wc < min) tr -= 1;
  if (kind === "w2") { if (s.paras < 4) { tr -= 0.5; cc -= 0.5; } if (!s.conc) tr -= 0.5; }
  else { if (!s.ovw) tr -= 1; if (s.nums < 5) tr -= 0.5; if (s.first) tr -= 0.5; if (s.paras < 3) cc -= 0.5; }
  if (s.links.length >= 7) cc += 0.5; else if (s.links.length < 4) cc -= 0.5;
  if (s.ttr > 0.62) lr += 0.5; else if (s.ttr < 0.48) lr -= 0.5;
  if (s.acad.length >= 6) lr += 0.5; else if (s.acad.length < 2) lr -= 0.5;
  if (s.over.length >= 2) lr -= 0.5;
  if (s.contr.length) lr -= 0.5;
  if (s.complex >= 8) gr += 0.5; else if (s.complex < 3) gr -= 0.5;
  if (s.avgLen < 11 || s.avgLen > 34) gr -= 0.5;
  const c = (x) => Math.max(4, Math.min(7, x));
  const r = { tr: c(tr), cc: c(cc), lr: c(lr), gr: c(gr) };
  r.all = ieRound((r.tr + r.cc + r.lr + r.gr) / 4);
  return r;
}
// Task 1 grafiklari (SVG)
const CHART_COL = ["#0F9488", "#3B82F6", "#E0A100", "#E0475B", "#8B5CF6", "#64748B"];
function ieChart(W) {
  if (W.kind === "table") {
    return `<div class="chart"><b>${esc(W.title)}</b><div class="tblwrap"><table class="ietbl"><tr><th></th>${W.cats.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>${W.series.map((s) => `<tr><td>${esc(s.n)}</td>${s.v.map((v) => `<td>${esc(String(v))}</td>`).join("")}</tr>`).join("")}</table></div>${W.unit ? `<small class="muted">${esc(W.unit)}</small>` : ""}</div>`;
  }
  if (W.kind === "pie") {
    const pies = W.series, R = 62, out = [];
    pies.forEach((s, k) => {
      const cx = 80 + k * 170, cy = 84, tot = s.v.reduce((a, b) => a + b, 0);
      let ang = -Math.PI / 2;
      s.v.forEach((v, j) => {
        const a2 = ang + (v / tot) * Math.PI * 2, large = a2 - ang > Math.PI ? 1 : 0;
        const x1 = cx + R * Math.cos(ang), y1 = cy + R * Math.sin(ang), x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
        out.push(`<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${CHART_COL[j % 6]}" stroke="#fff" stroke-width="1.5"/>`);
        const mid = (ang + a2) / 2, lx = cx + R * 0.68 * Math.cos(mid), ly = cy + R * 0.68 * Math.sin(mid);
        if (v / tot >= 0.06) out.push(`<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" class="pl">${v}%</text>`);
        ang = a2;
      });
      out.push(`<text x="${cx}" y="168" text-anchor="middle" class="ct">${esc(s.n)}</text>`);
    });
    const leg = W.cats.map((c, j) => `<span><i style="background:${CHART_COL[j % 6]}"></i>${esc(c)}</span>`).join("");
    return `<div class="chart"><b>${esc(W.title)}</b><svg viewBox="0 0 ${pies.length * 170 - 10} 178">${out.join("")}</svg><div class="leg">${leg}</div></div>`;
  }
  const w = 320, h = 190, L = 38, B = 28, T = 10, all = W.series.flatMap((s) => s.v), mx0 = Math.max(...all), step = mx0 > 500 ? 200 : mx0 > 200 ? 100 : mx0 > 100 ? 50 : mx0 > 50 ? 20 : mx0 > 20 ? 10 : 5;
  const mx = Math.ceil(mx0 / step) * step || step, y = (v) => T + (h - T - B) * (1 - v / mx), out = [];
  for (let v = 0; v <= mx; v += step) out.push(`<line x1="${L}" x2="${w - 4}" y1="${y(v)}" y2="${y(v)}" class="ax"/><text x="${L - 5}" y="${y(v) + 4}" text-anchor="end">${v}</text>`);
  const nc = W.cats.length, cw = (w - L - 8) / nc;
  W.cats.forEach((c, i) => out.push(`<text x="${L + cw * i + cw / 2}" y="${h - 10}" text-anchor="middle">${esc(c)}</text>`));
  if (W.kind === "bar") {
    const ns = W.series.length, bw = Math.min(22, (cw - 8) / ns);
    W.series.forEach((s, k) => s.v.forEach((v, i) => { const x = L + cw * i + cw / 2 - (ns * bw) / 2 + k * bw; out.push(`<rect x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${(y(0) - y(v)).toFixed(1)}" rx="2" fill="${CHART_COL[k % 6]}"/>`); }));
  } else {
    W.series.forEach((s, k) => {
      const pts = s.v.map((v, i) => `${(L + cw * i + cw / 2).toFixed(1)},${y(v).toFixed(1)}`);
      out.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${CHART_COL[k % 6]}" stroke-width="2.5" stroke-linejoin="round"/>`);
      pts.forEach((p) => { const [px, py] = p.split(","); out.push(`<circle cx="${px}" cy="${py}" r="3" fill="${CHART_COL[k % 6]}"/>`); });
    });
  }
  const leg = W.series.map((s, k) => `<span><i style="background:${CHART_COL[k % 6]}"></i>${esc(s.n)}</span>`).join("");
  return `<div class="chart"><b>${esc(W.title)}</b><svg viewBox="0 0 ${w} ${h}">${out.join("")}</svg><div class="leg">${leg}</div>${W.unit ? `<small class="muted">${esc(W.unit)}</small>` : ""}</div>`;
}
const W2TIPS = ["Kirish (2 gap): savolni o'z so'zing bilan qayta yoz va fikringni aniq ayt.", "1-asosiy paragraf: birinchi sabab, tushuntirish, aniq misol.", "2-asosiy paragraf: ikkinchi sabab yoki qarama-qarshi fikr va unga javob.", "Xulosa (2 gap): fikringni boshqa so'zlar bilan takrorla. Yangi g'oya qo'shma."];
const W1TIPS = ["Kirish: grafik nimani ko'rsatishini o'z so'zing bilan yoz (savolni ko'chirma).", "Overview: 2 ta eng asosiy tendensiya, raqamsiz. Bu paragrafsiz 6 dan oshmaydi.", "2 ta tafsilot paragrafi: eng muhim raqamlar va taqqoslashlar.", "O'z fikringni yozma: faqat ma'lumot."];
function ieWriting(kind, id, a) {
  a = a || {};
  const W = ieGet(kind, id), minW = a.minW || (kind === "w2" ? 250 : 150), lim = (a.lim || (kind === "w2" ? 40 : 20)) * 60;
  const dr = S.wdraft && S.wdraft.id === W.id && S.wdraft.kind === kind ? S.wdraft : null;
  if (dr) return ieWrEditor(kind, W, a, dr);
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>Writing ${kind === "w2" ? "Task 2" : "Task 1"}</h2></div>
    <div class="card"><span class="tag pink">${a.mock ? "Sinov imtihoni · " : ""}${lim / 60} daqiqa · kamida ${minW} so'z</span>
      <div class="rule wq">${esc(W.q)}</div>${kind === "w1" ? ieChart(W) : ""}
      <details><summary class="muted">O'zbekchasi</summary><span class="muted">${esc(W.uz || "")}</span></details></div>
    ${a.part ? `<section class="card ypart"><b>Bugungi vazifa</b><span>${esc(a.part)}</span><span class="muted small">Yozish oynasida “Shablon” tugmasi bor: tayyor gaplarni bosib qo'yib, bo'sh joylarini to'ldirsang bo'ladi.</span></section>` : ""}
    <section class="card"${a.part ? " hidden" : ""}><b>Reja (yozishdan oldin 3–5 daqiqa o'yla)</b><ol class="urules">${(kind === "w2" ? W2TIPS : W1TIPS).map((t) => `<li>${esc(t)}</li>`).join("")}</ol>
      ${W.ideas ? `<details><summary class="muted">G'oyalar kerak bo'lsa</summary><ul class="cando">${W.ideas.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></details>` : ""}</section>
    <div class="grow"></div>
    <button class="btn main" id="go" type="button">Yozishni boshlash · ${lim / 60}:00</button>`);
  $("quit").onclick = ieBack;
  $("go").onclick = () => ieWrEditor(kind, W, a, null);
}
// shablon: bo'sh joyli tayyor gaplar. Bosilsa, matnga qo'shiladi; ___ lar to'ldirilmaguncha topshirib bo'lmaydi
const WTPL = {
  line: [["Kirish", ["The line graph illustrates ___ in ___ from ___ to ___."]], ["Overview", ["Overall, ___ increased over the period, while ___ decreased.", "___ had the highest figure during the whole period."]], ["Tafsilot", ["In ___, ___ stood at ___.", "It then rose to ___ in ___ and reached ___ in ___.", "By contrast, ___ fell from ___ to ___.", "___ was higher than ___ until ___."]]],
  bar: [["Kirish", ["The bar chart compares ___ in ___ and ___."]], ["Overview", ["Overall, ___ was the most popular, while ___ was the least common.", "The biggest change was in ___."]], ["Tafsilot", ["In ___, ___% of ___ ___, compared with ___% in ___.", "The figure for ___ fell from ___% to ___%.", "By contrast, ___ rose from ___% to ___%.", "___ stayed the same at ___%."]]],
  pie: [["Kirish", ["The pie charts compare ___ in ___ and ___."]], ["Overview", ["Overall, ___ made up the largest share in ___, while ___ was the smallest.", "___ grew the most, while ___ fell."]], ["Tafsilot", ["___ accounted for ___% in ___, but this fell to ___% in ___.", "By contrast, ___ rose from ___% to ___%.", "___ remained the same at ___%."]]],
  table: [["Kirish", ["The table shows ___ in ___."]], ["Overview", ["Overall, ___ had the highest figures, while ___ had the lowest.", "In all cases, the largest amount was for ___."]], ["Tafsilot", ["___ spent ___ on ___, compared with ___ in ___.", "The lowest figure was for ___, at ___.", "___ was about twice as high as ___."]]],
  w2: [["Kirish", ["It is often argued that ___.", "I completely agree with this view because ___.", "I partly agree with this view because ___, but ___."]], ["Asosiy paragraf", ["Firstly, ___.", "This is because ___.", "For example, ___.", "As a result, ___.", "Secondly, ___.", "On the other hand, ___. However, I believe ___."]], ["Xulosa", ["In conclusion, I believe that ___ because ___."]]],
};
function ieWrEditor(kind, W, a, dr) {
  const minW = a.minW || (kind === "w2" ? 250 : 150), lim = (a.lim || (kind === "w2" ? 40 : 20)) * 60;
  const tpl = a.mock ? null : WTPL[kind === "w2" ? "w2" : W.kind] || WTPL.line;
  const d = dr || { id: W.id, kind, text: "", t0: Date.now(), mock: !!a.mock };
  S.wdraft = d; save();
  html(`<div class="bar iebar"><button class="x" id="quit" type="button" aria-label="Chiqish">×</button><div class="ietime" id="tm">${mmss(lim)}</div><span class="wcount" id="wc">0/${minW}</span></div>
    <details class="card wqd"><summary><b>Savol</b> <span class="muted">(ochish)</span></summary><div class="rule wq">${esc(W.q)}</div>${kind === "w1" ? ieChart(W) : ""}</details>
    ${tpl ? `<details class="card wqd wtpl"><summary><b>Shablon</b> <span class="muted">(tayyor gaplar)</span></summary><span class="muted small tplt">Gapni bossang, matnga qo'shiladi. Keyin ___ o'rniga o'z so'z va raqamlaringni yoz.</span>${tpl.map((g, gi) => `<span class="tplh">${esc(g[0])}</span>${g[1].map((f) => `<button class="tplb" data-g="${gi}" data-f="${esc(f)}" type="button">${esc(f)}</button>`).join("")}`).join("")}</details>` : ""}
    <textarea class="wbox" id="wb" spellcheck="false" autocapitalize="sentences" placeholder="Shu yerga yoz. Paragraflar orasida bo'sh qator qoldir."></textarea>
    <button class="btn main" id="sub" type="button" disabled>Topshirish</button>`);
  const tb = $("wb");
  tb.value = d.text;
  let tSave = 0;
  const upd = () => {
    const wc = (tb.value.trim().match(/\S+/g) || []).length;
    $("wc").textContent = `${wc}/${minW}`; $("wc").classList.toggle("ok", wc >= minW);
    const gaps = /_{3}/.test(tb.value);
    $("sub").disabled = wc < minW || gaps;
    $("sub").textContent = wc < minW ? `Yana ${minW - wc} so'z kerak` : gaps ? "Bo'sh joylarni (___) to'ldir" : "Topshirish";
    d.text = tb.value; clearTimeout(tSave); tSave = setTimeout(save, 800);
  };
  tb.oninput = upd; upd();
  on(".tplb", (e) => {
    // bir bo'limning gaplari bitta xatboshida, yangi bo'lim (Kirish -> Overview) yangi xatboshidan
    const f = e.currentTarget.dataset.f, gi = e.currentTarget.dataset.g, v = tb.value.replace(/\s+$/, "");
    tb.value = v + (!v ? "" : d.tg === gi ? " " : "\n\n") + f; d.tg = gi;
    e.currentTarget.classList.add("used");
    const dt = e.currentTarget.closest("details"); if (dt) dt.open = false;
    upd(); tb.focus();
    const k = tb.value.indexOf("___"); if (k >= 0) try { tb.setSelectionRange(k, k + 3); } catch {}
  });
  every(() => {
    const el = $("tm"); if (!el) return;
    const left = lim - (Date.now() - d.t0) / 1000;
    el.textContent = left >= 0 ? mmss(left) : mmss(left) + " vaqtdan oshdi";
    el.classList.toggle("low", left < 300);
  }, 1000);
  $("quit").onclick = () => ieAsk("Chiqasanmi?", "Yozganing saqlanadi, keyin shu yerdan davom etasan. Lekin qadam bajarilmaydi.", "Yozishni davom ettirish", "Chiqish", ieBack);
  $("sub").onclick = () => {
    const text = tb.value.trim(), sec = (Date.now() - d.t0) / 1000;
    S.wdraft = null; save();
    ieWrResult(kind, W, text, sec, a);
  };
}
function ieWrResult(kind, W, text, sec, a) {
  WR_TOPIC = (W.q.toLowerCase().match(/[a-z]+/g) || []).join(" ");
  const st = wrStats(text, kind), bd = wrBand(st, kind), H = ieH();
  const entry = { k: kind, id: W.id, words: st.wc, sec: Math.round(sec), at: Date.now(), band: a.part ? null : bd.all, text, mock: !!a.mock };
  if (a.part) entry.part = 1;
  H.wr.push(entry);
  if (H.wr.length > 60) H.wr.splice(0, H.wr.length - 60);
  ieUsed(kind, W.id);
  addXP(a.part ? 20 : 40); bumpStreak(); save();
  ustozEvent(kind, { id: W.id, words: st.wc });
  if (a.part) return ieWrPart(kind, W, text, sec, a, st);
  const tips = [];
  if (kind === "w2" && st.paras < 4) tips.push(`Paragraflar ${st.paras} ta. Task 2 da 4–5 paragraf bo'lsin: kirish, 2 asosiy, xulosa.`);
  if (kind === "w2" && !st.conc) tips.push("Xulosa yo'q. Oxirida \"In conclusion, ...\" bilan fikringni qayta ayt.");
  if (kind === "w1" && !st.ovw) tips.push("Overview yo'q! \"Overall, ...\" bilan 2 ta asosiy tendensiyani yoz. Bu Task 1 dagi eng muhim gap.");
  if (kind === "w1" && st.nums < 5) tips.push(`Raqamlar kam (${st.nums} ta). Task 1 da aniq ma'lumot keltir.`);
  if (kind === "w1" && st.first) tips.push("Task 1 da o'z fikringni (I, my) yozma.");
  if (st.links.length < 5) tips.push(`Bog'lovchilar kam (${st.links.length} ta). However, Moreover, As a result, For example kabi so'zlar bilan gaplarni bog'la.`);
  if (st.contr.length) tips.push(`Qisqartmalar bor: ${st.contr.slice(0, 4).join(", ")}. Akademik yozuvda to'liq yoz: do not, it is.`);
  if (st.over.length) tips.push(`Takror so'zlar: ${st.over.map(([w, c]) => `${w} (${c})`).join(", ")}. Sinonim ishlat.`);
  if (st.avgLen < 11) tips.push("Gaplar juda qisqa. Ba'zilarini which, because, although bilan qo'shib murakkab gap qil.");
  if (st.avgLen > 34) tips.push("Gaplar juda uzun. Uzun gapni ikkiga bo'l, xato kamayadi.");
  if (!tips.length) tips.push("Tuzilish yaxshi. Endi so'z boyligi va grammatik aniqlikka e'tibor ber.");
  const mins = Math.round(sec / 60), limM = kind === "w2" ? 40 : 20;
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Chiqish">×</button><h2>Writing tahlili</h2></div>
    <div class="stats"><div class="stat"><b>${st.wc}</b><span>so'z</span></div><div class="stat"><b>${mins}</b><span>daqiqa ${mins > limM ? "(ko'p)" : ""}</span></div><div class="stat"><b>${bd.all.toFixed(1)}</b><span>taxminiy band</span></div></div>
    <section class="card"><b>Ustoz tekshiruvi (tuzilish bo'yicha)</b><ul class="cando">${tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      <div class="qrow"><span>Task response ${bd.tr.toFixed(1)} · Coherence ${bd.cc.toFixed(1)}</span></div><div class="qrow"><span>Vocabulary ${bd.lr.toFixed(1)} · Grammar ${bd.gr.toFixed(1)}</span></div>
      <span class="muted small">Ilova grammatika xatolarini to'liq ko'ra olmaydi. Aniq baho uchun pastdagi AI yoki Claude tekshiruvidan foydalan.</span></section>
    <section class="card"><b>AI tekshiruvchi</b><div class="aifb" id="aifb">${aiReady() ? "Bosganingda telefondagi AI inshoni tekshiradi (internet kerak emas, 1–2 daqiqa)." : "AI uchun Andrew'ning miyasini yuklab ol: Mashq → AI suhbatdosh."}</div>${aiReady() ? `<button class="btn ghost" id="aig" type="button">AI bilan tekshirish</button>` : ""}</section>
    <section class="card"><b>Claude'ga yubor: eng aniq baho</b><span class="muted">Nusxa ol va loyihadagi suhbatga joylashtir. Men band va xatolarni to'liq yozib beraman.</span><button class="btn ghost" id="cp" type="button">Nusxa olish</button>
      <label class="ufield"><span>Ustoz bergan band</span><select id="cb"><option value="">—</option>${[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8].map((b) => `<option value="${b}">${b.toFixed(1)}</option>`).join("")}</select></label></section>
    <details class="card"><summary><b>Yozganing</b></summary><div class="aifb">${esc(text)}</div></details>
    <div class="grow"></div>
    <button class="btn main" id="go" type="button">Davom etish</button>`);
  $("go").onclick = ieBack; $("quit").onclick = ieBack;
  $("cp").onclick = () => {
    const t = `IELTS Writing ${kind === "w2" ? "Task 2" : "Task 1"}\nSavol: ${W.q}\n\nMening javobim (${st.wc} so'z, ${mins} daqiqa):\n\n${text}\n\nBaholab ber: band va xatolarim.`;
    lateToast(ieCopy(t) ? "Nusxa olindi. Loyihadagi suhbatga joylashtir." : "Nusxa olinmadi");
  };
  $("cb").onchange = (e) => { const v = +e.target.value; if (v) { entry.cb = v; save(); lateToast("Saqlandi"); } };
  if ($("aig")) $("aig").onclick = () => {
    $("aig").remove();
    ieAI(`You are a strict but fair IELTS Writing examiner. The learner is from Uzbekistan, around B1-B2. Reply in English, short, in exactly this format:
Band: <overall band, like 5.5>
TR: <band> - <one short sentence>
CC: <band> - <one short sentence>
LR: <band> - <one short sentence>
GRA: <band> - <one short sentence>
Mistakes:
1. <wrong words from the essay> -> <corrected words>
2. ...
3. ...
4. ...
5. ...
Tip: <the one most important thing to improve>`, `${kind === "w2" ? "Task 2" : "Task 1"} question: ${W.q}${kind === "w1" ? `\nData: ${ieDataText(W)}` : ""}\n\nEssay (${st.wc} words):\n${text}`, $("aifb"), (b) => { if (b) { entry.ab = b; save(); } });
  };
}
// yo'l darsidagi qisman yozuv (faqat kirish yoki bitta paragraf): namuna bilan solishtirish
function ieWrPart(kind, W, text, sec, a, st) {
  const mins = Math.max(1, Math.round(sec / 60));
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Chiqish">×</button><h2>Yozganing</h2></div>
    <div class="stats"><div class="stat"><b>${st.wc}</b><span>so'z</span></div><div class="stat"><b>${mins}</b><span>daqiqa</span></div></div>
    <section class="card"><b>Sening javobing</b><div class="aifb">${esc(text)}</div></section>
    ${a.model ? `<section class="card"><b>Namuna javob</b><div class="aifb">${esc(a.model)}</div><span class="muted small">Bir xil bo'lishi shart emas. Tuzilishi o'xshashmi, shunga qara.</span></section>` : ""}
    ${a.chk ? `<section class="card"><b>O'zingni tekshir</b>${a.chk.map((c, i) => `<button class="mrow" data-ck="${i}" type="button"><span class="mchk"></span><span>${esc(c)}</span></button>`).join("")}</section>` : ""}
    <section class="card"><b>Claude'ga yubor: aniq tekshiruv</b><span class="muted">Nusxa ol va loyihadagi suhbatga joylashtir. Xatolaringni yozib beraman.</span><button class="btn ghost" id="cp" type="button">Nusxa olish</button></section>
    <div class="grow"></div>
    <button class="btn main" id="go" type="button">Davom etish</button>`);
  $("go").onclick = ieBack; $("quit").onclick = ieBack;
  on("[data-ck]", (e) => { const b = e.currentTarget, onn = b.classList.toggle("on"); b.querySelector(".mchk").innerHTML = onn ? CHECK : ""; });
  $("cp").onclick = () => {
    const t = `IELTS Writing ${kind === "w2" ? "Task 2" : "Task 1"} (qisman mashq)\nSavol: ${W.q}\nVazifa: ${a.part}\n\nMening javobim (${st.wc} so'z):\n\n${text}\n\nXatolarimni ko'rsatib ber.`;
    lateToast(ieCopy(t) ? "Nusxa olindi. Loyihadagi suhbatga joylashtir." : "Nusxa olinmadi");
  };
}
const ieDataText = (W) => W.series.map((s) => `${s.n}: ${W.cats.map((c, i) => `${c} ${s.v[i]}`).join(", ")}`).join("; ") + (W.unit ? ` (${W.unit})` : "");
// telefondagi AI bilan bir martalik tekshiruv
function ieAI(sys, msg, el, onBand) {
  let buf = "";
  el.textContent = "AI yuklanmoqda...";
  AI = {
    on: (m) => {
      if (m.t === "yuklanmoqda") el.textContent = "AI yuklanmoqda (birinchi marta biroz vaqt oladi)...";
      else if (m.t === "tayyor") { el.textContent = "Tekshiryapti..."; try { NATIVE.aiYoz(msg); } catch { el.textContent = "AI ishlamadi."; } }
      else if (m.t === "bolak") { buf += m.s; el.textContent = buf.replace(/[*#`]/g, ""); }
      else if (m.t === "tugadi") { const b = /band\s*:?\s*(\d(?:\.5)?)/i.exec(buf); if (onBand) onBand(b ? Math.max(3, Math.min(9, +b[1])) : null); AI = null; }
      else if (m.t === "xato") { el.textContent = "AI xato berdi: " + (m.s || ""); AI = null; }
    },
  };
  try { NATIVE.aiBoshla(sys); } catch { el.textContent = "AI ishga tushmadi."; AI = null; }
}
// namunaviy insho: kamida 90 soniya o'qish
function ieModel(id) {
  const M = ieGet("model", id), t0 = Date.now();
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>Namunaviy insho</h2></div>
    <div class="card"><span class="tag pink">Band 7+ · ${esc(M.type)}</span><div class="rule wq">${esc(M.q)}</div>${M.chart ? ieChart(M.chart) : ""}</div>
    ${M.paras.map((p) => `<section class="card mpara"><span class="tag en">${esc(p[0])}</span><div class="rule">${esc(p[1])}</div><span class="muted small">${esc(p[2])}</span></section>`).join("")}
    <section class="card"><b>Shu insho ishlatgan iboralar</b><ul class="cando">${M.phr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>
    <div class="grow"></div>
    <button class="btn main" id="go" type="button" disabled>O'qiyapman...</button>`);
  $("quit").onclick = ieBack;
  every(() => { const b = $("go"); if (!b) return; const s = 90 - Math.floor((Date.now() - t0) / 1000); if (s > 0) b.textContent = `Diqqat bilan o'qi · ${s}`; else { b.disabled = false; b.textContent = "O'qidim, tushundim"; } }, 1000);
  $("go").onclick = () => { ustozEvent("model", {}); ieBack(); };
}

// ---------- SPEAKING ----------
// uzun javob: telefon har jimlikda to'xtaydi, biz esa vaqt tugaguncha qayta-qayta yoqamiz va matnni yig'amiz
function hearLong(maxSec, onUpd, onEnd) {
  let text = "", stopped = false, ending = false;
  const t0 = Date.now();
  const fin = (err) => { if (stopped) return; stopped = true; stopHear(); onEnd(text.trim(), err || null, (Date.now() - t0) / 1000); };
  const go = () => {
    if (stopped) return;
    if (ending || (Date.now() - t0) / 1000 >= maxSec) return fin();
    hear((err, alts) => {
      if (stopped) return;
      if (err) {
        if (/^(9|ruxsat|not-allowed|service-not-allowed|mavjud-emas)$/.test(err)) return fin(err);
        return ending ? fin() : later(go, err === "8" ? 700 : 250);
      }
      const s = (alts[0] || "").trim();
      if (s) { text += (text ? " " : "") + s; onUpd(text); }
      if (ending) return fin();
      later(go, 150);
    });
  };
  go();
  return {
    // "Tugatdim": telefon hozirgacha eshitganini qaytarsin, keyin to'xtaymiz
    stop: () => {
      if (stopped || ending) return;
      ending = true;
      try { if (NATIVE && NATIVE.yakunla) NATIVE.yakunla(); else if (srObj) srObj.stop(); } catch {}
      later(() => fin(), 2500);
    },
    secs: () => (Date.now() - t0) / 1000,
  };
}
const FILLERS = ["um", "uh", "erm", "like", "you know", "i mean", "kind of", "sort of"];
function spStats(answers) {
  const all = answers.map((x) => x.text).join(" "), words = normWords(all), n = words.length;
  const secs = answers.reduce((s, x) => s + x.secs, 0);
  const content = words.filter((w) => !STOPW.has(w) && w.length > 3);
  const lt = all.toLowerCase();
  return {
    words: n, secs, wpm: Math.round(n / Math.max(0.2, secs / 60)),
    uniq: new Set(content).size / Math.max(1, content.length),
    links: LINKERS.filter((l) => lt.includes(l)).length,
    complex: (lt.match(/\b(although|which|who|because|if|when|while|unless|whereas|so that)\b/g) || []).length,
    fill: FILLERS.reduce((s, f) => s + (lt.match(new RegExp(`\\b${f}\\b`, "g")) || []).length, 0),
  };
}
function spBand(s) {
  const fl = s.wpm >= 140 ? 7 : s.wpm >= 115 ? 6.5 : s.wpm >= 95 ? 6 : s.wpm >= 75 ? 5.5 : s.wpm >= 55 ? 5 : 4.5;
  const lx = (s.uniq >= 0.62 ? 6.5 : s.uniq >= 0.5 ? 6 : 5.5) + (s.links >= 4 ? 0.5 : 0);
  const gr = s.complex >= 6 ? 6.5 : s.complex >= 3 ? 6 : 5.5;
  return ieRound(Math.min(7, (fl + lx + gr) / 3));
}
function ieSpeaking(part, a) {
  a = a || {};
  const P1 = ieGet("p1", a.id), P2 = ieGet("p2", a.id);
  let qs, minW, maxS, title;
  if (part === 1) { qs = P1.q.slice(0, 4); minW = 15; maxS = 40; title = `Part 1 · ${P1.t}`; }
  else if (part === 3) { qs = P2.p3.slice(0, 3); minW = 25; maxS = 70; title = `Part 3 · ${P2.t}`; }
  else return ieCue(P2, a);
  ieAskLoop(part, qs, minW, maxS, title, a, P1, P2);
}
function ieAskLoop(part, qs, minW, maxS, title, a, P1, P2) {
  const answers = [];
  let qi = 0, retry = false;
  const ask = () => {
    if (qi >= qs.length) return ieSpDone(part, answers, a, part === 1 ? P1 : P2);
    const q = qs[qi];
    let rec = null, txt = "";
    html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Chiqish">×</button><div class="prog"><i style="width:${(qi / qs.length) * 100}%"></i></div><span class="stage">${qi + 1}/${qs.length}</span></div>
      <div class="task-title">${esc(title)}</div>
      <div class="card"><span class="tag en">Examiner</span><div class="word sm">${esc(q)} <button class="say" id="sw" type="button" aria-label="Tinglash">${SPK}</button></div></div>
      <div class="card"><span class="tag uz">Sen</span><div class="sptext" id="st"><span class="muted">${retry ? "Kengaytirib qayta javob ber: javob + sabab + misol." : part === 1 ? "2–3 gap bilan javob ber: javob, sabab, misol." : "Fikringni ayt, sababini tushuntir, misol keltir. Kamida 4 gap."}</span></div></div>
      <div class="grow"></div>
      <p class="center heard" id="msg">${canHear ? "Savol o'qilyapti..." : "Bu oynada mikrofon ishlamaydi. Yodla ilovasini telefonda och."}</p>
      <div class="micwrap"><button class="mic" id="mic" type="button" aria-label="Gapirish" ${canHear ? "" : "disabled"}>${MIC}</button></div>
      <button class="btn main" id="done" type="button" disabled>Tugatdim</button>`);
    const msg = $("msg"), st = $("st");
    const begin = () => {
      if (!canHear || rec || !document.body.contains(msg)) return;
      $("mic").classList.add("on"); msg.textContent = "Gapir, eshityapman... Tugatgach, \"Tugatdim\"ni bos."; $("done").disabled = false;
      rec = hearLong(maxS, (t) => { txt = t; st.textContent = t; }, (t, err, secs) => {
        if (!document.body.contains(msg)) return;
        $("mic").classList.remove("on");
        if (err) { rec = null; msg.textContent = hearError(err); $("done").disabled = true; return; }
        const n = normWords(t).length;
        if (n < minW && !retry) {
          retry = true; rec = null;
          msg.innerHTML = `Javob juda qisqa (${n} so'z). IELTS'da bunday javob past baho oladi. Qayta, kengroq javob ber.`;
          ding(false); later(() => ask(), 2200); return;
        }
        answers.push({ q, text: t, secs, words: n });
        qi++; retry = false; stat("spoken");
        later(ask, 400);
      });
    };
    $("sw").onclick = () => ieSay(q, EXAM_V);
    $("mic").onclick = () => { if (!rec) begin(); };
    $("done").onclick = () => { if (rec) { $("done").disabled = true; msg.textContent = "Tugatyapman..."; rec.stop(); } };
    $("quit").onclick = () => ieAsk("Chiqasanmi?", "Chiqsang, bu qism hisoblanmaydi.", "Davom etish", "Chiqish", () => { stopHear(); ieBack(); });
    loadPack2().then(() => { if (document.body.contains(msg)) ieSay(q, EXAM_V, () => later(begin, 250)); });
  };
  ask();
}
// Part 2: kartochka, 1 daqiqa tayyorgarlik, 1–2 daqiqa gapirish
function ieCue(P2, a) {
  let prep = 60;
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Chiqish">×</button><div class="ietime" id="tm">1:00</div></div>
    <div class="task-title">Part 2 · tayyorgarlik</div>
    <div class="card cue"><b>${esc(P2.t)}</b><span class="muted">You should say:</span><ul>${P2.b.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>${P2.e ? `<span>${esc(P2.e)}</span>` : ""}</div>
    <textarea class="wbox notes" id="nt" placeholder="Qisqa eslatmalar (faqat kalit so'zlar)"></textarea>
    <span class="muted small">Har bandga 2–3 gap rejala. 1 daqiqadan keyin gapirish o'zi boshlanadi: kamida 1 daqiqa, ko'pi bilan 2 daqiqa.</span>
    <div class="grow"></div>
    <button class="btn main" id="go" type="button">Tayyorman, gapiraman</button>`);
  loadPack2().then(() => { if ($("nt")) ieSay(IELTS.cueIntro(P2.t), EXAM_V); });
  every(() => { prep--; const el = $("tm"); if (el) el.textContent = mmss(Math.max(0, prep)); if (prep <= 0) talk(); }, 1000);
  $("quit").onclick = () => ieAsk("Chiqasanmi?", "Chiqsang, bu qism hisoblanmaydi.", "Davom etish", "Chiqish", () => { stopHear(); ieBack(); });
  let tries = 0;
  const talk = () => {
    stopTimers(); ieStopAudio();
    const notes = $("nt") ? $("nt").value : "";
    let rec = null;
    html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Chiqish">×</button><div class="ietime" id="tm">0:00</div></div>
      <div class="task-title">Part 2 · gapir (1–2 daqiqa)</div>
      <div class="card cue"><b>${esc(P2.t)}</b><ul>${P2.b.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>${notes.trim() ? `<span class="muted small">Eslatmang: ${esc(notes)}</span>` : ""}</div>
      <div class="card"><div class="sptext" id="st"><span class="muted">Gapira boshla...</span></div></div>
      <div class="grow"></div>
      <p class="center heard" id="msg">${canHear ? "Mikrofon yoqildi. To'xtamasdan gapir." : "Bu oynada mikrofon ishlamaydi."}</p>
      <div class="micwrap"><button class="mic on" id="mic" type="button" aria-label="Gapirish" disabled>${MIC}</button></div>
      <button class="btn main" id="done" type="button" disabled>Tugatdim</button>`);
    const t0 = Date.now(), msg = $("msg");
    every(() => { const s = (Date.now() - t0) / 1000, el = $("tm"); if (!el) return; el.textContent = mmss(s); el.classList.toggle("ok", s >= 60); const d = $("done"); if (d && rec) d.disabled = s < 60; }, 500);
    $("quit").onclick = () => ieAsk("Chiqasanmi?", "Chiqsang, bu qism hisoblanmaydi.", "Davom etish", "Chiqish", () => { stopHear(); ieBack(); });
    if (!canHear) return;
    rec = hearLong(120, (t) => { $("st").textContent = t; }, (t, err, secs) => {
      if (!document.body.contains(msg)) return;
      stopTimers(); $("mic").classList.remove("on");
      if (err) { msg.textContent = hearError(err); return; }
      const n = normWords(t).length;
      if ((n < 80 || secs < 55) && tries < 1) {
        tries++;
        msg.innerHTML = `${Math.round(secs)} soniya, ${n} so'z. Part 2 da kamida 1 daqiqa to'xtamasdan gapirish kerak. Yana bir urinish.`;
        ding(false); later(talk, 2800); return;
      }
      stat("spoken");
      const fq = P2.f && P2.f.length ? P2.f[0] : null;
      const ans = [{ q: P2.t, text: t, secs, words: n }];
      if (!fq) return ieSpDone(2, ans, a, P2);
      ieAskLoop(2, [fq], 6, 25, "Part 2 · qisqa savol", a, null, P2);
      ieAskLoop.carry = ans;
    });
    $("done").onclick = () => { if (rec) { $("done").disabled = true; msg.textContent = "Tugatyapman..."; rec.stop(); } };
  };
  $("go").onclick = talk;
}
function ieSpDone(part, answers, a, X) {
  if (part === 2 && ieAskLoop.carry) { answers = ieAskLoop.carry.concat(answers); ieAskLoop.carry = null; }
  const s = spStats(answers), band = spBand(s), H = ieH();
  const entry = { part, id: X ? X.id : "", words: s.words, secs: Math.round(s.secs), wpm: s.wpm, band, at: Date.now() };
  H.sp.push(entry);
  if (H.sp.length > 80) H.sp.splice(0, H.sp.length - 80);
  if (X && part !== 3) ieUsed(part === 1 ? "p1" : "p2", X.id);
  addXP(25); bumpStreak(); save();
  ustozEvent("sp", { part });
  const tips = [];
  if (s.wpm < 90) tips.push(`Tezlik ${s.wpm} so'z/daqiqa. Ravon nutq ~110–140. Ko'proq "Soya" mashqi qil, to'xtab qolma.`);
  if (s.links < 3) tips.push("Bog'lovchilar kam. Because, for example, on the other hand, to be honest bilan fikrni ulab gapir.");
  if (s.complex < 3) tips.push("Gaplar oddiy. If, when, which bilan murakkab gaplar qo'sh.");
  if (s.uniq < 0.5) tips.push("Bir xil so'zlar ko'p takrorlandi. Sinonimlar ishlat.");
  if (!tips.length) tips.push("Yaxshi! Endi talaffuz va aniq so'z tanlashga e'tibor ber.");
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Chiqish">×</button><h2>Speaking Part ${part}</h2></div>
    <div class="stats"><div class="stat"><b>${s.words}</b><span>so'z</span></div><div class="stat"><b>${s.wpm}</b><span>so'z/daqiqa</span></div><div class="stat"><b>${band.toFixed(1)}</b><span>taxminiy band</span></div></div>
    <section class="card"><b>Ustoz izohi</b><ul class="cando">${tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul><span class="muted small">Talaffuzni ilova to'liq baholay olmaydi: telefon tanigan matnga qaraladi.</span></section>
    ${answers.map((x) => `<details class="card"><summary><b>${esc(x.q)}</b> <span class="muted">· ${x.words} so'z</span></summary><div class="aifb">${esc(x.text || "...")}</div></details>`).join("")}
    <section class="card"><b>AI imtihonchi bahosi</b><div class="aifb" id="aifb">${aiReady() ? "Bosganingda telefondagi AI javoblaringni baholaydi." : "AI uchun Andrew'ning miyasini yuklab ol: Mashq → AI suhbatdosh."}</div>${aiReady() ? `<button class="btn ghost" id="aig" type="button">AI bilan baholash</button>` : ""}</section>
    <div class="grow"></div>
    <button class="btn main" id="go" type="button">Davom etish</button>`);
  $("go").onclick = ieBack; $("quit").onclick = ieBack;
  if ($("aig")) $("aig").onclick = () => {
    $("aig").remove();
    ieAI(`You are an IELTS Speaking examiner. The learner is from Uzbekistan, around B1-B2. His answers were written down by speech recognition, so ignore punctuation and spelling. Reply in English, short, in exactly this format:
Band: <overall band, like 5.5>
Fluency: <band> - <one short sentence>
Vocabulary: <band> - <one short sentence>
Grammar: <band> - <one short sentence>
Mistakes:
1. <his words> -> <better words>
2. ...
3. ...
Better answer: <a natural band 7 answer to the first question, under 60 words>`, answers.map((x, i) => `Q${i + 1}: ${x.q}\nA${i + 1}: ${x.text}`).join("\n\n"), $("aifb"), (b) => { if (b) { entry.ab = b; save(); } });
  };
}

// ---------- ballar, xatolar va IELTS zali ----------
function ieBands() {
  const H = ieH(), mean = (v) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : null);
  const last = (a, n, f) => a.slice(-n).map(f).filter((x) => x);
  const r = mean(last(H.rd, 4, (x) => x.band)), l = mean(last(H.ls, 4, (x) => x.band));
  const w = mean(last(H.wr, 3, (x) => x.cb || x.ab || x.band)), s = mean(last(H.sp, 4, (x) => x.ab || x.band));
  const have = [r, l, w, s].filter((x) => x);
  const rr = (x) => (x ? ieRound(x) : null);
  return { r: rr(r), l: rr(l), w: rr(w), s: rr(s), all: have.length >= 2 ? ieRound(mean(have)) : null };
}
function ieMistList() {
  const from = Date.now() - 8 * DAY, seen = new Set();
  return ieMistStore().filter((m) => m.at >= from && !m.done && ieGet(m.k === "rd" ? "reading" : "listening", m.id)).filter((m) => { const k = m.k + m.id + m.q; if (seen.has(k)) return false; seen.add(k); return true; });
}
function ieMistakes() {
  const list = ieMistList().slice(0, 15);
  if (!list.length) { ustozEvent("irev", {}); return ieBack(); }
  let i = 0, right = 0;
  const one = () => {
    if (i >= list.length) {
      list.forEach((m) => { m.done = Date.now(); });
      ieMistStore().forEach((m) => { if (list.some((x) => x.k === m.k && x.id === m.id && x.q === m.q)) m.done = m.done || Date.now(); });
      addXP(20); save(); ustozEvent("irev", {});
      html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Chiqish">×</button><h2>Xatolar tahlili</h2></div><div class="score">${right}/${list.length}</div><p class="center muted">ikkinchi urinishda to'g'ri. Qolganlarining sababini endi bilasan.</p><div class="grow"></div><button class="btn main" id="go" type="button">Davom etish</button>`);
      $("go").onclick = ieBack; $("quit").onclick = ieBack;
      return;
    }
    const m = list[i], X = ieGet(m.k === "rd" ? "reading" : "listening", m.id), q = X.qs[m.q];
    let ctxt = "";
    if (m.k === "rd") { const p = q.ev ? X.paras.find((x) => x.includes(q.ev.slice(0, 40))) : q.k === "head" ? X.paras[q.p] : null; ctxt = p ? `<div class="ev">${esc(p)}</div>` : ""; }
    else if (q.line >= 0) ctxt = `<button class="btn ghost" id="pl" type="button">${SPK} Audio qismini eshitish</button>`;
    const one1 = { qs: [q], lim: X.lim, heads: X.heads };
    html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Chiqish">×</button><div class="prog"><i style="width:${(i / list.length) * 100}%"></i></div><span class="stage">${i + 1}/${list.length}</span></div>
      <div class="task-title">${m.k === "rd" ? "Reading" : "Listening"} xatosi · ${esc(X.title)}</div>
      ${ctxt}
      <div class="ieqs">${ieQOne(q, 0, one1)}</div>
      <p class="muted small">Oldin javobing: ${esc(ieShow(q, m.u, X))}. Endi o'yla va qayta javob ber.</p>
      <div class="grow"></div>
      <button class="btn main" id="chk" type="button">Tekshirish</button>`);
    const ans = [null];
    ieBindQs(ans, () => {});
    if ($("pl")) { loadPack2(); $("pl").onclick = () => { const l = X.lines[q.line]; ieSay(l[1], X.v[l[0]] || EXAM_V); }; }
    $("quit").onclick = ieBack;
    $("chk").onclick = () => {
      const ok = ieCorrect(q, ans[0]);
      if (ok) right++;
      ding(ok);
      $("chk").remove();
      const box = document.createElement("div");
      box.className = "card";
      box.innerHTML = `<b class="${ok ? "okc" : "noc"}">${ok ? "To'g'ri!" : "Yana xato."}</b><span>To'g'ri javob: <b class="okc">${esc(ieRight(q, X))}</b></span>${q.ev ? `<div class="ev">“${esc(q.ev)}”</div>` : m.k === "ls" && q.line >= 0 ? `<div class="ev">“${esc(X.lines[q.line][1])}”</div>` : ""}${q.uz ? `<span class="muted">${esc(q.uz)}</span>` : ""}<button class="btn main" id="nx" type="button">Keyingi</button>`;
      $app.appendChild(box);
      box.scrollIntoView({ behavior: "smooth", block: "end" });
      $("nx").onclick = () => { i++; one(); };
    };
  };
  one();
}
function ieHub() {
  if (uOn() && uGate()) return ustozHome();
  const H = ieH(), cnt = (k, id) => H[k].filter((x) => x.id === id).length, bd = ieBands();
  const sec = (t, items) => `<div class="sec">${t}</div><div class="list">${items}</div>`;
  const item = (attr, num, title, sub, done) => `<button class="item ${done ? "done" : ""}" ${attr} type="button"><span class="num">${done ? CHECK : num}</span><span class="body"><span class="title">${esc(title)}</span><span class="sub">${esc(sub)}</span></span></button>`;
  html(`<div class="bar"><button class="x" id="quit" type="button" aria-label="Orqaga">←</button><h2>IELTS zali</h2></div>
    <section class="card"><b>Erkin mashq</b><span class="muted">Bu yerdagi mashqlar ballaringga qo'shiladi, lekin Ustoz jadvalini almashtirmaydi.</span>
      <div class="qrow"><span>Reading ${bd.r ? bd.r.toFixed(1) : "—"} · Listening ${bd.l ? bd.l.toFixed(1) : "—"}</span><span>Writing ${bd.w ? bd.w.toFixed(1) : "—"} · Speaking ${bd.s ? bd.s.toFixed(1) : "—"}</span></div></section>
    ${sec("Reading", IELTS.reading.map((r, i) => item(`data-rd="${r.id}"`, i + 1, r.title, `${r.min} daqiqa · ${r.qs.length} savol${cnt("rd", r.id) ? ` · ${cnt("rd", r.id)} marta` : ""}`, cnt("rd", r.id))).join(""))}
    ${sec("Listening", IELTS.listening.map((l, i) => item(`data-ls="${l.id}"`, i + 1, l.title, `${l.part}-qism · ${l.qs.length} savol${cnt("ls", l.id) ? ` · ${cnt("ls", l.id)} marta` : ""}`, cnt("ls", l.id))).join(""))}
    ${sec("Writing Task 1", IELTS.w1.map((w, i) => item(`data-w1="${w.id}"`, i + 1, w.title, KIND_UZ[w.kind] || w.kind, H.wr.some((x) => x.id === w.id))).join(""))}
    ${sec("Writing Task 2", IELTS.w2.map((w, i) => item(`data-w2="${w.id}"`, i + 1, w.topic, w.q, H.wr.some((x) => x.id === w.id))).join(""))}
    ${sec("Namunaviy insholar", IELTS.models.map((m, i) => item(`data-md="${m.id}"`, i + 1, m.type, m.q, false)).join(""))}
    ${sec("Speaking Part 1", IELTS.p1.map((p, i) => item(`data-p1="${p.id}"`, i + 1, p.t, p.q[0], H.sp.some((x) => x.id === p.id && x.part === 1))).join(""))}
    ${sec("Speaking Part 2 va 3", IELTS.p2.map((p, i) => item(`data-p2="${p.id}"`, i + 1, p.t, p.b.join(" · "), H.sp.some((x) => x.id === p.id && x.part === 2))).join(""))}
  `);
  $("quit").onclick = () => (IEFROM === "practice" || !uOn() ? practiceTab() : ustozHome());
  on("[data-rd]", (e) => ieReading(e.currentTarget.dataset.rd));
  on("[data-ls]", (e) => ieListening(e.currentTarget.dataset.ls));
  on("[data-w1]", (e) => ieWriting("w1", e.currentTarget.dataset.w1));
  on("[data-w2]", (e) => ieWriting("w2", e.currentTarget.dataset.w2));
  on("[data-md]", (e) => ieModel(e.currentTarget.dataset.md));
  on("[data-p1]", (e) => ieSpeaking(1, { id: e.currentTarget.dataset.p1 }));
  on("[data-p2]", (e) => { const id = e.currentTarget.dataset.p2; ieSpeaking(2, { id }); });
}
