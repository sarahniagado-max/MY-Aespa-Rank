/**
 * Manages the album color tint — sets a CSS variable on :root
 * that subtly tints the entire app background.
 */

export const TINT_MODE_KEY = 'aespa_tint_mode';

export function getTintMode() {
  try { return localStorage.getItem(TINT_MODE_KEY) || 'aurora'; } catch { return 'aurora'; }
}

export function setTintMode(mode) {
  try { localStorage.setItem(TINT_MODE_KEY, mode); } catch {}
  window.dispatchEvent(new CustomEvent('albumTintModeChange', { detail: { mode } }));
}

export function applyAlbumTint(hexColor) {
  if (!hexColor || typeof hexColor !== 'string' || !hexColor.startsWith('#')) {
    document.documentElement.style.removeProperty('--album-bg-r');
    document.documentElement.style.removeProperty('--album-bg-g');
    document.documentElement.style.removeProperty('--album-bg-b');
    return;
  }
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return;
  document.documentElement.style.setProperty('--album-bg-r', String(r));
  document.documentElement.style.setProperty('--album-bg-g', String(g));
  document.documentElement.style.setProperty('--album-bg-b', String(b));
}

export function clearAlbumTint() {
  document.documentElement.style.removeProperty('--album-bg-r');
  document.documentElement.style.removeProperty('--album-bg-g');
  document.documentElement.style.removeProperty('--album-bg-b');
}