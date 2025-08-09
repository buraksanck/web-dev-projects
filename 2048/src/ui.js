import { VALUE_TO_CLASS } from './config.js';

export function createBoard(size) {
  const board = document.getElementById('board');
  board.innerHTML = '';
  board.style.gridTemplateColumns = `repeat(${size}, var(--tile-size))`;
  board.style.gridTemplateRows = `repeat(${size}, var(--tile-size))`;
  for (let i = 0; i < size * size; i++) {
    const c = document.createElement('div');
    c.className = 'cell';
    board.appendChild(c);
  }

  const tiles = document.getElementById('tiles');
  tiles.innerHTML = '';
  tiles.style.gridTemplateColumns = `repeat(${size}, var(--tile-size))`;
  tiles.style.gridTemplateRows = `repeat(${size}, var(--tile-size))`;
}

export function clearTiles() {
  const tiles = document.getElementById('tiles');
  tiles.innerHTML = '';
}

export function drawTiles(grid) {
  const tiles = document.getElementById('tiles');
  tiles.innerHTML = '';
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid.length; c++) {
      const v = grid[r][c];
      if (!v) continue;
      const el = document.createElement('div');
      el.className = `tile ${VALUE_TO_CLASS(v)}`;
      el.textContent = v;
      el.style.gridColumnStart = c + 1;
      el.style.gridRowStart = r + 1;
      tiles.appendChild(el);
    }
  }
}

export function animateMoves(moves) {
  const tiles = document.getElementById('tiles');
  for (const m of moves) {
    const el = document.createElement('div');
    el.className = `tile ${VALUE_TO_CLASS(m.value)} ${m.type || ''}`;
    el.textContent = m.value;
    el.style.gridColumnStart = (m.to.c) + 1;
    el.style.gridRowStart = (m.to.r) + 1;
    tiles.appendChild(el);
  }
}

export function showOverlay(title, score, visible) {
  const overlay = document.getElementById('overlay');
  const t = document.getElementById('overlayTitle');
  const s = document.getElementById('overlayScore');
  if (!visible) {
    overlay.classList.add('hidden');
    return;
  }
  t.textContent = title;
  s.textContent = `Skor: ${score}`;
  overlay.classList.remove('hidden');
}

export function updateScore(score, best) {
  document.getElementById('score').textContent = String(score);
  document.getElementById('best').textContent = String(best);
}


