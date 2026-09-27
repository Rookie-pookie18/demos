/* ══════════════════════════════════════════════════════════════════
   MILL — five steps on one kernel, then the whole lot.
   01 dust blows off the husk · 02 husk halves hinge open · 03 brown →
   pearl under a travelling light · 04 grains fly into rows by length
   · 05 a falling curtain crosses a laser; rejects get kicked aside.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var AM = window.AM;
  if (!window.THREE) return;
  var C = function (h) { return new THREE.Color(h); };
  var BROWN = C('#8a5b34'), GLOW = C('#2a1a0c'), PEARL_E = C('#1a140b');

  AM.register('mill', {
    build: function (renderer, env) {
      var S = this, r = AM.seeded(51);
      var scene = S.scene = new THREE.Scene();
      scene.environment = env;
      scene.background = C('#060907');
      var camera = S.camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.05, 120);
      camera.userData.shiftX = 0.13;

      /* backdrop: soft pool of light behind the subject */
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false,
        vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: 'varying vec3 vD; void main(){ float s = pow(max(dot(vD, normalize(vec3(.1, .25, -1.))), 0.), 5.); vec3 c = mix(vec3(.018, .026, .022), vec3(.1, .13, .11), s); gl_FragColor = vec4(c, 1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
      })));

      scene.add(new THREE.HemisphereLight('#d9e6dd', '#0b100d', 0.35));
      var key = new THREE.DirectionalLight('#ffe6c2', 2.2); key.position.set(-3, 4, 5); scene.add(key);
      var rim = new THREE.DirectionalLight('#bfe0d2', 2.6); rim.position.set(4, 1.5, -4); scene.add(rim);
      var sweep = S.sweep = new THREE.PointLight('#fff1d8', 0, 4, 2); scene.add(sweep);

      /* hero kernel + two husk halves */
      var hero = S.hero = new THREE.Group(); scene.add(hero);
      var kernelMat = S.kernelMat = AM.grainMat({ color: BROWN.clone(), roughness: 0.55, clearcoat: 0, env: 1.2 });
      var kernel = S.kernel = new THREE.Mesh(AM.grainGeo('hi'), kernelMat); hero.add(kernel);
      var huskGeo = AM.huskHalf();
      var huskMat = S.huskMat = new THREE.MeshStandardMaterial({ color: '#b98a3d', roughness: 0.72, metalness: 0.05, side: THREE.DoubleSide, transparent: true, envMapIntensity: 0.9, emissive: '#1c1204' });
      var hA = S.hA = new THREE.Mesh(huskGeo, huskMat), hB = S.hB = new THREE.Mesh(huskGeo, huskMat);
      hB.rotation.x = Math.PI; hero.add(hA, hB);

      /* cleaning dust: sits on the husk, then blows off (shader, driven by uP) */
      var DN = Math.round(700 * AM.TIER) + 150, dp = new Float32Array(DN * 3), dd = new Float32Array(DN * 3), ds = new Float32Array(DN);
      for (var i = 0; i < DN; i++) {
        var x = (r() * 2 - 1) * 0.95, a = r() * Math.PI * 2, rad = 0.23 * Math.sqrt(Math.max(0, 1 - x * x));
        dp.set([x, Math.cos(a) * rad, Math.sin(a) * rad * 0.86], i * 3);
        dd.set([1.2 + r() * 1.5, Math.cos(a) * 0.8 + 0.4, Math.sin(a) * 0.9], i * 3); ds[i] = r();
      }
      var dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
      dg.setAttribute('aDir', new THREE.BufferAttribute(dd, 3));
      dg.setAttribute('aSeed', new THREE.BufferAttribute(ds, 1));
      var dust = S.dust = new THREE.Points(dg, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, uniforms: { uP: { value: 0 }, uTime: { value: 0 } },
        vertexShader: 'attribute vec3 aDir; attribute float aSeed; uniform float uP, uTime; varying float vA; void main(){ float k = clamp((uP - aSeed * .45) / .55, 0., 1.); k = 1. - pow(1. - k, 3.); vec3 p = position + aDir * k * 2.4 + vec3(0., sin(uTime + aSeed * 30.) * .02, 0.); vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = (1.5 + aSeed * 3.) * (6. / -mv.z) * 2.; vA = (1. - k) * (.5 + aSeed * .5); }',
        fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(.8, .66, .42), smoothstep(.5, .1, d) * vA); }'
      }));
      hero.add(dust);

      /* polishing glint travelling along the kernel */
      var glint = S.glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: AM.glowTex(), color: '#fff3dc', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
      glint.scale.set(0.9, 0.9, 1); scene.add(glint);

      /* grading grid */
      var ROWS = 9, COLS = AM.TIER < 1 ? 20 : 32, GN = ROWS * COLS;
      var lens = []; for (i = 0; i < GN; i++) lens.push(i < GN * 0.2 ? 0.45 + r() * 0.3 : 0.82 + r() * 0.24);
      lens.sort(function (a, b) { return b - a; });
      var gridMat = AM.grainMat({ env: 1 });
      var grid = S.grid = new THREE.InstancedMesh(AM.grainGeo('mid'), gridMat, GN);
      S.gd = [];
      var col = new THREE.Color();
      for (i = 0; i < GN; i++) {
        var row = Math.floor(i / COLS), c = i % COLS;
        var zz = (row - 4) * 0.34 + (row >= 7 ? 0.35 : 0);
        S.gd.push({ len: lens[i], tx: (c - (COLS - 1) / 2) * 0.3, tz: zz,
          sx: (r() - 0.5) * 9, sy: (r() - 0.5) * 6, sz: (r() - 0.5) * 6 - 1, s: r(), rot: r() * 6.28 });
        col.copy(AM.PEARL).multiplyScalar(row >= 7 ? 0.72 : 1); grid.setColorAt(i, col);
      }
      S.heroSlot = S.gd[Math.floor(COLS / 2)];
      grid.frustumCulled = false; grid.visible = false; scene.add(grid);

      /* optical sorter: falling curtain + laser */
      var FN = S.FN = Math.round(520 * AM.TIER) + 120;
      var fall = S.fall = new THREE.InstancedMesh(AM.grainGeo('mid'), AM.grainMat({ env: 1 }), FN);
      S.fd = [];
      for (i = 0; i < FN; i++) {
        var bad = r() < 0.07;
        S.fd.push({ s: r(), x: (r() - 0.5) * 1.6, z: (r() - 0.5) * 0.25, bad: bad, spin: r() * 6.28, side: r() < 0.5 ? -1 : 1 });
        col.set(bad ? (r() < 0.5 ? '#9d8350' : '#5c4a38') : '#f3efe4'); fall.setColorAt(i, col);
      }
      fall.frustumCulled = false; fall.visible = false; scene.add(fall);
      var laser = S.laser = new THREE.Group(); laser.position.y = 0.2; scene.add(laser);
      laser.add(new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.008), new THREE.MeshBasicMaterial({ color: '#ff5a3c', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
      var lg = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.35), new THREE.MeshBasicMaterial({ map: AM.glowTex(), color: '#ff4a2a', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 }));
      laser.add(lg); laser.visible = false;

      S.rig = AM.rig({
        clean:  { pos: [0.2, 0.35, 5.2], tgt: [0, 0, 0] },
        dehusk: { pos: [-1.7, 1.3, 4.1], tgt: [0.1, 0, 0], roll: 0.08 },
        polish: { pos: [1.1, -0.75, 3.5], tgt: [0, 0, 0], roll: -0.1 },
        grade:  { pos: [0, 5.6, 5.4], tgt: [0, -0.2, -0.3] },
        sort:   { pos: [0.3, 0.7, 7.4], tgt: [0, 0.35, 0] }
      }, [
        { p0: 0.15, p1: 0.23, keys: ['clean', 'dehusk'] },
        { p0: 0.35, p1: 0.43, keys: ['dehusk', 'polish'] },
        { p0: 0.55, p1: 0.63, keys: ['polish', 'grade'] },
        { p0: 0.75, p1: 0.83, keys: ['grade', 'sort'] }
      ]);
      S.cam = AM.camState();
      S.M = new THREE.Matrix4(); S.Q = new THREE.Quaternion(); S.P = new THREE.Vector3(); S.SC = new THREE.Vector3(); S.E = new THREE.Euler();
    },

    update: function (part, p, t) {
      var S = this, sm = AM.smooth, rg = AM.range, mo = AM.MOTION;
      var M = S.M, Q = S.Q, P = S.P, SC = S.SC, E = S.E;

      /* 01 cleaning */
      S.dust.material.uniforms.uP.value = rg(p, 0.02, 0.16);
      S.dust.material.uniforms.uTime.value = t;
      S.dust.visible = p < 0.2;

      /* 02 dehusking: halves hinge apart, then fade */
      var open = sm(rg(p, 0.22, 0.33)), gone = sm(rg(p, 0.3, 0.37));
      S.hA.position.set(open * 0.15, open * 0.25, open * 0.55); S.hA.rotation.set(-open * 0.9, open * 0.25, 0);
      S.hB.position.set(-open * 0.1, -open * 0.3, -open * 0.55); S.hB.rotation.set(Math.PI + open * 0.9, -open * 0.2, 0);
      S.huskMat.opacity = 1 - gone; S.hA.visible = S.hB.visible = gone < 0.99;
      var huskScale = 1 + open * 0.05; S.hA.scale.setScalar(huskScale); S.hB.scale.setScalar(huskScale);

      /* 03 polishing */
      var pol = sm(rg(p, 0.43, 0.54));
      S.kernelMat.color.lerpColors(BROWN, AM.PEARL, pol);
      S.kernelMat.emissive.lerpColors(GLOW, PEARL_E, pol);
      S.kernelMat.roughness = AM.lerp(0.55, 0.32, pol);
      S.kernelMat.clearcoat = AM.lerp(0, 0.6, pol);
      var sw = rg(p, 0.42, 0.56), swOn = Math.sin(sw * Math.PI);
      S.sweep.position.set(AM.lerp(-1.6, 1.6, sw), 0.35, 0.7); S.sweep.intensity = swOn * 6;
      S.glint.position.set(AM.lerp(-1.2, 1.2, sw), 0.12, 0.3); S.glint.material.opacity = swOn * 0.55;

      /* hero kernel: idle spin, then shrinks into its slot in the grid */
      var toGrid = sm(rg(p, 0.58, 0.68));
      var slot = S.heroSlot, hs = AM.lerp(1, 0.12, toGrid);
      S.hero.position.set(AM.lerp(0, slot.tx, toGrid), 0, AM.lerp(0, slot.tz, toGrid));
      S.hero.scale.setScalar(hs);
      S.hero.rotation.set(AM.lerp(t * 0.25 * mo + p * 5, 0, toGrid), AM.lerp(Math.sin(t * 0.3) * 0.2 * mo, 0, toGrid), 0);
      S.hero.visible = p < 0.84;

      /* 04 grading grid */
      var gridOn = p > 0.54 && p < 0.9;
      S.grid.visible = gridOn;
      if (gridOn) {
        var drop = sm(rg(p, 0.79, 0.86));
        for (var i = 0; i < S.gd.length; i++) {
          var d = S.gd[i], e = sm(rg(p, 0.57 + d.s * 0.07, 0.66 + d.s * 0.07));
          P.set(AM.lerp(d.sx, d.tx, e), AM.lerp(d.sy, 0, e) - drop * (2 + d.s * 3), AM.lerp(d.sz, d.tz, e));
          E.set(AM.lerp(d.rot + t * 0.3 * mo, 0, e), AM.lerp(d.rot, 0, e), 0); Q.setFromEuler(E);
          var sc = d === slot ? 0.0001 : 0.12 * Math.min(1, rg(p, 0.55 + d.s * 0.04, 0.6 + d.s * 0.04));
          SC.set(sc * d.len, sc, sc); M.compose(P, Q, SC); S.grid.setMatrixAt(i, M);
        }
        S.grid.instanceMatrix.needsUpdate = true;
      }

      /* 05 optical sorting */
      var sortOn = p > 0.78;
      S.fall.visible = S.laser.visible = sortOn;
      if (sortOn) {
        var inK = sm(rg(p, 0.78, 0.86)), H = 6.4, ly = S.laser.position.y;
        S.laser.children[1].material.opacity = 0.5 + Math.sin(t * 9) * 0.15 * mo + 0.2;
        for (var j = 0; j < S.FN; j++) {
          var f = S.fd[j];
          var y = 3.2 - ((f.s * H + t * 1.3 * mo + p * 9) % H);
          var x = f.x, z = f.z;
          if (f.bad && y < ly) { var k = ly - y; x += f.side * Math.pow(k, 1.5) * 0.9; z += k * 0.4; }
          P.set(x, y, z);
          E.set(f.spin + t * 2 * mo, f.spin * 2, f.spin + y); Q.setFromEuler(E);
          SC.setScalar(0.11 * inK); M.compose(P, Q, SC); S.fall.setMatrixAt(j, M);
        }
        S.fall.instanceMatrix.needsUpdate = true;
      }

      S.rig(p, S.cam);
      AM.applyCam(S.camera, S.cam, 1);
    }
  });
})();
