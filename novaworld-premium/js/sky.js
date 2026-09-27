/* ══════════════════════════════════════════════════════════════════
   SKY — chapter 1 · Assess
   Above the clouds on a polar night. The applicant's assessment sheet
   hangs in the air; its answers fill in, it gets its first stamp, then
   it folds into a paper plane, turns, and launches toward the aurora
   on a gold trail.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var AM = window.AM;
  if (!window.THREE) return;
  var C = function (h) { return new THREE.Color(h); };

  var NOISE = [
    'float hh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);',
    '  return mix(mix(hh(i), hh(i + vec2(1., 0.)), f.x), mix(hh(i + vec2(0., 1.)), hh(i + vec2(1.)), f.x), f.y); }',
    'float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + 11.7; a *= .5; } return s; }'
  ].join('\n');

  AM.register('sky', {
    build: function (renderer, env) {
      var S = this;
      var scene = S.scene = new THREE.Scene();
      scene.environment = env;
      var camera = S.camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.01, 400);
      camera.userData.shiftX = 0.17;

      var U = S.U = AM.skyUniforms();
      U.uHor.value = C('#1a2c55');
      var sky = S.sky = AM.skyDome(U, 200); scene.add(sky);

      /* moon */
      var moon = new THREE.Mesh(new THREE.SphereGeometry(2.2, 32, 16), new THREE.MeshBasicMaterial({ color: '#e9efff' }));
      moon.position.set(-46, 34, -120); scene.add(moon);
      var mg = AM.glow('#9fb8ff', 60, 0.35); mg.position.copy(moon.position); scene.add(mg);

      /* cloud sea: three stacked noise layers, fogged into the horizon */
      S.clouds = [];
      var CU = { uTime: { value: 0 }, uFogCol: { value: C('#1a2c55') }, uFogDen: { value: 0.014 } };
      [[-2.2, 0.0, '#0e1a36', '#5c6f9e', 0.05], [-3.1, 3.7, '#0b1530', '#44578a', 0.12], [-4.4, 7.1, '#081026', '#34467a', 0.2]].forEach(function (L, i) {
        var m = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), new THREE.ShaderMaterial({
          transparent: true, depthWrite: false,
          uniforms: { uTime: CU.uTime, uFogCol: CU.uFogCol, uFogDen: CU.uFogDen, uOff: { value: L[1] }, uCol: { value: C(L[2]) }, uLit: { value: C(L[3]) }, uDen: { value: L[4] }, uAur: U.uAur },
          vertexShader: 'varying vec3 vW; varying float vDepth; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }',
          fragmentShader: NOISE + [
            'uniform float uTime, uOff, uDen, uFogDen, uAur; uniform vec3 uCol, uLit, uFogCol; varying vec3 vW; varying float vDepth;',
            'void main(){',
            '  vec2 p = vW.xz * .07 + vec2(uTime * .012 + uOff, uOff * 1.3 - uTime * .004);',
            '  float n = fbm(p);',
            '  float a = smoothstep(.42 - uDen, .82, n);',
            '  vec3 c = mix(uCol, uLit, smoothstep(.55, .95, n));',
            '  c += vec3(.12, .5, .38) * uAur * .12 * smoothstep(.6, 1., n);',
            '  float fog = 1. - exp(-uFogDen * uFogDen * vDepth * vDepth);',
            '  gl_FragColor = vec4(mix(c, uFogCol, fog), a * .92);' + AM.GLTAIL + '}'].join('\n')
        }));
        m.rotation.x = -Math.PI / 2; m.position.y = L[0]; m.renderOrder = 1 + (2 - i);
        scene.add(m); S.clouds.push(m);
      });
      S.CU = CU;

      /* the sheet */
      var paper = S.paper = AM.makePaper({ ticks: 0, stamps: 0, glow: 0.32 });
      var holder = S.holder = new THREE.Group(); holder.add(paper); scene.add(holder);
      var glow = S.glowS = AM.glow('#ffcc29', 2.6, 0.18); glow.position.set(0, 0, -0.25); holder.add(glow);

      /* launch path + trail */
      var path = S.path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.35, 0.25, -2.2), new THREE.Vector3(1.3, 1.0, -8),
        new THREE.Vector3(3.0, 2.4, -20), new THREE.Vector3(5.5, 5.2, -44), new THREE.Vector3(8, 9, -80)
      ]);
      var trail = S.trail = AM.trail(path, '#ffcc29', 0.012, 240, 0.22); scene.add(trail);

      /* lights */
      scene.add(new THREE.HemisphereLight('#9fb6ff', '#0a1128', 0.7));
      var key = new THREE.DirectionalLight('#dfe8ff', 2.0); key.position.set(-3, 3, 4); scene.add(key);
      var rim = S.rim = new THREE.DirectionalLight('#ffcc29', 1.1); rim.position.set(3, -1, -2); scene.add(rim);
      var aur = S.aurLight = new THREE.DirectionalLight('#6fe0c8', 0.0); aur.position.set(0, 4, -6); scene.add(aur);

      /* motes: ice glitter around the sheet */
      var m1 = S.motes = AM.motes(Math.round(260 * AM.TIER) + 60, [3, 2, 3], '#dfe8ff', 0.012, 0.6);
      scene.add(m1);

      S.rig = AM.rig({
        hero:   { pos: [0.02, 0.0, 2.7], tgt: [0, 0, 0] },
        read:   { pos: [0.16, -0.08, 1.85], tgt: [0.03, -0.06, 0] },
        fold:   { pos: [-0.95, 0.45, 1.75], tgt: [0, 0.02, 0] },
        wide:   { pos: [1.6, 0.75, 3.7], tgt: [0, 0.25, -3] },
        launch: { pos: [0.9, 0.9, 2.2], tgt: [3, 2.4, -20], roll: -0.05 }
      }, [
        { p0: 0.06, p1: 0.15, keys: ['hero', 'read'] },
        { p0: 0.31, p1: 0.4, keys: ['read', 'fold'] },
        { p0: 0.56, p1: 0.67, keys: ['fold', 'wide'] },
        { p0: 0.8, p1: 0.97, keys: ['wide', 'launch'] }
      ]);
      S.cam = AM.camState();
      S.tmp = new THREE.Vector3(); S.up = new THREE.Vector3(0, 1, 0); S.dir = new THREE.Vector3();
      S.q0 = new THREE.Quaternion(); S.q1 = new THREE.Quaternion(); S.e = new THREE.Euler();
    },

    update: function (part, p, t) {
      var S = this, U = S.U, sm = AM.smooth, rg = AM.range, mo = AM.MOTION;
      var T = t * mo + 0.001;
      U.uTime.value = T; S.CU.uTime.value = T; S.motes.material.uniforms.uTime.value = T;
      U.uAur.value = 0.28 + 0.9 * sm(rg(p, 0.45, 0.75));
      S.aurLight.intensity = U.uAur.value * 0.6;

      /* answers fill in, then the first stamp */
      var ticks = p < 0.14 ? 0 : p < 0.18 ? 1 : p < 0.22 ? 2 : p < 0.26 ? 3 : 4;
      S.paper.setTex(ticks, p > 0.29 ? 1 : 0);
      S.paper.setFold(rg(p, 0.37, 0.57));

      /* pose: upright sheet → nose-away plane → launch */
      var turn = sm(rg(p, 0.55, 0.72));
      var fl = rg(p, 0.8, 1);
      var bob = Math.sin(t * 0.9) * 0.02 * mo;
      if (fl <= 0) {
        S.e.set(-turn * Math.PI / 2 + Math.sin(t * 0.6) * 0.03 * mo * (1 - turn), Math.sin(t * 0.4) * 0.08 * mo * (1 - turn) - 0.12 * (1 - turn) * (1 - rg(p, 0.3, 0.4)), turn * 0.18);
        S.holder.quaternion.setFromEuler(S.e);
        S.holder.position.set(0, bob, 0);
      } else {
        var u = sm(fl) * 0.5;
        S.path.getPointAt(u, S.holder.position);
        S.path.getTangentAt(Math.min(0.999, u + 0.01), S.dir);
        AM.orient(S.holder, S.dir, S.up);
        S.holder.rotateY(Math.sin(t * 1.4) * 0.12 * mo + 0.18);
      }
      S.trail.material.uniforms.uHead.value = fl > 0 ? sm(fl) * 0.5 : 0;
      S.trail.visible = fl > 0.001;
      S.glowS.material.opacity = 0.16 * (1 - turn) + 0.05;
      S.motes.material.uniforms.uOpacity.value = 1 - sm(rg(p, 0.6, 0.8));

      S.rig(p, S.cam);
      if (fl > 0) {   /* chase: ease from the wide hold to a seat just behind the plane */
        var k = sm(rg(fl, 0, 0.6)), hp = S.holder.position;
        S.tmp.set(hp.x + 0.8, hp.y + 0.38, hp.z + 2.1);
        S.cam.pos.lerp(S.tmp, k);
        S.tmp.set(hp.x + 0.5, hp.y + 0.55, hp.z - 6);
        S.cam.tgt.lerp(S.tmp, k);
      }
      AM.applyCam(S.camera, S.cam, p < 0.06 ? 0.08 : 0.5);
      S.sky.position.copy(S.camera.position);
    }
  });
})();
