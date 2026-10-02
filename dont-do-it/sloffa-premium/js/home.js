// Homepage choreography for Sloffa. Every chapter's scroll moment lives here.
import { gsap, ScrollTrigger, lenis, rm, initReveals, initFooter, scrollToEl } from './core.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const loadedAt = Date.now();
const wantsColourway = /cw=/.test(location.hash);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!wantsColourway) scrollTo(0, 0);

// ---------- loader: real progress of the hero images + V1 poster, 2.5s at most ----------
function runLoader() {
  const el = $('#loader');
  if (!el || rm) { el?.remove(); return Promise.resolve(); }
  lenis?.stop();
  const fill = $('.loader__fill', el);
  const urls = ['media/k0-lounger-side.webp', 'media/v1-unbox.jpg'];
  let done = 0;
  const shown = { p: 0 };
  return new Promise(resolve => {
    let finished = false;
    const finish = () => {
      if (finished) return; finished = true;
      gsap.to(shown, { p: 1, duration: 0.35, onUpdate: () => gsap.set(fill, { scaleX: shown.p }) });
      gsap.to(el, { yPercent: -100, duration: 0.9, ease: 'power3.inOut', delay: 0.35, onComplete: () => { el.remove(); lenis?.start(); } });
      setTimeout(resolve, 650);
    };
    const step = () => { done++; gsap.to(shown, { p: done / urls.length * 0.92, duration: 0.6, ease: 'power1.out', onUpdate: () => gsap.set(fill, { scaleX: shown.p }) }); if (done === urls.length) setTimeout(finish, 500); };
    urls.forEach(u => { const i = new Image(); i.onload = i.onerror = step; i.src = u; });
    $('#loader-skip')?.addEventListener('click', finish);
    setTimeout(finish, 2500);
  });
}

// ---------- 01 hero ----------
function heroIntro() {
  const card = $('#hanger');
  const [l, r] = $$('.hanger-shoe');
  if (rm) return;
  const mobile = matchMedia('(max-width: 860px)').matches;
  gsap.set(card, { transformPerspective: 1000 });
  const tl = gsap.timeline();
  tl.fromTo(card, { y: -innerHeight * 1.1 }, { y: 0, duration: 1.6, ease: 'back.out(1.15)' }, 0)
    .fromTo(card, { rotation: -16 }, { keyframes: [{ rotation: 6, duration: 0.9, ease: 'power2.out' }, { rotation: -1.5, duration: 0.5, ease: 'sine.inOut' }, { rotation: 0, duration: 0.4, ease: 'sine.out' }] }, 0)
    .from(l, { xPercent: mobile ? -70 : 55, autoAlpha: mobile ? 0 : 1, duration: 1.8, ease: 'power2.out' }, 1.15)
    .from(r, { xPercent: mobile ? 70 : -55, autoAlpha: mobile ? 0 : 1, duration: 1.8, ease: 'power2.out' }, 1.3)
    .add(() => {
      // idle sway, so the hero is never frozen
      gsap.to(card, { rotation: 1.6, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to([l, r], { y: -8, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 1.2 });
    });
  // tilt toward the pointer, up to ±8°
  if (matchMedia('(hover: hover)').matches) {
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.8, ease: 'power3' });
    $('.hero').addEventListener('pointermove', e => {
      const r0 = card.getBoundingClientRect();
      const nx = gsap.utils.clamp(-1, 1, (e.clientX - (r0.left + r0.width / 2)) / (innerWidth / 2));
      const ny = gsap.utils.clamp(-1, 1, (e.clientY - (r0.top + r0.height / 2)) / (innerHeight / 2));
      ry(nx * 8); rx(-ny * 8);
    });
    $('.hero').addEventListener('pointerleave', () => { rx(0); ry(0); });
  }
}

// ---------- 03 unboxing: scrubbed video ----------
function unboxing(mm) {
  const video = $('#unbox-video');
  const circle = $('.unbox__circle');
  if (rm) {
    const img = new Image();
    img.src = 'media/v1-end.jpg'; img.alt = 'An open oat shoebox with two Loungers tucked in under an orange knitted blanket';
    img.width = 1344; img.height = 768;
    video.replaceWith(img);
    return;
  }
  // only fetch the video once the section is within one screen
  new IntersectionObserver((ents, io) => {
    if (!ents[0].isIntersecting) return;
    io.disconnect();
    video.preload = 'auto';
    // Cloudflare Pages ignores Range requests, so Chrome can't seek a streamed mp4.
    // A blob URL lives in memory and is always seekable.
    fetch(video.dataset.src).then(r => { if (!r.ok) throw r.status; return r.blob(); })
      .then(b => { video.src = URL.createObjectURL(b); video.load(); })
      .catch(() => { video.src = video.dataset.src; video.load(); });
  }, { rootMargin: '100% 0px' }).observe($('#unboxing'));

  let prog = 0, cur = 0, raf = 0;
  const half = 1 / 48; // half a frame at 24fps
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!video.duration || video.readyState < 1) return;
    const target = prog * (video.duration - 0.05);
    cur += (target - cur) * 0.15;
    if (Math.abs(cur - video.currentTime) > half && !video.seeking) video.currentTime = cur;
  };
  const run = on => { if (on && !raf) tick(); if (!on && raf) { cancelAnimationFrame(raf); raf = 0; } };
  const build = pinLen => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#unboxing', start: 'top top', end: `+=${pinLen}%`, pin: true, scrub: true,
        onUpdate: self => { prog = self.progress; },
        onToggle: self => { prog = self.progress; run(true); setTimeout(() => { if (!self.isActive) run(false); }, 1500); },
      },
    });
    tl.fromTo(circle, { scale: 0.5 }, { scale: 1, duration: 0.5, ease: 'none' }, 0)
      .to('.unbox__glow', { opacity: 0.55, duration: 0.35, ease: 'none' }, 0.15)
      .to('.unbox__ring', { opacity: 1, duration: 0.2, ease: 'none' }, 0.3)
      .to('.unbox__ghost', { yPercent: -12, duration: 1, ease: 'none' }, 0)
      .to('.unbox__title .h', { color: '#211C17', duration: 0.4, ease: 'none' }, 0.6);
    return () => run(false);
  };
  mm.add('(min-width: 861px)', () => build(100));
  mm.add('(max-width: 860px)', () => build(60));
}

// ---------- 04 manifesto + marquee ----------
function manifesto() {
  if (rm) return;
  $$('.mani').forEach(line => {
    gsap.fromTo(line.firstElementChild, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: line, start: 'top 70%' } });
  });
  const track = $('.marquee__track');
  const item = track.firstElementChild;
  let x = 0, dir = 1, vel = 0;
  lenis?.on('scroll', e => { if (e.direction) dir = e.direction; vel = Math.abs(e.velocity || 0); });
  const near = { on: false };
  ScrollTrigger.create({ trigger: '.marquee', start: 'top bottom', end: 'bottom top', onToggle: s => { near.on = s.isActive; } });
  gsap.ticker.add(() => {
    if (!near.on) return;
    const w = item.offsetWidth;
    x -= (0.35 + Math.min(vel, 60) * 0.18) * dir;
    vel *= 0.92;
    if (x <= -w) x += w; if (x > 0) x -= w;
    track.style.transform = `translate3d(${x}px,0,0)`;
  });
}

// ---------- 05 customiser (Three.js loads only near this section) ----------
function customiser() {
  const el = $('#cz');
  let started = false;
  const start = () => {
    if (started) return; started = true;
    import('./customiser.js').then(m => m.mountCustomiser(el, { modelUrl: 'models/sloffa-lounger.glb', reducedMotion: rm }))
      .catch(err => { console.error('[Sloffa] customiser failed', err); el.classList.add('cz--fallback'); $('.cz__loading', el)?.remove(); });
  };
  if (wantsColourway) start();
  new IntersectionObserver((ents, io) => { if (ents[0].isIntersecting) { start(); io.disconnect(); } }, { rootMargin: '100% 0px' }).observe($('#colourway'));
  if (!rm) gsap.from('.cz__stage', { y: 60, autoAlpha: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.cz', start: 'top 80%' } });
}

// ---------- 06 box: scroll-to-flip card ----------
function boxFlip() {
  const inner = $('.sflip__in');
  if (rm) {
    $('#sflip').addEventListener('click', () => { inner.style.transform = inner.style.transform ? '' : 'rotateY(180deg)'; });
    return;
  }
  gsap.fromTo(inner, { rotationY: 0 }, { rotationY: 180, ease: 'none', scrollTrigger: { trigger: '#sflip', start: 'top 80%', end: 'center 52%', scrub: 0.6 } });
}

// ---------- 07 composition: centre line darkens ----------
function compo() {
  if (rm) return;
  gsap.to('.compo__line .h', { color: '#211C17', ease: 'none', scrollTrigger: { trigger: '.compo', start: 'top 60%', end: 'center 45%', scrub: true } });
}

// ---------- 08 details: horizontal row (desktop pin; phones swipe) ----------
function details(mm) {
  if (rm) return;
  mm.add('(min-width: 861px)', () => {
    const row = $('#hrow');
    const dist = () => Math.max(0, row.scrollWidth - innerWidth);
    gsap.to(row, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.details__pin', start: 'top top', end: '+=150%', pin: true, scrub: 0.5, invalidateOnRefresh: true } });
  });
}

// ---------- 09 unmask ----------
function unmask(mm) {
  if (rm) return;
  gsap.to('#nap-shoe', { y: 6, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, startAt: { y: -6 } });
  const build = len => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: '#lights-off', start: 'top top', end: `+=${len}%`, pin: true, scrub: true } });
    tl.to('.unmask__panel', { yPercent: -112, duration: 0.5, ease: 'power1.in' }, 0)
      .fromTo('.unmask__circle', { scale: 0.82 }, { scale: 1, duration: 0.4, ease: 'none' }, 0.25)
      .fromTo('.unmask__lamp', { opacity: 0 }, { opacity: 0.16, duration: 0.4, ease: 'none' }, 0.3)
      .to('.unmask__head .h', { color: '#F2ECE1', duration: 0.4, ease: 'none' }, 0.55)
      .to('.unmask__head .label', { opacity: 1, duration: 0.25, ease: 'none' }, 0.75);
  };
  mm.add('(min-width: 861px)', () => build(130));
  mm.add('(max-width: 860px)', () => build(80));
}

// ---------- spec rows: reveal + count up / across ----------
function specs() {
  $$('.spec').forEach(row => {
    const v = $('.spec__v', row);
    if (rm) return;
    const st = { trigger: row, start: 'top 85%' };
    gsap.from(row, { y: 30, autoAlpha: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: st });
    if (v.dataset.count !== undefined) {
      const n = +v.dataset.count, node = v.firstChild, o = { v: 0 };
      if (n > 0) gsap.to(o, { v: n, duration: 1.6, ease: 'power2.out', scrollTrigger: st, onUpdate: () => { node.nodeValue = Math.round(o.v); } });
    } else {
      gsap.fromTo(v, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'steps(10)', scrollTrigger: st });
    }
  });
}

// ---------- data-speed parallax (desktop) ----------
function parallax(mm) {
  if (rm) return;
  mm.add('(min-width: 861px)', () => {
    $$('[data-speed]').forEach(el => {
      const s = parseFloat(el.dataset.speed);
      const d = (1 - s) * innerHeight * 0.5;
      gsap.fromTo(el, { y: -d }, { y: d, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // hero: card + shoes rise slower than the page (0.6)
    gsap.to('#hanger-wrap', { y: () => innerHeight * 0.4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  });
}

// ---------- flip cards: tap/keyboard toggle ----------
$$('.flip').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))));

// ---------- 3.5 cards rise in sequence ----------
if (!rm) gsap.from('[data-seq]', { y: 90, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.22, scrollTrigger: { trigger: '.assembled__grid', start: 'top 82%' } });

// ---------- 11 count-UP timer ----------
(function counter() {
  const u = { d: $('[data-u="d"]'), h: $('[data-u="h"]'), m: $('[data-u="m"]'), s: $('[data-u="s"]') };
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    const t = Math.floor((Date.now() - loadedAt) / 1000);
    u.d.textContent = pad(Math.floor(t / 86400)); u.h.textContent = pad(Math.floor(t / 3600) % 24);
    u.m.textContent = pad(Math.floor(t / 60) % 60); u.s.textContent = pad(t % 60);
  };
  tick(); setInterval(tick, 1000);
})();

// ---------- boot ----------
const mm = gsap.matchMedia();
unboxing(mm);
manifesto();
customiser();
boxFlip();
compo();
details(mm);
unmask(mm);
specs();
parallax(mm);
initReveals();
initFooter();
addEventListener('load', () => ScrollTrigger.refresh());
document.fonts?.ready.then(() => ScrollTrigger.refresh());

runLoader().then(() => {
  heroIntro();
  if (wantsColourway) setTimeout(() => scrollToEl('#colourway'), 300);
});
