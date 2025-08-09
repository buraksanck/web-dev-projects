const BEST_KEY_PREFIX = 'game-2048-best-';
const SETTINGS_KEY_PREFIX = 'game-2048-settings-';

export function getBestScore(size) {
  const raw = localStorage.getItem(BEST_KEY_PREFIX + size);
  return raw ? Number(raw) : 0;
}

export function setBestScore(size, score) {
  const current = getBestScore(size);
  if (score > current) localStorage.setItem(BEST_KEY_PREFIX + size, String(score));
}

export function getSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY_PREFIX + 'v1');
  return raw ? JSON.parse(raw) : { size: 4 };
}

export function setSettings(settings) {
  localStorage.setItem(SETTINGS_KEY_PREFIX + 'v1', JSON.stringify(settings));
}


