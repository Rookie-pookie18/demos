/* SLOFFA (fictional) — one product page per model. The shell HTML names the model in
   <body data-model>; everything else is built from data.js. */
import { MODELS, ORDER, inr } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const mobile = matchMedia('(max-width:900px)').matches;
const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
const FONT = '"Bricolage Grotesque", system-ui, sans-serif';
const m = MODELS[document.body.dataset.model];
const BGS = { snooze: 'var(--pink)', couch: 'var(--lilac)', nope: 'var(--mint)' };

// lazy mode, same as home
let lazy = false;
try { lazy = localStorage.getItem('sloffa-lazy') === '1'; } catch {}
const lazyBtn = $('.lazy-tg');
const setLazy = (on) => { lazy = on; root.classList.toggle('lazy', on); lazyBtn.setAttribute('aria-pressed', String(on)); try { localStorage.setItem('sloffa-lazy', on ? '1' : '0'); } catch {} };
setLazy(lazy);
lazyBtn.addEventListener('click', () => { setLazy(!lazy); toast(lazy ? 'Lazy mode on. Everything at half speed.' : 'Lazy mode off. Bit much, honestly.'); });

const toastEl = $('#toast'); let toastT = 0;
function toast(msg, ms = 3200) { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), ms); }

let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.09 });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
}

const others = ORDER.filter((k) => k !== m.slug);
$('#p').innerHTML = `
<section class="p-hero">
  <div>
    <a class="back" href="../#lineup">← All three shoes</a>
    <p class="lbl">${m.kind} · ${m.weight} g</p>
    <h1 style="font-size:clamp(60px,8vw,128px)"><span class="lm"><span>${m.name.replace('The ', 'The<br>')}</span></span></h1>
    <p class="lede">${m.line} ${m.pitch}</p>
    <div class="group" style="margin-top:28px"><p class="mono" style="margin:0 0 10px;font-weight:700">Colourway: <span id="way-name">${m.colorways[0].name}</span></p>
      <div class="ways" id="ways">${m.colorways.map((w, i) => `<button class="chip" type="button" data-i="${i}" aria-pressed="${i === 0}">${w.name}</button>`).join('')}</div></div>
    <div class="group" style="margin-top:22px"><p class="mono" style="margin:0 0 10px;font-weight:700">Size (UK)</p>
      <div class="sizes" id="sizes">${[5, 6, 7, 8, 9, 10, 11, 12].map((n) => `<button type="button" aria-pressed="${n === 9}">${n}</button>`).join('')}</div></div>
    <div class="price"><b>${inr(m.price)}</b><span>Free delivery to the sofa</span></div>
    <div class="row" style="margin-top:16px">
      <button class="btn" id="bag" type="button">Add to bag</button>
      ${m.type === 'lowtop' ? '<a class="btn ghost" href="../#build">Customise yours</a>' : ''}
    </div>
  </div>
  <div class="p-stage" style="--bg:${BGS[m.slug]}">
    <canvas id="p-gl" role="img" aria-label="${m.name} in 3D. Drag to spin it."></canvas>
    <span class="stk paper in" style="--r:6deg">${m.weight} g · featherweight</span>
    <p class="tip">Drag to spin</p>
  </div>
</section>
<section class="p-sec solid"><div class="wrap two">
  <div><p class="lbl">The numbers</p><h2>Specs, <em>briefly.</em></h2></div>
  <dl class="specs">${m.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
</div></section>
<section class="p-sec solid" style="background:var(--paper)"><div class="wrap two">
  <div><p class="lbl">Fair warning</p><h2>Not <em>suitable</em> for:</h2></div>
  <ul class="notfor">${m.notFor.map((x) => `<li data-rev>${x}</li>`).join('')}</ul>
</div></section>
<section class="p-sec solid"><div class="wrap">
  <div class="sec-head"><div><p class="lbl">Also not doing much</p><h2>The <em>other two.</em></h2></div></div>
  <div class="cards" style="grid-template-columns:repeat(2,minmax(0,1fr))">${others.map((k) => {
    const o = MODELS[k];
    return `<a class="pcard" href="../${k}/" style="--bg:${BGS[k]}"><div class="pic"><img alt="${o.name}" data-snap="${k}" width="720" height="540"></div>
      <div class="body"><h3>${o.name}</h3><p>${o.line}</p><div class="foot"><span>${inr(o.price)}</span><i>Meet it →</i></div></div></a>`;
  }).join('')}</div>
</div></section>`;

requestAnimationFrame(() => $('.p-hero').classList.add('in'));
const past = () => root.classList.toggle('past', scrollY > 40);
addEventListener('scroll', past, { passive: true }); past();
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
$$('[data-rev], .solid h2, .sec-head').forEach((el) => io.observe(el));

$('#sizes').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#sizes button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  if (b.textContent === '12') toast('UK 12. Big feet, big naps.');
});
$('#bag').addEventListener('click', () => {
  const size = $('#sizes [aria-pressed="true"]').textContent;
  toast(`${m.name}, UK ${size}, added to bag. (Not really, it's a demo. Also: don't.)`, 4200);
});

// 3D
function hasWebGL() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }
(async () => {
  if (!hasWebGL()) { root.classList.add('no-webgl'); return; }
  await Promise.race([document.fonts.load('800 60px "Bricolage Grotesque"'), new Promise((r) => setTimeout(r, 1800))]);
  try {
    const { createViewer, snapshots } = await import('./viewer.js');
    const v = createViewer($('#p-gl'), { type: m.type, colors: m.colorways[0].colors, font: FONT, mobile, reduced });
    $('#ways').addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      const w = m.colorways[+b.dataset.i];
      $$('#ways .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      $('#way-name').textContent = w.name;
      v.shoe.setColors(w.colors); v.bounce();
    });
    const shots = snapshots(others.map((k) => ({ key: k, type: MODELS[k].type, colors: MODELS[k].colorways[0].colors })), { font: FONT });
    $$('[data-snap]').forEach((img) => { img.src = shots[img.dataset.snap]; });
  } catch (e) { console.warn('3D unavailable', e); }
})();
