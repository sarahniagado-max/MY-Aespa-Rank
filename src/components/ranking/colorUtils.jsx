export function hexToRgb(hex) {
  if (!hex || hex.length < 7) return { r: 167, g: 139, b: 250 };
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

export function lerpColor(colors, t) {
  if (colors.length === 1) return colors[0];
  const scaled = t * (colors.length - 1);
  const i = Math.min(Math.floor(scaled), colors.length - 2);
  const f = scaled - i;
  const c1 = hexToRgb(colors[i]);
  const c2 = hexToRgb(colors[i + 1]);
  const r = Math.round(c1.r + f * (c2.r - c1.r));
  const g = Math.round(c1.g + f * (c2.g - c1.g));
  const b = Math.round(c1.b + f * (c2.b - c1.b));
  return rgbToHex(r, g, b);
}

export function getSongColor(colors, songIndex, totalSongs) {
  if (!colors || colors.length === 0) return '#a78bfa';
  const t = !totalSongs || totalSongs === 1 ? 0.5 : 0.15 + (songIndex / (totalSongs - 1)) * 0.7;
  return lerpColor(colors, t);
}

export function parseAlbumColors(lightstick_color) {
  if (!lightstick_color) return ['#a78bfa'];
  const parsed = lightstick_color.split(',').map(c => c.trim()).filter(c => /^#[0-9A-Fa-f]{6}$/.test(c));
  return parsed.length > 0 ? parsed : ['#a78bfa'];
}

// Get the mid-point color of an album's gradient (for album headers)
export function getAlbumMidColor(colors) {
  return lerpColor(colors, 0.5);
}