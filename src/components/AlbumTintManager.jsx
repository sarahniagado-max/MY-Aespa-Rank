/**
 * Manages the album color tint — sets a CSS variable on :root
 * that subtly tints the entire app background.
 */
import { useState, useEffect } from 'react';

export const TINT_MODE_KEY = 'aespa_tint_mode';
export const TINT_BRIGHTNESS_MODE_KEY = 'aespa_tint_brightness_mode';

export function getTintMode() {
  try { return localStorage.getItem(TINT_MODE_KEY) || 'aurora'; } catch { return 'aurora'; }
}

export function setTintMode(mode) {
  try { localStorage.setItem(TINT_MODE_KEY, mode); } catch {}
  window.dispatchEvent(new CustomEvent('albumTintModeChange', { detail: { mode } }));
}

export function getTintBrightnessMode() {
  try { return localStorage.getItem(TINT_BRIGHTNESS_MODE_KEY) || 'normal'; } catch { return 'normal'; }
}

export function setTintBrightnessMode(mode) {
  try { localStorage.setItem(TINT_BRIGHTNESS_MODE_KEY, mode); } catch {}
  window.dispatchEvent(new CustomEvent('albumTintBrightnessModeChange', { detail: { mode } }));
}

export function applyAlbumTint(hexColor, mode = 'normal') {
  if (!hexColor || typeof hexColor !== 'string' || !hexColor.startsWith('#')) {
    document.documentElement.style.removeProperty('--album-bg-r');
    document.documentElement.style.removeProperty('--album-bg-g');
    document.documentElement.style.removeProperty('--album-bg-b');
    return;
  }
  let r = parseInt(hexColor.slice(1, 3), 16);
  let g = parseInt(hexColor.slice(3, 5), 16);
  let b = parseInt(hexColor.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return;
  if (mode === 'boost') {
    r = Math.min(255, Math.round(r * 1.6));
    g = Math.min(255, Math.round(g * 1.6));
    b = Math.min(255, Math.round(b * 1.6));
  }
  document.documentElement.style.setProperty('--album-bg-r', String(r));
  document.documentElement.style.setProperty('--album-bg-g', String(g));
  document.documentElement.style.setProperty('--album-bg-b', String(b));
}

export function clearAlbumTint() {
  document.documentElement.style.removeProperty('--album-bg-r');
  document.documentElement.style.removeProperty('--album-bg-g');
  document.documentElement.style.removeProperty('--album-bg-b');
}

export function useTintMode() {
  const [mode, setMode] = useState(getTintMode);
  useEffect(() => {
    const handler = (e) => setMode(e.detail?.mode || 'aurora');
    window.addEventListener('albumTintModeChange', handler);
    return () => window.removeEventListener('albumTintModeChange', handler);
  }, []);
  return mode;
}

export function useTintBrightnessMode() {
  const [mode, setMode] = useState(getTintBrightnessMode);
  useEffect(() => {
    const handler = (e) => setMode(e.detail?.mode || 'normal');
    window.addEventListener('albumTintBrightnessModeChange', handler);
    return () => window.removeEventListener('albumTintBrightnessModeChange', handler);
  }, []);
  return mode;
}
