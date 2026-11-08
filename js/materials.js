// Materials and small procedural textures that give tissues a more organic look.
import * as THREE from 'three';

function canvasTex(size, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  draw(ctx, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Parallel fibre striations (fibres run along v = along the muscle).
const fiberMap = canvasTex(256, (ctx, s) => {
  ctx.fillStyle = '#c9c9c9'; ctx.fillRect(0, 0, s, s);
  for (let x = 0; x < s; x += 2) {
    const l = 150 + Math.random() * 105;
    ctx.fillStyle = `rgb(${l},${l},${l})`;
    ctx.fillRect(x, 0, 1 + Math.random() * 1.5, s);
  }
  for (let i = 0; i < 40; i++) { // perimysium bundles
    ctx.fillStyle = 'rgba(90,90,90,.35)';
    ctx.fillRect(Math.random() * s, 0, 1, s);
  }
}, [6, 1]);

const speckleMap = canvasTex(256, (ctx, s) => {
  ctx.fillStyle = '#d8d8d8'; ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 5000; i++) {
    const l = 170 + Math.random() * 85;
    ctx.fillStyle = `rgba(${l},${l},${l},.6)`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}, [3, 3]);

const mottleMap = canvasTex(256, (ctx, s) => {
  ctx.fillStyle = '#dcdcdc'; ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 260; i++) {
    const r = 4 + Math.random() * 18, l = 185 + Math.random() * 70;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, `rgba(${l},${l},${l},.55)`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.translate(Math.random() * s, Math.random() * s); ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.restore();
  }
}, [2, 2]);

const PRESETS = {
  bone:      { color: '#ece2cc', roughness: 0.78, metalness: 0, map: speckleMap, bumpMap: speckleMap, bumpScale: 0.6 },
  boneDark:  { color: '#2a1d16', roughness: 0.9 },
  cartilage: { color: '#cfe3e8', roughness: 0.35, clearcoat: 0.6, transmission: 0 },
  muscle:    { color: '#b13b34', roughness: 0.5, map: fiberMap, bumpMap: fiberMap, bumpScale: 1.2, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.4, sheenColor: '#ff9a8a' },
  tendon:    { color: '#ebe4d2', roughness: 0.3, map: fiberMap, clearcoat: 0.8 },
  organ:     { roughness: 0.42, map: mottleMap, bumpMap: mottleMap, bumpScale: 0.5, clearcoat: 0.55, clearcoatRoughness: 0.25 },
  artery:    { color: '#cf2a2a', roughness: 0.35, clearcoat: 0.7 },
  vein:      { color: '#3355c4', roughness: 0.35, clearcoat: 0.7 },
  nerve:     { color: '#f2cf5b', roughness: 0.45, map: fiberMap, clearcoat: 0.3 },
  brain:     { color: '#efc3bb', roughness: 0.55, vertexColors: true, clearcoat: 0.4, clearcoatRoughness: 0.35 },
  gland:     { roughness: 0.5, map: mottleMap, clearcoat: 0.4 },
  eyeWhite:  { color: '#f5f2ec', roughness: 0.15, clearcoat: 1 },
  iris:      { color: '#5b3a22', roughness: 0.3, clearcoat: 1 },
  skinSolid: { color: '#e2b394', roughness: 0.62, sheen: 0.6, sheenColor: '#ffd9c9', map: mottleMap },
};

export function makeMaterial(preset, color) {
  const p = { ...PRESETS[preset] };
  if (color) p.color = color;
  return new THREE.MeshPhysicalMaterial({ side: THREE.DoubleSide, ...p });
}

/** Fresnel "glass body" shader for the X-ray skin mode. */
export function xraySkinMaterial(color = '#7cc4ff') {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uPower: { value: 2.2 }, uAlpha: { value: 0.55 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uPower; uniform float uAlpha;
      varying vec3 vN; varying vec3 vV;
      void main(){
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPower);
        gl_FragColor = vec4(uColor * (0.35 + f), f * uAlpha + 0.015);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
}
