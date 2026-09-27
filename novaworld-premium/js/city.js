/* ══════════════════════════════════════════════════════════════════
   CITY — chapter 5 · Invest
   A Canadian downtown after dark: ~800 instanced towers with procedural
   lit windows, streets streaked by traffic light. In the one empty lot
   at the centre, a gold wireframe blueprint appears, then fills floor
   by floor into a glass tower: the business you start or buy. The
   paper plane circles it.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var AM = window.AM;
  if (!window.THREE) return;
  var C = function (h) { return new THREE.Color(h); };
  var FLOORS = 16, BH = 3.4, BW = 0.9;

  AM.register('city', {
    build: function (renderer, env) {
      var S = this;
      var scene = S.scene = new THREE.Scene();
      scene.environment = env;
      var FOG = C('#0d1733');
      scene.background = FOG;
      var camera = S.camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.05, 220);
      camera.userData.shiftX = 0.14;

      /* sky: dusk gradient dome */
      var sky = S.sky = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false,
        uniforms: { uTop: { value: C('#040816') }, uHor: { value: C('#1c2b57') }, uGlow: { value: C('#b0772a') } },
        vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: 'uniform vec3 uTop, uHor, uGlow; varying vec3 vD; void main(){ float h = vD.y; vec3 c = mix(uHor, uTop, smoothstep(0., .5, h)); c += uGlow * .35 * exp(-max(h, 0.) * 14.) * (.6 + .4 * vD.z * -1.); gl_FragColor = vec4(c, 1.);' + AM.GLTAIL + '}'
      }));
      sky.renderOrder = -1; scene.add(sky);

      /* ground: streets with moving light streaks */
      var GU = S.GU = { uTime: { value: 0 }, uFog: { value: FOG } };
      var ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShaderMaterial({
        uniforms: GU,
        vertexShader: 'varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }',
        fragmentShader: [
          'uniform float uTime; uniform vec3 uFog; varying vec3 vW; varying float vD;',
          'float h1(float n){ return fract(sin(n) * 43758.5453); }',
          'void main(){',
          '  vec2 g = vW.xz / 1.6 + .5; vec2 cell = floor(g); vec2 f = fract(g);',
          '  float road = 1. - step(.16, min(min(f.x, 1. - f.x), min(f.y, 1. - f.y)) * 1.);',
          '  vec3 c = mix(vec3(.02, .03, .06), vec3(.05, .06, .1), road);',
          '  float lx = step(abs(f.x - .5), .5) * (1. - step(.08, min(f.x, 1. - f.x)));',
          '  float lz = (1. - step(.08, min(f.y, 1. - f.y)));',
          '  float sx = pow(fract(vW.z * .12 + uTime * (.25 + h1(cell.x) * .3) + h1(cell.x * 7.)), 18.) * lx;',
          '  float sz = pow(fract(-vW.x * .12 + uTime * (.2 + h1(cell.y) * .3) + h1(cell.y * 3.)), 18.) * lz;',
          '  c += vec3(1., .72, .35) * sx * 1.4 + vec3(.95, .25, .2) * sz * 1.1;',
          '  float fog = 1. - exp(-pow(vD * .03, 2.));',
          '  gl_FragColor = vec4(mix(c, uFog, fog), 1.);' + AM.GLTAIL + '}'].join('\n')
      }));
      ground.rotation.x = -Math.PI / 2; scene.add(ground);

      /* towers */
      var box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
      var r = AM.seeded(404), mats = [], seeds = [];
      var M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), SC = new THREE.Vector3();
      var span = AM.TIER < 1 ? 11 : 16;
      for (var gx = -span; gx <= span; gx++) {
        for (var gz = -span; gz <= span; gz++) {
          if (Math.abs(gx) <= 1 && Math.abs(gz) <= 1) continue;   // the empty lot and its plaza
          var d = Math.sqrt(gx * gx + gz * gz);
          if (r() < 0.12 + d * 0.012) continue;
          var n = 1 + Math.floor(r() * 2);
          for (var k = 0; k < n; k++) {
            var w = n === 1 ? 0.7 + r() * 0.35 : 0.42 + r() * 0.2, dd = n === 1 ? 0.7 + r() * 0.35 : 0.9 + r() * 0.1;
            var hgt = (0.4 + Math.pow(r(), 2.2) * 4.6) * (1.3 - Math.min(1, d / span) * 0.8) + 0.3;
            var ox = n === 1 ? 0 : (k === 0 ? -0.26 : 0.26);
            P.set(gx * 1.6 + ox, 0, gz * 1.6); SC.set(w, hgt, dd); Q.identity();
            M.compose(P, Q, SC); mats.push(M.clone()); seeds.push(r());
          }
        }
      }
      var TU = S.TU = { uTime: { value: 0 }, uFog: { value: FOG }, uLit: { value: 0.5 } };
      var tmat = new THREE.ShaderMaterial({
        uniforms: TU,
        vertexShader: [
          'attribute float aSeed; varying vec3 vW, vN, vL; varying float vSeed, vD;',
          'void main(){',
          '  mat4 m = modelMatrix * instanceMatrix;',
          '  vec4 w = m * vec4(position, 1.); vW = w.xyz;',
          '  vN = normalize(mat3(m) * normal); vL = position; vSeed = aSeed;',
          '  vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv;',
          '}'].join('\n'),
        fragmentShader: [
          'uniform float uTime, uLit; uniform vec3 uFog; varying vec3 vW, vN, vL; varying float vSeed, vD;',
          'float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
          'void main(){',
          '  vec3 c;',
          '  if (abs(vN.y) > .5) { c = vec3(.03, .04, .08); }',
          '  else {',
          '    float u = abs(vN.x) > .5 ? vW.z : vW.x;',
          '    vec2 q = vec2(u / .085, vW.y / .12); vec2 id = floor(q), f = fract(q);',
          '    float win = step(.18, f.x) * step(f.x, .82) * step(.22, f.y) * step(f.y, .78);',
          '    float rnd = h2(id + vSeed * 91.);',
          '    float lit = step(1. - uLit * (.35 + .5 * vSeed), rnd) * win;',
          '    vec3 warm = mix(vec3(1., .78, .42), vec3(.7, .82, 1.), step(.72, h2(id * 1.7 + vSeed)));',
          '    float grad = .5 + .5 * smoothstep(0., 4., vW.y);',
          '    c = vec3(.03, .042, .085) * grad + warm * lit * (.3 + .35 * rnd);',
          '    c += vec3(.12, .16, .3) * pow(1. - abs(dot(vN, normalize(cameraPosition - vW))), 3.) * .15;',
          '  }',
          '  float fog = 1. - exp(-pow(vD * .03, 2.));',
          '  gl_FragColor = vec4(mix(c, uFog, fog), 1.);' + AM.GLTAIL + '}'].join('\n')
      });
      var towers = new THREE.InstancedMesh(box, tmat, mats.length);
      var sa = new Float32Array(seeds);
      mats.forEach(function (m, i) { towers.setMatrixAt(i, m); });
      box.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sa, 1));
      towers.frustumCulled = false; scene.add(towers);

      /* the plaza + the new building */
      var plaza = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ color: '#0a1024' }));
      plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.004; scene.add(plaza);
      var site = S.site = new THREE.Group(); scene.add(site);
      /* blueprint: gold edges of the full volume + a floor grid */
      var bpGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(BW, BH, BW)); bpGeo.translate(0, BH / 2, 0);
      var bp = S.bp = new THREE.LineSegments(bpGeo, new THREE.LineBasicMaterial({ color: '#ffcc29', transparent: true, opacity: 0 }));
      site.add(bp);
      var gridPts = [];
      for (var f = 1; f < FLOORS; f++) {
        var y = f * BH / FLOORS, hw = BW / 2;
        gridPts.push(-hw, y, -hw, hw, y, -hw, hw, y, -hw, hw, y, hw, hw, y, hw, -hw, y, hw, -hw, y, hw, -hw, y, -hw);
      }
      var gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3));
      var grid = S.grid = new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: '#ffcc29', transparent: true, opacity: 0 }));
      site.add(grid);
      var fp = new THREE.Mesh(new THREE.PlaneGeometry(BW * 1.8, BW * 1.8), new THREE.MeshBasicMaterial({ color: '#ffcc29', transparent: true, opacity: 0, wireframe: true }));
      fp.rotation.x = -Math.PI / 2; fp.position.y = 0.01; site.add(fp); S.fp = fp;
      /* floors: glass slabs that fill in one by one */
      S.floors = [];
      var glass = new THREE.MeshPhysicalMaterial({ color: '#1b2c5a', metalness: 0.2, roughness: 0.15, clearcoat: 1, envMapIntensity: 1.4, emissive: C('#ffcc29'), emissiveIntensity: 0.0 });
      for (f = 0; f < FLOORS; f++) {
        var slab = new THREE.Mesh(new THREE.BoxGeometry(BW * 0.98, BH / FLOORS * 0.9, BW * 0.98), glass.clone());
        slab.position.y = (f + 0.5) * BH / FLOORS; slab.scale.set(1, 0.001, 1); site.add(slab); S.floors.push(slab);
      }
      var crown = S.crown = AM.glow('#ffcc29', 2.6, 0); crown.position.y = BH + 0.2; site.add(crown);
      var baseGlow = S.baseGlow = AM.glow('#ffcc29', 3.2, 0); baseGlow.position.y = 0.1; site.add(baseGlow);

      /* the plane */
      var plane = S.plane = AM.makePaper({ ticks: 4, stamps: 2, fold: 1, nx: 10, ny: 14, glow: 0.5 });
      plane.scale.setScalar(0.28); scene.add(plane);
      var pg = S.pglow = AM.glow('#ffcc29', 0.6, 0.4); scene.add(pg);

      scene.add(new THREE.HemisphereLight('#9fb6ff', '#0a1128', 0.8));
      var key = new THREE.DirectionalLight('#ffd89a', 1.2); key.position.set(-4, 6, 3); scene.add(key);

      S.rig = AM.rig({
        aerial: { pos: [9, 12, 15], tgt: [0, 0.5, 0] },
        street: { pos: [0.8, 0.75, 8.0], tgt: [0.1, 1.5, 0] },
        orbit:  { pos: [-4.0, 3.0, 4.0], tgt: [0, 1.8, 0] },
        rise:   { pos: [-2.4, 1.2, -4.0], tgt: [0, 2.2, 0] },
        up:     { pos: [1.6, 0.35, 2.3], tgt: [-0.1, 3.6, -0.2], roll: 0.04 }
      }, [
        { p0: 0.02, p1: 0.26, keys: ['aerial', 'street'] },
        { p0: 0.48, p1: 0.58, keys: ['street', 'orbit'] },
        { p0: 0.74, p1: 0.84, keys: ['orbit', 'rise', 'up'] }
      ]);
      S.cam = AM.camState(); S.dir = new THREE.Vector3(); S.up = new THREE.Vector3(0, 1, 0);
    },

    update: function (part, p, t) {
      var S = this, sm = AM.smooth, rg = AM.range, mo = AM.MOTION;
      var T = t * mo;
      S.GU.uTime.value = T; S.TU.uTime.value = T;
      S.TU.uLit.value = 0.3 + 0.45 * sm(rg(p, 0.0, 0.5));

      /* blueprint → floors → lit tower */
      var bp = sm(rg(p, 0.3, 0.42));
      S.bp.material.opacity = bp * (1 - 0.6 * sm(rg(p, 0.9, 1)));
      S.grid.material.opacity = bp * 0.45 * (1 - sm(rg(p, 0.7, 0.85)));
      S.fp.material.opacity = bp * 0.25 * (1 - sm(rg(p, 0.6, 0.75)));
      var fill = rg(p, 0.5, 0.82);
      for (var i = 0; i < S.floors.length; i++) {
        var k = sm(rg(fill * S.floors.length - i, 0, 1));
        var sl = S.floors[i]; sl.scale.y = Math.max(0.001, k); sl.visible = k > 0.002;
        sl.material.emissiveIntensity = k * (0.08 + 0.25 * sm(rg(p, 0.82, 0.95))) + (1 - k) * 0.6;
      }
      S.crown.material.opacity = sm(rg(p, 0.82, 0.92)) * 0.55;
      S.baseGlow.material.opacity = bp * 0.3;

      /* plane circles the site */
      var ang = p * Math.PI * 3.2 + T * 0.12, rad = 2.2 - p * 0.4, hy = 1.2 + p * 2.6;
      S.plane.position.set(Math.cos(ang) * rad, hy + Math.sin(ang * 2) * 0.12, Math.sin(ang) * rad);
      S.dir.set(-Math.sin(ang), 0.18, Math.cos(ang));
      AM.orient(S.plane, S.dir, S.up);
      S.plane.rotateY(0.45);
      S.pglow.position.copy(S.plane.position);

      S.rig(p, S.cam);
      AM.applyCam(S.camera, S.cam, 0.6);
      S.sky.position.copy(S.camera.position);
    }
  });
})();
