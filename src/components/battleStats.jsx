const BATTLE_RESULTS_KEY = 'aespa_battle_results';
const DECISION_TIMES_KEY = 'aespa_decision_times';

export function getBattleResults() {
  try { return JSON.parse(localStorage.getItem(BATTLE_RESULTS_KEY) || '{}'); } catch { return {}; }
}

export function setBattleResults(data) {
  localStorage.setItem(BATTLE_RESULTS_KEY, JSON.stringify(data));
}

export function recordBattleResult(winnerTitle, loserTitle) {
  if (!winnerTitle || !loserTitle) return;
  const results = getBattleResults();
  if (!results[winnerTitle]) results[winnerTitle] = { wins: 0, losses: 0, ties: 0 };
  if (!results[loserTitle]) results[loserTitle] = { wins: 0, losses: 0, ties: 0 };
  results[winnerTitle].wins = (results[winnerTitle].wins || 0) + 1;
  results[loserTitle].losses = (results[loserTitle].losses || 0) + 1;
  localStorage.setItem(BATTLE_RESULTS_KEY, JSON.stringify(results));
}

export function recordTieResult(titleA, titleB) {
  if (!titleA || !titleB) return;
  const results = getBattleResults();
  if (!results[titleA]) results[titleA] = { wins: 0, losses: 0, ties: 0 };
  if (!results[titleB]) results[titleB] = { wins: 0, losses: 0, ties: 0 };
  results[titleA].ties = (results[titleA].ties || 0) + 1;
  results[titleB].ties = (results[titleB].ties || 0) + 1;
  localStorage.setItem(BATTLE_RESULTS_KEY, JSON.stringify(results));
}

export function getDecisionTimes() {
  try { return JSON.parse(localStorage.getItem(DECISION_TIMES_KEY) || '[]'); } catch { return []; }
}

export function recordDecisionTime(winnerTitle, loserTitle, elapsedSec) {
  if (!winnerTitle || !loserTitle) return;
  if (elapsedSec == null || isNaN(elapsedSec) || elapsedSec > 60 || elapsedSec < 0) return; // exclude outliers/null
  const times = getDecisionTimes();
  times.push({ winner: winnerTitle, loser: loserTitle, time: Math.round(elapsedSec * 10) / 10, at: Date.now() });
  localStorage.setItem(DECISION_TIMES_KEY, JSON.stringify(times.slice(-2000)));
}

export function getSongDecisionTimes(title) {
  return getDecisionTimes().filter(t => t.winner === title || t.loser === title).map(t => t.time);
}

export function getAvgDecisionTime(title) {
  const times = getSongDecisionTimes(title);
  if (!times.length) return null;
  return times.reduce((a, b) => a + b, 0) / times.length;
}