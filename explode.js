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
  air: new THREE.MeshBasicMaterial({ color: 0x5aa9ff, transparent: true, opacity: 0 }),
};

/* ---------- product (units: 10cm) W2.6 H2.9 D2.4 ---------- */
const W = 2.6, D = 2.4, BASE = 0.4, HB = 2.8, H = BASE + HB, R = 0.34;
const CY = BASE + HB / 2;               // 몸체 가운데 높이
const WIN_W = 1.92, WIN_H = 2.02, WIN_RR = 0.24, WIN_Y = 0.2;  // 둥근 사각 창 · 가운데에서 위로
const WIN_R = WIN_W / 2;
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

let BODY_BB;   // 몸체 바깥 크기 — 하단 몸통을 여기에 딱 맞춤
// 1. 몸체 — 모서리가 크게 둥근 통(앞뒤가 열림) + 크림색 안쪽
{
  const g = new THREE.Group();
  const s = rrect2(W - 2 * BEV, HB - 2 * BEV, R - BEV, 0.0001);
  s.holes.push(rrect(W - 0.4, HB - 0.4, R - 0.18, new THREE.Path()));
  const depth = D - 0.25 - 2 * BEV;
  const tube = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: BEV, bevelThickness: BEV, bevelSegments: 8, curveSegments: 24 }), M.shell);
  tube.position.set(0, CY, -D / 2 + BEV); g.add(tube);
  tube.geometry.computeBoundingBox(); BODY_BB = tube.geometry.boundingBox.clone().translate(tube.position);
  // 안쪽 라이너(천장·바닥·양옆·뒷벽) — 뒷벽이 냉각 모듈을 가립니다
  const iw = W - 0.72, ih = HB - 0.72, iz0 = -D / 2 + 1.2, iz1 = D / 2 - 0.1;
  const ld = iz1 - iz0, lz = (iz0 + iz1) / 2;
  [[iw, ih, 0, 0, iz0, 0, 0], [ld, ih, -iw / 2, 0, lz, 0, Math.PI / 2], [ld, ih, iw / 2, 0, lz, 0, -Math.PI / 2], [iw, ld, 0, ih / 2, lz, Math.PI / 2, 0], [iw, ld, 0, -ih / 2, lz, -Math.PI / 2, 0]]
    .forEach(([w, h, x, y, z, rx, ry]) => { const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.liner); pl.position.set(x, CY + y, z); pl.rotation.set(rx, ry, 0); g.add(pl); });
  const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 24), M.alu); mount.position.set(0, CY + ih / 2 - 0.03, -0.1); g.add(mount);
  const bar = new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.03, 0.08, 2, 0.015), M.bar); bar.position.set(0, CY + ih / 2 - 0.03, 0.75); g.add(bar);
  const light = new THREE.PointLight(0xffe08a, 1.0, 3.2, 1.5); light.position.set(0, CY + 0.5, 0.3); g.add(light);
  part('몸체 · 단열 2.5cm', g, [0, 0, 0], new THREE.Vector3(-W / 2, H - 0.2, -0.4));
}
// 2. 하단 몸통 — 냉장고 아래쪽 몸통을 색 플라스틱으로(받침대 아님). 몸체와 바깥 면·모서리가 딱 맞고, 사이에 분할선 하나
{
  const m = new THREE.Group();
  const GAP = 0.012;                                   // 흰 윗부분과의 얇은 분할선
  // 위에서 본 단면을 몸체 바깥선(세로 모서리 둥글기 BEV)과 같게 세로로 뽑음 → 겉면이 몸체와 한 면으로 이어짐
  const bw = BODY_BB.max.x - BODY_BB.min.x, bz0 = BODY_BB.min.z, bz1 = D / 2 - 0.02;   // 앞은 문 앞면까지
  const bg = new THREE.ExtrudeGeometry(rrect(bw - 0.06, bz1 - bz0 - 0.06, BEV - 0.03), { depth: BASE - GAP - 0.06, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 4, curveSegments: 24 }).rotateX(-Math.PI / 2);
  const band = new THREE.Mesh(bg, M.oak); band.position.set(0, 0.03, (bz0 + bz1) / 2); m.add(band);
  const seam = new THREE.Mesh(new THREE.ExtrudeGeometry(rrect(bw - 0.04, bz1 - bz0 - 0.04, BEV - 0.02), { depth: GAP, bevelEnabled: false, curveSegments: 24 }).rotateX(-Math.PI / 2), M.vent);
  seam.position.set(0, BASE - GAP, (bz0 + bz1) / 2); m.add(seam);
  // 발은 겉에서 안 보이게 바닥 안쪽으로 넣음
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([x, z]) => { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.012, 20), M.dark); f.position.set(x * (W / 2 - 0.45), 0.004, z * (D / 2 - 0.45)); m.add(f); });
  part('하단 몸통(색상) · 물받이 트레이·제어 보드 내장', m, [0, 0, 0], new THREE.Vector3(W / 2, BASE / 2, D / 2 - 0.3));
}
// 3. 문 — 앞판 + 큰 둥근 사각 창(안쪽 색이 비침) + 버튼 1개
{
  const g = new THREE.Group();
  const s = rrect2(W - 2 * BEV, HB - 2 * BEV, R - BEV, 0.0001);
  const hole = rrect(WIN_W, WIN_H, WIN_RR, new THREE.Path()); hole.getPoints = ((gp) => function (n) { return gp.call(this, n).map(p => p.add(new THREE.Vector2(0, WIN_Y))); })(hole.getPoints); s.holes.push(hole);
  const door = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelSize: BEV, bevelThickness: 0.06, bevelSegments: 8, curveSegments: 48 }), M.shell);
  g.add(door);
  const gl = new THREE.Mesh(new THREE.ShapeGeometry(rrect(WIN_W, WIN_H, WIN_RR), 24), M.tint); gl.position.set(0, WIN_Y, 0.03); g.add(gl);
  const fr = rrect(WIN_W + 0.06, WIN_H + 0.06, WIN_RR + 0.03); fr.holes.push(rrect(WIN_W, WIN_H, WIN_RR, new THREE.Path()));
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(fr, { depth: 0.03, bevelEnabled: false, curveSegments: 24 }), M.gasket); frame.position.set(0, WIN_Y, 0.1); g.add(frame);
  // 버튼 1개(테두리 링) — 창 아래 가운데. 짧게 눌러 모드, 길게 눌러 익히기
  const by = WIN_Y - WIN_H / 2 - 0.2;
  const bring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.009, 12, 48), M.dark); bring.position.set(0, by, 0.125); g.add(bring);
  // 오른쪽 끝 투명 경첩 탭 2개
  [0.55, -0.55].forEach(y => { const t = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.32, 0.06, 2, 0.02), M.hingeTab); t.position.set(WIN_W / 2 + 0.03, WIN_Y + y, 0.13); g.add(t); });
  // 안쪽 자석 패킹 · 왼쪽 경첩 2개
  const gk = rrect(W - 0.4, HB - 0.4, R - 0.2); gk.holes.push(rrect(W - 0.52, HB - 0.52, R - 0.26, new THREE.Path()));
  const gasket = new THREE.Mesh(new THREE.ExtrudeGeometry(gk, { depth: 0.05, bevelEnabled: false, curveSegments: 16 }), M.gasket); gasket.position.z = -0.1; g.add(gasket);
  [0.75, -0.75].forEach(y => { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 16), M.alu); h.position.set(W / 2 - 0.2, y, -0.06); g.add(h); });
  g.position.set(0, CY, D / 2 - 0.12);
  part('문 · 둥근 사각 창 · 버튼 1개 · 투명 경첩', g, [0, 0, 2.6], new THREE.Vector3(0, HB / 2 + 0.1, 0.1));
}
// 4. 바나나 + 고리 — 천장에 걸려 창 가운데에 보이게
{
  const g = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22), M.ceramic); rod.position.y = 0.2; g.add(rod);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 24, Math.PI * 1.4), M.ceramic); hook.rotation.z = -Math.PI * 0.2; hook.position.y = 0.06; g.add(hook);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.14, 12), M.stem); crown.position.y = -0.02; g.add(crown);
  const SEG = 40, RAD = 12;
  for (let i = 0; i < 5; i++) {
    const k = i - 2, sp = [0.04, 0.1, 0.14, 0.16, 0.16], zz = 0.05 - Math.abs(k) * 0.05 + (i % 2) * 0.06;
    const base = [[0, -0.05], [-0.04, -0.42], [-0.14, -0.78], [-0.3, -0.98], [-0.44, -1.02]];
    const pts = base.map(([x, y], j) => new THREE.Vector3(x + k * sp[j] * 1.4 + 0.12, y + Math.abs(k) * 0.04 * j / 4, zz * j / 4 + 0.05));
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, SEG, 0.12, RAD);
    // 양 끝을 가늘게
    const pos = geo.attributes.position, v = new THREE.Vector3();
    for (let k = 0; k <= SEG; k++) {
      const t = k / SEG, f = Math.min(1, Math.sin(Math.PI * t) * 1.6 + 0.25), c = curve.getPointAt(t);
      for (let j = 0; j <= RAD; j++) { const vi = k * (RAD + 1) + j; v.fromBufferAttribute(pos, vi).sub(c).multiplyScalar(f).add(c); pos.setXYZ(vi, v.x, v.y, v.z); }
    }
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, M.banana));
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), M.tip); tip.position.copy(pts[4]); g.add(tip);
  }
  g.position.set(0, CY + (HB - 0.52) / 2 - 0.3, -0.15);
  part('바나나 고리 · 눌림 방지', g, [0, 1.5, 0.9], new THREE.Vector3(-0.45, -0.5, 0.3));
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
const backZ = -0.42;
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
  const panel = new THREE.Mesh(new RoundedBoxGeometry(W - 0.3, HB - 0.3, 0.12, 6, 0.1), M.shell); g.add(panel);
  const slot = (y, n, w) => { for (let i = 0; i < n; i++) { const sl = new THREE.Mesh(new RoundedBoxGeometry(w, 0.05, 0.02, 2, 0.02), M.vent); sl.position.set(0, y - i * 0.1, -0.065); g.add(sl); } };
  slot(0.85, 6, 1.3);   // 배기
  slot(-0.45, 3, 1.3);  // 흡기
  const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 24), M.alu); jack.rotation.x = Math.PI / 2; jack.position.set(0.75, -0.85, -0.075); g.add(jack);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.05, 16), M.vent); pin.rotation.x = Math.PI / 2; pin.position.set(0.75, -0.85, -0.08); g.add(pin);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.22), M.label); plate.rotation.y = Math.PI; plate.position.set(-0.55, -0.85, -0.062); g.add(plate);
  g.position.set(0, CY, -D / 2 + 0.06);
  part('뒷커버 · 위 배기 · 아래 흡기 · 12V 단자', g, [0, 0, -3.6], new THREE.Vector3(W / 2 - 0.15, 0.8, 0));
}
// 11. 제어 보드 + 온습도 센서
{
  const g = new THREE.Group();
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.03), new THREE.MeshStandardMaterial({ color: 0x1f7a4d, roughness: 0.5 })); g.add(pcb);
  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.04), M.dark); chip.position.set(-0.18, 0.05, 0.03); g.add(chip);
  [[0.05, 0.15], [0.12, 0.15], [0.05, -0.12]].forEach(([x, y]) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 16), M.dark); c.rotation.x = Math.PI / 2; c.position.set(x, y, 0.06); g.add(c); });
  const conn = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.06), M.ceramic); conn.position.set(-0.2, -0.2, 0.04); g.add(conn);
  const relay = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.08), new THREE.MeshStandardMaterial({ color: 0x2f5fa8, roughness: 0.4 })); relay.position.set(0.3, -0.08, 0.05); g.add(relay);
  const sht = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), M.ceramic); sht.position.set(0.35, 0.18, 0.03); g.add(sht);
  g.rotation.x = -Math.PI / 2; g.position.set(0, BASE * 0.55, -D / 2 + 0.55);   // 하단 몸통 안 뒤쪽에 눕힘
  part('제어 보드 + 온습도 센서', g, [0, -0.1, -2.2], new THREE.Vector3(-0.45, 0, 0));
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

  const FRONT = 0.38, BACK = Math.PI + 0.55, XA = 0.85, XB = 1.25;
  const ang = p < 0.1 ? FRONT
    : p < 0.28 ? FRONT + (BACK - FRONT) * ease((p - 0.1) / 0.18)
    : p < 0.5 ? BACK + (XA - BACK) * ease((p - 0.28) / 0.22)
    : p < 0.74 ? XA + (XB - XA) * ((p - 0.5) / 0.24)
    : p < 0.95 ? XB + (FRONT - XB) * ease((p - 0.74) / 0.21) : FRONT;
  ground.material.opacity = 0.09 * (1 - e);
  const dist = 10 + e * 6.5;
  camera.position.set(Math.sin(ang) * dist, 1.2 + e * 3.4, Math.cos(ang) * dist);
  camera.lookAt(0, -0.05 + e * 0.6, -e * 0.6);

  // spin fans
  product.traverse(o => { if (o.userData.spin) o.rotation.z += dt * (2 + 10 * (1 - e)); });

  // airflow visible when assembled near the end/start
  const airOn = p > 0.96 ? 0.85 : 0;
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
  const idx = p < 0.1 ? 0 : p < 0.3 ? 1 : p < 0.76 ? 2 : 3;
  stepEls.forEach((s, i) => s.classList.toggle('on', i === idx));
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.documentElement.classList.add('xv-ready');
