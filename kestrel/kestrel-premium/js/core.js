/* ══════════════════════════════════════════════════════════════════
   KESTREL — core
   Helpers shared by every chapter: the paper sheet that folds into a
   plane (and carries the applicant's stamps), a polar-night sky with
   stars + aurora, a studio environment for reflections, gold flight
   trails, a Catmull-Rom camera rig with holds, lat/lon maths, the
   land mask for the globe, and the scene registry main.js drives.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var AM = window.AM = {};

  AM.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  AM.lerp = function (a, b, t) { return a + (b - a) * t; };
  AM.range = function (p, a, b) { return AM.clamp((p - a) / (b - a), 0, 1); };
  AM.smooth = function (t) { t = AM.clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
  AM.ease = function (t) { return 1 - Math.pow(1 - AM.clamp(t, 0, 1), 3); };
  AM.seeded = function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

  AM.REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  AM.COARSE = window.matchMedia('(pointer: coarse)').matches;
  AM.NARROW = innerWidth <= 900;
  AM.TIER = (AM.COARSE || innerWidth < 600) ? 0.35 : 1;   // budget follows the device, not a narrow desktop window
  AM.MOTION = AM.REDUCED ? 0 : 1;                  // scales idle (non-scroll) motion

  AM.scenes = {};
  AM.register = function (name, def) { AM.scenes[name] = def; };

  /* ── preloader bookkeeping: real steps, not a timer ─────────── */
  AM.pre = {
    total: 9, done: 0,
    step: function (label) {
      this.done = Math.min(this.total, this.done + 1);
      var p = this.done / this.total;
      var f = document.getElementById('preFill'), n = document.getElementById('preNum'), l = document.getElementById('preLabel');
      if (f) f.style.transform = 'scaleY(' + p.toFixed(3) + ')';
      if (n) n.textContent = String(Math.round(p * 100)).padStart(2, '0');
      if (l && label) l.textContent = label;
    }
  };

  var C = function (h) { return new THREE.Color(h); };

  /* ── THE SHEET ──────────────────────────────────────────────
     The applicant's file, drawn on a canvas: a Kestrel assessment
     worksheet. `ticks` fills in answers, `stamps` adds the journey
     stamps (Assessed, Filed, Landed, Citizen). Cached per state.    */
  var texCache = {};
  var PW = 1024, PH = 1325;
  function stamp(g, x, y, r, rot, word, sub, col) {
    g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = 0.86;
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 6;
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, r - 12, 0, Math.PI * 2); g.stroke();
    g.font = '700 34px Montserrat, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(word, 0, -4);
    g.font = '500 17px "IBM Plex Mono", monospace'; g.fillText(sub, 0, 30);
    for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2; g.fillRect(Math.cos(a) * (r - 30) - 2, Math.sin(a) * (r - 30) - 2, 4, 4); }
    g.restore();
  }
  AM.paperTex = function (ticks, stamps) {
    var key = ticks + ':' + stamps;
    if (texCache[key]) return texCache[key];
    var c = document.createElement('canvas'); c.width = PW; c.height = PH;
    var g = c.getContext('2d');
    g.fillStyle = '#eef1f6'; g.fillRect(0, 0, PW, PH);
    /* faint paper fibre */
    var r = AM.seeded(9);
    for (var i = 0; i < 1400; i++) { g.fillStyle = 'rgba(40,60,110,' + (r() * 0.035).toFixed(3) + ')'; g.fillRect(r() * PW, r() * PH, 1 + r() * 3, 1); }
    /* header band */
    g.fillStyle = '#101b3a'; g.fillRect(0, 0, PW, 190);
    g.fillStyle = '#e8874a'; g.fillRect(0, 190, PW, 8);
    g.font = '700 58px Montserrat, Arial, sans-serif'; g.textBaseline = 'alphabetic';
    g.fillStyle = '#eef1f6'; g.fillText('KES', 64, 108);
    var w = g.measureText('KES').width; g.fillStyle = '#e8874a'; g.fillText('TREL', 64 + w + 8, 108);
    g.font = '500 22px "IBM Plex Mono", monospace'; g.fillStyle = 'rgba(238,241,246,.7)';
    g.fillText('IMMIGRATION SERVICES INC.  ·  TORONTO, ON', 64, 150);
    /* title */
    g.fillStyle = '#101b3a'; g.font = '600 50px Montserrat, Arial, sans-serif';
    g.fillText('Eligibility Assessment', 64, 290);
    g.font = '400 22px "IBM Plex Mono", monospace'; g.fillStyle = '#56627e';
    g.fillText('APPLICANT FILE  ·  PAGE 1 OF 1', 64, 332);
    /* fields */
    var F = [['Given name', 'A. Applicant'], ['Country of residence', 'India'], ['Age', '29'], ['Highest education', "Master's degree"],
      ['Official language test', 'IELTS · CLB 9'], ['Skilled work experience', '4 years'], ['Family in Canada', 'Sibling'], ['Settlement funds', 'Documented']];
    for (i = 0; i < F.length; i++) {
      var y = 420 + i * 88;
      g.font = '500 19px "IBM Plex Mono", monospace'; g.fillStyle = '#56627e'; g.fillText(F[i][0].toUpperCase(), 64, y);
      g.strokeStyle = 'rgba(16,27,58,.28)'; g.lineWidth = 2; g.beginPath(); g.moveTo(64, y + 44); g.lineTo(PW - 64, y + 44); g.stroke();
      if (i < ticks * 2) { g.font = 'italic 400 34px Montserrat, Arial, sans-serif'; g.fillStyle = '#1b3a8a'; g.fillText(F[i][1], 420, y + 34); }
    }
    /* program boxes */
    var P = ['Immigrate', 'Study', 'Work', 'Visit', 'Invest', 'Sponsor'];
    g.font = '500 19px "IBM Plex Mono", monospace'; g.fillStyle = '#56627e'; g.fillText('INTERESTED IN', 64, 1150);
    for (i = 0; i < P.length; i++) {
      var bx = 64 + (i % 3) * 300, by = 1180 + Math.floor(i / 3) * 64;
      g.strokeStyle = '#101b3a'; g.lineWidth = 2.5; g.strokeRect(bx, by, 34, 34);
      g.font = '500 28px Montserrat, Arial, sans-serif'; g.fillStyle = '#101b3a'; g.fillText(P[i], bx + 52, by + 28);
      if (ticks >= 4 && (i === 0 || i === 1)) {
        g.strokeStyle = '#1b3a8a'; g.lineWidth = 5; g.beginPath(); g.moveTo(bx + 6, by + 18); g.lineTo(bx + 15, by + 28); g.lineTo(bx + 34, by - 4); g.stroke();
      }
    }
    /* journey stamps */
    var S = [[760, 340, -0.25, 'ASSESSED', 'KESTREL', '#1b3a8a'], [800, 700, 0.18, 'FILED', 'IRCC', '#1b3a8a'],
      [690, 1000, -0.1, 'LANDED', 'CANADA', '#a8422f'], [470, 830, 0.12, 'CITIZEN', 'OATH TAKEN', '#a8422f']];
    for (i = 0; i < stamps && i < S.length; i++) stamp(g, S[i][0], S[i][1], 118, S[i][2], S[i][3], S[i][4], S[i][5]);
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return (texCache[key] = t);
  };

  /* ── THE PLANE ──────────────────────────────────────────────
     A grid on the sheet with two poses: flat, and folded into a dart
     (nose +y, top +z, keel hanging to -z). setFold(f) morphs:
     0→0.45 the corners fold in (rectangle → planform), 0.45→1 the
     keel folds down under the wings. UVs stay on the sheet, so the
     form stays printed on the wings.                              */
  var SW = 0.85, SH = 1.1;
  AM.makePaper = function (opts) {
    opts = opts || {};
    var NX = opts.nx || 18, NY = opts.ny || 24;
    var geo = new THREE.PlaneGeometry(SW, SH, NX, NY);
    var pos = geo.attributes.position, base = new Float32Array(pos.array);
    var mat = new THREE.MeshStandardMaterial({
      map: AM.paperTex(opts.ticks || 0, opts.stamps || 0), roughness: 0.8, metalness: 0, side: THREE.DoubleSide,
      emissive: C('#223055'), emissiveIntensity: opts.glow != null ? opts.glow : 0.25, envMapIntensity: 0.7
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.userData.fold = -1;
    var half = SW / 2;
    function planform(t) { return { span: 0.36 * Math.pow(1 - t, 0.9) + 0.006, keel: 0.11 * (1 - t) + 0.006 }; }
    mesh.setFold = function (f) {
      f = AM.clamp(f, 0, 1);
      if (Math.abs(f - mesh.userData.fold) < 1e-4) return;
      mesh.userData.fold = f;
      var a = AM.smooth(AM.range(f, 0, 0.45)), b = AM.smooth(AM.range(f, 0.45, 1));
      var th = b * Math.PI / 2, ct = Math.cos(th), st = Math.sin(th);
      for (var i = 0; i < pos.count; i++) {
        var x = base[i * 3], y = base[i * 3 + 1];
        var t = AM.clamp((y + SH / 2) / SH, 0, 1), s = Math.abs(x) / half, sg = x < 0 ? -1 : 1, k = 0.34, pf = planform(t);
        /* flattened planform */
        var q, fx, fz = 0, px, pz;
        if (s <= k) { q = s / k; fx = sg * pf.keel * q; } else { q = (s - k) / (1 - k); fx = sg * (pf.keel + q * pf.span); }
        /* folding the keel down around the wing root */
        var root = sg * AM.lerp(pf.keel, 0.004, b);
        if (s <= k) { var d = pf.keel * (1 - s / k); px = root - sg * d * ct; pz = -d * st; }
        else { px = root + sg * q * pf.span; pz = q * 0.035 * b + q * q * 0.02 * b; }
        /* rectangle → planform, with a little lift while folding */
        var X = AM.lerp(x, fx, a), Z = fz + Math.sin(a * Math.PI) * 0.06 * s;
        X = AM.lerp(X, px, b); Z = AM.lerp(Z, pz, b);
        pos.setXYZ(i, X, y * AM.lerp(1, 0.92, a), Z);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
    };
    mesh.setTex = function (ticks, stamps) {
      var t = AM.paperTex(ticks, stamps);
      if (mat.map !== t) { mat.map = t; }
    };
    mesh.setFold(opts.fold != null ? opts.fold : 0);
    return mesh;
  };

  /* point a folded plane along dir with its top toward up */
  var _x = null, _y = null, _z = null, _m = null;
  AM.orient = function (obj, dir, up) {
    _x = _x || new THREE.Vector3(); _y = _y || new THREE.Vector3(); _z = _z || new THREE.Vector3(); _m = _m || new THREE.Matrix4();
    _y.copy(dir).normalize();
    _z.copy(up).addScaledVector(_y, -up.dot(_y)).normalize();
    _x.crossVectors(_y, _z);
    _m.makeBasis(_x, _y, _z);
    obj.quaternion.setFromRotationMatrix(_m);
  };

  /* ── polar sky: gradient + hashed stars + aurora curtains ── */
  AM.SKYGLSL = [
    'uniform vec3 uTop, uHor, uAurA, uAurB; uniform float uTime, uAur, uStars;',
    'float h31(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }',
    'float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);',
    '  float a = fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453), b = fract(sin(dot(i + vec2(1., 0.), vec2(12.9898, 78.233))) * 43758.5453);',
    '  float c = fract(sin(dot(i + vec2(0., 1.), vec2(12.9898, 78.233))) * 43758.5453), d = fract(sin(dot(i + vec2(1.), vec2(12.9898, 78.233))) * 43758.5453);',
    '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }',
    'vec3 sky(vec3 d){',
    '  float h = d.y;',
    '  vec3 c = mix(uHor, uTop, smoothstep(-0.05, 0.55, h));',
    '  vec3 q = d * 260.; vec3 id = floor(q); float s = h31(id);',
    '  float star = step(.9965, s) * smoothstep(.5, .05, length(fract(q) - .5)) * (.55 + .45 * sin(uTime * (1. + s * 3.) + s * 80.));',
    '  c += vec3(.85, .9, 1.) * star * smoothstep(0., .18, h) * uStars;',
    '  float az = atan(d.x, -d.z);',
    '  float band = 0.;',
    '  for (int k = 0; k < 3; k++) {',
    '    float fk = float(k);',
    '    float x = az * (2.2 + fk * .9) + uTime * (.05 + fk * .02) + fk * 1.7;',
    '    float wave = .26 + fk * .07 + .06 * sin(x * 1.3) + .04 * n2(vec2(x * 2., uTime * .1));',
    '    float curtain = smoothstep(wave - .01, wave + .03, h) * exp(-(h - wave) * (5. - fk));',
    '    float rays = .5 + .5 * n2(vec2(az * 38. + fk * 11., uTime * .25 + h * 2.));',
    '    band += curtain * rays * (1. - fk * .25);',
    '  }',
    '  vec3 aur = mix(uAurA, uAurB, smoothstep(.3, .6, h));',
    '  c += aur * band * uAur * smoothstep(-.02, .12, h);',
    '  return c;',
    '}'].join('\n');
  AM.GLTAIL = '\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n';
  AM.skyUniforms = function () {
    return {
      uTop: { value: C('#03060f') }, uHor: { value: C('#16264a') }, uAurA: { value: C('#3fe0b0') }, uAurB: { value: C('#7a5cff') },
      uTime: { value: 0 }, uAur: { value: 0.6 }, uStars: { value: 1 }
    };
  };
  AM.skyDome = function (U, r) {
    var m = new THREE.Mesh(new THREE.SphereGeometry(r || 100, 48, 24), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, uniforms: U,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: AM.SKYGLSL + '\nvarying vec3 vD; void main(){ gl_FragColor = vec4(sky(normalize(vD)), 1.);' + AM.GLTAIL + '}'
    }));
    m.renderOrder = -1; m.frustumCulled = false;
    return m;
  };

  /* ── studio environment: a few emissive cards baked to PMREM ─ */
  AM.buildEnv = function (renderer) {
    var env = new THREE.Scene();
    env.background = C('#04070f');
    var card = function (col, w, h, x, y, z) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
    };
    card('#dfe8ff', 9, 4, -6, 7, 5);     // cool moonlight key, high left
    card('#6fd2b4', 5, 7, 8, 2, 2);      // aurora fill, right
    card('#ffffff', 1.2, 10, 0, 8, -4);  // thin white strip for the specular line
    card('#e8874a', 12, 1.4, 0, -1, -9); // low gold horizon
    card('#101b3a', 14, 3, 0, -8, 3);    // navy floor bounce
    var pm = new THREE.PMREMGenerator(renderer);
    var rt = pm.fromScene(env, 0.03);
    pm.dispose();
    return rt.texture;
  };

  AM.glowTex = function () {
    if (AM._glow) return AM._glow;
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.15, 'rgba(255,255,255,.55)');
    grd.addColorStop(0.4, 'rgba(255,255,255,.12)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (AM._glow = t);
  };
  AM.glow = function (color, size, opacity) {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: AM.glowTex(), color: color, transparent: true, opacity: opacity == null ? 1 : opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.setScalar(size); return s;
  };

  /* drifting motes: shader-driven so they cost nothing on the CPU.
     speed > 0 drifts up (dust), < 0 falls (snow).                  */
  AM.motes = function (count, box, color, size, speed) {
    speed = speed == null ? 1 : speed;
    var g = new THREE.BufferGeometry(), p = new Float32Array(count * 3), s = new Float32Array(count);
    var r = AM.seeded(77);
    for (var i = 0; i < count; i++) {
      p[i * 3] = (r() - 0.5) * box[0]; p[i * 3 + 1] = (r() - 0.5) * box[1]; p[i * 3 + 2] = (r() - 0.5) * box[2]; s[i] = r();
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(s, 1));
    var m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uSize: { value: size }, uColor: { value: C(color) }, uOpacity: { value: 1 }, uBox: { value: new THREE.Vector3(box[0], box[1], box[2]) }, uSpeed: { value: speed } },
      vertexShader: [
        'attribute float aSeed; uniform float uTime, uSize, uSpeed; uniform vec3 uBox; varying float vA;',
        'void main(){',
        '  vec3 p = position;',
        '  p.y = mod(p.y + uTime * uSpeed * (0.02 + aSeed * 0.05) + uBox.y * .5, uBox.y) - uBox.y * .5;',
        '  p.x += sin(uTime * .3 + aSeed * 40.) * .08 * uBox.x * .1;',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.);',
        '  gl_Position = projectionMatrix * mv;',
        '  gl_PointSize = uSize * (0.4 + aSeed) * (300. / -mv.z);',
        '  vA = 0.35 + 0.65 * fract(aSeed * 13.7);',
        '}'].join('\n'),
      fragmentShader: [
        'uniform vec3 uColor; uniform float uOpacity; varying float vA;',
        'void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d);',
        '  gl_FragColor = vec4(uColor, a * vA * uOpacity); }'].join('\n')
    });
    var pts = new THREE.Points(g, m); pts.frustumCulled = false;
    return pts;
  };

  /* ── flight trail: a thin tube lit only behind the head ──────
     uHead 0..1 is how far along the curve the plane has flown.   */
  AM.trail = function (curve, color, radius, segs, len) {
    var geo = new THREE.TubeGeometry(curve, segs || 160, radius || 0.01, 6, false);
    var m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uHead: { value: 0 }, uLen: { value: len || 0.35 }, uColor: { value: C(color) }, uOpacity: { value: 1 } },
      vertexShader: 'varying float vU; void main(){ vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform float uHead, uLen, uOpacity; uniform vec3 uColor; varying float vU;' +
        'void main(){ float a = smoothstep(uHead - uLen, uHead, vU) * step(vU, uHead); gl_FragColor = vec4(uColor, a * uOpacity); }'
    }));
    m.frustumCulled = false;
    return m;
  };

  /* ── globe maths ── */
  AM.ll2v = function (lat, lon, r, out) {
    var phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
    out = out || new THREE.Vector3();
    return out.set(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  };
  /* the land mask comes from a public world outline (Natural Earth
     derived, shipped inside echarts 4). It loads as a plain script;
     a stub catches registerMap so echarts itself is never needed.  */
  AM.land = new Promise(function (resolve) {
    var done = false, finish = function (v) { if (!done) { done = true; resolve(v); } };
    setTimeout(function () { finish(null); }, 6000);
    try {
      var got = null;
      window.echarts = window.echarts || { registerMap: function (n, d) { if (n === 'world') got = d; } };
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/js/world.js';
      s.async = true;
      s.onerror = function () { finish(null); };
      s.onload = function () {
        if (!got) return finish(null);
        var W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H;
        var g = c.getContext('2d'); g.fillStyle = '#fff';
        var dec = function (str, off, scale) {
          var out = [], px = off[0], py = off[1];
          for (var i = 0; i < str.length; i += 2) {
            var x = str.charCodeAt(i) - 64, y = str.charCodeAt(i + 1) - 64;
            x = (x >> 1) ^ (-(x & 1)); y = (y >> 1) ^ (-(y & 1));
            x += px; y += py; px = x; py = y;
            out.push([x / scale, y / scale]);
          }
          return out;
        };
        var ring = function (pts) {
          for (var i = 0; i < pts.length; i++) {
            var X = (pts[i][0] + 180) / 360 * W, Y = (90 - pts[i][1]) / 180 * H;
            if (i === 0 || Math.abs(pts[i][0] - pts[i - 1][0]) > 180) g.moveTo(X, Y); else g.lineTo(X, Y);
          }
          g.closePath();
        };
        got.features.forEach(function (f) {
          var geo = f.geometry, polys = geo.type === 'Polygon' ? [geo.coordinates] : geo.coordinates;
          var offs = geo.type === 'Polygon' ? [geo.encodeOffsets] : geo.encodeOffsets;
          polys.forEach(function (poly, pi) {
            g.beginPath();
            poly.forEach(function (rs, ri) { ring(got.UTF8Encoding ? dec(rs, offs[pi][ri], 1024) : rs); });
            g.fill('evenodd');
          });
        });
        var data = g.getImageData(0, 0, W, H).data;
        finish({ W: W, H: H, at: function (lat, lon) {
          var x = Math.floor((lon + 180) / 360 * W) % W, y = AM.clamp(Math.floor((90 - lat) / 180 * H), 0, H - 1);
          return data[(y * W + x) * 4] > 127;
        } });
      };
      document.head.appendChild(s);
    } catch (e) { finish(null); }
  });

  /* project a world point to a screen label */
  var _v = null;
  AM.label = function (el, v, camera, alpha) {
    _v = _v || new THREE.Vector3();
    _v.copy(v).project(camera);
    var vis = alpha > 0.01 && _v.z < 1;
    el.style.opacity = vis ? alpha.toFixed(3) : '0';
    if (vis) el.style.transform = 'translate3d(' + ((_v.x + 1) / 2 * innerWidth).toFixed(1) + 'px,' + ((1 - _v.y) / 2 * innerHeight).toFixed(1) + 'px,0)';
  };

  /* ── camera rig ───────────────────────────────────────────────
     KEYS: named poses. TRANS: [{p0, p1, keys:[...]}] flights through
     the listed keys (Catmull-Rom, smootherstep-eased). Between flights
     the camera holds on the last key it reached.                     */
  function cr(a, b, c, d, t) {
    var t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  }
  AM.rig = function (KEYS, TRANS) {
    return function (p, out) {
      var tr = null, i;
      for (i = 0; i < TRANS.length; i++) if (p >= TRANS[i].p0 && p <= TRANS[i].p1) { tr = TRANS[i]; break; }
      if (!tr) {
        var k = KEYS[TRANS[0].keys[0]];
        for (i = TRANS.length - 1; i >= 0; i--) if (p > TRANS[i].p1) { k = KEYS[TRANS[i].keys[TRANS[i].keys.length - 1]]; break; }
        out.pos.set(k.pos[0], k.pos[1], k.pos[2]); out.tgt.set(k.tgt[0], k.tgt[1], k.tgt[2]); out.roll = k.roll || 0;
        return out;
      }
      var keys = tr.keys, n = keys.length, u = AM.smooth((p - tr.p0) / (tr.p1 - tr.p0));
      var f = u * (n - 1), j = Math.min(n - 2, Math.floor(f)), t = f - j;
      var k0 = KEYS[keys[Math.max(0, j - 1)]], k1 = KEYS[keys[j]], k2 = KEYS[keys[j + 1]], k3 = KEYS[keys[Math.min(n - 1, j + 2)]];
      out.pos.set(cr(k0.pos[0], k1.pos[0], k2.pos[0], k3.pos[0], t), cr(k0.pos[1], k1.pos[1], k2.pos[1], k3.pos[1], t), cr(k0.pos[2], k1.pos[2], k2.pos[2], k3.pos[2], t));
      out.tgt.set(cr(k0.tgt[0], k1.tgt[0], k2.tgt[0], k3.tgt[0], t), cr(k0.tgt[1], k1.tgt[1], k2.tgt[1], k3.tgt[1], t), cr(k0.tgt[2], k1.tgt[2], k2.tgt[2], k3.tgt[2], t));
      out.roll = cr(k0.roll || 0, k1.roll || 0, k2.roll || 0, k3.roll || 0, t);
      return out;
    };
  };
  AM.camState = function () { return { pos: new THREE.Vector3(), tgt: new THREE.Vector3(), roll: 0 }; };

  /* apply a rig state + mouse parallax, then roll about the view axis */
  var _fwd, _q;
  AM.applyCam = function (camera, st, sway) {
    _fwd = _fwd || new THREE.Vector3(); _q = _q || new THREE.Quaternion();
    sway = sway == null ? 1 : sway;
    camera.position.set(st.pos.x + AM.mouse.x * 0.35 * sway, st.pos.y - AM.mouse.y * 0.22 * sway, st.pos.z);
    camera.up.set(0, 1, 0);
    camera.lookAt(st.tgt);
    if (st.roll) { _fwd.subVectors(st.tgt, camera.position).normalize(); _q.setFromAxisAngle(_fwd, st.roll); camera.quaternion.premultiply(_q); }
  };
  AM.mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  /* shift the frame so the subject sits beside the copy, not under it */
  AM.aim = function (camera) {
    var W = innerWidth, H = innerHeight, sx = camera.userData.shiftX != null ? camera.userData.shiftX : 0.14;
    camera.aspect = W / H;
    /* portrait screens: widen the lens so subjects framed for landscape still fit across */
    if (camera.userData.fov0 == null) camera.userData.fov0 = camera.fov;
    camera.fov = camera.userData.fov0 * AM.lerp(1, 1.6, AM.clamp((1.1 - camera.aspect) / 0.65, 0, 1));
    if (AM.NARROW) camera.setViewOffset(W, H, 0, H * 0.16, W, H);
    else camera.setViewOffset(W, H, -W * sx, 0, W, H);
    camera.updateProjectionMatrix();
  };
})();
