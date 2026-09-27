/* ══════════════════════════════════════════════════════════════════
   DIRECTOR — one canvas, many chapters.
   Each .ch section is tall; its .pin sticks for the duration. Local
   progress p = how far through that section you are (0..1). The
   chapter covering most of the viewport owns the renderer; copy lines
   in every visible chapter are clip-revealed from their own p.
   Normal-flow .sheet sections simply scroll over the fixed canvas.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var AM = window.AM;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = AM.clamp, range = AM.range, ease = AM.ease, smooth = AM.smooth;

  var canvas = $('#gl'), veil = $('#veil'), hudCh = $('#hudCh'), railFill = $('#railFill'), steps = $$('#steps li');
  var renderer = null, lenis = null, introT = -1, lastLabel = '', lastStep = -1;

  var chapters = $$('.ch').map(function (el, i) {
    var nx = el.nextElementSibling;
    return {
      el: el, idx: i, scene: el.dataset.scene, part: el.dataset.part || '', label: el.dataset.label, p: 0, cov: 0, r: null,
      next3D: !!(nx && nx.classList.contains('ch')),
      panels: $$('.panel', el).map(function (pn) {
        var ab = pn.dataset.r.split(',').map(Number);
        return { el: pn, a: ab[0], b: ab[1], items: $$('.ln > span, .rv', pn), on: false, cache: [] };
      })
    };
  });

  /* ── copy reveals: a top-down wipe in, a bottom-up wipe out ── */
  function reveal(ch) {
    for (var j = 0; j < ch.panels.length; j++) {
      var pn = ch.panels[j], anyOn = false;
      for (var i = 0; i < pn.items.length; i++) {
        var st = i * 0.012, vin, vout;
        if (pn.a < 0) vin = introT < 0 ? 0 : ease(clamp((introT - 0.25 - i * 0.09) / 0.9, 0, 1));
        else vin = ease(range(ch.p, pn.a + st, pn.a + st + 0.05));
        vout = pn.b > 1 ? 0 : smooth(range(ch.p, pn.b + st * 0.5, pn.b + st * 0.5 + 0.035));
        var key = Math.round(vin * 400) + ':' + Math.round(vout * 400);
        if (pn.cache[i] === key) { if (vin > 0.6 && vout < 0.4) anyOn = true; continue; }
        pn.cache[i] = key;
        var s = pn.items[i].style;
        s.clipPath = 'inset(' + (vout * 100).toFixed(2) + '% 0 ' + ((1 - vin) * 100).toFixed(2) + '% 0)';
        if (!AM.REDUCED) {
          s.transform = 'translateY(' + ((1 - vin) * -0.35 + vout * 0.2).toFixed(3) + 'em)';
          var bl = (1 - vin) * 6 + vout * 3;
          s.filter = bl > 0.05 ? 'blur(' + bl.toFixed(2) + 'px)' : 'none';
        }
        if (vin > 0.6 && vout < 0.4) anyOn = true;
      }
      if (anyOn !== pn.on) { pn.on = anyOn; pn.el.classList.toggle('is-on', anyOn); }
    }
  }

  /* ── frame ── */
  var t0 = performance.now(), last = t0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (lenis) lenis.raf(now);
    var t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (introT >= 0) introT += dt;
    AM.mouse.x += (AM.mouse.tx - AM.mouse.x) * 0.05; AM.mouse.y += (AM.mouse.ty - AM.mouse.y) * 0.05;

    var vh = innerHeight, best = null, bestCov = 0, v = 0;
    for (var i = 0; i < chapters.length; i++) {
      var ch = chapters[i], r = ch.el.getBoundingClientRect();
      ch.r = r; ch.p = clamp(-r.top / (r.height - vh), 0, 1);
      ch.cov = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / vh;
      if (ch.cov > 0) reveal(ch);
      if (ch.cov > bestCov) { bestCov = ch.cov; best = ch; }
      if (ch.next3D) v = Math.max(v, smooth(1 - Math.abs(r.bottom - vh * 0.5) / (vh * 0.45)));
    }
    veil.style.opacity = v.toFixed(3);

    if (best && renderer) {
      var sc = AM.scenes[best.scene];
      sc.update(best.part, best.p, t, dt);
      renderer.render(sc.scene, sc.camera);
    }
    if (best && best.label !== lastLabel) {
      lastLabel = best.label;
      hudCh.innerHTML = '<b>0' + (best.idx + 1) + '</b><span>' + best.label + '</span>';
    }
    if (best && best.scene === 'mill') {
      var p = best.p, si = p < 0.19 ? 0 : p < 0.39 ? 1 : p < 0.59 ? 2 : p < 0.79 ? 3 : 4;
      if (si !== lastStep) { lastStep = si; steps.forEach(function (li, k) { li.classList.toggle('is-on', k === si); }); }
    }
    var max = document.documentElement.scrollHeight - vh;
    railFill.style.transform = 'scaleY(' + (max > 0 ? scrollY / max : 0).toFixed(4) + ')';

    /* scroll-speed blur on the canvas */
    if (lenis && !AM.REDUCED) {
      var b = clamp((Math.abs(lenis.velocity) - 14) / 20, 0, 3);
      canvas.style.filter = b > 0.1 ? 'blur(' + b.toFixed(2) + 'px)' : 'none';
    }
  }

  /* ── pieces ── */
  function initLenis() {
    if (typeof window.Lenis === 'undefined' || AM.REDUCED) return;
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.3 });
    $$('a[href="#top"]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); lenis.scrollTo(0, { duration: 2.4 }); }); });
  }

  function initCursor() {
    var dot = $('#cur'), ring = $('#curRing'), label = $('#curLabel');
    addEventListener('mousemove', function (e) {
      AM.mouse.tx = (e.clientX / innerWidth - 0.5) * 2; AM.mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; dot.style.opacity = ring.style.opacity = '1'; }, { passive: true });
    document.addEventListener('mouseleave', function () { dot.style.opacity = ring.style.opacity = '0'; });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', function (e) {
      var el = e.target.closest && e.target.closest('[data-cur], a, button, input, select, textarea');
      ring.classList.toggle('is-hot', !!el); label.textContent = el && el.dataset.cur ? el.dataset.cur : '';
    });
  }

  function initRail() {
    var rail = $('.rail'), max = document.documentElement.scrollHeight - innerHeight;
    chapters.forEach(function (ch) {
      var s = document.createElement('span');
      s.style.top = (clamp(ch.el.offsetTop / max, 0, 1) * 100).toFixed(2) + '%'; rail.appendChild(s);
    });
  }

  function initCounters() {
    if (AM.REDUCED || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return; io.unobserve(en.target);
        var el = en.target, to = +el.dataset.count, suf = el.dataset.suffix || '', s0 = performance.now();
        (function tick(n) {
          var k = ease(clamp((n - s0) / 1800, 0, 1));
          el.textContent = Math.round(to * k).toLocaleString('en-US') + suf;
          if (k < 1) requestAnimationFrame(tick);
        })(s0);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { io.observe(el); });
  }

  function initForm() {
    var f = $('#form'), msg = $('#formMsg');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#f-name').value.trim();
      if (!name) { msg.textContent = 'Add your name so the export desk knows who to reply to.'; $('#f-name').focus(); return; }
      msg.textContent = 'Thanks, ' + name + '. On the live site this request goes to the export desk. This prototype doesn’t send anything.';
    });
  }

  function finishPre() {
    var pre = $('#pre');
    pre.classList.add('is-done');
    setTimeout(function () { pre.style.display = 'none'; }, 1400);
    introT = 0;
  }

  function resize() {
    AM.NARROW = innerWidth <= 900;
    if (!renderer) return;
    renderer.setSize(innerWidth, innerHeight, false);
    Object.keys(AM.scenes).forEach(function (k) { var sc = AM.scenes[k]; if (sc.camera) AM.aim(sc.camera); });
  }

  function initGL(done) {
    if (!window.THREE) { document.documentElement.classList.add('no-gl'); return done(); }
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
    } catch (e) { renderer = null; document.documentElement.classList.add('no-gl'); return done(); }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, AM.TIER < 1 ? 1.5 : 2));
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    AM.pre.step('Renderer');
    var env = AM.buildEnv(renderer);
    AM.pre.step('Light');
    /* build each world, warm its shaders in the poses that show the most, then park it at 0 */
    var plan = [
      ['field', 'Planting the paddy', [['b', 0.6], ['a', 0]]],
      ['mill', 'Starting the mill', [['', 0.86], ['', 0.3], ['', 0]]],
      ['varieties', 'Grading varieties', [['', 0]]],
      ['globe', 'Plotting routes', [['', 0.9], ['', 0]]],
      ['plate', 'Setting the table', [['', 0.9], ['', 0]]]
    ], i = 0;
    (function next() {
      if (i >= plan.length) return done();
      var item = plan[i++], sc = AM.scenes[item[0]];
      try {
        sc.build(renderer, env); AM.aim(sc.camera);
        item[2].forEach(function (w) { sc.update(w[0], w[1], 0, 0.016); renderer.compile(sc.scene, sc.camera); });
      } catch (err) { console.error('[' + item[0] + ']', err); }
      AM.pre.step(item[1]);
      setTimeout(next, 30);
    })();
  }

  /* dev: jump to a chapter + progress, e.g. AM.jump(2, 0.5) */
  AM.jump = function (i, p) {
    var el = chapters[i].el, y = el.offsetTop + p * (el.offsetHeight - innerHeight);
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
  };

  function boot() {
    initCursor(); initForm(); initCounters();
    addEventListener('resize', resize);
    initGL(function () {
      var fin = function () { AM.pre.step('Ready'); initLenis(); initRail(); requestAnimationFrame(frame); setTimeout(finishPre, 250); };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fin, fin); else fin();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
