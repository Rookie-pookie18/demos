/* ══════════════════════════════════════════════════════════════════
   ANNA MILLS — core
   Helpers shared by every chapter: the procedural rice grain, a tiny
   studio environment for reflections, a Catmull-Rom camera rig with
   holds, and a scene registry the director (main.js) drives.
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
    total: 8, done: 0,
    step: function (label) {
      this.done = Math.min(this.total, this.done + 1);
      var p = this.done / this.total;
      var f = document.getElementById('preFill'), n = document.getElementById('preNum'), l = document.getElementById('preLabel');
      if (f) f.setAttribute('width', String(120 * p));
      if (n) n.textContent = String(Math.round(p * 100)).padStart(2, '0');
      if (l && label) l.textContent = label;
    }
  };

  /* ── THE GRAIN ───────────────────────────────────────────────
     A UV sphere reshaped into a rice kernel: superellipse profile
     (flat-sided, rounded ends), blunt germ end, pointed tip, slightly
     flattened and bent. Long axis ends up on X, half-length 1.      */
  AM.shapeGrain = function (geo, W, flat, ridges) {
    var pos = geo.attributes.position, v = new THREE.Vector3();
    for (var i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      var y = v.y, ay = Math.abs(y);
      var rr = Math.sqrt(v.x * v.x + v.z * v.z);
      var prof = Math.pow(Math.max(0, 1 - Math.pow(ay, 3.2)), 1 / 3.2);
      prof *= y > 0 ? 1 - 0.1 * y * y : 1 - 0.2 * ay * ay * ay;
      var k = rr > 1e-5 ? (W * prof) / rr : 0;
      var x = v.x * k, z = v.z * k * flat;
      if (ridges) {
        var r = 1 + Math.sin(Math.atan2(v.z, v.x) * ridges) * 0.05 * prof;
        x *= r; z *= r;
      }
      x += 0.05 * (1 - y * y);                // gentle banana bend
      pos.setXYZ(i, x, y, z);
    }
    geo.rotateZ(-Math.PI / 2);
    geo.computeVertexNormals();
    return geo;
  };
  var geoCache = {};
  AM.grainGeo = function (detail) {
    var key = 'g' + detail;
    if (!geoCache[key]) {
      var ws = detail === 'hi' ? 72 : detail === 'mid' ? 28 : 12;
      var hs = detail === 'hi' ? 48 : detail === 'mid' ? 18 : 8;
      geoCache[key] = AM.shapeGrain(new THREE.SphereGeometry(1, ws, hs), 0.22, 0.84, 0);
    }
    return geoCache[key];
  };
  /* husk shell half: same shape, a touch larger, ribbed, open on one side */
  AM.huskHalf = function () {
    var g = new THREE.SphereGeometry(1, 64, 40, 0, Math.PI);
    return AM.shapeGrain(g, 0.235, 0.86, 22);
  };

  AM.PEARL = window.THREE ? new THREE.Color('#f3efe4') : null;
  AM.grainMat = function (o) {
    o = o || {};
    return new THREE.MeshPhysicalMaterial({
      color: o.color || AM.PEARL.clone(),
      roughness: o.roughness != null ? o.roughness : 0.34,
      metalness: 0,
      clearcoat: o.clearcoat != null ? o.clearcoat : 0.55,
      clearcoatRoughness: 0.3,
      sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color('#fff4e2'),
      emissive: new THREE.Color(o.emissive || '#1a140b'),   // cheap stand-in for translucency
      envMapIntensity: o.env != null ? o.env : 1.1
    });
  };

  /* ── studio environment: a few emissive cards baked to PMREM ─ */
  AM.buildEnv = function (renderer) {
    var env = new THREE.Scene();
    env.background = new THREE.Color('#050806');
    var card = function (col, w, h, x, y, z) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
    };
    card('#fff1d6', 9, 4, -6, 7, 5);     // warm key, high left
    card('#bfe0d2', 5, 7, 8, 1, 2);      // jade fill, right
    card('#ffffff', 1.2, 10, 0, 8, -4);  // thin white strip for the specular line
    card('#f0a64a', 12, 1.6, 0, -1, -9); // low amber horizon
    card('#16241c', 14, 3, 0, -8, 3);    // dark green floor bounce
    var pm = new THREE.PMREMGenerator(renderer);
    var rt = pm.fromScene(env, 0.03);
    pm.dispose();
    return rt.texture;
  };

  AM.glowTex = function () {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.15, 'rgba(255,255,255,.55)');
    grd.addColorStop(0.4, 'rgba(255,255,255,.12)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };

  /* drifting motes: shader-driven so they cost nothing on the CPU */
  AM.motes = function (count, box, color, size) {
    var g = new THREE.BufferGeometry(), p = new Float32Array(count * 3), s = new Float32Array(count);
    var r = AM.seeded(77);
    for (var i = 0; i < count; i++) {
      p[i * 3] = (r() - 0.5) * box[0]; p[i * 3 + 1] = (r() - 0.5) * box[1]; p[i * 3 + 2] = (r() - 0.5) * box[2]; s[i] = r();
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(s, 1));
    var m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uSize: { value: size }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: 1 }, uBox: { value: new THREE.Vector3(box[0], box[1], box[2]) } },
      vertexShader: [
        'attribute float aSeed; uniform float uTime, uSize; uniform vec3 uBox; varying float vA;',
        'void main(){',
        '  vec3 p = position;',
        '  p.y = mod(p.y + uTime * (0.02 + aSeed * 0.05) + uBox.y * .5, uBox.y) - uBox.y * .5;',
        '  p.x += sin(uTime * .3 + aSeed * 40.) * .08;',
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
    return new THREE.Points(g, m);
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
    if (AM.NARROW) camera.setViewOffset(W, H, 0, H * 0.16, W, H);
    else camera.setViewOffset(W, H, -W * sx, 0, W, H);
    camera.updateProjectionMatrix();
  };
})();
