// KLADO ホームの 3D の木（three.js）。枝を何度も分けて細くし、枝先に葉を1枚ずつ置く。乱数の種は固定なので毎回同じ木になる。
// WebGL が使えない時は、下に置いた絵（SVG）のまま。動きを減らす設定の人には、回さない。
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

const box = document.querySelector("[data-tree3d]");
if (box) {
  try { init(box); } catch (e) { /* 絵のまま */ }
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function leafTexture() {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 64;
  const g = c.getContext("2d");
  g.translate(32, 32);
  const grad = g.createLinearGradient(-28, 0, 28, 0);
  grad.addColorStop(0, "#d9d9d9"); grad.addColorStop(0.5, "#ffffff"); grad.addColorStop(1, "#cfcfcf");
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(-30, 0);
  g.bezierCurveTo(-18, -17, 14, -16, 30, 0);
  g.bezierCurveTo(14, 16, -18, 17, -30, 0);
  g.fill();
  g.strokeStyle = "rgba(90,90,90,.45)"; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(-28, 0); g.lineTo(28, 0); g.stroke();
  g.lineWidth = 0.8;
  for (let i = -18; i <= 16; i += 8) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 7, -8); g.moveTo(i, 0); g.lineTo(i + 7, 8); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function barkTexture(R) {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#6a4c36"; g.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 70; i++) {
    const x = R() * 64, w = 1 + R() * 3, a = 0.15 + R() * 0.35;
    g.fillStyle = R() < 0.6 ? `rgba(30,18,10,${a})` : `rgba(160,130,100,${a * 0.6})`;
    g.fillRect(x, 0, w, 256);
  }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(25,15,8,${0.2 + R() * 0.3})`;
    g.fillRect(R() * 64, R() * 256, 4 + R() * 10, 1 + R() * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function groundTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, "rgba(92,110,60,.75)");
  r.addColorStop(0.45, "rgba(84,104,56,.45)");
  r.addColorStop(1, "rgba(84,104,56,0)");
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 先が細い円柱を、2点の間に置く
function segment(a, b, r0, r1, sides) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(r1, r0, len, sides, 1, true);
  geo.translate(0, len / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  geo.applyQuaternion(q);
  geo.translate(a.x, a.y, a.z);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * len * 3);
  return geo.toNonIndexed();
}

function merge(geos) {
  let n = 0;
  for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uvs = new Float32Array(n * 2);
  let o = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    uvs.set(g.attributes.uv.array, o * 2);
    o += g.attributes.position.count;
    g.dispose();
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  m.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  m.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  return m;
}

function buildTree(R) {
  const UP = new THREE.Vector3(0, 1, 0);
  const wood = [], clusters = [], anchors = {};
  function perp(d) {
    const t = Math.abs(d.y) < 0.9 ? UP : new THREE.Vector3(1, 0, 0);
    return new THREE.Vector3().crossVectors(d, t).normalize();
  }
  function grow(p, dir, len, rad, depth) {
    const segs = depth === 0 ? 4 : 3;
    let a = p.clone(), d = dir.clone(), r = rad;
    const rEnd = rad * 0.66;
    for (let i = 0; i < segs; i++) {
      const wob = depth === 0 ? 0.07 : 0.26;
      d.add(new THREE.Vector3((R() - 0.5) * wob, (R() - 0.35) * 0.12, (R() - 0.5) * wob)).normalize();
      if (depth >= 3) d.y -= 0.04;            // 細い枝は少し垂れる
      d.normalize();
      const b = a.clone().addScaledVector(d, len / segs);
      const rn = rad + (rEnd - rad) * ((i + 1) / segs);
      wood.push(segment(a, b, r, rn, depth <= 1 ? 9 : 6));
      if (depth >= 3 && i >= 1) clusters.push({ p: b.clone(), d: d.clone(), s: depth >= 5 ? 1 : 0.7 });
      a = b; r = rn;
    }
    if (depth === 0) { anchors.trunk = p.clone().lerp(a, 0.45); anchors.fork = a.clone(); }
    if (depth === 1 && !anchors.branch) anchors.branch = p.clone().lerp(a, 0.6);
    if (depth >= 6 || rEnd < 0.008) {
      clusters.push({ p: a.clone(), d: d.clone(), s: 1.3 });
      return;
    }
    const n = depth === 0 ? 3 : (R() < 0.45 ? 3 : 2);
    const az0 = R() * Math.PI * 2;
    for (let k = 0; k < n; k++) {
      const axis = perp(d).applyAxisAngle(d, az0 + (k * Math.PI * 2) / n + (R() - 0.5) * 0.6);
      const tilt = (depth === 0 ? 0.55 : 0.42) + R() * 0.32;
      const nd = d.clone().applyAxisAngle(axis, tilt);
      nd.lerp(UP, depth <= 1 ? 0.22 : 0.08).normalize();
      grow(a, nd, len * (0.72 + R() * 0.1), rEnd, depth + 1);
    }
  }
  grow(new THREE.Vector3(0, -0.02, 0), UP.clone(), 0.95, 0.11, 0);
  // 根：根元から土の中へ
  const roots = [];
  for (let k = 0; k < 6; k++) {
    const az = (k / 6) * Math.PI * 2 + R() * 0.5;
    const out = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
    const p0 = new THREE.Vector3(0, 0.1, 0).addScaledVector(out, 0.04);
    const p1 = p0.clone().addScaledVector(out, 0.18).add(new THREE.Vector3(0, -0.1, 0));
    const p2 = p1.clone().addScaledVector(out, 0.28).add(new THREE.Vector3(0, -0.2, 0));
    roots.push(segment(p0, p1, 0.07, 0.04, 6), segment(p1, p2, 0.04, 0.012, 5));
    if (k === 1) anchors.root = p1.clone().lerp(p2, 0.3);
  }
  return { wood: merge(wood), roots: merge(roots), clusters, anchors };
}

function init(box) {
  const test = document.createElement("canvas");
  if (!(test.getContext("webgl2") || test.getContext("webgl"))) return;
  const R = rng(20261112);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const stage = box.querySelector(".tree3d-stage");
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 400 / 320, 0.1, 50);

  scene.add(new THREE.HemisphereLight(0xe6f0f7, 0x4a3a28, 1.45));
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
  sun.position.set(-2.6, 4.2, 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -2; sun.shadow.camera.right = 2; sun.shadow.camera.top = 3.5; sun.shadow.camera.bottom = -1;
  sun.shadow.bias = -0.0008; sun.shadow.radius = 4;
  scene.add(sun);

  const tree = new THREE.Group();
  scene.add(tree);
  const { wood, roots, clusters, anchors } = buildTree(R);
  const bark = barkTexture(R);
  const barkMat = new THREE.MeshStandardMaterial({ map: bark, roughness: 0.95, metalness: 0, color: 0xffffff });
  const woodMesh = new THREE.Mesh(wood, barkMat);
  woodMesh.castShadow = true; woodMesh.receiveShadow = true;
  tree.add(woodMesh);
  const rootMat = new THREE.MeshStandardMaterial({ map: bark, roughness: 1, color: 0xb59a80, transparent: true, opacity: 0.85 });
  tree.add(new THREE.Mesh(roots, rootMat));

  // 葉
  const leafTex = leafTexture();
  const leafGeo = new THREE.PlaneGeometry(0.14, 0.085);
  const leafMat = new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8, metalness: 0 });
  const per = 11;
  const total = clusters.reduce((n, c) => n + Math.round(per * c.s), 0);
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, total);
  leaves.castShadow = true; leaves.receiveShadow = true;
  leaves.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leafTex, alphaTest: 0.5 });
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), col = new THREE.Color();
  let center = new THREE.Vector3();
  for (const c of clusters) center.add(c.p);
  center.divideScalar(clusters.length);
  let maxR = 0;
  for (const c of clusters) maxR = Math.max(maxR, c.p.distanceTo(center));
  let i = 0;
  for (const c of clusters) {
    const k = Math.round(per * c.s);
    for (let j = 0; j < k; j++) {
      const p = c.p.clone().add(new THREE.Vector3((R() - 0.5) * 0.26, (R() - 0.4) * 0.2, (R() - 0.5) * 0.26));
      e.set(R() * Math.PI, R() * Math.PI * 2, R() * Math.PI);
      q.setFromEuler(e);
      const s = 0.8 + R() * 0.6;
      sc.set(s, s, s);
      m.compose(p, q, sc);
      leaves.setMatrixAt(i, m);
      const outer = Math.min(1, p.distanceTo(center) / maxR);
      const h = 0.25 + R() * 0.06, sat = 0.5 + R() * 0.16, l = 0.24 + outer * 0.2 + R() * 0.08;
      leaves.setColorAt(i, col.setHSL(h, sat, l));
      i++;
    }
  }
  leaves.count = i;
  tree.add(leaves);

  // 地面と影
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1.7, 48), new THREE.MeshBasicMaterial({ map: groundTexture(), transparent: true, depthWrite: false }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = 0.001;
  scene.add(ground);
  const shadowCatcher = new THREE.Mesh(new THREE.CircleGeometry(1.7, 48), new THREE.ShadowMaterial({ opacity: 0.3 }));
  shadowCatcher.rotation.x = -Math.PI / 2; shadowCatcher.position.y = 0.002; shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  // カメラ：根元を絵の y=250、てっぺんを y≈18、葉の幅を x 92〜312 に収める（400×320 の枠で）
  let H = 0;
  for (const c of clusters) H = Math.max(H, c.p.y + 0.16);
  const radii = clusters.map((c) => Math.hypot(c.p.x, c.p.z)).sort((a, b) => a - b);
  const crownR = radii[Math.floor(radii.length * 0.92)] + 0.14;
  const elev = 0.16;  // 少し上から見下ろす
  const toVB = (v) => { const p = v.clone().project(camera); return { x: (p.x + 1) * 200, y: (1 - p.y) * 160 }; };
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  // 高さ：木（根元〜てっぺん）が枠の高さの 72% に。幅：樹冠の直径が枠の幅の 55% に
  const D = Math.max((H / 0.72) / (2 * tanV), (crownR * 2 / 0.55) / (2 * tanV * camera.aspect)) * 1.04;
  // 根元が枠の上から 250/320 の所に来るよう、見る点を上げる（中央から下へ 90/160）
  const ty = (90 / 160) * D * tanV;
  camera.position.set(0, ty + Math.sin(elev) * D, Math.cos(elev) * D);
  camera.lookAt(0, ty, 0);
  camera.updateMatrixWorld(); camera.updateProjectionMatrix();

  // ラベルの線
  const ov = box.querySelector(".tree3d-ov");
  const pins = {
    leaf: { el: ov.querySelector('[data-pin="leaf"]'), dot: ov.querySelector('[data-dot="leaf"]'), from: [326, 44], p: center.clone().add(new THREE.Vector3(maxR * 0.45, maxR * 0.35, maxR * 0.35)) },
    branch: { el: ov.querySelector('[data-pin="branch"]'), dot: ov.querySelector('[data-dot="branch"]'), from: [326, 128], p: anchors.branch || anchors.fork },
    trunk: { el: ov.querySelector('[data-pin="trunk"]'), dot: ov.querySelector('[data-dot="trunk"]'), from: [96, 196], p: anchors.trunk },
    root: { el: ov.querySelector('[data-pin="root"]'), dot: ov.querySelector('[data-dot="root"]'), from: [96, 284], p: anchors.root },
  };
  const w = new THREE.Vector3();
  function placePins() {
    for (const k in pins) {
      const pin = pins[k];
      w.copy(pin.p).applyMatrix4(tree.matrixWorld);
      const v = toVB(w);
      pin.el.setAttribute("d", `M${pin.from[0]} ${pin.from[1]} L${v.x.toFixed(1)} ${v.y.toFixed(1)}`);
      pin.dot.setAttribute("cx", v.x.toFixed(1)); pin.dot.setAttribute("cy", v.y.toFixed(1));
    }
  }

  box.classList.add("is-3d");   // 先に見える状態にしてから大きさを測る
  function resize() {
    const r = stage.getBoundingClientRect();
    if (r.width && r.height) renderer.setSize(r.width, r.height, false);
  }
  resize();
  window.addEventListener("resize", resize);

  // 回す：ゆっくり自動で、指やマウスでも
  let rot = -0.5, vel = 0, dragging = false, lastX = 0, visible = true;
  stage.addEventListener("pointerdown", (ev) => { dragging = true; lastX = ev.clientX; stage.setPointerCapture(ev.pointerId); });
  stage.addEventListener("pointermove", (ev) => { if (!dragging) return; const dx = ev.clientX - lastX; lastX = ev.clientX; rot += dx * 0.01; vel = dx * 0.0006; });
  const up = () => { dragging = false; };
  stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(stage);

  box.classList.add("is-3d");
  let prev = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) { prev = now; return; }
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    if (!dragging) {
      vel *= 0.95;
      rot += vel + (reduce ? 0 : dt * 0.18);
    }
    tree.rotation.y = rot;
    tree.updateMatrixWorld();
    placePins();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
