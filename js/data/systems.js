// Body systems shown in the sidebar (order = display order).
export const SYSTEMS = [
  { id: 'integumentary', name: 'Integumentary (Skin)', color: '#e2b394', hi: 'Twacha' },
  { id: 'skeletal', name: 'Skeletal', color: '#ece2cc', hi: 'Haddiyan' },
  { id: 'muscular', name: 'Muscular', color: '#c0443c', hi: 'Maanspeshiyan' },
  { id: 'nervous', name: 'Nervous', color: '#f2cf5b', hi: 'Tantrika tantra' },
  { id: 'circulatory', name: 'Cardiovascular', color: '#d4302f', hi: 'Rakt sanchar' },
  { id: 'respiratory', name: 'Respiratory', color: '#f0a1a6', hi: 'Shwasan' },
  { id: 'digestive', name: 'Digestive', color: '#d98a5f', hi: 'Pachan' },
  { id: 'urinary', name: 'Urinary', color: '#c9a24d', hi: 'Mootra' },
  { id: 'endocrine', name: 'Endocrine', color: '#9b6fd6', hi: 'Granthi (hormone)' },
  { id: 'lymphatic', name: 'Lymphatic / Immune', color: '#5ec27a', hi: 'Lasika / Pratiraksha' },
];

export const SYSTEM_BY_ID = Object.fromEntries(SYSTEMS.map((s) => [s.id, s]));
