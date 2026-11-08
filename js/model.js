// Procedural 3D human body. Units ≈ metres, height 1.75, y = 0 at the soles.
// +x = the person's LEFT, +z = anterior (front), +y = superior.
import * as THREE from 'three';
import { sweep, blob, rod, merge, V, boneProfile, bellyProfile, TubeSurf, EllSurf, patch, rect, deg, noise3 } from './geometry.js';
import { makeMaterial, xraySkinMaterial } from './materials.js';

const SIDES = [[1, 'L'], [-1, 'R']];
const mx = (s, p) => [s * p[0], p[1], p[2]];
const mxs = (s, pts) => pts.map((p) => mx(s, p));
const lerp = (a, b, t) => a + (b - a) * t;
const vlerp = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const arr = (v) => [v.x, v.y, v.z];
// Limb angle helper: anatomical degrees (0 lateral, 90 anterior, 180 medial, 270 posterior) → tube angle.
const limbA = (s, d) => deg(s > 0 ? 180 - d : d);
// Torso angle helper (left side given; right mirrored): 0 = lateral, 90 = anterior, 270 = posterior.
const torsoA = (s, d) => deg(s > 0 ? d : 180 - d);

export function buildModel() {
  const root = new THREE.Group();
  const parts = [];

  function add(id, system, geom, preset, opts = {}) {
    const mat = opts.material ?? makeMaterial(preset, opts.color);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.userData = { id, system, label: opts.label, side: opts.side, region: opts.region, explode: !!opts.explode, pickable: opts.pickable !== false };
    mesh.castShadow = false;
    root.add(mesh);
    parts.push(mesh);
    return mesh;
  }

  /* ================================================================ */
  /*  SURFACES (skin outline) — also used to lay muscles & vessels      */
  /* ================================================================ */
  const torsoY = [0.84, 0.91, 0.98, 1.05, 1.12, 1.19, 1.26, 1.33, 1.40, 1.47];
  const torsoR = [[.138, .088], [.172, .105], [.163, .104], [.15, .102], [.157, .111], [.168, .123], [.172, .127], [.174, .125], [.17, .118], [.115, .072]];
  const torsoZ = [-.01, -.012, -.006, 0, 0, 0, 0, -.004, -.012, -.02];
  const torso = new TubeSurf(torsoY.map((y, i) => [0, y, torsoZ[i]]), torsoR, [0, 0, 1]);
  const tY = (y) => (y - 0.84) / 0.63;

  const neck = new TubeSurf([[0, 1.42, -0.012], [0, 1.49, -0.006], [0, 1.56, -0.004]], [[.066, .066], [.06, .062], [.056, .06]], [0, 0, 1]);
  const headC = [0, 1.645, -0.003], headR = [0.083, 0.112, 0.108];
  const headSurf = new EllSurf(headC, headR);

  const ARM = { SH: [0.178, 1.405, -0.02], EL: [0.222, 1.125, -0.025], WR: [0.252, 0.875, 0.005] };
  const armPts = (s) => mxs(s, [[0.19, 1.42, -0.015], [0.205, 1.28, -0.02], [0.222, 1.125, -0.022], [0.238, 1.0, -0.01], [0.252, 0.875, 0.005]]);
  const armR = [[.05, .052], [.044, .046], [.036, .036], [.036, .032], [.026, .018]];
  const legPts = (s) => mxs(s, [[0.09, 0.93, -0.005], [0.092, 0.80, 0.0], [0.09, 0.66, 0.008], [0.086, 0.52, 0.012], [0.086, 0.40, -0.01], [0.085, 0.25, -0.005], [0.084, 0.09, -0.005]]);
  const legR = [[.085, .09], [.08, .085], [.068, .072], [.05, .055], [.052, .058], [.04, .045], [.03, .034]];
  const arms = {}, legs = {}, shoulders = {}, glutes = {};
  for (const [s, side] of SIDES) {
    arms[side] = new TubeSurf(armPts(s), armR, [0, 0, 1]);
    legs[side] = new TubeSurf(legPts(s), legR, [0, 0, 1]);
    shoulders[side] = new EllSurf(mx(s, [0.185, 1.40, -0.015]), [0.058, 0.06, 0.058]);
    glutes[side] = new EllSurf(mx(s, [0.075, 0.9, -0.075]), [0.08, 0.09, 0.06]);
  }

  /* ================================================================ */
  /*  INTEGUMENTARY — skin                                             */
  /* ================================================================ */
  const skinParts = [];
  skinParts.push(torso.geometry({ radial: 48, segments: 80 }));
  skinParts.push(neck.geometry({ radial: 40, segments: 20 }));
  skinParts.push(blob(headC, headR, {
    w: 64, h: 48,
    deform: (v) => {
      if (v.y < -0.2) v.x *= 1 - 0.28 * Math.min(1, (-0.2 - v.y) / 0.8);
      { const ex = Math.abs(v.x) - 0.37, ey = v.y - 0.045, d2 = (ex / 0.17) ** 2 + (ey / 0.1) ** 2; if (v.z > 0 && d2 < 1) v.z *= 1 - 0.15 * (1 - d2); } // eye sockets
      if (v.y < -0.55 && v.z < 0) v.z *= 0.75;
    },
  }));
  skinParts.push(blob([0, 1.618, 0.106], [0.011, 0.021, 0.016], { rot: [-0.3, 0, 0] })); // nose
  skinParts.push(blob([0, 1.574, 0.034], [0.07, 0.058, 0.07], { deform: (v) => { if (v.y < 0) v.x *= 1 + v.y * 0.2; } })); // jaw & mouth
  for (const [s, side] of SIDES) {
    skinParts.push(blob(mx(s, [0.083, 1.64, -0.008]), [0.008, 0.028, 0.017])); // ear
    skinParts.push(blob(mx(s, [0.185, 1.40, -0.015]), [0.058, 0.06, 0.058])); // shoulder
    skinParts.push(blob(mx(s, [0.075, 0.9, -0.075]), [0.08, 0.09, 0.06]));    // buttock
    skinParts.push(arms[side].geometry({ radial: 32, segments: 50 }));
    skinParts.push(legs[side].geometry({ radial: 36, segments: 70 }));
    skinParts.push(blob(mx(s, [0.085, 0.075, -0.003]), [0.037, 0.04, 0.042])); // ankle
    skinParts.push(blob(mx(s, [0.255, 0.825, 0.006]), [0.038, 0.045, 0.014])); // palm
    skinParts.push(blob(mx(s, [0.253, 0.866, 0.005]), [0.028, 0.024, 0.017])); // wrist
    for (const f of fingerChains(s)) skinParts.push(sweep(f.pts, f.r * 1.9, { radial: 12 }));
    skinParts.push(blob(mx(s, [0.089, 0.03, 0.05]), [0.047, 0.036, 0.135], {
      deform: (v) => { if (v.z > 0) v.y *= 1 - 0.18 * v.z; if (v.y < 0) v.y *= 0.85; },
    }));
  }
  const skinMat = xraySkinMaterial();
  const skin = add('skin', 'integumentary', merge(skinParts), null, { material: skinMat, pickable: false });
  skin.userData.isSkin = true;
  skin.renderOrder = 10;

  /* ================================================================ */
  /*  SKELETAL                                                         */
  /* ================================================================ */
  // --- skull ---
  const cranium = blob([0, 1.665, -0.012], [0.071, 0.078, 0.093], {
    w: 64, h: 48, deform: (v) => { if (v.y < -0.25) v.y = -0.25 + (v.y + 0.25) * 0.55; },
  });
  const face = blob([0, 1.603, 0.04], [0.056, 0.055, 0.05], {
    deform: (v) => { if (v.y < 0) { v.x *= 1 + v.y * 0.25; } if (v.z < -0.3) v.z = -0.3 + (v.z + 0.3) * 0.4; },
  });
  const skullBits = [cranium, face];
  for (const [s] of SIDES) {
    skullBits.push(sweep(mxs(s, [[0.045, 1.625, 0.06], [0.066, 1.628, 0.02], [0.066, 1.624, -0.012]]), 0.005));
    skullBits.push(blob(mx(s, [0.058, 1.6, -0.032]), [0.009, 0.014, 0.01])); // mastoid process
  }
  add('skull', 'skeletal', merge(skullBits), 'bone');
  const holes = [];
  for (const [s] of SIDES) holes.push(blob(mx(s, [0.031, 1.648, 0.074]), [0.018, 0.016, 0.012]));
  holes.push(blob([0, 1.617, 0.086], [0.009, 0.013, 0.006]));
  add('skull', 'skeletal', merge(holes), 'boneDark');

  // mandible
  const mand = [[0.055, 1.62, -0.012], [0.054, 1.578, -0.008], [0.049, 1.553, 0.002], [0.035, 1.546, 0.046], [0, 1.54, 0.074]];
  add('mandible', 'skeletal', sweep([...mand, ...mand.slice(0, -1).reverse().map((p) => mx(-1, p))], [[0.005, 0.011]], { ref: [0, 1, 0], radial: 14 }), 'bone');
  add('hyoid', 'skeletal', sweep([[0.02, 1.507, 0.01], [0.013, 1.505, 0.03], [0, 1.504, 0.036], [-0.013, 1.505, 0.03], [-0.02, 1.507, 0.01]], 0.003), 'bone');

  // teeth (digestive)
  const teeth = [];
  for (const [yy, ax, az, cz] of [[1.578, 0.027, 0.042, 0.033], [1.564, 0.025, 0.04, 0.034]]) {
    for (let k = 0; k < 16; k++) {
      const a = deg(-100 + (200 * k) / 15);
      const big = Math.abs(k - 7.5) > 4.5 ? 1.35 : 1;
      teeth.push(rod([ax * Math.sin(a), yy - 0.0045, cz + az * Math.cos(a)], [ax * Math.sin(a), yy + 0.0045, cz + az * Math.cos(a)], 0.0032 * big, 0.0032 * big, 8));
    }
  }
  add('teeth', 'digestive', merge(teeth), 'bone', { color: '#f6f1e3' });

  // --- vertebral column ---
  const spine = new THREE.CatmullRomCurve3([
    [0, 1.565, -0.012], [0, 1.50, -0.022], [0, 1.445, -0.035], [0, 1.38, -0.055], [0, 1.29, -0.068],
    [0, 1.19, -0.062], [0, 1.11, -0.045], [0, 1.04, -0.032], [0, 0.985, -0.045]].map((p) => V(...p)), false, 'centripetal');
  const levels = [];
  for (let i = 1; i <= 7; i++) levels.push({ name: `C${i}`, w: 1, region: 'C' });
  for (let i = 1; i <= 12; i++) levels.push({ name: `T${i}`, w: 1.4, region: 'T' });
  for (let i = 1; i <= 5; i++) levels.push({ name: `L${i}`, w: 1.8, region: 'L' });
  const tot = levels.reduce((a, l) => a + l.w, 0);
  let acc = 0;
  const vert = {};
  for (const lv of levels) {
    const u0 = acc / tot; acc += lv.w; const u1 = acc / tot;
    const u = (u0 + u1) / 2;
    const P = spine.getPointAt(u), T = spine.getTangentAt(u).negate(); // tangent pointing up
    const h = spine.getLength() * (u1 - u0);
    const idx = levels.indexOf(lv);
    const rb = lv.region === 'C' ? 0.0095 + idx * 0.0003 : lv.region === 'T' ? 0.012 + (idx - 7) * 0.0004 : 0.018 + (idx - 19) * 0.0008;
    const g = [];
    const body = new THREE.CylinderGeometry(rb, rb, h * 0.68, 18); body.scale(1.15, 1, 1); g.push(body);
    const cz = -rb * 1.45; // canal centre
    for (const sx of [1, -1]) {
      g.push(rod([sx * rb * 0.55, 0, -rb * 0.8], [sx * rb * 0.5, 0, cz - rb * 0.45], rb * 0.22));
      const tp = lv.region === 'L' ? 0.026 : lv.region === 'T' ? 0.02 : 0.012;
      g.push(rod([sx * rb * 0.5, 0, cz], [sx * (rb * 0.6 + tp), lv.region === 'T' ? 0.004 : 0, cz - (lv.region === 'T' ? 0.008 : 0.002)], rb * 0.2, rb * 0.15));
    }
    g.push(rod([rb * 0.5, 0, cz - rb * 0.45], [-rb * 0.5, 0, cz - rb * 0.45], rb * 0.2));
    const spLen = lv.region === 'C' ? (lv.name === 'C7' ? 0.026 : 0.014) : lv.region === 'T' ? 0.03 : 0.024;
    const spDrop = lv.region === 'T' ? -0.02 : lv.region === 'C' ? -0.004 : -0.004;
    g.push(rod([0, 0, cz - rb * 0.45], [0, spDrop, cz - rb * 0.45 - spLen], rb * 0.22, rb * 0.18));
    const geo = merge(g);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), T.clone().normalize());
    geo.applyQuaternion(q); geo.translate(P.x, P.y, P.z);
    const id = lv.name === 'C1' ? 'atlas' : lv.name === 'C2' ? 'axis' : { C: 'cervical_vertebrae', T: 'thoracic_vertebrae', L: 'lumbar_vertebrae' }[lv.region];
    add(id, 'skeletal', geo, 'bone', { label: `${lv.name} vertebra` });
    vert[lv.name] = { P, T, q, rb, h, canal: P.clone().add(V(0, 0, cz).applyQuaternion(q)) };
    if (idx > 0) {
      const prev = vert[levels[idx - 1].name];
      const mid = prev.P.clone().lerp(P, 0.5);
      const disc = new THREE.CylinderGeometry((rb + prev.rb) / 2 * 1.05, (rb + prev.rb) / 2 * 1.05, prev.P.distanceTo(P) - (h + prev.h) * 0.34, 18);
      disc.scale(1.15, 1, 1); disc.applyQuaternion(q); disc.translate(mid.x, mid.y, mid.z);
      add('intervertebral_disc', 'skeletal', disc, 'cartilage', { label: `${levels[idx - 1].name}–${lv.name} disc` });
    }
  }
  add('sacrum', 'skeletal', blob([0, 0.95, -0.075], [0.046, 0.06, 0.02], {
    rot: [0.38, 0, 0], deform: (v) => { v.x *= 0.55 + 0.45 * (v.y + 1) / 2; v.z -= 0.25 * (v.x * v.x); },
  }), 'bone');
  add('coccyx', 'skeletal', sweep([[0, 0.9, -0.092], [0, 0.878, -0.083], [0, 0.866, -0.068]], [0.007, 0.005, 0.003]), 'bone');

  // --- ribs, cartilage, sternum ---
  const ribW = [0.55, 0.7, 0.8, 0.88, 0.94, 0.98, 1, 1, 0.98, 0.95, 0.85, 0.72];
  const ribDrop = [0.03, 0.045, 0.06, 0.075, 0.085, 0.095, 0.1, 0.105, 0.105, 0.1, 0.06, 0.04];
  const sternY = [1.392, 1.37, 1.343, 1.315, 1.288, 1.26, 1.232];
  const ribEnds = {};
  for (const [s, side] of SIDES) {
    for (let i = 1; i <= 12; i++) {
      const v = vert[`T${i}`]; const w = ribW[i - 1]; const dz = 0.55 + 0.45 * w;
      const y = v.P.y;
      const head = arr(v.P.clone().add(V(s * v.rb * 1.1, 0, -v.rb * 0.4)));
      let pts = [head, [s * 0.05 * w, y + 0.006, -0.098 * (0.85 + 0.15 * w)], [s * 0.12 * w, y - 0.012, -0.055 * dz], [s * 0.14 * w, y - 0.035, 0.02 * dz], [s * 0.112 * w, y - 0.065, 0.074 * dz], [s * 0.07 * w, y - ribDrop[i - 1], 0.092 * dz]];
      if (i === 11) pts = pts.slice(0, 5);
      if (i === 12) pts = pts.slice(0, 4);
      add('ribs', 'skeletal', sweep(pts, [[0.0034, 0.0066]], { ref: [0, 1, 0], radial: 10 }), 'bone', { label: `Rib ${i} (${side === 'L' ? 'left' : 'right'})`, side });
      ribEnds[`${side}${i}`] = pts[pts.length - 1];
      if (i <= 7) {
        const e = pts[pts.length - 1];
        add('costal_cartilage', 'skeletal', sweep([e, vlerp(e, [s * 0.02, sternY[i - 1], 0.102], 0.5), [s * 0.016, sternY[i - 1], 0.102]], 0.0042), 'cartilage', { label: `Costal cartilage ${i}` });
      } else if (i <= 10) {
        const e = pts[pts.length - 1]; const up = ribEnds[`${side}${i - 1}`];
        add('costal_cartilage', 'skeletal', sweep([e, vlerp(e, up, 0.6), [up[0] * 0.92, up[1] - 0.004, up[2]]], 0.0038), 'cartilage', { label: `Costal cartilage ${i}` });
      }
    }
  }
  add('sternum', 'skeletal', merge([
    blob([0, 1.385, 0.094], [0.026, 0.024, 0.008], { deform: (v) => { if (v.y < 0) v.x *= 1 + v.y * 0.35; } }),
    blob([0, 1.30, 0.105], [0.016, 0.072, 0.0075], { rot: [-0.12, 0, 0] }),
    blob([0, 1.218, 0.102], [0.008, 0.016, 0.004], { rot: [-0.2, 0, 0] }),
  ]), 'bone');

  // --- shoulder girdle & upper limb ---
  for (const [s, side] of SIDES) {
    add('clavicle', 'skeletal', sweep(mxs(s, [[0.018, 1.405, 0.092], [0.07, 1.414, 0.09], [0.12, 1.424, 0.055], [0.166, 1.432, 0.0]]), [0.0075, 0.0062, 0.0062, 0.0078]), 'bone', { side });
    add('scapula', 'skeletal', merge([
      blob(mx(s, [0.112, 1.345, -0.098]), [0.05, 0.085, 0.006], { rot: [0.1, -s * 0.45, -s * 0.12], deform: (v) => { v.x *= 1 - 0.55 * Math.max(0, -v.y); v.z += 0.3 * v.x * v.x; } }),
      sweep(mxs(s, [[0.065, 1.4, -0.112], [0.12, 1.418, -0.105], [0.166, 1.432, -0.05]]), [0.004, 0.006, 0.008]), // spine of scapula → acromion
      sweep(mxs(s, [[0.14, 1.41, -0.06], [0.152, 1.415, -0.02], [0.148, 1.41, 0.01]]), [0.006, 0.005, 0.004]), // coracoid
      blob(mx(s, [0.163, 1.4, -0.04]), [0.006, 0.018, 0.013]), // glenoid
    ]), 'bone', { side });

    const { SH, EL, WR } = ARM;
    add('humerus', 'skeletal', merge([
      sweep(mxs(s, [[SH[0], SH[1] - 0.005, SH[2]], [0.198, 1.27, -0.023], EL]), boneProfile(0.0105, 0.02, 0.019), { radial: 16 }),
      blob(mx(s, [0.172, 1.408, -0.02]), [0.023, 0.023, 0.023]),
      blob(mx(s, [0.188, 1.398, -0.006]), [0.012, 0.012, 0.012]), // greater tubercle
      blob(mx(s, [EL[0] - 0.024, EL[1] + 0.008, EL[2]]), [0.009, 0.009, 0.008]), // medial epicondyle
      blob(mx(s, [EL[0] + 0.02, EL[1] + 0.006, EL[2]]), [0.007, 0.008, 0.007]),
    ]), 'bone', { side });
    add('ulna', 'skeletal', merge([
      sweep(mxs(s, [[EL[0] - 0.01, EL[1] + 0.022, EL[2] - 0.014], [EL[0] - 0.01, EL[1] - 0.04, EL[2] - 0.004], [WR[0] - 0.015, WR[1] + 0.008, WR[2] - 0.003]]), boneProfile(0.0062, 0.012, 0.0075), { radial: 14 }),
      blob(mx(s, [WR[0] - 0.016, WR[1] + 0.004, WR[2] - 0.006]), [0.005, 0.005, 0.005]), // styloid
    ]), 'bone', { side });
    add('radius', 'skeletal', sweep(mxs(s, [[EL[0] + 0.013, EL[1] - 0.012, EL[2] + 0.002], [EL[0] + 0.02, EL[1] - 0.1, EL[2] + 0.004], [WR[0] + 0.011, WR[1] + 0.004, WR[2] + 0.004]]), boneProfile(0.0062, 0.0095, 0.0135), { radial: 14 }), 'bone', { side });

    const carp = [];
    for (const [row, yy] of [[0, WR[1] - 0.012], [1, WR[1] - 0.028]]) {
      for (const dx of [-0.016, -0.0055, 0.005, 0.0155]) carp.push(blob(mx(s, [WR[0] + dx, yy, WR[2] + (row ? 0.002 : 0)]), [0.0058, 0.0072, 0.0068]));
    }
    add('carpals', 'skeletal', merge(carp), 'bone', { side });
    const mc = [], ph = [];
    for (const f of fingerChains(s)) {
      mc.push(sweep(f.pts.slice(0, 2), boneProfile(f.r * 0.75, f.r * 1.2, f.r * 1.15, 0.2), { radial: 10 }));
      for (let k = 1; k < f.pts.length - 1; k++) ph.push(sweep([f.pts[k], f.pts[k + 1]].map((p, j) => j === 0 ? vlerp(p, f.pts[k + 1], 0.06) : p), boneProfile(f.r * 0.7, f.r, f.r * 0.85, 0.2), { radial: 10 }));
    }
    add('metacarpals', 'skeletal', merge(mc), 'bone', { side });
    add('phalanges_hand', 'skeletal', merge(ph), 'bone', { side });

    // --- pelvis & lower limb ---
    add('pelvis', 'skeletal', merge([
      blob(mx(s, [0.093, 1.005, -0.028]), [0.056, 0.056, 0.01], { rot: [0.15, -s * 0.65, s * 0.15], deform: (v) => { v.z -= 0.35 * v.x * v.x; if (v.y < 0) v.x *= 1 + v.y * 0.45; } }),
      sweep(mxs(s, [[0.086, 0.952, -0.006], [0.072, 0.926, 0.036], [0.032, 0.9, 0.06], [0.006, 0.886, 0.064], [0.033, 0.866, 0.04], [0.055, 0.851, 0.0], [0.066, 0.856, -0.034], [0.082, 0.9, -0.032]]), 0.0105, { closed: true, radial: 12 }),
      sweep(mxs(s, [[0.045, 1.035, -0.075], [0.07, 1.06, -0.06], [0.12, 1.05, -0.0], [0.122, 1.02, 0.03]]), [0.006, 0.008, 0.008, 0.007]), // iliac crest rim
      blob(mx(s, [0.093, 0.927, 0.0]), [0.026, 0.026, 0.024]), // acetabulum
    ]), 'bone', { side });

    const H = [0.088, 0.925, 0.002];
    add('femur', 'skeletal', merge([
      blob(mx(s, H), [0.0235, 0.0235, 0.0235]),
      sweep(mxs(s, [H, [0.103, 0.914, -0.002], [0.118, 0.902, -0.004]]), 0.0135),
      blob(mx(s, [0.129, 0.916, -0.01]), [0.016, 0.02, 0.017]), // greater trochanter
      blob(mx(s, [0.105, 0.872, -0.012]), [0.009, 0.009, 0.009]), // lesser trochanter
      sweep(mxs(s, [[0.118, 0.905, -0.003], [0.108, 0.7, 0.012], [0.09, 0.515, -0.002]]), boneProfile(0.0135, 0.019, 0.024, 0.1), { radial: 18 }),
      blob(mx(s, [0.07, 0.505, -0.006]), [0.018, 0.02, 0.024]), blob(mx(s, [0.108, 0.505, -0.006]), [0.018, 0.02, 0.023]), // condyles
    ]), 'bone', { side });
    add('patella', 'skeletal', blob(mx(s, [0.09, 0.522, 0.04]), [0.02, 0.025, 0.009], { deform: (v) => { if (v.y < 0) v.x *= 1 + v.y * 0.4; } }), 'bone', { side });
    add('tibia', 'skeletal', merge([
      blob(mx(s, [0.088, 0.478, -0.002]), [0.036, 0.013, 0.03]),
      blob(mx(s, [0.09, 0.455, 0.024]), [0.008, 0.01, 0.008]), // tibial tuberosity
      sweep(mxs(s, [[0.088, 0.47, 0.0], [0.087, 0.3, 0.01], [0.083, 0.09, 0.0]]), boneProfile(0.0115, 0.024, 0.017, 0.1), { radial: 16 }),
      blob(mx(s, [0.07, 0.076, 0.0]), [0.008, 0.012, 0.009]), // medial malleolus
    ]), 'bone', { side });
    add('fibula', 'skeletal', merge([
      sweep(mxs(s, [[0.118, 0.465, -0.016], [0.117, 0.3, -0.012], [0.113, 0.075, -0.01]]), boneProfile(0.0052, 0.0085, 0.0085), { radial: 12 }),
      blob(mx(s, [0.114, 0.066, -0.01]), [0.008, 0.014, 0.009]), // lateral malleolus
    ]), 'bone', { side });

    const tars = [
      blob(mx(s, [0.088, 0.06, 0.0]), [0.017, 0.013, 0.022]),
      blob(mx(s, [0.09, 0.03, -0.03]), [0.017, 0.02, 0.036], { rot: [0.15, 0, 0] }),
      blob(mx(s, [0.078, 0.052, 0.03]), [0.014, 0.01, 0.008]),
      blob(mx(s, [0.108, 0.035, 0.032]), [0.011, 0.011, 0.015]),
    ];
    for (const x of [0.065, 0.078, 0.091]) tars.push(blob(mx(s, [x, 0.045, 0.048]), [0.0062, 0.009, 0.01]));
    add('tarsals', 'skeletal', merge(tars), 'bone', { side });
    const mt = [], tp = [];
    const mtx = [0.066, 0.078, 0.089, 0.1, 0.111], tipz = [0.128, 0.122, 0.115, 0.107, 0.098], tlen = [0.03, 0.024, 0.021, 0.018, 0.016];
    for (let k = 0; k < 5; k++) {
      const base = [mtx[k], 0.042, 0.058], tip = [mtx[k] * (k === 0 ? 0.92 : 1.0) + k * 0.002, 0.013, tipz[k]];
      const r = k === 0 ? 0.0075 : 0.0052;
      mt.push(sweep(mxs(s, [base, tip]), boneProfile(r * 0.75, r * 1.2, r * 1.1, 0.2), { radial: 10 }));
      const nseg = k === 0 ? 2 : 3;
      let p0 = tip;
      for (let j = 0; j < nseg; j++) {
        const L = tlen[k] / nseg * (j === 0 ? 1.3 : 0.85);
        const p1 = [p0[0], p0[1] - 0.0025, p0[2] + L];
        tp.push(sweep(mxs(s, [vlerp(p0, p1, 0.08), p1]), boneProfile(r * 0.65, r * 0.9, r * 0.75, 0.2), { radial: 8 }));
        p0 = p1;
      }
    }
    add('metatarsals', 'skeletal', merge(mt), 'bone', { side });
    add('phalanges_foot', 'skeletal', merge(tp), 'bone', { side });
  }

  /* ================================================================ */
  /*  MUSCULAR                                                         */
  /* ================================================================ */
  const M = (id, geo, side, preset = 'muscle', label) => add(id, 'muscular', geo, preset, { side, label });
  const cranSurf = new EllSurf([0, 1.665, -0.012], [0.071, 0.078, 0.093]);
  M('frontalis', patch(cranSurf, rect(deg(50), deg(130), 0.56, 0.82), -0.0008, 0.004, { edge: 0.5, outward: true }));
  M('orbicularis_oris', new THREE.TorusGeometry(0.016, 0.0034, 10, 32).scale(1.2, 0.72, 1).translate(0, 1.572, 0.086));
  for (const [s, side] of SIDES) {
    const ts = (d) => torsoA(s, d);
    M('temporalis', patch(cranSurf, (u, v) => [deg(s > 0 ? lerp(-55, 35, u) : lerp(145, 235, u)), lerp(0.36, 0.66 - 0.08 * Math.abs(u - 0.5), v)], -0.0008, 0.0065, { edge: 0.5, outward: true }), side);
    M('masseter', blob(mx(s, [0.054, 1.576, 0.018]), [0.009, 0.026, 0.017], { rot: [0.25, 0, 0] }), side);
    M('orbicularis_oculi', new THREE.TorusGeometry(0.016, 0.0028, 8, 28).rotateY(s * 0.4).translate(...mx(s, [0.03, 1.651, 0.08])), side);
    M('sternocleidomastoid', sweep(mxs(s, [[0.016, 1.418, 0.07], [0.028, 1.47, 0.04], [0.038, 1.53, 0.012], [0.058, 1.598, -0.03]]), bellyProfile(0.0105, 0.4), { radial: 14 }), side);
    // trapezius: neck part + thoracic sheet
    M('trapezius', merge([
      patch(neck, (u, v) => [ts(lerp(272, 330, u)), lerp(0.05, 0.98, v)], 0.002, 0.008),
      patch(torso, (u, v) => [ts(lerp(271, 345, u)), lerp(tY(lerp(1.13, 1.37, u ** 0.7)), 0.97, v)], 0.002, 0.009),
    ]), side);
    M('latissimus_dorsi', patch(torso, (u, v) => [ts(lerp(271, 352, u)), lerp(tY(lerp(0.96, 1.22, u)), tY(lerp(1.24, 1.33, u)), v)], 0.003, 0.01), side);
    M('erector_spinae', patch(torso, rect(ts(272), ts(292), tY(0.92), tY(1.38)), 0.011, 0.016), side);
    M('pectoralis_major', patch(torso, (u, v) => [ts(lerp(88, 22, u)), lerp(tY(lerp(1.225, 1.345, u ** 1.3)), tY(lerp(1.408, 1.395, u)), v)], 0.003, 0.015), side);
    M('serratus_anterior', patch(torso, rect(ts(32), ts(-6), tY(1.17), tY(1.33)), 0.004, 0.008, { thickMod: (u, v) => 0.55 + 0.45 * Math.abs(Math.sin(v * Math.PI * 4)) }), side);
    M('rectus_abdominis', patch(torso, rect(ts(89.3), ts(75), tY(0.88), tY(1.27)), 0.003, 0.011, {
      nv: 60, edge: 0.25,
      thickMod: (u, v) => { const y = lerp(0.88, 1.27, v); let m = 1; for (const yi of [1.065, 1.135, 1.205]) m = Math.min(m, 0.55 + 0.45 * Math.min(1, Math.abs(y - yi) / 0.008)); return m; },
    }), side);
    M('external_oblique', patch(torso, (u, v) => [ts(lerp(74, -8, u)), lerp(tY(lerp(0.95, 1.0, u)), tY(lerp(1.26, 1.22, u)), v)], 0.0035, 0.008), side);
    M('gluteus_medius', patch(torso, rect(ts(-8), ts(-52), tY(0.92), tY(1.03)), 0.004, 0.012), side);
    M('gluteus_maximus', patch(glutes[side], (u, v) => [deg(s > 0 ? lerp(190, 345, u) : lerp(195, 350, u)), lerp(0.12, 0.85, v)], 0.004, 0.022), side);

    const sh = shoulders[side];
    M('deltoid', merge([
      patch(sh, (u, v) => { const half = lerp(20, 88, v ** 0.6); const c = s > 0 ? 5 : 175; return [deg(c + lerp(-half, half, u) * (s > 0 ? 1 : -1)), lerp(0.08, 0.9, v)]; }, 0.003, 0.016),
      patch(arms[side], (u, v) => [limbA(s, lerp(-35, 35, u) * (1 - v * 0.7)), lerp(0.02, 0.25, v)], 0.003, 0.012),
    ]), side);
    const A = arms[side];
    M('biceps_brachii', patch(A, rect(limbA(s, 55), limbA(s, 125), 0.06, 0.47), 0.003, 0.017, { edge: 0.6 }), side);
    M('triceps_brachii', patch(A, rect(limbA(s, 215), limbA(s, 330), 0.03, 0.5), 0.003, 0.016, { edge: 0.55 }), side);
    M('brachioradialis', patch(A, rect(limbA(s, 8), limbA(s, 70), 0.4, 0.86), 0.002, 0.01), side);
    M('forearm_flexors', patch(A, rect(limbA(s, 75), limbA(s, 200), 0.5, 0.93), 0.002, 0.012), side);
    M('forearm_extensors', patch(A, rect(limbA(s, 215), limbA(s, 358), 0.5, 0.93), 0.002, 0.011), side);

    const L = legs[side];
    M('rectus_femoris', patch(L, rect(limbA(s, 68), limbA(s, 112), 0.03, 0.46), 0.002, 0.016, { edge: 0.6 }), side);
    M('vastus_lateralis', patch(L, rect(limbA(s, -5), limbA(s, 70), 0.06, 0.47), 0.003, 0.016), side);
    M('vastus_medialis', patch(L, rect(limbA(s, 108), limbA(s, 162), 0.22, 0.485), 0.003, 0.018, { edge: 0.6 }), side);
    M('sartorius', patch(L, (u, v) => [limbA(s, lerp(50, 178, v) + lerp(-7, 7, u)), lerp(0.0, 0.54, v)], 0.002, 0.006, { nv: 50 }), side);
    M('adductors', patch(L, rect(limbA(s, 150), limbA(s, 215), 0.02, 0.38), 0.003, 0.016), side);
    M('iliotibial_band', patch(L, rect(limbA(s, -14), limbA(s, 12), 0.0, 0.5), 0.0012, 0.003), side, 'tendon');
    M('biceps_femoris', patch(L, rect(limbA(s, 275), limbA(s, 335), 0.05, 0.49), 0.003, 0.016), side);
    M('semitendinosus', patch(L, rect(limbA(s, 212), limbA(s, 272), 0.05, 0.49), 0.003, 0.016), side, 'muscle', 'Semitendinosus & semimembranosus');
    M('gastrocnemius', patch(L, rect(limbA(s, 195), limbA(s, 345), 0.5, 0.79), 0.002, 0.022, { thickMod: (u, v) => (0.75 + 0.25 * Math.abs(Math.cos(u * Math.PI))) * (v < 0.35 ? 1 : 1 - (v - 0.35) * 0.9) }), side);
    M('soleus', patch(L, rect(limbA(s, 170), limbA(s, 370), 0.6, 0.9), 0.012, 0.012), side);
    M('tibialis_anterior', patch(L, rect(limbA(s, 55), limbA(s, 96), 0.54, 0.93), 0.002, 0.012), side);
    M('achilles_tendon', sweep(mxs(s, [[0.085, 0.21, -0.045], [0.086, 0.12, -0.05], [0.088, 0.045, -0.062]]), [[0.007, 0.0035]], { ref: [0, 0, 1] }), side, 'tendon');
  }

  /* ================================================================ */
  /*  NERVOUS                                                          */
  /* ================================================================ */
  const lobeOf = (n) => n.z < -0.62 ? 'occipital_lobe' : (n.y < -0.28 && n.z > -0.62) ? 'temporal_lobe' : n.z > 0.22 ? 'frontal_lobe' : 'parietal_lobe';
  const lobeTint = { frontal_lobe: [1, 0.86, 0.82], parietal_lobe: [0.96, 0.84, 0.9], temporal_lobe: [0.98, 0.9, 0.78], occipital_lobe: [0.88, 0.86, 0.96] };
  for (const [s, side] of SIDES) {
    const c = mx(s, [0.032, 1.674, -0.012]), r = [0.032, 0.053, 0.077];
    const g = blob(c, r, {
      w: 96, h: 72,
      deform: (v) => {
        if (v.x * s < -0.55) v.x = s * (-0.55 + (v.x * s + 0.55) * 0.25); // medial face flat (longitudinal fissure)
        if (v.y < -0.3 && v.z > -0.2 && v.z < 0.25) v.y = -0.3 + (v.y + 0.3) * 0.5; // lateral sulcus notch
        const gy = Math.sin(17 * v.x + 3 * Math.sin(9 * v.y)) * Math.sin(15 * v.y + 3 * Math.sin(11 * v.z)) * Math.sin(13 * v.z + 2 * Math.sin(7 * v.x));
        v.multiplyScalar(1 + 0.05 * Math.abs(gy) - 0.02);
      },
    });
    const col = [], p = g.attributes.position, n = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      n.set((p.getX(i) - c[0]) / r[0], (p.getY(i) - c[1]) / r[1], (p.getZ(i) - c[2]) / r[2]);
      const t = lobeTint[lobeOf(n)]; col.push(...t);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    add('cerebrum', 'nervous', g, 'brain', {
      side, label: `Cerebrum (${side === 'L' ? 'left' : 'right'} hemisphere)`,
      region: (pt) => lobeOf(V((pt.x - c[0]) / r[0], (pt.y - c[1]) / r[1], (pt.z - c[2]) / r[2])),
    });
  }
  add('cerebellum', 'nervous', blob([0, 1.616, -0.058], [0.047, 0.024, 0.032], { w: 64, h: 64, deform: (v) => { v.multiplyScalar(1 + 0.035 * Math.sin(v.y * 45)); if (Math.abs(v.x) < 0.15 && v.z < 0) v.z *= 0.85; } }), 'brain', { color: '#e8b2a8' });
  add('brainstem', 'nervous', sweep([[0, 1.655, -0.012], [0, 1.625, -0.02], [0, 1.598, -0.022], [0, 1.57, -0.024]], [0.012, 0.013, 0.01, 0.008]), 'brain', { color: '#e5bdb0' });
  const cordPts = [[0, 1.572, -0.024]];
  for (const lv of levels) { if (lv.name === 'L2') break; cordPts.push(arr(vert[lv.name].canal)); }
  add('spinal_cord', 'nervous', sweep(cordPts, (t) => 0.0055 - 0.0018 * t + 0.0009 * Math.exp(-(((t - 0.25) / 0.06) ** 2)) + 0.0008 * Math.exp(-(((t - 0.88) / 0.05) ** 2)), { radial: 12 }), 'nerve', { color: '#f4e2a0' });
  const ce = [];
  const L1 = arr(vert.L1.canal);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const path = [L1];
    for (const n of ['L2', 'L3', 'L4', 'L5']) path.push(arr(vert[n].canal.clone().add(V(Math.cos(a) * 0.0035, 0, Math.sin(a) * 0.0035))));
    path.push([Math.cos(a) * 0.01, 0.94, -0.085]);
    ce.push(sweep(path, 0.0011, { radial: 6 }));
  }
  add('cauda_equina', 'nervous', merge(ce), 'nerve');

  const N = (id, pts, r, side, label) => add(id, 'nervous', sweep(pts, r, { radial: 8 }), 'nerve', { side, label });
  for (const [s, side] of SIDES) {
    // eye (sensory)
    const ec = mx(s, [0.031, 1.65, 0.075]);
    add('eye', 'nervous', merge([blob(ec, [0.012, 0.012, 0.012])]), 'eyeWhite', { side });
    add('eye', 'nervous', new THREE.CylinderGeometry(0.0055, 0.0055, 0.0015, 24).rotateX(Math.PI / 2).translate(ec[0], ec[1], ec[2] + 0.0118), 'iris', { side });
    add('eye', 'nervous', new THREE.CylinderGeometry(0.0022, 0.0022, 0.0017, 16).rotateX(Math.PI / 2).translate(ec[0], ec[1], ec[2] + 0.0122), 'boneDark', { side });
    N('optic_nerve', mxs(s, [[0.031, 1.649, 0.063], [0.022, 1.645, 0.045], [0.008, 1.638, 0.022], [0, 1.636, 0.016]]), 0.0022, side);
    // inner ear: cochlea + semicircular canals
    const cp = []; const cc = mx(s, [0.05, 1.622, -0.012]);
    for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 5; const rr = 0.0065 * (1 - i / 75); cp.push([cc[0] + s * 0.001 * i / 60, cc[1] + Math.sin(a) * rr, cc[2] + Math.cos(a) * rr + 0.004]); }
    add('inner_ear', 'nervous', merge([
      sweep(cp, (t) => 0.0019 * (1 - t * 0.5), { radial: 8, segments: 120 }),
      new THREE.TorusGeometry(0.005, 0.0009, 6, 20).translate(cc[0] - s * 0.002, cc[1] + 0.008, cc[2] - 0.008),
      new THREE.TorusGeometry(0.005, 0.0009, 6, 20).rotateY(Math.PI / 2).translate(cc[0] - s * 0.002, cc[1] + 0.006, cc[2] - 0.01),
      new THREE.TorusGeometry(0.005, 0.0009, 6, 20).rotateX(Math.PI / 2).translate(cc[0] - s * 0.002, cc[1] + 0.002, cc[2] - 0.012),
    ]), 'bone', { side, color: '#f3e6c4' });

    N('vagus_nerve', mxs(s, [[0.012, 1.595, -0.02], [0.03, 1.56, -0.005], [0.036, 1.5, 0.006], [0.032, 1.42, 0.004], [0.026, 1.36, -0.008], [0.012, 1.26, -0.02], [0.01, 1.17, -0.008], [s > 0 ? 0.035 : 0.025, 1.13, 0.03]]), 0.0017, side);
    N('phrenic_nerve', mxs(s, [[0.03, 1.535, -0.012], [0.038, 1.47, 0.002], [0.04, 1.4, 0.015], [0.055, 1.31, 0.04], [0.066, 1.24, 0.03], [0.07, 1.19, 0.01]]), 0.0014, side);
    // sympathetic trunk with ganglia
    const st = [], gang = [];
    for (const lv of levels) {
      const v = vert[lv.name];
      const p = v.P.clone().add(V(s * (v.rb * 1.25), 0, v.rb * 0.3));
      st.push(arr(p));
      gang.push(blob(arr(p), [0.0025, 0.0035, 0.0025], { w: 8, h: 6 }));
    }
    add('sympathetic_trunk', 'nervous', merge([sweep(st, 0.001, { radial: 6 }), ...gang]), 'nerve', { side });
    // brachial plexus
    const bp = [];
    for (const [lvn, dz] of [['C5', 0.004], ['C6', 0.002], ['C7', 0], ['C8', -0.002], ['T1', -0.004]]) {
      const lvv = lvn === 'C8' ? vert.C7 : vert[lvn];
      const o = lvv.canal.clone().add(V(s * 0.012, lvn === 'C8' ? -0.006 : 0, 0));
      bp.push(sweep([arr(o), mx(s, [0.06, 1.44, -0.022 + dz]), mx(s, [0.12, 1.405, -0.02 + dz]), mx(s, [0.165, 1.37, -0.022])], 0.0018, { radial: 6 }));
    }
    add('brachial_plexus', 'nervous', merge(bp), 'nerve', { side });
    const A = arms[side];
    const along = (S, list) => list.map(([t, d, ins]) => arr(S.at(t, limbA(s, d), ins)));
    N('median_nerve', along(A, [[0.03, 140, 0.02], [0.25, 145, 0.018], [0.5, 110, 0.017], [0.75, 95, 0.013], [0.99, 92, 0.008]]).concat([mx(s, [0.256, 0.835, 0.012])]), 0.0019, side);
    N('ulnar_nerve', along(A, [[0.03, 175, 0.02], [0.3, 195, 0.017], [0.5, 225, 0.012], [0.7, 165, 0.013], [0.99, 150, 0.008]]).concat([mx(s, [0.243, 0.84, 0.01])]), 0.0017, side);
    N('radial_nerve', along(A, [[0.03, 200, 0.022], [0.15, 270, 0.02], [0.3, 330, 0.02], [0.48, 30, 0.016], [0.7, 40, 0.009], [0.98, 40, 0.005]]), 0.0017, side);
    const Lg = legs[side];
    N('femoral_nerve', [mx(s, [0.03, 1.04, -0.035]), mx(s, [0.055, 0.98, 0.0]), mx(s, [0.075, 0.94, 0.04]), ...along(Lg, [[0.03, 95, 0.02], [0.12, 100, 0.02], [0.25, 120, 0.025]])], 0.0018, side);
    N('sciatic_nerve', [mx(s, [0.03, 0.95, -0.06]), mx(s, [0.06, 0.915, -0.065]), ...along(Lg, [[0.06, 275, 0.035], [0.18, 270, 0.03], [0.32, 270, 0.028]])], 0.0032, side);
    N('tibial_nerve', along(Lg, [[0.32, 270, 0.028], [0.5, 270, 0.025], [0.7, 250, 0.022], [0.95, 205, 0.012], [1, 195, 0.01]]), 0.0022, side);
    N('common_peroneal_nerve', along(Lg, [[0.32, 272, 0.028], [0.45, 305, 0.02], [0.55, 345, 0.008], [0.6, 15, 0.006], [0.75, 65, 0.016], [0.95, 75, 0.012]]), 0.0016, side);
  }

  /* ================================================================ */
  /*  CIRCULATORY                                                      */
  /* ================================================================ */
  const heartC = [0.018, 1.245, 0.045], heartR = [0.05, 0.06, 0.042], heartRot = new THREE.Euler(-0.35, 0, 0.75);
  const heartDeform = (v) => { if (v.y < 0) { const k = 1 + v.y * 0.55; v.x *= k; v.z *= k; } else { v.x *= 1.08; } };
  const heartM = new THREE.Matrix4().makeRotationFromEuler(heartRot);
  const heartInv = heartM.clone().invert();
  const heartAt = (lat, lon, out = 1.03) => {
    const v = V(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon));
    heartDeform(v); v.set(v.x * heartR[0], v.y * heartR[1], v.z * heartR[2]).multiplyScalar(out).applyMatrix4(heartM);
    return [v.x + heartC[0], v.y + heartC[1], v.z + heartC[2]];
  };
  add('heart', 'circulatory', blob(heartC, heartR, {
    w: 64, h: 48, rot: [heartRot.x, heartRot.y, heartRot.z],
    deform: (v) => { heartDeform(v); v.multiplyScalar(1 + 0.012 * noise3(v.x * 3, v.y * 3, v.z * 3)); },
  }), 'organ', {
    color: '#b8322f', explode: true,
    region: (pt) => {
      const l = V(pt.x - heartC[0], pt.y - heartC[1], pt.z - heartC[2]).applyMatrix4(heartInv);
      const n = V(l.x / heartR[0], l.y / heartR[1], l.z / heartR[2]);
      if (n.y > 0.38) return n.z < -0.1 || n.x > 0.35 ? 'left_atrium' : 'right_atrium';
      return n.x < -0.05 || n.z > 0.55 ? 'right_ventricle' : 'left_ventricle';
    },
  });
  const cor = [];
  const path = (fn, n = 12) => Array.from({ length: n }, (_, i) => fn(i / (n - 1)));
  cor.push(sweep(path((t) => heartAt(lerp(0.75, -1.25, t), deg(80))), 0.0016)); // LAD
  cor.push(sweep(path((t) => heartAt(0.42, deg(lerp(95, 215, t)))), 0.0017)); // RCA
  cor.push(sweep(path((t) => heartAt(lerp(0.42, -0.6, t), deg(220))), 0.0013)); // posterior descending
  cor.push(sweep(path((t) => heartAt(0.42, deg(lerp(70, -60, t)))), 0.0015)); // circumflex
  cor.push(sweep(path((t) => heartAt(lerp(0.3, -0.7, t), deg(15))), 0.0012)); // obtuse marginal
  add('coronary_arteries', 'circulatory', merge(cor), 'artery', { explode: true });

  const ART = (id, pts, r, side, label) => add(id, 'circulatory', sweep(pts, r, { radial: 12 }), 'artery', { side, label });
  const VEN = (id, pts, r, side, label) => add(id, 'circulatory', sweep(pts, r, { radial: 12 }), 'vein', { side, label });
  ART('aorta', [[0.012, 1.285, 0.048], [0.008, 1.33, 0.042], [0.006, 1.362, 0.028], [0.014, 1.374, 0.002], [0.024, 1.362, -0.03], [0.027, 1.32, -0.045], [0.022, 1.2, -0.047], [0.014, 1.12, -0.038], [0.009, 1.05, -0.024], [0.002, 1.0, -0.016]], [0.0125, 0.0125, 0.012, 0.0115, 0.011, 0.0105, 0.01, 0.0095, 0.009, 0.0085]);
  ART('pulmonary_trunk', [[0.0, 1.268, 0.078], [0.012, 1.3, 0.066], [0.02, 1.318, 0.045]], 0.0115);
  ART('pulmonary_trunk', [[0.02, 1.318, 0.045], [0.045, 1.315, 0.015], [0.065, 1.305, -0.005]], 0.008, 'L', 'Left pulmonary artery');
  ART('pulmonary_trunk', [[0.02, 1.318, 0.045], [-0.02, 1.318, 0.015], [-0.065, 1.305, -0.005]], 0.008, 'R', 'Right pulmonary artery');
  for (const m of parts.filter((p) => p.userData.id === 'pulmonary_trunk')) m.material.color.set('#6a4fc4');
  ART('subclavian_artery', [[0.004, 1.37, 0.024], [-0.012, 1.4, 0.022], [-0.018, 1.414, 0.02]], 0.0065, 'R', 'Brachiocephalic trunk');
  ART('subclavian_artery', [[-0.018, 1.414, 0.02], [-0.05, 1.428, 0.004], [-0.1, 1.425, -0.006], [-0.14, 1.405, -0.012], [-0.172, 1.37, -0.02]], 0.0052, 'R');
  ART('subclavian_artery', [[0.022, 1.368, -0.012], [0.035, 1.41, -0.006], [0.06, 1.428, -0.004], [0.1, 1.425, -0.006], [0.14, 1.405, -0.012], [0.172, 1.37, -0.02]], 0.0052, 'L');
  ART('common_carotid', [[-0.018, 1.414, 0.02], [-0.025, 1.45, 0.02], [-0.03, 1.5, 0.016], [-0.033, 1.54, 0.008], [-0.035, 1.6, -0.004]], 0.0045, 'R');
  ART('common_carotid', [[0.012, 1.374, 0.008], [0.022, 1.42, 0.016], [0.03, 1.5, 0.016], [0.033, 1.54, 0.008], [0.035, 1.6, -0.004]], 0.0045, 'L');
  for (const [s, side] of SIDES) {
    const A = arms[side], Lg = legs[side];
    const along = (S, list) => list.map(([t, d, ins]) => arr(S.at(t, limbA(s, d), ins)));
    ART('brachial_artery', [mx(s, [0.172, 1.37, -0.02]), ...along(A, [[0.08, 150, 0.018], [0.3, 145, 0.017], [0.5, 110, 0.016]])], 0.0036, side);
    ART('radial_artery', along(A, [[0.5, 110, 0.016], [0.6, 70, 0.012], [0.8, 50, 0.008], [0.99, 45, 0.004]]), 0.0025, side);
    ART('ulnar_artery', along(A, [[0.5, 110, 0.016], [0.6, 140, 0.014], [0.8, 150, 0.01], [0.99, 150, 0.006]]), 0.0025, side);
    VEN('cephalic_vein', [mx(s, [0.14, 1.41, 0.05]), ...along(A, [[0.05, 80, 0.005], [0.3, 40, 0.0045], [0.6, 35, 0.0045], [0.98, 40, 0.0045]])], 0.0022, side);
    ART('renal_artery', [mx(s, [0.008, 1.075, -0.026]), mx(s, [0.03, 1.077, -0.035]), mx(s, [0.048, s > 0 ? 1.083 : 1.063, -0.045])], 0.003, side);
    ART('common_iliac_artery', [[0.002, 1.0, -0.016], mx(s, [0.025, 0.98, -0.01]), mx(s, [0.045, 0.955, 0.0])], 0.0055, side);
    ART('femoral_artery', [mx(s, [0.045, 0.955, 0.0]), mx(s, [0.07, 0.93, 0.03]), ...along(Lg, [[0.02, 110, 0.018], [0.15, 125, 0.024], [0.3, 160, 0.028]])], 0.0048, side);
    ART('popliteal_artery', along(Lg, [[0.3, 160, 0.028], [0.4, 225, 0.028], [0.5, 268, 0.026], [0.6, 270, 0.024]]), 0.0042, side);
    ART('tibial_arteries', along(Lg, [[0.6, 270, 0.024], [0.64, 200, 0.02], [0.8, 205, 0.016], [0.98, 195, 0.012]]), 0.0028, side, 'Posterior tibial artery');
    ART('tibial_arteries', [...along(Lg, [[0.6, 270, 0.024], [0.63, 30, 0.02], [0.8, 80, 0.014], [0.99, 88, 0.01]]), mx(s, [0.082, 0.06, 0.05]), mx(s, [0.073, 0.045, 0.11])], 0.0026, side, 'Anterior tibial / dorsalis pedis artery');
    VEN('internal_jugular', s > 0
      ? [[0.045, 1.6, -0.01], [0.044, 1.52, 0.006], [0.042, 1.45, 0.016], [0.03, 1.405, 0.03], [-0.01, 1.39, 0.034], [-0.022, 1.38, 0.032]]
      : [[-0.045, 1.6, -0.01], [-0.044, 1.52, 0.006], [-0.042, 1.45, 0.016], [-0.032, 1.405, 0.03], [-0.022, 1.38, 0.032]], 0.0055, side);
    VEN('femoral_vein', [mx(s, [0.035, 0.97, -0.012]), mx(s, [0.06, 0.935, 0.03]), ...along(Lg, [[0.02, 135, 0.02], [0.15, 140, 0.026], [0.3, 175, 0.028], [0.45, 250, 0.027]])], 0.0055, side);
    VEN('great_saphenous_vein', [...along(Lg, [[1.0, 120, 0.005], [0.8, 165, 0.0045], [0.55, 195, 0.0045], [0.35, 170, 0.0045], [0.12, 135, 0.005]]), ...along(Lg, [[0.02, 135, 0.018]])], 0.0024, side);
    VEN('renal_vein', [mx(s, [0.048, s > 0 ? 1.08 : 1.06, -0.04]), mx(s, [0.025, 1.075, -0.026]), [-0.02, 1.075, -0.022]], 0.0035, side);
  }
  VEN('inferior_vena_cava', [[-0.02, 1.0, -0.016], [-0.022, 1.08, -0.022], [-0.025, 1.15, -0.012], [-0.02, 1.2, 0.012], [-0.012, 1.226, 0.03]], 0.011);
  VEN('superior_vena_cava', [[-0.022, 1.38, 0.032], [-0.022, 1.33, 0.04], [-0.016, 1.275, 0.042]], 0.009);
  VEN('hepatic_portal_vein', [[0.01, 1.07, 0.0], [-0.012, 1.09, 0.008], [-0.03, 1.115, 0.02]], 0.0055);

  /* ================================================================ */
  /*  RESPIRATORY                                                      */
  /* ================================================================ */
  const R = (id, geo, preset, o = {}) => add(id, 'respiratory', geo, preset, { explode: true, ...o });
  R('pharynx', sweep([[0, 1.615, -0.006], [0, 1.57, -0.008], [0, 1.53, -0.004], [0, 1.505, 0.004]], [0.012, 0.013, 0.012, 0.011]), 'organ', { color: '#d9868c' });
  R('larynx', blob([0, 1.497, 0.03], [0.017, 0.022, 0.015], { deform: (v) => { if (v.z > 0.2 && Math.abs(v.x) < 0.5) v.z *= 1 + 0.35 * (1 - Math.abs(v.x) * 2) * (1 - Math.abs(v.y)); } }), 'cartilage', { color: '#d9e6e3' });
  const trach = [[0, 1.478, 0.026], [0, 1.43, 0.022], [0, 1.38, 0.016], [0, 1.332, 0.006]];
  const rings = [];
  const tc = new THREE.CatmullRomCurve3(trach.map((p) => V(...p)));
  for (let i = 1; i < 17; i++) { const p = tc.getPointAt(i / 17); rings.push(new THREE.TorusGeometry(0.0089, 0.0013, 6, 20).rotateX(Math.PI / 2).translate(p.x, p.y, p.z)); }
  R('trachea', merge([sweep(trach, 0.0084), ...rings]), 'cartilage', { color: '#e8d6d0' });
  // bronchial tree
  const br = [];
  const lungBox = { R: { c: [-0.072, 1.29, -0.005], r: [0.062, 0.125, 0.085] }, L: { c: [0.074, 1.285, -0.01], r: [0.058, 0.12, 0.082] } };
  const inside = (p, b) => ((p[0] - b.c[0]) / b.r[0]) ** 2 + ((p[1] - b.c[1]) / b.r[1]) ** 2 + ((p[2] - b.c[2]) / b.r[2]) ** 2 < 0.78;
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const grow = (p, dir, len, r, depth, box) => {
    const end = [p[0] + dir.x * len, p[1] + dir.y * len, p[2] + dir.z * len];
    if (!inside(end, box) && depth > 0) return;
    br.push(rod(p, end, r, r * 0.82, 6));
    if (depth >= 5) return;
    for (const sgn of [1, -1]) {
      const axis = V(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).cross(dir).normalize();
      const nd = dir.clone().applyAxisAngle(axis, sgn * (0.45 + rnd() * 0.3)).normalize();
      grow(end, nd, len * 0.78, r * 0.75, depth + 1, box);
    }
  };
  br.push(sweep([[0, 1.332, 0.006], [-0.022, 1.318, 0.0], [-0.042, 1.302, -0.004]], 0.0065));
  br.push(sweep([[0, 1.332, 0.006], [0.025, 1.315, 0.0], [0.048, 1.296, -0.006]], 0.006));
  for (const [p, d, box] of [
    [[-0.042, 1.302, -0.004], V(-0.4, 0.8, -0.1), lungBox.R], [[-0.042, 1.302, -0.004], V(-0.3, -0.3, 0.8), lungBox.R], [[-0.042, 1.302, -0.004], V(-0.35, -0.85, -0.3), lungBox.R],
    [[0.048, 1.296, -0.006], V(0.4, 0.8, 0.1), lungBox.L], [[0.048, 1.296, -0.006], V(0.35, -0.85, -0.25), lungBox.L]]) grow(p, d.normalize(), 0.026, 0.004, 0, box);
  R('bronchi', merge(br), 'cartilage', { color: '#e6c9c4' });
  const lungLobes = (side, c, r) => (pt) => {
    const n = V((pt.x - c[0]) / r[0], (pt.y - c[1]) / r[1], (pt.z - c[2]) / r[2]);
    const fis = -0.15 - 0.55 * n.z;
    if (n.y < fis) return side === 'R' ? 'right_lower_lobe' : 'left_lower_lobe';
    if (side === 'R') return n.y > 0.05 ? 'right_upper_lobe' : 'right_middle_lobe';
    return 'left_upper_lobe';
  };
  for (const [s, side] of SIDES) {
    const { c, r } = lungBox[side];
    R(side === 'R' ? 'right_lung' : 'left_lung', blob(c, r, {
      w: 64, h: 48,
      deform: (v) => {
        if (v.x * s < -0.35) v.x = s * (-0.35 + (v.x * s + 0.35) * 0.35);
        if (v.y < -0.5) v.y = -0.5 + (v.y + 0.5) * 0.35;
        const k = 1 - 0.35 * Math.max(0, v.y) ** 2; v.x *= k; v.z *= k;
        if (s > 0 && v.x < 0 && v.y < 0.25 && v.z > 0) v.x *= 0.45; // cardiac notch
        v.multiplyScalar(1 + 0.012 * noise3(v.x * 4, v.y * 4, v.z * 4));
      },
    }), 'organ', { color: '#e99aa0', side, region: lungLobes(side, c, r) });
  }
  R('diaphragm', patch(new EllSurf([0, 1.11, -0.005], [0.138, 0.1, 0.098]), (u, v) => [deg(u * 360), lerp(0.5, 1, v)], 0.0, 0.004, { nu: 48, nv: 16, edge: 0.05 }), 'muscle', { explode: false });

  /* ================================================================ */
  /*  DIGESTIVE                                                        */
  /* ================================================================ */
  const D = (id, geo, preset, o = {}) => add(id, 'digestive', geo, preset, { explode: true, ...o });
  D('tongue', blob([0, 1.571, 0.048], [0.021, 0.01, 0.035], { deform: (v) => { if (v.z > 0) { v.x *= 1 - 0.4 * v.z; } } }), 'organ', { color: '#d46a6e' });
  for (const [s, side] of SIDES) D('salivary_glands', blob(mx(s, [0.06, 1.597, -0.004]), [0.011, 0.022, 0.015]), 'gland', { color: '#e0b48a', side, label: 'Parotid gland' });
  for (const [s, side] of SIDES) D('salivary_glands', blob(mx(s, [0.036, 1.548, 0.03]), [0.008, 0.008, 0.012]), 'gland', { color: '#e0b48a', side, label: 'Submandibular gland' });
  D('esophagus', sweep([[0, 1.5, 0.012], [0.002, 1.42, 0.004], [0.006, 1.33, -0.02], [0.01, 1.24, -0.028], [0.018, 1.18, -0.01], [0.035, 1.145, 0.014]], 0.0068), 'organ', { color: '#cf7f73' });
  D('stomach', sweep([[0.035, 1.145, 0.014], [0.062, 1.165, 0.0], [0.084, 1.128, 0.025], [0.07, 1.068, 0.05], [0.032, 1.056, 0.062], [0.0, 1.075, 0.052]], [0.018, 0.033, 0.038, 0.034, 0.022, 0.012], { radial: 28, wobble: (t, a) => 1 + 0.025 * Math.sin(a * 9 + t * 30) }), 'organ', { color: '#d98575' });
  D('duodenum', sweep([[0.0, 1.075, 0.052], [-0.026, 1.078, 0.03], [-0.036, 1.05, 0.004], [-0.024, 1.024, -0.002], [0.012, 1.028, -0.002], [0.03, 1.048, 0.004]], 0.0095), 'organ', { color: '#df9a7c' });
  D('pancreas', sweep([[-0.018, 1.05, 0.008], [0.005, 1.062, -0.004], [0.04, 1.072, -0.014], [0.082, 1.092, -0.034]], [0.014, 0.011, 0.009, 0.0065], { wobble: (t, a) => 1 + 0.08 * Math.sin(a * 5) * Math.sin(t * 40) }), 'gland', { color: '#e8c08a' });
  const liverC = [-0.036, 1.157, 0.024], liverR = [0.098, 0.058, 0.072];
  D('liver', blob(liverC, liverR, {
    w: 64, h: 48,
    deform: (v) => { v.y *= 1 - 0.5 * Math.min(1, Math.max(0, (v.x + 0.2) / 1.2)); if (v.y < 0) v.y *= 0.7; v.multiplyScalar(1 + 0.01 * noise3(v.x * 3, v.y * 3, v.z * 3)); },
  }), 'organ', { color: '#7e2f25', region: (pt) => (pt.x < -0.003 ? 'liver_right_lobe' : 'liver_left_lobe') });
  D('gallbladder', blob([-0.056, 1.1, 0.074], [0.011, 0.024, 0.011], { rot: [0.3, 0, 0.4] }), 'organ', { color: '#4f8a3c' });
  // small intestine (jejunum + ileum) – serpentine coils
  const si = [[0.03, 1.048, 0.004], [0.05, 1.04, 0.03]];
  for (let r = 0; r < 5; r++) {
    const y = 1.032 - r * 0.022, dir = r % 2 ? -1 : 1;
    for (let k = 0; k <= 8; k++) {
      const u = k / 8, x = dir > 0 ? lerp(-0.065, 0.068, u) : lerp(0.068, -0.065, u);
      si.push([x, y + 0.006 * Math.sin(u * Math.PI * 4), 0.045 + 0.022 * Math.sin(u * Math.PI * 3 + r)]);
    }
  }
  si.push([-0.07, 0.948, 0.045], [-0.08, 0.955, 0.042]);
  D('small_intestine', sweep(si, 0.0092, { radial: 12, segments: 900 }), 'organ', { color: '#e3a690' });
  const haustra = (t, a) => 1 + 0.12 * Math.max(0, Math.sin(t * 60));
  D('cecum', blob([-0.086, 0.955, 0.04], [0.021, 0.024, 0.021]), 'organ', { color: '#c98a6e' });
  D('appendix', sweep([[-0.086, 0.935, 0.034], [-0.078, 0.915, 0.03], [-0.07, 0.902, 0.04]], [0.0038, 0.0035, 0.003]), 'organ', { color: '#c98a6e' });
  D('ascending_colon', sweep([[-0.088, 0.965, 0.04], [-0.092, 1.03, 0.035], [-0.085, 1.085, 0.04]], 0.018, { wobble: haustra }), 'organ', { color: '#c98a6e' });
  D('transverse_colon', sweep([[-0.085, 1.085, 0.04], [-0.04, 1.055, 0.073], [0.02, 1.05, 0.078], [0.07, 1.075, 0.058], [0.095, 1.105, 0.02]], 0.017, { wobble: haustra }), 'organ', { color: '#c98a6e' });
  D('descending_colon', sweep([[0.095, 1.105, 0.02], [0.1, 1.04, 0.015], [0.095, 0.97, 0.02]], 0.015, { wobble: haustra }), 'organ', { color: '#c98a6e' });
  D('sigmoid_colon', sweep([[0.095, 0.97, 0.02], [0.07, 0.935, 0.04], [0.03, 0.95, 0.03], [0.01, 0.93, -0.01], [0.0, 0.925, -0.04]], 0.013, { wobble: haustra }), 'organ', { color: '#c98a6e' });
  D('rectum', sweep([[0.0, 0.925, -0.04], [0.0, 0.892, -0.056], [0.0, 0.862, -0.042], [0.0, 0.842, -0.03]], [0.013, 0.016, 0.013, 0.008]), 'organ', { color: '#b97a62' });

  /* ================================================================ */
  /*  URINARY + ENDOCRINE + LYMPHATIC                                  */
  /* ================================================================ */
  const U = (id, geo, o = {}) => add(id, 'urinary', geo, 'organ', { explode: true, ...o });
  const E = (id, geo, o = {}) => add(id, 'endocrine', geo, 'gland', { explode: true, color: '#a37ad9', ...o });
  const Ly = (id, geo, o = {}) => add(id, 'lymphatic', geo, 'gland', { explode: true, color: '#6cc488', ...o });
  for (const [s, side] of SIDES) {
    const ky = s > 0 ? 1.085 : 1.065;
    U('kidney', blob(mx(s, [0.066, ky, -0.052]), [0.021, 0.034, 0.015], {
      rot: [0, s * 0.35, -s * 0.18],
      deform: (v) => { const m = -v.x * s; if (m > 0.4 && Math.abs(v.y) < 0.45) v.x += s * (m - 0.4) * 0.9 * (1 - Math.abs(v.y) / 0.45); },
    }), { color: '#8e3b2e', side });
    U('ureter', sweep(mxs(s, [[0.048, ky - 0.008, -0.045], [0.044, 1.0, -0.04], [0.045, 0.94, -0.022], [0.022, 0.9, 0.028]]), 0.0024), { color: '#d6b25c', side });
    E('adrenal_gland', blob(mx(s, [0.06, ky + 0.038, -0.048]), [0.012, 0.011, 0.005], { deform: (v) => { if (v.y > 0) { v.x *= 1 - v.y * 0.6; } } }), { side, color: '#d9a640' });
    E('thyroid', blob(mx(s, [0.016, 1.47, 0.032]), [0.008, 0.018, 0.008]), { side, label: `Thyroid (${side === 'L' ? 'left' : 'right'} lobe)` });
    for (const yy of [1.478, 1.461]) E('parathyroid', blob(mx(s, [0.017, yy, 0.022]), [0.0026, 0.0026, 0.002], { w: 10, h: 8 }), { side, color: '#c48fe0' });
    Ly('tonsils', blob(mx(s, [0.015, 1.575, 0.012]), [0.004, 0.007, 0.004]), { side });
    const nodes = [];
    for (let k = 0; k < 6; k++) nodes.push(blob(mx(s, [0.048 - k * 0.001, 1.56 - k * 0.022, 0.0 + k * 0.004]), [0.0042, 0.0042, 0.0042], { w: 10, h: 8 }));
    Ly('lymph_nodes', merge(nodes), { side, label: 'Cervical lymph nodes' });
    const ax = [];
    for (let k = 0; k < 7; k++) ax.push(blob(mx(s, [0.14 + (k % 3) * 0.01, 1.35 + Math.floor(k / 3) * 0.012, -0.015 + (k % 2) * 0.012]), [0.005, 0.005, 0.005], { w: 10, h: 8 }));
    Ly('lymph_nodes', merge(ax), { side, label: 'Axillary lymph nodes' });
    const ing = [];
    for (let k = 0; k < 6; k++) ing.push(blob(mx(s, [0.055 + k * 0.009, 0.915 - k * 0.006, 0.065 - k * 0.002]), [0.0048, 0.0042, 0.0042], { w: 10, h: 8 }));
    Ly('lymph_nodes', merge(ing), { side, label: 'Inguinal lymph nodes' });
  }
  U('bladder', blob([0, 0.897, 0.045], [0.032, 0.026, 0.028], { deform: (v) => { if (v.y > 0) v.multiplyScalar(1 - 0.15 * v.y); } }), { color: '#d9b24f' });
  U('urethra', sweep([[0, 0.872, 0.05], [0, 0.85, 0.056], [0, 0.835, 0.06]], 0.0028), { color: '#d9b24f' });
  E('thyroid', rod([-0.012, 1.462, 0.038], [0.012, 1.462, 0.038], 0.004, 0.004, 10).rotateZ(0), { label: 'Thyroid isthmus' });
  E('pituitary', blob([0, 1.624, 0.012], [0.005, 0.004, 0.005]), { explode: false });
  E('hypothalamus', blob([0, 1.634, 0.006], [0.006, 0.005, 0.007]), { explode: false, color: '#b98be8' });
  E('pineal', blob([0, 1.648, -0.024], [0.003, 0.003, 0.004]), { explode: false });
  Ly('spleen', blob([0.104, 1.13, -0.045], [0.018, 0.036, 0.025], { rot: [0, 0.6, -0.4], deform: (v) => { if (v.x < 0) v.x *= 0.5; } }), { color: '#6b2a4a' });
  Ly('thymus', merge([blob([0.007, 1.372, 0.074], [0.011, 0.026, 0.008]), blob([-0.008, 1.368, 0.075], [0.011, 0.024, 0.008])]), { color: '#8fd09a' });
  const pa = [];
  for (let k = 0; k < 6; k++) pa.push(blob([(k % 2 ? 0.022 : -0.012), 1.01 + k * 0.016, -0.02], [0.004, 0.004, 0.004], { w: 10, h: 8 }));
  Ly('lymph_nodes', merge(pa), { label: 'Para-aortic lymph nodes' });
  Ly('thoracic_duct', merge([
    blob([0.002, 1.06, -0.036], [0.005, 0.012, 0.004]),
    sweep([[0.002, 1.07, -0.036], [0.006, 1.2, -0.055], [0.01, 1.35, -0.042], [0.02, 1.42, -0.01], [0.032, 1.428, 0.012]], 0.0018),
  ]), { label: 'Thoracic duct & cisterna chyli' });

  // remember base positions & explode directions
  for (const m of parts) {
    m.geometry.computeBoundingSphere();
    m.userData.center = m.geometry.boundingSphere.center.clone();
    if (m.userData.explode) {
      const c = m.userData.center;
      const origin = c.y > 1.45 ? V(0, 1.6, 0) : c.y > 1.18 ? V(0, 1.27, -0.02) : V(0, 1.05, -0.03);
      m.userData.explodeDir = c.clone().sub(origin).setY((c.y - origin.y) * 0.6).normalize();
    }
  }
  return { root, parts, skin, surfaces: { torso, arms, legs, headSurf } };
}

/** Finger bone chains (metacarpal base → fingertip) for one hand. */
function fingerChains(s) {
  const WR = [0.252, 0.875, 0.005];
  const out = [];
  const bases = [0.015, 0.005, -0.006, -0.016];
  const mcl = [0.064, 0.062, 0.057, 0.052], pl = [0.04, 0.044, 0.041, 0.032], ml = [0.024, 0.028, 0.026, 0.019], dl = [0.017, 0.019, 0.018, 0.016];
  for (let k = 0; k < 4; k++) {
    const x0 = WR[0] + bases[k], y0 = WR[1] - 0.038;
    const dir = V(bases[k] * 3, -1, 0.02).normalize();
    const pts = [[x0, y0, WR[2]]];
    let p = V(x0, y0, WR[2]);
    for (const L of [mcl[k], pl[k], ml[k], dl[k]]) { p = p.clone().addScaledVector(dir, L); pts.push([p.x, p.y, p.z]); }
    out.push({ pts: pts.map((q) => [s * q[0], q[1], q[2]]), r: k === 3 ? 0.0036 : 0.0042 });
  }
  const t0 = V(WR[0] + 0.02, WR[1] - 0.026, WR[2] + 0.008);
  const td = V(0.45, -0.8, 0.38).normalize();
  const tp = [[t0.x, t0.y, t0.z]];
  let p = t0;
  for (const L of [0.042, 0.032, 0.025]) { p = p.clone().addScaledVector(td, L); tp.push([p.x, p.y, p.z]); }
  out.push({ pts: tp.map((q) => [s * q[0], q[1], q[2]]), r: 0.0048 });
  return out;
}
