/* ══════════════════════════════════════════════════════════════════
   VARIETIES · GLOBE · PLATE
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var AM = window.AM;
  if (!window.THREE) return;
  var C = function (h) { return new THREE.Color(h); };
  var sm = AM.smooth, rg = AM.range;
  var TAIL = '\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n';

  function shift(camera, sx) {
    var W = innerWidth, H = innerHeight;
    if (AM.NARROW) camera.setViewOffset(W, H, 0, H * 0.16, W, H);
    else camera.setViewOffset(W, H, -W * sx, 0, W, H);
  }

  /* ─────────────────────────── VARIETIES ─────────────────────────── */
  var V = [
    { len: 1.0,  w: 0.86, col: '#f4f0e6', rough: 0.32, em: '#1a140b', bg: '#12110d', mm: '8.35 mm' },
    { len: 0.62, w: 1.18, col: '#f7f7f1', rough: 0.38, em: '#141412', bg: '#0b1212', mm: '5.2 mm' },
    { len: 0.84, w: 0.95, col: '#eef1ee', rough: 0.2,  em: '#14181c', bg: '#0d1017', mm: '7.0 mm' },
    { len: 0.91, w: 1.0,  col: '#a8784a', rough: 0.55, em: '#1e1208', bg: '#150e09', mm: '7.6 mm' },
    { len: 0.98, w: 0.9,  col: '#e6b35f', rough: 0.24, em: '#3a2208', bg: '#161004', mm: '8.2 mm' }
  ];
  V.forEach(function (v) { v.c = C(v.col); v.e = C(v.em); v.b = C(v.bg); });

  AM.register('varieties', {
    build: function (renderer, env) {
      var S = this, r = AM.seeded(9);
      var scene = S.scene = new THREE.Scene(); scene.environment = env; scene.background = V[0].b.clone();
      S.camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.05, 80);
      S.camera.userData.shiftX = 0.17;
      scene.add(new THREE.HemisphereLight('#e8efe9', '#0d0f0c', 0.4));
      var key = new THREE.DirectionalLight('#fff0dc', 2.2); key.position.set(-3, 4, 5); scene.add(key);
      var rim = new THREE.DirectionalLight('#cfe6dc', 2.2); rim.position.set(4, 2, -5); scene.add(rim);

      S.mat = AM.grainMat({ env: 1.3 });
      S.grain = new THREE.Mesh(AM.grainGeo('hi'), S.mat); scene.add(S.grain);

      var N = Math.round(240 * AM.TIER) + 60;
      S.ringMat = AM.grainMat({ env: 1 });
      var ring = S.ring = new THREE.InstancedMesh(AM.grainGeo('mid'), S.ringMat, N);
      S.rd = [];
      for (var i = 0; i < N; i++) S.rd.push({ a: r() * Math.PI * 2, rad: 2.3 + r() * 1.8, y: (r() - 0.5) * 0.9, s: 0.1 + r() * 0.08, e: new THREE.Euler(r() * 6, r() * 6, r() * 6) });
      ring.rotation.set(0.35, 0, -0.18); ring.frustumCulled = false; scene.add(ring);

      S.cal = document.getElementById('caliper'); S.calTxt = document.getElementById('caliperTxt'); S.idx = document.getElementById('vIdx');
      S.M = new THREE.Matrix4(); S.Q = new THREE.Quaternion(); S.P = new THREE.Vector3(); S.SC = new THREE.Vector3();
      S.a = new THREE.Vector3(); S.b = new THREE.Vector3(); S.lastIdx = -1;
    },
    update: function (part, p, t) {
      var S = this, mo = AM.MOTION;
      var f = 0; [0.2, 0.4, 0.6, 0.8].forEach(function (b) { f += sm(rg(p, b - 0.035, b + 0.035)); });
      var i0 = Math.min(3, Math.floor(f)), k = f - i0, A = V[i0], B = V[Math.min(4, i0 + 1)];
      var len = AM.lerp(A.len, B.len, k), w = AM.lerp(A.w, B.w, k), pulse = 1 - Math.sin(k * Math.PI) * 0.18;
      S.mat.color.lerpColors(A.c, B.c, k); S.mat.emissive.lerpColors(A.e, B.e, k); S.mat.roughness = AM.lerp(A.rough, B.rough, k);
      S.ringMat.color.copy(S.mat.color); S.ringMat.emissive.copy(S.mat.emissive); S.ringMat.roughness = S.mat.roughness;
      S.scene.background.lerpColors(A.b, B.b, k);
      S.grain.scale.set(1.3 * len * pulse, 1.3 * w * pulse, 1.3 * w * pulse);
      S.grain.rotation.set(p * 9 + t * 0.15 * mo, Math.sin(p * 7) * 0.22, -0.22);

      var M = S.M, Q = S.Q, P = S.P, SC = S.SC, spin = p * 2.2 + t * 0.04 * mo;
      for (var i = 0; i < S.rd.length; i++) {
        var d = S.rd[i], a = d.a + spin * (3.2 / d.rad);
        P.set(Math.cos(a) * d.rad, d.y, Math.sin(a) * d.rad);
        d.e.x += 0.002 * mo; Q.setFromEuler(d.e);
        SC.set(d.s * len * pulse, d.s * w, d.s * w); M.compose(P, Q, SC); S.ring.setMatrixAt(i, M);
      }
      S.ring.instanceMatrix.needsUpdate = true;

      S.camera.position.set(Math.sin(p * 2) * 0.5 + AM.mouse.x * 0.3, 0.25 - AM.mouse.y * 0.2, 6.4);
      S.camera.lookAt(0, 0, 0);
      shift(S.camera, 0.17); S.camera.updateProjectionMatrix();

      /* caliper: project the kernel's tips to the screen */
      var idx = Math.round(f);
      if (idx !== S.lastIdx) { S.lastIdx = idx; S.idx.textContent = '0' + (idx + 1); S.calTxt.textContent = V[idx].mm; }
      S.grain.updateMatrixWorld();
      S.a.set(-1, 0, 0).applyMatrix4(S.grain.matrixWorld).project(S.camera);
      S.b.set(1, 0, 0).applyMatrix4(S.grain.matrixWorld).project(S.camera);
      var W = innerWidth, H = innerHeight;
      var x1 = (S.a.x + 1) / 2 * W, y1 = (1 - S.a.y) / 2 * H, x2 = (S.b.x + 1) / 2 * W, y2 = (1 - S.b.y) / 2 * H;
      var drop = Math.max(40, H * 0.09 * w) + 24;
      var L = Math.hypot(x2 - x1, y2 - y1), ang = Math.atan2(y2 - y1, x2 - x1);
      S.cal.style.width = L.toFixed(1) + 'px';
      S.cal.style.transform = 'translate(' + x1.toFixed(1) + 'px,' + (y1 + drop).toFixed(1) + 'px) rotate(' + ang.toFixed(3) + 'rad)';
      S.cal.style.opacity = (1 - Math.sin(k * Math.PI)) * sm(rg(p, 0.01, 0.05)) * 0.9;
    }
  });

  /* ─────────────────────────── GLOBE ─────────────────────────── */
  var LAND = [ // [lat, lon, latRadius, lonRadius] — a coarse blob map, enough to read as Earth
    [50, -100, 16, 30], [36, -95, 11, 18], [21, -102, 8, 8], [62, -150, 7, 16], [66, -95, 9, 32], [72, -40, 9, 14],
    [-5, -62, 14, 15], [-24, -58, 12, 10], [-42, -68, 10, 5], [9, -75, 5, 6],
    [50, 12, 9, 18], [62, 18, 7, 12], [41, -4, 5, 6], [43, 14, 4, 5], [54, -3, 4, 3],
    [11, 14, 15, 26], [26, 12, 9, 22], [-6, 24, 12, 13], [-23, 25, 10, 10], [7, 42, 6, 6],
    [23, 47, 8, 10], [33, 53, 7, 12],
    [57, 90, 13, 45], [42, 95, 11, 25], [67, 125, 8, 40], [30, 112, 10, 11], [46, 70, 8, 16],
    [21, 78, 9, 7], [13, 78, 6, 4], [16, 102, 6, 5], [1, 113, 4, 10], [-4, 122, 4, 16], [36, 138, 5, 3],
    [-25, 134, 10, 17], [-41, 173, 5, 3]
  ];
  var ORIGIN = [29.69, 76.99];
  var DEST = [[25.2, 55.3], [24.7, 46.7], [51.5, -0.1], [51.9, 4.5], [43.7, -79.4], [40.7, -74], [1.35, 103.8], [-1.3, 36.8], [-33.9, 151.2], [35.7, 139.7]];
  function ll(lat, lon, R) {
    var ph = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(-R * Math.sin(ph) * Math.cos(th), R * Math.cos(ph), R * Math.sin(ph) * Math.sin(th));
  }
  function isLand(lat, lon) {
    for (var i = 0; i < LAND.length; i++) { var b = LAND[i], a = (lat - b[0]) / b[2], o = (lon - b[1]) / b[3]; if (a * a + o * o < 1) return true; }
    return false;
  }

  AM.register('globe', {
    build: function (renderer, env) {
      var S = this, R = 2;
      var scene = S.scene = new THREE.Scene(); scene.background = C('#050807');
      S.camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 80);
      var globe = S.globe = new THREE.Group(); scene.add(globe);

      globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.992, 64, 48), new THREE.MeshBasicMaterial({ color: '#08110d' })));
      var N = AM.TIER < 1 ? 14000 : 30000, pts = [], jit = AM.seeded(4);
      for (var i = 0; i < N; i++) {
        var y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), th = i * 2.399963;
        var lat = Math.asin(y) * 180 / Math.PI, lon = ((th * 180 / Math.PI) % 360) - 180;
        if (!isLand(lat, lon)) continue;
        var q = ll(lat + (jit() - 0.5) * 0.9, lon + (jit() - 0.5) * 0.9, R);
        pts.push(q.x, q.y, q.z, jit());
      }
      var arr = new Float32Array(pts.length / 4 * 3), sd = new Float32Array(pts.length / 4);
      for (i = 0; i < pts.length / 4; i++) { arr[i * 3] = pts[i * 4]; arr[i * 3 + 1] = pts[i * 4 + 1]; arr[i * 3 + 2] = pts[i * 4 + 2]; sd[i] = pts[i * 4 + 3]; }
      var dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.BufferAttribute(arr, 3)); dg.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
      S.dotU = { uTime: { value: 0 }, uPx: { value: Math.min(devicePixelRatio || 1, 2) } };
      globe.add(new THREE.Points(dg, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, uniforms: S.dotU,
        vertexShader: 'attribute float aSeed; uniform float uTime, uPx; varying float vF, vS; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); vec3 n = normalize(normalMatrix * position); vF = clamp(dot(n, normalize(-mv.xyz)), 0., 1.); vS = aSeed; gl_Position = projectionMatrix * mv; gl_PointSize = 1.9 * uPx; }',
        fragmentShader: 'uniform float uTime; varying float vF, vS; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; float tw = .75 + .25 * sin(uTime * 1.3 + vS * 40.); vec3 c = mix(vec3(.36, .52, .44), vec3(.93, .95, .9), vF * .6); gl_FragColor = vec4(c, (.15 + vF * .85) * tw); }'
      })));

      /* atmosphere rim */
      globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.1, 64, 48), new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
        vertexShader: 'varying vec3 vN, vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'varying vec3 vN, vV; void main(){ float a = pow(clamp(dot(-vN, vV), 0., 1.), 2.5) * .4; gl_FragColor = vec4(vec3(.55, .78, .66) * a, a); }'
      })));

      /* arcs + travelling pulses */
      var glow = AM.glowTex(), o = ll(ORIGIN[0], ORIGIN[1], R);
      S.arcs = DEST.map(function (d) {
        var e = ll(d[0], d[1], R), mid = o.clone().add(e).multiplyScalar(0.5), dist = o.distanceTo(e);
        mid.normalize().multiplyScalar(R + 0.25 + dist * 0.28);
        var curve = new THREE.QuadraticBezierCurve3(o, mid, e);
        var g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(90));
        var line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#e7b25a', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
        g.setDrawRange(0, 0); globe.add(line);
        var pulse = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: '#ffd28a', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
        pulse.scale.setScalar(0.18); globe.add(pulse);
        var pin = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: '#f3efe4', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
        pin.position.copy(e); pin.scale.setScalar(0.14); globe.add(pin);
        return { curve: curve, geo: g, pulse: pulse, pin: pin };
      });
      var home = S.home = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: '#ffb347', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      home.position.copy(o); home.scale.setScalar(0.4); globe.add(home);
      S.base = -Math.atan2(o.x, o.z);
    },
    update: function (part, p, t) {
      var S = this, mo = AM.MOTION;
      S.dotU.uTime.value = t;
      S.globe.rotation.set(0.42 - p * 0.18, S.base + sm(rg(p, 0.1, 0.9)) * 1.35 + t * 0.01 * mo, 0);
      S.home.scale.setScalar(0.34 + Math.sin(t * 2.2) * 0.06 * mo);
      for (var i = 0; i < S.arcs.length; i++) {
        var a = S.arcs[i], k = sm(rg(p, 0.14 + i * 0.055, 0.28 + i * 0.055));
        a.geo.setDrawRange(0, Math.floor(k * 91));
        a.pin.material.opacity = k >= 1 ? 0.9 : 0;
        if (k >= 1) { a.pulse.position.copy(a.curve.getPoint((t * 0.25 * mo + i * 0.137 + p * 2) % 1)); a.pulse.material.opacity = 0.9; }
        else { a.pulse.position.copy(a.curve.getPoint(Math.max(0.001, k))); a.pulse.material.opacity = k > 0 ? 1 : 0; }
      }
      var z = AM.lerp(11, 9, sm(rg(p, 0, 0.5)));
      S.camera.position.set(AM.mouse.x * 0.3, -AM.mouse.y * 0.2 + 0.2, z); S.camera.lookAt(0, 0, 0);
      shift(S.camera, AM.lerp(0.15, -0.16, sm(rg(p, 0.42, 0.52)))); S.camera.updateProjectionMatrix();
    }
  });

  /* ─────────────────────────── PLATE ─────────────────────────── */
  var NOISE = [
    'float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
    'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + 1.), f.x), f.y); }',
    'float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * n(p); p *= 2.03; a *= .5; } return s; }'].join('\n');

  AM.register('plate', {
    build: function (renderer, env) {
      var S = this, r = AM.seeded(88);
      var scene = S.scene = new THREE.Scene(); scene.environment = env;
      scene.background = C('#0c0907'); scene.fog = new THREE.Fog('#0c0907', 7, 15);
      S.camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.02, 60);
      S.camera.userData.shiftX = 0.15;
      scene.add(new THREE.HemisphereLight('#f2e6d6', '#120c08', 0.35));
      var key = new THREE.DirectionalLight('#ffd9a8', 2.6); key.position.set(-3, 6, 3); scene.add(key);
      var rim = new THREE.DirectionalLight('#a9cbbb', 1.4); rim.position.set(4, 2, -4); scene.add(rim);

      var table = new THREE.Mesh(new THREE.CircleGeometry(20, 64), new THREE.MeshStandardMaterial({ color: '#1c130d', roughness: 0.82, metalness: 0 }));
      table.rotation.x = -Math.PI / 2; scene.add(table);
      var prof = [[0, 0], [0.85, 0], [1.3, 0.22], [1.58, 0.62], [1.68, 0.9], [1.62, 0.94], [1.52, 0.74], [1.26, 0.38], [0.8, 0.2], [0, 0.18]]
        .map(function (q) { return new THREE.Vector2(q[0], q[1]); });
      scene.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 96), new THREE.MeshPhysicalMaterial({ color: '#3b574c', roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.15, side: THREE.DoubleSide, envMapIntensity: 1.2 })));

      var N = S.N = Math.round(1700 * AM.TIER) + 300;
      S.rice = new THREE.InstancedMesh(AM.grainGeo('lo'), AM.grainMat({ roughness: 0.5, clearcoat: 0.2, env: 0.9 }), N);
      S.rd = [];
      for (var i = 0; i < N; i++) {
        var rad = 1.45 * Math.sqrt(r()), a = r() * Math.PI * 2, q = rad / 1.46;
        var ty = 0.78 + 0.46 * Math.pow(Math.max(0, 1 - q * q), 0.85) - r() * 0.07;
        S.rd.push({ tx: Math.cos(a) * rad, tz: Math.sin(a) * rad, ty: ty, s: r(), e: new THREE.Euler((r() - 0.5) * 0.7, r() * 6.28, (r() - 0.5) * 0.5) });
      }
      S.rice.frustumCulled = false; scene.add(S.rice);
      S.top = new THREE.Mesh(AM.grainGeo('hi'), AM.grainMat({ env: 1.4 })); S.top.scale.set(0.14, 0.12, 0.12); scene.add(S.top);

      S.steamU = []; S.steam = [];
      for (i = 0; i < 6; i++) {
        var u = { uTime: { value: 0 }, uO: { value: 0 }, uSeed: { value: i * 3.7 } }; S.steamU.push(u);
        var m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.8), new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, uniforms: u,
          vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
          fragmentShader: 'uniform float uTime, uO, uSeed; varying vec2 vUv;\n' + NOISE + '\nvoid main(){ vec2 uv = vUv; float t = uTime * .22; vec2 q = vec2(uv.x * 1.6 + uSeed, uv.y * 1.3 - t); float w = fbm(q + fbm(q * 1.4 + t) * .9); float sway = sin(t * 2. + uSeed + uv.y * 3.) * .12 * uv.y; float shape = smoothstep(0., .22, uv.y) * smoothstep(1., .4, uv.y) * smoothstep(.5, .1, abs(uv.x - .5 + sway)); float a = smoothstep(.42, .85, w) * shape * uO * .42; gl_FragColor = vec4(vec3(.96, .94, .9), a); }'
        }));
        m.position.set((i % 3 - 1) * 0.35, 2.2, (i < 3 ? 0.15 : -0.2)); S.steam.push(m); scene.add(m);
      }

      S.rig = AM.rig({
        above: { pos: [0, 4.8, 4.9], tgt: [0, 0.6, 0] },
        low:   { pos: [3.3, 2.0, 3.6], tgt: [0, 0.9, 0] },
        grain: { pos: [0.3, 1.6, 0.62], tgt: [0, 1.24, 0], roll: 0.05 }
      }, [
        { p0: 0.04, p1: 0.48, keys: ['above', 'low'] },
        { p0: 0.52, p1: 0.78, keys: ['low', 'grain'] }
      ]);
      S.cam = AM.camState();
      S.M = new THREE.Matrix4(); S.Q = new THREE.Quaternion(); S.P = new THREE.Vector3(); S.SC = new THREE.Vector3(); S.E = new THREE.Euler();
    },
    update: function (part, p, t) {
      var S = this, mo = AM.MOTION, M = S.M, Q = S.Q, P = S.P, SC = S.SC, E = S.E;
      for (var i = 0; i < S.N; i++) {
        var d = S.rd[i], e = AM.ease(rg(p, 0.02 + d.s * 0.36, 0.13 + d.s * 0.36));
        P.set(d.tx * (1 + (1 - e) * 0.3), d.ty + (1 - e) * (2.8 + d.s * 3), d.tz * (1 + (1 - e) * 0.3));
        E.set(d.e.x + (1 - e) * (t * 2 * mo + d.s * 9), d.e.y, d.e.z); Q.setFromEuler(E);
        SC.set(e > 0 ? 0.12 : 0.0001, 0.105, 0.105); M.compose(P, Q, SC); S.rice.setMatrixAt(i, M);
      }
      S.rice.instanceMatrix.needsUpdate = true;
      var te = AM.ease(rg(p, 0.46, 0.58));
      S.top.position.set(0, 1.265 + (1 - te) * 3, 0); S.top.rotation.set(0, 0.6 + (1 - te) * t * mo, 0.05);
      S.top.visible = te > 0;
      var so = sm(rg(p, 0.3, 0.5)) * (1 - sm(rg(p, 0.7, 0.82)) * 0.6);
      for (i = 0; i < S.steam.length; i++) { S.steamU[i].uTime.value = t * mo + i; S.steamU[i].uO.value = so; S.steam[i].quaternion.copy(S.camera.quaternion); }
      S.rig(p, S.cam);
      AM.applyCam(S.camera, S.cam, p > 0.7 ? 0.15 : 1);
    }
  });

  AM.shift = shift;
})();
