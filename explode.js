import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const sec = document.getElementById('structure');
const canvas = document.getElementById('xv-canvas');
const labelLayer = document.getElementById('xv-labels');
const stepEls = [...document.querySelectorAll('.xv-step')];

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.add(new THREE.HemisphereLight(0xffffff, 0xe6ddcf, 1.1));
const sun = new THREE.DirectionalLight(0xfffaf2, 1.6); sun.position.set(-2, 9, 5); scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.6); fill.position.set(6, 2, 3); scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 0.9); rim.position.set(1, 4, -7); scene.add(rim);

const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

/* ---------- materials (대표 이미지 기준: 무광 웜화이트 · 오크 · 따뜻한 링 조명) ---------- */
const M = {
  shell: new THREE.MeshPhysicalMaterial({ color: 0xf8f6f1, roughness: 0.62, clearcoat: 0.15, clearcoatRoughness: 0.5 }),
  liner: new THREE.MeshStandardMaterial({ toneMapped: false, color: 0xe6bd34, roughness: 0.9, emissive: 0x6a4f00, emissiveIntensity: 0.2, side: THREE.DoubleSide }),
  oak: new THREE.MeshStandardMaterial({ color: 0xc89a1c, roughness: 0.8 }),
  foot: new THREE.MeshStandardMaterial({ color: 0xc9a032, roughness: 0.6 }),
  tint: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.12, depthWrite: false }),
  hingeTab: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.45 }),
  bar: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2c8, emissiveIntensity: 2 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, transparent: true, opacity: 0.1, envMapIntensity: 1.5, depthWrite: false }),
  led: new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffa82e, emissiveIntensity: 2.2 }),
  halo: new THREE.MeshBasicMaterial({ color: 0xffc35a, transparent: true, opacity: 0.22, depthWrite: false }),
  gold: new THREE.MeshStandardMaterial({ color: 0xc9a06a, metalness: 0.6, roughness: 0.35 }),
  alu: new THREE.MeshStandardMaterial({ color: 0xc9ced4, metalness: 0.9, roughness: 0.35 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.6 }),
  ceramic: new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.4 }),
  uv: new THREE.MeshStandardMaterial({ color: 0xb79cff, emissive: 0x8a5cff, emissiveIntensity: 2.2 }),
  mesh: new THREE.MeshStandardMaterial({ color: 0xbfbfbf, wireframe: true }),
  tray: new THREE.MeshStandardMaterial({ color: 0xf1ede5, roughness: 0.5 }),
  wick: new THREE.MeshStandardMaterial({ color: 0xd9e6ea, roughness: 1 }),
  banana: new THREE.MeshStandardMaterial({ toneMapped: false, color: 0xf2c81a, roughness: 0.5, emissive: 0x5a4200, emissiveIntensity: 0.4 }),
  tip: new THREE.MeshStandardMaterial({ color: 0x4a3a22, roughness: 0.8 }),
  stem: new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.8 }),
  vent: new THREE.MeshStandardMaterial({ color: 0x55575c, roughness: 0.7 }),
  label: new THREE.MeshStandardMaterial({ color: 0xd9d6cf, roughness: 0.6 }),
  gasket: new THREE.MeshStandardMaterial({ color: 0xdcdad5, roughness: 0.9 }),
  wireR: new THREE.MeshStandardMaterial({ color: 0xd23a2f, roughness: 0.5 }),
  wireB: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 }),
  ringLed: new THREE.MeshBasicMaterial({ color: 0xffd889, toneMapped: false }),
  btnRing: new THREE.MeshStandardMaterial({ color: 0xe0b45a, emissive: 0xffb43c, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.4 }),
  air: new THREE.MeshBasicMaterial({ color: 0x5aa9ff, transparent: true, opacity: 0 }),
};

/* ---------- product (units: 10cm) W2.6 H2.9 D2.4 ---------- */
const W = 3.2, D = 3.04, BASE = 0.4, HB = 2.8, H = BASE + HB, R = 0.34;   // 겉 케이스(AI 3D) 비율 폭1 : 높이1 : 깊이0.95
const CY0 = H / 2, LIN_Z0 = -D / 2 + 1.2;
const CY = BASE + HB / 2;               // 몸체 가운데 높이
const product = new THREE.Group(); scene.add(product);
const parts = [];
function part(name, obj, offset, labelAnchor = new THREE.Vector3()) {
  obj.userData.home = obj.position.clone();
  obj.userData.off = new THREE.Vector3(...offset);
  product.add(obj);
  const el = document.createElement('div'); el.className = 'xv-label'; el.textContent = name; labelLayer.appendChild(el);
  parts.push({ obj, el, anchor: labelAnchor });
  return obj;
}
function rrect(w, h, r, s = new THREE.Shape()) {
  s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}
const BEV = 0.1;
function rrect2(w, h, rt, rb, s = new THREE.Shape()) {
  s.moveTo(-w / 2 + rb, -h / 2); s.lineTo(w / 2 - rb, -h / 2); if (rb) s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + rb);
  s.lineTo(w / 2, h / 2 - rt); if (rt) s.quadraticCurveTo(w / 2, h / 2, w / 2 - rt, h / 2); s.lineTo(-w / 2 + rt, h / 2);
  if (rt) s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - rt); s.lineTo(-w / 2, -h / 2 + rb); if (rb) s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + rb, -h / 2);
  return s;
}

// 안쪽 색: 위가 밝고 아래로 갈수록 조금 진하게(높이만으로 색을 정해 벽끼리 이음새가 안 보임)
const LIN_TOP = new THREE.Color(0xfbf3e2), LIN_BOT = new THREE.Color(0xead9b8);
M.linerGrad = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false });
function gradPlane(w, h, x, y, z, rx) {
  const geo = new THREE.PlaneGeometry(w, h, 8, 16), pos = geo.attributes.position, col = [], c = new THREE.Color(), yh = (HB - 0.5) / 2;
  for (let i = 0; i < pos.count; i++) {
    const wy = rx ? y : y + pos.getY(i);                 // 천장·바닥은 한 높이, 벽은 높이마다
    const t = THREE.MathUtils.clamp((wy + yh) / (2 * yh), 0, 1); c.copy(LIN_BOT).lerp(LIN_TOP, Math.pow(t, 0.8)); col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return geo;
}
// 1. 겉 케이스 — 모서리 둥근 상자. 흰 몸체·색 하단은 높이로 칠하고, 앞 둥근 창 자리는 뚫어 안이 보이게
const SHELL = { s: new THREE.Vector3(1, 1, 1), hole: new THREE.Vector2(0, 0.165), holeR: 1.0, seam: BASE - H / 2 };   // 몸체 가운데 기준(앞 = -z, 뒤에서 180° 돌림)
const WIN_C = new THREE.Vector2(-SHELL.hole.x, CY0 + SHELL.hole.y), WIN_R = SHELL.holeR, FRONT_Z = D / 2;   // 회전(앞=+z) 뒤 창 가운데
// 하단 색 — 노랑(기본)·보라·빨강. 몸체·창은 그대로, 하단·창 빛 링·버튼 링이 같은 색으로 바뀝니다
const COLORS = {
  yellow: { a: 0xe8b52a, b: 0xe8b52a, grain: 0, led: 0xffc83c },
  purple: { a: 0x9a5fc0, b: 0x9a5fc0, grain: 0, led: 0xb36ad8 },
  red: { a: 0xe4573f, b: 0xe4573f, grain: 0, led: 0xff5a3c },
};
// 빛 링은 고른 하단 색과 같은 색으로 켜집니다(색을 바꾸면 부드럽게 넘어감)
const LED = { inner: null, cur: new THREE.Color(0xffc83c), tgt: new THREE.Color(0xffc83c) };
const BASE_COL = { a: { value: new THREE.Color() }, b: { value: new THREE.Color() }, grain: { value: 0 } };
function setColor(k) {
  const c = COLORS[k] || COLORS.yellow;
  BASE_COL.a.value.set(c.a); BASE_COL.b.value.set(c.b); BASE_COL.grain.value = c.grain; LED.tgt.set(c.led);
  document.querySelectorAll('[data-xv-color]').forEach(b => b.classList.toggle('on', b.dataset.xvColor === k));
}
window.xvSetColor = setColor;
M.case = new THREE.MeshPhysicalMaterial({ color: 0xf6f3ec, roughness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.45, transparent: true, opacity: 1 });
M.case.onBeforeCompile = sh => {
  Object.assign(sh.uniforms, { uBaseA: BASE_COL.a, uBaseB: BASE_COL.b, uGrain: BASE_COL.grain, uScale: { value: SHELL.s }, uHole: { value: SHELL.hole }, uHoleR: { value: SHELL.holeR }, uSeam: { value: SHELL.seam } });
  sh.vertexShader = 'uniform vec3 uScale;\nvarying vec3 vS;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvS = position * uScale;');
  sh.fragmentShader = 'uniform vec3 uBaseA; uniform vec3 uBaseB; uniform float uGrain; uniform vec2 uHole; uniform float uHoleR; uniform float uSeam;\nvarying vec3 vS;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
    if (vS.z < 0.0 && length(vS.xy - uHole) < uHoleR) discard;
    if (vS.y < uSeam) {
      float g = sin(vS.y * 70.0 + sin(vS.x * 1.3 + vS.z * 1.1) * 4.0 + sin(vS.x * 7.0) * 0.6) * 0.5 + 0.5;
      diffuseColor.rgb = mix(uBaseA, uBaseB, g * uGrain);
    }
    if (abs(vS.y - uSeam) < 0.012) diffuseColor.rgb *= 0.55;`);
};
{
  const g = new THREE.Group();
  // 겉 몸체: 준보 님 이미지 비율(폭1:높이1:깊이0.95)의 모서리 둥근 상자. AI 3D 모형은 뒤 윗모서리가 울퉁불퉁해 매끈한 면으로 다시 만듦
  const shell = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 10, 0.42), M.case);
  shell.rotation.y = Math.PI; shell.position.set(0, H / 2, 0); shell.castShadow = true; g.add(shell);
  // 안쪽 라이너(천장·바닥·양옆·뒷벽) — 크림색, 창으로 보이는 안쪽 방
  const iw = W - 0.42, ih = HB - 0.5, iz0 = LIN_Z0, iz1 = D / 2 - 0.45;
  const ld = iz1 - iz0, lz = (iz0 + iz1) / 2;
  [[iw, ih, 0, 0, iz0, 0, 0], [ld, ih, -iw / 2, 0, lz, 0, Math.PI / 2], [ld, ih, iw / 2, 0, lz, 0, -Math.PI / 2], [iw, ld, 0, ih / 2, lz, Math.PI / 2, 0], [iw, ld, 0, -ih / 2, lz, -Math.PI / 2, 0]]
    .forEach(([w, h, x, y, z, rx, ry]) => { const pl = new THREE.Mesh(gradPlane(w, h, x, y, z, rx), M.linerGrad); pl.position.set(x, CY + y, z); pl.rotation.set(rx, ry, 0); g.add(pl); });
  // 창과 안쪽 방을 잇는 둥근 통(창 테두리 안쪽)
  const tun = new THREE.Mesh(new THREE.CylinderGeometry(WIN_R + 0.01, WIN_R + 0.01, FRONT_Z - iz1 + 0.02, 64, 1, true), M.linerGrad.clone());
  tun.material = new THREE.MeshStandardMaterial({ color: 0xf3ead6, roughness: 0.8, side: THREE.DoubleSide }); tun.rotation.x = Math.PI / 2; tun.position.set(WIN_C.x, WIN_C.y, (FRONT_Z + iz1) / 2 - 0.02); g.add(tun);
  const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 24), M.ceramic); mount.position.set(WIN_C.x, CY + ih / 2 - 0.03, 0.55); g.add(mount);
  const bar = new THREE.Mesh(new RoundedBoxGeometry(iw - 0.3, 0.03, 0.08, 2, 0.015), M.bar); bar.position.set(0, CY + ih / 2 - 0.03, 0.85); g.add(bar);
  const light = new THREE.PointLight(0xffe2a8, 1.2, 3.6, 1.5); light.position.set(0, CY + 0.5, 0.6); g.add(light); LED.inner = light;
  part('겉 케이스 · 흰 몸체 + 하단(노랑·보라·빨강)', g, [0, 0, 0], new THREE.Vector3(W / 2 - 0.3, 0.5, 0.9));
}
// 2. 문 — 둥근 유리창 + 빛 링 + 패킹·경첩 (분해 때 앞으로 빠짐)
{
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.CircleGeometry(WIN_R, 96), M.glass); glass.position.z = -0.02; g.add(glass);
  const bez = new THREE.Mesh(new THREE.RingGeometry(WIN_R + 0.02, WIN_R + 0.26, 160), new THREE.MeshPhysicalMaterial({ color: 0xf6f3ec, roughness: 0.5, clearcoat: 0.2 })); bez.position.z = 0.012; g.add(bez);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(WIN_R + 0.03, 0.02, 16, 160), M.ringLed); ring.position.z = 0.02; g.add(ring);
  // 빛 번짐: 링 바깥·안쪽으로 부드럽게 퍼지는 빛(그라데이션 텍스처)
  const glowS = (WIN_R + 0.45) * 2, cv = document.createElement('canvas'); cv.width = cv.height = 512;
  { const x = cv.getContext('2d'), r1 = 256 * (WIN_R + 0.03) / (glowS / 2), gr = x.createRadialGradient(256, 256, r1 - 40, 256, 256, 256);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(40 / (296 - r1 + 40) * 0.5, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 512, 512); }
  M.glow = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), color: 0xffc85a, transparent: true, opacity: 0.75, depthWrite: false, toneMapped: false });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(glowS, glowS), M.glow); halo.position.z = 0.03; g.add(halo);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(WIN_R - 0.01, 0.03, 12, 160), M.gasket); frame.position.z = -0.05; frame.scale.z = 0.6; g.add(frame);
  const gasket = new THREE.Mesh(new THREE.TorusGeometry(WIN_R + 0.12, 0.035, 10, 160), M.gasket); gasket.position.z = -0.12; g.add(gasket);
  [0.55, -0.55].forEach(y => { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 16), M.alu); h.position.set(-(WIN_R + 0.18), y, -0.1); g.add(h); });
  g.position.set(WIN_C.x, WIN_C.y, FRONT_Z - 0.01);
  part('문 · 둥근 유리창 · 빛 링(모드 색) · 패킹 · 경첩', g, [0, 0, 2.6], new THREE.Vector3(0, WIN_R + 0.15, 0));
}
// 3. 버튼 1개 — 누를 때마다 바나나(노랑)→고구마(주황)→토마토(빨강)
{
  const g = new THREE.Group();
  const bring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.013, 12, 64), M.btnRing); g.add(bring);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.02, 48), M.case.clone()); cap.material = new THREE.MeshStandardMaterial({ color: 0xf6f3ec, roughness: 0.5 }); cap.rotation.x = Math.PI / 2; g.add(cap);
  const sw = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.08), M.dark); sw.position.z = -0.08; g.add(sw);
  g.position.set(WIN_C.x, BASE + 0.17, FRONT_Z + 0.005);
  part('버튼 1개 · 누를 때마다 바나나→고구마→토마토', g, [0, -0.3, 1.6], new THREE.Vector3(0, -0.15, 0));
}
// 4. 바나나 + 고리 — 천장 받침에서 짧은 막대·S고리로 걸고, 실제 바나나처럼(모난 단면·초록 꼭지·갈색 끝)
{
  const g = new THREE.Group();
  const CEIL = CY + (HB - 0.5) / 2, CROWN = WIN_C.y + 0.62;   // 송이 꼭지 = 창 위쪽 1/5
  const L = CEIL - CROWN - 0.16;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 32), M.ceramic); cap.position.y = CEIL - CROWN - 0.02; g.add(cap);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, L, 12), M.ceramic); rod.position.y = 0.16 + L / 2; g.add(rod);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.011, 10, 32, Math.PI * 1.5), M.ceramic); hook.rotation.z = Math.PI * 0.75; hook.position.y = 0.1; g.add(hook);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.075, 0.13, 7), M.stem); crown.position.y = 0.0; g.add(crown);
  const cTop = new THREE.Color(0x9a9a3a), cBody = new THREE.Color(0xf5c518), cBody2 = new THREE.Color(0xeab010), cTip = new THREE.Color(0x3b2a18);
  const mat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.6, sheen: 0.3 });
  const SEG = 48, RAD = 20;
  // [꼭지에서 뻗는 방향(앞=0), 길이, 굵기, 처짐] — 송이가 좌우로 부채처럼 퍼지고 끝은 안쪽으로 굽음
  [[-1.25, 0.95, 0.1, 1.0], [-0.65, 1.05, 0.11, 0.95], [0.0, 1.1, 0.115, 0.9], [0.62, 1.04, 0.11, 0.95], [1.2, 0.95, 0.1, 1.0], [-0.3, 0.92, 0.1, 1.05], [0.35, 0.9, 0.1, 1.05]]
    .forEach(([phi, len, th, sag], i) => {
      const back = i >= 5 ? -1 : 1;                       // 뒤쪽 줄 2개
      const prof = [[0, 0], [0.12, -0.04], [0.3, -0.22], [0.42, -0.5], [0.44, -0.8], [0.36, -1.02]];
      const pts = prof.map(([r, y]) => new THREE.Vector3(Math.sin(phi) * r * len, y * len * sag * 0.95, Math.cos(phi) * r * len * 0.45 * back));
      const curve = new THREE.CatmullRomCurve3(pts);
      const geo = new THREE.TubeGeometry(curve, SEG, th, RAD);
      const pos = geo.attributes.position, v = new THREE.Vector3(), col = [], c = new THREE.Color();
      for (let s = 0; s <= SEG; s++) {
        const t = s / SEG, p = curve.getPointAt(t);
        const f = t < 0.14 ? 0.32 + 0.68 * Math.pow(t / 0.14, 1.6) : t > 0.86 ? Math.max(0.22, 1 - Math.pow((t - 0.86) / 0.14, 1.3) * 0.8) : 1;
        for (let j = 0; j <= RAD; j++) {
          const vi = s * (RAD + 1) + j, a = j / RAD * Math.PI * 2;
          const ridge = 1 + 0.07 * Math.cos(a * 5);                      // 다섯 모서리 단면
          v.fromBufferAttribute(pos, vi).sub(p).multiplyScalar(f * ridge).add(p); pos.setXYZ(vi, v.x, v.y, v.z);
          if (t < 0.12) c.copy(cTop).lerp(cBody, t / 0.12); else if (t > 0.95) c.copy(cTip); else c.copy(cBody).lerp(cBody2, 0.5 + 0.5 * Math.sin(t * 9 + i));
          col.push(c.r, c.g, c.b);
        }
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      geo.computeVertexNormals();
      g.add(new THREE.Mesh(geo, mat));
    });
  g.position.set(WIN_C.x, CROWN, 0.55);
  part('바나나 고리 · 눌림 방지', g, [0, 1.5, 0.9], new THREE.Vector3(-0.5, -0.4, 0.3));
}
// 5. 바닥 트레이 + 심지 (물 되돌림)
{
  const g = new THREE.Group();
  const t = new THREE.Mesh(new RoundedBoxGeometry(W - 0.62, 0.1, D - 1.1, 3, 0.04), M.tray); g.add(t);
  const w = new THREE.Mesh(new THREE.BoxGeometry(W - 0.8, 0.03, D - 1.3), M.wick); w.position.y = 0.06; g.add(w);
  g.position.set(0, BASE * 0.45, 0.3);   // 하단 몸통 안 서랍
  part('물받이 트레이 + 심지 · 습도 85~95%', g, [0, 0, 2.0], new THREE.Vector3(-(W - 0.62) / 2, 0, 0));
}
// 뒤쪽 냉각 모듈 (라이너 뒷벽 뒤 → 뒷커버까지)
const backZ = LIN_Z0 - 0.42;
const COOL_Y = CY + 0.35;
// 6. UV-A LED + 광촉매 망
{
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9, 10, 10), M.mesh); g.add(m);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.03), new THREE.MeshStandardMaterial({ color: 0xe8e8e8 }));
  frame.position.z = -0.03; g.add(frame);
  [-0.25, 0.25].forEach(x => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), M.uv); l.position.set(x, 0.55, 0.02); g.add(l); });
  g.position.set(0, COOL_Y, backZ + 0.36);
  part('UV-A LED + 광촉매 망 · 에틸렌 분해', g, [0, 2.3, -0.2], new THREE.Vector3(0.5, 0.5, 0));
}
function sink(fins, fd = 0.2) {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.06), M.alu); g.add(plate);
  for (let i = 0; i < fins; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.0, fd), M.alu); f.position.set(-0.45 + i * (0.9 / (fins - 1)), 0, 0.03 + fd / 2); g.add(f); }
  return g;
}
function fan(size = 0.9, wired = true) {
  const g = new THREE.Group();
  // 사각 프레임 + 둥근 구멍 + 모서리 나사 구멍
  const s = rrect(size, size, 0.06);
  const hole = new THREE.Path(); hole.absarc(0, 0, size * 0.46, 0, Math.PI * 2, true); s.holes.push(hole);
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([x, y]) => { const h = new THREE.Path(); h.absarc(x * size * 0.4, y * size * 0.4, 0.025, 0, Math.PI * 2, true); s.holes.push(h); });
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false, curveSegments: 32 }), M.dark); frame.position.z = -0.06; g.add(frame);
  const rotor = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 32), M.dark); hub.rotation.x = Math.PI / 2; rotor.add(hub);
  const sticker = new THREE.Mesh(new THREE.CircleGeometry(0.1, 32), M.ceramic); sticker.position.z = 0.051; rotor.add(sticker);
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.012), M.dark);
    const a = i / 7 * Math.PI * 2;
    b.position.set(Math.cos(a) * 0.26, Math.sin(a) * 0.26, 0); b.rotation.z = a; b.rotation.x = 0.45; rotor.add(b);
  }
  rotor.userData.spin = true; g.add(rotor);
  // 전선
  const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(size * 0.45, -size * 0.3, 0), new THREE.Vector3(size * 0.6, -size * 0.4, 0.05), new THREE.Vector3(size * 0.62, -size * 0.6, 0.1)]), 12, 0.01, 6), M.wireR);
  if (wired) g.add(wire);
  return g;
}
// 7. 안쪽 방열판 + 순환 팬
{
  const g = new THREE.Group();
  const s = sink(9); s.rotation.y = Math.PI; g.add(s);
  const f = fan(0.9, false); f.position.z = 0.3; g.add(f);
  g.position.set(0, COOL_Y, backZ + 0.05);
  part('안쪽 방열판 + 순환 팬 40mm · 0.1~0.3m/s', g, [0, 1.7, -1.1], new THREE.Vector3(0, -0.6, 0.3));
}
// 8. 펠티어 소자 (TEC1-12706급) + 빨강·검정 전선
{
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.02), M.ceramic); top.position.z = 0.02; g.add(top);
  const bot = top.clone(); bot.position.z = -0.02; g.add(bot);
  const mid = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.02), new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.5, roughness: 0.4 })); g.add(mid);
  [[M.wireR, 0.05], [M.wireB, -0.05]].forEach(([m, y]) => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.2, y, 0), new THREE.Vector3(-0.4, y - 0.05, 0.02), new THREE.Vector3(-0.55, y - 0.2, 0.05)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 12, 0.012, 6), m));
  });
  g.position.set(0, COOL_Y, backZ - 0.15);
  part('펠티어 소자 · 14°C 유지', g, [0, 2.5, -1.9], new THREE.Vector3(0, 0.45, 0));
}
// 9. 바깥 방열판 + 배기 팬
{
  const g = new THREE.Group();
  const s = sink(11); g.add(s);
  const f = fan(); f.position.z = 0.3; g.add(f);
  g.position.set(0, COOL_Y, backZ - 0.3);
  g.rotation.y = Math.PI;
  part('바깥 방열판 + 배기 팬', g, [0, 1.7, -2.7], new THREE.Vector3(0, -0.6, 0));
}
// 10. 뒷커버 — 위 배기 슬릿 · 아래 흡기 슬릿 · 12V 전원 단자 · 명판
{
  const g = new THREE.Group();
  const panel = new THREE.Mesh(new RoundedBoxGeometry(W - 1.1, HB - 0.7, 0.08, 6, 0.04), new THREE.MeshPhysicalMaterial({ color: 0xf6f3ec, roughness: 0.55, clearcoat: 0.2 })); panel.position.z = -0.025; g.add(panel);
  const slot = (y, n, w) => { for (let i = 0; i < n; i++) { const sl = new THREE.Mesh(new RoundedBoxGeometry(w, 0.05, 0.02, 2, 0.02), M.vent); sl.position.set(0, y - i * 0.1, -0.065); g.add(sl); } };
  slot(0.85, 6, 1.3);   // 배기
  slot(-0.45, 3, 1.3);  // 흡기
  const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 24), M.alu); jack.rotation.x = Math.PI / 2; jack.position.set(0.75, -0.85, -0.075); g.add(jack);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.05, 16), M.vent); pin.rotation.x = Math.PI / 2; pin.position.set(0.75, -0.85, -0.08); g.add(pin);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.22), M.label); plate.rotation.y = Math.PI; plate.position.set(-0.55, -0.85, -0.062); g.add(plate);
  g.position.set(0, CY, -D / 2 + 0.06);
  part('뒷커버 · 위 배기 · 아래 흡기 · 12V 단자', g, [0, 0, -3.6], new THREE.Vector3(W / 2 - 0.15, 0.8, 0));
}
// 11. 제어 보드 — 실제 기판처럼: 구리 배선, MCU, 전원부(MOSFET+방열판), 콘덴서, 단자대, 커넥터, 온습도 센서
const PCBM = {
  board: new THREE.MeshStandardMaterial({ color: 0x1d6b45, roughness: 0.45, metalness: 0.05 }),
  trace: new THREE.MeshStandardMaterial({ color: 0xc8a24a, roughness: 0.35, metalness: 0.8 }),
  pad: new THREE.MeshStandardMaterial({ color: 0xd9d9d9, roughness: 0.3, metalness: 0.9 }),
  ic: new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.5 }),
  res: new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: 0.5 }),
  cap: new THREE.MeshStandardMaterial({ color: 0x23395d, roughness: 0.4 }),
  capTop: new THREE.MeshStandardMaterial({ color: 0xcfd3d8, roughness: 0.3, metalness: 0.8 }),
  term: new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.6 }),
  jst: new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.6 }),
  silk: new THREE.MeshBasicMaterial({ color: 0xf5f5f0 }),
  ledG: new THREE.MeshStandardMaterial({ color: 0x2bff6a, emissive: 0x18c94a, emissiveIntensity: 1.5 }),
  coil: new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.7, roughness: 0.35 }),
  uvw: new THREE.MeshStandardMaterial({ color: 0x8a5cff, roughness: 0.5 }),
};
function pcbBoard(w, h) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.03, 2, 0.01), PCBM.board));
  const tr = (x0, y0, x1, y1, t = 0.008) => { const L = Math.hypot(x1 - x0, y1 - y0), m = new THREE.Mesh(new THREE.BoxGeometry(L, t, 0.002), PCBM.trace); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0.016); m.rotation.z = Math.atan2(y1 - y0, x1 - x0); g.add(m); };
  for (let i = 0; i < 9; i++) { const y = -h / 2 + 0.06 + i * (h - 0.12) / 8; tr(-w / 2 + 0.05, y, -0.05, y); tr(-0.05, y, 0.05, y * 0.6); tr(0.05, y * 0.6, w / 2 - 0.08, y * 0.6); }
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([x, y]) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.008, 8, 20), PCBM.pad); r.position.set(x * (w / 2 - 0.04), y * (h / 2 - 0.04), 0.016); g.add(r); });
  return g;
}
{
  const g = pcbBoard(1.0, 0.62);
  // MCU (QFP, 사방 핀)
  const mcu = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.02), PCBM.ic); mcu.position.set(-0.22, 0.08, 0.025); g.add(mcu);
  for (let i = 0; i < 10; i++) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const pin = new THREE.Mesh(new THREE.BoxGeometry(dx ? 0.025 : 0.005, dx ? 0.005 : 0.025, 0.004), PCBM.pad);
    const o = -0.06 + i * 0.0133; pin.position.set(-0.22 + (dx ? dx * 0.08 : o), 0.08 + (dy ? dy * 0.08 : o), 0.018); g.add(pin);
  }
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.008, 12), PCBM.silk); dot.position.set(-0.27, 0.13, 0.036); g.add(dot);
  // 수정 발진자 · 칩 저항/콘덴서
  const xt = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.025, 0.02, 2, 0.008), PCBM.pad); xt.position.set(-0.22, -0.04, 0.025); g.add(xt);
  for (let i = 0; i < 12; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.012, 0.008), i % 2 ? PCBM.ic : PCBM.res); r.position.set(-0.42 + (i % 4) * 0.04, -0.06 - Math.floor(i / 4) * 0.04, 0.02); g.add(r); }
  // 전원부: MOSFET(TO-220) 2개 + 방열판 — 펠티어·팬 PWM 구동
  [0.12, 0.24].forEach(x => {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.1), PCBM.ic); body.position.set(x, 0.2, 0.065); g.add(body);
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.008, 0.06), PCBM.pad); tab.position.set(x, 0.216, 0.14); g.add(tab);
    for (let k = -1; k <= 1; k++) { const lg = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.05), PCBM.pad); lg.position.set(x + k * 0.025, 0.2, 0.02); g.add(lg); }
  });
  for (let i = 0; i < 7; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.008, 0.14), M.alu); f.position.set(0.18, 0.235 + i * 0.012, 0.09); g.add(f); }
  // 전해 콘덴서(은색 윗면)
  [[0.38, 0.12, 0.05], [0.38, -0.02, 0.05], [0.03, -0.18, 0.035], [0.1, -0.18, 0.035]].forEach(([x, y, r]) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.14, 24), PCBM.cap); c.rotation.x = Math.PI / 2; c.position.set(x, y, 0.085); g.add(c);
    const t = new THREE.Mesh(new THREE.CircleGeometry(r * 0.9, 24), PCBM.capTop); t.position.set(x, y, 0.156); g.add(t);
  });
  // 인덕터(코일)
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.02, 12, 24), PCBM.coil); coil.position.set(0.24, 0.02, 0.04); g.add(coil);
  // 12V 입력 단자대(초록, 나사 2개)
  const tb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.08), PCBM.term); tb.position.set(0.4, -0.24, 0.055); g.add(tb);
  [0.36, 0.44].forEach(x => { const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.01, 16), PCBM.pad); sc.rotation.x = Math.PI / 2; sc.position.set(x, -0.24, 0.1); g.add(sc); });
  // 커넥터(JST) 6개: 펠티어 · 팬2 · LED · UV · 버튼
  for (let i = 0; i < 6; i++) { const j = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.05), PCBM.jst); j.position.set(-0.42 + i * 0.085, 0.265, 0.04); g.add(j); }
  // 온습도 센서(SHT40) · 상태 LED
  const sht = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.015), PCBM.jst); sht.position.set(-0.4, 0.22, 0.025); g.add(sht);
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 0.01), PCBM.ledG); led.position.set(-0.05, -0.26, 0.022); g.add(led);
  g.rotation.x = -Math.PI / 2; g.position.set(0, BASE * 0.42, -D / 2 + 0.6);   // 하단 몸통 안 뒤쪽에 눕힘
  part('제어 보드 · MCU · MOSFET 구동부 · 12V 단자 · 온습도 센서', g, [2.2, 1.9, -0.5], new THREE.Vector3(-0.5, 0.1, 0));
}
// 12. 단열재(발포 우레탄) — 겉 몸체와 안쪽 라이너 사이
{
  const g = new THREE.Group();
  const foam = new THREE.MeshStandardMaterial({ color: 0xf3e6b5, roughness: 0.95 });
  const iw = W - 0.42, ih = HB - 0.5, t = 0.1, d = D / 2 - 0.45 - LIN_Z0, zc = (D / 2 - 0.45 + LIN_Z0) / 2;
  [[iw + 2 * t, t, d, 0, ih / 2 + t / 2, zc], [iw + 2 * t, t, d, 0, -ih / 2 - t / 2, zc], [t, ih, d, -iw / 2 - t / 2, 0, zc], [t, ih, d, iw / 2 + t / 2, 0, zc], [iw + 2 * t, ih + 2 * t, t, 0, 0, -0.05]]
    .forEach(([w, h, dd, x, y, z]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), foam); m.position.set(x, CY + y, z); g.add(m); });
  g.userData.inner = true;   // 겉이 불투명할 땐 숨김(둥근 모서리 밖으로 비치지 않게)
  part('단열재 · 발포 우레탄 2.5cm', g, [-3.0, 0.2, 0.3], new THREE.Vector3(-W / 2, ih / 2 + 0.2, 0.5));
}
// 13. 배선 하네스 — 보드에서 펠티어·팬·LED·UV·버튼으로(빨강 +12V, 검정 GND, 흰 신호)
{
  const g = new THREE.Group();
  const by = BASE * 0.5, bz = -D / 2 + 0.6;
  const runs = [
    [M.wireR, [[-0.3, by, bz], [-0.3, CY, backZ - 0.05], [0, COOL_Y, backZ - 0.15]]],
    [M.wireB, [[-0.26, by, bz], [-0.26, CY, backZ - 0.08], [0.04, COOL_Y, backZ - 0.15]]],
    [M.wireR, [[-0.15, by, bz], [-0.5, CY - 0.4, backZ - 0.2], [-0.45, COOL_Y - 0.4, backZ - 0.3]]],
    [PCBM.jst, [[0, by, bz], [-(W - 0.42) / 2 - 0.05, CY, -0.2], [-(W - 0.42) / 2 - 0.05, H - 0.3, 0.2], [0, H - 0.26, 0.75]]],
    [PCBM.jst, [[0.1, by, bz], [1.0, BASE + 0.1, 0.2], [0.2, BASE + 0.05, D / 2 - 0.2]]],
    [PCBM.uvw, [[0.2, by, bz], [0.6, COOL_Y + 0.3, backZ + 0.1], [0.3, COOL_Y + 0.55, backZ + 0.36]]],
  ];
  runs.forEach(([m, p]) => {
    const c = new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.014, 6), m));
    const plug = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.05), PCBM.jst); plug.position.copy(c.getPoint(1)); g.add(plug);
  });
  const c0 = new THREE.CatmullRomCurve3(runs[0][1].map(v => new THREE.Vector3(...v)));
  [0.25, 0.5].forEach(t => { const tie = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 16), M.dark); tie.position.copy(c0.getPoint(t)); g.add(tie); });
  g.userData.inner = true;
  part('배선 하네스 · +12V · GND · 신호선', g, [1.2, -0.2, -1.5], new THREE.Vector3(-1.05, CY, -0.2));
}
// 14. 12V 외장 어댑터 + DC 케이블
{
  const g = new THREE.Group();
  const brick = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.28, 0.42, 4, 0.06), M.dark); g.add(brick);
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.14), M.label); lbl.rotation.x = -Math.PI / 2; lbl.position.y = 0.141; g.add(lbl);
  const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.35, 0, 0), new THREE.Vector3(-0.8, -0.1, 0.3), new THREE.Vector3(-0.9, 0.4, 0.9), new THREE.Vector3(-0.7, 0.75, 1.2)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.025, 8), M.dark));
  const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 16), M.dark); plug.position.copy(c.getPoint(1)); g.add(plug);
  g.position.set(0.9, 0.14, -D / 2 - 0.9);
  part('12V 외장 어댑터 · 60W', g, [1.2, 0, -2.2], new THREE.Vector3(0.35, 0.2, 0));
}

/* airflow arrows (show in assembled state) */
const airG = new THREE.Group(); product.add(airG);
{
  const pts = [new THREE.Vector3(0, H - 0.6, backZ + 0.5), new THREE.Vector3(0, H - 0.5, 0.4), new THREE.Vector3(0.6, CY + 0.2, 0.7), new THREE.Vector3(0.3, BASE + 0.5, 0.6), new THREE.Vector3(0, BASE + 0.55, backZ + 0.5)];
  const c = new THREE.CatmullRomCurve3(pts, true);
  airG.add(new THREE.Mesh(new THREE.TubeGeometry(c, 80, 0.018, 6, true), M.air));
  airG.userData.curve = c;
  for (let i = 0; i < 10; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), M.air); d.userData.t = i / 10; airG.add(d); }
}

/* 바닥 그림자 */
const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.09 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -H / 2 - 0.001; ground.receiveShadow = true; scene.add(ground);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 8;
Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 });
product.traverse(o => { if (o.isMesh && o.material !== M.glass && o.material !== M.halo && o.material !== M.air) o.castShadow = true; });
product.position.y = -H / 2;

/* ---------- scroll ---------- */
const forced = new URLSearchParams(location.search).get('p');
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
function progress() {
  if (forced !== null) return +forced;
  const r = sec.getBoundingClientRect();
  return clamp(-r.top / (r.height - innerHeight));
}

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const tmp = new THREE.Vector3();
let t0 = performance.now();
function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - t0) / 1000)); t0 = now;
  const p = progress();
  // 0~.1 앞모습 · .1~.28 뒤로 돌아 뒷모습 · .28~.5 분해 · .5~.74 분해 유지(천천히 돎) · .74~.95 다시 조립하며 앞으로
  const e = p < 0.28 ? 0 : p < 0.5 ? ease((p - 0.28) / 0.22) : p < 0.74 ? 1 : p < 0.95 ? 1 - ease((p - 0.74) / 0.21) : 0;
  parts.forEach(({ obj }) => obj.position.copy(obj.userData.home).addScaledVector(obj.userData.off, e));
  // 겉 케이스: 분해 직전에 반투명해져 속이 보이고, 조립 끝나면 다시 불투명
  const ghost = p < 0.26 ? 0 : p < 0.34 ? (p - 0.26) / 0.08 : p < 0.8 ? 1 : p < 0.92 ? 1 - (p - 0.8) / 0.12 : 0;
  M.case.opacity = 1 - 0.86 * ghost; M.case.depthWrite = ghost < 0.01;
  parts.forEach(({ obj }) => { if (obj.userData.inner) obj.visible = ghost > 0.02; });

  const FRONT = 0.38, BACK = Math.PI + 0.55, XA = 0.85, XB = 1.25;
  const ang = p < 0.1 ? FRONT
    : p < 0.28 ? FRONT + (BACK - FRONT) * ease((p - 0.1) / 0.18)
    : p < 0.5 ? BACK + (XA - BACK) * ease((p - 0.28) / 0.22)
    : p < 0.74 ? XA + (XB - XA) * ((p - 0.5) / 0.24)
    : p < 0.95 ? XB + (FRONT - XB) * ease((p - 0.74) / 0.21) : FRONT;
  ground.material.opacity = 0.09 * (1 - e);
  const dist = 12 + e * 6.5;
  camera.position.set(Math.sin(ang) * dist, 1.2 + e * 3.4, Math.cos(ang) * dist);
  camera.lookAt(0, -0.05 + e * 0.6, -e * 0.6);
  const fk = new URLSearchParams(location.search).get('focus');   // 부품 가까이 보기(캡처용): ?p=0.6&focus=제어
  if (fk) { const pt = parts.find(q => q.el.textContent.includes(fk)); if (pt) { const c = new THREE.Box3().setFromObject(pt.obj).getCenter(new THREE.Vector3()); camera.position.set(c.x + 1.0, c.y + 1.3, c.z + 1.0); camera.lookAt(c); } }

  // 빛 링: 고른 하단 색으로 숨 쉬듯 켜짐(색 단추를 누르면 부드럽게 넘어감)
  LED.cur.lerp(LED.tgt, 0.08);
  // 화면에 처음 보일 때 1.8초 동안 서서히 켜짐
  if (LED.t0 === undefined && sec.getBoundingClientRect().top < innerHeight) LED.t0 = now;
  const ramp = LED.t0 === undefined ? 0 : Math.min(1, (now - LED.t0) / 1800), on = ramp * ramp * (3 - 2 * ramp);
  const breathe = on * (0.85 + 0.15 * Math.sin(now / 420));
  M.ringLed.color.copy(LED.cur).lerp(new THREE.Color(0xffffff), 0.18).lerp(new THREE.Color(0xe8e4dc), 1 - on);
  if (M.glow) { M.glow.color.copy(LED.cur); M.glow.opacity = 0.9 * breathe; }
  if (LED.inner) { LED.inner.color.copy(LED.cur).lerp(new THREE.Color(0xfff2d8), 0.6); LED.inner.intensity = 1.2 * breathe; }
  M.btnRing.color.copy(LED.cur); M.btnRing.emissive.copy(LED.cur).multiplyScalar(on);
  // spin fans
  product.traverse(o => { if (o.userData.spin) o.rotation.z += dt * (2 + 10 * (1 - e)); });

  // airflow visible when assembled near the end/start
  const airOn = p > 0.96 ? 0.85 : 0;
  M.air.opacity += (airOn - M.air.opacity) * 0.1;
  const c = airG.userData.curve;
  airG.children.forEach(ch => { if (ch.userData.t !== undefined) { ch.userData.t = (ch.userData.t + dt * 0.12) % 1; ch.position.copy(c.getPointAt(ch.userData.t)); } });

  renderer.render(scene, camera);

  // labels
  const w = canvas.clientWidth, h = canvas.clientHeight, lab = [];
  parts.forEach(({ obj, el, anchor }) => {
    tmp.copy(anchor); obj.localToWorld(tmp); tmp.project(camera);
    const sx = (tmp.x * 0.5 + 0.5) * w, sy = (-tmp.y * 0.5 + 0.5) * h;
    lab.push({ el, sx, sy, w: el.offsetWidth || 160, h: el.offsetHeight || 30 });
    el.style.opacity = clamp((e - 0.7) / 0.3);
  });
  // 이름표 겹침 풀기: 위에서부터 차례로, 겹치면 아래로 밀어냄
  lab.sort((a, b) => a.sy - b.sy);
  for (let i = 0; i < lab.length; i++) for (let j = 0; j < i; j++) {
    const a = lab[j], b = lab[i];
    if (Math.abs(a.sx - b.sx) < (a.w + b.w) / 2 + 6 && Math.abs(a.sy - b.sy) < (a.h + b.h) / 2 + 4) b.sy = a.sy + (a.h + b.h) / 2 + 4;
  }
  lab.forEach(({ el, sx, sy }) => { el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%,-50%)`; });

  // steps
  const idx = p < 0.1 ? 0 : p < 0.3 ? 1 : p < 0.76 ? 2 : 3;
  stepEls.forEach((s, i) => s.classList.toggle('on', i === idx));
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setColor(new URLSearchParams(location.search).get('c') || 'yellow');
document.querySelectorAll('[data-xv-color]').forEach(b => b.addEventListener('click', () => setColor(b.dataset.xvColor)));
document.documentElement.classList.add('xv-ready');
