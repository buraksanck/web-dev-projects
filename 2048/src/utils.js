export function range(n) {
  return Array.from({ length: n }, (_, i) => i);
}

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function deepClone(state) {
  return state.map(row => row.slice());
}

export function gridSizeToPixels(size) {
  const tileSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tile-size')) || 100;
  const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--board-gap')) || 12;
  return size * tileSize + (size + 1) * gap;
}


