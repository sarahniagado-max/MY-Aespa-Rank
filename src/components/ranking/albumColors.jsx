// Album color system — derived from dominant cover colors
// Used consistently across Browse, Exclude, and Ranking screens

export const ALBUM_COLORS = {
  "Black Mamba":           { hex: "#8B1A1A", rgb: "139,26,26",   label: "Deep Red" },
  "Forever":               { hex: "#2D1B4E", rgb: "45,27,78",    label: "Deep Purple" },
  "Next Level":            { hex: "#1A3A5C", rgb: "26,58,92",    label: "Steel Blue" },
  "Savage":                { hex: "#4A1942", rgb: "74,25,66",    label: "Dark Magenta" },
  "Dreams Come True":      { hex: "#1A4A3A", rgb: "26,74,58",    label: "Forest Green" },
  "Girls":                 { hex: "#3D1A5C", rgb: "61,26,92",    label: "Royal Purple" },
  "Beautiful Christmas":   { hex: "#1A3D1A", rgb: "26,61,26",    label: "Christmas Green" },
  "Hold On Tight":         { hex: "#3D2A1A", rgb: "61,42,26",    label: "Warm Brown" },
  "MY WORLD":              { hex: "#1A2A5C", rgb: "26,42,92",    label: "Night Blue" },
  "We Go":                 { hex: "#2A3D1A", rgb: "42,61,26",    label: "Olive Green" },
  "Drama":                 { hex: "#5C1A2A", rgb: "92,26,42",    label: "Crimson" },
  "Jingle Bell Rock":      { hex: "#1A3D3D", rgb: "26,61,61",    label: "Teal" },
  "Regret of the Times":   { hex: "#2A2A3D", rgb: "42,42,61",    label: "Slate" },
  "Die Trying":            { hex: "#3D3D1A", rgb: "61,61,26",    label: "Olive" },
  "Armageddon":            { hex: "#5C3D1A", rgb: "92,61,26",    label: "Amber" },
  "Hot Mess":              { hex: "#1A5C3D", rgb: "26,92,61",    label: "Emerald" },
  "SYNK: PARALLEL LINE":   { hex: "#5C2A5C", rgb: "92,42,92",    label: "Deep Violet" },
  "Whiplash":              { hex: "#1A1A5C", rgb: "26,26,92",    label: "Indigo" },
  "Dirty Work":            { hex: "#5C1A1A", rgb: "92,26,26",    label: "Dark Red" },
  "Dark Arts":             { hex: "#2A1A1A", rgb: "42,26,26",    label: "Onyx" },
  "Rich Man":              { hex: "#3D2A5C", rgb: "61,42,92",    label: "Plum" },
  "SYNK: AEXIS LINE":      { hex: "#1A3D5C", rgb: "26,61,92",    label: "Ocean Blue" },
  "Keychain":              { hex: "#5C1A3D", rgb: "92,26,61",    label: "Rose Red" },
};

const USED_COLORS = new Set(Object.values(ALBUM_COLORS).map(c => c.hex.toLowerCase()));

export function getAlbumColor(albumName) {
  if (!albumName) return { hex: "#2A2A2A", rgb: "42,42,42", label: "Default" };
  // Check custom colors stored in localStorage
  const customColors = getCustomAlbumColors();
  if (customColors[albumName]) return customColors[albumName];
  return ALBUM_COLORS[albumName] || { hex: "#2A2A2A", rgb: "42,42,42", label: "Default" };
}

export function getCustomAlbumColors() {
  try {
    return JSON.parse(localStorage.getItem("aespa_custom_album_colors") || "{}");
  } catch { return {}; }
}

export function saveCustomAlbumColor(albumName, colorObj) {
  const existing = getCustomAlbumColors();
  existing[albumName] = colorObj;
  localStorage.setItem("aespa_custom_album_colors", JSON.stringify(existing));
}

export function isColorTaken(hex) {
  const h = hex.toLowerCase();
  if (USED_COLORS.has(h)) return true;
  const custom = getCustomAlbumColors();
  return Object.values(custom).some(c => c.hex.toLowerCase() === h);
}

export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export function getAlbumBorderStyle(albumName) {
  const color = getAlbumColor(albumName);
  return { borderLeft: `3px solid rgba(${color.rgb}, 0.7)` };
}

export function getAlbumBgStyle(albumName) {
  const color = getAlbumColor(albumName);
  return { backgroundColor: `rgba(${color.rgb}, 0.08)` };
}