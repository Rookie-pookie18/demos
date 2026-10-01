/* The SLOFFA shoebox, built in code: long and low (33 × 20 × 12 cm proportions), a separate lid
   that overhangs the base and covers its top third, thumb notches in the lid skirt, raw cardboard
   edges, a size label on the end, and highlighter tissue paper that folds open. */
import * as THREE from 'three';

export const BOX = { W: 3.7, D: 2.3, H: 1.36, t: 0.04 };
const GAP = 0.006;                    // lid skirt clearance
const BLUE = '#3D5AFE', CREAM = '#F4EEE2', HI = '#E8FF4F', TOMATO = '#FF5A36', INK = '#1C1A17';
const KRAFT = '#C8A473', INSIDE = '#E2D3B8';

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

// printed board: flat colour, faint fibre flecks, and a raw-cardboard rim where the print stops
function board(ctx, w, h, color, rim = 0) {
  ctx.fillStyle = color; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h / 900; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1);
  }
  if (rim) { ctx.strokeStyle = KRAFT; ctx.lineWidth = rim; ctx.strokeRect(rim / 2, rim / 2, w - rim, h - rim); }
}
function zzz(ctx, w, h, color, font, n = 26) {
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) {
    ctx.save(); ctx.translate(rnd() * w, rnd() * h); ctx.rotate((rnd() - 0.5) * 0.8);
    ctx.font = `800 ${Math.round(h * (0.05 + rnd() * 0.06))}px ${font}`; ctx.fillText('z', 0, 0); ctx.restore();
  }
}

function paintLid(w, h, font, mono) {
  const [c, x] = canvas(w, h);
  board(x, w, h, BLUE, w * 0.012);
  zzz(x, w, h, 'rgba(255,255,255,.07)', font, 40);
  x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  x.fillStyle = CREAM; x.font = `800 ${Math.round(h * 0.34)}px ${font}`;
  x.fillText('SLOFFA', w * 0.07, h * 0.56);
  x.fillStyle = HI; x.font = `800 ${Math.round(h * 0.13)}px ${font}`;
  x.fillText("DON'T DO IT.", w * 0.075, h * 0.76);
  x.fillStyle = 'rgba(244,238,226,.75)'; x.font = `700 ${Math.round(h * 0.035)}px ${mono}`;
  x.fillText('001 · THE SNOOZE · HANDLE WITH NO EFFORT', w * 0.078, h * 0.88);
  // sticker
  x.save(); x.translate(w * 0.82, h * 0.3); x.rotate(0.22);
  const r = h * 0.17;
  x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.arc(6, 8, r, 0, Math.PI * 2); x.fill();
  x.fillStyle = TOMATO; x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
  x.strokeStyle = CREAM; x.lineWidth = r * 0.05; x.setLineDash([r * 0.08, r * 0.06]);
  x.beginPath(); x.arc(0, 0, r * 0.86, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
  x.fillStyle = CREAM; x.textAlign = 'center';
  x.font = `700 ${Math.round(r * 0.2)}px ${mono}`; x.fillText('FRAGILE:', 0, -r * 0.28);
  x.font = `800 ${Math.round(r * 0.3)}px ${font}`; x.fillText('CONTAINS', 0, r * 0.08); x.fillText('NAPS', 0, r * 0.42);
  x.restore();
  return c;
}
function paintSkirt(w, h, font, mono) {
  const [c, x] = canvas(w, h);
  board(x, w, h, BLUE, h * 0.03);
  x.fillStyle = CREAM; x.font = `700 ${Math.round(h * 0.26)}px ${mono}`; x.textBaseline = 'middle'; x.textAlign = 'left';
  const s = "SLOFFA — DON'T DO IT — ";
  const sw = x.measureText(s).width;
  for (let px = -sw * 0.3; px < w; px += sw) x.fillText(s, px, h * 0.5);
  return c;
}
function paintBaseSide(w, h, font, mono) {
  const [c, x] = canvas(w, h);
  board(x, w, h, BLUE, h * 0.02);
  zzz(x, w, h, 'rgba(255,255,255,.07)', font, 18);
  x.fillStyle = CREAM; x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  x.font = `800 ${Math.round(h * 0.2)}px ${font}`; x.fillText('the laziest shoe', w * 0.05, h * 0.52);
  x.fillText('you will ever own.', w * 0.05, h * 0.72);
  x.fillStyle = HI; x.font = `700 ${Math.round(h * 0.06)}px ${mono}`; x.fillText('PROBABLY. WE COULDN\'T BE BOTHERED TO CHECK.', w * 0.05, h * 0.86);
  return c;
}
function paintEnd(w, h, font, mono) {
  const [c, x] = canvas(w, h);
  board(x, w, h, BLUE, h * 0.02);
  // white size label
  const lw = w * 0.62, lh = h * 0.42, lx = (w - lw) / 2, ly = h * 0.36;
  x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(lx + 5, ly + 6, lw, lh);
  x.fillStyle = '#FBF9F4'; x.fillRect(lx, ly, lw, lh);
  x.fillStyle = INK; x.textAlign = 'left'; x.textBaseline = 'alphabetic';
  x.font = `800 ${Math.round(lh * 0.17)}px ${font}`; x.fillText('SLOFFA · THE SNOOZE', lx + lw * 0.05, ly + lh * 0.22);
  x.font = `700 ${Math.round(lh * 0.09)}px ${mono}`;
  x.fillText('SIZE UK 9   COLOUR: NAP PINK', lx + lw * 0.05, ly + lh * 0.4);
  x.fillText('STYLE DNDI-01   EFFORT: NONE', lx + lw * 0.05, ly + lh * 0.54);
  // barcode
  let bx = lx + lw * 0.05; const by = ly + lh * 0.64, bh = lh * 0.26;
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  while (bx < lx + lw * 0.62) { const bw = 1 + Math.floor(rnd() * 4); x.fillRect(bx, by, bw * 1.6, bh); bx += bw * 1.6 + 2 + rnd() * 4; }
  x.font = `800 ${Math.round(lh * 0.3)}px ${font}`; x.textAlign = 'right'; x.fillStyle = TOMATO;
  x.fillText('9', lx + lw * 0.94, ly + lh * 0.9);
  return c;
}
function paintPlainEnd(w, h, font) {
  const [c, x] = canvas(w, h);
  board(x, w, h, BLUE, h * 0.02);
  x.fillStyle = CREAM; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `800 ${Math.round(h * 0.3)}px ${font}`; x.fillText('zzz', w / 2, h * 0.55);
  return c;
}

function crumple(geo, amp) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const n = Math.sin(x * 6.1 + y * 2.3) * 0.5 + Math.sin(x * 13.7 - y * 7.9) * 0.3 + Math.sin(x * 2.1 + y * 11.3) * 0.2;
    p.setZ(i, p.getZ(i) + n * amp);
  }
  geo.computeVertexNormals();
}

export function buildBox({ font = '"Bricolage Grotesque", sans-serif', mono = '"Space Mono", monospace' } = {}) {
  const { W, D, H, t } = BOX;
  const root = new THREE.Group();
  const base = new THREE.Group(); root.add(base);
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.82, ...o });
  const kraft = std({ color: KRAFT, roughness: 0.95 });
  const inside = std({ color: INSIDE, roughness: 0.95 });

  const sideTex = tex(paintBaseSide(1600, Math.round(1600 * H / W), font, mono));
  const endTex = tex(paintEnd(1100, Math.round(1100 * H / D), font, mono));
  const endPlain = tex(paintPlainEnd(800, Math.round(800 * H / D), font));
  const pSide = std({ map: sideTex }), pEnd = std({ map: endTex }), pEndPlain = std({ map: endPlain });
  const wall = (w, h, d, mats, pos) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
    m.position.set(...pos); m.castShadow = m.receiveShadow = true; base.add(m); return m;
  };
  // BoxGeometry material order: +x, -x, +y, -y, +z, -z
  wall(W, t, D, [kraft, kraft, inside, kraft, kraft, kraft], [0, t / 2, 0]);
  wall(W, H, t, [kraft, kraft, kraft, kraft, pSide, inside], [0, H / 2, D / 2 - t / 2]);
  wall(W, H, t, [kraft, kraft, kraft, kraft, inside, pSide], [0, H / 2, -D / 2 + t / 2]);
  wall(t, H, D - 2 * t, [pEnd, inside, kraft, kraft, kraft, kraft], [W / 2 - t / 2, H / 2, 0]);
  wall(t, H, D - 2 * t, [inside, pEndPlain, kraft, kraft, kraft, kraft], [-W / 2 + t / 2, H / 2, 0]);

  // ── lid
  const lid = new THREE.Group(); root.add(lid);
  const lidBody = new THREE.Group(); lid.add(lidBody);
  const o = GAP + t, LW = W + 2 * o, LD = D + 2 * o, hs = H / 3;
  const lidTex = tex(paintLid(2048, Math.round(2048 * LD / LW), font, mono));
  const top = new THREE.Mesh(new THREE.BoxGeometry(LW, t, LD), [kraft, kraft, std({ map: lidTex }), inside, kraft, kraft]);
  top.castShadow = top.receiveShadow = true; lidBody.add(top);
  // long skirts, each with a half-moon thumb notch
  const skTex = tex(paintSkirt(2048, Math.round(2048 * hs / LW), font, mono));
  skTex.repeat.set(1 / LW, 1 / hs); skTex.offset.set(0.5, 1);
  const shape = new THREE.Shape(), r = 0.2;
  shape.moveTo(-LW / 2, -hs); shape.lineTo(-r, -hs); shape.absarc(0, -hs, r, Math.PI, 0, true);
  shape.lineTo(LW / 2, -hs); shape.lineTo(LW / 2, t / 2); shape.lineTo(-LW / 2, t / 2); shape.closePath();
  const skGeo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 24 });
  const skMat = [std({ map: skTex }), kraft];
  for (const s of [1, -1]) {
    const m = new THREE.Mesh(skGeo, skMat); m.castShadow = m.receiveShadow = true;
    if (s > 0) m.position.z = D / 2 + GAP; else { m.rotation.y = Math.PI; m.position.z = -D / 2 - GAP; }
    lidBody.add(m);
  }
  const ssTex = tex(paintSkirt(1024, Math.round(1024 * hs / LD), font, mono));
  const ssMat = std({ map: ssTex });
  for (const s of [1, -1]) {
    const mats = s > 0 ? [ssMat, inside, kraft, kraft, kraft, kraft] : [inside, ssMat, kraft, kraft, kraft, kraft];
    const m = new THREE.Mesh(new THREE.BoxGeometry(t, hs + t / 2, LD), mats);
    m.position.set(s * (W / 2 + GAP + t / 2), -hs / 2 + t / 4, 0); m.castShadow = m.receiveShadow = true;
    lidBody.add(m);
  }
  const LID_Y = H + t / 2;
  lid.position.y = LID_Y;

  // ── tissue: two crumpled flaps hinged on the long walls
  const tissueMat = new THREE.MeshStandardMaterial({ color: HI, roughness: 1, side: THREE.DoubleSide, emissive: HI, emissiveIntensity: 0.08 });
  const flaps = [];
  for (const s of [1, -1]) {
    const hinge = new THREE.Group(); hinge.position.set(0, H - 0.02, s * (D / 2 - t)); base.add(hinge);
    const len = D / 2 + 0.06;
    const g = new THREE.PlaneGeometry(W - 0.14, len, 48, 14);
    g.translate(0, -len / 2, 0); crumple(g, 0.028);
    g.rotateX(s > 0 ? Math.PI / 2 : -Math.PI / 2);     // lie flat, pointing inward from the hinge
    const m = new THREE.Mesh(g, tissueMat); m.castShadow = true; m.receiveShadow = true;
    hinge.add(m); flaps.push({ hinge, s });
  }

  // a warm glow inside the box that comes on as the lid lifts
  const glow = new THREE.PointLight('#FFE38A', 0, 6, 1.5); glow.position.set(0, H * 0.7, 0); base.add(glow);

  const lerp = (a, b, k) => a + (b - a) * k;
  function setLid(k, peek = 0) {
    const p = peek * (1 - k);
    lid.position.set(lerp(0, 1.4, k), LID_Y + p * 0.24 + k * 5.2, lerp(0, -1.6, k));
    lid.visible = k < 0.995;           // once it has left the frame, it stays gone
    lid.rotation.set(-k * 0.95 - p * 0.04, 0, k * 0.42 + p * 0.06);
    glow.intensity = Math.min(1, k * 3 + p) * 2.2;
  }
  function setTissue(k) {
    // closed: flat with a little sag; open: folded back out over the walls
    for (const f of flaps) f.hinge.rotation.x = f.s * lerp(-0.03, Math.PI + 0.32, k);
  }
  setLid(0); setTissue(0);
  return { root, base, lid, flaps, setLid, setTissue, glow };
}
