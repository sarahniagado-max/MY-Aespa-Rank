const PERSONAL_KEY = 'aespa_personal_data';
const FAVORITES_KEY = 'aespa_favorites';

export function getPersonalData() {
  try { return JSON.parse(localStorage.getItem(PERSONAL_KEY) || '{}'); } catch { return {}; }
}

export function savePersonalEntry(title, data) {
  const all = getPersonalData();
  all[title] = { ...(all[title] || {}), ...data };
  localStorage.setItem(PERSONAL_KEY, JSON.stringify(all));
}

export function getPersonalEntry(title) {
  return getPersonalData()[title] || {};
}

export function getFavorites() {
  try { return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')); } catch { return new Set(); }
}

export function isFavorite(title) {
  return getFavorites().has(title);
}

export function toggleFavorite(title) {
  const favs = getFavorites();
  if (favs.has(title)) { favs.delete(title); } else { favs.add(title); }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs]));
  return favs.has(title);
}