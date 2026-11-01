// Eşya simgeleri (48×48 SVG). Her simge: koyu kontur, ana dolgu, gölge ve parlama katmanları.
// Gradyan kimlikleri (url(#..)) bilerek kullanılmaz: gizli paneller tarafından tanımlanan kimlikler başka yerde bozulabilir.

const K = '#20140a'; // kontur rengi
const o = (w = 2) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const sh = (rx = 14, cy = 44) => `<ellipse cx="24" cy="${cy}" rx="${rx}" ry="2.6" fill="#000" opacity=".28"/>`;
const hi = (d, op = 0.55, w = 2) => `<path d="${d}" stroke="#fff" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="${op}"/>`;
// konturlu kalın çizgi (önce koyu geniş, sonra renkli dar)
const line = (d, color, w = 4) => `<path d="${d}" stroke="${K}" stroke-width="${w + 2.4}" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
const gem = (fill, light, dark) => sh(11) +
  `<path d="M14 16 L20 9 H28 L34 16 L24 40 Z" fill="${fill}" ${o()}/>` +
  `<path d="M14 16 H34 L24 40 Z" fill="${dark}" opacity=".55"/>` +
  `<path d="M20 9 L22 16 H26 L28 9 Z" fill="${light}" opacity=".9"/>` +
  `<path d="M14 16 L22 16 L24 40 Z" fill="${light}" opacity=".35"/>` +
  `<path d="M22 16 L24 40 L26 16" stroke="${K}" stroke-width=".8" fill="none" opacity=".5"/>` +
  hi('M18 12 L20 10', 0.9, 1.6) + `<circle cx="31" cy="12" r="1.3" fill="#fff" opacity=".9"/>`;
const blade = (bl, bh, guard, grip) => sh(15) +
  `<path d="M14 34 C21 27 31 16 42 5 C41.5 13 34 24 18 37 Z" fill="${bl}" ${o()}/>` +
  `<path d="M18 37 C30 27 37 18 41.5 9 C40 16 33 25 18 37 Z" fill="${bh}" opacity=".55"/>` +
  hi('M16.5 33.5 C23 27 32 17 40 8', 0.75, 1.3) +
  `<path d="M12 31 Q7 39 14 42.5" stroke="${K}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M12 31 Q7 39 14 42.5" stroke="${guard}" stroke-width="2" fill="none" stroke-linecap="round"/>` +
  line('M10.5 29.5 L19.5 38.5', guard, 3.4) + line('M14 34 L8 40', grip, 3.6) +
  `<path d="M12.6 35.2 L10.8 37 M11.2 33.8 L9.4 35.6" stroke="${K}" stroke-width=".8" opacity=".6"/>` +
  `<circle cx="7" cy="41" r="2.8" fill="${guard}" ${o(1.5)}/>`;
const ingot = (top, front, side) => sh(16) +
  `<path d="M6 34 L12 22 H38 L42 34 Z" fill="${front}" ${o()}/>` +
  `<path d="M12 22 L16 16 H40 L38 22 Z" fill="${top}" ${o()}/>` +
  `<path d="M38 22 L40 16 L44 28 L42 34 Z" fill="${side}" ${o()}/>` +
  hi('M17 18 H37', 0.8, 1.6) + hi('M10 31 L14 24', 0.4, 1.4);

export const ICONS = {
  sword: blade('#e3e8ee', '#9aa3ad', '#d6a92c', '#6b3d1c'),
  oldsword: blade('#a89a78', '#6f6448', '#8a7840', '#3e2a18') + '<circle cx="30" cy="18" r="1.6" fill="#7a4a20" opacity=".8"/><circle cx="24" cy="25" r="1.2" fill="#7a4a20" opacity=".8"/>',
  pistol: sh(16) +
    `<rect x="17" y="14.5" width="27" height="6.5" rx="1.6" fill="#7a8187" ${o()}/>` + hi('M19 16.3 H42', 0.5, 1.2) +
    `<rect x="40" y="13.5" width="4" height="8.5" rx="1" fill="#c9a227" ${o(1.5)}/>` +
    `<path d="M24 14.5 H16 C10 16 6 27 7.5 38 L15.5 39.5 C15.5 31 19 25 25 21 Z" fill="#7a4520" ${o()}/>` +
    hi('M14 18 C11 23 10 30 10.5 35', 0.35, 1.6) +
    `<rect x="19" y="18.5" width="8" height="5.5" rx="1" fill="#d6a92c" ${o(1.4)}/>` +
    `<path d="M21 14.5 L22.5 9 L26 10 L24.5 15" fill="#5c6166" ${o(1.4)}/>` +
    `<path d="M22 24 Q24 31 28.5 24" stroke="${K}" stroke-width="3.2" fill="none"/><path d="M22 24 Q24 31 28.5 24" stroke="#d6a92c" stroke-width="1.6" fill="none"/>` +
    `<circle cx="9.5" cy="37" r="2.4" fill="#d6a92c" ${o(1.2)}/>`,
  ammo: sh(14) +
    `<path d="M12 22 Q16 16 22 22 V36 Q17 39 12 36 Z" fill="#8a6a3a" ${o()}/><path d="M12 22 Q17 26 22 22" stroke="${K}" stroke-width="1.4" fill="none"/>` +
    `<rect x="14" y="16" width="6" height="4" rx="1" fill="#5a3a1a" ${o(1.2)}/>` +
    [[29, 27], [35, 32], [27, 35], [36, 23]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.6" fill="#8d9298" ${o(1.6)}/><circle cx="${x - 1.5}" cy="${y - 1.6}" r="1.5" fill="#fff" opacity=".7"/>`).join(''),
  ball: sh(13) +
    `<circle cx="24" cy="25" r="14" fill="#2e3034" ${o()}/>` +
    `<path d="M14 30 A14 14 0 0 0 35 34 A12 12 0 0 1 14 30 Z" fill="#000" opacity=".35"/>` +
    `<circle cx="18.5" cy="19.5" r="4.5" fill="#fff" opacity=".28"/><circle cx="17" cy="18" r="1.8" fill="#fff" opacity=".6"/>` +
    `<path d="M30 12 Q33 8 36 9" stroke="#e8a030" stroke-width="2" fill="none" stroke-linecap="round" opacity=".0"/>`,
  shovel: sh(12) +
    line('M24 5 V28', '#8a6238', 3.6) + line('M18.5 5 H29.5', '#8a6238', 3) +
    `<path d="M15 27 H33 L31 39 Q24 45.5 17 39 Z" fill="#a3abb3" ${o()}/>` +
    `<path d="M24 27 V42 Q28 41 31 39 L33 27 Z" fill="#6f777f" opacity=".45"/>` + hi('M18 30 L19 38', 0.7, 1.6) +
    `<rect x="21.5" y="25" width="5" height="4" fill="#5c6166" ${o(1.2)}/>`,
  rod: sh(14) +
    line('M7 42 Q20 24 41 6', '#7a5230', 2.6) +
    `<path d="M41 6 Q45 20 37 31" stroke="#f2f2f2" stroke-width="1" fill="none" opacity=".9"/>` +
    `<circle cx="13" cy="35" r="4.6" fill="#a8adb3" ${o(1.6)}/><circle cx="13" cy="35" r="1.6" fill="#555"/>` + line('M13 35 L16.5 38', '#555', 1.2) +
    `<path d="M37 30 a3 3 0 1 0 0.1 0 Z" fill="#e8e2d0" ${o(1.3)}/><path d="M34 33 h6 a3 3 0 0 1 -6 0 Z" fill="#d03a2a"/>` +
    [[18, 29], [27, 18], [35, 11]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="none" stroke="#c9a227" stroke-width="1"/>`).join(''),
  torch: sh(8) +
    line('M24 22 V43', '#6b3d1c', 4) +
    `<rect x="20" y="18" width="8" height="7" rx="1.5" fill="#8a6a3a" ${o(1.5)}/>` +
    `<path d="M21 20.5 H27 M21 23 H27" stroke="${K}" stroke-width=".8" opacity=".6"/>` +
    `<path d="M24 2.5 C33 10 31 19 24 19 C17 19 15 11 20 6 C20 10 22 12 23.5 12 C22 9 23 5 24 2.5 Z" fill="#ff8a1e" ${o(1.6)}/>` +
    `<path d="M24 9 C28.5 13 27.5 17.5 24 17.5 C20.5 17.5 20.5 13.5 24 9 Z" fill="#ffe27a"/>`,
  compass: sh(14) +
    `<circle cx="24" cy="24" r="17" fill="#c9a227" ${o()}/>` + `<circle cx="24" cy="24" r="17" fill="none" stroke="#fff3b0" stroke-width="1.2" opacity=".5" stroke-dasharray="20 87"/>` +
    `<circle cx="24" cy="24" r="12.5" fill="#f4e8c8" ${o(1.4)}/>` +
    [0, 90, 180, 270].map((a) => `<rect x="23.4" y="12.6" width="1.2" height="3" fill="${K}" transform="rotate(${a} 24 24)"/>`).join('') +
    `<path d="M24 13.5 L27.5 24 H20.5 Z" fill="#c0392b" ${o(1)}/><path d="M24 34.5 L27.5 24 H20.5 Z" fill="#e8e2d0" ${o(1)}/>` +
    `<circle cx="24" cy="24" r="1.8" fill="${K}"/><rect x="21.5" y="4" width="5" height="4" rx="1.5" fill="#c9a227" ${o(1.3)}/>`,
  spyglass: sh(17) +
    `<g transform="rotate(-24 24 24)">` +
    `<rect x="3" y="20" width="12" height="9" rx="1.5" fill="#6b3d1c" ${o()}/>` +
    `<rect x="14" y="19" width="12" height="11" rx="1.5" fill="#c9a227" ${o()}/>` +
    `<rect x="25" y="18" width="15" height="13" rx="1.5" fill="#b8901f" ${o()}/>` +
    `<rect x="39" y="16.5" width="6" height="16" rx="2" fill="#d6a92c" ${o()}/>` +
    `<path d="M4 23 H14 M15 22 H25 M26 21 H39" stroke="#fff" stroke-width="1.4" opacity=".55"/>` +
    `<path d="M6 21 V28 M9 21 V28 M12 21 V28" stroke="${K}" stroke-width=".8" opacity=".55"/>` +
    `<ellipse cx="45" cy="24.5" rx="1.4" ry="6" fill="#7ab8e0" ${o(1)}/></g>`,
  plank: sh(17) +
    `<path d="M4 20 L38 13 L44 18 L10 25 Z" fill="#c09060" ${o()}/>` +
    `<path d="M4 20 L10 25 V35 L4 30 Z" fill="#7a5230" ${o()}/>` +
    `<path d="M10 25 L44 18 V28 L10 35 Z" fill="#a8784a" ${o()}/>` +
    `<path d="M13 29 Q24 25 41 23 M14 32 Q28 28 40 26" stroke="#6b4a2c" stroke-width="1" fill="none"/>` +
    `<circle cx="14" cy="29.5" r="1.2" fill="#555"/><circle cx="40" cy="22.5" r="1.2" fill="#555"/>` + hi('M8 20 L37 14', 0.45, 1.2),
  bait: sh(14) +
    line('M9 33 C14 20 22 36 30 26 C35 20 41 22 39 29', '#d88a8a', 5) +
    `<path d="M13 27 L15 29 M19 28 L20.5 30.5 M26 30 L28 31 M33 23 L34 25.5" stroke="#a85858" stroke-width="1.2"/>` +
    hi('M12 28 C15 23 19 30 24 31', 0.45, 1.3) + `<circle cx="39" cy="29" r="1" fill="${K}"/>`,
  lure: sh(14) +
    `<path d="M10 24 C16 15 30 14 37 24 C30 34 16 33 10 24 Z" fill="#e8c43a" ${o()}/>` +
    `<path d="M10 24 C16 30 30 33 37 24 C30 29 18 29 10 24 Z" fill="#c0392b" opacity=".75"/>` +
    hi('M14 21 C19 17 27 17 32 20', 0.7, 1.4) + `<circle cx="31" cy="22.5" r="2.4" fill="#fff" ${o(1)}/><circle cx="31.5" cy="22.5" r="1.1" fill="${K}"/>` +
    `<path d="M10 24 L5 24 M5 24 Q4 31 9 31" stroke="#9aa3ad" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
    `<path d="M37 24 L42 21 M42 21 Q45 27 41 29" stroke="#9aa3ad" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  banana: sh(14) +
    `<path d="M9 13 C11 32 27 41 41 34 C40 31 38 31 36 32 C25 35 15 27 14 11 Z" fill="#f2d340" ${o()}/>` +
    `<path d="M14 15 C16 28 25 34 36 32 C26 37 13 30 12 14 Z" fill="#c9a020" opacity=".55"/>` +
    hi('M11.5 16 C13 26 19 33 27 35', 0.5, 1.3) +
    `<path d="M9 13 L13 10.5 L14 11" stroke="${K}" stroke-width="1.5" fill="#6b4a2c"/><circle cx="41" cy="34" r="1.5" fill="#4a3018"/>`,
  bread: sh(15) +
    `<rect x="9" y="13" width="30" height="25" rx="6" fill="#c8964a" ${o()}/>` +
    `<rect x="11.5" y="15" width="25" height="5" rx="2.5" fill="#e8bb70" opacity=".8"/>` +
    [[16, 23], [24, 23], [32, 23], [16, 31], [24, 31], [32, 31]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#7a5220"/>`).join(''),
  cooked: sh(16) +
    `<ellipse cx="24" cy="28" rx="19" ry="10" fill="#e8e2d0" ${o()}/>` +
    `<path d="M9 27 C15 18 28 18 34 26 C28 34 15 34 9 27 Z" fill="#c07a40" ${o(1.6)}/>` +
    `<path d="M34 26 L41 20 L40 33 Z" fill="#a8622e" ${o(1.6)}/>` +
    `<path d="M15 22 L13 31 M20 21 L18 32 M25 21 L23 32 M30 23 L28 31" stroke="#5a2a10" stroke-width="1.6"/>` +
    `<circle cx="13" cy="25" r="1.3" fill="${K}"/><path d="M33 15 Q30 11 33 8 M38 15 Q35 11 38 8" stroke="#fff" stroke-width="1.4" fill="none" opacity=".6"/>`,
  potion: sh(11) +
    `<rect x="20" y="5" width="8" height="7" rx="1.5" fill="#a0703a" ${o(1.6)}/>` +
    `<path d="M20 12 H28 V17 C35 20 38 26 37 33 C36 40 30 43 24 43 C18 43 12 40 11 33 C10 26 13 20 20 17 Z" fill="#cfe9e2" fill-opacity=".55" ${o()}/>` +
    `<path d="M12 30 C18 27 30 33 36 29 C37 36 32 42 24 42 C16 42 11 37 12 30 Z" fill="#3fc06a"/>` +
    `<circle cx="20" cy="35" r="1.5" fill="#bff5c8"/><circle cx="27" cy="37" r="1" fill="#bff5c8"/>` +
    hi('M16 22 C14 25 13.5 28 14 31', 0.75, 1.8) + `<rect x="18" y="25" width="12" height="4" rx="1" fill="#f2e6c8" ${o(.8)} opacity=".9"/>`,
  coin: sh(13) +
    `<circle cx="24" cy="24" r="15.5" fill="#b8860b" ${o()}/>` + `<circle cx="24" cy="22.8" r="14" fill="#f0c847"/>` +
    `<circle cx="24" cy="22.8" r="10.5" fill="none" stroke="#b8860b" stroke-width="1.6"/>` +
    `<path d="M24 15 L26 20.5 H31.5 L27 24 L28.8 29.5 L24 26.2 L19.2 29.5 L21 24 L16.5 20.5 H22 Z" fill="#d9a520" stroke="#a87810" stroke-width=".8"/>` +
    hi('M14 17 A12 12 0 0 1 22 11', 0.85, 1.8),
  bar: ingot('#eef1f4', '#b7bdc4', '#8f969e'),
  goldbar: ingot('#ffe47a', '#e8b830', '#b88a18'),
  pearl: sh(12) +
    `<path d="M8 33 C10 26 38 26 40 33 C36 39 12 39 8 33 Z" fill="#c9b8a8" ${o(1.6)}/>` +
    `<circle cx="24" cy="24" r="10" fill="#f6f1ea" ${o()}/>` + `<path d="M15 27 A10 10 0 0 0 33 27 A9 9 0 0 1 15 27 Z" fill="#c8b8d8" opacity=".55"/>` +
    `<circle cx="20.5" cy="20.5" r="3.2" fill="#fff"/><circle cx="28" cy="27" r="1.4" fill="#fff" opacity=".7"/>`,
  gem_red: gem('#d0303f', '#ff8a96', '#7a0f1c'),
  gem_green: gem('#2ea860', '#8af0b0', '#0e5a2c'),
  gem_white: gem('#dff0ff', '#ffffff', '#8ab0d0'),
  necklace: sh(10, 45) +
    `<path d="M9 8 Q11 30 24 32 Q37 30 39 8" stroke="${K}" stroke-width="3.6" fill="none"/>` +
    `<path d="M9 8 Q11 30 24 32 Q37 30 39 8" stroke="#e8c040" stroke-width="2" fill="none" stroke-dasharray="2.4 1.2"/>` +
    `<path d="M24 31 L31 37 L24 45 L17 37 Z" fill="#2f5fd0" ${o(1.6)}/><path d="M24 31 L27 37 L24 45 Z" fill="#14307a" opacity=".55"/>` +
    `<circle cx="24" cy="32" r="2.6" fill="#e8c040" ${o(1)}/>` + hi('M21 36 L23 34', 0.9, 1.4),
  vase: sh(11) +
    `<path d="M18 5 H30 L28.5 11 C38 17 38 33 30 40 L31 43 H17 L18 40 C10 33 10 17 19.5 11 Z" fill="#c4703c" ${o()}/>` +
    `<path d="M13.5 22 H34.5 M12.8 29 H35.2" stroke="${K}" stroke-width="3.4"/><path d="M13.5 22 H34.5 M12.8 29 H35.2" stroke="#2a1a10" stroke-width="2.2"/>` +
    `<path d="M15 25.5 L18 23 L21 25.5 L24 23 L27 25.5 L30 23 L33 25.5" stroke="#e8c070" stroke-width="1.2" fill="none"/>` +
    `<path d="M30 12 C36 17 37 30 30 39 C33 30 33 18 28.5 11 Z" fill="#000" opacity=".22"/>` + hi('M17 16 C14 21 14 30 17 36', 0.4, 1.8),
  idol: sh(11) +
    `<rect x="15" y="38" width="18" height="5" rx="1" fill="#8a6a2a" ${o(1.6)}/>` +
    `<path d="M17 38 L18 22 H30 L31 38 Z" fill="#d4af37" ${o()}/>` +
    `<rect x="16" y="6" width="16" height="16" rx="4" fill="#e8c040" ${o()}/>` +
    `<rect x="19" y="11" width="4" height="3" fill="#2f8f5a"/><rect x="25" y="11" width="4" height="3" fill="#2f8f5a"/><path d="M20 18 H28" stroke="${K}" stroke-width="1.6"/>` +
    `<path d="M16 26 L11 31 M32 26 L37 31" stroke="${K}" stroke-width="3.6" stroke-linecap="round"/><path d="M16 26 L11 31 M32 26 L37 31" stroke="#d4af37" stroke-width="2" stroke-linecap="round"/>` +
    hi('M19 8 L19 18', 0.55, 1.6),
  crown: sh(15) +
    `<path d="M8 36 L9 14 L17 23 L24 9 L31 23 L39 14 L40 36 Z" fill="#e8c040" ${o()}/>` +
    `<rect x="7.5" y="32" width="33" height="7" rx="1.5" fill="#d4a020" ${o()}/>` +
    `<circle cx="16" cy="35.5" r="2" fill="#2f5fd0"/><circle cx="24" cy="35.5" r="2.4" fill="#d0303f"/><circle cx="32" cy="35.5" r="2" fill="#2ea860"/>` +
    `<circle cx="9" cy="13" r="2.2" fill="#f4f0ea" ${o(1)}/><circle cx="24" cy="8" r="2.2" fill="#f4f0ea" ${o(1)}/><circle cx="39" cy="13" r="2.2" fill="#f4f0ea" ${o(1)}/>` +
    hi('M12 30 L12 19 M24 28 L24 15', 0.45, 1.4),
  medal: sh(11, 45) +
    `<path d="M15 3 L22 19 H26 L33 3 H27 L24 10 L21 3 Z" fill="#a33" ${o(1.6)}/><path d="M21 3 L24 10 L27 3" fill="#1f3a6a"/>` +
    `<circle cx="24" cy="30" r="12" fill="#c9a227" ${o()}/><circle cx="24" cy="30" r="8.5" fill="#e8c040" stroke="#a87810" stroke-width="1.2"/>` +
    `<circle cx="24" cy="28.5" r="3.2" fill="#e8e2d0"/><path d="M21.5 33 L26.5 33 M20 35 L28 31 M20 31 L28 35" stroke="#e8e2d0" stroke-width="1.3"/>` +
    hi('M16 25 A9 9 0 0 1 20 21', 0.8, 1.5),
  skull: sh(12) +
    `<path d="M24 6 C35 6 39 14 38 22 C37.5 27 35 29 33 30 V36 H15 V30 C13 29 10.5 27 10 22 C9 14 13 6 24 6 Z" fill="#ece5d2" ${o()}/>` +
    `<path d="M30 8 C36 11 38 17 37 23 C36 27 34 29 33 30 V36 H28 C31 30 33 20 30 8 Z" fill="#000" opacity=".12"/>` +
    `<path d="M14.5 19 C15 15 21 15 21.5 19.5 C21.5 23.5 15 24 14.5 19 Z" fill="${K}"/><path d="M26.5 19.5 C27 15 33 15 33.5 19 C33 24 26.5 23.5 26.5 19.5 Z" fill="${K}"/>` +
    `<path d="M24 23 L22 27.5 H26 Z" fill="${K}"/>` +
    `<path d="M18 30 V36 M22 30 V36 M26 30 V36 M30 30 V36" stroke="${K}" stroke-width="1.2"/>` +
    `<path d="M15 41 L33 45 M33 41 L15 45" stroke="${K}" stroke-width="4" stroke-linecap="round"/><path d="M15 41 L33 45 M33 41 L15 45" stroke="#ece5d2" stroke-width="2.2" stroke-linecap="round"/>` +
    hi('M15 12 C17 9 20 8 23 8', 0.7, 1.6),
  map: sh(17) +
    `<path d="M5 11 L17 7 L30 11 L43 7 V37 L30 41 L17 37 L5 41 Z" fill="#ecd9a8" ${o()}/>` +
    `<path d="M17 7 V37 L30 41 V11 Z" fill="#d4bc84"/><path d="M17 7 V37 M30 11 V41" stroke="${K}" stroke-width="1" opacity=".5"/>` +
    `<path d="M9 30 C12 24 16 26 19 22 S27 20 29 25 S34 18 36 17" stroke="#7a4a20" stroke-width="1.4" fill="none" stroke-dasharray="2 2"/>` +
    `<path d="M33 13.5 L39 19.5 M39 13.5 L33 19.5" stroke="#b02a20" stroke-width="2.8" stroke-linecap="round"/>` +
    `<path d="M8 17 Q10 14 13 16 Q11 19 8 17 Z" fill="#7aa84a" opacity=".8"/>`,
  mappiece: sh(14) +
    `<path d="M8 8 L22 6 L25 10 L36 9 L40 20 L37 24 L40 30 L30 41 L19 38 L16 40 L9 35 L11 26 L7 20 Z" fill="#dcc48e" ${o()}/>` +
    `<path d="M14 14 Q20 20 18 28 Q24 32 30 30" stroke="#7a4a20" stroke-width="1.3" fill="none" stroke-dasharray="2 2"/>` +
    `<path d="M27 25 L33 31 M33 25 L27 31" stroke="#b02a20" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M33 12 L36 15 M30 14 l2 -1" stroke="#7a5a30" stroke-width="1" opacity=".7"/>`,
  bottle: sh(12) +
    `<rect x="20" y="3.5" width="8" height="6" rx="1.4" fill="#a0703a" ${o(1.6)}/>` +
    `<path d="M20.5 9.5 H27.5 V14 C33 16 34 20 34 25 V40 C34 42 32 43 30 43 H18 C16 43 14 42 14 40 V25 C14 20 15 16 20.5 14 Z" fill="#5ea898" fill-opacity=".72" ${o()}/>` +
    `<rect x="18" y="22" width="12" height="16" rx="1" fill="#f0e2bc" ${o(1)}/><path d="M18 22 Q16 30 18 38 M30 22 Q32 30 30 38" stroke="#c8b080" stroke-width="1.2" fill="none"/>` +
    `<path d="M20.5 26 H27.5 M20.5 29 H26 M20.5 32 H27" stroke="#7a5a30" stroke-width=".9"/><rect x="22" y="32" width="4" height="8" fill="#b02a20" opacity=".0"/>` +
    hi('M16.5 24 V38', 0.55, 1.6),
  journal: sh(14) +
    `<rect x="10" y="6" width="27" height="35" rx="2" fill="#6b3a1a" ${o()}/>` +
    `<rect x="35" y="8" width="4" height="31" fill="#efe0b8" ${o(1.2)}/>` +
    `<rect x="13" y="10" width="20" height="27" rx="1" fill="none" stroke="#c9a227" stroke-width="1.3"/>` +
    `<path d="M23.5 15 L27 22 L23.5 29 L20 22 Z" fill="#c9a227" ${o(1)}/>` +
    `<rect x="7" y="20" width="9" height="5" rx="1" fill="#4a2a10" ${o(1.3)}/><circle cx="9" cy="22.5" r="1.2" fill="#c9a227"/>` +
    hi('M12 8 V39', 0.3, 1.6),
  letter: sh(16) +
    `<rect x="6" y="12" width="36" height="25" rx="1.5" fill="#f2e4be" ${o()}/>` +
    `<path d="M6 12.5 L24 27 L42 12.5" stroke="${K}" stroke-width="1.6" fill="#e4d2a4"/>` +
    `<path d="M6 37 L19 24 M42 37 L29 24" stroke="#bfa878" stroke-width="1.2"/>` +
    `<path d="M24 22 C30 22 31 28 29 30 C30 33 26 35 24 33 C22 35 18 33 19 30 C17 28 18 22 24 22 Z" fill="#b02a20" ${o(1.4)}/>` +
    `<path d="M22 27 L24 29 L26.5 25.5" stroke="#ff9a8a" stroke-width="1.3" fill="none"/>`,
  hide: sh(15) +
    `<path d="M8 13 C12 8 17 10 18 13 C21 10 27 10 30 13 C31 10 36 8 40 13 C38 18 36 20 37 26 C38 32 41 35 38 39 C33 38 31 41 28 44 C26 41 22 41 20 44 C17 41 15 38 10 39 C7 35 10 32 11 26 C12 20 10 18 8 13 Z" fill="#94603a" ${o()}/>` +
    `<path d="M18 17 C22 15 26 15 30 17 C31 25 30 32 24 37 C18 32 17 25 18 17 Z" fill="#b07a4a" opacity=".85"/>` +
    `<path d="M20 22 l2 -1.5 M25 21 l2 1.5 M22 28 l1.6 -1.6 M26 29 l1.8 1.2 M21 33 l2 -1" stroke="#5a3418" stroke-width="1"/>`,
  fish: sh(16) +
    `<path d="M6 24 C13 12 30 11 37 24 C30 37 13 36 6 24 Z" fill="#5aa8d0" ${o()}/>` +
    `<path d="M37 24 L46 15 L44 24 L46 33 Z" fill="#5aa8d0" ${o()}/>` +
    `<path d="M8 25 C15 33 29 34 36 25 C29 30 15 30 8 25 Z" fill="#fff" opacity=".35"/>` +
    `<path d="M19 13.5 C23 9 27 10 29 14" fill="#5aa8d0" ${o(1.5)}/>` +
    `<path d="M20 18 Q22 24 20 30 M25 17 Q27 24 25 31 M30 18.5 Q31.5 24 30 29.5" stroke="${K}" stroke-width=".9" fill="none" opacity=".35"/>` +
    `<circle cx="13" cy="22" r="2.6" fill="#fff" ${o(1)}/><circle cx="13.4" cy="22" r="1.2" fill="${K}"/>` + hi('M11 18 C15 15 21 14 26 15', 0.5, 1.4),
  chest: sh(17) +
    `<rect x="6" y="21" width="36" height="20" rx="1.5" fill="#8a5a32" ${o()}/>` +
    `<path d="M6 21 C6 11 13 8 24 8 C35 8 42 11 42 21 Z" fill="#6b4224" ${o()}/>` +
    `<path d="M6 21 H42" stroke="${K}" stroke-width="2"/>` +
    `<rect x="11" y="8.5" width="4" height="32" fill="#c9a227" ${o(1.2)}/><rect x="33" y="8.5" width="4" height="32" fill="#c9a227" ${o(1.2)}/>` +
    `<rect x="20" y="18" width="8" height="9" rx="1.5" fill="#e8c040" ${o(1.4)}/><circle cx="24" cy="22" r="1.4" fill="${K}"/><path d="M24 22 V25" stroke="${K}" stroke-width="1.2"/>` +
    `<path d="M9 28 H40 M9 34 H40" stroke="#5a3418" stroke-width="1" opacity=".6"/>` + hi('M9 18 C10 13 15 11 21 10.5', 0.4, 1.6),
  shell: sh(14) +
    `<path d="M24 41 L12 35 C5 28 6 15 15 10 C20 7 28 7 33 10 C42 15 43 28 36 35 Z" fill="#f0b8a0" ${o()}/>` +
    `<path d="M24 41 L14 13 M24 41 L19 9.5 M24 41 L24 8.5 M24 41 L29 9.5 M24 41 L34 13 M24 41 L9 22 M24 41 L39 22" stroke="#c87a68" stroke-width="1.4"/>` +
    `<path d="M18 40 L24 44 L30 40 L28 37 H20 Z" fill="#e8a088" ${o(1.5)}/>` + hi('M12 16 C15 12 19 10 23 10', 0.6, 1.6),
  oyster: sh(15) +
    `<path d="M5 28 C6 20 16 15 24 15 C33 15 42 20 43 28 C38 26 30 25 24 25 C17 25 10 26 5 28 Z" fill="#8a8a7a" ${o()}/>` +
    `<path d="M5 28 C8 37 17 40 24 40 C31 40 40 37 43 28 C37 31 30 32 24 32 C17 32 10 31 5 28 Z" fill="#a8a898" ${o()}/>` +
    `<path d="M9 29 C15 32 33 32 39 29 C35 27 13 27 9 29 Z" fill="#e8dcd8"/>` +
    `<circle cx="24" cy="28.5" r="3.6" fill="#f8f4ee" ${o(1)}/><circle cx="22.8" cy="27.3" r="1.2" fill="#fff"/>` +
    `<path d="M12 20 C16 18 20 17 24 17 M14 37 C18 38 22 38.5 26 38.5" stroke="#5a5a4a" stroke-width="1" fill="none" opacity=".6"/>`,
  spice: sh(13) +
    `<path d="M14 18 C10 26 10 38 16 42 H32 C38 38 38 26 34 18 Z" fill="#c8963a" ${o()}/>` +
    `<path d="M15 18 C18 14 30 14 33 18 C30 20 18 20 15 18 Z" fill="#d84a1a" ${o(1.4)}/>` +
    `<path d="M14 18 C16 11 21 8 24 13 C27 8 32 11 34 18" fill="none" ${o(1.6)}/>` +
    `<path d="M16 22 C20 23 28 23 32 22" stroke="#7a5220" stroke-width="2.2"/>` +
    `<path d="M12 9 l3 3 M36 9 l-3 3 M24 6 v3" stroke="#e8a020" stroke-width="1.4" stroke-linecap="round"/>` + hi('M15 27 C15 33 16 37 18 39', 0.4, 1.6),
  silk: sh(16) +
    `<path d="M6 30 C6 22 12 18 18 18 H38 C42 18 44 22 44 26 C44 32 40 36 34 36 H14 C9 36 6 34 6 30 Z" fill="#b03a7a" ${o()}/>` +
    `<ellipse cx="13" cy="27" rx="6.5" ry="8.5" fill="#d05a9a" ${o(1.6)}/><ellipse cx="13" cy="27" rx="2.4" ry="3.4" fill="#7a1a4a"/>` +
    `<path d="M20 18.5 C26 22 32 22 40 19 M20 35.5 C27 32 34 32 42 32" stroke="#ff9ad0" stroke-width="1.2" fill="none" opacity=".8"/>` +
    `<path d="M30 36 L34 44 L38 37" fill="#e8c040" ${o(1.3)}/>`,
  // av ürünleri
  meat: sh(15) +
    `<path d="M10 26 C8 16 18 9 28 11 C38 13 42 22 38 30 C35 37 26 40 18 37 C13 35 11 31 10 26 Z" fill="#c8434a" ${o()}/>` +
    `<path d="M14 26 C14 19 21 14 28 15 C35 16 37 23 34 28" stroke="#f0b0a8" stroke-width="2.4" fill="none" opacity=".8"/>` +
    `<ellipse cx="25" cy="25" rx="5" ry="4" fill="#ece0c8" ${o(1.4)}/><circle cx="25" cy="25" r="1.6" fill="#c8a080"/>` +
    hi('M15 20 C17 16 21 14 25 13.5', 0.5, 1.6),
  cookedmeat: sh(14) +
    line('M29 29 L39 39', '#efe6d6', 3.6) +
    `<circle cx="41" cy="37" r="3" fill="#efe6d6" ${o(1.4)}/><circle cx="37" cy="41.5" r="3" fill="#efe6d6" ${o(1.4)}/>` +
    `<path d="M8 20 C8 11 17 6 25 9 C33 12 36 22 32 29 C28 35 19 36 13 32 C9 29 8 25 8 20 Z" fill="#9a5a22" ${o()}/>` +
    `<path d="M12 22 C12 15 18 11 24 12" stroke="#d08a40" stroke-width="2.4" fill="none" opacity=".8"/>` +
    hi('M14 16 C16 13 19 11 22 11', 0.45, 1.6),
  fang: sh(10) +
    `<path d="M16 8 C22 6 30 6 34 9 C33 20 29 32 24 42 C19 32 16 20 16 8 Z" fill="#f2ecd8" ${o()}/>` +
    `<path d="M16 8 C22 10 28 10 34 9" stroke="#c8b890" stroke-width="1.6" fill="none"/>` + hi('M20 12 C21 20 22 28 24 36', 0.6, 1.4),
  antler: sh(15) +
    line('M12 42 C14 30 18 22 26 14', '#c8a070', 3.4) + line('M17 30 C11 26 8 20 8 14', '#c8a070', 2.6) +
    line('M22 21 C24 14 22 8 20 5', '#c8a070', 2.4) + line('M26 14 C32 12 36 8 38 4', '#c8a070', 2.4) + line('M24 17 C30 18 36 16 41 12', '#c8a070', 2.2),
  feather: sh(10) +
    `<path d="M36 6 C22 10 12 24 12 38 C24 36 36 24 36 6 Z" fill="#2ea860" ${o()}/>` +
    `<path d="M36 6 C30 14 24 24 20 32" stroke="#e8c020" stroke-width="2" fill="none"/>` +
    `<path d="M20 30 C24 31 28 29 31 26 M23 23 C26 23 30 21 33 18" stroke="#d03030" stroke-width="1.6" fill="none"/>` +
    line('M20 32 L10 44', '#e8e0c0', 1.6),
  venom: sh(12) +
    `<path d="M24 10 C32 12 38 20 37 29 C36 37 30 42 24 42 C18 42 12 37 11 29 C10 20 16 12 24 10 Z" fill="#6aa040" ${o()}/>` +
    `<path d="M24 5 C26 9 28 12 28 15 C28 18 26 20 24 20 C22 20 20 18 20 15 C20 12 22 9 24 5 Z" fill="#a8f060" ${o(1.4)}/>` +
    hi('M16 26 C16 32 18 36 22 38', 0.45, 1.8) + `<circle cx="30" cy="30" r="2" fill="#2a4a10" opacity=".5"/>`,
  batwing: sh(16) +
    `<path d="M24 14 C18 8 10 8 4 14 C8 16 10 20 10 24 C13 22 16 22 18 24 C19 21 21 19 24 20 C27 19 29 21 30 24 C32 22 35 22 38 24 C38 20 40 16 44 14 C38 8 30 8 24 14 Z" fill="#3a2f3a" ${o()}/>` +
    hi('M8 13 C12 11 16 11 20 13', 0.35, 1.4),
  snakeskin: sh(15) +
    `<path d="M8 38 C4 30 10 24 18 26 C26 28 30 22 26 16 C23 11 28 6 34 8 C40 10 42 16 38 20 C35 23 33 18 35 16 C33 13 29 14 30 18 C33 26 28 34 19 32 C13 31 11 36 15 39 C12 42 9 41 8 38 Z" fill="#8a9a4a" ${o()}/>` +
    `<path d="M10 34 l2.4 -1.6 M14 29.5 l2.6 0.4 M20 28.6 l2.2 -1.4 M26 25 l1.2 -2.4 M28 19 l-0.6 -2.6 M30 12 l2.4 -1.2" stroke="#4e5a22" stroke-width="1.6"/>` +
    hi('M11 31 C14 27 20 28 24 26', 0.45, 1.4),
  fur: sh(15) +
    `<path d="M8 13 C12 8 17 10 18 13 C21 10 27 10 30 13 C31 10 36 8 40 13 C38 18 36 20 37 26 C38 32 41 35 38 39 C33 38 31 41 28 44 C26 41 22 41 20 44 C17 41 15 38 10 39 C7 35 10 32 11 26 C12 20 10 18 8 13 Z" fill="#eef3f8" ${o()}/>` +
    `<path d="M18 17 C22 15 26 15 30 17 C31 25 30 32 24 37 C18 32 17 25 18 17 Z" fill="#cfdbe6" opacity=".9"/>` +
    `<path d="M20 22 l2 -1.5 M25 21 l2 1.5 M22 28 l1.6 -1.6 M26 29 l1.8 1.2 M21 33 l2 -1 M14 18 l2 1 M33 18 l-2 1" stroke="#9aaabb" stroke-width="1"/>`,
  claw: sh(13) +
    `<path d="M10 34 C10 22 18 12 30 10 C38 9 42 14 40 20 C36 18 30 18 28 22 C34 22 38 26 36 32 C30 30 24 32 20 38 C16 40 11 39 10 34 Z" fill="#e0502a" ${o()}/>` +
    hi('M14 30 C15 22 20 16 27 13', 0.5, 1.6),
  // deniz ekipmanı
  harpoon: sh(15) +
    line('M7 43 L33 15', '#8a6238', 3.2) +
    `<path d="M30.5 13.5 L44 4 L34.5 17.5 Z" fill="#c4ccd4" ${o(1.6)}/>` +
    `<path d="M35.5 12.5 L32 8.5 L34.5 14.5 Z M37.5 15 L42 17.5 L36 16.5 Z" fill="#8a929a" ${o(1.1)}/>` +
    `<path d="M14 37 C6 35 7 26 14 28.5 C20 30.5 18.5 38.5 11.5 39.5" stroke="${K}" stroke-width="3.8" fill="none"/>` +
    `<path d="M14 37 C6 35 7 26 14 28.5 C20 30.5 18.5 38.5 11.5 39.5" stroke="#d8c08a" stroke-width="2" fill="none"/>` +
    hi('M10 39.5 L31 16.5', 0.35, 1.2),
  net: sh(17) +
    `<path d="M6 21 Q24 5 42 21 L36 40 Q24 46 12 40 Z" fill="#c8b48a" fill-opacity=".22" ${o()}/>` +
    `<path d="M9 28 Q24 19 39 28 M11 35 Q24 28 37 35 M17 12 L16 43 M24 9.5 V44.5 M31 12 L32 43" stroke="#e2d4ac" stroke-width="1.4" fill="none"/>` +
    [[6, 21], [42, 21], [12, 40], [36, 40], [24, 9.5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.1" fill="#d0602a" ${o(1.2)}/>`).join(''),
  mask: sh(16) +
    `<path d="M5 25 Q3 17 10 17 M43 25 Q45 17 38 17" stroke="${K}" stroke-width="4.4" fill="none"/><path d="M5 25 Q3 17 10 17 M43 25 Q45 17 38 17" stroke="#3a3a3a" stroke-width="2.4" fill="none"/>` +
    `<path d="M10 15 H38 Q42 15 42 20 V29 Q42 35 36 35 H30.5 Q27.5 35 26.5 32 L24 28.5 L21.5 32 Q20.5 35 17.5 35 H12 Q6 35 6 29 V20 Q6 15 10 15 Z" fill="#2a7ab0" ${o()}/>` +
    `<path d="M11 18.5 H37 Q39 18.5 39 21 V28 Q39 31.5 35.5 31.5 H31 L28 27.5 Q24 24.5 20 27.5 L17 31.5 H12.5 Q9 31.5 9 28 V21 Q9 18.5 11 18.5 Z" fill="#a8e2f4" opacity=".9"/>` +
    hi('M12.5 21.5 L18 21.5', 0.95, 1.7) + hi('M30 21.5 L34 21.5', 0.7, 1.4) +
    line('M40.5 7 V18', '#e8a030', 2.4),
  fins: sh(18) +
    `<path d="M9 9 Q14.5 5 19 9 L23 37 Q17 44.5 7 42 Q3.5 25 9 9 Z" fill="#e8c020" ${o()}/>` +
    `<path d="M29 9 Q34.5 5 39 9 L43 37 Q37 44.5 27 42 Q23.5 25 29 9 Z" fill="#e8c020" ${o()}/>` +
    `<path d="M13 18 L12.5 40 M17 17 L18.5 39.5 M33 18 L32.5 40 M37 17 L38.5 39.5" stroke="#a88010" stroke-width="1.3"/>` +
    `<path d="M9.5 10.5 Q14 16.5 18.5 10.5 Z M29.5 10.5 Q34 16.5 38.5 10.5 Z" fill="#2a2a2a"/>`,
  airbag: sh(12) +
    `<path d="M24 13 C33 13 38 22 38 30 C38 38.5 32 43 24 43 C16 43 10 38.5 10 30 C10 22 15 13 24 13 Z" fill="#9a6a3a" ${o()}/>` +
    `<rect x="20" y="6.5" width="8" height="7" rx="1.5" fill="#5a3a1a" ${o(1.4)}/>` +
    `<path d="M17.5 14.5 Q24 18 30.5 14.5" stroke="#5a3a1a" stroke-width="2.2" fill="none"/>` +
    `<circle cx="36" cy="10" r="3.2" fill="#bfe8ff" ${o(1.2)}/><circle cx="41.5" cy="4.8" r="2" fill="#bfe8ff" ${o(1)}/>` +
    hi('M15 25 C14.5 31 16.5 36 20 38.5', 0.4, 1.8),
};
