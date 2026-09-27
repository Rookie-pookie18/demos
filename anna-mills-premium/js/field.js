/* ══════════════════════════════════════════════════════════════════
   FIELD — hero grain → paddy → monsoon (part a) → harvest (part b)
   One world. A pearl grain on a panicle; ~36k instanced stalks bent by
   a wind shader; flooded rows whose water reflects an analytic sky;
   rain + ripples; a gold "cut front" sweeping the field; and a spiral
   stream of grains that lifts off and carries the camera to the mill.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var AM = window.AM;
  if (!window.THREE) return;
  var C = function (h) { return new THREE.Color(h); };

  var PAL = {
    dawn:  { top: C('#0c171c'), hor: C('#d88a4e'), sun: C('#ffb070'), tip: C('#ffb070'), el: 0.07, dim: 0.34 },
    day:   { top: C('#172a33'), hor: C('#62766d'), sun: C('#ffe0b0'), tip: C('#e9dcb8'), el: 0.16, dim: 0.55 },
    rain:  { top: C('#1f2a2f'), hor: C('#6f7c79'), sun: C('#000000'), tip: C('#7f8c86'), el: 0.32, dim: 0.6 },
    clear: { top: C('#1b2b37'), hor: C('#b98a62'), sun: C('#ffc58a'), tip: C('#ffc58a'), el: 0.1, dim: 0.58 },
    gold:  { top: C('#120f18'), hor: C('#8c4a1c'), sun: C('#ff9a30'), tip: C('#ffae45'), el: 0.05, dim: 0.5 }
  };

  var SKYFN = [
    'uniform vec3 uTop, uHor, uSun, uSunCol, uFogCol; uniform float uTime, uRain, uFogDen;',
    'vec3 sky(vec3 d){',
    '  float h = d.y;',
    '  vec3 c = mix(uHor, uTop, smoothstep(-0.02, 0.5, h));',
    '  c = mix(c, uHor * 0.55, smoothstep(0.0, -0.25, h));',
    '  float s = max(dot(d, uSun), 0.);',
    '  c += uSunCol * (pow(s, 380.) * 2.6 + pow(s, 16.) * 0.2 + pow(s, 4.) * 0.035);',
    '  return c;',
    '}'].join('\n');
  var TAIL = '\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n';

  function mergePositions(geos) {
    var total = 0, arrs = geos.map(function (g) { g = g.index ? g.toNonIndexed() : g; var a = g.attributes.position.array; total += a.length; return a; });
    var out = new Float32Array(total), o = 0;
    arrs.forEach(function (a) { out.set(a, o); o += a.length; });
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(out, 3)); return g;
  }

  AM.register('field', {
    build: function (renderer, env) {
      var S = this;
      var scene = S.scene = new THREE.Scene();
      scene.environment = env;
      var camera = S.camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.01, 160);
      camera.userData.shiftX = 0.15;

      /* shared sky uniforms (sky dome + water) */
      var U = S.U = {
        uTop: { value: PAL.dawn.top.clone() }, uHor: { value: PAL.dawn.hor.clone() },
        uSun: { value: new THREE.Vector3(0.3, 0.07, -1).normalize() }, uSunCol: { value: PAL.dawn.sun.clone() },
        uFogCol: { value: PAL.dawn.hor.clone() }, uFogDen: { value: 0.045 }, uTime: { value: 0 }, uRain: { value: 0 }
      };

      /* sky dome */
      var sky = S.sky = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, uniforms: U,
        vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: SKYFN + '\nvarying vec3 vD; void main(){ gl_FragColor = vec4(sky(normalize(vD)), 1.);' + TAIL + '}'
      }));
      sky.renderOrder = -1; scene.add(sky);

      /* water: analytic sky reflection + wind chop + rain ripples */
      var water = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.ShaderMaterial({
        uniforms: U,
        vertexShader: 'varying vec3 vW; varying float vDepth; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }',
        fragmentShader: SKYFN + [
          'varying vec3 vW; varying float vDepth;',
          'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
          'vec2 ripples(vec2 p){ vec2 g = vec2(0.);',
          '  for (int k = 0; k < 2; k++) { vec2 q = p * (1.0 + float(k) * .63) + float(k) * 3.1; vec2 id = floor(q); vec2 f = fract(q) - .5;',
          '    float h = hash(id + float(k) * 7.); vec2 o = vec2(hash(id + 1.3), hash(id + 2.7)) - .5; vec2 d = f - o * .6;',
          '    float t = fract(uTime * .8 + h); float r = length(d);',
          '    float w = sin((r - t * .55) * 46.) * exp(-r * 5.) * (1. - t) * smoothstep(0., .06, t);',
          '    g += normalize(d + 1e-4) * w; }',
          '  return g; }',
          'void main(){',
          '  vec3 V = normalize(vW - cameraPosition);',
          '  vec2 n2 = vec2(sin(vW.x * 3. + uTime * .6) * .01 + sin(vW.z * 5.3 + uTime * .9) * .008, cos(vW.z * 2.7 + uTime * .7) * .01);',
          '  n2 += ripples(vW.xz * 2.2) * .09 * uRain;',
          '  vec3 N = normalize(vec3(n2.x, 1., n2.y));',
          '  vec3 R = reflect(V, N); R.y = abs(R.y);',
          '  float fres = .03 + .97 * pow(1. - max(dot(-V, N), 0.), 5.);',
          '  vec3 c = mix(vec3(.012, .022, .02), sky(normalize(R)), .28 + fres * .72);',
          '  float fog = 1. - exp(-uFogDen * uFogDen * vDepth * vDepth);',
          '  gl_FragColor = vec4(mix(c, uFogCol, fog), 1.);' + TAIL + '}'].join('\n')
      }));
      water.rotation.x = -Math.PI / 2; water.position.y = 0.035; scene.add(water);

      /* stalks: crossed tapered blades + a drooping head, one geometry */
      var blade = function (ry) {
        var g = new THREE.PlaneGeometry(0.042, 1, 1, 6); g.translate(0, 0.5, 0);
        var p = g.attributes.position;
        for (var i = 0; i < p.count; i++) p.setX(i, p.getX(i) * (1 - 0.82 * p.getY(i)));
        g.rotateY(ry); return g;
      };
      var head = new THREE.SphereGeometry(1, 6, 5); head.scale(0.022, 0.13, 0.022); head.rotateZ(-0.55); head.translate(0.05, 1.03, 0);
      var stalkGeo = mergePositions([blade(0), blade(Math.PI / 2), head]);

      var SU = S.SU = {
        uTime: U.uTime, uFogCol: U.uFogCol, uFogDen: U.uFogDen,
        uWind: { value: 1 }, uGold: { value: 0 }, uDim: { value: 0.35 }, uSweep: { value: 40 }, uLean: { value: 0 },
        uLight: { value: PAL.dawn.tip.clone() },
        uG1: { value: C('#0c2414') }, uG2: { value: C('#6a9442') }, uY1: { value: C('#5a3d12') }, uY2: { value: C('#c9953f') }
      };
      var stalkMat = new THREE.ShaderMaterial({
        side: THREE.DoubleSide, uniforms: SU,
        vertexShader: [
          'attribute float aRand; uniform float uTime, uWind, uSweep, uLean, uFogDen; varying float vH, vFog, vRand;',
          'void main(){',
          '  vec3 pos = position; float h = clamp(pos.y, 0., 1.2);',
          '  vec4 base = modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.);',
          '  float n = sin(base.x * .45 + uTime * 1.6 + aRand * 2.) * .6 + sin(base.z * .33 + uTime * 1.1) * .4 + sin((base.x + base.z) * 1.9 + uTime * 3.) * .15;',
          '  float lay = smoothstep(uSweep - 1.5, uSweep + 1.5, base.x) * uLean;',
          '  float bend = h * h * (uWind * (.1 + .09 * n) + lay * (0.8 + aRand * .4));',
          '  vec4 w = modelMatrix * instanceMatrix * vec4(pos, 1.);',
          '  w.x += bend; w.y -= bend * bend * .45; w.z += h * h * uWind * .05 * n;',
          '  vec4 mv = viewMatrix * w; gl_Position = projectionMatrix * mv;',
          '  vH = h; vRand = aRand; vFog = 1. - exp(-uFogDen * uFogDen * mv.z * mv.z);',
          '}'].join('\n'),
        fragmentShader: [
          'uniform vec3 uG1, uG2, uY1, uY2, uLight, uFogCol; uniform float uGold, uDim; varying float vH, vFog, vRand;',
          'void main(){',
          '  vec3 g = mix(uG1, uG2, smoothstep(0., 1., vH)) * (.7 + vRand * .55);',
          '  vec3 y = mix(uY1, uY2, smoothstep(0., 1., vH)) * (.75 + vRand * .45);',
          '  vec3 c = mix(g, y, uGold) * uDim + uLight * pow(clamp(vH, 0., 1.1), 4.) * .15;',
          '  gl_FragColor = vec4(mix(c, uFogCol, vFog), 1.);' + TAIL + '}'].join('\n')
      });

      var r = AM.seeded(2024), mats = [];
      var M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), SC = new THREE.Vector3(), E = new THREE.Euler();
      var rowGap = AM.TIER < 1 ? 0.5 : 0.36, clumpGap = AM.TIER < 1 ? 0.42 : 0.3;
      for (var x = -15; x <= 15; x += rowGap) {
        if (x > -3.15 && x < -1.85) continue;                      // irrigation channel for the low rain shot
        for (var z = -42; z <= 7; z += clumpGap) {
          for (var k = 0; k < 3; k++) {
            var px = x + (r() - 0.5) * 0.16, pz = z + (r() - 0.5) * 0.16;
            if (Math.abs(px - 0.1) < 1.1 && pz > -0.7 && pz < 3.2) continue; // keep the hero stalk clear
            E.set((r() - 0.5) * 0.12, r() * Math.PI * 2, (r() - 0.5) * 0.12); Q.setFromEuler(E);
            var hgt = 0.78 + r() * 0.38;
            P.set(px, 0, pz); SC.set(0.8 + r() * 0.5, hgt, 1);
            M.compose(P, Q, SC); mats.push(M.clone());
          }
        }
      }
      var stalks = new THREE.InstancedMesh(stalkGeo, stalkMat, mats.length);
      var rnd = new Float32Array(mats.length);
      mats.forEach(function (m, i) { stalks.setMatrixAt(i, m); rnd[i] = r(); });
      stalkGeo.setAttribute('aRand', new THREE.InstancedBufferAttribute(rnd, 1));
      stalks.frustumCulled = false; scene.add(stalks);

      /* hero stalk + panicle (real grain meshes) */
      var hero = S.hero = new THREE.Group(); scene.add(hero);
      var curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.01, 0.55, 0), new THREE.Vector3(0.03, 1.02, 0),
        new THREE.Vector3(0.08, 1.19, 0.01), new THREE.Vector3(0.17, 1.2, 0.02), new THREE.Vector3(0.25, 1.11, 0.03)
      ]);
      var stemMat = new THREE.MeshStandardMaterial({ color: '#46652e', roughness: 0.6 });
      hero.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.0055, 8, false), stemMat));
      var huskMat = S.huskMat = AM.grainMat({ color: C('#a9ac5c'), roughness: 0.62, clearcoat: 0.1, emissive: '#0c0d04', env: 0.7 });
      var HERO_U = 0.78, gi = 0;
      for (var u = 0.56; u < 0.99; u += 0.026, gi++) {
        if (Math.abs(u - HERO_U) < 0.013) continue;
        var pt = curve.getPoint(u), tg = curve.getTangent(u);
        var gm = new THREE.Mesh(AM.grainGeo('mid'), huskMat);
        gm.position.copy(pt).add(new THREE.Vector3(0, (gi % 2 ? 1 : -1) * 0.012, (gi % 2 ? 0.01 : -0.012)));
        gm.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tg);
        gm.rotateZ((gi % 2 ? 1 : -1) * 0.45); gm.rotateX(gi * 1.3);
        gm.scale.setScalar(0.021); hero.add(gm);
      }
      var G = S.G = curve.getPoint(HERO_U).add(new THREE.Vector3(0, -0.004, 0.012));
      var grain = S.grain = new THREE.Mesh(AM.grainGeo('hi'), AM.grainMat({ env: 1.3 }));
      grain.position.copy(G); grain.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), curve.getTangent(HERO_U));
      grain.rotateZ(-0.35); grain.scale.setScalar(0.027); hero.add(grain);
      var glow = S.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: AM.glowTex(), color: '#ffcf8a', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.position.copy(G).add(new THREE.Vector3(0, 0, -0.05)); glow.scale.setScalar(0.2); hero.add(glow);

      /* lights */
      scene.add(new THREE.HemisphereLight('#cfe0d6', '#1a2416', 0.7));
      var sun = S.sunLight = new THREE.DirectionalLight('#ffc28a', 2.4); sun.position.set(3, 1.2, -8); scene.add(sun);
      var fill = S.fill = new THREE.DirectionalLight('#ffe9cf', 1.6); fill.position.set(-1, 1.5, 6); scene.add(fill);

      /* motes: pollen around the grain, dust over the field */
      var m1 = S.motesNear = AM.motes(Math.round(240 * AM.TIER) + 60, [0.7, 0.4, 0.7], '#ffe2b0', 0.005);
      m1.position.copy(G); scene.add(m1);
      var m2 = S.motesFar = AM.motes(Math.round(900 * AM.TIER), [30, 4, 40], '#ffe8c8', 0.05);
      m2.position.set(0, 2, -12); scene.add(m2);

      /* rain: streaks as line segments, animated in the shader */
      var RN = Math.round(1600 * AM.TIER), rp = new Float32Array(RN * 6), rs = new Float32Array(RN * 2), re = new Float32Array(RN * 2);
      for (var i = 0; i < RN; i++) {
        var X = -7 + r() * 10, Y = r() * 6, Z = -8 + r() * 12, s = r();
        rp.set([X, Y, Z, X, Y, Z], i * 6); rs[i * 2] = rs[i * 2 + 1] = s; re[i * 2] = 0; re[i * 2 + 1] = 1;
      }
      var rg = new THREE.BufferGeometry();
      rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
      rg.setAttribute('aSeed', new THREE.BufferAttribute(rs, 1));
      rg.setAttribute('aEnd', new THREE.BufferAttribute(re, 1));
      var rain = S.rain = new THREE.LineSegments(rg, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, uniforms: { uTime: U.uTime, uRain: U.uRain },
        vertexShader: 'attribute float aSeed, aEnd; uniform float uTime; varying float vA; void main(){ vec3 p = position; p.y = mod(p.y - uTime * (6.5 + aSeed * 3.), 6.); p.y += aEnd * .22; p.x += aEnd * .03; vA = aEnd; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }',
        fragmentShader: 'uniform float uRain; varying float vA; void main(){ gl_FragColor = vec4(vec3(.82, .88, .9), uRain * .32 * vA); }'
      }));
      rain.frustumCulled = false; rain.visible = false; scene.add(rain);

      /* harvest stream */
      var SN = S.SN = Math.round(1100 * AM.TIER) + 150;
      var goldHusk = new THREE.MeshStandardMaterial({ color: '#d9a94e', roughness: 0.5, metalness: 0.1, emissive: '#2a1805', envMapIntensity: 1.2 });
      var stream = S.stream = new THREE.InstancedMesh(AM.grainGeo('lo'), goldHusk, SN);
      stream.frustumCulled = false; stream.visible = false; scene.add(stream);
      S.sd = [];
      for (var j = 0; j < SN; j++) S.sd.push({ s: r(), s2: r(), x: (r() - 0.5) * 14, z: -1 - r() * 9, y: 0.9 + r() * 0.3 });

      /* camera rigs */
      var g = [G.x, G.y, G.z];
      S.rigA = AM.rig({
        hero:  { pos: [g[0] + 0.08, g[1] - 0.06, g[2] + 0.4], tgt: [g[0] - 0.01, g[1] + 0.025, g[2]] },
        back1: { pos: [0.4, 1.36, 0.95], tgt: [0.05, 1.05, -1] },
        wide:  { pos: [1.3, 2.15, 5.6], tgt: [-0.4, 0.75, -6] },
        low:   { pos: [-2.5, 0.42, 2.4], tgt: [-2.5, 0.55, -6], roll: -0.04 },
        rise:  { pos: [0.2, 3.3, 8.5], tgt: [0, 0.6, -10] }
      }, [
        { p0: 0.07, p1: 0.31, keys: ['hero', 'back1', 'wide'] },
        { p0: 0.47, p1: 0.58, keys: ['wide', 'low'] },
        { p0: 0.8, p1: 0.93, keys: ['low', 'rise'] }
      ]);
      S.rigB = AM.rig({
        start: { pos: [0.2, 3.3, 8.5], tgt: [0, 0.6, -10] },
        gold:  { pos: [6, 1.7, 3.2], tgt: [-1.5, 0.8, -4] },
        watch: { pos: [1.8, 1.9, 4.6], tgt: [0, 1.7, -2] },
        dive:  { pos: [0.1, 2.25, 1.4], tgt: [0, 2.35, -3], roll: 0.2 }
      }, [
        { p0: 0.02, p1: 0.32, keys: ['start', 'gold'] },
        { p0: 0.42, p1: 0.62, keys: ['gold', 'watch'] },
        { p0: 0.74, p1: 1.0, keys: ['watch', 'dive'] }
      ]);
      S.cam = AM.camState();
      S.tmpPal = { top: C('#000'), hor: C('#000'), sun: C('#000'), tip: C('#000'), el: 0 };
      S.M = M; S.Q = Q; S.P = P; S.SC = SC; S.E = E;
      S.A = new THREE.Vector3(0, 1.1, -7); S.B = new THREE.Vector3(0, 2.35, 3.2);
    },

    pal: function (a, b, t) {
      var o = this.tmpPal;
      o.top.lerpColors(a.top, b.top, t); o.hor.lerpColors(a.hor, b.hor, t); o.sun.lerpColors(a.sun, b.sun, t); o.tip.lerpColors(a.tip, b.tip, t);
      o.el = AM.lerp(a.el, b.el, t); o.dim = AM.lerp(a.dim, b.dim, t); return o;
    },

    update: function (part, p, t) {
      var S = this, U = S.U, SU = S.SU, sm = AM.smooth, rg = AM.range;
      U.uTime.value = t * AM.MOTION + 0.001;
      S.motesNear.material.uniforms.uTime.value = S.motesFar.material.uniforms.uTime.value = U.uTime.value;

      var pal, rain = 0;
      if (part === 'a') {
        if (p < 0.47) pal = S.pal(PAL.dawn, PAL.day, sm(rg(p, 0.12, 0.34)));
        else if (p < 0.8) pal = S.pal(PAL.day, PAL.rain, sm(rg(p, 0.47, 0.58)));
        else pal = S.pal(PAL.rain, PAL.clear, sm(rg(p, 0.8, 0.94)));
        rain = sm(rg(p, 0.5, 0.58)) * (1 - sm(rg(p, 0.8, 0.88)));
        SU.uGold.value = 0; SU.uLean.value = 0;
        SU.uWind.value = 1 + rain * 1.6;
        S.rigA(p, S.cam);
      } else {
        pal = S.pal(PAL.clear, PAL.gold, sm(rg(p, 0, 0.28)));
        SU.uGold.value = sm(rg(p, 0.0, 0.3));
        SU.uSweep.value = AM.lerp(18, -18, rg(p, 0.28, 0.72));
        SU.uLean.value = 1.05;
        SU.uWind.value = 1.2;
        S.rigB(p, S.cam);
      }
      U.uTop.value.copy(pal.top); U.uHor.value.copy(pal.hor); U.uSunCol.value.copy(pal.sun);
      U.uFogCol.value.copy(pal.hor).multiplyScalar(0.82);
      U.uSun.value.set(0.3, pal.el, -1).normalize();
      SU.uLight.value.copy(pal.tip); SU.uDim.value = pal.dim;
      S.sunLight.color.copy(pal.sun); S.sunLight.intensity = 0.6 + (1 - rain) * 1.9;
      U.uRain.value = rain; S.rain.visible = rain > 0.01;
      U.uFogDen.value = 0.04 + rain * 0.03;

      /* hero grain: breathing glow, gentle sway, fades as the camera leaves */
      var heroK = part === 'a' ? 1 - sm(rg(p, 0.12, 0.3)) : 0;
      S.glow.material.opacity = (0.35 + Math.sin(t * 1.4) * 0.08 * AM.MOTION) * heroK + 0.04;
      S.hero.rotation.z = Math.sin(t * 0.7) * 0.012 * AM.MOTION; S.hero.visible = part === 'a';
      S.motesNear.material.uniforms.uOpacity.value = heroK;
      S.motesFar.material.uniforms.uOpacity.value = 0.5 + (part === 'b' ? 0.5 : 0);

      /* harvest stream */
      var streamOn = part === 'b' && p > 0.38;
      S.stream.visible = streamOn;
      if (streamOn) {
        var M = S.M, Q = S.Q, P = S.P, SC = S.SC, E = S.E, A = S.A, B = S.B;
        for (var i = 0; i < S.SN; i++) {
          var d = S.sd[i];
          var e = sm(rg(p, 0.4 + d.s * 0.3, 0.58 + d.s * 0.3));
          var along = (d.s2 + (p - 0.45) * 1.25 + t * 0.02 * AM.MOTION) % 1;
          if (along < 0) along += 1;
          var ang = along * 15 + d.s * 6.283 + t * 0.5 * AM.MOTION, rad = 1.25 * (1 - along) + 0.1;
          var sx = AM.lerp(A.x, B.x, along) + Math.cos(ang) * rad;
          var sy = AM.lerp(A.y, B.y, along) + Math.sin(ang) * rad * 0.8;
          var sz = AM.lerp(A.z, B.z, along);
          P.set(AM.lerp(d.x, sx, e), AM.lerp(d.y, sy, e), AM.lerp(d.z, sz, e));
          E.set(t * (1 + d.s) * AM.MOTION + d.s * 9, d.s2 * 9 + along * 6, t * 0.7 * AM.MOTION);
          Q.setFromEuler(E); SC.setScalar(e < 0.02 ? 0.0001 : 0.03 * Math.min(1, e * 3));
          M.compose(P, Q, SC); S.stream.setMatrixAt(i, M);
        }
        S.stream.instanceMatrix.needsUpdate = true;
      }

      AM.applyCam(S.camera, S.cam, part === 'a' && p < 0.1 ? 0.04 : 1);
      S.sky.position.copy(S.camera.position);
    }
  });
})();
