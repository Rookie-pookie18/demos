/* Ittarbagh premium demo — scroll story, range pour, hash-routed inner pages. */
(function () {
  var D = window.ITB, A = window.Art, L = window.Liquid;
  var root = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = matchMedia('(max-width: 760px)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var esc = A.esc;
  var bySlug = {}; D.teas.forEach(function (t) { bySlug[t.slug] = t; });
  var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };

  function palOf(key) {
    if (bySlug[key]) return bySlug[key];
    return D[key] || D.master;
  }

  // ── smooth scroll ──
  var lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  }
  function toTop() { if (lenis) lenis.scrollTo(0, { immediate: true, force: true }); window.scrollTo(0, 0); }
  function scrollToY(y) { if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' }); }

  L.setPalette(D.master.pal, D.master.ink, true);

  // ── preloader ──
  var pre = $('#pre'), pct = $('#pct'), preDone = false;
  function endPre() {
    if (preDone) return; preDone = true;
    pre.classList.add('done');
    setTimeout(function () { $('.hero').classList.add('in'); }, 150);
  }
  if (reduced) { endPre(); }
  else {
    var t0 = performance.now();
    (function tick(now) { var p = Math.min(1, (now - t0) / 1900); pct.textContent = Math.round(p * 100); if (p < 1 && !preDone) requestAnimationFrame(tick); })(t0);
    setTimeout(endPre, 2350);
    $('.skip', pre).addEventListener('click', endPre);
  }

  // ── home: build pieces ──
  var heroTin = $('#heroTin');
  heroTin.innerHTML = A.tin(D.teas[0]);
  ['#F7B6C6', '#E79AAF', '#F9C3D1'].forEach(function (c, i) {
    var p = document.createElement('div'); p.className = 'petal-fly'; p.setAttribute('aria-hidden', 'true');
    p.style.cssText = ['left:-8%;top:12%', 'right:-4%;top:48%', 'left:12%;bottom:-4%'][i] + ';animation-delay:' + (-i * 3) + 's;width:' + [44, 34, 28][i] + 'px';
    p.innerHTML = A.ing.petal(c); heroTin.appendChild(p);
  });

  // promise words
  var promise = $('#promise');
  var accent = ['attar.', 'petals', 'Nothing', 'else'];
  promise.innerHTML = promise.textContent.trim().split(/\s+/).map(function (w) {
    return '<span class="w' + (accent.indexOf(w) > -1 ? ' acc' : '') + '">' + esc(w) + '</span>';
  }).join(' ');
  var words = $$('.w', promise);

  // range pour
  var N = D.teas.length;
  var range = $('#range');
  range.style.height = (N * (mobile ? 60 : 80) + 100) + 'vh';
  $('#rTot').textContent = String(N).padStart(2, '0');
  $('#rNames').innerHTML = D.teas.map(function (t) {
    var w = t.name.split(' '), a = w.slice(0, Math.ceil(w.length / 2)).join(' '), b = w.slice(Math.ceil(w.length / 2)).join(' ');
    return '<div class="r-name"><h2><span class="lm"><span>' + esc(a) + '</span></span><span class="lm"><span><em>' + esc(b) + '</em></span></span></h2></div>';
  }).join('');
  $('#rMeta').innerHTML = D.teas.map(function (t, i) {
    return '<div class="r-item" data-i="' + i + '"><span class="kind">' + esc(t.kind) + ' · from ' + inr(t.sizes[0][1]) + '</span><p>' + esc(t.tagline) + '</p>' +
      '<ul class="chips">' + t.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' +
      '<a class="pill" href="#/tea/' + t.slug + '" data-colour="' + t.pal[2] + '" data-cursor="view">View ' + esc(t.short) + ' <i>→</i></a></div>';
  }).join('');
  $('#rStage').innerHTML = D.teas.map(function (t) { return '<div class="r-tin" aria-hidden="true">' + A.tin(t) + '</div>'; }).join('');
  $('#rDots').innerHTML = D.teas.map(function (t, i) { return '<button type="button" role="tab" aria-label="' + esc(t.name) + '" data-i="' + i + '"></button>'; }).join('');
  var rNames = $$('.r-name'), rItems = $$('.r-item'), rTins = $$('.r-tin'), rDots = $$('#rDots button'), rCur = -1;
  function rangeY(i) { var top = range.getBoundingClientRect().top + window.scrollY; return top + (i + 0.5) / N * (range.offsetHeight - innerHeight); }
  rDots.forEach(function (b) { b.addEventListener('click', function () { scrollToY(rangeY(+b.dataset.i)); }); });
  rItems.forEach(function (it) { $('a', it).addEventListener('focus', function () { var i = +it.dataset.i; if (i !== rCur) { window.scrollTo(0, rangeY(i)); if (lenis) lenis.scrollTo(rangeY(i), { immediate: true }); } }); });
  function setRange(i) {
    if (i === rCur) return; rCur = i;
    rNames.forEach(function (el, k) { el.classList.toggle('in', k === i); el.classList.toggle('out', k < i); });
    rItems.forEach(function (el, k) { el.classList.toggle('on', k === i); });
    rTins.forEach(function (el, k) { el.classList.toggle('on', k === i); el.classList.toggle('gone', k < i); });
    rDots.forEach(function (el, k) { el.classList.toggle('on', k === i); el.setAttribute('aria-selected', k === i); });
    $('#rNum').textContent = String(i + 1).padStart(2, '0');
    range.dataset.pal = D.teas[i].slug;
  }
  setRange(0);

  // ingredients (three parallax depths)
  var ingSpots = [
    ['petal', 6, 14, 90, 1], ['leaf', 82, 10, 120, 2], ['saffron', 12, 62, 110, 3], ['cardamom', 86, 58, 90, 3],
    ['almond', 70, 84, 70, 1], ['hibiscus', 22, 86, 100, 2], ['cinnamon', 44, 6, 90, 1], ['petal', 92, 34, 56, 3],
    ['leaf', 2, 40, 70, 1], ['petal', 60, 92, 48, 3]
  ];
  if (mobile) ingSpots = ingSpots.filter(function (s, i) { return i % 2 === 0; });
  $('#ings').innerHTML = ingSpots.map(function (s) {
    var size = mobile ? s[3] * 0.62 : s[3];
    return '<div class="ing d' + s[4] + '" data-depth="' + s[4] + '" aria-hidden="true" style="left:' + s[1] + '%;top:' + s[2] + '%;width:' + size + 'px">' + A.ing[s[0]]() + '</div>';
  }).join('');
  var ings = $$('.ing'), insideSec = $('.inside');

  $('#blossomA').innerHTML = '<svg viewBox="0 0 100 100">' + A.rose(50, 50, 40, '#fff', '#F6D3DB') + '</svg>';
  var stockists = ['[Stockist logo]', '[Café partner]', '[Quick-commerce app]', '[Gourmet store]', '[Hotel group]', '[Marketplace]'];
  $('#marq').innerHTML = stockists.concat(stockists).map(function (s) { return '<span>' + s + '</span>'; }).join('');
  $('#fTeas').innerHTML = D.teas.map(function (t) { return '<li><a href="#/tea/' + t.slug + '" data-colour="' + t.pal[2] + '">' + esc(t.name) + '</a></li>'; }).join('');

  // hero toy: click the liquid to pour in the next tea's colour
  var heroSec = $('.hero'), heroOverride = null, heroIdx = 0;
  heroSec.addEventListener('click', function (e) {
    if (e.target.closest('a,button')) return;
    heroIdx = (heroIdx + 1) % N; var t = D.teas[heroIdx];
    heroOverride = t.slug;
    L.swirl(e.clientX, e.clientY);
    heroTin.firstChild.outerHTML = A.tin(t);
    heroTin.animate && heroTin.animate([{ transform: 'translateY(30px) scale(.92)', opacity: .4 }, { transform: 'none', opacity: 1 }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' });
  });

  // ── reveals ──
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });
  function observe(scope) {
    $$('[data-rev],[data-melt]', scope).forEach(function (el) { io.observe(el); });
    $$('h1,h2', scope).forEach(function (h) { if ($('.lm', h) && !h.closest('.r-name') && !h.closest('.hero')) io.observe(h); });
  }
  observe(document);

  // ── scroll-driven frame loop ──
  var nav = $('.nav'), homeEl = $('#home'), viewEl = $('#view'), footer = $('footer'), ribbon = $('.ribbon');
  var onHome = true;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function progress(el) { var r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, el.offsetHeight - innerHeight), 0, 1); }

  function update() {
    var y = window.scrollY;
    nav.classList.toggle('solid', y > 80);
    ribbon.classList.toggle('hide', footer.getBoundingClientRect().top < innerHeight - 40);
    var mid = innerHeight * 0.5;

    if (onHome) {
      var pp = progress($('.promise')), nW = words.length;
      for (var i = 0; i < nW; i++) words[i].style.setProperty('--f', clamp(pp * 1.25 * nW - i, 0, 1));
      var rp = progress(range);
      setRange(Math.min(N - 1, Math.floor(rp * N)));
      range.style.setProperty('--prog', ((rCur + 1) / N).toFixed(3));
      $('.r-count .bar i').style.transform = 'scaleX(' + ((rCur + 1) / N) + ')';
      var ir = insideSec.getBoundingClientRect();
      if (ir.bottom > 0 && ir.top < innerHeight) {
        var off = (ir.top + ir.height / 2 - mid);
        for (var k = 0; k < ings.length; k++) {
          var d = +ings[k].dataset.depth, sp = d === 1 ? 0.12 : d === 2 ? 0.28 : 0.5;
          ings[k].style.transform = 'translate3d(0,' + (off * sp).toFixed(1) + 'px,0) rotate(' + (off * 0.03 * d).toFixed(1) + 'deg)';
        }
      }
    }

    // palette driver: whichever [data-pal] crosses the middle of the screen
    var scope = onHome ? homeEl : viewEl, els = $$('[data-pal]', scope).concat([footer]), hit = null;
    for (var j = 0; j < els.length; j++) { var r = els[j].getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) { hit = els[j]; break; } }
    if (hit) {
      var key = hit.dataset.pal;
      if (hit === heroSec && heroOverride) key = heroOverride;
      var p = palOf(key);
      L.setPalette(p.pal, p.ink);
      L.calm = hit.dataset.calm ? +hit.dataset.calm : 0.3;
    }
  }
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);

  // ── cursor ──
  var cur = $('.cursor');
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced) {
    var cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    cur.style.opacity = '0';
    addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; cur.style.opacity = ''; }, { passive: true });
    (function loop() {
      var vx = tx - cx, vy = ty - cy; cx += vx * 0.22; cy += vy * 0.22;
      var sp = Math.min(0.6, Math.hypot(vx, vy) / 120), ang = Math.atan2(vy, vx) * 180 / Math.PI;
      cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px) rotate(' + ang + 'deg) scale(' + (1 + sp) + ',' + (1 - sp * 0.5) + ')';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', function (e) { cur.classList.toggle('big', !!e.target.closest('[data-cursor=view]')); });
  } else cur.remove();

  // ── mobile menu ──
  var mb = $('.menu-btn');
  mb.addEventListener('click', function () { var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });

  // ── home scroll buttons ──
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-goto]'); if (!g) return;
    var el = document.getElementById(g.dataset.goto); if (el) scrollToY(el.getBoundingClientRect().top + window.scrollY + (el === range ? innerHeight * 0.25 : 0));
  });

  // ── page transition ──
  var wipe = $('#wipe'), wiping = false;
  function clearWipe() { wipe.classList.remove('go', 'back'); wiping = false; }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#/"]'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var href = a.getAttribute('href');
    nav.classList.remove('open');
    if (href === location.hash || (href === '#/' && (location.hash === '' || location.hash === '#/'))) { e.preventDefault(); toTop(); return; }
    if (reduced) return;
    e.preventDefault();
    wipe.style.setProperty('--wx', e.clientX + 'px'); wipe.style.setProperty('--wy', e.clientY + 'px');
    wipe.style.setProperty('--wc', a.dataset.colour || '#F6D3DB');
    wipe.classList.remove('back'); void wipe.offsetWidth; wipe.classList.add('go'); wiping = true;
    setTimeout(function () { location.hash = href; }, 460);
  });
  addEventListener('pageshow', function (e) { if (e.persisted) clearWipe(); });

  // ── inner page templates ──
  var ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3c5 3.5 6.5 9 0 17-6.5-8-5-13.5 0-17z"/></svg>';
  function cardVars(t) { return '--c0:' + t.pal[0] + ';--c1:' + t.pal[1] + ';--c2:' + t.pal[2] + ';--c3:' + t.pal[3] + ';--ci:' + t.ink; }
  function card(t) {
    return '<a class="t-card" href="#/tea/' + t.slug + '" data-colour="' + t.pal[2] + '" data-filter="' + t.filter + '" data-cursor="view" style="' + cardVars(t) + '">' +
      '<div class="art">' + A.tin(t) + '</div><div class="body"><span class="kind">' + esc(t.kind) + '</span><h3>' + esc(t.name) + '</h3><p>' + esc(t.tagline) + '</p>' +
      '<div class="price"><span>from ' + inr(t.sizes[0][1]) + '</span><i>View →</i></div></div></a>';
  }
  function footCta(txt) {
    return '<section class="sec" style="text-align:center;padding-bottom:120px"><div class="wrap"><h2>' + txt + '</h2>' +
      '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><a class="pill" href="#/contact" data-colour="#F6D3DB">Enquire <i>→</i></a><a class="pill pill--ghost" href="#/teas" data-colour="#F6D3DB">All teas</a></div></div></section>';
  }

  var pages = {
    teas: function () {
      document.title = 'Our teas — Ittarbagh Tea Co.';
      return '<header class="p-head" data-pal="master"><div><p class="crumbs"><a href="#/" data-colour="#F6D3DB">Home</a> / Teas</p>' +
        '<h1><span class="lm"><span>Five teas.</span></span><span class="lm"><span><em>All with real rose.</em></span></span></h1>' +
        '<p class="lede" data-rev>Two black, two green and one without caffeine. Every caddy is whole leaf and whole petal, blended in small batches.</p></div></header>' +
        '<div class="solid" style="--ground:' + D.master.ground + '"><section class="sec"><div class="wrap">' +
        '<div class="filters" role="group" aria-label="Filter teas"><button aria-pressed="true" data-f="all">All</button><button aria-pressed="false" data-f="black">Black</button><button aria-pressed="false" data-f="green">Green</button><button aria-pressed="false" data-f="free">Caffeine-free</button></div>' +
        '<div class="t-grid">' + D.teas.map(card).join('') + '</div></div></section>' + footCta('Buying for a café or <em>a wedding?</em>') + '</div>';
    },
    tea: function (slug) {
      var t = bySlug[slug]; if (!t) return pages.nf();
      document.title = t.name + ' — Ittarbagh Tea Co.';
      var rel = D.teas.filter(function (x) { return x.slug !== t.slug; }).sort(function (a, b) { return (b.filter === t.filter) - (a.filter === t.filter); }).slice(0, 3);
      return '<header class="prod-head" data-pal="' + t.slug + '"><div>' +
        '<p class="crumbs"><a href="#/" data-colour="#F6D3DB">Home</a> / <a href="#/teas" data-colour="#F6D3DB">Teas</a> / ' + esc(t.name) + '</p>' +
        '<p class="kicker">' + esc(t.kind) + '</p>' +
        '<h1><span class="lm"><span>' + esc(t.name) + '</span></span></h1>' +
        '<p class="tag" data-rev>' + esc(t.tagline) + '</p>' +
        '<div class="sizes" role="group" aria-label="Size" data-rev>' + t.sizes.map(function (s, i) { return '<button type="button" aria-pressed="' + (i === (t.sizes.length > 2 ? 1 : 0)) + '" data-price="' + s[1] + '">' + esc(s[0]) + '<b>' + inr(s[1]) + '</b></button>'; }).join('') + '</div>' +
        '<div class="buy" data-rev><a class="pill" href="#/contact" data-colour="' + t.pal[2] + '">Enquire to order <i>→</i></a><span class="note" style="margin:0">Online checkout isn\'t part of this demo.</span></div>' +
        '</div><div class="tin">' + A.tin(t) + '</div></header>' +
        '<div class="solid" style="--ground:' + t.ground + ';' + cardVars(t) + '">' +
        '<section class="sec"><div class="wrap"><div class="benefits">' + t.benefits.map(function (b) { return '<div class="benefit" data-rev><div class="ico">' + ICON + '</div><h3>' + esc(b[0]) + '</h3><p>' + esc(b[1]) + '</p></div>'; }).join('') + '</div></div></section>' +
        '<section class="sec" style="padding-top:20px"><div class="wrap two"><div><h2>About this <em>tea</em></h2><p class="lead" data-rev>' + esc(t.desc) + '</p></div>' +
        '<div><h2>What\'s <em>inside</em></h2><ul class="inside-list" data-rev>' + t.inside.map(function (x) { var m = x.match(/^(.*?)\s*\((\d+%)\)$/); return '<li><span>' + esc(m ? m[1] : x) + '</span><span>' + (m ? m[2] : '') + '</span></li>'; }).join('') + '</ul>' +
        '<p class="note">Tasting notes: ' + t.notes.map(esc).join(' · ') + '</p></div></div></section>' +
        '<section class="sec" style="padding-top:20px"><div class="wrap"><h2>How to <em>brew it</em></h2><div class="brew">' + t.brew.map(function (b) { return '<div data-rev><b>' + esc(b[0]) + '</b><span>' + esc(b[1]) + '</span></div>'; }).join('') + '</div></div></section>' +
        '<section class="sec" style="padding-top:20px"><div class="wrap two"><div><h2>Questions</h2></div><div>' + t.faqs.map(function (f) { return '<details><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>'; }).join('') + '</div></div></section>' +
        '<section class="sec" style="padding-top:20px"><div class="wrap"><h2>You might <em>also like</em></h2><div class="related">' + rel.map(card).join('') + '</div></div></section>' +
        footCta('Want a caddy of <em>' + esc(t.short) + '?</em>') + '</div>';
    },
    about: function () {
      document.title = 'Our story — Ittarbagh Tea Co.';
      return '<header class="p-head" data-pal="story"><div><p class="crumbs"><a href="#/" data-colour="#F6D3DB">Home</a> / Our story</p>' +
        '<h1><span class="lm"><span>The perfume</span></span><span class="lm"><span><em>garden.</em></span></span></h1>' +
        '<p class="lede" data-rev><i>Ittar</i> is perfume, <i>bagh</i> is garden. We named the company after the rose fields outside Kannauj, where our petals come from.</p></div></header>' +
        '<div class="solid" style="--ground:' + D.story.ground + '">' +
        '<section class="sec"><div class="wrap two"><div><p class="lead" data-rev>Every summer, before sunrise, the rose fields around Kannauj are picked by hand and carried to the copper stills. The attar makers want the oil. We want what they leave behind.</p></div>' +
        '<div><p data-rev>[Founder Name] grew up between a family attar workshop in Kannauj and a tea broker\'s office in Kolkata, and spent years tasting at the Kolkata auctions before blending anything to sell. The first caddies were gifts for relatives at Diwali. The relatives kept asking for more.</p>' +
        '<p data-rev>Today we still buy leaf the same way: small lots, tasted before we bid, from gardens we can name. The petals are shade-dried within a week of picking, and every batch is blended by hand at one table in Kolkata.</p></div></div></section>' +
        '<section class="sec" style="padding-top:0"><div class="wrap"><div class="stats">' +
        [['5', 'teas in the range'], ['2', 'cities: Kannauj and Kolkata'], ['0', 'flavouring oils, ever'], ['1', 'blending table']].map(function (s) { return '<div data-rev><b>' + s[0] + '</b><span>' + s[1] + '</span></div>'; }).join('') +
        '</div><p class="note">Placeholder figures for a fictional brand.</p></div></section>' +
        '<section class="sec" style="padding-top:20px"><div class="wrap two"><div><h2>How we <em>got here</em></h2></div><div class="timeline">' +
        [['Year 1', 'Damask Darjeeling, blended for family at Diwali.'], ['Year 2', 'Gulkand Chai joins, for everyone who wanted milk tea.'], ['Year 3', 'The first café in Kolkata puts us on its menu.'], ['Year 4', 'Kahwa Rose, Nilgiri Rose Green and Rose Hibiscus complete the range.'], ['Today', 'Caddies sold online, in cafés and as wedding and festival gift boxes.']].map(function (x) { return '<div data-rev><b>' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('') +
        '</div></div></section>' +
        '<section class="sec" style="padding-top:20px"><div class="wrap"><h2>What we <em>hold to</em></h2><div class="values">' +
        [['Petals, not perfume', 'If a tea smells of rose, it\'s because there are roses in it. We never use flavouring oil.'], ['Leaf you can name', 'We buy from gardens we know and can tell you which estate your tea came from.'], ['Small batches', 'Blended weekly, so the caddy you open was packed weeks ago, not seasons ago.']].map(function (v) { return '<div data-rev><h3>' + v[0] + '</h3><p>' + v[1] + '</p></div>'; }).join('') +
        '</div></div></section>' + footCta('Taste the <em>garden.</em>') + '</div>';
    },
    contact: function () {
      document.title = 'Where to buy — Ittarbagh Tea Co.';
      return '<header class="p-head" data-pal="master"><div><p class="crumbs"><a href="#/" data-colour="#F6D3DB">Home</a> / Where to buy</p>' +
        '<h1><span class="lm"><span>Where to</span></span><span class="lm"><span><em>find us.</em></span></span></h1>' +
        '<p class="lede" data-rev>Order a caddy, stock us in your café or hotel, or build a gift box for a wedding or Diwali. We reply within one working day.</p></div></header>' +
        '<div class="solid" style="--ground:' + D.master.ground + '"><section class="sec"><div class="wrap contact-grid">' +
        '<div><h2>Send an <em>enquiry</em></h2><form id="enq" novalidate>' +
        '<label>Name<input name="name" required autocomplete="name"></label>' +
        '<label>Email<input name="email" type="email" required autocomplete="email"></label>' +
        '<label>Phone<input name="phone" type="tel" autocomplete="tel"></label>' +
        '<label>I\'m interested in<select name="type"><option>Buying for myself</option><option>Wholesale for a café or shop</option><option>Hotel or restaurant supply</option><option>Wedding or festival gift boxes</option><option>Corporate gifting</option></select></label>' +
        '<label class="full">Message<textarea name="msg" placeholder="Which teas, how much, and by when?"></textarea></label>' +
        '<div class="full"><button class="pill" type="submit">Send enquiry <i>→</i></button></div></form></div>' +
        '<div><h2>Buy <em>online</em></h2><div class="where">' +
        ['Marketplace', 'Quick-commerce app', 'Gourmet grocery chain'].map(function (m) { return '<div class="row ph-logo" data-rev><b>[' + m + ']</b><span>Placeholder link</span></div>'; }).join('') +
        '</div><div class="info" data-rev><div><b>Email</b>hello@ittarbagh.example</div><div><b>Phone</b>555-0142 (placeholder)</div><div><b>Blending house</b>Kolkata, West Bengal</div><div><b>Petals from</b>Kannauj, Uttar Pradesh</div><div><b>Hours</b>Mon–Sat, 10:00–18:00 IST</div></div></div>' +
        '</div></section></div>';
    },
    nf: function () {
      document.title = 'Not found — Ittarbagh Tea Co.';
      return '<header class="p-head" data-pal="master" style="min-height:80svh"><div><p class="crumbs">404</p><h1><span class="lm"><span>This cup</span></span><span class="lm"><span><em>is empty.</em></span></span></h1>' +
        '<p class="lede">The page you wanted isn\'t here.</p><p style="margin-top:28px"><a class="pill" href="#/" data-colour="#F6D3DB">Back home <i>→</i></a></p></div></header>';
    }
  };

  function wireView() {
    var f = $('.filters', viewEl);
    if (f) f.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      $$('button', f).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      $$('.t-card', viewEl).forEach(function (c) { c.hidden = !(b.dataset.f === 'all' || c.dataset.filter === b.dataset.f); });
    });
    var sz = $('.sizes', viewEl);
    if (sz) sz.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; $$('button', sz).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); });
    var form = $('#enq', viewEl);
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.name.value.trim() || !form.email.value.trim()) { (form.name.value.trim() ? form.email : form.name).focus(); return; }
      form.innerHTML = '<p class="sent">Thank you. In the real site this would reach the Ittarbagh team. This is a demo, so nothing was sent.</p>';
    });
    if (matchMedia('(hover: hover)').matches && !reduced) {
      $$('.t-card', viewEl).forEach(function (c) {
        c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; c.style.transform = 'perspective(900px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg) translateY(-4px)'; });
        c.addEventListener('pointerleave', function () { c.style.transform = ''; });
      });
    }
  }

  // ── router ──
  function route() {
    var h = location.hash.replace(/^#\/?/, ''), parts = h.split('/');
    nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false');
    cur && cur.classList && cur.classList.remove('big');
    if (!h) {
      onHome = true; viewEl.hidden = true; viewEl.innerHTML = ''; homeEl.hidden = false;
      document.title = 'Ittarbagh Tea Co. — Rose teas from Kannauj and the hills';
    } else {
      onHome = false; homeEl.hidden = true; viewEl.hidden = false;
      var html = parts[0] === 'tea' ? pages.tea(parts[1]) : pages[parts[0]] && parts[0] !== 'tea' && parts[0] !== 'nf' ? pages[parts[0]]() : pages.nf();
      viewEl.innerHTML = html;
      wireView();
      observe(viewEl);
    }
    $$('.nav ul a').forEach(function (a) { var on = a.getAttribute('href') === '#/' + parts[0]; if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    toTop();
    if (lenis) lenis.resize();
    var first = $('[data-pal]', onHome ? homeEl : viewEl), p = palOf(first.dataset.pal === 'master' && heroOverride && onHome ? heroOverride : first.dataset.pal);
    L.setPalette(p.pal, p.ink, !wiping);
    // timers, not rAF: the overlay must clear even if frames stall
    setTimeout(function () {
      update();
      if (!onHome) $$('.p-head, .prod-head', viewEl).forEach(function (el) { el.classList.add('in'); });
      if (wiping) { wipe.classList.add('back'); setTimeout(clearWipe, 540); }
      else clearWipe();
    }, 40);
  }
  addEventListener('hashchange', route);
  route();
  if (preDone) $('.hero').classList.add('in');
})();
