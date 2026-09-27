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

  var canvas = $('#gl'), veil = $('#veil'), hud = $('#hud'), hudCh = $('#hudCh'), railFill = $('#railFill');
  var renderer = null, lenis = null, introT = -1, lastLabel = '', lastTone = '';
  var sheets = $$('.sheet, .enquire');

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
  AM.chapters = chapters;

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
    AM.active = best;

    var sc = best && AM.scenes[best.scene];
    if (sc && sc.scene && renderer) {
      sc.update(best.part, best.p, t, dt);
      renderer.render(sc.scene, sc.camera);
    }
    if (best && best.label !== lastLabel) {
      lastLabel = best.label;
      hudCh.innerHTML = '<b>' + String(best.idx + 1).padStart(2, '0') + '</b><span>' + best.label + '</span>';
    }
    /* header reads dark-on-paper over the light sheets */
    var tone = 'stage';
    for (i = 0; i < sheets.length; i++) {
      var sr = sheets[i].getBoundingClientRect();
      if (sr.top <= 44 && sr.bottom >= 44) { tone = sheets[i].classList.contains('sheet--light') ? 'light' : 'dark'; break; }
    }
    if (tone !== lastTone) { lastTone = tone; hud.classList.toggle('is-light', tone === 'light'); hud.classList.toggle('is-over', tone !== 'stage'); }

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
  }
  function initAnchors() {
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'), el = id === '#top' ? document.body : $(id);
        if (!el) return;
        e.preventDefault();
        var y = id === '#top' ? 0 : el.getBoundingClientRect().top + scrollY;
        if (lenis) lenis.scrollTo(y, { duration: id === '#top' ? 2.4 : 1.6 }); else scrollTo({ top: y, behavior: AM.REDUCED ? 'auto' : 'smooth' });
      });
    });
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
      var el = e.target.closest && e.target.closest('[data-cur], a, button, input, select, textarea, summary');
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

  function initForm() {
    var f = $('#form'), msg = $('#formMsg');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#f-name').value.trim(), mail = $('#f-mail').value.trim(), ok = $('#f-ok').checked;
      if (!name) { msg.textContent = 'Add your name so the consultant knows who to reply to.'; $('#f-name').focus(); return; }
      if (!/^\S+@\S+\.\S+$/.test(mail)) { msg.textContent = 'Add an email address we can reply to, for example name@example.com.'; $('#f-mail').focus(); return; }
      if (!ok) { msg.textContent = 'Tick the box to confirm you’ve read how we use your details.'; $('#f-ok').focus(); return; }
      msg.textContent = 'Thanks, ' + name + '. On the live site this request goes to the Kestrel team. This prototype doesn’t send anything.';
    });
  }

  function initCopy() {
    $$('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var txt = b.dataset.copy, done = function () { var o = b.textContent; b.textContent = 'Copied'; setTimeout(function () { b.textContent = o; }, 1400); };
        try { navigator.clipboard.writeText(txt).then(done, function () {}); } catch (e) { /* select the number instead */ }
      });
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
    AM.renderer = renderer;
    AM.pre.step('Renderer');
    var env = AM.buildEnv(renderer);
    AM.pre.step('Northern lights');
    /* build each world, warm its shaders in the poses that show the most, then park it at 0 */
    var plan = [
      ['sky', 'Drafting the file', [['', 0.9], ['', 0.5], ['', 0]]],
      ['crs', 'Counting points', [['', 0.8], ['', 0]]],
      ['globe', 'Plotting routes', [['b', 0.9], ['a', 0.6], ['a', 0]]],
      ['city', 'Raising the skyline', [['', 0.7], ['', 0]]],
      ['home', 'Lighting the house', [['b', 0.6], ['a', 0.5], ['a', 0]]]
    ], i = 0;
    /* the sheet's canvas needs the real faces before it's drawn */
    var faces = ['700 58px Montserrat', '600 50px Montserrat', '500 28px Montserrat', 'italic 400 34px Montserrat', '500 19px "IBM Plex Mono"', '400 22px "IBM Plex Mono"'];
    var fonts = document.fonts && document.fonts.load ? Promise.all(faces.map(function (f) { return document.fonts.load(f).catch(function () {}); })) : Promise.resolve();
    var fontsCapped = Promise.race([fonts, new Promise(function (r) { setTimeout(r, 4000); })]);
    Promise.all([AM.land, fontsCapped]).then(function (res) {
      var land = res[0];
      AM.landData = land;
      AM.pre.step(land ? 'Mapping the world' : 'Mapping (offline)');
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
    });
  }

  /* dev: jump to a chapter + progress, e.g. AM.jump(2, 0.5) */
  AM.jump = function (i, p) {
    var el = chapters[i].el, y = el.offsetTop + p * (el.offsetHeight - innerHeight);
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
  };

  function boot() {
    initCursor(); initForm(); initCopy();
    addEventListener('resize', resize);
    initGL(function () {
      var fin = function () { AM.pre.step('Ready'); initLenis(); initAnchors(); initRail(); requestAnimationFrame(frame); setTimeout(finishPre, 250); };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fin, fin); else fin();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
