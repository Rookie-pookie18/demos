/* ══════════════════════════════════════════════════════════════════
   HOME — chapter 6 · Sponsor & settle (part a), chapter 7 ·
   Citizenship (part b)
   A frozen lake under the aurora, a pine forest, one small house.
   Part a: lanterns (family members) cross the sky one by one and each
   one lights a window. Part b: the paper plane glides in and unfolds
   into the applicant's file, now carrying its fourth stamp; then the
   stars gather into a maple leaf above the lake.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var AM = window.AM;
  if (!window.THREE) return;
  var C = function (h) { return new THREE.Color(h); };

  var LAKE = new THREE.Vector2(0, -10), LAKE_R = 8;
  var HOUSE = new THREE.Vector3(3.6, 0, -1.2);
  function height(x, z) {
    var d = Math.hypot(x - LAKE.x, z - LAKE.y);
    var n = Math.sin(x * 0.11) * Math.cos(z * 0.13) * 1.5 + Math.sin(x * 0.05 + z * 0.07) * 2.5;
    var hills = AM.smooth(AM.range(d, 14, 46)) * (3.2 + n);
    var ripple = (Math.sin(x * 0.7) * Math.cos(z * 0.6) * 0.12 + Math.sin(x * 1.9 + z * 1.3) * 0.04) * AM.smooth(AM.range(d, LAKE_R, LAKE_R + 3));
    return (hills + ripple + 0.02) * AM.smooth(AM.range(d, LAKE_R - 0.5, LAKE_R + 2.5)) - 0.12 * (1 - AM.smooth(AM.range(d, LAKE_R - 0.5, LAKE_R + 1)));
  }

  /* the Canadian maple leaf, right half, as a hand-traced outline (unit height ≈ 1.2) */
  var LEAF_R = [[0, 1], [0.12, 0.78], [0.22, 0.82], [0.17, 0.46], [0.4, 0.7], [0.45, 0.6], [0.64, 0.64], [0.57, 0.42], [0.66, 0.37], [0.36, 0.14], [0.4, 0.04], [0.05, 0.08], [0.05, -0.22]];
  function leafOutline() {
    var pts = LEAF_R.slice();
    for (var i = LEAF_R.length - 1; i >= 0; i--) pts.push([-LEAF_R[i][0], LEAF_R[i][1]]);
    return pts;
  }

  AM.register('home', {
    build: function (renderer, env) {
      var S = this;
      var scene = S.scene = new THREE.Scene();
      scene.environment = env;
      var FOG = C('#15244a');
      scene.fog = new THREE.FogExp2(FOG, 0.018);
      var camera = S.camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.05, 400);
      camera.userData.shiftX = 0.14;

      var U = S.U = AM.skyUniforms();
      U.uHor.value = C('#1a2c55'); U.uAur.value = 0.8;
      var sky = S.sky = AM.skyDome(U, 220); sky.material.fog = false; scene.add(sky);

      /* snow terrain */
      var segs = AM.TIER < 1 ? 110 : 180;
      var tg = new THREE.PlaneGeometry(260, 260, segs, segs); tg.rotateX(-Math.PI / 2);
      var tp = tg.attributes.position;
      for (var i = 0; i < tp.count; i++) tp.setY(i, height(tp.getX(i), tp.getZ(i)));
      tg.computeVertexNormals();
      var snow = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ color: '#7f8fba', roughness: 0.92, metalness: 0, envMapIntensity: 0.35 }));
      scene.add(snow);

      /* frozen lake: reflects the analytic sky (aurora included) */
      var lake = new THREE.Mesh(new THREE.CircleGeometry(LAKE_R + 0.6, 96), new THREE.ShaderMaterial({
        uniforms: U,
        vertexShader: 'varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }',
        fragmentShader: AM.SKYGLSL + [
          '\nvarying vec3 vW; varying float vD;',
          'void main(){',
          '  vec3 V = normalize(vW - cameraPosition);',
          '  float streak = sin(vW.x * 1.7 + sin(vW.z * .6) * 2.) * .5 + .5;',
          '  vec3 N = normalize(vec3(sin(vW.z * 3.1) * .01, 1., cos(vW.x * 2.3) * .01));',
          '  vec3 R = reflect(V, N); R.y = abs(R.y);',
          '  float fres = .04 + .96 * pow(1. - max(dot(-V, N), 0.), 5.);',
          '  vec3 c = mix(vec3(.02, .035, .07), sky(normalize(R)), .35 + fres * .55);',
          '  c += vec3(.5, .6, .8) * .025 * streak;',
          '  gl_FragColor = vec4(c, 1.);' + AM.GLTAIL + '}'].join('\n')
      }));
      lake.rotation.x = -Math.PI / 2; lake.position.set(LAKE.x, -0.02, LAKE.y); scene.add(lake);

      /* pines */
      var cone = function (r, h, y) { var g = new THREE.ConeGeometry(r, h, 7, 1); g.translate(0, y, 0); return g.toNonIndexed(); };
      var parts = [cone(0.55, 1.1, 0.75), cone(0.42, 0.9, 1.25), cone(0.28, 0.75, 1.7), new THREE.CylinderGeometry(0.06, 0.08, 0.4, 5).translate(0, 0.2, 0).toNonIndexed()];
      var total = 0; parts.forEach(function (g) { total += g.attributes.position.count; });
      var tpos = new Float32Array(total * 3), o = 0;
      parts.forEach(function (g) { tpos.set(g.attributes.position.array, o); o += g.attributes.position.array.length; });
      var treeGeo = new THREE.BufferGeometry(); treeGeo.setAttribute('position', new THREE.BufferAttribute(tpos, 3)); treeGeo.computeVertexNormals();
      var r = AM.seeded(1867), TN = Math.round(1300 * AM.TIER) + 200, tm = [];
      var M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), SC = new THREE.Vector3(), E = new THREE.Euler();
      var tries = 0;
      while (tm.length < TN && tries++ < TN * 20) {
        var ang = r() * Math.PI * 2, dist = LAKE_R + 1.5 + Math.pow(r(), 0.8) * 60;
        var x = LAKE.x + Math.cos(ang) * dist, z = LAKE.y + Math.sin(ang) * dist;
        if (Math.hypot(x - HOUSE.x, z - HOUSE.z) < 3.2) continue;          // clearing round the house
        if (z > -2 && x > -9 && x < 7 && z < 18) { if (r() > 0.08) continue; } // keep the camera's foreground open
        var s = 0.7 + r() * 1.2;
        E.set((r() - 0.5) * 0.08, r() * 6.28, (r() - 0.5) * 0.08); Q.setFromEuler(E);
        P.set(x, height(x, z) - 0.05, z); SC.set(s, s * (0.9 + r() * 0.5), s);
        M.compose(P, Q, SC); tm.push(M.clone());
      }
      var trees = new THREE.InstancedMesh(treeGeo, new THREE.MeshStandardMaterial({ color: '#10222c', roughness: 0.9, envMapIntensity: 0.3 }), tm.length);
      tm.forEach(function (m, i) { trees.setMatrixAt(i, m); });
      scene.add(trees);

      /* the house */
      var house = S.house = new THREE.Group(); house.position.copy(HOUSE); house.position.y = height(HOUSE.x, HOUSE.z); house.rotation.y = -0.35; scene.add(house);
      var wall = new THREE.MeshStandardMaterial({ color: '#3a2a36', roughness: 0.8 });
      var body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.05, 1.3), wall); body.position.y = 0.525; house.add(body);
      var rs = new THREE.Shape(); rs.moveTo(-1.02, 0); rs.lineTo(0, 0.72); rs.lineTo(1.02, 0); rs.lineTo(-1.02, 0);
      var roof = new THREE.Mesh(new THREE.ExtrudeGeometry(rs, { depth: 1.5, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: '#e3eaf8', roughness: 0.85 }));
      roof.position.set(0, 1.05, -0.75); house.add(roof);
      var chim = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.18), wall); chim.position.set(0.5, 1.5, -0.2); house.add(chim);
      S.windows = [];
      [[-0.55, 0.55], [0.0, 0.55], [0.55, 0.55], [-0.28, 0.2]].forEach(function (w, i) {
        var m = new THREE.Mesh(new THREE.PlaneGeometry(i === 3 ? 0.28 : 0.3, i === 3 ? 0.48 : 0.3), new THREE.MeshBasicMaterial({ color: '#1a1420' }));
        m.position.set(w[0], w[1] + (i === 3 ? 0.04 : 0), 0.651); house.add(m);
        var g = AM.glow('#ffb347', 1.1, 0); g.position.set(w[0], w[1], 0.8); house.add(g);
        S.windows.push({ m: m, g: g });
      });
      var warm = S.warm = new THREE.PointLight('#ffb347', 0, 7, 1.6); warm.position.set(0, 0.7, 1.2); house.add(warm);
      S.lit = C('#ffc766'); S.dark = C('#1a1420');

      /* lanterns: family members crossing the sky to the door */
      house.updateMatrixWorld(true); var door = new THREE.Vector3(); house.localToWorld(door.set(0, 0.9, 1.1));
      var starts = [[-26, 9, -38], [30, 11, -30], [-34, 7, 6], [22, 13, -52]];
      var ends = [[-0.45, 1.05, 0.25], [0.45, 1.25, 0.2], [-0.15, 1.5, 0.45], [0.2, 0.8, 0.5]];
      S.lanterns = starts.map(function (s, i) {
        var e = new THREE.Vector3(door.x + ends[i][0], door.y + ends[i][1] - 0.3, door.z + ends[i][2]);
        var st = new THREE.Vector3(s[0], s[1], s[2]);
        var mid = st.clone().lerp(e, 0.55); mid.y += 5 + i;
        var cv = new THREE.CatmullRomCurve3([st, mid, e]);
        var tr = AM.trail(cv, '#ffcf7a', 0.03, 120, 0.35); scene.add(tr);
        var g = AM.glow('#ffd18a', 1.4, 0); scene.add(g);
        var core = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff2d0' })); scene.add(core);
        return { cv: cv, tr: tr, g: g, core: core, t0: 0.08 + i * 0.1 };
      });

      /* the file: the plane lands and unfolds */
      var paper = S.paper = AM.makePaper({ ticks: 4, stamps: 3, fold: 1, glow: 0.35 });
      var ph = S.pholder = new THREE.Group(); ph.add(paper); scene.add(ph);
      S.pglow = AM.glow('#ffcc29', 1.6, 0); scene.add(S.pglow);
      S.landPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-14, 8, -24), new THREE.Vector3(-6, 5, -8), new THREE.Vector3(-1.2, 2.4, 0.2), new THREE.Vector3(0.3, 1.55, 1.3)
      ]);
      S.landTrail = AM.trail(S.landPath, '#ffcc29', 0.007, 160, 0.3); scene.add(S.landTrail);

      /* the maple-leaf constellation */
      var outline = leafOutline(), LC = new THREE.Vector3(6, 17, -46), LS = 12;
      var tgt = [], i2;
      for (i2 = 0; i2 < outline.length - 1; i2++) {
        var a = outline[i2], b = outline[i2 + 1], seg = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) * 26));
        for (var k = 0; k < seg; k++) { var tt = k / seg; tgt.push([AM.lerp(a[0], b[0], tt), AM.lerp(a[1], b[1], tt), k === 0 ? 1 : 0]); }
      }
      for (i2 = 0; i2 < 70; i2++) { // a sprinkle inside the leaf body
        var px = (r() - 0.5) * 0.7, py = r() * 0.85 + 0.05;
        if (Math.abs(px) < 0.33 - Math.abs(py - 0.45) * 0.3) tgt.push([px, py, 0]);
      }
      var LN = tgt.length, lp = new Float32Array(LN * 3), lt = new Float32Array(LN * 3), ls = new Float32Array(LN), lv = new Float32Array(LN);
      for (i2 = 0; i2 < LN; i2++) {
        var sv = new THREE.Vector3(r() - 0.5, 0.25 + r() * 0.6, -0.4 - r() * 0.8).normalize().multiplyScalar(60 + r() * 30);
        lp.set([sv.x, sv.y, sv.z], i2 * 3);
        lt.set([LC.x + tgt[i2][0] * LS, LC.y + (tgt[i2][1] - 0.4) * LS, LC.z], i2 * 3);
        ls[i2] = r(); lv[i2] = tgt[i2][2];
      }
      var lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
      lg.setAttribute('aTgt', new THREE.BufferAttribute(lt, 3));
      lg.setAttribute('aSeed', new THREE.BufferAttribute(ls, 1));
      lg.setAttribute('aVert', new THREE.BufferAttribute(lv, 1));
      var LU = S.LU = { uForm: { value: 0 }, uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uGlow: { value: 0 } };
      var leaf = new THREE.Points(lg, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: LU, fog: false,
        vertexShader: [
          'attribute vec3 aTgt; attribute float aSeed, aVert; uniform float uForm, uTime, uPR, uGlow; varying float vA, vR;',
          'void main(){',
          '  float k = smoothstep(aSeed * .45, aSeed * .45 + .55, uForm);',
          '  vec3 p = mix(position, aTgt, k);',
          '  p += vec3(sin(uTime * .5 + aSeed * 40.), cos(uTime * .4 + aSeed * 30.), 0.) * .06 * k;',
          '  vec4 mv = modelViewMatrix * vec4(p, 1.);',
          '  gl_Position = projectionMatrix * mv;',
          '  gl_PointSize = uPR * (2.6 + aVert * 5. + aSeed * 2.) * (1. + uGlow * .5) * (1. + .25 * sin(uTime * 2. + aSeed * 60.));',
          '  vA = .5 + .5 * k; vR = aVert;',
          '}'].join('\n'),
        fragmentShader: 'varying float vA, vR; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d); vec3 c = mix(vec3(1., .93, .78), vec3(1., .6, .5), vR * .5); gl_FragColor = vec4(c, a * vA); }'
      }));
      leaf.frustumCulled = false; scene.add(leaf);
      /* outline strokes, drawn on in order */
      var lineP = [], lineO = [];
      for (i2 = 0; i2 < outline.length - 1; i2++) {
        lineP.push(LC.x + outline[i2][0] * LS, LC.y + (outline[i2][1] - 0.4) * LS, LC.z, LC.x + outline[i2 + 1][0] * LS, LC.y + (outline[i2 + 1][1] - 0.4) * LS, LC.z);
        lineO.push(i2 / (outline.length - 1), (i2 + 1) / (outline.length - 1));
      }
      var llg = new THREE.BufferGeometry();
      llg.setAttribute('position', new THREE.Float32BufferAttribute(lineP, 3));
      llg.setAttribute('aO', new THREE.Float32BufferAttribute(lineO, 1));
      S.LLU = { uDraw: { value: 0 }, uOp: { value: 0 } };
      var lines = new THREE.LineSegments(llg, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: S.LLU, fog: false,
        vertexShader: 'attribute float aO; varying float vO; void main(){ vO = aO; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: 'uniform float uDraw, uOp; varying float vO; void main(){ float a = step(vO, uDraw) * uOp; gl_FragColor = vec4(1., .62, .5, a * .9); }'
      }));
      lines.frustumCulled = false; scene.add(lines);
      var red = S.redGlow = AM.glow('#d54d4d', 26, 0); red.position.copy(LC); red.material.fog = false; scene.add(red);

      /* light */
      scene.add(new THREE.HemisphereLight('#8ea8e8', '#141c33', 0.9));
      var moon = new THREE.DirectionalLight('#c9d8ff', 1.1); moon.position.set(-10, 14, 6); scene.add(moon);
      var aur = S.aurL = new THREE.DirectionalLight('#6fe0c8', 0.4); aur.position.set(0, 10, -20); scene.add(aur);
      var snowfall = S.snowfall = AM.motes(Math.round(1400 * AM.TIER) + 200, [30, 14, 30], '#e8eeff', 0.05, -1.6);
      snowfall.position.set(1, 6, -2); scene.add(snowfall);

      S.rigA = AM.rig({
        wide:     { pos: [-7.5, 2.6, 11.5], tgt: [1.5, 3.6, -4] },
        lanterns: { pos: [-2.6, 1.5, 6.2], tgt: [3.0, 1.9, -2.2] },
        door:     { pos: [1.5, 1.05, 2.9], tgt: [3.7, 0.95, -1.2] }
      }, [
        { p0: 0.28, p1: 0.38, keys: ['wide', 'lanterns'] },
        { p0: 0.6, p1: 0.7, keys: ['lanterns', 'door'] }
      ]);
      S.rigB = AM.rig({
        start: { pos: [-2.2, 1.6, 6.8], tgt: [1.5, 2.2, -3] },
        sheet: { pos: [0.34, 1.52, 2.75], tgt: [0.3, 1.5, 1.3] },
        sky:   { pos: [-0.5, 1.1, 6.5], tgt: [4.5, 14, -40] },
        final: { pos: [-8.5, 2.4, 14], tgt: [0.5, 6.5, -16] }
      }, [
        { p0: 0.02, p1: 0.12, keys: ['start', 'sheet'] },
        { p0: 0.3, p1: 0.42, keys: ['sheet', 'sky'] },
        { p0: 0.7, p1: 0.84, keys: ['sky', 'final'] }
      ]);
      S.cam = AM.camState(); S.v = new THREE.Vector3(); S.dir = new THREE.Vector3(); S.up = new THREE.Vector3(0, 1, 0);
      S.e = new THREE.Euler(); S.q = new THREE.Quaternion(); S.q2 = new THREE.Quaternion();
    },

    update: function (part, p, t) {
      var S = this, U = S.U, sm = AM.smooth, rg = AM.range, mo = AM.MOTION, i;
      var T = t * mo + 0.001, isA = part !== 'b';
      U.uTime.value = T; S.LU.uTime.value = T; S.snowfall.material.uniforms.uTime.value = T;

      /* lanterns + windows (part a); all lit in part b */
      var litCount = 0;
      for (i = 0; i < S.lanterns.length; i++) {
        var L = S.lanterns[i], k = isA ? sm(rg(p, L.t0, L.t0 + 0.16)) : 1;
        var arrived = isA ? sm(rg(p, L.t0 + 0.15, L.t0 + 0.2)) : 1;
        L.cv.getPointAt(Math.min(0.999, k), S.v);
        L.g.position.copy(S.v); L.core.position.copy(S.v);
        var on = isA ? (k > 0.001 ? 1 : 0) : 0;
        L.g.material.opacity = on * (0.75 - 0.45 * arrived) * (1 + Math.sin(T * 3 + i) * 0.1);
        L.core.visible = on > 0 && arrived < 0.98;
        L.tr.visible = isA && k > 0.001 && k < 0.999; L.tr.material.uniforms.uHead.value = k;
        var w = S.windows[i];
        w.m.material.color.copy(S.dark).lerp(S.lit, arrived);
        w.g.material.opacity = arrived * 0.55;
        litCount += arrived;
      }
      S.warm.intensity = litCount * 0.9;
      U.uAur.value = isA ? 0.55 + 0.3 * sm(rg(p, 0.5, 0.9)) : 0.8 - 0.35 * sm(rg(p, 0.36, 0.55)) + 0.3 * sm(rg(p, 0.75, 0.95));

      /* the file lands and unfolds (part b) */
      var land = isA ? 0 : rg(p, 0.0, 0.14), unfold = isA ? 0 : sm(rg(p, 0.12, 0.22));
      S.pholder.visible = !isA && p < 0.5;
      S.landTrail.visible = !isA && land > 0 && p < 0.3;
      S.landTrail.material.uniforms.uHead.value = sm(land);
      S.landTrail.material.uniforms.uOpacity.value = 1 - sm(rg(p, 0.18, 0.28));
      if (!isA) {
        var u = sm(land) * 0.999;
        S.landPath.getPointAt(u, S.pholder.position);
        S.pholder.position.y += Math.sin(T * 0.9) * 0.01 * unfold;
        S.landPath.getTangentAt(Math.min(0.999, u), S.dir);
        AM.orient(S.pholder, S.dir, S.up);          // flying pose
        S.q.copy(S.pholder.quaternion);
        S.e.set(0.05, 0.02, 0); S.q2.setFromEuler(S.e);  // upright, facing the camera
        S.pholder.quaternion.slerpQuaternions(S.q, S.q2, unfold);
        S.paper.setFold(1 - unfold);
        S.paper.setTex(4, p > 0.2 ? 4 : 3);
        S.pholder.scale.setScalar(AM.lerp(0.35, 0.62, unfold));
      }
      S.pglow.position.copy(S.pholder.position); S.pglow.position.z -= 0.3;
      S.pglow.material.opacity = !isA ? sm(rg(p, 0.2, 0.24)) * 0.25 * (1 - sm(rg(p, 0.34, 0.42))) : 0;

      /* the leaf (part b) */
      var form = isA ? 0 : sm(rg(p, 0.38, 0.64));
      S.LU.uForm.value = form;
      S.LU.uGlow.value = isA ? 0 : sm(rg(p, 0.62, 0.75));
      S.LLU.uDraw.value = isA ? 0 : sm(rg(p, 0.56, 0.7));
      S.LLU.uOp.value = isA ? 0 : 1;
      S.redGlow.material.opacity = isA ? 0 : sm(rg(p, 0.5, 0.7)) * 0.3;
      S.snowfall.material.uniforms.uOpacity.value = isA ? 0.8 : 0.8 - 0.5 * sm(rg(p, 0.35, 0.5));

      (isA ? S.rigA : S.rigB)(p, S.cam);
      AM.applyCam(S.camera, S.cam, 0.5);
      S.sky.position.copy(S.camera.position);
    }
  });
})();
