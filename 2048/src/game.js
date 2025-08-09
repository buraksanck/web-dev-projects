import { getRandomInt, deepClone, range } from './utils.js';
import { PROBABILITY_FOUR, START_TILES, TARGET_VALUE } from './config.js';

export function createEmptyGrid(size) {
  return range(size).map(() => range(size).map(() => 0));
}

export function getEmptyCells(grid) {
  const list = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid.length; c++) {
      if (grid[r][c] === 0) list.push({ r, c });
    }
  }
  return list;
}

export function addRandomTile(grid) {
  const empty = getEmptyCells(grid);
  if (empty.length === 0) return false;
  const { r, c } = empty[getRandomInt(empty.length)];
  grid[r][c] = Math.random() < PROBABILITY_FOUR ? 4 : 2;
  return true;
}

export function initialiseGame(size) {
  const grid = createEmptyGrid(size);
  for (let i = 0; i < START_TILES; i++) addRandomTile(grid);
  return { grid, score: 0, won: false, over: false };
}

function compactLine(line) {
  const nonZero = line.filter(v => v !== 0);
  const out = [];
  let gained = 0;
  let i = 0;
  while (i < nonZero.length) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      const sum = nonZero[i] * 2;
      out.push(sum);
      gained += sum;
      i += 2;
    } else {
      out.push(nonZero[i]);
      i += 1;
    }
  }
  while (out.length < line.length) out.push(0);
  return { line: out, gained };
}

function reflectHoriz(grid) {
  const n = grid.length;
  const res = createEmptyGrid(n);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) res[r][n - 1 - c] = grid[r][c];
  return res;
}

function transpose(grid) {
  const n = grid.length;
  const res = createEmptyGrid(n);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) res[c][r] = grid[r][c];
  return res;
}

export function canMove(grid) {
  if (getEmptyCells(grid).length) return true;
  const n = grid.length;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const v = grid[r][c];
      if (r + 1 < n && grid[r + 1][c] === v) return true;
      if (c + 1 < n && grid[r][c + 1] === v) return true;
    }
  }
  return false;
}

export function move(grid, direction) {
  const n = grid.length;
  let work = deepClone(grid);
  if (direction === 'right') work = reflectHoriz(work);
  if (direction === 'up') work = transpose(work);
  if (direction === 'down') work = transpose(reflectHoriz(work));

  let scoreGained = 0;
  for (let r = 0; r < n; r++) {
    const { line: compacted, gained } = compactLine(work[r]);
    work[r] = compacted;
    scoreGained += gained;
  }

  if (direction === 'right') work = reflectHoriz(work);
  if (direction === 'up') work = transpose(work);
  if (direction === 'down') work = reflectHoriz(transpose(work));

  let changed = false;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (work[r][c] !== grid[r][c]) { changed = true; break; }
  return { next: work, moved: changed, scoreGained };
}

export function checkWin(grid) {
  for (const row of grid) for (const v of row) if (v >= TARGET_VALUE) return true;
  return false;
}


