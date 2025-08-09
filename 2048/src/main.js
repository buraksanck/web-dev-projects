import { DEFAULT_SIZE } from './config.js';
import { createBoard, drawTiles, updateScore, showOverlay } from './ui.js';
import { bindKeyboard, bindTouch } from './input.js';
import { addRandomTile, initialiseGame, move, canMove, checkWin } from './game.js';
import { getBestScore, setBestScore, getSettings, setSettings } from './storage.js';

let size = DEFAULT_SIZE;
let state = { grid: [], score: 0, won: false, over: false };
let unbinders = [];

function setup(sizeArg) {
  size = sizeArg;
  setSettings({ size });
  createBoard(size);
  state = initialiseGame(size);
  drawTiles(state.grid);
  updateScore(state.score, getBestScore(size));
  showOverlay('', 0, false);
}

function start() {
  const settings = getSettings();
  setup(settings.size || DEFAULT_SIZE);
  bindInputs();
  document.getElementById('newGame').addEventListener('click', () => restart());
  document.getElementById('retry').addEventListener('click', () => restart());
  document.getElementById('keepPlaying').addEventListener('click', () => showOverlay('', 0, false));
  document.getElementById('sizeBtn').addEventListener('click', toggleSize);
  updateSizeButton();
}

function restart() {
  setup(size);
}

function toggleSize() {
  size = size === 4 ? 5 : size === 5 ? 6 : 4;
  restart();
  updateSizeButton();
}

function updateSizeButton() {
  const btn = document.getElementById('sizeBtn');
  btn.textContent = `${size}x${size}`;
}

function bindInputs() {
  unbinders.forEach(u => u());
  unbinders = [bindKeyboard(handleMove), bindTouch(handleMove)];
}

function handleMove(dir) {
  if (state.over) return;
  const { next, moved, scoreGained } = move(state.grid, dir);
  if (!moved) return;
  state.grid = next;
  state.score += scoreGained;
  setBestScore(size, state.score);
  addRandomTile(state.grid);
  drawTiles(state.grid);
  updateScore(state.score, getBestScore(size));
  if (!state.won && checkWin(state.grid)) {
    state.won = true;
    setBestScore(size, state.score);
    updateScore(state.score, getBestScore(size));
    showOverlay('Kazandın', state.score, true);
    return;
  }
  if (!canMove(state.grid)) {
    state.over = true;
    setBestScore(size, state.score);
    updateScore(state.score, getBestScore(size));
    showOverlay('Oyun Bitti', state.score, true);
  }
}

window.addEventListener('DOMContentLoaded', start);


