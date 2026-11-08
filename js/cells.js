// Micro-level explorer: clickable SVG diagrams of cells and tissue units.
// Every element with class="part" and data-part="key" is clickable.

const lbl = (x1, y1, x2, y2, text, anchor = 'start') =>
  `<line class="lbl-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><text x="${x2 + (anchor === 'end' ? -4 : 4)}" y="${y2 + 4}" text-anchor="${anchor}">${text}</text>`;

function mito(x, y, rot, s = 1) {
  return `<g class="part" data-part="mitochondrion" transform="translate(${x},${y}) rotate(${rot}) scale(${s})">
    <ellipse rx="34" ry="15" fill="#e8743b" stroke="#9c3f17" stroke-width="2"/>
    <path d="M-24 0 q4 -10 8 0 q4 10 8 0 q4 -10 8 0 q4 10 8 0 q4 -10 8 0 q4 10 8 0" fill="none" stroke="#9c3f17" stroke-width="2"/></g>`;
}

export const DIAGRAMS = [
  /* -------------------------------------------------------------- */
  {
    id: 'cell', title: 'Animal (human) cell', system: 'all',
    intro: 'The basic unit of life. An adult has ~30–37 trillion cells of 200+ types; most share this set of organelles. Click any organelle.',
    svg: `<svg viewBox="0 0 900 560" role="img" aria-label="Animal cell diagram">
      <ellipse class="part" data-part="plasma_membrane" cx="430" cy="280" rx="330" ry="235" fill="#f7d9c4" stroke="#b5705a" stroke-width="7"/>
      <ellipse class="part" data-part="cytoplasm" cx="430" cy="280" rx="318" ry="223" fill="#fbe6d6"/>
      <g class="part" data-part="cytoskeleton" stroke="#c9a28e" stroke-width="1.5" fill="none" opacity=".9">
        <path d="M150 200 L320 120 L520 110 L690 190"/><path d="M140 330 L300 450 L560 470 L720 360"/><path d="M200 140 L260 420"/><path d="M640 140 L620 430"/></g>
      <g class="part" data-part="rough_er" fill="none" stroke="#3e7cb1" stroke-width="7" stroke-linecap="round">
        <path d="M290 230 q-30 50 0 100"/><path d="M265 210 q-45 70 0 140"/><path d="M240 195 q-60 85 0 170"/></g>
      <g class="part" data-part="ribosome" fill="#2b2b2b">
        ${[[283, 240], [279, 270], [283, 300], [262, 225], [252, 260], [252, 300], [262, 335], [236, 210], [226, 250], [222, 290], [228, 330], [238, 352], [560, 120], [580, 135], [470, 440], [490, 452], [350, 430]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4"/>`).join('')}</g>
      <g class="part" data-part="smooth_er" fill="none" stroke="#5aa66a" stroke-width="7" stroke-linecap="round">
        <path d="M200 400 q30 -20 60 0 t60 0"/><path d="M215 425 q30 -20 60 0 t60 0"/></g>
      <g class="part" data-part="nucleus">
        <circle cx="390" cy="280" r="95" fill="#a98ad6" stroke="#5d3f93" stroke-width="5"/>
        ${[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => `<circle cx="${390 + 95 * Math.cos(a * Math.PI / 180)}" cy="${280 + 95 * Math.sin(a * Math.PI / 180)}" r="5" fill="#fbe6d6"/>`).join('')}
        <path d="M330 250 q20 -30 40 0 t40 10 t30 -20 M340 310 q25 20 50 0 t50 10" stroke="#6f55a8" stroke-width="2" fill="none"/></g>
      <circle class="part" data-part="nucleolus" cx="410" cy="295" r="28" fill="#4a2f7e"/>
      <g class="part" data-part="golgi" fill="none" stroke="#d4a017" stroke-width="8" stroke-linecap="round">
        <path d="M540 230 q40 -40 80 0"/><path d="M535 255 q45 -40 90 0"/><path d="M532 280 q48 -40 96 0"/><path d="M538 305 q42 -36 84 0"/></g>
      <g class="part" data-part="vesicle" fill="#ffe28a" stroke="#d4a017" stroke-width="2">
        <circle cx="650" cy="250" r="9"/><circle cx="665" cy="285" r="7"/><circle cx="645" cy="320" r="8"/><circle cx="700" cy="230" r="7"/></g>
      ${mito(560, 400, 20)}${mito(250, 140, -25)}${mito(660, 380, -50, 0.85)}${mito(480, 150, 5, 0.8)}
      <g class="part" data-part="lysosome"><circle cx="520" cy="350" r="17" fill="#d96b8c" stroke="#8f2c4b" stroke-width="2"/><circle cx="160" cy="300" r="14" fill="#d96b8c" stroke="#8f2c4b" stroke-width="2"/></g>
      <g class="part" data-part="peroxisome"><circle cx="470" cy="460" r="13" fill="#7fc7b7" stroke="#2f7d6d" stroke-width="2"/><circle cx="330" cy="455" r="10" fill="#7fc7b7" stroke="#2f7d6d" stroke-width="2"/></g>
      <g class="part" data-part="centrosome"><rect x="590" y="160" width="12" height="34" rx="3" fill="#7a6a5a"/><rect x="606" y="172" width="34" height="12" rx="3" fill="#7a6a5a"/></g>
      ${lbl(760, 200, 800, 160, 'Plasma membrane')}${lbl(390, 200, 330, 40, 'Nucleus', 'end')}${lbl(420, 290, 470, 30, 'Nucleolus')}
      ${lbl(240, 230, 110, 230, 'Rough ER', 'end')}${lbl(220, 410, 90, 450, 'Smooth ER', 'end')}${lbl(600, 225, 760, 100, 'Golgi apparatus')}
      ${lbl(585, 405, 770, 470, 'Mitochondrion')}${lbl(520, 365, 600, 520, 'Lysosome')}${lbl(470, 472, 450, 530, 'Peroxisome', 'end')}
      ${lbl(620, 168, 780, 60, 'Centrosome')}${lbl(665, 285, 820, 300, 'Vesicles')}${lbl(250, 300, 120, 360, 'Ribosomes', 'end')}${lbl(200, 160, 120, 110, 'Cytoskeleton', 'end')}
    </svg>`,
    parts: {
      plasma_membrane: { name: 'Plasma (cell) membrane', info: 'Phospholipid bilayer (~7–10 nm) with cholesterol, embedded proteins (channels, carriers, receptors, pumps) and an outer glycocalyx of sugars.', fn: 'Selective barrier; controls transport (diffusion, channels, Na⁺/K⁺-ATPase pump, endocytosis); cell signalling and recognition.', fact: 'The Na⁺/K⁺ pump alone uses ~20–25% of resting energy in many cells (up to ~70% in neurons).' },
      cytoplasm: { name: 'Cytoplasm / cytosol', info: 'Gel-like fluid (~70% water) with ions, enzymes, nutrients filling the cell between membrane and nucleus.', fn: 'Site of glycolysis, protein synthesis by free ribosomes and many metabolic reactions.' },
      nucleus: { name: 'Nucleus', info: 'Double-membrane nuclear envelope with nuclear pores (~2000–4000 per nucleus) enclosing ~2 m of DNA packed as chromatin (euchromatin active, heterochromatin condensed). 46 chromosomes in human body cells.', fn: 'Stores genetic information; site of DNA replication and transcription (DNA → mRNA).', fact: 'Mature red blood cells lose their nucleus; skeletal muscle fibres have hundreds of nuclei.' },
      nucleolus: { name: 'Nucleolus', info: 'Dense, membrane-less region of the nucleus around ribosomal-RNA genes.', fn: 'Makes ribosomal RNA and assembles ribosome subunits.' },
      rough_er: { name: 'Rough endoplasmic reticulum', info: 'Flattened membrane sacs (cisternae) continuous with the nuclear envelope, studded with ribosomes.', fn: 'Synthesises and folds proteins destined for secretion, membranes or lysosomes.', fact: 'Abundant in plasma cells (antibodies) and pancreatic acinar cells (enzymes).' },
      smooth_er: { name: 'Smooth endoplasmic reticulum', info: 'Tubular membranes without ribosomes.', fn: 'Lipid & steroid synthesis, drug detoxification (liver), calcium storage (sarcoplasmic reticulum in muscle).' },
      ribosome: { name: 'Ribosomes', info: 'Tiny (~25 nm) RNA–protein machines (60S + 40S subunits), free in cytosol or bound to rough ER.', fn: 'Translate mRNA into protein (protein synthesis).' },
      golgi: { name: 'Golgi apparatus', info: 'Stack of 4–8 curved cisternae with a cis (receiving) face and trans (shipping) face.', fn: 'Modifies (glycosylation), sorts and packages proteins and lipids into vesicles; makes lysosomes.' },
      vesicle: { name: 'Vesicles', info: 'Small membrane bubbles (transport, secretory, endocytic).', fn: 'Move material between organelles and release contents by exocytosis (e.g. hormones, neurotransmitters).' },
      mitochondrion: { name: 'Mitochondrion', info: 'Double membrane; inner membrane folded into cristae, matrix contains its own circular DNA (37 genes, inherited from the mother) and ribosomes.', fn: 'Aerobic respiration: Krebs cycle + electron transport chain → ~30–32 ATP per glucose. Also apoptosis, heat generation, calcium buffering.', fact: 'Heart muscle cells are ~30–40% mitochondria by volume.' },
      lysosome: { name: 'Lysosome', info: 'Membrane sac containing ~50 acid hydrolase enzymes at pH ~4.5–5.', fn: 'Digests worn-out organelles (autophagy), engulfed bacteria and debris.', fact: 'Lysosomal storage diseases (e.g. Tay–Sachs) result from missing enzymes.' },
      peroxisome: { name: 'Peroxisome', info: 'Small single-membrane organelle with oxidative enzymes and catalase.', fn: 'Breaks down very-long-chain fatty acids and hydrogen peroxide; detoxifies alcohol (liver, kidney).' },
      centrosome: { name: 'Centrosome & centrioles', info: 'Pair of perpendicular centrioles, each made of 9 triplets of microtubules.', fn: 'Organises microtubules and the mitotic spindle during cell division; basal bodies of cilia.' },
      cytoskeleton: { name: 'Cytoskeleton', info: 'Network of microfilaments (actin, 7 nm), intermediate filaments (10 nm, e.g. keratin) and microtubules (25 nm, tubulin).', fn: 'Cell shape, movement, intracellular transport (motor proteins kinesin & dynein), cell division.' },
    },
  },
  /* -------------------------------------------------------------- */
  {
    id: 'neuron', title: 'Neuron & synapse', system: 'nervous',
    intro: 'The nerve cell — ~86 billion in the brain. Signals travel as electrical action potentials along the axon and as chemicals across the synapse.',
    svg: `<svg viewBox="0 0 900 560" role="img" aria-label="Neuron diagram">
      <g class="part" data-part="dendrites" stroke="#c46f9a" stroke-width="7" stroke-linecap="round" fill="none">
        <path d="M150 230 L90 160 L60 120 M90 160 L50 175"/><path d="M140 290 L60 300 L25 270 M60 300 L30 335"/><path d="M165 330 L120 410 L80 440 M120 410 L135 470"/><path d="M190 200 L180 120 L150 80 M180 120 L215 85"/><path d="M215 340 L230 420"/></g>
      <circle class="part" data-part="soma" cx="190" cy="270" r="68" fill="#e7a3c4" stroke="#a24f78" stroke-width="4"/>
      <circle class="part" data-part="neuron_nucleus" cx="185" cy="268" r="26" fill="#7d4fa8"/>
      <path class="part" data-part="axon_hillock" d="M252 245 L300 262 L300 280 L252 297 Z" fill="#d987ae" stroke="#a24f78" stroke-width="3"/>
      <rect class="part" data-part="axon" x="300" y="265" width="440" height="12" fill="#c46f9a"/>
      <g class="part" data-part="myelin">${[310, 400, 490, 580].map((x) => `<rect x="${x}" y="250" width="78" height="42" rx="20" fill="#f5e7b0" stroke="#c9a94b" stroke-width="3"/>`).join('')}</g>
      <g class="part" data-part="node_ranvier">${[391, 481, 571].map((x) => `<rect x="${x}" y="258" width="6" height="26" fill="#7a2a50"/>`).join('')}</g>
      <circle class="part" data-part="schwann_nucleus" cx="440" cy="252" r="7" fill="#9b7d2a"/>
      <g class="part" data-part="axon_terminal" stroke="#c46f9a" stroke-width="6" fill="#e7a3c4" stroke-linecap="round">
        <path d="M740 271 L790 220" fill="none"/><path d="M740 271 L800 270" fill="none"/><path d="M740 271 L790 325" fill="none"/>
        <circle cx="795" cy="215" r="11"/><circle cx="806" cy="270" r="11"/><circle cx="795" cy="330" r="11"/></g>
      <circle cx="700" cy="450" r="95" fill="none" stroke="#999" stroke-dasharray="6 5"/>
      <line x1="795" y1="341" x2="760" y2="380" stroke="#999" stroke-dasharray="6 5"/>
      <path class="part" data-part="presynaptic" d="M620 380 q80 -10 160 0 l0 55 q-80 15 -160 0 z" fill="#e7a3c4" stroke="#a24f78" stroke-width="3"/>
      <g class="part" data-part="synaptic_vesicles" fill="#ffe28a" stroke="#c9a94b">${[[650, 400], [675, 410], [700, 398], [725, 412], [750, 400], [690, 425], [735, 428]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8"/>`).join('')}</g>
      <rect class="part" data-part="synaptic_cleft" x="625" y="440" width="150" height="14" fill="#bfe3f2"/>
      <g class="part" data-part="neurotransmitter" fill="#e8743b">${[[650, 447], [680, 445], [705, 449], [730, 446], [760, 448]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join('')}</g>
      <path class="part" data-part="postsynaptic" d="M620 455 q80 -8 160 0 l0 60 q-80 10 -160 0 z" fill="#b9a0e0" stroke="#6b4fa3" stroke-width="3"/>
      <g class="part" data-part="receptors" fill="#3e7cb1">${[640, 670, 700, 730, 760].map((x) => `<rect x="${x}" y="454" width="10" height="9"/>`).join('')}</g>
      ${lbl(60, 120, 30, 60, 'Dendrites')}${lbl(190, 330, 240, 500, 'Cell body (soma)')}${lbl(185, 268, 300, 160, 'Nucleus')}
      ${lbl(280, 262, 310, 200, 'Axon hillock')}${lbl(350, 250, 360, 190, 'Myelin sheath (Schwann cell)')}${lbl(484, 284, 470, 340, 'Node of Ranvier', 'end')}
      ${lbl(660, 271, 650, 330, 'Axon', 'end')}${lbl(806, 270, 830, 230, 'Axon terminals')}${lbl(780, 400, 820, 400, 'Synaptic vesicles')}${lbl(775, 447, 820, 450, 'Synaptic cleft')}${lbl(780, 490, 820, 500, 'Postsynaptic membrane')}
    </svg>`,
    parts: {
      dendrites: { name: 'Dendrites', info: 'Branched extensions covered in dendritic spines.', fn: 'Receive signals (synaptic inputs) from other neurons — a single Purkinje cell receives ~200,000.' },
      soma: { name: 'Cell body (soma)', info: 'Contains nucleus and Nissl bodies (clumps of rough ER — very active protein synthesis).', fn: 'Integrates incoming signals; metabolic centre of the neuron.' },
      neuron_nucleus: { name: 'Nucleus', info: 'Large, pale (euchromatic) nucleus with prominent nucleolus — sign of high transcription.', fn: 'Controls protein synthesis. Most neurons never divide after birth.' },
      axon_hillock: { name: 'Axon hillock / initial segment', info: 'Cone where the axon leaves the soma; very high density of voltage-gated Na⁺ channels.', fn: 'Trigger zone — where the action potential is generated if threshold (~−55 mV) is reached.' },
      axon: { name: 'Axon', info: 'Single long process, from <1 mm up to ~1 m (sciatic nerve fibres). Contains microtubules for axonal transport.', fn: 'Conducts the action potential away from the soma.' },
      myelin: { name: 'Myelin sheath', info: 'Spiral wraps of Schwann-cell membrane (PNS) or oligodendrocyte membrane (CNS) — lipid-rich insulation.', fn: 'Speeds conduction from ~1 m/s up to ~120 m/s by saltatory conduction.', fact: 'Multiple sclerosis (CNS) and Guillain–Barré syndrome (PNS) are demyelinating diseases.' },
      node_ranvier: { name: 'Nodes of Ranvier', info: '~1 µm gaps between myelin segments, packed with Na⁺ channels.', fn: 'The impulse “jumps” from node to node (saltatory conduction).' },
      schwann_nucleus: { name: 'Schwann cell nucleus', info: 'Each Schwann cell myelinates one segment of one axon.', fn: 'Also guides regeneration of cut peripheral nerves (~1 mm/day).' },
      axon_terminal: { name: 'Axon terminals (boutons)', info: 'Swollen endings filled with mitochondria and synaptic vesicles.', fn: 'Convert electrical signal to chemical release.' },
      presynaptic: { name: 'Presynaptic terminal', info: 'Voltage-gated Ca²⁺ channels open when the action potential arrives.', fn: 'Ca²⁺ influx triggers vesicle fusion (SNARE proteins) and transmitter release.', fact: 'Botulinum and tetanus toxins cleave SNARE proteins.' },
      synaptic_vesicles: { name: 'Synaptic vesicles', info: '~40 nm vesicles each holding thousands of neurotransmitter molecules.', fn: 'Store neurotransmitters such as glutamate, GABA, acetylcholine, dopamine, serotonin.' },
      synaptic_cleft: { name: 'Synaptic cleft', info: '20–40 nm gap between neurons.', fn: 'Transmitter diffuses across in <1 ms; enzymes (e.g. acetylcholinesterase) or reuptake transporters clear it.' },
      neurotransmitter: { name: 'Neurotransmitter molecules', info: 'Chemical messengers.', fn: 'Bind postsynaptic receptors — excitatory (glutamate) or inhibitory (GABA, glycine).' },
      postsynaptic: { name: 'Postsynaptic membrane', info: 'Dense postsynaptic density holding receptors and signalling proteins.', fn: 'Generates postsynaptic potentials that sum at the receiving neuron.' },
      receptors: { name: 'Receptors', info: 'Ionotropic (ligand-gated channels, fast) and metabotropic (G-protein coupled, slow).', fn: 'Translate chemical signal back into an electrical change.' },
    },
  },
  /* -------------------------------------------------------------- */
  {
    id: 'sarcomere', title: 'Skeletal muscle & sarcomere', system: 'muscular',
    intro: 'Muscle → fascicle → muscle fibre (cell) → myofibril → sarcomere. The sarcomere (~2–3 µm) is the contractile unit; filaments slide past each other (sliding-filament theory).',
    svg: `<svg viewBox="0 0 900 560" role="img" aria-label="Sarcomere diagram">
      <g class="part" data-part="fibre"><rect x="60" y="40" width="780" height="90" rx="45" fill="#d65c55" stroke="#8f2a25" stroke-width="3"/>
        ${Array.from({ length: 26 }, (_, i) => `<line x1="${95 + i * 28}" y1="45" x2="${95 + i * 28}" y2="125" stroke="#8f2a25" stroke-width="${i % 2 ? 2 : 6}" opacity=".55"/>`).join('')}
        ${[160, 380, 610].map((x) => `<ellipse cx="${x}" cy="52" rx="16" ry="6" fill="#4a2f7e"/>`).join('')}</g>
      <text x="450" y="160" text-anchor="middle">One muscle fibre (multinucleated cell) with striations → zoom on one sarcomere ↓</text>
      <rect class="part" data-part="i_band" x="90" y="200" width="150" height="250" fill="#f4d6d3"/><rect class="part" data-part="i_band" x="660" y="200" width="150" height="250" fill="#f4d6d3"/>
      <rect class="part" data-part="a_band" x="240" y="200" width="420" height="250" fill="#e3a9a3"/>
      <rect class="part" data-part="h_zone" x="390" y="200" width="120" height="250" fill="#eec0bb"/>
      <g class="part" data-part="actin" stroke="#3e7cb1" stroke-width="6">${[230, 270, 310, 350, 390, 430].map((y) => `<line x1="95" y1="${y}" x2="385" y2="${y}"/><line x1="515" y1="${y}" x2="805" y2="${y}"/>`).join('')}</g>
      <g class="part" data-part="myosin">${[250, 290, 330, 370, 410].map((y) => `<line x1="245" y1="${y}" x2="655" y2="${y}" stroke="#7a3b98" stroke-width="12"/>${Array.from({ length: 12 }, (_, k) => k === 5 || k === 6 ? '' : `<line x1="${262 + k * 32}" y1="${y - 6}" x2="${272 + k * 32}" y2="${y - 15}" stroke="#7a3b98" stroke-width="4"/>`).join('')}`).join('')}</g>
      <g class="part" data-part="titin" stroke="#5aa66a" stroke-width="2" fill="none">${[250, 330, 410].map((y) => `<path d="M90 ${y} q20 -8 40 0 t40 0 t40 0 t40 0 t40 0"/>`).join('')}</g>
      <rect class="part" data-part="z_disc" x="82" y="190" width="16" height="270" fill="#2b2b2b"/><rect class="part" data-part="z_disc" x="802" y="190" width="16" height="270" fill="#2b2b2b"/>
      <rect class="part" data-part="m_line" x="446" y="200" width="8" height="250" fill="#4a2f7e"/>
      ${lbl(90, 460, 90, 495, 'Z-disc')}${lbl(165, 200, 165, 185, 'I band')}${lbl(300, 200, 300, 185, 'A band')}${lbl(450, 450, 450, 500, 'M line')}${lbl(495, 200, 520, 182, 'H zone')}
      ${lbl(150, 430, 130, 520, 'Actin (thin)')}${lbl(600, 410, 640, 520, 'Myosin (thick)')}${lbl(200, 250, 230, 545, 'Titin')}
    </svg>`,
    parts: {
      fibre: { name: 'Skeletal muscle fibre', info: 'A single cell up to several cm long, 10–100 µm wide, with hundreds of peripheral nuclei (formed by fused myoblasts) and satellite stem cells.', fn: 'Contraction under voluntary control. Fibre types: type I (slow, red, fatigue-resistant), type IIa, type IIx (fast, powerful).' },
      z_disc: { name: 'Z-disc (Z line)', info: 'Protein lattice (α-actinin) where thin filaments anchor; marks each end of the sarcomere.', fn: 'Z-discs are pulled closer together during contraction.' },
      i_band: { name: 'I band', info: 'Light band containing only thin (actin) filaments; bisected by the Z-disc.', fn: 'Shortens during contraction.' },
      a_band: { name: 'A band', info: 'Dark band = full length of the thick filaments (~1.6 µm).', fn: 'Length stays the same during contraction.' },
      h_zone: { name: 'H zone', info: 'Central part of the A band with only thick filaments.', fn: 'Narrows/disappears during contraction.' },
      m_line: { name: 'M line', info: 'Proteins (myomesin) linking thick filaments at the centre.', fn: 'Keeps thick filaments aligned.' },
      actin: { name: 'Actin (thin filament)', info: 'Double helix of G-actin with tropomyosin and troponin (C, I, T).', fn: 'Ca²⁺ binds troponin C → tropomyosin moves → myosin binding sites exposed.' },
      myosin: { name: 'Myosin (thick filament)', info: '~300 myosin II molecules with heads that act as ATPases.', fn: 'Cross-bridge cycle: head binds actin, power-stroke pulls the filament, ATP releases the head. Rigor mortis = no ATP to release heads.' },
      titin: { name: 'Titin', info: 'The largest known protein (~34,000 amino acids), spring-like, from Z-disc to M line.', fn: 'Passive elasticity; centres the thick filaments.' },
    },
  },
  /* -------------------------------------------------------------- */
  {
    id: 'nephron', title: 'Nephron (kidney unit)', system: 'urinary',
    intro: 'Each kidney contains ~1 million nephrons. Blood is filtered in the glomerulus, then the tubule reabsorbs what the body needs and secretes waste.',
    svg: `<svg viewBox="0 0 900 560" role="img" aria-label="Nephron diagram">
      <rect x="0" y="0" width="900" height="210" fill="#f7efe3"/><rect x="0" y="210" width="900" height="350" fill="#efe0cf"/>
      <text x="20" y="30">Cortex</text><text x="20" y="240">Medulla</text>
      <path class="part" data-part="afferent" d="M60 120 L170 120" stroke="#cf2a2a" stroke-width="12" fill="none"/>
      <path class="part" data-part="efferent" d="M170 140 L80 175 L60 200" stroke="#b03030" stroke-width="8" fill="none"/>
      <circle class="part" data-part="bowman" cx="200" cy="130" r="52" fill="#fff3d6" stroke="#c9a24d" stroke-width="7"/>
      <g class="part" data-part="glomerulus" stroke="#cf2a2a" stroke-width="6" fill="none"><path d="M175 120 q20 -35 40 -5 q20 30 -10 35 q-30 5 -15 -25 q15 -25 35 5"/><path d="M180 140 q25 20 40 -10"/></g>
      <path class="part" data-part="pct" d="M245 110 q60 -60 110 -10 q40 40 -10 70 q-50 30 0 60 q30 20 20 40" stroke="#d98a5f" stroke-width="20" fill="none" stroke-linecap="round"/>
      <path class="part" data-part="loop_desc" d="M365 270 L365 470" stroke="#e8b44a" stroke-width="12" fill="none"/>
      <path class="part" data-part="loop_henle" d="M365 470 q0 50 35 50 q35 0 35 -50" stroke="#e8b44a" stroke-width="12" fill="none"/>
      <path class="part" data-part="loop_asc" d="M435 470 L435 260" stroke="#c97f2e" stroke-width="16" fill="none"/>
      <path class="part" data-part="dct" d="M435 260 q0 -60 50 -80 q60 -20 60 30 q0 40 60 30 q40 -10 60 -60" stroke="#8fbf6a" stroke-width="16" fill="none" stroke-linecap="round"/>
      <circle class="part" data-part="juxtaglomerular" cx="250" cy="165" r="11" fill="#9b6fd6"/>
      <path class="part" data-part="collecting_duct" d="M665 120 L700 120 L700 540" stroke="#4fa3c9" stroke-width="22" fill="none"/>
      <g class="part" data-part="peritubular" stroke="#d65c5c" stroke-width="3" fill="none" opacity=".85"><path d="M80 190 q120 60 240 20 q80 -30 140 40 q40 60 120 20"/><path d="M340 300 q-30 80 10 160 M455 300 q30 80 -10 160"/></g>
      ${lbl(100, 120, 60, 80, 'Afferent arteriole', 'end')}${lbl(80, 175, 40, 255, 'Efferent arteriole')}${lbl(200, 80, 220, 40, 'Bowman capsule')}${lbl(200, 125, 120, 30, 'Glomerulus', 'end')}
      ${lbl(355, 100, 380, 50, 'Proximal convoluted tubule')}${lbl(365, 380, 300, 380, 'Descending limb', 'end')}${lbl(400, 520, 470, 545, 'Loop of Henle')}${lbl(435, 380, 480, 380, 'Thick ascending limb')}
      ${lbl(560, 190, 600, 240, 'Distal convoluted tubule')}${lbl(700, 400, 740, 400, 'Collecting duct')}${lbl(250, 165, 260, 230, 'Juxtaglomerular apparatus')}
    </svg>`,
    parts: {
      afferent: { name: 'Afferent arteriole', info: 'Brings blood into the glomerulus; wider than the efferent arteriole.', fn: 'Its width controls glomerular pressure (autoregulation, myogenic response).' },
      efferent: { name: 'Efferent arteriole', info: 'Carries blood out of the glomerulus into peritubular capillaries / vasa recta.', fn: 'Constriction (angiotensin II) maintains filtration pressure.' },
      glomerulus: { name: 'Glomerulus', info: 'Tuft of fenestrated capillaries. Filtration barrier = fenestrated endothelium + glomerular basement membrane + podocyte foot processes with slit diaphragms (nephrin).', fn: 'Filters ~125 mL/min (GFR) — water, salts, glucose, urea pass; cells and large proteins do not.', fact: 'Protein in urine (proteinuria) signals damage to this barrier.' },
      bowman: { name: 'Bowman capsule', info: 'Cup of simple squamous parietal epithelium with podocytes on the inner (visceral) layer.', fn: 'Collects the filtrate.' },
      pct: { name: 'Proximal convoluted tubule', info: 'Cuboidal cells with a dense brush border (microvilli) and many mitochondria.', fn: 'Reabsorbs ~65% of water and Na⁺, all glucose and amino acids, bicarbonate; secretes drugs and acids.', fact: 'Glucose appears in urine (diabetes) when the PCT transporters (SGLT2) are saturated.' },
      loop_desc: { name: 'Descending limb of the loop of Henle', info: 'Thin simple squamous epithelium, permeable to water (aquaporin-1).', fn: 'Water leaves into the salty medulla — filtrate becomes concentrated.' },
      loop_henle: { name: 'Loop of Henle', info: 'Hairpin dipping into the medulla — long loops in juxtamedullary nephrons.', fn: 'Countercurrent multiplier creating the medullary osmotic gradient (up to ~1200 mOsm/kg).' },
      loop_asc: { name: 'Thick ascending limb', info: 'Impermeable to water; NKCC2 transporters pump Na⁺, K⁺, 2Cl⁺ out.', fn: 'Dilutes the filtrate and builds the medullary salt gradient. Loop diuretics (furosemide) block NKCC2.' },
      dct: { name: 'Distal convoluted tubule', info: 'Cuboidal cells, few microvilli.', fn: 'Fine-tunes Na⁺, Cl⁻ and Ca²⁺ (PTH-sensitive). Thiazide diuretics act here.' },
      juxtaglomerular: { name: 'Juxtaglomerular apparatus', info: 'Macula densa (DCT sensor cells) + juxtaglomerular (granular) cells in the afferent arteriole.', fn: 'Releases renin when blood pressure or salt is low → renin–angiotensin–aldosterone system.' },
      collecting_duct: { name: 'Collecting duct', info: 'Principal cells (aquaporin-2, ENaC) and intercalated cells (acid–base).', fn: 'ADH inserts water channels → concentrated urine; aldosterone increases Na⁺ reabsorption.' },
      peritubular: { name: 'Peritubular capillaries & vasa recta', info: 'Low-pressure capillary networks around the tubules.', fn: 'Take back reabsorbed water and solutes into the blood.' },
    },
  },
  /* -------------------------------------------------------------- */
  {
    id: 'alveolus', title: 'Alveolus & gas exchange', system: 'respiratory',
    intro: '~480 million alveoli give ~70 m² of exchange surface. O₂ diffuses into blood and CO₂ out across a barrier only ~0.5 µm thick.',
    svg: `<svg viewBox="0 0 900 560" role="img" aria-label="Alveolus diagram">
      <path class="part" data-part="bronchiole" d="M410 0 L410 120 L490 120 L490 0 Z" fill="#e6c9c4" stroke="#b07f78" stroke-width="3"/>
      <circle class="part" data-part="alveolar_wall" cx="450" cy="310" r="210" fill="#fbe5e7" stroke="#d98a92" stroke-width="10"/>
      <circle class="part" data-part="air_space" cx="450" cy="310" r="185" fill="#eaf6ff"/>
      <g class="part" data-part="type1">${[200, 260, 320, 20, 80, 140].map((a) => `<path d="M${450 + 200 * Math.cos(a * Math.PI / 180)} ${310 + 200 * Math.sin(a * Math.PI / 180)} a 6 6 0 0 1 0 0" /><ellipse cx="${450 + 197 * Math.cos(a * Math.PI / 180)}" cy="${310 + 197 * Math.sin(a * Math.PI / 180)}" rx="14" ry="5" transform="rotate(${a + 90} ${450 + 197 * Math.cos(a * Math.PI / 180)} ${310 + 197 * Math.sin(a * Math.PI / 180)})" fill="#c25a73"/>`).join('')}</g>
      <g class="part" data-part="type2"><circle cx="300" cy="180" r="24" fill="#e0a64a" stroke="#9c6a17" stroke-width="2"/>${[0, 1, 2, 3].map((k) => `<circle cx="${292 + (k % 2) * 14}" cy="${172 + Math.floor(k / 2) * 14}" r="4" fill="#fff6d6"/>`).join('')}<circle cx="610" cy="440" r="22" fill="#e0a64a" stroke="#9c6a17" stroke-width="2"/></g>
      <g class="part" data-part="macrophage"><path d="M520 300 q30 -30 55 0 q20 25 -5 45 q-30 20 -50 -5 q-15 -20 0 -40" fill="#7fae6a" stroke="#3f6f2a" stroke-width="2"/><circle cx="545" cy="318" r="9" fill="#2f4f20"/><circle cx="530" cy="305" r="4" fill="#444"/></g>
      <path class="part" data-part="surfactant" d="M290 160 A185 185 0 0 0 290 460" stroke="#f2c94c" stroke-width="6" fill="none" opacity=".9"/>
      <g class="part" data-part="capillary"><path d="M240 520 Q450 600 660 520" stroke="#cf2a2a" stroke-width="34" fill="none" stroke-linecap="round"/><path d="M640 120 Q700 310 640 500" stroke="#7a4fc4" stroke-width="30" fill="none" stroke-linecap="round" opacity=".85"/></g>
      <g class="part" data-part="rbc">${[[330, 545], [420, 565], [510, 562], [590, 540], [670, 230], [690, 330], [672, 420]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="13" ry="8" fill="#ff5a5a" stroke="#a01818"/>`).join('')}</g>
      <g font-size="16" font-weight="700"><text x="560" y="520" fill="#2a7ac9">O₂ →</text><text x="560" y="470" fill="#666">← CO₂</text></g>
      ${lbl(490, 60, 560, 40, 'Respiratory bronchiole')}${lbl(260, 310, 80, 300, 'Alveolar wall', 'end')}${lbl(450, 310, 380, 240, 'Air space')}
      ${lbl(253, 310, 90, 400, 'Type I pneumocyte', 'end')}${lbl(300, 180, 120, 120, 'Type II pneumocyte', 'end')}${lbl(575, 300, 700, 120, 'Alveolar macrophage')}
      ${lbl(280, 230, 120, 210, 'Surfactant layer', 'end')}${lbl(240, 520, 90, 520, 'Pulmonary capillary', 'end')}
    </svg>`,
    parts: {
      bronchiole: { name: 'Respiratory bronchiole', info: 'Smallest airways (<0.5 mm) with alveoli budding from their walls; club cells, no cartilage.', fn: 'Transition from air conduction to gas exchange.' },
      alveolar_wall: { name: 'Alveolar wall (interalveolar septum)', info: 'Contains capillaries, elastic fibres, fibroblasts; pores of Kohn connect neighbouring alveoli.', fn: 'Elastic recoil drives passive expiration.', fact: 'Emphysema destroys these walls, reducing surface area.' },
      air_space: { name: 'Alveolar air space', info: '~200 µm diameter sac.', fn: 'Holds air with PO₂ ≈ 100 mmHg and PCO₂ ≈ 40 mmHg.' },
      type1: { name: 'Type I pneumocytes', info: 'Very thin squamous cells covering ~95% of the alveolar surface.', fn: 'Form the blood–air barrier with the capillary endothelium and fused basement membranes (~0.5 µm).' },
      type2: { name: 'Type II pneumocytes', info: 'Cuboidal cells with lamellar bodies (surfactant stores); ~5% of surface but more numerous.', fn: 'Secrete surfactant; act as stem cells regenerating type I cells.', fact: 'Premature babies lack surfactant → respiratory distress syndrome.' },
      macrophage: { name: 'Alveolar macrophage (dust cell)', info: 'Wandering phagocytes derived from monocytes.', fn: 'Engulf dust, bacteria and debris; carried up the mucociliary escalator.' },
      surfactant: { name: 'Surfactant', info: 'Phospholipid (mainly DPPC) and protein film lining the alveolus.', fn: 'Lowers surface tension so alveoli do not collapse at the end of expiration (Laplace’s law).' },
      capillary: { name: 'Pulmonary capillaries', info: 'Dense mesh — blood takes ~0.75 s to pass, equilibrium is reached in ~0.25 s.', fn: 'Deoxygenated blood (purple) becomes oxygenated (red).' },
      rbc: { name: 'Red blood cells', info: 'Biconcave discs (7.5 µm) packed with ~270 million haemoglobin molecules each.', fn: 'Each haemoglobin binds 4 O₂ molecules; CO₂ carried mostly as bicarbonate.' },
    },
  },
  /* -------------------------------------------------------------- */
  {
    id: 'osteon', title: 'Compact bone (osteon)', system: 'skeletal',
    intro: 'Bone is living tissue: a collagen + hydroxyapatite matrix built in osteons (Haversian systems) and continuously remodelled — the whole skeleton is replaced roughly every 10 years.',
    svg: `<svg viewBox="0 0 900 560" role="img" aria-label="Osteon diagram">
      <rect class="part" data-part="periosteum" x="20" y="20" width="860" height="40" rx="10" fill="#e9b8a8" stroke="#a5674f" stroke-width="2"/>
      <rect class="part" data-part="interstitial" x="20" y="60" width="860" height="480" fill="#efe4cc"/>
      ${[[300, 300, 1], [640, 280, 0.8]].map(([cx, cy, s], o) => `
        <g class="part" data-part="lamellae">${[200, 170, 140, 110, 80, 55].map((r) => `<circle cx="${cx}" cy="${cy}" r="${r * s}" fill="${r % 60 ? '#f6ecd8' : '#eadcc0'}" stroke="#cbb48a" stroke-width="2"/>`).join('')}</g>
        <g class="part" data-part="canaliculi" stroke="#7a5a3a" stroke-width="1.2">${Array.from({ length: 16 }, (_, k) => { const a = k * Math.PI / 8; return `<line x1="${cx + 40 * s * Math.cos(a)}" y1="${cy + 40 * s * Math.sin(a)}" x2="${cx + 190 * s * Math.cos(a + 0.1)}" y2="${cy + 190 * s * Math.sin(a + 0.1)}"/>`; }).join('')}</g>
        <g class="part" data-part="osteocyte">${[95, 125, 155, 185].flatMap((r, i) => Array.from({ length: 6 }, (_, k) => { const a = k * Math.PI / 3 + i * 0.5; return `<ellipse cx="${cx + r * s * Math.cos(a)}" cy="${cy + r * s * Math.sin(a)}" rx="${8 * s}" ry="${4 * s}" transform="rotate(${a * 57.3 + 90} ${cx + r * s * Math.cos(a)} ${cy + r * s * Math.sin(a)})" fill="#8a5a3a"/>`; })).join('')}</g>
        <g class="part" data-part="haversian"><circle cx="${cx}" cy="${cy}" r="${32 * s}" fill="#fff" stroke="#a5674f" stroke-width="3"/><circle cx="${cx - 8 * s}" cy="${cy}" r="${7 * s}" fill="#cf2a2a"/><circle cx="${cx + 9 * s}" cy="${cy - 4 * s}" r="${6 * s}" fill="#3355c4"/><circle cx="${cx + 4 * s}" cy="${cy + 12 * s}" r="${3 * s}" fill="#f2cf5b"/></g>`).join('')}
      <path class="part" data-part="volkmann" d="M332 300 L608 280" stroke="#cf2a2a" stroke-width="10"/>
      <g class="part" data-part="osteoblast">${[60, 100, 140, 180, 220].map((x) => `<rect x="${x + 560}" y="62" width="30" height="16" rx="5" fill="#5aa66a"/>`).join('')}</g>
      <path class="part" data-part="osteoclast" d="M90 62 q30 40 70 0 l0 16 q-35 30 -70 0 z" fill="#9b6fd6" stroke="#5d3f93"/>
      ${lbl(300, 40, 330, 10, 'Periosteum')}${lbl(300, 300, 160, 520, 'Haversian (central) canal', 'end')}${lbl(470, 300, 470, 520, 'Concentric lamellae')}
      ${lbl(395, 300, 360, 470, 'Osteocyte in lacuna', 'end')}${lbl(470, 290, 520, 200, 'Volkmann (perforating) canal')}${lbl(700, 70, 760, 110, 'Osteoblasts')}${lbl(125, 75, 150, 120, 'Osteoclast')}${lbl(820, 400, 800, 520, 'Interstitial lamellae', 'end')}
    </svg>`,
    parts: {
      periosteum: { name: 'Periosteum', info: 'Outer fibrous layer + inner cellular (osteogenic) layer, anchored by Sharpey fibres; richly innervated.', fn: 'Bone growth in width, fracture healing; source of bone pain.' },
      interstitial: { name: 'Interstitial lamellae', info: 'Fragments of old osteons left between newer ones after remodelling.', fn: 'Evidence of continuous bone remodelling.' },
      lamellae: { name: 'Concentric lamellae', info: 'Rings of mineralised matrix; collagen fibres alternate direction in each layer (plywood-like). Matrix ≈ 65% hydroxyapatite (Ca₁₀(PO₄)₆(OH)₂), 35% organic (type I collagen).', fn: 'Mineral gives hardness, collagen gives flexibility and tensile strength.', fact: 'Brittle bone disease (osteogenesis imperfecta) is caused by defective type I collagen.' },
      haversian: { name: 'Haversian (central) canal', info: 'Central channel (~50 µm) with an arteriole, venule and nerve.', fn: 'Supplies the osteocytes of each osteon.' },
      osteocyte: { name: 'Osteocytes in lacunae', info: 'Mature bone cells trapped in small spaces (lacunae); the most numerous bone cells, living for decades.', fn: 'Sense mechanical strain and orchestrate remodelling (sclerostin, RANKL).' },
      canaliculi: { name: 'Canaliculi', info: 'Tiny channels containing osteocyte processes joined by gap junctions.', fn: 'Exchange of nutrients and signals between osteocytes and the central canal.' },
      volkmann: { name: 'Volkmann (perforating) canals', info: 'Channels at right angles to Haversian canals.', fn: 'Connect osteon blood vessels with each other and with the periosteum and marrow.' },
      osteoblast: { name: 'Osteoblasts', info: 'Cuboidal bone-forming cells on bone surfaces, rich in rough ER and alkaline phosphatase.', fn: 'Secrete osteoid (unmineralised matrix) which then mineralises; become osteocytes when trapped.' },
      osteoclast: { name: 'Osteoclast', info: 'Giant multinucleated cell (from monocyte/macrophage line) with a ruffled border in a resorption pit (Howship lacuna).', fn: 'Dissolves bone with acid and enzymes (cathepsin K) — releases calcium into the blood.', fact: 'Osteoporosis = resorption exceeds formation; bisphosphonates inhibit osteoclasts.' },
    },
  },
  /* -------------------------------------------------------------- */
  {
    id: 'blood', title: 'Blood cells', system: 'circulatory',
    intro: '~5 L of blood: 55% plasma, ~45% red cells, <1% white cells and platelets. All are made in red bone marrow from haematopoietic stem cells.',
    svg: `<svg viewBox="0 0 900 560" role="img" aria-label="Blood cells diagram">
      <rect width="900" height="560" fill="#fdf1e6"/>
      <g class="part" data-part="erythrocyte">${[[90, 110], [170, 90], [130, 170], [230, 150], [800, 450], [740, 500], [820, 520]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="34" fill="#e2453f" stroke="#9a1d19" stroke-width="2"/><circle cx="${x}" cy="${y}" r="14" fill="#f17a74"/>`).join('')}</g>
      <g class="part" data-part="neutrophil"><circle cx="420" cy="130" r="58" fill="#f3d9e8" stroke="#a97096" stroke-width="2"/>${[[395, 120], [418, 105], [440, 125], [425, 150]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="14" ry="11" fill="#6a3d8f"/>`).join('')}</g>
      <g class="part" data-part="lymphocyte"><circle cx="640" cy="130" r="40" fill="#cfe0f3" stroke="#6a8fb8" stroke-width="2"/><circle cx="640" cy="130" r="33" fill="#3d3b8f"/></g>
      <g class="part" data-part="monocyte"><circle cx="150" cy="380" r="66" fill="#e6e0f3" stroke="#8a7ab8" stroke-width="2"/><path d="M110 360 q40 -40 80 0 q-10 30 -40 25 q-25 -5 -40 -25" fill="#5d4fa0"/></g>
      <g class="part" data-part="eosinophil"><circle cx="390" cy="390" r="56" fill="#f7c6a8" stroke="#c97a4a" stroke-width="2"/>${Array.from({ length: 30 }, (_, k) => `<circle cx="${390 + 42 * Math.cos(k * 2.4) * (0.4 + (k % 5) / 8)}" cy="${390 + 42 * Math.sin(k * 2.4) * (0.4 + (k % 5) / 8)}" r="4" fill="#e8743b"/>`).join('')}<ellipse cx="372" cy="388" rx="15" ry="12" fill="#6a3d8f"/><ellipse cx="408" cy="388" rx="15" ry="12" fill="#6a3d8f"/></g>
      <g class="part" data-part="basophil"><circle cx="600" cy="390" r="52" fill="#e3dbf2" stroke="#8a7ab8" stroke-width="2"/>${Array.from({ length: 26 }, (_, k) => `<circle cx="${600 + 38 * Math.cos(k * 2.4) * (0.3 + (k % 5) / 7)}" cy="${390 + 38 * Math.sin(k * 2.4) * (0.3 + (k % 5) / 7)}" r="6" fill="#2d1f5e"/>`).join('')}</g>
      <g class="part" data-part="platelet">${[[760, 250], [800, 280], [780, 320], [830, 240]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="7" fill="#c9a0d8" stroke="#7d4fa8"/>`).join('')}</g>
      <text x="150" y="230" text-anchor="middle">Red blood cells</text><text x="420" y="215" text-anchor="middle">Neutrophil</text><text x="640" y="200" text-anchor="middle">Lymphocyte</text>
      <text x="150" y="470" text-anchor="middle">Monocyte</text><text x="390" y="470" text-anchor="middle">Eosinophil</text><text x="600" y="470" text-anchor="middle">Basophil</text><text x="795" y="350" text-anchor="middle">Platelets</text>
    </svg>`,
    parts: {
      erythrocyte: { name: 'Red blood cell (erythrocyte)', info: '~5 million per µL; no nucleus or mitochondria; biconcave disc 7–8 µm; lives ~120 days, removed by the spleen.', fn: 'Carries O₂ with haemoglobin; helps carry CO₂.', fact: 'Your marrow makes ~2–3 million red cells every second.' },
      neutrophil: { name: 'Neutrophil', info: '50–70% of white cells; multi-lobed nucleus (3–5 lobes); lives hours to days.', fn: 'First responder to bacterial infection — phagocytosis; forms pus.' },
      lymphocyte: { name: 'Lymphocyte', info: '20–40% of white cells; large round nucleus with thin rim of cytoplasm. B cells, T cells (helper CD4, cytotoxic CD8), NK cells.', fn: 'Adaptive immunity: antibodies (B → plasma cells), killing infected cells, immune memory.' },
      monocyte: { name: 'Monocyte', info: 'Largest white cell, kidney-shaped nucleus; 2–8%.', fn: 'Migrates into tissues to become macrophages and dendritic cells.' },
      eosinophil: { name: 'Eosinophil', info: '1–4%; bilobed nucleus; large orange-red granules.', fn: 'Defence against parasites; involved in allergy and asthma.' },
      basophil: { name: 'Basophil', info: '<1%; dark purple granules hiding the nucleus.', fn: 'Releases histamine and heparin — allergic reactions.' },
      platelet: { name: 'Platelets (thrombocytes)', info: 'Cell fragments (2–3 µm) budded off megakaryocytes; 150,000–400,000 per µL; live ~7–10 days.', fn: 'Stop bleeding: adhere, activate and aggregate to form a platelet plug; support clotting.', fact: 'Aspirin permanently blocks platelet COX-1 for their whole lifespan.' },
    },
  },
];

/** Which micro diagram best explains a structure (by id or system). */
export function diagramFor(id, system) {
  const byId = { kidney: 'nephron', right_lung: 'alveolus', left_lung: 'alveolus', bronchi: 'alveolus', heart: 'blood', spleen: 'blood', bone_marrow: 'blood' };
  const lobe = /_lobe$/.test(id) && system === 'respiratory' ? 'alveolus' : null;
  return byId[id] || lobe || { nervous: 'neuron', muscular: 'sarcomere', skeletal: 'osteon', urinary: 'nephron', respiratory: 'alveolus', circulatory: 'blood', lymphatic: 'blood' }[system] || 'cell';
}
