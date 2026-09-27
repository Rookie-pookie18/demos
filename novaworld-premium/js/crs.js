/* ══════════════════════════════════════════════════════════════════
   CRS — chapter 2 · Immigrate / Express Entry
   A ring of 300 bars on a dark floor, one bar per 4 CRS points. The
   four categories (A core 500 · B spouse 40 · C transferability 100 ·
   D additional 600) rise and light up in turn as the camera travels
   round the ring. In the middle, the Express Entry pool swirls. The
   paper plane circles the gauge. Category maximums only: no score,
   no cut-off.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var AM = window.AM;
  if (!window.THREE) return;
  var C = function (h) { return new THREE.Color(h); };

  /* category colours: A core · B spouse · C transferability · D additional (bar spans are set in the shader) */
  var CAT_COL = ['#ffcc29', '#7be3c6', '#8fb2ff', '#f08a6c'];

  AM.register('crs', {
    build: function (renderer, env) {
      var S = this;
      var scene = S.scene = new THREE.Scene();
      scene.environment = env;
      scene.background = C('#050915');
      scene.fog = new THREE.FogExp2('#050915', 0.055);
      var camera = S.camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, 0.05, 200);
      camera.userData.shiftX = 0.1;

      /* floor: concentric rings + radial spokes, fading out */
      var floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShaderMaterial({
        uniforms: { uFog: { value: C('#050915') } },
        vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: [
          'uniform vec3 uFog; varying vec3 vW;',
          'void main(){',
          '  float r = length(vW.xz), a = atan(vW.x, -vW.z);',
          '  float rl = smoothstep(.97, 1., 1. - abs(fract(r * 2.) - .5) * 2.);',
          '  float sp = smoothstep(.985, 1., 1. - abs(fract(a / 6.2831853 * 48.) - .5) * 2.) * step(3.5, r);',
          '  float g = (rl * .5 + sp * .35) * exp(-r * .09);',
          '  vec3 c = vec3(.028, .045, .09) + vec3(.2, .3, .55) * g;',
          '  c += vec3(1., .8, .16) * .05 * exp(-abs(r - 3.) * 6.);',
          '  float fog = 1. - exp(-pow(r * .06, 2.));',
          '  gl_FragColor = vec4(mix(c, uFog, fog), 1.);' + AM.GLTAIL + '}'].join('\n'),
        extensions: { derivatives: true }
      }));
      floor.rotation.x = -Math.PI / 2; scene.add(floor);

      /* the gauge */
      var N = 300, R = 3;
      var bar = new THREE.BoxGeometry(0.035, 1, 0.16); bar.translate(0, 0.5, 0);
      var frac = new Float32Array(N), cat = new Float32Array(N);
      var U = S.U = {
        uTime: { value: 0 }, uFill: { value: new THREE.Vector4(0, 0, 0, 0) }, uHi: { value: -1 },
        uC0: { value: C(CAT_COL[0]) }, uC1: { value: C(CAT_COL[1]) }, uC2: { value: C(CAT_COL[2]) }, uC3: { value: C(CAT_COL[3]) }
      };
      var mat = new THREE.ShaderMaterial({
        uniforms: U,
        vertexShader: [
          'attribute float aFrac, aCat; uniform vec4 uFill; uniform float uTime; varying float vOn, vH, vCat, vFrac;',
          'void main(){',
          '  float pts = aFrac * 1200.;',
          '  float st = aCat < .5 ? 0. : aCat < 1.5 ? 500. : aCat < 2.5 ? 540. : 640.;',
          '  float sz = aCat < .5 ? 500. : aCat < 1.5 ? 40. : aCat < 2.5 ? 100. : 560.;',
          '  float hh = aCat < .5 ? .72 : aCat < 1.5 ? .5 : aCat < 2.5 ? .6 : .9;',
          '  float f = aCat < .5 ? uFill.x : aCat < 1.5 ? uFill.y : aCat < 2.5 ? uFill.z : uFill.w;',
          '  float lf = (pts - st) / sz;',
          '  float on = smoothstep(lf - .04, lf + .001, f);',
          '  float wave = .06 * sin(pts * .09 + uTime * 2.) * on;',
          '  float h = mix(.07, hh * (.72 + .28 * sin(pts * .21)) + wave, on);',
          '  vec3 p = position; p.y *= h;',
          '  vOn = on; vH = position.y; vCat = aCat; vFrac = lf;',
          '  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.);',
          '}'].join('\n'),
        fragmentShader: [
          'uniform vec3 uC0, uC1, uC2, uC3; uniform float uHi; varying float vOn, vH, vCat, vFrac;',
          'void main(){',
          '  vec3 cc = vCat < .5 ? uC0 : vCat < 1.5 ? uC1 : vCat < 2.5 ? uC2 : uC3;',
          '  vec3 off = vec3(.07, .1, .19) + cc * .06;',
          '  vec3 on = cc * (.35 + 1.1 * vH) + vec3(1.) * smoothstep(.93, 1., vH) * .5;',
          '  vec3 c = mix(off, on, vOn);',
          '  gl_FragColor = vec4(c, 1.);' + AM.GLTAIL + '}'].join('\n')
      });
      var gauge = S.gauge = new THREE.InstancedMesh(bar, mat, N);
      var M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), SC = new THREE.Vector3(1, 1, 1), Y = new THREE.Vector3(0, 1, 0);
      for (var i = 0; i < N; i++) {
        var f = (i + 0.5) / N, phi = f * Math.PI * 2, pts = f * 1200;
        var c = pts < 500 ? 0 : pts < 540 ? 1 : pts < 640 ? 2 : 3;
        frac[i] = f; cat[i] = c;
        P.set(R * Math.sin(phi), 0, -R * Math.cos(phi));
        Q.setFromAxisAngle(Y, -phi);
        M.compose(P, Q, SC); gauge.setMatrixAt(i, M);
      }
      bar.setAttribute('aFrac', new THREE.InstancedBufferAttribute(frac, 1));
      bar.setAttribute('aCat', new THREE.InstancedBufferAttribute(cat, 1));
      gauge.frustumCulled = false; scene.add(gauge);

      /* category ticks on the floor: thin gold arcs at each boundary */
      var marks = new THREE.Group(); scene.add(marks);
      [0, 500, 540, 640].forEach(function (v) {
        var phi = v / 1200 * Math.PI * 2;
        var m = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.9), new THREE.MeshBasicMaterial({ color: '#ffcc29', transparent: true, opacity: 0.7 }));
        m.rotation.x = -Math.PI / 2; m.rotation.z = -phi;
        m.position.set(3.75 * Math.sin(phi), 0.005, -3.75 * Math.cos(phi)); marks.add(m);
      });
      var outer = new THREE.Mesh(new THREE.RingGeometry(3.52, 3.535, 256), new THREE.MeshBasicMaterial({ color: '#8fa3d6', transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
      outer.rotation.x = -Math.PI / 2; outer.position.y = 0.004; scene.add(outer);

      /* the pool: candidates swirling in the middle */
      var PN = Math.round(2000 * AM.TIER) + 300, pg = new THREE.BufferGeometry(), pp = new Float32Array(PN * 3), ps = new Float32Array(PN);
      var r = AM.seeded(1200);
      for (i = 0; i < PN; i++) {
        var rr = Math.sqrt(r()) * 2.2, aa = r() * Math.PI * 2;
        pp[i * 3] = rr; pp[i * 3 + 1] = aa; pp[i * 3 + 2] = (r() - 0.5) * 0.25; ps[i] = r();
      }
      pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
      pg.setAttribute('aSeed', new THREE.BufferAttribute(ps, 1));
      var PU = S.PU = { uTime: { value: 0 }, uRise: { value: 0 } };
      var pool = new THREE.Points(pg, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: PU,
        vertexShader: [
          'attribute float aSeed; uniform float uTime, uRise; varying float vA, vS;',
          'void main(){',
          '  float r = position.x, a = position.y + uTime * (.25 / (r + .6));',
          '  vec3 p = vec3(r * cos(a), .08 + position.z * .4 + sin(uTime + aSeed * 30.) * .03, r * sin(a));',
          '  p.y += smoothstep(.985 - uRise * .02, 1., aSeed) * uRise * (.4 + aSeed * .6);',
          '  vec4 mv = modelViewMatrix * vec4(p, 1.);',
          '  gl_Position = projectionMatrix * mv;',
          '  gl_PointSize = (0.7 + aSeed * 1.3) * (38. / -mv.z);',
          '  vA = .35 + .65 * aSeed; vS = aSeed;',
          '}'].join('\n'),
        fragmentShader: 'varying float vA, vS; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, .1, d); vec3 c = mix(vec3(.55, .68, 1.), vec3(1., .85, .35), step(.985, vS)); gl_FragColor = vec4(c, a * vA * .5); }'
      }));
      pool.frustumCulled = false; scene.add(pool);
      var core = AM.glow('#5f7cff', 5, 0.1); core.position.y = 0.2; scene.add(core);

      /* the plane, circling */
      var plane = S.plane = AM.makePaper({ ticks: 4, stamps: 1, fold: 1, nx: 10, ny: 14, glow: 0.4 });
      plane.scale.setScalar(0.42); scene.add(plane);
      var pgw = S.pglow = AM.glow('#ffcc29', 0.9, 0.35); scene.add(pgw);

      scene.add(new THREE.HemisphereLight('#9fb6ff', '#0a1128', 0.9));
      var key = new THREE.DirectionalLight('#ffffff', 1.6); key.position.set(3, 6, 4); scene.add(key);

      S.rig = AM.rig({
        intro: { pos: [0, 5.4, 8.2], tgt: [0, 0.2, 0] },
        A:     { pos: [5.0, 1.5, 1.4], tgt: [1.6, 0.45, -1.8] },
        BC:    { pos: [2.6, 1.2, 6.2], tgt: [0.5, 0.45, 2.5] },
        D:     { pos: [-5.4, 1.9, 2.8], tgt: [-2.0, 0.5, -0.6] },
        top:   { pos: [0.3, 9.4, 4.4], tgt: [0, 0, 0.2] }
      }, [
        { p0: 0.14, p1: 0.22, keys: ['intro', 'A'] },
        { p0: 0.35, p1: 0.42, keys: ['A', 'BC'] },
        { p0: 0.66, p1: 0.74, keys: ['BC', 'D'] },
        { p0: 0.84, p1: 0.92, keys: ['D', 'top'] }
      ]);
      S.cam = AM.camState();
      S.dir = new THREE.Vector3(); S.up = new THREE.Vector3(0, 1, 0);
      S.num = document.getElementById('crsNum');
      S.lis = Array.prototype.slice.call(document.querySelectorAll('#crsCats li'));
      S.lastNum = -1; S.lastF = ['', '', '', ''];
    },

    update: function (part, p, t) {
      var S = this, sm = AM.smooth, rg = AM.range, mo = AM.MOTION;
      var T = t * mo;
      S.U.uTime.value = T; S.PU.uTime.value = T;
      var f = [sm(rg(p, 0.2, 0.33)), sm(rg(p, 0.42, 0.49)), sm(rg(p, 0.55, 0.64)), sm(rg(p, 0.74, 0.85))];
      S.U.uFill.value.set(f[0], f[1], f[2], f[3]);
      S.PU.uRise.value = sm(rg(p, 0.86, 1));

      /* readout */
      var total = Math.round(500 * f[0] + 40 * f[1] + 100 * f[2] + 600 * f[3]);
      if (S.num && total !== S.lastNum) { S.lastNum = total; S.num.textContent = total.toLocaleString('en-US'); }
      var act = p < 0.2 ? -1 : p < 0.4 ? 0 : p < 0.54 ? 1 : p < 0.7 ? 2 : p < 0.88 ? 3 : -2;
      for (var i = 0; i < S.lis.length; i++) {
        var k = f[i].toFixed(3);
        if (k !== S.lastF[i]) { S.lastF[i] = k; S.lis[i].style.setProperty('--f', k); }
        S.lis[i].classList.toggle('is-on', act === i || act === -2);
      }

      /* the plane orbits the gauge */
      var ang = p * Math.PI * 4 + T * 0.15, rr = 4.1, hgt = 1.1 + Math.sin(ang * 2) * 0.15;
      S.plane.position.set(rr * Math.sin(ang), hgt, -rr * Math.cos(ang));
      S.dir.set(Math.cos(ang), Math.cos(ang * 2) * 0.05, Math.sin(ang));
      AM.orient(S.plane, S.dir, S.up);
      S.plane.rotateY(-0.35);
      S.pglow.position.copy(S.plane.position);

      S.rig(p, S.cam);
      AM.applyCam(S.camera, S.cam, 0.6);
    }
  });
})();
