// Low-level procedural geometry helpers used to sculpt the anatomy.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
const toV = (p) => (p.isVector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2]));

/** Interpolate a value list (numbers or [a,b] pairs) at t ∈ [0,1]. */
function sampleList(list, t) {
  if (typeof list === 'function') return list(t);
  if (!Array.isArray(list)) return list;
  if (list.length === 1) return list[0];
  const f = t * (list.length - 1);
  const i = Math.min(Math.floor(f), list.length - 2);
  const k = f - i;
  const s = k * k * (3 - 2 * k); // smoothstep between control values
  const a = list[i], b = list[i + 1];
  if (Array.isArray(a)) return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
  return a + (b - a) * s;
}

/**
 * Sweep an (elliptical) cross-section along a Catmull-Rom curve.
 * points: control points; radius: number | number[] | [rx,ry][] | fn(t)
 * opts.ref: reference axis that orients the ellipse (rx lies along cross(tangent, ref))
 * opts.caps: close both ends; opts.twist: radians along length
 * opts.wobble: fn(t, angle) → radius multiplier (for haustra, rings, etc.)
 */
export function sweep(points, radius, opts = {}) {
  const pts = points.map(toV);
  const curve = new THREE.CatmullRomCurve3(pts, !!opts.closed, 'centripetal', opts.tension ?? 0.5);
  const seg = opts.segments ?? Math.max(24, Math.round(curve.getLength() * 500));
  const rad = opts.radial ?? 18;
  const ref = toV(opts.ref ?? [0, 0, 1]).normalize();
  const positions = [], uvs = [], indices = [];
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), P = new THREE.Vector3();
  let prevN = null;

  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    curve.getPoint(t, P);
    curve.getTangent(t, T).normalize();
    N.crossVectors(T, ref);
    if (N.lengthSq() < 1e-6) N.crossVectors(T, new THREE.Vector3(1, 0, 0));
    N.normalize();
    if (prevN && N.dot(prevN) < 0) N.negate();
    prevN = N.clone();
    B.crossVectors(N, T).normalize();
    let r = sampleList(radius, t);
    let rx, ry;
    if (Array.isArray(r)) [rx, ry] = r; else { rx = r; ry = r * (opts.flat ?? 1); }
    const tw = (opts.twist ?? 0) * t;
    for (let j = 0; j <= rad; j++) {
      const a = (j / rad) * Math.PI * 2 + tw;
      const w = opts.wobble ? opts.wobble(t, a) : 1;
      const cx = Math.cos(a) * rx * w, cy = Math.sin(a) * ry * w;
      positions.push(P.x + N.x * cx + B.x * cy, P.y + N.y * cx + B.y * cy, P.z + N.z * cx + B.z * cy);
      uvs.push(j / rad, t);
    }
  }
  for (let i = 0; i < seg; i++) {
    for (let j = 0; j < rad; j++) {
      const a = i * (rad + 1) + j, b = a + rad + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  if (opts.caps !== false && !opts.closed) {
    for (const end of [0, 1]) {
      const p = curve.getPoint(end);
      const ci = positions.length / 3;
      positions.push(p.x, p.y, p.z); uvs.push(0.5, end);
      const base = end === 0 ? 0 : seg * (rad + 1);
      for (let j = 0; j < rad; j++) {
        if (end === 0) indices.push(ci, base + j + 1, base + j);
        else indices.push(ci, base + j, base + j + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Radius profile for a long bone: thick epiphyses, slender diaphysis. */
export function boneProfile(shaft, end1, end2, endLen = 0.14) {
  return (t) => {
    const s = (x) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
    let r = shaft;
    r += (end1 - shaft) * s(1 - t / endLen);
    r += (end2 - shaft) * s((t - (1 - endLen)) / endLen);
    // rounded tips
    const tip = Math.min(t, 1 - t);
    if (tip < 0.03) r *= Math.sqrt(Math.max(0.05, tip / 0.03));
    return r;
  };
}

/** Spindle (fusiform) profile used for muscle bellies. */
export function bellyProfile(max, min = 0.15, bias = 0.5) {
  return (t) => {
    const k = t < bias ? t / bias : (1 - t) / (1 - bias);
    return min * max + (1 - min) * max * Math.sin(Math.min(1, k) * Math.PI / 2) ** 0.8;
  };
}

/**
 * Deformable ellipsoid. deform(unit) may mutate the unit-sphere vertex (Vector3)
 * before scaling; return value ignored.
 */
export function blob(center, radii, opts = {}) {
  const g = new THREE.SphereGeometry(1, opts.w ?? 48, opts.h ?? 32);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (opts.deform) opts.deform(v);
    pos.setXYZ(i, v.x * radii[0], v.y * radii[1], v.z * radii[2]);
  }
  if (opts.rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...opts.rot)));
  const c = toV(center);
  g.translate(c.x, c.y, c.z);
  g.computeVertexNormals();
  return g;
}

/** Cylinder oriented between two points. */
export function rod(a, b, r1, r2 = r1, radial = 12) {
  const A = toV(a), Bv = toV(b);
  const len = A.distanceTo(Bv);
  const g = new THREE.CylinderGeometry(r2, r1, len, radial, 1);
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), Bv.clone().sub(A).normalize());
  g.applyQuaternion(q);
  const m = A.clone().add(Bv).multiplyScalar(0.5);
  g.translate(m.x, m.y, m.z);
  return g;
}

export function merge(list) {
  const clean = list.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k);
    if (!n.attributes.uv) n.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
    if (!n.attributes.normal) n.computeVertexNormals();
    return n;
  });
  return mergeGeometries(clean, false);
}

/** Apply a transform (position + quaternion) to a geometry. */
export function place(g, pos, quat) {
  const m = new THREE.Matrix4().compose(toV(pos), quat ?? new THREE.Quaternion(), V(1, 1, 1));
  g.applyMatrix4(m);
  return g;
}

/** Cheap 3D value noise for organic surface detail. */
export function noise3(x, y, z) {
  return (
    Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 0.5 +
    Math.sin(x * 4.1 + Math.sin(y * 3.7) * 2 + z * 5.3) * 0.3 +
    Math.sin(y * 9.7 + Math.cos(z * 6.1) + x * 2.3) * 0.2
  );
}

/* ------------------------------------------------------------------ */
/* Parametric surfaces: muscles and vessels are laid onto these so they */
/* conform to the body outline instead of floating or poking through.  */
/* ------------------------------------------------------------------ */

/** Tube surface sharing the exact parameterisation used by sweep(). */
export class TubeSurf {
  constructor(points, radius, ref = [0, 0, 1]) {
    this.curve = new THREE.CatmullRomCurve3(points.map(toV), false, 'centripetal', 0.5);
    this.radius = radius;
    this.ref = toV(ref).normalize();
  }
  frame(t) {
    const P = this.curve.getPoint(t);
    const T = this.curve.getTangent(t).normalize();
    const N = new THREE.Vector3().crossVectors(T, this.ref).normalize();
    const B = new THREE.Vector3().crossVectors(N, T).normalize();
    return { P, T, N, B };
  }
  /** a = angle around the tube (radians), inset = distance below the surface */
  at(t, a, inset = 0) {
    const { P, N, B } = this.frame(t);
    let r = sampleList(this.radius, t);
    let rx, ry;
    if (Array.isArray(r)) [rx, ry] = r; else rx = ry = r;
    return P.addScaledVector(N, Math.cos(a) * Math.max(0.001, rx - inset))
            .addScaledVector(B, Math.sin(a) * Math.max(0.001, ry - inset));
  }
  geometry(opts = {}) { return sweep(this.curve.points, this.radius, { ref: this.ref, radial: opts.radial ?? 32, segments: opts.segments, caps: opts.caps }); }
}

/** Ellipsoid surface: t ∈ [0,1] → latitude −90°..90°, a = longitude (0 = +x, 90° = +z). */
export class EllSurf {
  constructor(center, radii) { this.c = toV(center); this.r = radii; }
  at(t, a, inset = 0) {
    const lat = (t - 0.5) * Math.PI;
    const [rx, ry, rz] = this.r;
    return new THREE.Vector3(
      this.c.x + Math.cos(lat) * Math.cos(a) * (rx - inset),
      this.c.y + Math.sin(lat) * (ry - inset),
      this.c.z + Math.cos(lat) * Math.sin(a) * (rz - inset));
  }
}

/**
 * Lens-shaped sheet laid onto a surface — used for flat/fan muscles.
 * map(u,v) → [angleRad, t]; thickness tapers to 0 at the edges so the
 * outer and inner skins meet and the sheet reads as a closed volume.
 */
export function patch(surf, map, inset, thick, opts = {}) {
  const nu = opts.nu ?? 28, nv = opts.nv ?? 28;
  const pos = [], uv = [], idx = [];
  const mod = opts.thickMod ?? (() => 1);
  const pw = opts.edge ?? 0.45;
  for (const layer of [0, 1]) {
    for (let j = 0; j <= nv; j++) {
      for (let i = 0; i <= nu; i++) {
        const u = i / nu, v = j / nv;
        const [a, t] = map(u, v);
        const w = Math.pow(Math.sin(Math.PI * u) * Math.sin(Math.PI * v), pw) * mod(u, v);
        const p = opts.outward
          ? surf.at(t, a, inset - (layer ? 0 : thick * w)) // inner face hugs the surface, belly bulges outward
          : surf.at(t, a, inset + (layer ? thick * w : 0));
        pos.push(p.x, p.y, p.z);
        uv.push(u * (opts.uScale ?? 1), v);
      }
    }
  }
  const off = (nu + 1) * (nv + 1);
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + nu + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
      idx.push(off + a, off + b, off + a + 1, off + b, off + b + 1, off + a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export const rect = (a0, a1, t0, t1) => (u, v) => [a0 + (a1 - a0) * u, t0 + (t1 - t0) * v];
export const deg = (d) => (d * Math.PI) / 180;
