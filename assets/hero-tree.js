// KLADO ホームの最初の画面：種から木が育ち、枝先に公開中のアプリが実る（three.js）。
// 作り方は名前の欄の木（tree3d.js）と同じ（枝を何度も分けて細く・葉を1枚ずつ）。乱数の種と枝の開き方を変えた別の木。
// 種が落ちる → 幹と枝が根元から伸びながら太る → 葉が新芽の黄緑で出て深い緑へ → 実（本物のアイコン、押すとそのアプリのページ）→ 見出し。
// 育ったあとは左右にゆっくり振れ、ときどき葉が1枚落ちる。指で回せて、離すと正面に戻る。
// WebGL が無い時は木を出さず、文字をすぐ見せる。動きを減らす設定の人には、育った木を止めて見せる。
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

const box = document.querySelector("[data-grow]");
const hero = box && box.closest(".hero");
function giveUp() { if (hero) hero.classList.add("no-tree"); if (box) box.hidden = true; }
if (box) { try { init(box); } catch (e) { giveUp(); } }

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const ease = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : 1 - Math.pow(1 - k, 3));
const pop = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k < 0.7 ? ease(k / 0.7) * 1.12 : 1.12 - 0.12 * ease((k - 0.7) / 0.3));

// 葉：名前の欄より丸みがあり、葉脈の深い葉
function leafTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"); g.translate(32, 32);
  const gr = g.createLinearGradient(-28, 0, 28, 0);
  gr.addColorStop(0, "#d6d6d6"); gr.addColorStop(0.5, "#ffffff"); gr.addColorStop(1, "#cbcbcb");
  g.fillStyle = gr;
  g.beginPath(); g.moveTo(-29, 0); g.bezierCurveTo(-20, -20, 10, -21, 29, 0); g.bezierCurveTo(10, 21, -20, 20, -29, 0); g.fill();
  g.strokeStyle = "rgba(80,80,80,.5)"; g.lineWidth = 1.3;
  g.beginPath(); g.moveTo(-27, 0); g.lineTo(27, 0); g.stroke();
  g.lineWidth = 0.8;
  for (let i = -18; i <= 14; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 8, -10); g.moveTo(i, 0); g.lineTo(i + 8, 10); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function barkTexture(R) {
  const c = document.createElement("canvas"); c.width = 64; c.height = 256;
  const g = c.getContext("2d"); g.fillStyle = "#634632"; g.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 70; i++) { const a = 0.15 + R() * 0.35; g.fillStyle = R() < 0.6 ? `rgba(30,18,10,${a})` : `rgba(160,130,100,${a * 0.6})`; g.fillRect(R() * 64, 0, 1 + R() * 3, 256); }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(25,15,8,${0.2 + R() * 0.3})`; g.fillRect(R() * 64, R() * 256, 4 + R() * 10, 1 + R() * 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function groundTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d"); const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, "rgba(96,80,56,.7)"); r.addColorStop(0.5, "rgba(80,70,50,.35)"); r.addColorStop(1, "rgba(70,60,44,0)");
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// 枝：分かれるたびに細く。根元からの道のり s を覚えておき、伸びる順に使う
function buildTree(R) {
  const UP = new THREE.Vector3(0, 1, 0), segs = [], clusters = [];
  const perp = (d) => new THREE.Vector3().crossVectors(d, Math.abs(d.y) < 0.9 ? UP : new THREE.Vector3(1, 0, 0)).normalize();
  function grow(p, dir, len, rad, depth, s) {
    const n = depth === 0 ? 4 : 3; let a = p.clone(), d = dir.clone(), r = rad; const rEnd = rad * 0.64;
    for (let i = 0; i < n; i++) {
      const wob = depth === 0 ? 0.06 : 0.24;
      d.add(new THREE.Vector3((R() - 0.5) * wob, (R() - 0.35) * 0.1, (R() - 0.5) * wob)); if (depth >= 3) d.y -= 0.05; d.normalize();
      const b = a.clone().addScaledVector(d, len / n), rn = rad + (rEnd - rad) * ((i + 1) / n);
      segs.push({ a: a.clone(), b, r0: r, s0: s, s1: s + len / n }); s += len / n;
      if (depth >= 3 && i >= 1) clusters.push({ p: b.clone(), s, k: depth >= 5 ? 1 : 0.7 });
      a = b; r = rn;
    }
    if (depth >= 6 || rEnd < 0.008) { clusters.push({ p: a.clone(), s, k: 1.3 }); return; }
    const m = depth === 0 ? 3 : R() < 0.5 ? 3 : 2, az0 = R() * Math.PI * 2;
    for (let k = 0; k < m; k++) {
      const ax = perp(d).applyAxisAngle(d, az0 + (k * Math.PI * 2) / m + (R() - 0.5) * 0.6);
      const tilt = (depth === 0 ? 0.55 : 0.44) + R() * 0.3;
      const nd = d.clone().applyAxisAngle(ax, tilt).lerp(UP, depth <= 1 ? 0.2 : 0.07).normalize();
      grow(a, nd, len * (0.72 + R() * 0.1), rEnd, depth + 1, s);
    }
  }
  grow(new THREE.Vector3(0, -0.02, 0), UP.clone(), 0.8, 0.12, 0, 0);
  return { segs, clusters };
}

function init(box) {
  const test = document.createElement("canvas");
  if (!(test.getContext("webgl2") || test.getContext("webgl"))) { giveUp(); return; }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const apps = JSON.parse(box.dataset.apps || "[]");
  const stage = box.querySelector(".grow-stage");

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  scene.add(new THREE.HemisphereLight(0xe8f1ea, 0x3d3022, 1.35));
  const sun = new THREE.DirectionalLight(0xffeccc, 2.6);
  sun.position.set(-2.8, 4.6, 2.2); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -2.4, right: 2.4, top: 3.6, bottom: -1 });
  sun.shadow.bias = -0.0008; sun.shadow.radius = 4; scene.add(sun);

  const R = rng(20261120);
  const { segs, clusters } = buildTree(R);
  const Smax = Math.max(...segs.map((s) => s.s1));
  const tOf = (s) => 1.15 + 2.7 * Math.pow(s / Smax, 0.85);   // 根元からの道のり → 伸びはじめる時刻（秒）

  const tree = new THREE.Group(); scene.add(tree);
  const UP = new THREE.Vector3(0, 1, 0), M = new THREE.Matrix4(), S = new THREE.Vector3(), E = new THREE.Euler(), C = new THREE.Color(), v = new THREE.Vector3();

  // 幹と枝：先が細い円柱を1本ずつ伸ばす
  const cyl = new THREE.CylinderGeometry(0.87, 1, 1, 8, 1, true); cyl.translate(0, 0.5, 0);
  const wood = new THREE.InstancedMesh(cyl, new THREE.MeshStandardMaterial({ map: barkTexture(R), roughness: 0.95 }), segs.length);
  wood.castShadow = wood.receiveShadow = true; tree.add(wood);
  for (const s of segs) {
    const d = new THREE.Vector3().subVectors(s.b, s.a); s.len = d.length();
    s.q = new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()); s.t0 = tOf(s.s0); s.t1 = tOf(s.s1);
  }

  // 葉：新芽の黄緑で出て、深い緑へ
  const leafTex = leafTexture();
  const leafMat = new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 });
  const center = new THREE.Vector3(); clusters.forEach((c) => center.add(c.p)); center.divideScalar(clusters.length);
  let maxR = 0; clusters.forEach((c) => (maxR = Math.max(maxR, c.p.distanceTo(center))));
  const leafData = [];
  for (const c of clusters) {
    const k = Math.round(14 * c.k);
    for (let j = 0; j < k; j++) {
      const p = c.p.clone().add(new THREE.Vector3((R() - 0.5) * 0.28, (R() - 0.4) * 0.22, (R() - 0.5) * 0.28));
      E.set(R() * Math.PI, R() * Math.PI * 2, R() * Math.PI);
      const outer = Math.min(1, p.distanceTo(center) / maxR);
      leafData.push({ p, q: new THREE.Quaternion().setFromEuler(E), s: 0.8 + R() * 0.6, t: tOf(c.s) + 0.15 + R() * 0.55,
        young: new THREE.Color().setHSL(0.21 + R() * 0.03, 0.62, 0.52 + R() * 0.06),
        old: new THREE.Color().setHSL(0.26 + R() * 0.06, 0.48 + R() * 0.16, 0.22 + outer * 0.2 + R() * 0.08) });
    }
  }
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.15, 0.095), leafMat, leafData.length);
  leaves.castShadow = leaves.receiveShadow = true;
  leaves.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leafTex, alphaTest: 0.5 });
  leaves.setColorAt(0, C); tree.add(leaves);

  // 地面と影
  const gnd = new THREE.Mesh(new THREE.CircleGeometry(1.8, 48), new THREE.MeshBasicMaterial({ map: groundTexture(), transparent: true, depthWrite: false }));
  gnd.rotation.x = -Math.PI / 2; gnd.position.y = 0.001; scene.add(gnd);
  const sc = new THREE.Mesh(new THREE.CircleGeometry(1.8, 48), new THREE.ShadowMaterial({ opacity: 0.3 }));
  sc.rotation.x = -Math.PI / 2; sc.position.y = 0.002; sc.receiveShadow = true; scene.add(sc);

  // 種
  const seed = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshStandardMaterial({ color: 0x7a5532, roughness: 0.7 }));
  seed.scale.set(0.03, 0.045, 0.03); seed.castShadow = true; scene.add(seed);

  // カメラ：木の根元を枠の下から 24px、木の高さ・樹冠の幅が枠に収まるように
  let Ht = 0; clusters.forEach((c) => (Ht = Math.max(Ht, c.p.y + 0.16)));
  const radii = clusters.map((c) => Math.hypot(c.p.x, c.p.z)).sort((a, b) => a - b);
  const crownR = radii[Math.floor(radii.length * 0.94)] + 0.15;
  let W = 1, H = 1;
  function fit() {
    const r = stage.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false); camera.aspect = W / H;
    const tanV = Math.tan((camera.fov * Math.PI) / 360), elev = 0.12;
    const D = Math.max((Ht / ((H - 40) / H)) / (2 * tanV), (crownR * 2 / 0.78) / (2 * tanV * camera.aspect));
    const ty = ((H - 24 - H / 2) / (H / 2)) * D * tanV;
    camera.position.set(0, ty + Math.sin(elev) * D, Math.cos(elev) * D); camera.lookAt(0, ty, 0);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  }
  fit();

  // 実：公開中のアプリを、手前側の枝先にぶら下げる。樹冠の中のねらった位置に一番近い枝先を選ぶ
  const scr = (p) => { const q = p.clone().project(camera); return [(q.x + 1) * W / 2, (1 - q.y) * H / 2]; };
  const front = clusters.map((c, i) => [i, ...scr(c.p)]).filter(([i]) => clusters[i].p.z > 0.05);
  const xs = front.map((f) => f[1]), ys = front.map((f) => f[2]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const SPOTS = [[0.11, 0.58], [0.3, 0.32], [0.49, 0.2], [0.68, 0.32], [0.87, 0.57], [0.3, 0.8], [0.68, 0.79], [0.49, 0.55], [0.13, 0.86]];
  // 間をなるべく空ける。全部が載らない時は、間を少しずつ詰める
  const want = Math.min(apps.length, SPOTS.length);
  let picks = [];
  for (const gap of [66, 60, 54, 48, 42]) {
    const used = new Set(), placed = []; picks = [];
    apps.slice(0, want).forEach((app, k) => {
      const tx = x0 + (x1 - x0) * SPOTS[k][0], ty = y0 + (y1 - y0) * SPOTS[k][1];
      let best = null, bd = 1e9;
      for (const [i, x, y] of front) {
        if (used.has(i) || placed.some(([a, b]) => Math.hypot(a - x, b - y) < gap)) continue;
        const d = Math.hypot(x - tx, y - ty + 18); if (d < bd) { bd = d; best = i; }
      }
      if (best == null) return;
      used.add(best); placed.push(scr(clusters[best].p)); picks.push([app, best, k]);
    });
    if (picks.length >= want) break;
  }
  const fruits = picks.map(([[key, icon, name], best, k]) => {
    const a = document.createElement("a");
    a.className = "fruit"; a.href = `${key}/`; a.setAttribute("aria-label", `${name}のページへ`);
    a.innerHTML = `<i></i><b></b><img src="${icon}" alt="" width="40" height="40">`;
    box.appendChild(a);
    return { el: a, img: a.querySelector("img"), p: clusters[best].p, t: 4.15 + k * 0.16, ph: R() * 6 };
  });

  // 落ち葉（育ったあと、ときどき1枚）
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.095), new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8, color: 0x8fa84a }));
  fall.visible = false; fall.castShadow = true; scene.add(fall);
  let fallT = -1, nextFall = 8; const fallP = new THREE.Vector3();

  // 指で回す（離すと、ゆっくり正面へ戻る）
  const cv = renderer.domElement;
  let off = 0, vel = 0, drag = false, lastX = 0;
  cv.addEventListener("pointerdown", (e) => { drag = true; lastX = e.clientX; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", (e) => { if (!drag) return; const dx = e.clientX - lastX; lastX = e.clientX; off += dx * 0.01; vel = dx * 0.0006; });
  const up = () => { drag = false; };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);

  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(box);
  window.addEventListener("resize", fit);

  hero.classList.add("tree-on");
  const END = 5.6, T0 = performance.now();
  let prev = T0, settled = false;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) { prev = now; return; }
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    const t = reduce ? 99 : (now - T0) / 1000;
    if (!settled) {
      // 種：落ちて、はねて、土にもぐる
      if (t < 1.3) {
        let y; if (t < 0.75) { const k = t / 0.75; y = 1.9 - 1.87 * k * k; } else if (t < 0.95) { const k = (t - 0.75) / 0.2; y = 0.03 + 0.09 * Math.sin(k * Math.PI); } else { y = 0.03 - 0.05 * ease((t - 0.95) / 0.35); }
        seed.visible = true; seed.position.set(0, y, 0); seed.rotation.z = t < 0.75 ? -0.6 + 0.6 * (t / 0.75) : 0;
      } else seed.visible = false;
      // 幹と枝：伸びながら、全体も太っていく
      const thick = 0.35 + 0.65 * ease((t - 1.1) / 3.6);
      segs.forEach((s, i) => {
        const g = ease((t - s.t0) / Math.max(0.12, s.t1 - s.t0));
        if (g <= 0) S.set(0, 0, 0); else S.set(s.r0 * thick, s.len * g, s.r0 * thick);
        M.compose(s.a, s.q, S); wood.setMatrixAt(i, M);
      });
      wood.instanceMatrix.needsUpdate = true;
      leafData.forEach((L, i) => {
        const s = pop((t - L.t) / 0.45) * L.s; S.set(s, s, s); M.compose(L.p, L.q, S); leaves.setMatrixAt(i, M);
        C.copy(L.young).lerp(L.old, ease((t - L.t - 0.3) / 1.6)); leaves.setColorAt(i, C);
      });
      leaves.instanceMatrix.needsUpdate = true; leaves.instanceColor.needsUpdate = true;
      if (t > 4.9) hero.classList.add("tree-grown");
      if (t > END + 1.2) settled = true;
    }
    // 左右にゆっくり振れる・風で少し揺れる
    if (!drag) { vel *= 0.95; off += vel; off *= Math.pow(0.35, dt); }
    tree.rotation.y = off + (reduce ? 0 : Math.sin(now / 4200) * 0.3 * Math.min(1, Math.max(0, (t - 1) / 3)));
    tree.rotation.z = reduce ? 0 : Math.sin(now / 1700) * 0.008;
    tree.updateMatrixWorld();
    // 実：枝先の位置を追う
    for (const f of fruits) {
      const k = pop((t - f.t) / 0.5); v.copy(f.p).applyMatrix4(tree.matrixWorld).project(camera);
      f.el.style.opacity = k > 0 ? 1 : 0; f.el.style.visibility = k > 0 ? "visible" : "hidden";
      f.el.style.transform = `translate(${((v.x + 1) * W / 2).toFixed(1)}px,${((1 - v.y) * H / 2).toFixed(1)}px) scale(${k.toFixed(3)})`;
      f.img.style.transform = reduce ? "" : `rotate(${(Math.sin(now / 1100 + f.ph) * 3).toFixed(2)}deg)`;
    }
    // 落ち葉
    if (!reduce && t > nextFall && fallT < 0) {
      const L = leafData[Math.floor(Math.random() * leafData.length)];
      fallP.copy(L.p).applyMatrix4(tree.matrixWorld); fallT = t; fall.visible = true; nextFall = t + 6 + Math.random() * 5;
    }
    if (fallT >= 0) {
      const k = t - fallT;
      fall.position.set(fallP.x + Math.sin(k * 2.2) * 0.12, Math.max(0.01, fallP.y - k * 0.28), fallP.z + Math.cos(k * 1.7) * 0.06);
      fall.rotation.set(k * 1.8, k * 1.1, Math.sin(k * 2.2) * 0.9);
      if (fall.position.y <= 0.012) { fall.rotation.set(-Math.PI / 2, 0, k); if (k > fallP.y / 0.28 + 2) { fall.visible = false; fallT = -1; } }
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
