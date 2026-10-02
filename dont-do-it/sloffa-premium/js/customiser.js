// The Sloffa Lounger customiser: a GLB with six named parts, each recoloured on its own.
// Used on the homepage (chapter 05) and on lounger/. Markup contract: an element with
// [data-customiser] holding .cz__stage, [data-parts], [data-swatches], .cz__summary,
// .cz__swname, [data-random] and [data-reset].
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';

export const PARTS = [
  { id: 'sole', label: 'Sole' },
  { id: 'footbed', label: 'Footbed' },
  { id: 'upper', label: 'Upper' },
  { id: 'lining', label: 'Lining' },
  { id: 'pull_loop', label: 'Pull loop' },
  { id: 'patch', label: 'Patch' },
];
export const SWATCHES = [
  { id: 'oat', name: 'Couch Oat', hex: '#EFE6D6' },
  { id: 'lilac', name: 'Nap Lilac', hex: '#C9B8FF' },
  { id: 'orange', name: 'Snooze Orange', hex: '#FF7A3D' },
  { id: 'crumb', name: 'Crumb Brown', hex: '#B9875C' },
  { id: 'black', name: 'Remote Black', hex: '#2B2622' },
  { id: 'tea', name: 'Tea Green', hex: '#A9C79B' },
  { id: 'duvet', name: 'Duvet Blue', hex: '#8FB3E8' },
  { id: 'pink', name: 'Pillow Pink', hex: '#F6B8C8' },
  { id: 'cheese', name: 'Cheesy Yellow', hex: '#F5CF5B' },
  { id: 'lint', name: 'Lint Grey', hex: '#C8C3BB' },
];
export const DEFAULTS = { sole: 'oat', footbed: 'crumb', upper: 'lilac', lining: 'orange', pull_loop: 'black', patch: 'orange' };
const sw = id => SWATCHES.find(s => s.id === id);

function readHash() {
  const m = location.hash.match(/cw=([a-z.]+)/);
  if (!m) return null;
  const ids = m[1].split('.');
  if (ids.length !== PARTS.length || !ids.every(sw)) return null;
  return Object.fromEntries(PARTS.map((p, i) => [p.id, ids[i]]));
}
function writeHash(state) {
  const h = '#cw=' + PARTS.map(p => state[p.id]).join('.');
  history.replaceState(null, '', location.pathname + location.search + h);
}

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

export function mountCustomiser(el, { modelUrl, reducedMotion = false } = {}) {
  const stage = el.querySelector('.cz__stage');
  const partsBox = el.querySelector('[data-parts]');
  const swBox = el.querySelector('[data-swatches]');
  const summary = el.querySelector('.cz__summary');
  const swName = el.querySelector('.cz__swname');
  const errBox = el.querySelector('.cz__err');
  const loading = el.querySelector('.cz__loading');
  const dev = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || /[?&]dev\b/.test(location.search);

  const state = { ...DEFAULTS, ...(readHash() || {}) };
  let selected = 'upper';
  const meshes = {};

  // ---------- controls ----------
  partsBox.innerHTML = PARTS.map(p => `<button type="button" class="cz__part" data-part="${p.id}" aria-pressed="false">${p.label}</button>`).join('');
  swBox.innerHTML = SWATCHES.map(s => `<button type="button" class="cz__sw" data-swatch="${s.id}" aria-pressed="false" aria-label="${s.name}" title="${s.name}" style="background:${s.hex}"></button>`).join('');

  function summaryText() {
    return 'Your pair: ' + PARTS.map(p => `${sw(state[p.id]).name} ${p.label}`).join(' / ');
  }
  function syncUI() {
    partsBox.querySelectorAll('[data-part]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.part === selected)));
    swBox.querySelectorAll('[data-swatch]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.swatch === state[selected])));
    const label = PARTS.find(p => p.id === selected).label;
    if (swName) swName.textContent = `${label}: ${sw(state[selected]).name}`;
    summary.textContent = summaryText();
    stage.setAttribute('aria-label', 'A 3D Sloffa Lounger slip-on mule. ' + PARTS.map(p => `${p.label}: ${sw(state[p.id]).name}`).join(', ') + '.');
  }

  function paint(part, instant) {
    const mesh = meshes[part];
    if (!mesh) return;
    const to = new THREE.Color(sw(state[part]).hex);
    const mat = mesh.material;
    gsap.killTweensOf(mat.userData);
    if (instant || reducedMotion) { mat.color.copy(to); return; }
    const from = mat.color.clone();
    mat.userData.t = 0;
    gsap.to(mat.userData, { t: 1, duration: 0.4, ease: 'power2.out', onUpdate: () => mat.color.lerpColors(from, to, mat.userData.t) });
  }
  function pulse(part) {
    const mesh = meshes[part];
    if (!mesh || reducedMotion) return;
    const mat = mesh.material;
    mat.emissive.set('#ffffff');
    gsap.killTweensOf(mat, 'emissiveIntensity');
    gsap.fromTo(mat, { emissiveIntensity: 0 }, { emissiveIntensity: 0.32, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', onComplete: () => { mat.emissiveIntensity = 0; } });
  }
  function select(part) { selected = part; syncUI(); pulse(part); }
  function setColour(part, id, instant) { state[part] = id; paint(part, instant); syncUI(); writeHash(state); }

  partsBox.addEventListener('click', e => { const b = e.target.closest('[data-part]'); if (b) select(b.dataset.part); });
  swBox.addEventListener('click', e => { const b = e.target.closest('[data-swatch]'); if (b) setColour(selected, b.dataset.swatch); });
  el.querySelector('[data-random]')?.addEventListener('click', () => {
    PARTS.forEach(p => { state[p.id] = SWATCHES[Math.floor(Math.random() * SWATCHES.length)].id; paint(p.id); });
    syncUI(); writeHash(state);
  });
  el.querySelector('[data-reset]')?.addEventListener('click', () => {
    Object.assign(state, DEFAULTS); PARTS.forEach(p => paint(p.id)); syncUI(); writeHash(state);
  });
  syncUI();

  function fallback(reason) {
    console.warn('[Sloffa customiser] showing photo fallback:', reason);
    el.classList.add('cz--fallback');
    if (loading) loading.remove();
  }
  if (/[?&]nogl\b/.test(location.search) || !hasWebGL()) { fallback('no WebGL'); return { state }; }

  // ---------- scene ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.86;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  stage.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const key = new THREE.DirectionalLight(0xfff4e6, 1.15); key.position.set(-3, 5, 3.5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xe9e2ff, 0.35); fill.position.set(3, 1.5, -3); scene.add(fill);

  // soft shadow-catcher ellipse
  const sc = document.createElement('canvas'); sc.width = sc.height = 128;
  const g = sc.getContext('2d'); const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, 'rgba(33,28,23,0.55)'); rg.addColorStop(0.55, 'rgba(33,28,23,0.22)'); rg.addColorStop(1, 'rgba(33,28,23,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.7), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.003; scene.add(shadow);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const target = new THREE.Vector3(0, 0.52, 0);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target);
  controls.enablePan = false;
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minPolarAngle = THREE.MathUtils.degToRad(55);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(100);
  controls.autoRotate = !reducedMotion; controls.autoRotateSpeed = 0.6;
  controls.enableZoom = true; controls.zoomToCursor = false;
  let idleT;
  controls.addEventListener('start', () => { controls.autoRotate = false; clearTimeout(idleT); });
  controls.addEventListener('end', () => { clearTimeout(idleT); if (!reducedMotion) idleT = setTimeout(() => { controls.autoRotate = true; }, 4000); });

  let baseDist = 6;
  const dir = new THREE.Vector3(-1.4, 2.0, 4.2).normalize();
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const prev = baseDist;
    baseDist = Math.max(1.5 / (t * camera.aspect * 0.86), 1.0 / (t * 0.82));
    controls.minDistance = baseDist / 1.4; controls.maxDistance = baseDist / 0.8;
    if (!camera.userData.placed) { camera.position.copy(target).addScaledVector(dir, baseDist); camera.userData.placed = true; }
    else { const off = camera.position.clone().sub(target).multiplyScalar(baseDist / prev); camera.position.copy(target).add(off); }
    controls.update();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  // ---------- load the GLB ----------
  const model = new THREE.Group(); scene.add(model);
  new GLTFLoader().load(modelUrl, gltf => {
    const names = [];
    gltf.scene.traverse(o => {
      if (!o.isMesh) return;
      o.material = o.material.clone();           // no two parts may share a material
      o.material.emissive = new THREE.Color(0x000000);
      names.push(o.name);
      if (PARTS.some(p => p.id === o.name)) meshes[o.name] = o;
    });
    console.log('[Sloffa customiser] GLB nodes:', names.join(', '));
    const missing = PARTS.map(p => p.id).filter(id => !meshes[id]);
    if (missing.length) {
      const msg = 'GLB is missing parts: ' + missing.join(', ') + '. Each part must be a separate mesh with that exact name.';
      console.error('[Sloffa customiser]', msg);
      if (dev && errBox) { errBox.textContent = msg; errBox.style.display = 'block'; }
    }
    model.add(gltf.scene);
    PARTS.forEach(p => paint(p.id, true));
    loading?.remove();
    if (!reducedMotion) gsap.from(model.position, { y: -0.35, duration: 1.2, ease: 'power3.out' });
    el.dispatchEvent(new CustomEvent('cz:ready', { detail: { names } }));
  }, undefined, err => { console.error('[Sloffa customiser] GLB failed to load', err); renderer.domElement.remove(); fallback('GLB failed'); });

  // ---------- tap a part on the shoe ----------
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); let down = null;
  renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(Object.values(meshes), false)[0];
    if (hit) select(hit.object.name);
  });

  // ---------- render only while visible ----------
  let visible = false, raf = 0;
  const loop = () => { raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); };
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && !raf) loop();
    if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
  }).observe(stage);

  const api = { state, meshes, select, setColour, renderer, controls };
  window.__sloffaCz = api;
  return api;
}
