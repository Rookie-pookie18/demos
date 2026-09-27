/* Ittarbagh Tea Co. (fictional) — premium demo.
   Home: one 3D caddy travels through the story, posed by anchors in the markup (data-tin).
   Inner pages are rendered from data.js by a small hash router. */
import { TEAS, BY_SLUG } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const mobile = matchMedia('(max-width:760px)').matches;
const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const photo = (k) => `img/${k}.jpg`;
const inr = (n) => '₹' + n.toLocaleString('en-IN');

const home = $('#home'), view = $('#view');
let stage = null, snaps = null;

// ── smooth scroll ───────────────────────────────────────────────
let lenis = null;
if (!reduced && window.Lenis) lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
const scrollTo = (y, immediate = false) => {
  if (lenis) lenis.scrollTo(y, { immediate, duration: 1.4 });
  else window.scrollTo({ top: y, behavior: immediate || reduced ? 'auto' : 'smooth' });
};

// ── preloader ───────────────────────────────────────────────────
const pre = $('#pre'), bar = $('#pre .bar i');
let loaded = 0, preDone = false;
const bump = () => { loaded++; bar.style.transform = `scaleX(${Math.min(1, loaded / 3)})`; if (loaded >= 3) setTimeout(finishPre, 350); };
function finishPre() {
  if (preDone) return; preDone = true;
  bar.style.transform = 'scaleX(1)';
  setTimeout(() => {
    pre.classList.add('done');
    root.classList.add('gl-on');
    $('#hh').classList.add('in');
    startReveals();
  }, reduced ? 0 : 250);
  setTimeout(() => pre.remove(), 1400);
  setTimeout(makeSnaps, 900);
}
$('#pre .skip').addEventListener('click', finishPre);
setTimeout(finishPre, reduced ? 0 : 4200); // never hold the visitor longer than this
document.fonts.ready.then(bump);
if (document.readyState === 'complete') bump(); else addEventListener('load', bump, { once: true });

// ── 3D stage ────────────────────────────────────────────────────
function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
(async () => {
  if (!hasWebGL()) { root.classList.add('no-webgl'); bump(); return; }
  try {
    const { createStage } = await import('./stage.js');
    stage = await createStage($('#gl'), { mobile, reduced });
    addEventListener('resize', stage.resize);
    measure();
    if (!view.hidden) stage.setTea(pageTea || TEAS[0], false); else if (range) range.sync();
  } catch (e) {
    console.warn('3D stage unavailable', e);
    root.classList.add('no-webgl');
  }
  bump();
})();

function makeSnaps() {
  if (!stage || snaps) return;
  try { snaps = stage.snapshots(mobile ? 420 : 560, mobile ? 540 : 720); } catch (e) { console.warn('snapshots failed', e); return; }
  $$('[data-snap]').forEach(fillSnap);
}
function fillSnap(el) {
  const s = snaps && snaps[el.dataset.snap];
  if (!s) return;
  const img = new Image(); img.className = 'snap'; img.alt = el.dataset.alt || ''; img.src = s;
  el.replaceWith(img);
}

// ── anchors: pose the tin from the viewport-centre scroll position ─
const DEF = { x: 0, y: 0, s: 0.5, w: 0.3, rx: 0.1, ry: 0, rz: 0, o: 0, p: 0.4 };
let anchors = [], vh = innerHeight;
function readPose(el) {
  const raw = mobile ? el.dataset.tinM || el.dataset.tin : el.dataset.tin;
  if (!raw || raw === 'skip') return null; // desktop-only or phone-only anchors
  try { return { ...DEF, ...JSON.parse(raw) }; } catch { return { ...DEF }; }
}
function measure() {
  vh = innerHeight;
  const scope = view.hidden ? home : view;
  const foot = document.querySelector('footer');
  const docH = document.documentElement.scrollHeight;
  const lo = vh / 2, hi = Math.max(lo, docH - vh / 2);
  anchors = [];
  [...$$('[data-tin],[data-tin-m]', scope), foot].forEach((el) => {
    const pose = readPose(el); if (!pose) return;
    const top = el.getBoundingClientRect().top + scrollY, h = el.offsetHeight;
    const at = el.dataset.tinAt && $(el.dataset.tinAt, el);
    if (at) { const r = at.getBoundingClientRect(); pose.y += (top + h / 2 - (r.top + scrollY + r.height / 2)) / vh; }
    if (el.hasAttribute('data-span')) {
      anchors.push({ y: top + vh / 2, pose }, { y: top + h - vh / 2, pose });
    } else anchors.push({ y: el.hasAttribute('data-tin-top') ? top : top + h / 2, pose });
  });
  anchors.forEach((a) => (a.y = clamp(a.y, lo, hi)));
  anchors.sort((a, b) => a.y - b.y);
  if (range) range.measure();
  if (manifesto) manifesto.measure();
}
function poseAt(c) {
  if (!anchors.length) return { ...DEF };
  if (c <= anchors[0].y) return anchors[0].pose;
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i], b = anchors[i + 1];
    if (c <= b.y) {
      const t = b.y === a.y ? 1 : smooth(clamp((c - a.y) / (b.y - a.y)));
      const o = {};
      for (const k in DEF) o[k] = a.pose[k] + (b.pose[k] - a.pose[k]) * t;
      return o;
    }
  }
  return anchors[anchors.length - 1].pose;
}
new ResizeObserver(() => measure()).observe(document.body);
addEventListener('resize', measure);

// ── manifesto: words brighten as you scroll ──────────────────────
const manifesto = (() => {
  const p = $('#manifesto'); if (!p) return null;
  const sec = p.closest('section');
  p.innerHTML = p.textContent.trim().split(/\s+/).map((w) => `<span class="w${/^(attar|petals|whole|recipe)/i.test(w) ? ' acc' : ''}">${w}</span>`).join(' ');
  const words = $$('.w', p);
  let top = 0, len = 1;
  return {
    measure() { top = sec.getBoundingClientRect().top + scrollY; len = Math.max(1, sec.offsetHeight - vh); },
    update(y) {
      const t = reduced ? 1 : clamp(((y - top) / len - 0.02) / 0.78);
      const n = words.length * t;
      words.forEach((w, i) => w.style.setProperty('--f', clamp(n - i).toFixed(3)));
    }
  };
})();

// ── range: pinned, one tea per step ─────────────────────────────
const range = (() => {
  const sec = $('#range'); if (!sec) return null;
  const bgs = $('#rBgs'), tint = $('#rTint'), count = $('#rCount'), L = $('#rLeft'), R = $('#rRight'), ticks = $('#rTicks');
  bgs.innerHTML = TEAS.map((t) => `<div class="photo" style="background-image:url(${photo(t.photo)})"></div>`).join('');
  L.innerHTML = TEAS.map((t, i) => `<div class="r-item"><span class="kind">${String(i + 1).padStart(2, '0')} · ${t.kind}</span><h3>${t.name}</h3></div>`).join('');
  R.innerHTML = TEAS.map((t) => `<div class="r-item"><p>${t.tagline}</p><ul class="notes">${t.notes.map((n) => `<li>${n}</li>`).join('')}</ul><div class="r-price">${inr(t.sizes[0][1])}<small>${t.sizes[0][0]}</small></div><a class="link" href="#/tea/${t.slug}">View the tea <span aria-hidden="true">→</span></a></div>`).join('');
  ticks.innerHTML = TEAS.map((t, i) => `<button type="button" role="tab" aria-label="${t.name}" data-i="${i}">${t.short}</button>`).join('');
  const P = $$('.photo', bgs), LI = $$('.r-item', L), RI = $$('.r-item', R), TK = $$('button', ticks);
  let top = 0, len = 1, cur = -1;
  ticks.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    scrollTo(top + ((+b.dataset.i + 0.5) / TEAS.length) * len);
  });
  function set(i) {
    if (i === cur) return;
    const first = cur === -1; cur = i;
    const t = TEAS[i];
    P.forEach((el, k) => el.classList.toggle('on', k === i));
    LI.forEach((el, k) => el.classList.toggle('on', k === i));
    RI.forEach((el, k) => el.classList.toggle('on', k === i));
    TK.forEach((el, k) => { el.classList.toggle('on', k === i); el.setAttribute('aria-selected', k === i); });
    tint.style.setProperty('--glow', rgba(t.glow, 0.55));
    count.textContent = String(i + 1).padStart(2, '0');
    if (stage && view.hidden) stage.setTea(t, !first && !reduced);
  }
  return {
    measure() { top = sec.getBoundingClientRect().top + scrollY; len = Math.max(1, sec.offsetHeight - vh); },
    update(y) {
      const p = (y - top) / len;
      TK.forEach((el, k) => el.style.setProperty('--p', clamp(p * TEAS.length - k).toFixed(3)));
      set(clamp(Math.floor(p * TEAS.length), 0, TEAS.length - 1));
    },
    pinned(y) { return y > top - vh * 0.2 && y < top + len + vh * 0.2; },
    sync() { const i = cur; cur = -1; set(Math.max(0, i)); }
  };
})();

// ── marquee, footer list ────────────────────────────────────────
const places = ['A café in Bandra', 'A hotel in Jaipur', 'A tea room in Kolkata', 'A gift shop in Shillong', 'A bakery in Pune', 'A bookshop in Kochi'];
$('#marq').innerHTML = [...places, ...places].map((p) => `<span>${p}</span><span aria-hidden="true">✦</span>`).join('');
$('#fTeas').innerHTML = TEAS.map((t) => `<li><a href="#/tea/${t.slug}">${t.name}</a></li>`).join('');
$$('[data-goto]').forEach((b) => b.addEventListener('click', () => { const t = document.getElementById(b.dataset.goto); if (t) scrollTo(t.getBoundingClientRect().top + scrollY + 2); }));

// ── reveals ─────────────────────────────────────────────────────
let io = null;
function startReveals() {
  if (!io) io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  observe(document);
}
function observe(scope) {
  if (!io) return;
  const els = new Set($$('[data-rev]', scope));
  $$('.lm', scope).forEach((l) => els.add(l.parentElement));
  els.forEach((el) => { if (el.id !== 'hh' && !el.classList.contains('in')) io.observe(el); });
}

// ── nav ─────────────────────────────────────────────────────────
const nav = $('.nav'), menuBtn = $('.menu-btn');
menuBtn.addEventListener('click', () => { const o = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); });

// ── the frame loop: scroll → DOM + tin ──────────────────────────
const heroPhoto = $('#heroPhoto'), ribbon = $('.ribbon');
let lastY = scrollY;
function loop(t) {
  requestAnimationFrame(loop);
  if (lenis) lenis.raf(t);
  const y = scrollY, c = y + vh / 2;
  nav.classList.toggle('solid', y > 40 || nav.classList.contains('open'));
  ribbon.classList.toggle('hide', (range && view.hidden && range.pinned(y)) || y + vh > document.documentElement.scrollHeight - 120);
  if (!view.hidden) { /* inner page */ } else {
    if (manifesto) manifesto.update(y);
    if (range) range.update(y);
    if (heroPhoto && y < vh * 1.2 && !reduced) heroPhoto.style.transform = `translate3d(0,${y * 0.28}px,0) scale(1.08)`;
  }
  if (!reduced) $$('[data-par]', view.hidden ? home : view).forEach((el) => {
    const r = el.parentElement.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    const off = ((r.top + r.height / 2) - vh / 2) * -(+el.dataset.par);
    el.style.transform = `translate3d(0,${clamp(off, -r.height * 0.08, r.height * 0.08)}px,0)`;
  });
  if (stage) {
    const p = poseAt(c);
    stage.setPose(p); stage.setPetals(p.p);
    if (!lenis) { stage.kick(-(y - lastY) * 0.004); }
  }
  lastY = y;
}
if (lenis) lenis.on('scroll', (e) => stage && stage.kick(-e.velocity * 0.01));
requestAnimationFrame(loop);

// ── inner pages ─────────────────────────────────────────────────
const TIN_OFF = `data-tin='{"o":0,"y":0.35,"p":0.35}' data-tin-top`;
const lines = (a, b) => `<span class="lm"><span>${a}</span></span><span class="lm"><span><em>${b}</em></span></span>`;
const snapEl = (t) => (snaps ? `<img class="snap" src="${snaps[t.slug]}" alt="${t.name} caddy">` : `<span class="snap-fallback" data-snap="${t.slug}" data-alt="${t.name} caddy">${t.name}</span>`);
const card = (t) => `
  <a class="t-card" href="#/tea/${t.slug}" data-filter="${t.filter}" style="--g:${rgba(t.glow, 0.6)}" data-rev>
    <div class="art"><div class="photo" style="background-image:url(${photo(t.photo)})"></div>${snapEl(t)}</div>
    <div class="meta"><div><span class="kind">${t.kind}</span><h3>${t.name}</h3></div><span class="price">from ${inr(t.sizes[0][1])}</span></div>
    <p>${t.tagline}</p>
  </a>`;
const ctaBand = (h = 'Find', e = 'your cup.') => `
  <section class="sec" style="text-align:center;padding:130px 0 150px" ${TIN_OFF}>
    <div class="wrap"><p class="lbl plain" style="justify-content:center">Orders, cafés &amp; gifting</p>
    <h2 style="margin:24px 0 34px;font-size:clamp(54px,8vw,130px)">${lines(h, e)}</h2>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap" data-rev><a class="btn" href="#/contact">Enquire <i>→</i></a><a class="btn btn--ghost" href="#/teas">All teas</a></div></div>
  </section>`;
const head = (img, crumb, h1, lede, tin = TIN_OFF) => `
  <section class="p-head" ${tin}>
    <div class="photo" style="background-image:url(${photo(img)})" data-par=".1"></div><div class="shade"></div>
    <div class="wrap"><p class="crumbs"><a href="#/">Home</a> / ${crumb}</p><h1>${h1}</h1>${lede ? `<p class="lede" data-rev>${lede}</p>` : ''}</div>
  </section>`;

const PAGES = {
  teas() {
    return {
      title: 'The teas',
      html: head('tea-leaves', 'The teas', lines('The', 'collection.'), 'Five blends. Whole leaf from gardens we can name, real rose petals from Kannauj, and nothing sprayed on afterwards.',
        `data-tin='{"x":0.27,"y":0.0,"s":0.5,"w":0.22,"rx":0.1,"ry":-0.4,"rz":-0.14,"o":1,"p":0.8}' data-tin-m='{"o":0,"y":0.3,"p":0.6}'`) + `
      <section class="sec" ${TIN_OFF}><div class="wrap">
        <div class="filters" role="group" aria-label="Filter teas">
          <button type="button" aria-pressed="true" data-f="all">All</button><button type="button" aria-pressed="false" data-f="black">Black</button><button type="button" aria-pressed="false" data-f="green">Green</button><button type="button" aria-pressed="false" data-f="free">Caffeine-free</button>
        </div>
        <div class="t-grid">${TEAS.map(card).join('')}</div>
        <p class="note">Prices are placeholders for a fictional brand.</p>
      </div></section>` + ctaBand('Gift a', 'caddy.'),
      init(v) {
        const bs = $$('.filters button', v);
        bs.forEach((b) => b.addEventListener('click', () => {
          bs.forEach((x) => x.setAttribute('aria-pressed', x === b));
          $$('.t-card', v).forEach((c) => (c.hidden = b.dataset.f !== 'all' && c.dataset.filter !== b.dataset.f));
        }));
      }
    };
  },
  tea(slug) {
    const t = BY_SLUG[slug]; if (!t) return PAGES.nf();
    const [a, ...b] = t.name.split(' ');
    const related = TEAS.filter((x) => x !== t).slice(0, 3);
    return {
      title: t.name, tea: t,
      html: `
      <section class="prod-head" style="--g:${rgba(t.glow, 0.5)}" data-tin='{"x":0.25,"y":0.0,"s":0.68,"w":0.3,"rx":0.1,"ry":-0.3,"rz":-0.12,"o":1,"p":0.9}' data-tin-m='{"x":0,"y":0.21,"s":0.3,"w":0.46,"rx":0.1,"ry":-0.3,"rz":-0.1,"o":1,"p":0.7}'>
        <div class="photo" style="background-image:url(${photo(t.photo)})" data-par=".1"></div><div class="shade"></div>
        <div class="prod-fallback frame" style="aspect-ratio:4/5"><img src="${photo(t.photo)}" alt=""></div>
        <div class="wrap"><div class="col">
          <p class="crumbs"><a href="#/">Home</a> / <a href="#/teas">The teas</a> / ${t.short}</p>
          <h1><span class="lm"><span>${a}</span></span><span class="lm"><span>${b.join(' ')}</span></span></h1>
          <p class="tag" data-rev>${t.tagline}</p>
          <ul class="notes" data-rev>${t.notes.map((n) => `<li>${n}</li>`).join('')}</ul>
          <div class="sizes" data-rev>${t.sizes.map((s, i) => `<button type="button" aria-pressed="${i === 0}"><b>${inr(s[1])}</b>${s[0]}</button>`).join('')}</div>
          <div class="buy" data-rev><a class="btn" href="#/contact?tea=${t.slug}">Enquire to order <i>→</i></a><small>Demo site: no checkout, placeholder prices.</small></div>
        </div></div>
      </section>
      <section class="sec" ${TIN_OFF}><div class="wrap">
        <div class="benefits">${t.benefits.map((x, i) => `<div class="benefit" data-rev><span>0${i + 1}</span><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('')}</div>
      </div></section>
      <section class="sec" style="padding-top:20px" ${TIN_OFF}><div class="wrap two">
        <div><p class="lbl">The blend</p><p class="lead" style="margin-top:24px" data-rev>${t.desc}</p></div>
        <div><p class="lbl">What's inside</p><ul class="inside-list" style="margin-top:24px">${t.inside.map((r) => `<li data-rev><span>${r[0]}</span><b>${r[1]}</b></li>`).join('')}</ul><p class="note">Nothing else. No flavouring, no colour.</p></div>
      </div></section>
      <section class="sec" style="padding-top:20px" ${TIN_OFF}><div class="wrap">
        <h2>${lines('How to', 'brew it.')}</h2>
        <div class="brew">${t.brew.map((r) => `<div data-rev><b>${r[0]}</b><span>${r[1]}</span></div>`).join('')}</div>
      </div></section>
      <section class="sec" style="padding-top:20px" ${TIN_OFF}><div class="wrap two">
        <div><h2>${lines('Good', 'questions.')}</h2></div>
        <div>${t.faqs.map((f) => `<details data-rev><summary>${f[0]}</summary><p>${f[1]}</p></details>`).join('')}</div>
      </div></section>
      <section class="sec" style="padding-top:20px" ${TIN_OFF}><div class="wrap">
        <h2>${lines('Also in', 'the garden.')}</h2>
        <div class="t-grid">${related.map(card).join('')}</div>
      </div></section>` + ctaBand(),
      init(v) {
        const bs = $$('.sizes button', v);
        bs.forEach((b) => b.addEventListener('click', () => bs.forEach((x) => x.setAttribute('aria-pressed', x === b))));
      }
    };
  },
  about() {
    return {
      title: 'Our story',
      html: head('dark-rose', 'Our story', lines('Attar fields,', 'tea hills.'), 'Ittarbagh means “garden of attar”. It started with one question at a Kolkata tea table: why does rose tea always taste of perfume?') + `
      <section class="sec" ${TIN_OFF}><div class="wrap two" style="align-items:center">
        <div class="frame" style="aspect-ratio:4/5" data-rev><img src="${photo('rose-bud')}" alt="A single rose bud" loading="lazy" data-par=".08"></div>
        <div>
          <p class="lbl">How it began</p>
          <p class="lead" style="margin:24px 0" data-rev>Most rose teas are black tea sprayed with rose oil. [Founder Name] wanted the flower itself, so the answer was to go where the flowers are.</p>
          <p style="color:var(--muted)" data-rev>In Kannauj, the attar makers distil thousands of kilos of damask rose every summer. Once the oil is drawn, the petals that are left still hold their colour and a soft, honest scent. We buy them, dry them in the shade, and fold them into whole-leaf tea tasted and bought in small lots in Kolkata.</p>
          <p class="note">[Founder Name] is a placeholder. This is a fictional brand.</p>
        </div>
      </div></section>
      <section class="sec" style="padding-top:0" ${TIN_OFF}><div class="wrap">
        <div class="stats">
          <div data-rev><b>5</b><span>blends, and no plans for fifty</span></div>
          <div data-rev><b>2</b><span>cities: Kannauj and Kolkata</span></div>
          <div data-rev><b>0</b><span>flavouring oils, in any caddy</span></div>
          <div data-rev><b>1</b><span>blending table, by hand</span></div>
        </div>
      </div></section>
      <section class="sec" ${TIN_OFF}><div class="wrap two">
        <div><h2>${lines('From field', 'to caddy.')}</h2></div>
        <div class="timeline">
          <div data-rev><b>Dawn</b><span>Damask roses are picked around Kannauj before the sun warms them.</span></div>
          <div data-rev><b>The stills</b><span>Attar makers distil the oil. We collect the petals they leave behind.</span></div>
          <div data-rev><b>The shade</b><span>Petals dry slowly out of the sun, so they keep their colour.</span></div>
          <div data-rev><b>Kolkata</b><span>Leaf is tasted at auction and bought in small lots from named gardens.</span></div>
          <div data-rev><b>The table</b><span>Every batch is blended and packed by hand, then sealed in a caddy.</span></div>
        </div>
      </div></section>
      <section class="sec" ${TIN_OFF}><div class="wrap">
        <h2>${lines('What we', 'won’t do.')}</h2>
        <div class="values">
          <div class="v" data-rev><h3>No <em>oils</em></h3><p>If you can smell rose, it's because there are petals in the tea.</p></div>
          <div class="v" data-rev><h3>No <em>dust</em></h3><p>Whole leaf only. Nothing broken down to fit a tea bag.</p></div>
          <div class="v" data-rev><h3>No <em>secrets</em></h3><p>Every caddy lists what's inside, by percentage.</p></div>
        </div>
      </div></section>` + ctaBand('Taste the', 'difference.')
    };
  },
  contact(q) {
    const pick = q.get('tea');
    return {
      title: 'Where to buy',
      html: head('rose-wall', 'Where to buy', lines('Where to', 'find us.'), 'Order a caddy, stock us in your café, or plan gift boxes for Diwali, weddings and corporate gifting.') + `
      <section class="sec" ${TIN_OFF}><div class="wrap contact-grid">
        <form novalidate>
          <label>Name<input name="name" autocomplete="name" required></label>
          <label>Email<input name="email" type="email" autocomplete="email" required></label>
          <label>Phone<input name="phone" type="tel" autocomplete="tel"></label>
          <label>I'd like to<select name="type"><option>Order a caddy</option><option>Stock Ittarbagh (café / shop)</option><option>Gift boxes</option><option>Something else</option></select></label>
          <label class="full">Tea<select name="tea"><option value="">Not sure yet</option>${TEAS.map((t) => `<option value="${t.slug}"${t.slug === pick ? ' selected' : ''}>${t.name}</option>`).join('')}</select></label>
          <label class="full">Message<textarea name="msg"></textarea></label>
          <div class="full"><button class="btn" type="submit">Send enquiry <i>→</i></button><p class="note">Demo form: nothing is sent anywhere.</p></div>
        </form>
        <div class="where">
          <p class="lbl">Buy online</p>
          <div style="margin-top:18px">
            <div class="row">Our online shop<span>Placeholder</span></div>
            <div class="row">Marketplace listing<span>Placeholder</span></div>
            <div class="row">Cafés &amp; stockists<span>On request</span></div>
          </div>
          <div class="info">
            <div><b>Email</b><span>hello@ittarbagh.example</span></div>
            <div><b>Phone / WhatsApp</b><span>555-0142 (placeholder)</span></div>
            <div><b>Blending room</b><span>Kolkata, West Bengal · petals from Kannauj, Uttar Pradesh</span></div>
            <div><b>Hours</b><span>Mon–Sat, 10:00–18:00 IST</span></div>
          </div>
        </div>
      </div></section>`,
      init(v) {
        const f = $('form', v);
        f.addEventListener('submit', (e) => {
          e.preventDefault();
          const n = f.name.value.trim();
          f.innerHTML = `<div class="sent">Thank you${n ? ', ' + n.replace(/[<>&"]/g, '') : ''}. This is a demo, so nothing was sent — on a live site your enquiry would reach the team here.</div>`;
        });
      }
    };
  },
  nf() {
    return {
      title: 'Not found',
      html: head('dried-petals', 'Not found', lines('Steeped', 'too long.'), 'This page doesn’t exist. The teas do.') +
        `<section class="sec" ${TIN_OFF}><div class="wrap"><a class="btn" href="#/">Back to the garden <i>→</i></a></div></section>`
    };
  }
};

// ── router ──────────────────────────────────────────────────────
const curtain = $('#curtain');
let homeY = 0, first = true, pageTea = null;
function parse() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  const parts = path.split('/').filter(Boolean);
  return { parts, q: new URLSearchParams(qs || '') };
}
function render() {
  const { parts, q } = parse();
  const leavingHome = !view.hidden ? false : true;
  if (leavingHome && !first) homeY = scrollY;
  nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false');

  let page = null;
  if (!parts.length) page = null;
  else if (parts[0] === 'teas') page = PAGES.teas();
  else if (parts[0] === 'tea') page = PAGES.tea(parts[1]);
  else if (parts[0] === 'about') page = PAGES.about();
  else if (parts[0] === 'contact') page = PAGES.contact(q);
  else page = PAGES.nf();

  if (!page) {
    view.hidden = true; view.innerHTML = ''; home.hidden = false;
    document.title = 'Ittarbagh Tea Co. — Petals, not perfume';
  } else {
    home.hidden = true; view.hidden = false; view.innerHTML = page.html;
    document.title = page.title + ' — Ittarbagh Tea Co.';
    if (page.init) page.init(view);
    pageTea = page.tea || null;
    if (stage) stage.setTea(pageTea || TEAS[0], false);
  }
  $$('.nav a[href^="#/"]').forEach((a) => {
    const on = parts[0] && a.getAttribute('href') === '#/' + parts[0];
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  if (lenis) lenis.resize();
  const y = page ? 0 : homeY;
  scrollTo(y, true); window.scrollTo(0, y);
  measure();
  if (!page && range) range.sync();
  if (page) {
    observe(view);
    if (preDone) setTimeout(() => $$('.p-head h1, .prod-head h1', view).forEach((h) => h.classList.add('in')), 60);
  }
  first = false;
}
function go() {
  if (first) { render(); return; }
  curtain.classList.add('on');
  setTimeout(() => { render(); setTimeout(() => curtain.classList.remove('on'), 80); }, reduced ? 0 : 380);
}
addEventListener('hashchange', go);
if (history.scrollRestoration) history.scrollRestoration = 'manual';
go();
