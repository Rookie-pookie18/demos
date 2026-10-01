/* A small turntable viewer for one shoe (customiser + product pages), plus a one-off renderer that
   paints still images of each model for the lineup cards. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildShoe } from './shoe.js';

function stageScene(renderer, mobile) {
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const key = new THREE.DirectionalLight('#ffffff', 2.3);
  key.position.set(-4, 8, 5); key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 25 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
  scene.add(key, new THREE.HemisphereLight('#ffffff', '#e8dcc8', 0.55));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.17 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  return scene;
}
function makeRenderer(canvas, mobile, extra = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, ...extra });
  r.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.02;
  r.setClearColor(0x000000, 0);
  return r;
}

export function createViewer(canvas, { type = 'lowtop', colors, text = '', font, mobile = false, reduced = false, onPick } = {}) {
  const renderer = makeRenderer(canvas, mobile);
  const scene = stageScene(renderer, mobile);
  let shoe = buildShoe({ type, colors, text, font });
  scene.add(shoe.root);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(-4.6, 3.1, 5.8);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.55, 0);
  Object.assign(controls, { enableZoom: false, enablePan: false, enableDamping: true, dampingFactor: 0.08, rotateSpeed: 0.8,
    minPolarAngle: 0.55, maxPolarAngle: 1.45, autoRotate: !reduced, autoRotateSpeed: 1.1 });
  // keep page scrolling on touch: only rotate on horizontal-ish drags
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  let idleT = 0;
  controls.addEventListener('start', () => { controls.autoRotate = false; idleT = 0; });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // fit the 2.9-long shoe across narrow canvases
    const fit = Math.max(1, 1.05 / camera.aspect);
    camera.position.setLength(8.2 * fit * (camera.aspect < 1.05 ? 1.05 : 1));
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  // tap a part to pick it (ignore drags)
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6 || !onPick) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(shoe.root, true)[0];
    if (hit) { const p = shoe.partAt(hit); if (p) onPick(p); }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!onPick || e.pointerType !== 'mouse') return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    canvas.style.cursor = ray.intersectObject(shoe.root, true).length ? 'pointer' : 'grab';
  });

  // a little hop when a part changes
  let hop = 0;
  const bounce = () => { hop = 1; };

  let visible = true, raf = 0, last = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) loop(); }, { rootMargin: '100px' }).observe(canvas);
  function loop() {
    raf = 0; if (!visible) return;
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!controls.autoRotate && !reduced) { idleT += dt; if (idleT > 4) controls.autoRotate = true; }
    hop = Math.max(0, hop - dt * 2.2);
    shoe.root.position.y = Math.sin(hop * Math.PI) * 0.18;
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  loop();

  function setType(t, cols, txt) {
    scene.remove(shoe.root);
    shoe = buildShoe({ type: t, colors: cols, text: txt, font });
    scene.add(shoe.root); bounce();
  }
  return { get shoe() { return shoe; }, setType, bounce, controls, renderer };
}

// stills for the lineup cards (one renderer, then thrown away)
export function snapshots(list, { w = 720, h = 540, font } = {}) {
  const canvas = document.createElement('canvas');
  const renderer = makeRenderer(canvas, false, { preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  const scene = stageScene(renderer, false);
  const camera = new THREE.PerspectiveCamera(28, w / h, 0.1, 100);
  camera.position.set(-4.4, 2.5, 5.4); camera.lookAt(0.05, 0.5, 0);
  const out = {};
  for (const it of list) {
    const s = buildShoe({ type: it.type, colors: it.colors, text: it.text || '', font });
    s.root.rotation.y = -0.15;
    scene.add(s.root);
    renderer.render(scene, camera);
    out[it.key] = canvas.toDataURL('image/png');
    scene.remove(s.root);
  }
  renderer.dispose(); renderer.forceContextLoss();
  return out;
}
