// Shared behaviour for every Sloffa page: smooth scroll, nav, cursor, toast, reveals, footer shoe.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
export const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
root.classList.remove('no-js');
root.classList.add('js');
if (rm) root.classList.add('rm');

export let lenis = null;
if (!rm) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis; // handy for testing scroll positions
}

export function scrollToEl(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -68, duration: 1.6 });
  else el.scrollIntoView({ behavior: rm ? 'auto' : 'smooth' });
}

// ---------- nav + full-screen menu ----------
const burger = document.querySelector('.burger');
const menu = document.getElementById('menu');
function setMenu(open) {
  root.classList.toggle('menu-open', open);
  burger?.setAttribute('aria-expanded', String(open));
  burger?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (menu) menu.inert = !open;
  if (lenis) open ? lenis.stop() : lenis.start();
}
if (menu) menu.inert = true;
burger?.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); burger?.focus(); } });
menu?.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

// in-page links scroll smoothly (and never touch the colourway hash)
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"], [data-scrollto]');
  if (!a) return;
  const sel = a.dataset.scrollto || a.getAttribute('href');
  if (!sel || sel === '#') return;
  const el = document.querySelector(sel);
  if (!el) return;
  e.preventDefault();
  scrollToEl(el);
});

// ---------- toast ----------
const toast = document.createElement('div');
toast.className = 'toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
document.body.appendChild(toast);
let toastT;
export function showToast(msg) {
  toast.textContent = msg; toast.classList.add('is-on');
  clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('is-on'), 4200);
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-cart]')) showToast('This is a concept site. Nothing will ship. Even less effort for everyone.');
});

// ---------- back to top ----------
document.querySelectorAll('[data-totop]').forEach(b => b.addEventListener('click', () => {
  if (lenis) lenis.scrollTo(0, { duration: 2.4 }); else window.scrollTo({ top: 0, behavior: rm ? 'auto' : 'smooth' });
}));

// ---------- custom cursor (desktop, fine pointer only) ----------
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const c = document.createElement('div');
  c.className = 'cursor'; c.setAttribute('aria-hidden', 'true'); c.textContent = 'zzz';
  document.body.appendChild(c);
  root.classList.add('has-cursor');
  const xTo = gsap.quickTo(c, 'x', { duration: rm ? 0 : 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(c, 'y', { duration: rm ? 0 : 0.35, ease: 'power3' });
  addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); c.classList.add('is-on'); }, { passive: true });
  document.addEventListener('pointerleave', () => c.classList.remove('is-on'));
  document.addEventListener('pointerover', e => c.classList.toggle('is-big', !!e.target.closest('a, button, summary, [role="button"]')));
}

// ---------- magnetic orange pills (max 8px) ----------
if (!rm && matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.pill--cta').forEach(p => {
    const xTo = gsap.quickTo(p, 'x', { duration: 0.4, ease: 'power3' });
    const yTo = gsap.quickTo(p, 'y', { duration: 0.4, ease: 'power3' });
    p.addEventListener('pointermove', e => {
      const r = p.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      xTo(gsap.utils.clamp(-1, 1, dx) * 8); yTo(gsap.utils.clamp(-1, 1, dy) * 8);
    });
    p.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

// ---------- split-line headline reveals ----------
export function initReveals(scope = document) {
  if (rm) return;
  scope.querySelectorAll('.reveal').forEach(el => {
    if (el.dataset.revealed) return; el.dataset.revealed = '1';
    gsap.fromTo(el.querySelectorAll('.ln > span'), { y: 0, yPercent: 110 }, {
      yPercent: 0, duration: 1.05, ease: 'power3.out', stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 82%' },
    });
  });
  scope.querySelectorAll('[data-rise]').forEach(el => {
    gsap.from(el, { y: 50, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
}

// ---------- footer: tiny shoe slides to 60%, then z z z ----------
export function initFooter() {
  const shoe = document.querySelector('.foot__shoe');
  const rule = document.querySelector('.foot__rule');
  if (!shoe || !rule) return;
  const zs = document.querySelectorAll('.foot__z span');
  if (rm) { gsap.set(shoe, { x: () => rule.offsetWidth * 0.6 - shoe.offsetWidth / 2 }); return; }
  let zzz;
  gsap.fromTo(shoe, { x: 0 }, {
    x: () => rule.offsetWidth * 0.6 - shoe.offsetWidth / 2, ease: 'none',
    scrollTrigger: {
      trigger: document.body, start: () => `bottom-=${innerHeight * 2} top`, end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true,
      onUpdate: self => {
        if (self.progress > 0.985 && !zzz) {
          zzz = gsap.timeline({ repeat: -1 }).fromTo(zs, { y: 0, autoAlpha: 0 }, { y: -26, autoAlpha: 1, duration: 1.1, stagger: 0.35, ease: 'sine.out' })
            .to(zs, { autoAlpha: 0, duration: 0.5, stagger: 0.35 }, 1.1);
        } else if (self.progress < 0.95 && zzz) { zzz.kill(); zzz = null; gsap.set(zs, { autoAlpha: 0 }); }
      },
    },
  });
}

export { gsap, ScrollTrigger };
