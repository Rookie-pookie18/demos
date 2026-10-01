/* SLOFFA shoe, built entirely in code.
   One builder makes all three models (low-top, slip-on, slide). Every part is its own group so the
   home page can pull them apart (the "expand") and the customiser can recolour them one by one.
   Units: the shoe is 2.9 long (x, toe at -x), sits on y = 0, width across z. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const SHOE_L = 2.9;
const HL = SHOE_L / 2;
const UPPER_Y = 0.5;              // where the upper's base sits (inside the midsole)
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// ── the last (the foot shape everything is built around); u runs -1 (toe) → 1 (heel) ──
const roundEnds = (u) => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 6)), 0.5);
const widthBase = (u) => 0.5 + 0.06 * Math.cos(Math.PI * (u + 0.4)) - 0.05 * Math.exp(-(((u - 0.2) / 0.25) ** 2));
const halfWidth = (u) => widthBase(u) * roundEnds(u);
const heightBase = (u) => 0.5 + 0.52 * ss(-0.75, 0.15, u) + 0.06 * ss(0.3, 0.9, u);
const boxiness = (u) => 0.75 - 0.4 * ss(-0.2, 0.6, u);   // lower = flatter top (heel is boxier than the toe)
// toe spring: the toe (and a little of the heel) curls up off the floor
const bend = (x) => 0.17 * Math.max(0, (-x / HL - 0.4) / 0.6) ** 2 + 0.04 * Math.max(0, (x / HL - 0.7) / 0.3) ** 2;

// the collar opening, an ellipse on top of the heel
const OPEN = { x: 0.74, a: 0.43, b: 0.27, y: 0.93 };

// height of the upper's outer surface at (x, z), in upper-local units (before UPPER_Y and bend)
function surfY(x, z) {
  const u = clamp(x / HL, -1, 1);
  const F = halfWidth(u) * 0.97;
  const c = F > 1e-4 ? clamp(z / F, -1, 1) : 1;
  return Math.pow(Math.sqrt(1 - c * c), boxiness(u)) * heightBase(u) * roundEnds(u);
}
const worldY = (x, y) => y + UPPER_Y + bend(x);

function footShape(scale) {
  const s = new THREE.Shape(), N = 90, pts = [];
  for (let i = 0; i <= N; i++) { const u = -1 + 2 * i / N; pts.push([u * HL * scale, halfWidth(u) * scale]); }
  for (let i = N - 1; i > 0; i--) { const u = -1 + 2 * i / N; pts.push([u * HL * scale, -halfWidth(u) * scale]); }
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}

// a flat slab of the foot shape, lying on the floor, with optional wavy "cloud pod" sidewalls
function footSlab(scale, depth, bevel, y0, wave = 0) {
  const g = new THREE.ExtrudeGeometry(footShape(scale), {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.7, bevelSegments: 6, curveSegments: 4, steps: 2,
  });
  g.rotateX(-Math.PI / 2);
  g.computeBoundingBox();
  const lo = g.boundingBox.min.y, hi = g.boundingBox.max.y;
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i); let y = p.getY(i), z = p.getZ(i);
    if (wave) {
      const f = (y - lo) / (hi - lo);
      const m = Math.sin(Math.PI * f);                                 // strongest at mid-height
      z *= 1 + wave * m * Math.sin(x * 7.5);
      p.setZ(i, z);
      y += wave * 0.6 * ss(0.55, 1, f) * Math.sin(x * 7.5 + 1.2);      // scalloped top edge, like stacked clouds
    }
    y = y - lo + y0;
    p.setY(i, y + bend(x));
  }
  g.computeVertexNormals();
  return g;
}

// the knit upper: a hand-rolled parametric shell over the last, with a sunken collar opening
function upperGeometry() {
  const NU = 120, NT = 56, pos = [], uv = [], col = [], idx = [];
  for (let i = 0; i <= NU; i++) {
    const u = -1 + 2 * i / NU, X = u * HL;
    const F = halfWidth(u) * 0.97, H = heightBase(u) * roundEnds(u), k = boxiness(u);
    for (let j = 0; j <= NT; j++) {
      const th = Math.PI * j / NT, Z = Math.cos(th) * F;
      let Y = Math.pow(Math.sin(th), k) * H;
      const e = ((X - OPEN.x) / OPEN.a) ** 2 + (Z / OPEN.b) ** 2;
      let shade = 1;
      if (e < 1) { Y = Math.min(Y, OPEN.y) - 0.32 * Math.sqrt(1 - e); shade = 0.16; }
      pos.push(X, worldY(X, Y), Z);
      uv.push((X + HL) / SHOE_L, Y / 1.0);           // side projection: the paint shows on both sides
      col.push(shade, shade, shade);
    }
  }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NT; j++) {
    const a = i * (NT + 1) + j, b = a + NT + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function surfaceNormal(x, z) {
  const d = 0.01;
  const p = (xx, zz) => new THREE.Vector3(xx, worldY(xx, surfY(xx, zz)), zz);
  const a = p(x, z), bx = p(x + d, z), bz = p(x, z + d);
  return new THREE.Vector3().subVectors(bz, a).cross(new THREE.Vector3().subVectors(bx, a)).normalize();
}

// x position of the back of the heel at a given (upper-local) height
function heelBackX(y) {
  for (let u = 1; u > 0; u -= 0.002) if (heightBase(u) * roundEnds(u) >= y) return u * HL;
  return HL * 0.9;
}

// ── paint: knit texture, the droop stripe and the heel text, projected from the side ──
const TEX_W = 1024, TEX_H = 512;
function droopPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(TEX_W * 0.33, TEX_H * 0.52);
  ctx.bezierCurveTo(TEX_W * 0.45, TEX_H * 0.86, TEX_W * 0.62, TEX_H * 0.9, TEX_W * 0.85, TEX_H * 0.5);
}
function paintUpper(canvas, mask, bump, colors, text, font) {
  const c = canvas.getContext('2d');
  c.fillStyle = colors.upper; c.fillRect(0, 0, TEX_W, TEX_H);
  // knit ribs
  c.globalAlpha = 0.09; c.fillStyle = '#000';
  for (let x = TEX_W * 0.06; x < TEX_W * 0.92; x += 7) c.fillRect(x, 0, 2, TEX_H);
  c.globalAlpha = 1;
  // the droop: a stripe that has clearly given up halfway
  c.lineCap = 'round'; c.lineJoin = 'round';
  droopPath(c); c.strokeStyle = colors.stripe; c.lineWidth = 46; c.stroke();
  droopPath(c); c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 46; c.setLineDash([2, 9]); c.stroke(); c.setLineDash([]);
  // heel text
  if (text) {
    c.save(); c.translate(TEX_W * 0.79, TEX_H * 0.36);
    c.fillStyle = colors.heel; c.font = `800 46px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, 0, 0); c.restore();
  }
  // canvas top = top of the shoe (CanvasTexture flips for us), so no extra flipping needed
  if (mask) {
    const m = mask.getContext('2d');
    m.fillStyle = '#000'; m.fillRect(0, 0, TEX_W, TEX_H);
    droopPath(m); m.strokeStyle = '#fff'; m.lineWidth = 46; m.lineCap = 'round'; m.stroke();
  }
  if (bump) {
    const b = bump.getContext('2d');
    b.fillStyle = '#808080'; b.fillRect(0, 0, TEX_W, TEX_H);
    b.fillStyle = '#5a5a5a';
    for (let x = TEX_W * 0.06; x < TEX_W * 0.92; x += 7) b.fillRect(x, 0, 2, TEX_H);
    b.lineCap = 'round'; droopPath(b); b.strokeStyle = '#a8a8a8'; b.lineWidth = 46; b.stroke();
  }
}
function paintInsole(colors, font) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 420;
  const c = cv.getContext('2d');
  c.fillStyle = '#FBF7EF'; c.fillRect(0, 0, cv.width, cv.height);
  c.fillStyle = colors.heel; c.font = `800 64px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.save(); c.translate(cv.width * 0.72, cv.height / 2); c.rotate(Math.PI / 2); c.fillText('SLOFFA', 0, 0); c.restore();
  c.globalAlpha = 0.5; c.font = `700 28px ${font}`;
  c.save(); c.translate(cv.width * 0.3, cv.height / 2); c.rotate(Math.PI / 2); c.fillText('z  z  z', 0, 0); c.restore();
  return cv;
}

// ── builder ─────────────────────────────────────────────────────
export function buildShoe({ type = 'lowtop', colors, text = '', font = '"Bricolage Grotesque", system-ui, sans-serif' } = {}) {
  colors = { ...colors };
  const root = new THREE.Group();
  const parts = {};
  const groups = {};
  const mk = (name) => { const g = new THREE.Group(); g.name = name; groups[name] = g; root.add(g); return g; };
  const add = (group, geo, mat, part) => {
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; m.userData.part = part;
    group.add(m); return m;
  };

  const M = {
    midsole: new THREE.MeshStandardMaterial({ color: colors.midsole, roughness: 0.72 }),
    outsole: new THREE.MeshStandardMaterial({ color: colors.outsole, roughness: 0.55 }),
    laces: new THREE.MeshPhysicalMaterial({ color: colors.laces, roughness: 0.8, sheen: 0.6, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffffff') }),
    tongue: new THREE.MeshPhysicalMaterial({ color: colors.tongue, roughness: 0.85, sheen: 0.7, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff') }),
    heel: new THREE.MeshStandardMaterial({ color: colors.heel, roughness: 0.5 }),
    collar: new THREE.MeshPhysicalMaterial({ color: colors.upper, roughness: 0.85, sheen: 0.7, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff') }),
    eyelet: new THREE.MeshStandardMaterial({ color: '#FBF7EF', roughness: 0.4, metalness: 0.1 }),
  };

  // painted upper
  const cv = document.createElement('canvas'); cv.width = TEX_W; cv.height = TEX_H;
  const mask = document.createElement('canvas'); mask.width = TEX_W; mask.height = TEX_H;
  const bcv = document.createElement('canvas'); bcv.width = TEX_W; bcv.height = TEX_H;
  paintUpper(cv, mask, bcv, colors, text, font);
  const upTex = new THREE.CanvasTexture(cv); upTex.colorSpace = THREE.SRGBColorSpace; upTex.anisotropy = 4;
  const bumpTex = new THREE.CanvasTexture(bcv);
  M.upper = new THREE.MeshPhysicalMaterial({
    map: upTex, bumpMap: bumpTex, bumpScale: 1.2, vertexColors: true, roughness: 0.9,
    sheen: 0.6, sheenRoughness: 0.55, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide,
  });
  const maskData = mask.getContext('2d').getImageData(0, 0, TEX_W, TEX_H).data;

  // ── outsole, midsole, insole
  const gOut = mk('outsole');
  add(gOut, footSlab(1.05, 0.07, 0.035, 0, 0.03), M.outsole, 'outsole');
  const gMid = mk('midsole');
  const slide = type === 'slide';
  add(gMid, footSlab(1.03, slide ? 0.36 : 0.24, 0.11, 0.11, 0.075), M.midsole, 'midsole');
  const gIns = mk('insole');
  const insTex = new THREE.CanvasTexture(paintInsole(colors, font)); insTex.colorSpace = THREE.SRGBColorSpace;
  insTex.repeat.set(1 / (SHOE_L * 0.94), 1 / 1.2); insTex.offset.set(0.5, 0.5);
  M.insole = new THREE.MeshStandardMaterial({ color: '#ffffff', map: insTex, roughness: 0.9 });
  add(gIns, footSlab(0.93, 0.025, 0.012, slide ? 0.68 : 0.585, 0), M.insole, 'midsole');

  // ── upper (shell + collar + heel tab + eyelets)
  const gUp = mk('upper');
  if (!slide) {
    const shell = add(gUp, upperGeometry(), M.upper, 'upper');
    shell.userData.maskData = maskData;
    // padded collar: a fat tube around the opening
    const pts = [];
    for (let i = 0; i < 64; i++) {
      const t = (i / 64) * Math.PI * 2;
      const x = OPEN.x + Math.cos(t) * OPEN.a, z = Math.sin(t) * OPEN.b;
      pts.push(new THREE.Vector3(x, worldY(x, Math.min(OPEN.y, surfY(x, z)) - 0.01), z));
    }
    add(gUp, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, 0.1, 14, true), M.collar, 'upper');
    // heel pull tab
    const hx = heelBackX(0.9);
    const tab = add(gUp, new THREE.TorusGeometry(0.13, 0.05, 10, 24, Math.PI), M.heel, 'heel');
    tab.scale.set(0.8, 1.15, 1.6);
    tab.position.set(hx - 0.06, worldY(hx, 0.9), 0); tab.rotation.z = -0.35;
  }

  // ── tongue, laces / straps / slide strap
  const gTongue = mk('tongue');
  const gLaces = mk('laces');
  const TONGUE = { x: -0.08, len: 1.1 };
  TONGUE.rot = Math.atan2(surfY(0.38, 0) - surfY(-0.6, 0), 0.98) + 0.16;
  TONGUE.y = surfY(TONGUE.x, 0) + 0.04;
  const tongueTop = (x) => TONGUE.y + (x - TONGUE.x) * Math.tan(TONGUE.rot) + 0.075;

  if (type === 'lowtop') {
    const tg = add(gTongue, new RoundedBoxGeometry(TONGUE.len, 0.15, 0.56, 4, 0.07), M.tongue, 'tongue');
    tg.position.set(TONGUE.x, worldY(TONGUE.x, TONGUE.y), 0); tg.rotation.z = TONGUE.rot;
    // a little SLOFFA "z" on the tongue
    const rows = [-0.6, -0.43, -0.26, -0.09, 0.08];
    rows.forEach((x, i) => {
      const pts = [];
      for (let k = 0; k <= 12; k++) {
        const z = -0.27 + 0.54 * k / 12;
        const edge = ss(0.16, 0.28, Math.abs(z));
        const y = Math.max(surfY(x, z) + 0.035, (1 - edge) * (tongueTop(x) + 0.03) + edge * (surfY(x, z) + 0.035));
        pts.push(new THREE.Vector3(x, worldY(x, y), z));
      }
      add(gLaces, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.047, 10), M.laces, 'laces');
      // eyelets on both sides
      for (const z of [-0.27, 0.27]) {
        const ey = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 8, 20), M.eyelet);
        const p = new THREE.Vector3(x, worldY(x, surfY(x, z)), z);
        ey.position.copy(p); ey.lookAt(p.clone().add(surfaceNormal(x, z)));
        ey.userData.part = 'upper'; gUp.add(ey);
      }
      if (i === rows.length - 1) {
        // the bow, tied once, never again
        const top = new THREE.Vector3(x, worldY(x, tongueTop(x) + 0.05), 0);
        const knot = add(gLaces, new THREE.SphereGeometry(0.065, 16, 12), M.laces, 'laces'); knot.position.copy(top);
        for (const s of [-1, 1]) {
          const loop = add(gLaces, new THREE.TorusGeometry(0.15, 0.04, 10, 28), M.laces, 'laces');
          loop.scale.set(1, 0.62, 1);
          loop.position.copy(top).add(new THREE.Vector3(-0.02, 0.06, s * 0.17));
          loop.rotation.set(Math.PI / 2 - 0.5, s * 0.25, 0); loop.rotateX(s * -0.0);
          const end = [top.clone(), top.clone().add(new THREE.Vector3(-0.05, -0.02, s * 0.2)), top.clone().add(new THREE.Vector3(-0.12, -0.2, s * 0.36)), top.clone().add(new THREE.Vector3(-0.2, -0.36, s * 0.42))];
          add(gLaces, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(end), 24, 0.038, 8), M.laces, 'laces');
        }
      }
    });
  } else if (type === 'slipon') {
    // two fat elastic straps instead of laces
    [-0.5, -0.18].forEach((x) => {
      const pts = [];
      for (let k = 0; k <= 14; k++) { const z = -0.42 + 0.84 * k / 14; pts.push(new THREE.Vector3(x, worldY(x, surfY(x, z) + 0.03), z)); }
      const strap = add(gLaces, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.06, 10), M.laces, 'laces');
      strap.scale.x = 1;
    });
  } else {
    // slide: one puffy strap over the forefoot
    const x0 = -0.42, top = 0.68 + 0.42, pts = [];
    for (let k = 0; k <= 16; k++) {
      const t = k / 16, a = Math.PI * t, z = Math.cos(a) * 0.62;
      pts.push(new THREE.Vector3(x0, 0.68 + Math.sin(a) * (top - 0.68) + bend(x0), z));
    }
    const strap = add(gUp, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.17, 18), M.collar, 'upper');
    strap.scale.set(1, 1, 1);
    strap.geometry.translate(-x0, 0, 0); strap.geometry.scale(2.6, 1, 1); strap.geometry.translate(x0, 0, 0);
  }

  // ── API
  const repaint = () => {
    paintUpper(cv, mask, null, colors, text, font);
    upTex.needsUpdate = true;
    shellMask();
  };
  function shellMask() {
    const d = mask.getContext('2d').getImageData(0, 0, TEX_W, TEX_H).data;
    root.traverse((o) => { if (o.userData.maskData) o.userData.maskData = d; });
  }
  function setColor(part, hex) {
    colors[part] = hex;
    if (part === 'upper') { M.collar.color.set(hex); repaint(); }
    else if (part === 'stripe') repaint();
    else if (part === 'heel') { M.heel.color.set(hex); repaint(); }
    else if (M[part]) M[part].color.set(hex);
  }
  function setColors(all) { for (const k in all) colors[k] = all[k]; for (const k of ['midsole', 'outsole', 'laces', 'tongue', 'heel']) M[k].color.set(colors[k]); M.collar.color.set(colors.upper); repaint(); }
  function setText(t) { text = t; repaint(); }
  // which customisable part a raycast hit belongs to (the stripe is painted on, so check the mask)
  function partAt(hit) {
    const o = hit.object;
    if (o.userData.maskData && hit.uv) {
      const x = Math.floor(clamp(hit.uv.x) * (TEX_W - 1)), y = Math.floor((1 - clamp(hit.uv.y)) * (TEX_H - 1));
      if (o.userData.maskData[(y * TEX_W + x) * 4] > 128) return 'stripe';
    }
    return o.userData.part;
  }
  // explode offsets (how far each layer travels up when the shoe comes apart)
  const EXPLODE = { laces: 2.55, tongue: 1.95, upper: 1.25, insole: 0.62, midsole: 0, outsole: -0.62 };
  function explode(t) { for (const k in EXPLODE) if (groups[k]) groups[k].position.y = EXPLODE[k] * t; }
  // anchor points for labels, one per layer (local to root, before explode)
  const ANCHORS = {
    laces: new THREE.Vector3(0.1, 1.3, 0.2), tongue: new THREE.Vector3(-0.5, 1.0, 0.2), upper: new THREE.Vector3(1.1, 0.9, 0.3),
    insole: new THREE.Vector3(-1.0, 0.62, 0.2), midsole: new THREE.Vector3(1.2, 0.35, 0.4), outsole: new THREE.Vector3(-1.0, 0.1, 0.4),
  };
  function anchor(k, t, target) { return target.copy(ANCHORS[k]).setY(ANCHORS[k].y + EXPLODE[k] * t); }

  return { root, groups, materials: M, colors, setColor, setColors, setText, partAt, explode, anchor, EXPLODE };
}
