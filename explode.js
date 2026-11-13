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
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.add(new THREE.HemisphereLight(0xffffff, 0xe9e4da, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(4, 6, 5); scene.add(sun);

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

/* ---------- materials ---------- */
const M = {
  shell: new THREE.MeshPhysicalMaterial({ color: 0xf6f3ee, roughness: 0.55, clearcoat: 0.3 }),
  liner: new THREE.MeshStandardMaterial({ color: 0xfbf8f1, roughness: 0.8 }),
  oak: new THREE.MeshStandardMaterial({ color: 0xd8b98b, roughness: 0.7 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 0.9, thickness: 0.05, transparent: true, opacity: 0.35 }),
  led: new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffc21a, emissiveIntensity: 1.6 }),
  alu: new THREE.MeshStandardMaterial({ color: 0xc9ced4, metalness: 0.9, roughness: 0.35 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.6 }),
  ceramic: new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.4 }),
  uv: new THREE.MeshStandardMaterial({ color: 0xb79cff, emissive: 0x8a5cff, emissiveIntensity: 2.2 }),
  mesh: new THREE.MeshStandardMaterial({ color: 0xd9d9d9, wireframe: true }),
  tray: new THREE.MeshStandardMaterial({ color: 0xe9eef2, roughness: 0.5 }),
  wick: new THREE.MeshStandardMaterial({ color: 0xcfe3ea, roughness: 1 }),
  banana: new THREE.MeshStandardMaterial({ color: 0xf5cd2b, roughness: 0.6 }),
  stem: new THREE.MeshStandardMaterial({ color: 0x7a5a2e, roughness: 0.8 }),
  air: new THREE.MeshBasicMaterial({ color: 0x5aa9ff, transparent: true, opacity: 0 }),
};

/* ---------- product (units: 10cm) W2.5 H2.8 D2.3 ---------- */
const W = 2.5, H = 2.8, D = 2.3, BASE = 0.35;
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

// 1. 몸체(바깥 껍데기) — 앞이 열린 상자
{
  const g = new THREE.Group();
  const t = 0.12;
  const top = new THREE.Mesh(new RoundedBoxGeometry(W, t, D, 4, 0.05), M.shell); top.position.y = H - t / 2; g.add(top);
  const l = new THREE.Mesh(new RoundedBoxGeometry(t, H - BASE, D, 4, 0.05), M.shell); l.position.set(-W / 2 + t / 2, (H + BASE) / 2, 0); g.add(l);
  const r = l.clone(); r.position.x = W / 2 - t / 2; g.add(r);
  const bot = new THREE.Mesh(new THREE.BoxGeometry(W, t, D), M.shell); bot.position.y = BASE + t / 2; g.add(bot);
  const inner = new THREE.Mesh(new THREE.BoxGeometry(W - 0.3, H - BASE - 0.3, 0.04), M.liner); inner.position.set(0, (H + BASE) / 2, -D / 2 + 0.75); g.add(inner);
  part('몸체 · 단열 2.5cm', g, [0, 0, 0], new THREE.Vector3(-W / 2, H - 0.2, 0));
}
// 2. 받침(오크)
{
  const m = new THREE.Mesh(new RoundedBoxGeometry(W, BASE, D, 4, 0.08), M.oak); m.position.y = BASE / 2;
  part('받침 띠 · 색으로 라인업', m, [0, -1.3, 0], new THREE.Vector3(W / 2, BASE / 2, 0));
}
// 3. 문 + 둥근 창 + LED 링 + 버튼 4개
{
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  const w = W, h = H - BASE, r = 0.18;
  shape.moveTo(-w / 2 + r, 0); shape.lineTo(w / 2 - r, 0); shape.quadraticCurveTo(w / 2, 0, w / 2, r);
  shape.lineTo(w / 2, h - r); shape.quadraticCurveTo(w / 2, h, w / 2 - r, h); shape.lineTo(-w / 2 + r, h);
  shape.quadraticCurveTo(-w / 2, h, -w / 2, h - r); shape.lineTo(-w / 2, r); shape.quadraticCurveTo(-w / 2, 0, -w / 2 + r, 0);
  const hole = new THREE.Path(); hole.absarc(0, h * 0.56, 0.82, 0, Math.PI * 2, true); shape.holes.push(hole);
  const door = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), M.shell);
  g.add(door);
  const gl = new THREE.Mesh(new THREE.CircleGeometry(0.82, 64), M.glass); gl.position.set(0, h * 0.56, 0.05); g.add(gl);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.035, 16, 96), M.led); ring.position.set(0, h * 0.56, 0.12); g.add(ring);
  const cols = [0xf4c21a, 0x9b5f86, 0xef5b4c, 0xffffff];
  cols.forEach((c, i) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 32), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }));
    b.rotation.x = Math.PI / 2; b.position.set(-0.36 + i * 0.24, 0.28, 0.13); g.add(b);
  });
  g.position.set(0, BASE, D / 2 - 0.02);
  part('문 · 둥근 창 + LED 링 · 버튼 4개', g, [0, 0, 2.4], new THREE.Vector3(0, h + 0.15, 0.1));
}
// 4. 바나나 + 고리
{
  const g = new THREE.Group();
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 24, Math.PI * 1.3), M.ceramic); hook.position.y = 0.05; g.add(hook);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25), M.ceramic); rod.position.y = 0.25; g.add(rod);
  for (let i = 0; i < 5; i++) {
    const a = (i - 2) * 0.32;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.02, 0),
      new THREE.Vector3(Math.sin(a) * 0.25, -0.45, Math.cos(a) * 0.12),
      new THREE.Vector3(Math.sin(a) * 0.55, -0.95, Math.cos(a) * 0.22),
      new THREE.Vector3(Math.sin(a) * 0.85, -1.2, Math.cos(a) * 0.3),
    ]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.085, 10), M.banana); g.add(tube);
  }
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.12), M.stem); g.add(crown);
  g.position.set(-0.1, H - 0.3, 0.2);
  part('바나나 고리 · 눌림 방지', g, [-0.2, 0.9, 1.3], new THREE.Vector3(-0.3, -0.2, 0));
}
// 5. 바닥 트레이 + 심지 (물 되돌림)
{
  const g = new THREE.Group();
  const t = new THREE.Mesh(new RoundedBoxGeometry(W - 0.35, 0.12, D - 0.8, 3, 0.03), M.tray); g.add(t);
  const w = new THREE.Mesh(new THREE.BoxGeometry(W - 0.6, 0.03, D - 1.0), M.wick); w.position.y = 0.07; g.add(w);
  g.position.set(0, BASE + 0.2, 0.35);
  part('물받이 트레이 + 심지 · 습도 85~95%', g, [0, -0.8, 1.4], new THREE.Vector3(-(W - 0.35) / 2, 0, 0));
}
// 뒤쪽 냉각 모듈 (안쪽 → 바깥쪽)
const backZ = -D / 2 + 0.45;
// 6. UV-A LED + 광촉매 망
{
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9, 10, 10), M.mesh); g.add(m);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.03), new THREE.MeshStandardMaterial({ color: 0xe8e8e8 }));
  frame.position.z = -0.03; frame.scale.set(1, 1, 1); g.add(frame);
  [-0.25, 0.25].forEach(x => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), M.uv); l.position.set(x, 0.55, 0.02); g.add(l); });
  g.position.set(0, H - 0.85, backZ + 0.35);
  part('UV-A LED + 광촉매 망 · 에틸렌 분해', g, [-0.4, 2.0, -0.8], new THREE.Vector3(0.5, 0.5, 0));
}
function sink(fins) {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.06), M.alu); g.add(plate);
  for (let i = 0; i < fins; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.0, 0.3), M.alu); f.position.set(-0.45 + i * (0.9 / (fins - 1)), 0, 0.17); g.add(f); }
  return g;
}
function fan() {
  const g = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 24), M.dark); hub.rotation.x = Math.PI / 2; g.add(hub);
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.01), M.dark);
    b.position.set(Math.cos(i / 7 * Math.PI * 2) * 0.24, Math.sin(i / 7 * Math.PI * 2) * 0.24, 0);
    b.rotation.z = i / 7 * Math.PI * 2; b.rotation.x = 0.4; g.add(b);
  }
  const box = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 4), M.dark); box.rotation.z = Math.PI / 4; g.add(box);
  g.userData.spin = true;
  return g;
}
// 7. 안쪽 방열판 + 순환 팬
{
  const g = new THREE.Group();
  const s = sink(9); s.rotation.y = Math.PI; g.add(s);
  const f = fan(); f.position.z = 0.4; g.add(f);
  g.position.set(0, H - 0.85, backZ + 0.1);
  part('안쪽 방열판 + 순환 팬 · 0.1~0.3m/s', g, [-1.3, 2.0, -1.7], new THREE.Vector3(0.5, -0.5, 0));
}
// 8. 펠티어 소자
{
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.05), M.ceramic);
  m.position.set(0, H - 0.85, backZ - 0.15);
  part('펠티어 소자 · 14°C 유지', m, [-2.1, 2.0, -2.5], new THREE.Vector3(-0.2, 0.2, 0));
}
// 9. 바깥 방열판 + 배기 팬
{
  const g = new THREE.Group();
  const s = sink(11); g.add(s);
  const f = fan(); f.position.z = 0.42; g.add(f);
  g.position.set(0, H - 0.85, backZ - 0.3);
  g.rotation.y = Math.PI;
  part('바깥 방열판 + 배기 팬', g, [-2.9, 2.0, -3.3], new THREE.Vector3(-0.5, 0.5, 0));
}
// 10. 뒷커버
{
  const m = new THREE.Mesh(new RoundedBoxGeometry(W, H - BASE, 0.1, 4, 0.05), M.shell);
  m.position.set(0, (H + BASE) / 2, -D / 2 - 0.05);
  part('뒷커버 · 위로 배기, 아래로 흡기', m, [-1.6, 0, -3.4], new THREE.Vector3(W / 2, 0.8, 0));
}
// 11. 제어 보드 + 온습도 센서
{
  const g = new THREE.Group();
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.03), new THREE.MeshStandardMaterial({ color: 0x1f7a4d, roughness: 0.5 }));
  g.add(pcb);
  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.04), M.dark); chip.position.set(-0.15, 0, 0.03); g.add(chip);
  const sht = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), M.ceramic); sht.position.set(0.25, 0.1, 0.03); g.add(sht);
  g.position.set(0, BASE + 0.45, -D / 2 + 0.2);
  part('제어 보드 + 온습도 센서', g, [-2.6, -0.6, -0.4], new THREE.Vector3(-0.4, 0, 0));
}

/* airflow arrows (show in assembled state) */
const airG = new THREE.Group(); product.add(airG);
{
  const pts = [new THREE.Vector3(0, H - 0.6, backZ + 0.3), new THREE.Vector3(0, H - 0.5, 0.4), new THREE.Vector3(0.6, H / 2 + 0.2, 0.7), new THREE.Vector3(0.3, BASE + 0.45, 0.6), new THREE.Vector3(0, BASE + 0.5, backZ + 0.3)];
  const c = new THREE.CatmullRomCurve3(pts, true);
  airG.add(new THREE.Mesh(new THREE.TubeGeometry(c, 80, 0.018, 6, true), M.air));
  airG.userData.curve = c;
  for (let i = 0; i < 10; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), M.air); d.userData.t = i / 10; airG.add(d); }
}

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
  // 0~.12 조립 상태 회전 · .12~.45 분해 · .45~.72 분해 유지 · .72~.95 다시 조립
  const e = p < 0.12 ? 0 : p < 0.45 ? ease((p - 0.12) / 0.33) : p < 0.72 ? 1 : p < 0.95 ? 1 - ease((p - 0.72) / 0.23) : 0;
  parts.forEach(({ obj }) => obj.position.copy(obj.userData.home).addScaledVector(obj.userData.off, e));

  const ang = -0.95 + p * 0.35;
  const dist = 8.5 + e * 9;
  camera.position.set(Math.sin(ang) * dist, 1.8 + e * 3.2, Math.cos(ang) * dist);
  camera.lookAt(-e * 0.5, e * 0.5, -e * 1.0);

  // spin fans
  product.traverse(o => { if (o.userData.spin) o.rotation.z += dt * (2 + 10 * (1 - e)); });

  // airflow visible when assembled near the end/start
  const airOn = p > 0.9 || (p > 0.02 && p < 0.1) ? 0.85 : 0;
  M.air.opacity += (airOn - M.air.opacity) * 0.1;
  const c = airG.userData.curve;
  airG.children.forEach(ch => { if (ch.userData.t !== undefined) { ch.userData.t = (ch.userData.t + dt * 0.12) % 1; ch.position.copy(c.getPointAt(ch.userData.t)); } });

  renderer.render(scene, camera);

  // labels
  const w = canvas.clientWidth, h = canvas.clientHeight;
  parts.forEach(({ obj, el, anchor }) => {
    tmp.copy(anchor); obj.localToWorld(tmp); tmp.project(camera);
    el.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * w}px, ${(-tmp.y * 0.5 + 0.5) * h}px) translate(-50%,-50%)`;
    el.style.opacity = clamp((e - 0.7) / 0.3);
  });

  // steps
  const idx = p < 0.12 ? 0 : p < 0.72 ? 1 : 2;
  stepEls.forEach((s, i) => s.classList.toggle('on', i === idx));
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.documentElement.classList.add('xv-ready');
