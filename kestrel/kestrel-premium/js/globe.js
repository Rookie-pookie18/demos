/* ══════════════════════════════════════════════════════════════════
   GLOBE — chapter 3 · Study (part a) and chapter 4 · Work & visit (b)
   A dot-matrix Earth sampled from real land outlines. Part a: from one
   home city, gold arcs reach the five study destinations while the
   globe turns to follow; then the plane rides the arc to Toronto.
   Part b: routes from around the world converge on Canadian cities —
   gold for work, aurora-green for visits — and Canada itself lights up.
   Routes are illustrative, not client statistics.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var AM = window.AM;
  if (!window.THREE) return;
  var C = function (h) { return new THREE.Color(h); };
  var R = 2;

  var HOME = [28.61, 77.21];   // New Delhi (Kestrel has an affiliate office in India)
  var STUDY = [ // name, lat, lon, arc window
    ['Australia', -33.87, 151.21, 0.1, 0.2],
    ['Germany', 52.52, 13.4, 0.2, 0.3],
    ['United Kingdom', 51.51, -0.13, 0.26, 0.36],
    ['USA', 42.36, -71.06, 0.37, 0.49],
    ['Canada', 43.65, -79.38, 0.45, 0.57]
  ];
  var CITIES = { Toronto: [43.65, -79.38], Vancouver: [49.28, -123.12], Montreal: [45.5, -73.57], Calgary: [51.05, -114.07], Halifax: [44.65, -63.57], Winnipeg: [49.9, -97.14] };
  var ROUTES = [ // from lat, lon → city, kind (w = work, v = visit), start
    [28.61, 77.21, 'Toronto', 'w', 0.04], [25.2, 55.27, 'Calgary', 'w', 0.08], [11.55, 104.92, 'Vancouver', 'w', 0.12],
    [14.6, 120.98, 'Winnipeg', 'w', 0.16], [6.52, 3.38, 'Montreal', 'w', 0.2], [-23.55, -46.63, 'Toronto', 'w', 0.24],
    [19.43, -99.13, 'Vancouver', 'v', 0.4], [51.51, -0.13, 'Halifax', 'v', 0.43], [37.57, 126.98, 'Vancouver', 'v', 0.46],
    [-1.29, 36.82, 'Toronto', 'v', 0.49], [48.86, 2.35, 'Montreal', 'v', 0.52], [-33.87, 151.21, 'Calgary', 'v', 0.55]
  ];
  var FOCUS = {  // p, lon, lat, camera distance
    a: [[0, 78, 18, 7.4], [0.1, 78, 18, 7.4], [0.2, 118, -4, 7.6], [0.27, 42, 28, 7.8], [0.38, -8, 36, 8], [0.5, -52, 40, 7.8], [0.62, -58, 42, 7.4], [0.95, -79, 45, 5.1], [1, -79, 45, 5.1]],
    b: [[0, 30, 25, 8.6], [0.3, -25, 42, 8.8], [0.58, -85, 52, 7.6], [0.82, -96, 54, 5.2], [1, -96, 54, 4.9]]
  };
  function canada(lat, lon) {
    if (lon < -141 || lon > -52 || lat > 84) return false;
    if (lat > 49) return true;
    if (lon > -95 && lat > 45.3 && lon < -74.5) return true;
    if (lon > -83.5 && lon < -79 && lat > 42) return true;
    if (lon >= -79 && lon < -74.5 && lat > 43.6) return true;
    if (lon >= -74.5 && lon < -71 && lat > 45) return true;
    if (lon >= -71 && lon < -67.8 && lat > 47.3) return true;
    if (lon >= -67.8 && lat > 44.5) return true;
    return false;
  }
  function focusAt(list, p, out) {
    for (var i = 1; i < list.length; i++) {
      if (p <= list[i][0]) {
        var a = list[i - 1], b = list[i], k = AM.smooth((p - a[0]) / Math.max(1e-5, b[0] - a[0]));
        out[0] = AM.lerp(a[1], b[1], k); out[1] = AM.lerp(a[2], b[2], k); out[2] = AM.lerp(a[3], b[3], k); return out;
      }
    }
    var l = list[list.length - 1]; out[0] = l[1]; out[1] = l[2]; out[2] = l[3]; return out;
  }
  var _cv = null;
  function facing(w, cam) {   // 1 on the near side of the globe, 0 behind it
    _cv = _cv || new THREE.Vector3();
    _cv.subVectors(cam.position, w).normalize();
    return AM.smooth(AM.range(_cv.dot(w) / w.length(), 0.05, 0.3));
  }
  function arcCurve(la1, lo1, la2, lo2) {
    var a = AM.ll2v(la1, lo1, 1), b = AM.ll2v(la2, lo2, 1), ang = a.angleTo(b), pts = [];
    for (var i = 0; i <= 48; i++) {
      var t = i / 48, s = Math.sin(ang);
      var v = a.clone().multiplyScalar(Math.sin((1 - t) * ang) / s).add(b.clone().multiplyScalar(Math.sin(t * ang) / s));
      pts.push(v.normalize().multiplyScalar(R * (1.004 + (0.08 + 0.3 * ang / Math.PI) * Math.sin(Math.PI * t))));
    }
    return new THREE.CatmullRomCurve3(pts);
  }

  AM.register('globe', {
    build: function (renderer, env) {
      var S = this;
      var scene = S.scene = new THREE.Scene();
      scene.background = C('#040814');
      var camera = S.camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.05, 300);
      camera.userData.shiftX = 0.16;

      var tilt = S.tilt = new THREE.Group(), spin = S.spin = new THREE.Group();
      tilt.add(spin); scene.add(tilt);

      /* core + atmosphere */
      spin.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.992, 64, 48), new THREE.MeshBasicMaterial({ color: '#081030' })));
      var atm = new THREE.Mesh(new THREE.SphereGeometry(R * 1.16, 64, 48), new THREE.ShaderMaterial({
        side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uCol: { value: C('#3f6dff') }, uCol2: { value: C('#6fd2b4') } },
        vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: 'uniform vec3 uCol, uCol2; varying vec3 vN; void main(){ float i = pow(max(0., .72 - dot(vN, vec3(0., 0., 1.))), 3.2); gl_FragColor = vec4(mix(uCol, uCol2, .25) * i * 1.1, i * .6); }'
      }));
      scene.add(atm);
      var rim = new THREE.Mesh(new THREE.SphereGeometry(R * 1.003, 64, 48), new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: 'varying vec3 vN; void main(){ float f = pow(1. - max(0., dot(vN, vec3(0., 0., 1.))), 4.); gl_FragColor = vec4(vec3(.35, .55, 1.) * f * .6, f * .5); }'
      }));
      scene.add(rim);

      /* land dots */
      var land = AM.landData, NC = Math.round(64000 * (AM.TIER < 1 ? 0.55 : 1));
      var pos = [], can = [], seed = [], r = AM.seeded(31), golden = Math.PI * (3 - Math.sqrt(5));
      for (var i = 0; i < NC; i++) {
        var y = 1 - (i / (NC - 1)) * 2, rad = Math.sqrt(1 - y * y), th = golden * i;
        var x = Math.cos(th) * rad, z = Math.sin(th) * rad;
        var lat = Math.asin(y) * 180 / Math.PI;
        /* invert ll2v: x = -sinφ cosθ, z = sinφ sinθ, θ = lon + 180 */
        var lon = Math.atan2(z, -x) * 180 / Math.PI - 180; if (lon < -180) lon += 360;
        var isLand = land ? land.at(lat, lon) : (Math.sin(lat * 0.09) * Math.cos(lon * 0.05) + Math.sin(lon * 0.13 + lat * 0.04) * 0.6 > 0.35);
        if (!isLand) continue;
        pos.push(x * R, y * R, z * R); can.push(canada(lat, lon) ? 1 : 0); seed.push(r());
      }
      var dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      dg.setAttribute('aCan', new THREE.Float32BufferAttribute(can, 1));
      dg.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
      var DU = S.DU = { uCan: { value: 0 }, uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uBase: { value: C('#8aa2e0') }, uGold: { value: C('#e8874a') } };
      var dots = new THREE.Points(dg, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, uniforms: DU,
        vertexShader: [
          'attribute float aCan, aSeed; uniform float uCan, uTime, uPR; varying float vA, vG;',
          'void main(){',
          '  vec4 w = modelMatrix * vec4(position, 1.);',
          '  float facing = dot(normalize(w.xyz), normalize(cameraPosition - w.xyz));',
          '  vec4 mv = viewMatrix * w; gl_Position = projectionMatrix * mv;',
          '  vG = aCan * uCan;',
          '  gl_PointSize = uPR * (2.6 + vG * 1.2 + aSeed * .8) * (7.5 / -mv.z);',
          '  vA = smoothstep(-.05, .4, facing) * (.7 + .3 * aSeed) * (1. + vG * (.4 + .3 * sin(uTime * 2. + aSeed * 20.)));',
          '}'].join('\n'),
        fragmentShader: 'uniform vec3 uBase, uGold; varying float vA, vG; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; vec3 c = mix(uBase, uGold, vG); gl_FragColor = vec4(c, vA * smoothstep(.5, .3, d)); }'
      }));
      dots.frustumCulled = false; spin.add(dots);

      /* star field */
      var SN = 1400, sp = new Float32Array(SN * 3);
      for (i = 0; i < SN; i++) { var v = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(80 + r() * 40); sp.set([v.x, v.y, v.z], i * 3); }
      var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
      scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#b9c8ff', size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.55 })));

      /* labels live in each chapter's pin */
      var pins = {
        a: document.querySelector('.ch[data-scene="globe"][data-part="a"] .pin'),
        b: document.querySelector('.ch[data-scene="globe"][data-part="b"] .pin')
      };
      function label(part, text, lat, lon) {
        var el = document.createElement('div'); el.className = 'glabel'; el.setAttribute('aria-hidden', 'true');
        el.innerHTML = '<span>' + text + '</span>';
        if (pins[part]) pins[part].appendChild(el);
        var o = new THREE.Object3D(); AM.ll2v(lat, lon, R * 1.01, o.position); spin.add(o);
        return { el: el, o: o, w: new THREE.Vector3() };
      }

      /* part a: study arcs from home */
      S.study = STUDY.map(function (d) {
        var cv = arcCurve(HOME[0], HOME[1], d[1], d[2]);
        var tr = AM.trail(cv, '#e8874a', 0.0075, 96, 1.2); spin.add(tr);
        var g = AM.glow('#e8874a', 0.32, 0); AM.ll2v(d[1], d[2], R * 1.01, g.position); spin.add(g);
        return { tr: tr, g: g, a: d[3], b: d[4], lab: label('a', d[0], d[1], d[2]), curve: cv };
      });
      var hg = S.homeGlow = AM.glow('#ffffff', 0.4, 0.9); AM.ll2v(HOME[0], HOME[1], R * 1.01, hg.position); spin.add(hg);
      S.homeLab = label('a', 'Home', HOME[0], HOME[1]);

      /* part b: converging routes + pulses on Canadian cities */
      S.routes = ROUTES.map(function (d) {
        var c = CITIES[d[2]], cv = arcCurve(d[0], d[1], c[0], c[1]);
        var tr = AM.trail(cv, d[3] === 'w' ? '#e8874a' : '#6fd2b4', 0.0065, 96, 1.2); spin.add(tr);
        var og = AM.glow(d[3] === 'w' ? '#e8874a' : '#6fd2b4', 0.22, 0); AM.ll2v(d[0], d[1], R * 1.01, og.position); spin.add(og);
        return { tr: tr, og: og, s: d[4] };
      });
      S.cities = Object.keys(CITIES).map(function (n) {
        var c = CITIES[n], ring = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.038, 48), new THREE.MeshBasicMaterial({ color: '#e8874a', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
        AM.ll2v(c[0], c[1], R * 1.012, ring.position); ring.lookAt(ring.position.clone().multiplyScalar(2)); spin.add(ring);
        return { ring: ring, lab: label('b', n, c[0], c[1]), seed: Math.random() };
      });

      /* the plane rides the Toronto arc */
      var plane = S.plane = AM.makePaper({ ticks: 4, stamps: 2, fold: 1, nx: 10, ny: 14, glow: 0.5 });
      plane.scale.setScalar(0.17); spin.add(plane);
      S.planeCurve = S.study[4].curve;
      var pgl = S.pglow = AM.glow('#e8874a', 0.35, 0.5); spin.add(pgl);

      scene.add(new THREE.HemisphereLight('#c8d6ff', '#0a1128', 1.2));
      var key = new THREE.DirectionalLight('#ffffff', 1.4); key.position.set(2, 3, 5); scene.add(key);

      S.f = [0, 0, 0]; S.cam = AM.camState(); S.dir = new THREE.Vector3(); S.up = new THREE.Vector3(); S.tv = new THREE.Vector3();
    },

    update: function (part, p, t) {
      var S = this, sm = AM.smooth, rg = AM.range, mo = AM.MOTION, i;
      var T = t * mo;
      S.DU.uTime.value = T;
      var isA = part !== 'b';

      /* turn the globe to face the current region */
      var f = focusAt(isA ? FOCUS.a : FOCUS.b, p, S.f);
      var base = AM.ll2v(0, f[0], 1, S.tv), psi = Math.atan2(base.x, base.z);
      S.spin.rotation.y = -psi + Math.sin(T * 0.1) * 0.01;
      S.tilt.rotation.x = f[1] * Math.PI / 180 * 0.9;
      S.cam.pos.set(0, 0.15, f[2]); S.cam.tgt.set(0, 0, 0); S.cam.roll = 0;
      AM.applyCam(S.camera, S.cam, 0.5);
      S.scene.updateMatrixWorld();

      /* part a */
      for (i = 0; i < S.study.length; i++) {
        var d = S.study[i], k = isA ? sm(rg(p, d.a, d.b)) : 0;
        d.tr.visible = k > 0.001; d.tr.material.uniforms.uHead.value = k;
        d.tr.material.uniforms.uOpacity.value = isA ? 1 - 0.5 * sm(rg(p, 0.62, 0.8)) * (i === 4 ? 0 : 1) : 0;
        d.g.material.opacity = sm(rg(k, 0.9, 1)) * 0.9;
        d.g.scale.setScalar(0.32 + Math.sin(T * 3 + i) * 0.04);
        d.lab.o.getWorldPosition(d.lab.w);
        AM.label(d.lab.el, d.lab.w, S.camera, facing(d.lab.w, S.camera) * (isA ? sm(rg(k, 0.85, 1)) * (1 - sm(rg(p, 0.9, 0.98))) : 0));
      }
      S.homeGlow.visible = isA;
      S.homeLab.o.getWorldPosition(S.homeLab.w);
      AM.label(S.homeLab.el, S.homeLab.w, S.camera, facing(S.homeLab.w, S.camera) * (isA ? sm(rg(p, 0.02, 0.08)) * (1 - sm(rg(p, 0.28, 0.34))) : 0));

      /* plane on the Toronto arc */
      var fl = isA ? rg(p, 0.6, 0.93) : 0;
      S.plane.visible = S.pglow.visible = isA && fl > 0 && fl < 1;
      if (S.plane.visible) {
        var u = sm(fl) * 0.995;
        S.planeCurve.getPointAt(u, S.plane.position);
        S.planeCurve.getTangentAt(u, S.dir);
        S.up.copy(S.plane.position).normalize();
        AM.orient(S.plane, S.dir, S.up);
        S.pglow.position.copy(S.plane.position);
      }

      /* part b */
      for (i = 0; i < S.routes.length; i++) {
        var rt = S.routes[i], kb = !isA ? sm(rg(p, rt.s, rt.s + 0.16)) : 0;
        rt.tr.visible = kb > 0.001; rt.tr.material.uniforms.uHead.value = kb;
        rt.tr.material.uniforms.uOpacity.value = 1 - 0.45 * sm(rg(p, 0.75, 0.9));
        rt.og.material.opacity = !isA ? sm(rg(p, rt.s - 0.02, rt.s + 0.02)) * 0.8 : 0;
      }
      S.DU.uCan.value = !isA ? sm(rg(p, 0.5, 0.72)) : sm(rg(p, 0.75, 0.95)) * 0.6;
      for (i = 0; i < S.cities.length; i++) {
        var cc = S.cities[i], on = !isA ? sm(rg(p, 0.3, 0.55)) : 0, ph = (T * 0.6 + cc.seed) % 1;
        cc.ring.scale.setScalar(1 + ph * 3.5); cc.ring.material.opacity = on * (1 - ph) * 0.9;
        cc.lab.o.getWorldPosition(cc.lab.w);
        AM.label(cc.lab.el, cc.lab.w, S.camera, facing(cc.lab.w, S.camera) * (!isA ? sm(rg(p, 0.74, 0.84)) : 0));
      }
    }
  });
})();
