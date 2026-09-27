/* The 3D caddy: one tin that travels down the page, plus drifting rose petals.
   Everything visual here is built in code: lathe-turned metal, a canvas-painted label
   with gold foil (separate roughness/metalness), studio lighting from a room environment. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TEAS } from './data.js';

const FOIL = '#D9B56E';
const TIN_H = 1.97;

// ── label painting ──────────────────────────────────────────────
function splitName(name) {
  const w = name.split(' ');
  if (w.length === 1) return [name];
  const cut = w.length > 2 ? 2 : 1;
  return [w.slice(0, cut).join(' '), w.slice(cut).join(' ')];
}
function emblem(ctx, cx, cy, r) {
  ctx.save(); ctx.translate(cx, cy); ctx.lineWidth = r * 0.07; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    ctx.save(); ctx.rotate((i / 5) * Math.PI * 2);
    ctx.beginPath(); ctx.moveTo(0, -r * 0.12);
    ctx.bezierCurveTo(r * 0.42, -r * 0.35, r * 0.28, -r * 0.82, 0, -r * 0.7);
    ctx.bezierCurveTo(-r * 0.28, -r * 0.82, -r * 0.42, -r * 0.35, 0, -r * 0.12);
    ctx.stroke(); ctx.restore();
  }
  ctx.beginPath(); ctx.arc(0, 0, r * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function paintLabel(tea, W, H) {
  const col = document.createElement('canvas'); col.width = W; col.height = H;
  const orm = document.createElement('canvas'); orm.width = W; orm.height = H;
  const c = col.getContext('2d'), o = orm.getContext('2d');
  const PAPER = 'rgb(0,205,0)', METAL = 'rgb(0,70,255)';
  // paper with a little fibre
  c.fillStyle = tea.paper; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 2200; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`; c.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1 + Math.random() * 14); }
  o.fillStyle = PAPER; o.fillRect(0, 0, W, H);
  // helper: draw on both canvases; foil goes metal in ORM
  const both = (fn, foil) => { c.save(); o.save(); c.fillStyle = c.strokeStyle = foil ? FOIL : fn.ink || tea.accent; o.fillStyle = o.strokeStyle = foil ? METAL : PAPER; fn(c); if (foil) fn(o); c.restore(); o.restore(); };
  const cx = W / 2, s = H / 584;
  // foil rules top and bottom
  both((x) => { x.fillRect(0, 22 * s, W, 5 * s); x.fillRect(0, 36 * s, W, 2 * s); x.fillRect(0, H - 27 * s, W, 5 * s); x.fillRect(0, H - 38 * s, W, 2 * s); }, true);
  // front panel
  both((x) => emblem(x, cx, 112 * s, 44 * s), true);
  both((x) => { x.font = `600 ${27 * s}px "Inter Tight", sans-serif`; x.textAlign = 'center'; x.letterSpacing = `${14 * s}px`; x.fillText('ITTARBAGH', cx + 7 * s, 202 * s); }, true);
  const lines = splitName(tea.name);
  const fs = (lines.some((l) => l.length > 9) ? 86 : 100) * s;
  c.save(); c.fillStyle = tea.accent; c.font = `italic 400 ${fs}px "Bodoni Moda", serif`; c.textAlign = 'center';
  if (lines.length === 1) c.fillText(lines[0], cx, 360 * s);
  else { c.fillText(lines[0], cx, 318 * s); c.fillText(lines[1], cx, 318 * s + fs * 0.98); }
  c.restore();
  both((x) => { x.fillRect(cx - 70 * s, 452 * s, 140 * s, 2 * s); }, true);
  both((x) => { x.font = `600 ${21 * s}px "Inter Tight", sans-serif`; x.textAlign = 'center'; x.letterSpacing = `${8 * s}px`; x.fillText(tea.kind.toUpperCase() + ' · 100 G', cx + 4 * s, 500 * s); }, true);
  // side panels: brew guide (right), inside (left), maker's line (back)
  const side = (px, title, rows) => {
    both((x) => { x.font = `600 ${17 * s}px "Inter Tight", sans-serif`; x.textAlign = 'center'; x.letterSpacing = `${6 * s}px`; x.fillText(title, px, 150 * s); }, true);
    c.save(); c.fillStyle = tea.accent; c.globalAlpha = 0.85; c.textAlign = 'center';
    rows.forEach((r, i) => { c.font = `italic 400 ${34 * s}px "Bodoni Moda", serif`; c.fillText(r[0], px, (225 + i * 78) * s); c.font = `500 ${16 * s}px "Inter Tight", sans-serif`; c.globalAlpha = 0.6; c.fillText(r[1], px, (252 + i * 78) * s); c.globalAlpha = 0.85; });
    c.restore();
  };
  side(cx + W * 0.25, 'TO BREW', tea.brew.slice(0, 4));
  side(cx - W * 0.25, 'INSIDE', tea.inside.slice(0, 4).map((r) => [r[1], r[0].length > 26 ? r[0].slice(0, 24) + '…' : r[0]]));
  both((x) => { x.font = `italic 400 ${30 * s}px "Bodoni Moda", serif`; x.textAlign = 'center'; x.fillText('Petals, not perfume.', 0, 300 * s); x.fillText('Petals, not perfume.', W, 300 * s); }, true);
  c.save(); c.fillStyle = tea.accent; c.globalAlpha = 0.55; c.font = `500 ${15 * s}px "Inter Tight", sans-serif`; c.textAlign = 'center';
  ['Blended in Kolkata', 'with rose from Kannauj'].forEach((t, i) => { c.fillText(t, 0 + 150 * s, (350 + i * 24) * s); c.fillText(t, W - 150 * s, (350 + i * 24) * s); });
  c.restore();
  return { col, orm };
}

// ── geometry ────────────────────────────────────────────────────
function lathe(pts, seg) { return new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg); }
function tinGeometry(seg) {
  const body = lathe([[0, 0], [0.56, 0], [0.605, 0.012], [0.622, 0.04], [0.618, 0.07], [0.62, 0.1], [0.62, 1.52], [0.605, 1.54], [0.6, 1.56]], seg);
  const lid = lathe([[0.59, 1.47], [0.638, 1.49], [0.645, 1.52], [0.645, 1.9], [0.636, 1.935], [0.61, 1.955], [0.56, 1.965], [0.2, 1.972], [0, 1.974]], seg);
  const bead = new THREE.TorusGeometry(0.646, 0.012, 8, seg); bead.rotateX(Math.PI / 2); bead.translate(0, 1.49, 0);
  const bead2 = new THREE.TorusGeometry(0.622, 0.01, 8, seg); bead2.rotateX(Math.PI / 2); bead2.translate(0, 0.1, 0);
  const label = new THREE.CylinderGeometry(0.6245, 0.6245, 1.16, seg, 1, true, Math.PI, Math.PI * 2); label.translate(0, 0.78, 0);
  [body, lid, bead, bead2, label].forEach((g) => g.translate(0, -TIN_H / 2, 0));
  return { body, lid, bead, bead2, label };
}

// ── petals ──────────────────────────────────────────────────────
function petalTexture() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 160; const x = cv.getContext('2d');
  const g = x.createRadialGradient(64, 120, 6, 64, 90, 90); g.addColorStop(0, '#5C0717'); g.addColorStop(0.55, '#B3173C'); g.addColorStop(1, '#E6718E');
  x.fillStyle = g; x.beginPath(); x.moveTo(64, 156); x.bezierCurveTo(-10, 110, 6, 18, 64, 6); x.bezierCurveTo(122, 18, 138, 110, 64, 156); x.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function petalGeometry() {
  const g = new THREE.PlaneGeometry(0.22, 0.28, 6, 6), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) / 0.11, y = p.getY(i) / 0.14; p.setZ(i, 0.05 * x * x - 0.03 * y * y); }
  g.computeVertexNormals(); return g;
}

// ── stage ───────────────────────────────────────────────────────
export async function createStage(canvas, { mobile = false, reduced = false } = {}) {
  await Promise.all([
    document.fonts.load('italic 400 80px "Bodoni Moda"'),
    document.fonts.load('600 24px "Inter Tight"'),
    document.fonts.load('500 16px "Inter Tight"')
  ]).catch(() => {});

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50); camera.position.set(0, 0, 10);

  const key = new THREE.DirectionalLight('#FFE7D2', 2.4); key.position.set(-4, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight('#FF8FB0', 3.2); rim.position.set(5, 2, -4); scene.add(rim);
  const rim2 = new THREE.DirectionalLight('#FFD9A8', 1.4); rim2.position.set(-5, -1, -3); scene.add(rim2);
  scene.add(new THREE.AmbientLight('#3A1A22', 0.6));

  // tin
  const G = tinGeometry(mobile ? 72 : 128);
  const metal = new THREE.MeshPhysicalMaterial({ color: TEAS[0].tin, metalness: 0.88, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 });
  const gold = new THREE.MeshPhysicalMaterial({ color: '#C9A15A', metalness: 1, roughness: 0.22, clearcoat: 0.6 });
  const labelMat = new THREE.MeshPhysicalMaterial({ roughness: 1, metalness: 1, clearcoat: 0.25, clearcoatRoughness: 0.35 });
  const tin = new THREE.Group();
  tin.add(new THREE.Mesh(G.body, metal), new THREE.Mesh(G.lid, metal), new THREE.Mesh(G.bead, gold), new THREE.Mesh(G.bead2, gold), new THREE.Mesh(G.label, labelMat));
  const holder = new THREE.Group(); holder.add(tin); scene.add(holder);

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const labels = {};
  const LW = mobile ? 1536 : 2048, LH = Math.round(LW * 0.285);
  function labelFor(tea) {
    if (labels[tea.slug]) return labels[tea.slug];
    const { col, orm } = paintLabel(tea, LW, LH);
    const map = new THREE.CanvasTexture(col); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = maxAniso;
    const om = new THREE.CanvasTexture(orm); om.anisotropy = maxAniso;
    return (labels[tea.slug] = { map, orm: om, tin: new THREE.Color(tea.tin) });
  }
  function applyTea(tea) {
    const L = labelFor(tea);
    labelMat.map = L.map; labelMat.roughnessMap = L.orm; labelMat.metalnessMap = L.orm; labelMat.needsUpdate = true;
    metal.color.copy(L.tin);
  }
  TEAS.forEach(labelFor);
  applyTea(TEAS[0]);

  // petals
  const PN = reduced ? 0 : mobile ? 18 : 46;
  const petals = new THREE.InstancedMesh(petalGeometry(), new THREE.MeshStandardMaterial({ map: petalTexture(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55, metalness: 0 }), PN);
  const pd = []; for (let i = 0; i < PN; i++) pd.push({ x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 7, z: -3 + Math.random() * 5.5, rx: Math.random() * 6, ry: Math.random() * 6, rz: Math.random() * 6, vr: 0.3 + Math.random() * 0.8, fall: 0.12 + Math.random() * 0.22, sway: Math.random() * 6 });
  scene.add(petals);
  const dummy = new THREE.Object3D();

  // pose (fractions of the viewport) → smoothed → world
  const pose = { x: 0, y: 0, s: 0.62, w: 0.46, rx: 0.1, ry: 0, rz: -0.25, o: 0 };
  const cur = { ...pose };
  let spin = 0, spinTarget = 0, swapAt = null, swapTea = null, petalsOn = 1, petalsCur = 1, scrollV = 0;

  let W = 1, H = 1, visH = 1, visW = 1;
  function resize() {
    W = canvas.clientWidth || innerWidth; H = canvas.clientHeight || innerHeight;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); visW = visH * camera.aspect;
  }
  resize();

  const clock = new THREE.Clock(); let running = true, t = 0;
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05); t += dt;
    const k = reduced ? 1 : 1 - Math.exp(-dt * 4.2);
    const sway = reduced ? 0 : 1;
    for (const key in pose) cur[key] += (pose[key] - cur[key]) * k;
    spin += (spinTarget - spin) * (reduced ? 1 : 1 - Math.exp(-dt * 3.2));
    if (swapAt !== null && spin >= swapAt) { applyTea(swapTea); swapAt = null; }
    const sc = Math.max(0.0001, Math.min(cur.s * visH / TIN_H, cur.w * visW / 1.3) * cur.o);
    holder.visible = cur.o > 0.02;
    holder.position.set(cur.x * visW, cur.y * visH + Math.sin(t * 0.9) * 0.05 * sway, 0);
    holder.scale.setScalar(sc);
    holder.rotation.set(cur.rx + Math.sin(t * 0.7) * 0.03 * sway, 0, cur.rz + Math.sin(t * 0.55) * 0.025 * sway);
    tin.rotation.y = cur.ry + spin + Math.sin(t * 0.45) * 0.32 * sway;

    petalsCur += (petalsOn - petalsCur) * k;
    scrollV *= 0.92;
    for (let i = 0; i < PN; i++) {
      const p = pd[i];
      p.y -= (p.fall + scrollV * 0.9) * dt; p.x += Math.sin(t * 0.6 + p.sway) * 0.12 * dt;
      p.rx += p.vr * dt; p.rz += p.vr * 0.6 * dt;
      if (p.y < -visH * 0.6) { p.y = visH * 0.6; p.x = (Math.random() - 0.5) * visW * 1.1; }
      if (p.y > visH * 0.62) { p.y = -visH * 0.58; }
      dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(p.rx, p.ry, p.rz); dummy.scale.setScalar(petalsCur < 0.02 ? 0.0001 : petalsCur);
      dummy.updateMatrix(); petals.setMatrixAt(i, dummy.matrix);
    }
    petals.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { clock.getDelta(); requestAnimationFrame(frame); } });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); running = false; document.documentElement.classList.add('no-webgl'); });

  // product shots for cards and pages: a second, throwaway renderer with its own environment
  function snapshots(w = 560, h = 720) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const r2 = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r2.toneMapping = THREE.ACESFilmicToneMapping; r2.toneMappingExposure = 1.05; r2.outputColorSpace = THREE.SRGBColorSpace; r2.setPixelRatio(1);
    const pm2 = new THREE.PMREMGenerator(r2), env2 = pm2.fromScene(new RoomEnvironment(), 0.04).texture;
    const cam = new THREE.PerspectiveCamera(24, w / h, 0.1, 50); cam.position.set(0, 0.35, 9); cam.lookAt(0, 0, 0);
    const keep = { env: scene.environment, pv: petals.visible, pos: holder.position.clone(), sc: holder.scale.clone(), rot: holder.rotation.clone(), ry: tin.rotation.y, vis: holder.visible };
    scene.environment = env2; petals.visible = false; holder.visible = true;
    holder.position.set(0, 0, 0); holder.rotation.set(0.08, 0, 0); holder.scale.setScalar(1.55); tin.rotation.y = -0.18;
    const out = {};
    TEAS.forEach((tea) => { applyTea(tea); r2.render(scene, cam); out[tea.slug] = cv.toDataURL('image/png'); });
    scene.environment = keep.env; petals.visible = keep.pv; holder.position.copy(keep.pos); holder.scale.copy(keep.sc); holder.rotation.copy(keep.rot); tin.rotation.y = keep.ry; holder.visible = keep.vis;
    applyTea(currentTea);
    env2.dispose(); pm2.dispose(); r2.dispose(); r2.forceContextLoss();
    return out;
  }

  let currentTea = TEAS[0];
  return {
    resize,
    setPose(p) { Object.assign(pose, p); },
    setPetals(v) { petalsOn = v; },
    kick(v) { scrollV = Math.max(-2, Math.min(2, scrollV + v)); },
    setTea(tea, animate = true) {
      if (tea === currentTea) return; currentTea = tea;
      if (!animate) { swapAt = null; applyTea(tea); return; }
      const base = Math.round(spinTarget / (Math.PI * 2)) * Math.PI * 2;
      spinTarget = base + Math.PI * 2; swapAt = base + Math.PI * 0.9; swapTea = tea;
    },
    snapshots
  };
}
