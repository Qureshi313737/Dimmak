// Anatomy Explorer 3D — application entry point.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildModel } from './model.js';
import { makeMaterial, xraySkinMaterial } from './materials.js';
import { SYSTEMS, SYSTEM_BY_ID } from './data/systems.js';
import { STRUCTURES, info } from './data/structures.js';
import { VITAL_POINTS, REGIONS, DIM_MAK_INTRO } from './data/vitalpoints.js';
import { DIAGRAMS, diagramFor } from './cells.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ------------------------------------------------------------------ */
/* Theme                                                                */
/* ------------------------------------------------------------------ */
try { const t = localStorage.getItem('anatomy-theme'); if (t) document.documentElement.dataset.theme = t; } catch { /* storage unavailable */ }
$('#themeBtn').onclick = () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('anatomy-theme', root.dataset.theme); } catch { /* ignore */ }
};

/* ------------------------------------------------------------------ */
/* Renderer / scene                                                     */
/* ------------------------------------------------------------------ */
const canvas = $('#viewer');
const stage = $('#stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(35, 1, 0.02, 30);
camera.position.set(0, 0.95, 3.6);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.88, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.1;
controls.maxDistance = 6;
controls.update();

scene.add(new THREE.HemisphereLight(0xffffff, 0x444a55, 0.7));
const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(1.5, 2.5, 2.5); scene.add(key);
const rim = new THREE.DirectionalLight(0x9fc7ff, 0.9); rim.position.set(-2, 1.5, -2.5); scene.add(rim);
const fill = new THREE.DirectionalLight(0xffe6d0, 0.5); fill.position.set(-2, 0.5, 2); scene.add(fill);

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();

/* ------------------------------------------------------------------ */
/* Model                                                                */
/* ------------------------------------------------------------------ */
let model;
const t0 = performance.now();
try {
  model = buildModel();
} catch (e) {
  $('#loading').textContent = 'Model failed to build: ' + e.message;
  throw e;
}
scene.add(model.root);
const parts = model.parts;
const skin = model.skin;
const skinMats = { xray: skin.material, solid: makeMaterial('skinSolid') };
skinMats.solid.side = THREE.FrontSide;
$('#loading').hidden = true;
console.info(`Anatomy built: ${parts.length} meshes in ${(performance.now() - t0).toFixed(0)} ms`);

for (const m of parts) {
  m.userData.baseEmissive = m.material.emissive ? m.material.emissive.clone() : null;
}

/* ------------------------------------------------------------------ */
/* Visibility state                                                     */
/* ------------------------------------------------------------------ */
const state = {
  tab: 'anatomy',
  systemOn: Object.fromEntries(SYSTEMS.map((s) => [s.id, true])),
  systemOpacity: Object.fromEntries(SYSTEMS.map((s) => [s.id, 1])),
  hidden: new Set(),
  isolate: null,
  selected: [],
  skinMode: 'xray',
  explode: 0,
};
// Sensible defaults: skin as glass, muscles semi-transparent so organs show through.
state.systemOpacity.muscular = 0.85;

function applyVisibility() {
  for (const m of parts) {
    const sys = m.userData.system;
    let vis = state.systemOn[sys] !== false && !state.hidden.has(m) && (!state.isolate || state.isolate.has(m));
    if (m === skin) vis = state.skinMode !== 'off' && state.systemOn.integumentary && (!state.isolate || state.isolate.has(m));
    m.visible = vis;
    if (m !== skin) {
      const op = state.systemOpacity[sys] ?? 1;
      m.material.transparent = op < 0.999;
      m.material.opacity = op;
      m.material.depthWrite = op > 0.5;
    }
  }
  if (state.skinMode === 'solid') {
    skin.material = skinMats.solid;
    skin.material.transparent = state.systemOpacity.integumentary < 0.999;
    skin.material.opacity = state.systemOpacity.integumentary;
    skin.userData.pickable = true;
  } else {
    skin.material = skinMats.xray;
    skin.material.uniforms.uAlpha.value = 0.55 * state.systemOpacity.integumentary;
    skin.userData.pickable = false;
  }
  for (const vm of vitalMarkers) vm.visible = state.tab === 'vital' && vm.userData.matches;
}

/* ------------------------------------------------------------------ */
/* Sidebar: systems                                                     */
/* ------------------------------------------------------------------ */
const sysList = $('#systemList');
for (const s of SYSTEMS) {
  const count = new Set(parts.filter((p) => p.userData.system === s.id).map((p) => p.userData.id)).size;
  const row = document.createElement('div');
  row.className = 'sys';
  row.innerHTML = `<input type="checkbox" id="sys-${s.id}" checked>
    <span class="dot" style="background:${s.color}"></span>
    <label for="sys-${s.id}" title="${esc(s.hi)}">${esc(s.name)} <span class="muted small">${count}</span></label>
    <input type="range" min="0.05" max="1" step="0.05" value="${state.systemOpacity[s.id]}" title="Opacity">`;
  row.querySelector('input[type=checkbox]').onchange = (e) => { state.systemOn[s.id] = e.target.checked; applyVisibility(); };
  row.querySelector('input[type=range]').oninput = (e) => { state.systemOpacity[s.id] = +e.target.value; applyVisibility(); };
  sysList.appendChild(row);
}

$('#skinMode').onchange = (e) => { state.skinMode = e.target.value; applyVisibility(); };
$('#explode').oninput = (e) => {
  state.explode = +e.target.value;
  for (const m of parts) if (m.userData.explode) m.position.copy(m.userData.explodeDir).multiplyScalar(state.explode * 0.11);
};
$('#autoRotate').onchange = (e) => { controls.autoRotate = e.target.checked; controls.autoRotateSpeed = 1.2; };

/* ------------------------------------------------------------------ */
/* Structure tree & search                                              */
/* ------------------------------------------------------------------ */
const ids = [...new Set(parts.filter((p) => p.userData.pickable || p === skin).map((p) => p.userData.id))];
const regionIds = Object.keys(STRUCTURES).filter((k) => !ids.includes(k));
$('#structCount').textContent = `(${ids.length} + ${regionIds.length} sub-regions)`;
const tree = $('#tree');
for (const s of SYSTEMS) {
  const list = ids.filter((id) => (STRUCTURES[id]?.system ?? parts.find((p) => p.userData.id === id).userData.system) === s.id)
    .sort((a, b) => info(a).name.localeCompare(info(b).name));
  if (!list.length) continue;
  const d = document.createElement('details');
  d.innerHTML = `<summary><span class="dot" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${s.color};margin-right:6px"></span>${esc(s.name)} <span class="muted small">${list.length}</span></summary><div class="group"></div>`;
  const g = d.querySelector('.group');
  for (const id of list) {
    const b = document.createElement('button');
    b.dataset.id = id;
    b.textContent = info(id).name;
    b.onclick = () => selectById(id, true);
    g.appendChild(b);
  }
  tree.appendChild(d);
}

const searchIndex = Object.entries(STRUCTURES).map(([id, s]) => ({ id, hay: `${s.name} ${s.latin ?? ''} ${s.hi ?? ''} ${id}`.toLowerCase() }));
$('#search').oninput = (e) => {
  const q = e.target.value.trim().toLowerCase();
  const box = $('#searchResults');
  box.innerHTML = '';
  if (q.length < 2) return;
  const hits = searchIndex.filter((x) => x.hay.includes(q)).slice(0, 12);
  if (!hits.length) { box.innerHTML = '<span class="muted small">No match</span>'; return; }
  for (const h of hits) {
    const b = document.createElement('button');
    const s = STRUCTURES[h.id];
    b.innerHTML = `${esc(s.name)} <span class="muted small">· ${esc(SYSTEM_BY_ID[s.system]?.name ?? '')}</span>`;
    b.onclick = () => selectById(h.id, true);
    box.appendChild(b);
  }
};

/* ------------------------------------------------------------------ */
/* Selection, highlight & camera                                        */
/* ------------------------------------------------------------------ */
const HILITE = new THREE.Color('#2f6bff');
function setHighlight(meshes) {
  for (const m of state.selected) if (m.material.emissive && m.userData.baseEmissive) m.material.emissive.copy(m.userData.baseEmissive);
  state.selected = meshes;
  for (const m of meshes) if (m.material.emissive) m.material.emissive.copy(HILITE).multiplyScalar(0.55);
  $('#isolateBtn').disabled = $('#hideBtn').disabled = !meshes.length;
  $$('.tree button').forEach((b) => b.classList.toggle('active', meshes.length && b.dataset.id === meshes[0].userData.id));
}

/** Id of the parent structure for a sub-region id (e.g. frontal_lobe → cerebrum). */
function parentFor(regionId) {
  const m = parts.find((p) => p.userData.region && ['cerebrum', 'heart', 'right_lung', 'left_lung', 'liver'].includes(p.userData.id) &&
    (STRUCTURES[p.userData.id].related ?? []).includes(regionId));
  return m?.userData.id;
}

function selectById(id, focus) {
  if (state.tab !== 'anatomy') switchTab('anatomy');
  let meshes = parts.filter((p) => p.userData.id === id);
  let shown = id;
  if (!meshes.length) { // sub-region: select the parent organ
    const pid = parentFor(id);
    if (pid) meshes = parts.filter((p) => p.userData.id === pid);
  }
  if (meshes.length) {
    const sys = meshes[0].userData.system;
    if (!state.systemOn[sys]) { state.systemOn[sys] = true; $(`#sys-${sys}`).checked = true; }
    if (state.isolate && !meshes.some((m) => state.isolate.has(m))) state.isolate = null;
    meshes.forEach((m) => state.hidden.delete(m));
    applyVisibility();
    setHighlight(meshes);
    if (focus) focusOn(meshes);
  }
  showStructure(shown, meshes[0]?.userData.label && meshes.length === 1 ? meshes[0].userData.label : null);
  openInfoOnMobile();
}

let tween = null;
function animateCamera(pos, target, ms = 650) {
  tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone(), start: performance.now(), ms };
}
function focusOn(meshes) {
  const box = new THREE.Box3();
  meshes.forEach((m) => box.expandByObject(m));
  const c = box.getCenter(new THREE.Vector3());
  const r = Math.max(0.035, box.getSize(new THREE.Vector3()).length() / 2);
  const dir = camera.position.clone().sub(controls.target).normalize();
  const dist = Math.min(4, Math.max(0.16, r / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.25));
  animateCamera(c.clone().addScaledVector(dir, dist), c);
}
const VIEWS = {
  front: [[0, 0.95, 3.6], [0, 0.88, 0]], back: [[0, 0.95, -3.6], [0, 0.88, 0]],
  left: [[3.6, 0.95, 0], [0, 0.88, 0]], right: [[-3.6, 0.95, 0], [0, 0.88, 0]],
  head: [[0.12, 1.66, 0.52], [0, 1.63, 0]], torso: [[0, 1.22, 1.15], [0, 1.18, 0]],
};
$$('[data-view]').forEach((b) => (b.onclick = () => { const [p, t] = VIEWS[b.dataset.view]; animateCamera(new THREE.Vector3(...p), new THREE.Vector3(...t)); }));

$('#isolateBtn').onclick = () => {
  if (state.isolate) { state.isolate = null; $('#isolateBtn').textContent = 'Isolate selected'; }
  else if (state.selected.length) { state.isolate = new Set(state.selected); $('#isolateBtn').textContent = 'Show all'; }
  applyVisibility();
};
$('#hideBtn').onclick = () => { state.selected.forEach((m) => state.hidden.add(m)); setHighlight([]); applyVisibility(); };
$('#resetBtn').onclick = () => {
  state.hidden.clear(); state.isolate = null; $('#isolateBtn').textContent = 'Isolate selected';
  setHighlight([]);
  $('#explode').value = 0; $('#explode').oninput({ target: { value: 0 } });
  const [p, t] = VIEWS.front; animateCamera(new THREE.Vector3(...p), new THREE.Vector3(...t));
  applyVisibility();
};

/* ------------------------------------------------------------------ */
/* Info panel                                                           */
/* ------------------------------------------------------------------ */
const infoBody = $('#infoBody');
const relButtons = (list) => (list ?? []).filter((r) => STRUCTURES[r]).map((r) => `<button data-goto="${r}">${esc(STRUCTURES[r].name)}</button>`).join('');

function showStructure(id, labelOverride, regionOf) {
  const s = info(id);
  const sys = SYSTEM_BY_ID[s.system] ?? { name: s.system, color: '#888' };
  const title = labelOverride || s.name;
  const sub = labelOverride && labelOverride !== s.name ? `<div class="muted small">${esc(s.name)}</div>` : '';
  const parent = regionOf ? `<p class="small">Part of: <button class="rel-inline" data-goto="${regionOf}">${esc(info(regionOf).name)}</button> — click other areas of the organ to explore its other parts.</p>` : '';
  const sections = {
    overview: `<h4>Overview</h4><p>${esc(s.overview)}</p>${s.location ? `<h4>Location (kahan hai)</h4><p>${esc(s.location)}</p>` : ''}
      ${s.facts?.length ? `<h4>Did you know?</h4><ul>${s.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}`,
    function: `<h4>Function (kya kaam karta hai)</h4><ul>${(s.function ?? []).map((f) => `<li>${esc(f)}</li>`).join('') || '<li>—</li>'}</ul>`,
    micro: `<h4>Micro level — histology & cells</h4><p>${esc(s.micro ?? '—')}</p>
      <button class="open-diagram" data-diagram="${diagramFor(id, s.system)}">Open related micro diagram →</button>`,
    clinical: `<h4>Clinical relevance</h4><ul>${(s.clinical ?? []).map((f) => `<li>${esc(f)}</li>`).join('') || '<li>—</li>'}</ul>`,
    relations: `<h4>Related structures</h4><div class="rel-links">${relButtons(s.related) || '<span class="muted">—</span>'}</div>`,
  };
  const tabs = [['overview', 'Overview'], ['function', 'Function'], ['micro', 'Micro / Cells'], ['clinical', 'Clinical'], ['relations', 'Relations']];
  infoBody.innerHTML = `<div class="info-head">
      <span class="sys-tag" style="background:${sys.color};color:#111">${esc(sys.name)}</span>
      <h2>${esc(title)}</h2>${sub}
      <div class="latin">${esc(s.latin ?? '')}${s.hi ? ` · <span style="font-style:normal">${esc(s.hi)}</span>` : ''}</div>${parent}
    </div>
    <div class="info-tabs">${tabs.map(([k, n], i) => `<button data-sec="${k}" class="${i ? '' : 'active'}">${n}</button>`).join('')}</div>
    <div class="info-section" id="secBody">${sections.overview}</div>`;
  infoBody.querySelectorAll('[data-sec]').forEach((b) => (b.onclick = () => {
    infoBody.querySelectorAll('[data-sec]').forEach((x) => x.classList.toggle('active', x === b));
    $('#secBody').innerHTML = sections[b.dataset.sec];
  }));
}

infoBody.addEventListener('click', (e) => {
  const g = e.target.closest('[data-goto]');
  if (g) { selectById(g.dataset.goto, true); return; }
  const d = e.target.closest('[data-diagram]');
  if (d) { switchTab('cells'); showDiagram(d.dataset.diagram); }
});

/* ------------------------------------------------------------------ */
/* Picking                                                              */
/* ------------------------------------------------------------------ */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function pick(ev) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const pool = state.tab === 'vital'
    ? vitalMarkers.filter((m) => m.visible)
    : parts.filter((p) => p.visible && p.userData.pickable && (p === skin || p.material.opacity > 0.12));
  const hits = ray.intersectObjects(pool, false);
  return hits[0];
}

let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
  const h = pick(e);
  if (state.tab === 'vital') { if (h) selectVital(h.object.userData.vp.id, false); return; }
  if (!h) return;
  const m = h.object;
  setHighlight([m]);
  const region = m.userData.region?.(h.point.clone().sub(m.position));
  if (region) showStructure(region, null, m.userData.id);
  else showStructure(m.userData.id, m.userData.label);
  openInfoOnMobile();
});
canvas.addEventListener('dblclick', (e) => {
  const h = pick(e);
  if (h) focusOn(state.tab === 'vital' ? [h.object] : [h.object]);
});

const hoverLabel = $('#hoverLabel');
let hoverEvt = null;
canvas.addEventListener('pointermove', (e) => { hoverEvt = e; });
canvas.addEventListener('pointerleave', () => { hoverEvt = null; hoverLabel.hidden = true; });
function updateHover() {
  if (!hoverEvt) return;
  const e = hoverEvt; hoverEvt = null;
  if (!$('#hoverLabels').checked && state.tab !== 'vital') { hoverLabel.hidden = true; return; }
  if (e.buttons) { hoverLabel.hidden = true; return; }
  const h = pick(e);
  if (!h) { hoverLabel.hidden = true; canvas.style.cursor = ''; return; }
  const m = h.object;
  let text;
  if (state.tab === 'vital') text = `${m.userData.vp.code} · ${m.userData.vp.name}`;
  else {
    const region = m.userData.region?.(h.point.clone().sub(m.position));
    text = region ? `${info(region).name} — ${info(m.userData.id).name}` : (m.userData.label || info(m.userData.id).name);
  }
  const r = stage.getBoundingClientRect();
  hoverLabel.textContent = text;
  hoverLabel.style.left = `${e.clientX - r.left}px`;
  hoverLabel.style.top = `${e.clientY - r.top}px`;
  hoverLabel.hidden = false;
  canvas.style.cursor = 'pointer';
}

/* ------------------------------------------------------------------ */
/* Vital points (Dim Mak)                                               */
/* ------------------------------------------------------------------ */
const vitalMarkers = [];
const vpGroup = new THREE.Group();
scene.add(vpGroup);
const markerGeo = new THREE.SphereGeometry(0.0055, 16, 12);
const haloGeo = new THREE.RingGeometry(0.008, 0.011, 24);
const markerMat = new THREE.MeshBasicMaterial({ color: '#ff2e55', depthTest: true });
const markerSel = new THREE.MeshBasicMaterial({ color: '#ffd23f' });
(function placeMarkers() {
  skin.updateMatrixWorld();
  const rc = new THREE.Raycaster();
  const skinOnly = [skin];
  for (const vp of VITAL_POINTS) {
    const specs = [vp.ray];
    if (vp.bilateral) specs.push(vp.ray.p ? { p: [-vp.ray.p[0], vp.ray.p[1], vp.ray.p[2]] } : { o: [-vp.ray.o[0], vp.ray.o[1], vp.ray.o[2]], d: [-vp.ray.d[0], vp.ray.d[1], vp.ray.d[2]] });
    specs.forEach((sp, i) => {
      let pos, normal;
      if (sp.p) { pos = new THREE.Vector3(...sp.p); normal = new THREE.Vector3(0, 0, 1); }
      else {
        const d = new THREE.Vector3(...sp.d).normalize();
        rc.set(new THREE.Vector3(...sp.o), d);
        const hit = rc.intersectObjects(skinOnly, false)[0];
        if (!hit) { console.warn('Vital point ray missed', vp.code); return; }
        normal = d.clone().negate();
        pos = hit.point.clone().addScaledVector(normal, 0.0025);
      }
      const m = new THREE.Mesh(markerGeo, markerMat);
      m.position.copy(pos);
      const halo = new THREE.Mesh(haloGeo, new THREE.MeshBasicMaterial({ color: '#ff2e55', transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
      halo.lookAt(normal);
      m.add(halo);
      m.userData = { vp, side: vp.bilateral ? (i ? 'R' : 'L') : null, matches: true, halo };
      m.visible = false;
      vpGroup.add(m);
      vitalMarkers.push(m);
    });
  }
})();

let vpRegion = 'All';
const vpList = $('#vpList');
function renderVpList() {
  const q = $('#vpSearch').value.trim().toLowerCase();
  vpList.innerHTML = '';
  const shown = new Set();
  for (const vp of VITAL_POINTS) {
    const ok = (vpRegion === 'All' || vp.region === vpRegion) && (!q || `${vp.code} ${vp.name} ${vp.meaning} ${vp.location}`.toLowerCase().includes(q));
    if (!ok) continue;
    shown.add(vp.id);
    const b = document.createElement('button');
    b.dataset.vp = vp.id;
    b.innerHTML = `<b>${esc(vp.code)}</b> ${esc(vp.name)}<small>${esc(vp.meaning)} · ${esc(vp.region)}${vp.bilateral ? ' · both sides' : ''}</small>`;
    b.onclick = () => selectVital(vp.id, true);
    vpList.appendChild(b);
  }
  vitalMarkers.forEach((m) => (m.userData.matches = shown.has(m.userData.vp.id)));
  applyVisibility();
}
const chips = $('#vpRegions');
for (const r of ['All', ...REGIONS]) {
  const c = document.createElement('button');
  c.textContent = r;
  c.className = r === 'All' ? 'active' : '';
  c.onclick = () => { vpRegion = r; chips.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === c)); renderVpList(); };
  chips.appendChild(c);
}
$('#vpSearch').oninput = renderVpList;
const xr = document.createElement('label');
xr.className = 'row';
xr.innerHTML = '<span>X-ray view (see bones & organs under each point)</span><input type="checkbox" id="vpXray">';
chips.after(xr);
$('#vpXray').onchange = (e) => { state.skinMode = e.target.checked ? 'xray' : 'solid'; $('#skinMode').value = state.skinMode; applyVisibility(); };

function showVitalIntro() {
  infoBody.innerHTML = `<h2>${esc(DIM_MAK_INTRO.title)}</h2>${DIM_MAK_INTRO.paragraphs.map((p) => `<p>${p}</p>`).join('')}
    <p class="muted small">${VITAL_POINTS.length} points · ${vitalMarkers.length} markers on the body. Click a red marker or choose from the list.</p>`;
}

function selectVital(id, focus) {
  const vp = VITAL_POINTS.find((v) => v.id === id);
  vitalMarkers.forEach((m) => { const on = m.userData.vp.id === id; m.material = on ? markerSel : markerMat; m.scale.setScalar(on ? 1.5 : 1); });
  $$('#vpList button').forEach((b) => b.classList.toggle('active', b.dataset.vp === id));
  const mine = vitalMarkers.filter((m) => m.userData.vp.id === id);
  if (focus && mine.length) {
    const c = mine[0].position.clone();
    const n = mine[0].userData.halo.getWorldDirection(new THREE.Vector3());
    const pos = c.clone().addScaledVector(n, 0.55).add(new THREE.Vector3(0, 0.05, 0));
    animateCamera(pos, c);
  }
  const anat = (vp.anatomy ?? []).filter((a) => STRUCTURES[a]).map((a) => `<button data-goto="${a}">${esc(STRUCTURES[a].name)}</button>`).join('');
  infoBody.innerHTML = `<div class="info-head">
      <span class="sys-tag" style="background:#ff2e55">${esc(vp.region)} · Vital point</span>
      <h2>${esc(vp.code)} — ${esc(vp.name)}</h2>
      <div class="latin">“${esc(vp.meaning)}”${vp.bilateral ? ' · present on both sides' : ' · single midline point'}</div>
    </div>
    <div class="info-section">
      <h4>📍 Exact location</h4><p>${vp.location}</p>
      <h4>Underlying anatomy</h4><p>${vp.underlying}</p>
      <div class="rel-links">${anat}</div>
      <h4>Why this area is vulnerable (medical reason)</h4><p>${vp.why}</p>
      <h4>Traditional claim</h4><p>${vp.tradition}</p>
      <h4>Scientific reality</h4><p class="evidence">${vp.reality}</p>
      <h4>Clinical / first-aid relevance</h4><p>${vp.clinical}</p>
      <p class="muted small">Tip: click an anatomy chip to jump to that structure in the 3D Anatomy tab.</p>
    </div>`;
  openInfoOnMobile();
}

/* ------------------------------------------------------------------ */
/* Cell & micro explorer                                                */
/* ------------------------------------------------------------------ */
const cellList = $('#cellList');
for (const d of DIAGRAMS) {
  const b = document.createElement('button');
  b.dataset.diagram = d.id;
  b.innerHTML = `${esc(d.title)}<small>${Object.keys(d.parts).length} clickable parts</small>`;
  b.onclick = () => showDiagram(d.id);
  cellList.appendChild(b);
}
function showDiagram(id) {
  const d = DIAGRAMS.find((x) => x.id === id) ?? DIAGRAMS[0];
  $$('#cellList button').forEach((b) => b.classList.toggle('active', b.dataset.diagram === d.id));
  const cs = $('#cellStage');
  cs.innerHTML = `<h2>${esc(d.title)}</h2><p class="muted">${esc(d.intro)}</p>${d.svg.replace('viewBox="0 0 900 560"', 'viewBox="-10 0 1030 570"')}
    <div class="chips">${Object.entries(d.parts).map(([k, p]) => `<button data-part="${k}">${esc(p.name)}</button>`).join('')}</div>`;
  const choose = (k) => {
    cs.querySelectorAll('.part').forEach((el) => el.classList.toggle('sel', el.dataset.part === k));
    cs.querySelectorAll('.chips button').forEach((el) => el.classList.toggle('active', el.dataset.part === k));
    const p = d.parts[k];
    infoBody.innerHTML = `<div class="info-head"><span class="sys-tag" style="background:#4fb3ff;color:#111">${esc(d.title)}</span><h2>${esc(p.name)}</h2></div>
      <div class="info-section"><h4>Structure</h4><p>${esc(p.info)}</p><h4>Function</h4><p>${esc(p.fn)}</p>${p.fact ? `<h4>Did you know?</h4><p>${esc(p.fact)}</p>` : ''}</div>`;
    openInfoOnMobile();
  };
  cs.querySelectorAll('[data-part]').forEach((el) => el.addEventListener('click', (e) => { e.stopPropagation(); choose(el.dataset.part); }));
  infoBody.innerHTML = `<h2>${esc(d.title)}</h2><p>${esc(d.intro)}</p><p class="muted">Click any coloured part of the diagram (or a chip below it).</p>`;
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                 */
/* ------------------------------------------------------------------ */
let savedSkin = 'xray';
function switchTab(tab) {
  if (tab === state.tab) return;
  if (state.tab === 'vital') { state.skinMode = savedSkin; $('#skinMode').value = savedSkin; }
  state.tab = tab;
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
  $$('[data-show]').forEach((el) => (el.hidden = el.dataset.show !== tab));
  $('#cellStage').hidden = tab !== 'cells';
  $('#stageHint').hidden = tab === 'cells';
  hoverLabel.hidden = true;
  if (tab === 'vital') {
    savedSkin = state.skinMode;
    state.skinMode = $('#vpXray').checked ? 'xray' : 'solid';
    setHighlight([]);
    renderVpList();
    showVitalIntro();
    const [p, t] = VIEWS.front; animateCamera(new THREE.Vector3(...p), new THREE.Vector3(...t));
  } else if (tab === 'cells') {
    showDiagram($('#cellList button.active')?.dataset.diagram ?? 'cell');
  } else {
    infoBody.innerHTML = $('#welcomeTpl').innerHTML;
  }
  applyVisibility();
}
const tpl = document.createElement('template');
tpl.id = 'welcomeTpl';
tpl.innerHTML = infoBody.innerHTML;
document.body.appendChild(tpl);
$$('.tab').forEach((t) => (t.onclick = () => switchTab(t.dataset.tab)));

/* ------------------------------------------------------------------ */
/* Mobile drawers                                                       */
/* ------------------------------------------------------------------ */
const isMobile = () => matchMedia('(max-width: 980px)').matches;
$('#menuToggle').onclick = () => { $('#sidebar').classList.toggle('open'); $('#info').classList.remove('open'); };
$('#infoToggle').onclick = () => { $('#info').classList.toggle('open'); $('#sidebar').classList.remove('open'); };
function openInfoOnMobile() { if (isMobile()) { $('#info').classList.add('open'); $('#sidebar').classList.remove('open'); } }
canvas.addEventListener('pointerdown', () => { if (isMobile()) $('#sidebar').classList.remove('open'); });

/* ------------------------------------------------------------------ */
/* Optional: real anatomical meshes (glTF) — see README                 */
/* ------------------------------------------------------------------ */
(async function loadExternalModels() {
  let manifest;
  try {
    const r = await fetch('models/manifest.json', { cache: 'no-store' });
    if (!r.ok) return;
    manifest = await r.json();
  } catch { return; }
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  for (const entry of manifest.models ?? []) {
    try {
      const gltf = await loader.loadAsync(`models/${entry.file}`);
      if (entry.replaces) parts.filter((p) => entry.replaces.includes(p.userData.id)).forEach((p) => state.hidden.add(p));
      gltf.scene.traverse((o) => {
        if (!o.isMesh) return;
        const id = entry.id ?? (o.name || entry.file).toLowerCase().replace(/[^a-z0-9]+/g, '_');
        o.material = makeMaterial(entry.preset ?? 'organ', entry.color);
        o.userData = { id, system: entry.system ?? 'skeletal', pickable: true, label: entry.id ? undefined : o.name };
        o.userData.baseEmissive = o.material.emissive.clone();
        parts.push(o);
      });
      if (entry.transform) {
        const { position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 } = entry.transform;
        gltf.scene.position.set(...position); gltf.scene.rotation.set(...rotation); gltf.scene.scale.setScalar(scale);
      }
      model.root.add(gltf.scene);
      console.info('Loaded external model', entry.file);
    } catch (e) { console.warn('Could not load', entry.file, e); }
  }
  applyVisibility();
})();

/* ------------------------------------------------------------------ */
/* Render loop                                                          */
/* ------------------------------------------------------------------ */
applyVisibility();
const ease = (x) => 1 - Math.pow(1 - x, 3);
renderer.setAnimationLoop((time) => {
  if (tween) {
    const k = Math.min(1, (performance.now() - tween.start) / tween.ms);
    camera.position.lerpVectors(tween.p0, tween.p1, ease(k));
    controls.target.lerpVectors(tween.t0, tween.t1, ease(k));
    if (k >= 1) tween = null;
  }
  if (state.tab === 'vital') {
    const s = 1 + 0.35 * Math.sin(time / 260);
    for (const m of vitalMarkers) { m.userData.halo.scale.setScalar(s); m.userData.halo.material.opacity = 0.75 - 0.35 * (s - 1); }
  }
  controls.update();
  updateHover();
  renderer.render(scene, camera);
});

// Expose for debugging / screenshots.
window.anatomy = { renderer, scene, camera, controls, parts, selectById, switchTab, selectVital, showDiagram, state, applyVisibility };
