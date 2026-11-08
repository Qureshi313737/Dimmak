# Anatomy Explorer 3D (Dimmak)

An interactive, browser-based **3D human anatomy learning project** with:

1. **3D Anatomy** – a full-body procedural 3D model with ~330 clickable meshes across 10 body systems. Click any bone, muscle, organ, vessel or nerve to get its overview, location, function, **micro-level (histology & cell) detail**, clinical relevance and related structures.
2. **Cell & Micro Explorer** – 7 clickable micro diagrams (animal cell, neuron & synapse, sarcomere, nephron, alveolus, osteon, blood cells). Every organelle or part opens its own explanation.
3. **Vital Points (Dim Mak)** – 46 traditional vital points (Dim Mak / kyusho / acupuncture points) placed as markers on the 3D body. Each point shows its exact standard location, the anatomy underneath, the medical reason that area is sensitive, the traditional claim, what science actually says, and first-aid relevance.

> **Hinglish:** Yeh project learning ke liye hai. 3D body me kisi bhi structure par click karo, right panel me poori jankari aayegi (Overview, Function, Micro/Cells, Clinical, Relations). “Vital Points” tab me Dim Mak ke saare points body par laal markers ki tarah dikhte hain, har point ka exact location aur uske neeche ki anatomy ke saath.

---

## How to run

ES modules need a local web server. Opening `index.html` by double-click (file://) will **not** work.

```bash
cd Dimmak
python3 -m http.server 8000
# then open http://localhost:8000 in Chrome / Edge / Firefox
```

Alternatives: `npx serve .`, the VS Code “Live Server” extension, or enable **GitHub Pages** for the repository (Settings → Pages → deploy from branch); it’s all static files.

No build step and no internet connection needed — Three.js r170 is vendored in `vendor/three/`.

## Controls

| Action | Mouse / touch |
| --- | --- |
| Rotate | Left-drag / one finger |
| Pan | Right-drag / two fingers |
| Zoom | Scroll / pinch |
| Show details | Click |
| Fly to a structure | Double-click, or pick it from search / structure list |

Sidebar: toggle every system on/off, set its opacity, switch skin mode (X-ray glass / solid / hidden), **explode** the organs apart, isolate or hide the selected part, and jump to preset views (front, back, left, right, head, torso).

Organs with sub-regions report the exact part you clicked:
- **Cerebrum** → frontal / parietal / temporal / occipital lobe
- **Heart** → right/left atrium, right/left ventricle
- **Lungs** → upper / middle / lower lobes
- **Liver** → right / left lobe

## What is modelled

| System | Structures (examples) |
| --- | --- |
| Skeletal | skull, mandible, hyoid, all 24 vertebrae individually (C1–L5) + discs, sacrum, coccyx, 12 pairs of ribs + costal cartilage, sternum, clavicle, scapula, humerus, radius, ulna, carpals, metacarpals, phalanges, pelvis, femur, patella, tibia, fibula, tarsals, metatarsals |
| Muscular | 33 muscles incl. facial muscles, SCM, trapezius, deltoid, pectoralis, rectus abdominis (with tendinous intersections), lats, glutes, quads, hamstrings, calf, Achilles tendon |
| Nervous | cerebrum (with gyri & coloured lobes), cerebellum, brainstem, spinal cord, cauda equina, eyes, optic nerves, inner ear (cochlea + semicircular canals), vagus, phrenic, sympathetic trunk, brachial plexus, median/ulnar/radial, femoral, sciatic, tibial, common peroneal |
| Cardiovascular | heart with coronary arteries, aorta & arch branches, pulmonary trunk, carotids, jugulars, venae cavae, limb arteries & veins, renal and portal vessels |
| Respiratory | pharynx, larynx, trachea with cartilage rings, branching bronchial tree, lungs, diaphragm |
| Digestive | teeth, tongue, salivary glands, oesophagus, stomach, duodenum, pancreas, liver, gallbladder, small intestine, caecum, appendix, colon (with haustra), rectum |
| Urinary / Endocrine / Lymphatic | kidneys, ureters, bladder, urethra, pituitary, hypothalamus, pineal, thyroid, parathyroids, adrenals, spleen, thymus, tonsils, lymph-node groups, thoracic duct |

## Honest limitations

- The body is **procedurally sculpted in code** (curves, swept tubes, deformed ellipsoids), so shapes are anatomically *placed and proportioned* but simplified — it is not a scanned, photorealistic medical model. Reproductive organs are not modelled yet.
- “Micro level” detail is delivered through histology text for each structure and the 2D micro diagrams, not as zoomable 3D cells.
- For true scan-level realism you can plug in open anatomical meshes — see below.

## Upgrading to real anatomical meshes (optional)

The app automatically loads extra glTF/GLB models if `models/manifest.json` exists. Good open sources:

- **BodyParts3D** (Database Center for Life Science, Japan) – CC BY-SA
- **Z-Anatomy** (Blender atlas built on BodyParts3D) – CC BY-SA 4.0

Export meshes to `.glb` (e.g. from Blender), put them in `models/`, then create `models/manifest.json` (see `models/manifest.example.json`):

```json
{
  "models": [
    { "file": "femur_L.glb", "id": "femur", "system": "skeletal", "preset": "bone", "replaces": ["femur"],
      "transform": { "position": [0, 0, 0], "rotation": [0, 0, 0], "scale": 0.001 } }
  ]
}
```

- `id` links the mesh to the info in `js/data/structures.js` (omit it to use each mesh’s own name).
- `replaces` hides the procedural version.
- `transform` aligns the model to this scene (metres, y-up, +z = front, +x = the body’s left, soles at y = 0).

## Project structure

```
index.html              page layout
css/style.css           styles (dark/light theme, mobile drawers)
js/main.js              scene, picking, UI, tabs, vital-point markers
js/model.js             procedural 3D body (all systems)
js/geometry.js          sweep / blob / surface-patch geometry helpers
js/materials.js         tissue materials and X-ray skin shader
js/cells.js             micro diagrams (SVG) + their content
js/data/structures.js   educational text for every structure
js/data/vitalpoints.js  Dim Mak / vital point data
js/data/systems.js      body system list
vendor/three/           Three.js r170 (MIT)
```

## About the Dim Mak section

Dim Mak (“death touch”) is a martial-arts legend. The points it uses are acupuncture points (WHO Standard Acupuncture Point Locations, 2008). There is **no scientific evidence** for a delayed “death touch”, but several of these areas sit over genuinely vulnerable anatomy (carotid sinus, the thin pterion and middle meningeal artery at the temple, the heart behind the sternum — commotio cordis, the spleen under the floating ribs, the kidneys). The section explains each point through that real anatomy for **education and first-aid awareness only**. Never strike or press these areas on another person outside qualified, supervised training.

## Credits & disclaimer

Three.js © mrdoob and contributors (MIT). Content written for learning; it is not medical advice. Verify details against standard textbooks (Gray’s Anatomy, Netter, Junqueira’s Histology) before relying on them.
