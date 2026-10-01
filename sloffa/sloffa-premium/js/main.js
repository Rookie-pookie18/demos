/* SLOFFA (fictional) — premium demo, home page.
   Four pinned chapters drive one story (the box opens, the shoe floats out, hangs about, comes apart):
   real footage on desktop (film.js), the code-built 3D version on phones (stage.js).
   Everything after that is regular page with a 3D customiser. */
import { SWATCHES, PARTS, DEFAULT_COLORS, MODELS, ORDER, inr } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mobile = matchMedia('(max-width:900px)').matches;
const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
if (fine) root.classList.add('fine');
const FONT = '"Bricolage Grotesque", system-ui, sans-serif';
// desktop gets the footage; phones keep the 3D version until there are portrait videos
const filmMode = !mobile && matchMedia('(orientation: landscape)').matches;
if (filmMode) {
  root.classList.add('film');
  // WebM for Chrome / Edge / Firefox (smaller), MP4 for Safari
  const webm = document.createElement('video').canPlayType('video/webm; codecs="vp9"') !== '';
  $$('#film video').forEach((v) => { v.src = webm ? v.dataset.src.replace('.mp4', '.webm') : v.dataset.src; v.load(); });
}

// ── lazy mode (everything at half speed) ─────────────────────────
let lazy = false;
try { lazy = localStorage.getItem('sloffa-lazy') === '1'; } catch {}
const lazyBtn = $('.lazy-tg');
function setLazy(on) {
  lazy = on; root.classList.toggle('lazy', on); lazyBtn.setAttribute('aria-pressed', String(on));
  try { localStorage.setItem('sloffa-lazy', on ? '1' : '0'); } catch {}
  if (lenis) lenis.options.lerp = on ? 0.045 : 0.09;
}
lazyBtn.addEventListener('click', () => { setLazy(!lazy); toast(lazy ? 'Lazy mode on. Everything at half speed. You\'re welcome.' : 'Lazy mode off. Bit much, honestly.'); });

// ── smooth scroll ────────────────────────────────────────────────
let lenis = null;
if (!reduced && window.Lenis) lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
setLazy(lazy);
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href'); if (id.length < 2) return;
  const t = $(id); if (!t) return; e.preventDefault();
  if (lenis) lenis.scrollTo(t, { duration: lazy ? 2.6 : 1.5 }); else t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}));

// ── toast ────────────────────────────────────────────────────────
const toastEl = $('#toast'); let toastT = 0;
function toast(msg, ms = 3200) {
  toastEl.textContent = msg; toastEl.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), ms);
}

// ── preloader ────────────────────────────────────────────────────
const pre = $('#pre'), bar = $('#pre .bar i');
let loaded = 0, preDone = false;
const NEED = 2;
const bump = () => { loaded++; bar.style.transform = `scaleX(${Math.min(1, 0.05 + loaded / NEED)})`; if (loaded >= NEED) setTimeout(finishPre, 250); };
function finishPre() {
  if (preDone) return; preDone = true;
  pre.classList.add('done'); root.classList.add('gl-on');
  $('#hero-copy').classList.add('in');
  setTimeout(() => pre.remove(), 900);
}
$('#pre .skip').addEventListener('click', finishPre);
setTimeout(finishPre, reduced ? 300 : 2500);     // never hold anyone longer than this

// fonts first: the box print and heel text are painted onto canvases
const fontsReady = Promise.race([
  Promise.all(['800 60px "Bricolage Grotesque"', '700 20px "Space Mono"', 'italic 40px "Instrument Serif"'].map((f) => document.fonts.load(f))),
  new Promise((r) => setTimeout(r, 1800)),
]);
fontsReady.then(bump);

// ── 3D stage ─────────────────────────────────────────────────────
const canvas = $('#gl');
let stage = null;
function hasWebGL() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }
const webgl = hasWebGL();
if (!webgl) root.classList.add('no-webgl');
(async () => {
  if (filmMode) {
    try {
      const { createFilm } = await import('./film.js');
      stage = await createFilm($('#film'), { reduced });
      addEventListener('resize', () => stage.resize());
    } catch (e) { console.warn('footage unavailable', e); }
    bump(); return;
  }
  await fontsReady;
  if (!webgl) { bump(); return; }
  try {
    const { createStage } = await import('./stage.js');
    stage = await createStage(canvas, { mobile, reduced, font: FONT });
    addEventListener('resize', () => stage.resize());
  } catch (e) { console.warn('3D stage unavailable', e); root.classList.add('no-webgl'); }
  bump();
})();

// pointer → stage tilt / peek, and the custom cursor
const cur = $('.cur');
let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
addEventListener('pointermove', (e) => {
  mx = e.clientX; my = e.clientY;
  if (stage && e.pointerType === 'mouse') stage.setPointer((mx / innerWidth) * 2 - 1, -(my / innerHeight) * 2 + 1);
}, { passive: true });

// ── chapters ─────────────────────────────────────────────────────
const pins = ['#ch-box', '#ch-rise', '#ch-weight', '#ch-layers'].map((s) => $(s));
const progress = (el) => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };
let sTarget = 0, sNow = 0;

const hint = $('#hint'), peekTip = $('.peek-tip');
const atEls = $$('[data-at]').map((el) => ({ el, at: +el.dataset.at, pin: el.closest('.pin') }));
const stats = $$('.stats li');
const countEl = $('[data-count]'); let counted = false;
function countUp() {
  if (counted) return; counted = true;
  const to = +countEl.dataset.count, t0 = performance.now(), dur = (reduced ? 1 : 1100) * (lazy ? 2 : 1);
  const step = (now) => { const k = clamp((now - t0) / dur); countEl.firstChild.nodeValue = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

// explode labels
const labelsEl = $('#labels'), svg = $('#labels svg');
const plabels = Object.fromEntries($$('.plabel').map((el) => [el.dataset.k, el]));
const lines = {};
for (const k in plabels) {
  const ns = 'http://www.w3.org/2000/svg';
  const l = document.createElementNS(ns, 'line'), c = document.createElementNS(ns, 'circle'); c.setAttribute('r', '5');
  svg.append(l, c); lines[k] = { l, c };
}
function placeLabels(on) {
  labelsEl.classList.toggle('on', on);
  if (!on || !stage) return;
  const W = innerWidth, pts = stage.anchors();
  const midX = pts.reduce((a, p) => a + p.x, 0) / pts.length;
  // phones: one joke at a time, top to bottom, as you keep scrolling
  const act = mobile ? Math.min(5, Math.floor(clamp((sNow - 3.62) / 0.34) * 6)) : -1;
  pts.forEach((p, i) => plabels[p.key].classList.toggle('act', i === act));
  pts.forEach((p) => {
    const el = plabels[p.key], ln = lines[p.key];
    const left = p.side ? p.side < 0 : p.x < midX;   // labels sit on whichever side their anchor is on
    const off = mobile ? 26 : 70;
    const w = el.offsetWidth, h = el.offsetHeight;
    let x = p.col ? p.col - w : left ? p.x - off - w : p.x + off;
    x = clamp(x, 10, W - w - 10);
    const y = clamp(p.y - h / 2, 70, innerHeight - h - 10);
    el.style.transform = `translate(${x}px,${y}px)`;
    const ex = left ? x + w : x;
    ln.l.setAttribute('x1', p.x); ln.l.setAttribute('y1', p.y); ln.l.setAttribute('x2', ex); ln.l.setAttribute('y2', y + h / 2);
    ln.c.setAttribute('cx', p.x); ln.c.setAttribute('cy', p.y);
  });
}

// ── reveals for normal sections ──────────────────────────────────
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
$$('[data-rev], .solid h2, .stk, .sec-head').forEach((el) => { if (!el.closest('.pin')) io.observe(el); });
$$('.pin [data-rev]').forEach((el) => io.observe(el));

// ── manifesto marquee ────────────────────────────────────────────
const marqs = $$('.marq').map((el) => ({ el, dir: +el.dataset.dir, w: 0 }));
const mf = $('#manifesto');
let mTime = 0;

// ── chapter counter ──────────────────────────────────────────────
const chs = $$('[data-ch]'), cnt = $('#cnt'), cntName = $('#cnt-name');
let lastCh = '';

// ── main loop ────────────────────────────────────────────────────
let last = performance.now(), idleFor = 0, lastIdleToast = -1e9;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (lenis) lenis.raf(now);
  const ts = lazy ? 0.5 : 1;

  // story position: one unit per pinned chapter
  const ps = pins.map(progress);
  sTarget = ps.reduce((a, b) => a + b, 0);
  const k = reduced ? 1 : 1 - Math.exp(-dt * (lazy ? 3.5 : 7));
  sNow += (sTarget - sNow) * k;

  // fade the stage out as the manifesto arrives
  const lr = pins[3].getBoundingClientRect();
  const fade = clamp((lr.bottom - innerHeight * 0.25) / (innerHeight * 0.6));
  root.style.setProperty('--gl-o', fade.toFixed(3));
  if (stage && fade > 0.001) stage.update(sNow, dt, ts);
  canvas.classList.toggle('hover', !!(stage && stage.isHover()));

  hint.style.opacity = sNow > 0.04 ? 0 : 1;
  root.classList.toggle('past', pins[3].getBoundingClientRect().bottom < innerHeight * 0.5);
  if (peekTip) peekTip.classList.toggle('on', sNow < 0.05 && fine);
  for (const a of atEls) { const i = pins.indexOf(a.pin); if (i >= 0) a.el.classList.toggle('in', ps[i] >= a.at && (i !== 0 || ps[i] < 0.995)); }
  stats.forEach((li) => { const on = ps[2] >= +li.dataset.at; li.classList.toggle('on', on); });
  if (ps[2] >= 0.08) countUp();
  placeLabels(sNow > 3.62 && sNow < 4.2 && fade > 0.5);

  // marquee: drifts on its own and gets a shove from scrolling
  const mr = mf.getBoundingClientRect();
  if (mr.bottom > 0 && mr.top < innerHeight) {
    mTime += dt * ts * (reduced ? 0 : 1);
    marqs.forEach((m) => {
      if (!m.w) m.w = m.el.scrollWidth / 3;
      const x = ((mTime * 40 + (innerHeight - mr.top) * 0.35) * m.dir) % m.w;
      m.el.style.transform = `translateX(${(m.dir < 0 ? x : x - m.w).toFixed(1)}px)`;
    });
  }

  // chapter counter
  const mid = innerHeight / 2;
  for (const c of chs) { const r = c.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) { if (c.dataset.ch !== lastCh) { lastCh = c.dataset.ch; cnt.textContent = lastCh; cntName.textContent = c.dataset.name; } break; } }

  // cursor
  if (fine) {
    cx += (mx - cx) * 0.25; cy += (my - cy) * 0.25;
    cur.style.transform = `translate(${cx}px,${cy}px)`;
    const sleepy = idleFor > 2.5;
    cur.classList.toggle('zz', sleepy); cur.classList.toggle('big', !sleepy && !!(stage && stage.isHover()));
    cur.textContent = sleepy ? 'zzz' : (stage && stage.isHover() ? 'peek' : '');
  }

  // "Finally. You get it." after 10s of doing nothing
  idleFor += dt;
  if (idleFor > 10 && now - lastIdleToast > 45000 && preDone) { lastIdleToast = now; toast('Finally. You get it.', 3600); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
['pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach((ev) => addEventListener(ev, () => { idleFor = 0; }, { passive: true }));

// ── what's in the box: flip in sequence when the section is in view ──
const flips = $$('.flip');
flips.forEach((f) => f.addEventListener('click', () => f.classList.toggle('on')));
new IntersectionObserver((es, o) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  flips.forEach((f, i) => setTimeout(() => f.classList.add('on'), (500 + i * 420) * (lazy ? 2 : 1)));
  o.disconnect();
}), { threshold: 0.45 }).observe($('.flips'));

// ── "Don't click this" ───────────────────────────────────────────
let napN = 0;
const nap = $('#nap');
$('#nope').addEventListener('click', () => {
  napN++;
  nap.classList.add('on');
  setTimeout(() => nap.classList.remove('on'), (reduced ? 1600 : 3200) * (lazy ? 1.5 : 1));
  $('#nope').textContent = napN === 1 ? 'Told you.' : napN < 4 ? 'Still don\'t.' : 'Okay, you live here now.';
  $('#nope-count').textContent = napN > 1 ? `You've clicked it ${napN} times. That's more effort than our whole brand.` : '';
});

// ── customiser + lineup (3D, built when needed) ──────────────────
const COLOR_NAMES = Object.fromEntries(SWATCHES.map((s) => [s.hex, s.name]));
const NOUNS = ['Procrastinator', 'Loafabout', 'Napper', 'Couch Commander', 'Snoozer', 'Do-Nothing', 'Lie-In', 'Idler', 'Slowcoach'];
const short = (hex) => (COLOR_NAMES[hex] || 'Mystery').split(' ').pop().replace('Daydream', 'Sky').replace('Sofa', 'Mint');
let cz = null;
const state = { part: 'upper', colors: { ...DEFAULT_COLORS }, text: '' };

// restore a shared build from the URL (?b=0123456&t=NOPE)
try {
  const q = new URLSearchParams(location.search);
  const b = q.get('b');
  if (b && /^\d{7}$/.test(b)) PARTS.forEach((p, i) => { state.colors[p.key] = SWATCHES[+b[i]].hex; });
  const t = (q.get('t') || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 6);
  if (t) state.text = t;
} catch {}

function buildName() {
  const h = Object.values(state.colors).join('').split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return `The ${short(state.colors.upper)} ${NOUNS[h % NOUNS.length]}`;
}
function renderUI() {
  $$('#cz-parts .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === state.part)));
  const cur = state.colors[state.part];
  $$('#cz-sw .sw').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.hex === cur)));
  $('#cz-colname').textContent = `— ${COLOR_NAMES[cur] || ''}`;
  $('#cz-name').textContent = buildName();
  $('#cz-price').textContent = inr(MODELS.snooze.price + (state.text ? 299 : 0));
  $('#cz-pricenote').textContent = state.text ? `The Snooze, custom, with "${state.text}" on the heel` : 'The Snooze, custom';
}
$('#cz-parts').innerHTML = PARTS.map((p) => `<button class="chip" type="button" data-k="${p.key}" aria-pressed="false">${p.label}</button>`).join('');
$('#cz-sw').innerHTML = SWATCHES.map((s) => `<button class="sw" type="button" data-hex="${s.hex}" style="--c:${s.hex}" aria-label="${s.name}" title="${s.name}" aria-pressed="false"></button>`).join('');
$('#cz-text').value = state.text;
$('#cz-parts').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; state.part = b.dataset.k; renderUI(); cz && cz.bounce(); });
$('#cz-sw').addEventListener('click', (e) => {
  const b = e.target.closest('.sw'); if (!b) return;
  state.colors[state.part] = b.dataset.hex; if (cz) cz.shoe.setColor(state.part, b.dataset.hex); renderUI();
});
$('#cz-text').addEventListener('input', (e) => {
  const v = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 6);
  e.target.value = v; state.text = v.trim(); if (cz) cz.shoe.setText(state.text); renderUI();
});
$('#cz-rand').addEventListener('click', () => {
  const pick = () => SWATCHES[Math.floor(Math.random() * SWATCHES.length)].hex;
  for (const p of PARTS) state.colors[p.key] = pick();
  while (state.colors.stripe === state.colors.upper) state.colors.stripe = pick();
  if (cz) { cz.shoe.setColors(state.colors); cz.bounce(); }
  renderUI(); toast('Randomised. Decision-making is overrated.');
});
$('#cz-share').addEventListener('click', async () => {
  const b = PARTS.map((p) => Math.max(0, SWATCHES.findIndex((s) => s.hex === state.colors[p.key]))).join('');
  const url = `${location.origin}${location.pathname}?b=${b}${state.text ? '&t=' + encodeURIComponent(state.text) : ''}#build`;
  try { await navigator.clipboard.writeText(url); toast('Link copied. Now go lie down.'); }
  catch { prompt('Copy this link:', url); }
});
$('#cz-bag').addEventListener('click', () => toast(`${buildName()} added to bag. (Not really, it's a demo. Also: don't.)`, 4200));
renderUI();

async function initCustomiser() {
  if (cz || !webgl) return;
  await fontsReady;
  try {
    const { createViewer } = await import('./viewer.js');
    cz = createViewer($('#cz-gl'), { type: 'lowtop', colors: state.colors, text: state.text, font: FONT, mobile, reduced,
      onPick: (p) => { state.part = p; renderUI(); cz.bounce(); } });
  } catch (e) { console.warn('customiser unavailable', e); root.classList.add('no-webgl'); }
}
async function initLineup() {
  const cards = $('#cards');
  const bgs = { snooze: 'var(--pink)', couch: 'var(--lilac)', nope: 'var(--mint)' };
  cards.innerHTML = ORDER.map((k) => {
    const m = MODELS[k];
    return `<a class="pcard" href="${k}/" style="--bg:${bgs[k]}" data-rev>
      <div class="pic photo"><img src="media/p-${k}.jpg" alt="${m.name}, ${m.kind.toLowerCase()} sneaker in ${m.colorways[0].name}" loading="lazy" width="900" height="900"><span class="stk paper" style="--r:5deg">${m.weight} g</span></div>
      <div class="body"><h3>${m.name}</h3><p class="mono" style="font-size:11px">${m.kind}</p><p>${m.line}</p>
      <div class="foot"><span>${inr(m.price)}</span><i>Meet it →</i></div></div></a>`;
  }).join('');
  $$('.pcard').forEach((el) => io.observe(el));
}
initLineup();
// build the customiser when it gets close, or when the browser is idle
new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { initCustomiser(); o.disconnect(); } }, { rootMargin: '900px 0px' }).observe($('#build'));
if (location.hash === '#build' || location.search.includes('b=')) initCustomiser();
