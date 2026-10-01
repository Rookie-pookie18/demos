/* The home-page story, one fixed 3D scene driven by a single number s (0 → 4):
   0–1 the box opens · 1–2 the shoe floats out · 2–3 it does one lazy lap · 3–4 it comes apart. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildShoe } from './shoe.js';
import { buildBox, BOX } from './box.js';
import { DEFAULT_COLORS } from './data.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, k) => a + (b - a) * k;
const ramp = (s, a, b) => ease(clamp((s - a) / (b - a)));

// camera keyframes: position, look-at, and how much half-width must fit on a narrow phone screen
const CAM = [
  { s: 0, pos: [5.0, 4.6, 7.6], look: [0, 0.55, 0], r: 2.7 },
  { s: 1, pos: [3.5, 7.2, 6.0], look: [0.15, 0.4, 0], r: 2.6 },
  { s: 1.42, pos: [3.2, 7.6, 7.6], look: [0, 2.7, 0], r: 2.4 },
  { s: 1.95, pos: [0, 3.95, 8.4], look: [0, 3.55, 0], r: 1.85 },
  { s: 3.0, pos: [0, 3.95, 8.4], look: [0, 3.55, 0], r: 1.85 },
  { s: 3.3, pos: [0.2, 4.4, 10.2], look: [0, 3.9, 0], r: 2.0 },
  { s: 3.75, pos: [0.4, 5.6, 12.4], look: [0, 4.75, 0], r: 2.1 },
];
const SHOE_UP = new THREE.Vector3(0, 3.0, 0.15);

export async function createStage(canvas, { mobile = false, reduced = false, font } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const key = new THREE.DirectionalLight('#ffffff', 2.3);
  key.position.set(-5, 9, 6); key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 6, bottom: -5, near: 1, far: 30 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  scene.add(key, new THREE.HemisphereLight('#ffffff', '#e8dcc8', 0.55));

  const world = new THREE.Group(); scene.add(world);

  // ── the box and the ground it sits on
  const box = buildBox({ font });
  world.add(box.root);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; box.root.add(ground);

  // ── two shoes: A is the story shoe, B stays in the box
  const shoeA = buildShoe({ type: 'lowtop', colors: DEFAULT_COLORS, text: 'NAP', font });
  const shoeB = buildShoe({ type: 'lowtop', colors: DEFAULT_COLORS, text: 'NAP', font });
  const IN_SCALE = 0.68;
  const inA = new THREE.Vector3(0.08, BOX.t + 0.01, 0.5);
  shoeB.root.position.set(-0.08, BOX.t + 0.01, -0.5); shoeB.root.rotation.y = Math.PI; shoeB.root.scale.setScalar(IN_SCALE);
  box.base.add(shoeB.root);
  // A lives in its own rig so it can leave the box
  const rig = new THREE.Group(); world.add(rig); rig.add(shoeA.root);

  // soft blob shadow under the floating shoe
  const blobC = document.createElement('canvas'); blobC.width = blobC.height = 128;
  const bx = blobC.getContext('2d'); const gr = bx.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, 'rgba(60,40,20,.38)'); gr.addColorStop(1, 'rgba(60,40,20,0)'); bx.fillStyle = gr; bx.fillRect(0, 0, 128, 128);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(blobC), transparent: true, depthWrite: false, opacity: 0 }));
  blob.rotation.x = -Math.PI / 2; world.add(blob);

  // ── sleepy z's that drift out of the open box
  const zs = [];
  const zCols = ['#3D5AFE', '#FF5A36', '#C9B6FF', '#F7A8C4', '#1C1A17'];
  for (let i = 0; i < 16; i++) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.fillStyle = zCols[i % zCols.length]; x.font = `800 112px ${font}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('z', 64, 70);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, opacity: 0, depthWrite: false }));
    sp.userData = { x: (Math.random() - 0.5) * 2.6, z: (Math.random() - 0.5) * 1.4, phase: Math.random(), spd: 0.12 + Math.random() * 0.1, size: 0.22 + Math.random() * 0.3 };
    world.add(sp); zs.push(sp);
  }

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  let W = 1, H = 1, portrait = false;
  function resize() {
    W = canvas.clientWidth || innerWidth; H = canvas.clientHeight || innerHeight;
    renderer.setSize(W, H, false);
    portrait = W / H < 0.9;
    camera.fov = portrait ? 42 : 32;
    camera.aspect = W / H;
    // push the subject right on desktop (headline lives on the left), down on phones (headline on top)
    if (portrait) camera.setViewOffset(W, H, 0, -H * 0.08, W, H);
    else camera.setViewOffset(W, H, -W * 0.13, 0, W, H);
    camera.updateProjectionMatrix();
  }
  resize();

  // ── pointer: tilt and hover-peek
  const pointer = new THREE.Vector2(0, 0), ray = new THREE.Raycaster();
  let tilt = { x: 0, y: 0 }, peek = 0, peekTarget = 0, hover = false;
  let pointerLive = false;           // only a real mouse can hover; touch never peeks
  function setPointer(nx, ny) { pointer.set(nx, ny); pointerLive = true; }

  const v = new THREE.Vector3(), lookV = new THREE.Vector3(), tmp = new THREE.Vector3();
  function cameraAt(s) {
    let i = 0; while (i < CAM.length - 2 && s > CAM[i + 1].s) i++;
    const a = CAM[i], b = CAM[i + 1], k = ease(clamp((s - a.s) / (b.s - a.s)));
    v.set(lerp(a.pos[0], b.pos[0], k), lerp(a.pos[1], b.pos[1], k), lerp(a.pos[2], b.pos[2], k));
    lookV.set(lerp(a.look[0], b.look[0], k), lerp(a.look[1], b.look[1], k), lerp(a.look[2], b.look[2], k));
    const r = lerp(a.r, b.r, k) * (portrait ? 1 + 0.32 * ramp(s, 3.0, 3.6) : 1);
    if (portrait) {
      // back off until r fits across the narrow screen
      const d0 = v.distanceTo(lookV), need = r / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect * 0.94);
      if (need > d0) v.sub(lookV).multiplyScalar(need / d0).add(lookV);
    }
    camera.position.copy(v); camera.lookAt(lookV);
  }

  let time = 0, lastS = 0;
  const qA = new THREE.Quaternion(), eul = new THREE.Euler();
  function update(s, dt, timeScale = 1) {
    time += dt * timeScale; lastS = s;
    const idle = reduced ? 0 : 1;

    // chapter 1: lid off, tissue open
    const lidK = ramp(s, 0.02, 0.55), tisK = ramp(s, 0.42, 0.95);
    peek = lerp(peek, s < 0.15 ? peekTarget : 0, 0.12);
    box.setLid(lidK, peek); box.setTissue(tisK);
    // gentle idle float + pointer tilt while the box is the star
    const boxStar = 1 - ramp(s, 0.9, 1.5);
    tilt.x = lerp(tilt.x, pointer.y * 0.06 * boxStar, 0.06); tilt.y = lerp(tilt.y, pointer.x * 0.16 * boxStar, 0.06);
    // chapter 2: the box sinks away as the shoe rises out of it
    const sink = ramp(s, 1.45, 1.98);
    box.root.position.y = -2.6 * sink + Math.sin(time * 1.3) * 0.03 * boxStar * idle;
    box.root.rotation.set(tilt.x, tilt.y - 0.0, 0);
    box.root.visible = sink < 0.999;

    // shoe A: in the box → floating in profile → one lap → posed for the explode
    const rise = ramp(s, 1.0, 1.62);
    const inPos = tmp.copy(inA).applyEuler(box.root.rotation).add(box.root.position);
    rig.position.set(lerp(inPos.x, SHOE_UP.x, rise), lerp(inPos.y, SHOE_UP.y, rise), lerp(inPos.z, SHOE_UP.z, rise));
    rig.position.y += Math.sin(time * 1.1) * 0.06 * ramp(s, 1.7, 2.1) * idle;
    rig.position.z += 0;
    rig.scale.setScalar(lerp(IN_SCALE, 1, rise));
    const lap = ramp(s, 2.08, 2.92) * Math.PI * 2;
    const pose = ramp(s, 3.0, 3.35);
    eul.set(
      lerp(tilt.x, 0, rise) + Math.sin(rise * Math.PI) * -0.18 + pose * 0.2,
      lerp(tilt.y, 0, rise) + Math.sin(rise * Math.PI) * 0.7 + lap - pose * 0.45,
      Math.sin(rise * Math.PI) * 0.22 + Math.sin(time * 0.9) * 0.03 * ramp(s, 1.7, 2.1) * idle,
    );
    rig.rotation.copy(eul);
    // chapter 4: come apart
    const ex = ramp(s, 3.12, 3.72);
    shoeA.explode(ex);

    blob.material.opacity = ramp(s, 1.65, 2.0) * (1 - ex * 0.6) * 0.9;
    blob.position.set(rig.position.x, SHOE_UP.y - 0.75 - ex * 0.65, rig.position.z);
    blob.scale.setScalar(1 + ex * 0.3);

    // z's drift up out of the open box, then fade as the shoe leaves
    const zVis = ramp(s, 0.55, 0.85) * (1 - ramp(s, 1.4, 1.8));
    for (const sp of zs) {
      const d = sp.userData, p = (d.phase + time * d.spd * 0.35) % 1;
      sp.position.set(d.x + Math.sin(time + d.phase * 6) * 0.15, box.root.position.y + BOX.H * 0.8 + p * 3.2, d.z);
      sp.scale.setScalar(d.size * (0.6 + p * 0.6));
      sp.material.opacity = zVis * Math.sin(p * Math.PI) * 0.95;
      sp.visible = zVis > 0.01;
    }

    // on phones, slide the exploded stack down below the headline
    if (portrait) {
      const y = -H * (0.08 + 0.1 * ramp(s, 3.0, 3.5));
      if (Math.abs(y - (camera.view ? camera.view.offsetY : 0)) > 0.5) camera.setViewOffset(W, H, 0, y, W, H);
    } else {
      // and on desktop, slide it a little further from the headline while it comes apart
      const x = -W * (0.13 + 0.05 * ramp(s, 2.9, 3.4));
      if (Math.abs(x - (camera.view ? camera.view.offsetX : 0)) > 0.5) camera.setViewOffset(W, H, x, 0, W, H);
    }
    cameraAt(s);

    // hover peek (desktop, box closed)
    if (s < 0.15 && pointerLive) {
      ray.setFromCamera(pointer, camera);
      hover = ray.intersectObject(box.root, true).length > 0;
      peekTarget = hover ? 1 : 0;
    } else hover = false;

    renderer.render(scene, camera);
  }

  // screen-space anchors for the explode labels
  const LAYERS = ['laces', 'tongue', 'upper', 'insole', 'midsole', 'outsole'];
  function anchors() {
    const ex = ramp(lastS, 3.12, 3.72);
    return LAYERS.map((k) => {
      shoeA.anchor(k, ex, tmp); rig.localToWorld(tmp); tmp.project(camera);
      return { key: k, x: (tmp.x * 0.5 + 0.5) * W, y: (-tmp.y * 0.5 + 0.5) * H };
    });
  }

  return { update, resize, setPointer, anchors, isHover: () => hover, renderer };
}
