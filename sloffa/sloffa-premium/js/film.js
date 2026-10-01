/* Desktop story, from real footage. Same shape as stage.js (update / anchors / isHover / setPointer),
   so main.js can use either. Driven by the same number s (0 → 4):
   0–1 v1 the lid comes off · 1–2 v2 the shoe floats out (v1's last frame is v2's first)
   2–3 a slow hold on v3's first frame · 3–4 v3 the shoe comes apart.
   The closed box has an x-ray lens: hover it and you see what's inside (v1's last frame, same framing). */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);
const ramp = (s, a, b) => ease(clamp((s - a) / (b - a)));

// footage is 1280×720; positions below are fractions of that frame
const BOX = { x0: 0.33, x1: 0.96, y0: 0.16, y1: 0.87 };          // the closed box in v1's first frame
const LAYERS = [                                                   // left edge of each layer in v3's last frame
  { key: 'laces', x: 0.535, y: 0.165 },                             // labels line up in a column to their left
  { key: 'tongue', x: 0.585, y: 0.265 },
  { key: 'upper', x: 0.44, y: 0.45 },
  { key: 'insole', x: 0.46, y: 0.585 },
  { key: 'midsole', x: 0.43, y: 0.70 },
  { key: 'outsole', x: 0.43, y: 0.81 },
];

export async function createFilm(root, { reduced = false } = {}) {
  const [v1, v2, v3] = ['#v1', '#v2', '#v3'].map((s) => root.querySelector(s));
  const vids = [v1, v2, v3];
  const xray = root.querySelector('.xray'), lens = root.querySelector('.lens');
  vids.forEach((v) => { v.muted = true; v.playsInline = true; v.pause(); });

  // frame geometry: a 16:9 frame flush right, as wide as fits (76% of the width, or the full height)
  const frame = root.querySelector('.frame');
  let W = innerWidth, H = innerHeight, g = { s: 1, ox: 0, oy: 0 };
  function resize() {
    W = innerWidth; H = innerHeight;
    const fw = Math.min(W * 0.76, H * 1.06 * 16 / 9);
    frame.style.setProperty('--fw', fw + 'px');
    const s = fw / 1280;
    g = { s, ox: W - fw, oy: (H - 720 * s) / 2 };
  }
  resize();
  const toScreen = (nx, ny) => ({ x: g.ox + nx * 1280 * g.s, y: g.oy + ny * 720 * g.s });

  // ── scrubbing: one seek in flight per video, only when the target moves by more than half a frame
  const HALF = 1 / 48;
  const scrub = vids.map((v) => ({ v, target: 0, busy: false }));
  scrub.forEach((sc) => sc.v.addEventListener('seeked', () => { sc.busy = false; }));
  function seek(i, t) {
    const sc = scrub[i], v = sc.v;
    if (!v.duration) return;
    sc.target = clamp(t, 0, v.duration - 0.04);
    if (sc.busy || Math.abs(v.currentTime - sc.target) < HALF) return;
    sc.busy = true; v.currentTime = sc.target;
    setTimeout(() => { sc.busy = false; }, 250);            // never get stuck if a 'seeked' goes missing
  }

  // ── x-ray lens
  let px = -999, py = -999, live = false, lensR = 0, hover = false;
  function setPointer(nx, ny) { px = (nx + 1) / 2 * W; py = (1 - ny) / 2 * H; live = true; }
  function overBox() {
    const a = toScreen(BOX.x0, BOX.y0), b = toScreen(BOX.x1, BOX.y1);
    return px > a.x && px < b.x && py > a.y && py < b.y;
  }

  let lastS = 0;
  function update(s) {
    lastS = s;
    // which film is on screen
    v1.style.opacity = s < 1 ? 1 : 0;
    const toV3 = ramp(s, 2.02, 2.3);
    v2.style.opacity = s >= 1 ? 1 - toV3 : 0;
    v3.style.opacity = s >= 2 ? toV3 : 0;
    // playheads (each holds briefly at both ends so chapters start and finish on a clean frame)
    seek(0, clamp((s - 0.03) / 0.9) * (v1.duration || 0));
    seek(1, clamp((s - 1.02) / 0.9) * (v2.duration || 0));
    seek(2, clamp((s - 3.04) / 0.82) * (v3.duration || 0));
    // a slow push-in while the shoe just hangs there in chapter 3
    const push = 1 + 0.045 * ramp(s, 2.15, 2.95) * (1 - ramp(s, 2.95, 3.1));
    v3.style.transform = `scale(${push.toFixed(4)})`;
    // the page behind the footage follows each film's own cream, so the faded edges disappear
    const k = ramp(s, 2.02, 2.3);
    const c = [250 - 6 * k, 240 - 6 * k, 227 - 7 * k].map(Math.round);
    document.body.style.setProperty('--stage-bg', `rgb(${c})`);

    // x-ray only while the box is shut and a real mouse is over it
    hover = live && s < 0.03 && overBox();
    lensR += ((hover ? 150 : 0) - lensR) * (reduced ? 1 : 0.18);
    const r = Math.max(0, lensR);
    // the mask lives inside the frame, so convert from screen to frame coordinates
    const m = `radial-gradient(circle ${r.toFixed(1)}px at ${(px - g.ox).toFixed(1)}px ${(py - g.oy).toFixed(1)}px, #000 72%, transparent 100%)`;
    xray.style.webkitMaskImage = m; xray.style.maskImage = m;
    xray.style.opacity = r > 1 ? 1 : 0;
    lens.style.transform = `translate(${px}px,${py}px) scale(${(r / 150).toFixed(3)})`;
    lens.style.opacity = r > 4 ? 1 : 0;
  }

  function anchors() {
    const col = toScreen(0.405, 0).x;                                 // the label column's right edge
    return LAYERS.map((l) => ({ key: l.key, side: -1, col, ...toScreen(l.x, l.y) }));
  }

  // wait until the first film can show its first frame (posters cover the gap anyway)
  await new Promise((res) => {
    if (v1.readyState >= 2) return res();
    v1.addEventListener('loadeddata', res, { once: true });
    setTimeout(res, 2500);
  });
  return { update, resize, setPointer, anchors, isHover: () => hover, film: true };
}
