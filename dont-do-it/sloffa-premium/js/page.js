// Inner pages: shared behaviour plus the customiser where the page has one.
import { gsap, rm, initReveals, initFooter } from './core.js';

initReveals();
initFooter();

const cz = document.querySelector('[data-customiser]');
if (cz) {
  import('./customiser.js').then(m => m.mountCustomiser(cz, { modelUrl: '../models/sloffa-lounger.glb', reducedMotion: rm }))
    .catch(err => { console.error('[Sloffa] customiser failed', err); cz.classList.add('cz--fallback'); cz.querySelector('.cz__loading')?.remove(); });
}

// spec rows count up as they enter
if (!rm) document.querySelectorAll('.spec').forEach(row => {
  const v = row.querySelector('.spec__v');
  const st = { trigger: row, start: 'top 88%' };
  gsap.from(row, { y: 30, autoAlpha: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: st });
  if (v.dataset.count !== undefined && +v.dataset.count > 0) {
    const o = { v: 0 }, node = v.firstChild;
    gsap.to(o, { v: +v.dataset.count, duration: 1.6, ease: 'power2.out', scrollTrigger: st, onUpdate: () => { node.nodeValue = Math.round(o.v); } });
  }
});
