/* Liquid background: one full-screen WebGL canvas, domain-warped fbm mixed through a
   4-stop palette in OKLab. Pointer adds decaying swirls. Falls back to a CSS gradient
   (html.no-webgl) if anything fails or the device asks for reduced motion. */
(function () {
  var root = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;

  // ── colour helpers (CPU side, once per palette) ──
  function hexToRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16) / 255; }); }
  function lin(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function toLab(hex) {
    var c = hexToRgb(hex).map(lin), r = c[0], g = c[1], b = c[2];
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  }

  var cur = null, target = null;     // 12 floats each (4 stops × OKLab)
  var targetHex = null;
  function palLab(pal) { var o = []; pal.forEach(function (h) { o.push.apply(o, toLab(h)); }); return o; }

  function setCss(pal, ink) {
    root.style.setProperty('--p0', pal[0]); root.style.setProperty('--p1', pal[1]);
    root.style.setProperty('--p2', pal[2]); root.style.setProperty('--p3', pal[3]);
    if (ink) root.style.setProperty('--ink', ink);
  }

  var api = {
    ok: false,
    setPalette: function (pal, ink, instant) {
      var key = pal.join(',');
      setCss(pal, ink);
      if (key === targetHex) return;
      targetHex = key;
      target = palLab(pal);
      if (!cur || instant) cur = target.slice();
    },
    swirl: function () {},
    calm: 0.32
  };
  window.Liquid = api;

  if (reduced) { root.classList.add('no-webgl'); return; }

  var canvas = document.getElementById('liquid');
  var gl = canvas && (canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'low-power' }) ||
                      canvas.getContext('experimental-webgl'));
  if (!gl) { root.classList.add('no-webgl'); return; }

  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uTime;uniform float uCalm;uniform float uOct;uniform float uSeed;',
    'uniform vec3 uPal[4];uniform vec4 uPtr[12];',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){if(float(i)>=uOct)break;v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}',
    'vec3 ramp(float t){t=clamp(t,0.,1.)*3.;',
    ' if(t<1.)return mix(uPal[0],uPal[1],smoothstep(0.,1.,t));',
    ' if(t<2.)return mix(uPal[1],uPal[2],smoothstep(0.,1.,t-1.));',
    ' return mix(uPal[2],uPal[3],smoothstep(0.,1.,t-2.));}',
    'vec3 labToRgb(vec3 c){float l_=c.x+.3963377774*c.y+.2158037573*c.z;float m_=c.x-.1055613458*c.y-.0638541728*c.z;float s_=c.x-.0894841775*c.y-1.291485548*c.z;',
    ' float l=l_*l_*l_,m=m_*m_*m_,s=s_*s_*s_;',
    ' vec3 lr=vec3(4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s);',
    ' lr=clamp(lr,0.,1.);return mix(lr*12.92,1.055*pow(lr,vec3(1./2.4))-.055,step(.0031308,lr));}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;',
    ' vec2 p=vec2(uv.x*asp,uv.y)*1.35+uSeed;',
    ' for(int i=0;i<12;i++){vec4 q=uPtr[i];vec2 d=uv-q.xy;d.x*=asp;float r2=dot(d,d);float s=q.z*exp(-r2/q.w);',
    '  float a=s*5.;float cs=cos(a),sn=sin(a);d=mat2(cs,-sn,sn,cs)*d-d;p+=d*2.2;}',
    ' float t=uTime;',
    ' vec2 q=vec2(fbm(p+vec2(0.,t*.9)),fbm(p+vec2(5.2,1.3)-t*.6));',
    ' vec2 r=vec2(fbm(p+3.2*q+vec2(1.7,9.2)+t*.35),fbm(p+3.2*q+vec2(8.3,2.8)-t*.28));',
    ' float f=fbm(p+2.8*r);',
    ' float k=clamp((f-.28)*2.1+length(r)*.22,0.,1.);',
    ' k=mix(k,1.,uCalm);',
    ' vec3 col=labToRgb(ramp(k));',
    ' float sheen=smoothstep(.55,.95,f+.25*r.x)*.10;col+=sheen;',
    ' col+=(hash(gl_FragCoord.xy+fract(t*37.))-.5)*.03;',
    ' gl_FragColor=vec4(col,1.);}'
  ].join('\n');

  function sh(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('Liquid shader:', gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { root.classList.add('no-webgl'); return; }
  var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn('Liquid link:', gl.getProgramInfoLog(prog)); root.classList.add('no-webgl'); return; }
  gl.useProgram(prog);

  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {};
  ['uRes', 'uTime', 'uCalm', 'uOct', 'uSeed', 'uPal', 'uPtr'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n === 'uPal' || n === 'uPtr' ? n + '[0]' : n); });

  var scale = mobile ? 0.35 : 0.5;
  var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  function resize() {
    var w = Math.max(2, Math.round(innerWidth * dpr * scale)), h = Math.max(2, Math.round(innerHeight * dpr * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
  }
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 120); });
  resize();

  gl.uniform1f(U.uOct, mobile ? 3 : 4);
  gl.uniform1f(U.uSeed, 3.7);

  // ── pointer trail: 12 slots of (x, y, strength, radius) ──
  var trail = []; for (var i = 0; i < 12; i++) trail.push({ x: 0, y: 0, s: 0, r: 0.02, born: -9 });
  var slot = 0, lastPush = 0, lx = -1, ly = -1;
  function push(x, y, strength, radius) {
    var t = trail[slot]; slot = (slot + 1) % 12;
    t.x = x / innerWidth; t.y = 1 - y / innerHeight; t.s = strength; t.r = radius; t.born = performance.now();
  }
  if (!mobile) {
    addEventListener('pointermove', function (e) {
      var now = performance.now();
      if (now - lastPush < 40) return;
      var d = lx < 0 ? 0 : Math.hypot(e.clientX - lx, e.clientY - ly);
      lx = e.clientX; ly = e.clientY; lastPush = now;
      if (d > 2) push(e.clientX, e.clientY, Math.min(0.9, 0.25 + d / 120), 0.012);
    }, { passive: true });
  }
  api.swirl = function (x, y) { push(x, y, 1.4, 0.03); };

  var ptr = new Float32Array(48), pal = new Float32Array(12);
  var start = performance.now(), last = start, running = true, frames = 0, slowFrames = 0, skip = false;
  document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(frame); } });

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    var dt = now - last;
    if (mobile) { skip = !skip; if (skip) return; }   // ~30 fps on phones
    last = now;
    // watchdog over the first 90 frames
    if (frames < 90) { frames++; if (dt > 45) slowFrames++; if (frames === 90 && slowFrames > 45) { if (scale > 0.3) { scale = 0.25; resize(); } } }

    if (cur && target) {
      var k = 1 - Math.exp(-dt / 220);
      for (var j = 0; j < 12; j++) { cur[j] += (target[j] - cur[j]) * k; pal[j] = cur[j]; }
      gl.uniform3fv(U.uPal, pal);
    }
    for (var n = 0; n < 12; n++) {
      var t = trail[n], age = (now - t.born) / 1200, s = age < 1 ? t.s * (1 - age) * (1 - age) : 0;
      ptr[n * 4] = t.x; ptr[n * 4 + 1] = t.y; ptr[n * 4 + 2] = s; ptr[n * 4 + 3] = t.r;
    }
    gl.uniform4fv(U.uPtr, ptr);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, (now - start) / 1000 * 0.065);
    gl.uniform1f(U.uCalm, api.calm);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); running = false; root.classList.add('no-webgl'); });
  api.ok = true;
  requestAnimationFrame(frame);
})();
