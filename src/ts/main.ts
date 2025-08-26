import { Wall, Point, PADDING } from './types';
import { initCanvas, resizeCanvas, computeCell, clearBoard, drawGrid, drawWalls, fillCell, Cell } from './render';
import { initGrid, generateMaze, neighbors } from './mazeGenerator';
import { solve } from './solver';
import { disableControls, tryMove, setupEventListeners } from './controls';

// Elementi DOM
const canvas = document.getElementById('maze') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

const colsInput = document.getElementById('cols') as HTMLInputElement;
const rowsInput = document.getElementById('rows') as HTMLInputElement;
const algoSelect = document.getElementById('algo') as HTMLSelectElement;
const speedRange = document.getElementById('speed') as HTMLInputElement;
const btnNew = document.getElementById('New') as HTMLButtonElement;
const btnSolve = document.getElementById('Solve') as HTMLButtonElement;
const btnReset = document.getElementById('Reset') as HTMLButtonElement;

// Variabili di stato
let COLS: number; 
let ROWS: number; 
// let CELL: number; // Rimosso perché importato da render.ts
let walls: Wall[];
let visited: boolean[]; 
let frontier: boolean[]; 
let parent: number[]; 
let path: number[];
let start: Point; 
let goal: Point; 
let player: Point;
let RUNNING = false; 
let stepTimer: number | undefined;

// Funzioni helper
const idx = (r: number, c: number) => r * COLS + c;
const inBounds = (r: number, c: number) => r >= 0 && c >= 0 && r < ROWS && c < COLS;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// Funzioni di rendering
function drawVisitedFrontier(): void {
  for (let i = 0; i < ROWS * COLS; i++) {
    if (visited[i]) {
      const r = Math.floor(i / COLS), c = i % COLS;
      fillCell(r, c, getComputedStyle(document.documentElement).getPropertyValue('--visited'));
    } else if (frontier[i]) {
      const r = Math.floor(i / COLS), c = i % COLS;
      fillCell(r, c, getComputedStyle(document.documentElement).getPropertyValue('--frontier'));
    }
  }
}

function drawPathOverlay(): void {
  for (const u of path) {
    const r = Math.floor(u / COLS), c = u % COLS;
    fillCell(r, c, getComputedStyle(document.documentElement).getPropertyValue('--path'));
  }
}

function drawStartGoalPlayer(): void {
  // start & goal
  fillCell(start.r, start.c, getComputedStyle(document.documentElement).getPropertyValue('--start'));
  fillCell(goal.r, goal.c, getComputedStyle(document.documentElement).getPropertyValue('--goal'));

  // player
  const x = PADDING + player.c * Cell() + Cell() / 2;
  const y = PADDING + player.r * Cell() + Cell() / 2;
  const r = Math.max(3, Math.min(14, Cell() * 0.3));
  ctx.save();
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--player');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

function drawSolutionDots(seq: number[]): void {
  ctx.save();
  ctx.fillStyle = '#000';
  for (const u of seq) {
    const r = Math.floor(u / COLS), c = u % COLS;
    const x = PADDING + c * Cell() + Cell() / 2;
    const y = PADDING + r * Cell() + Cell() / 2;
    const rad = Math.max(2, Cell() * 0.1);
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function redraw(): void {
  resizeCanvas();
  computeCell(COLS, ROWS);
  clearBoard();
  drawGrid(COLS, ROWS);
  drawVisitedFrontier();
  drawPathOverlay();
  drawWalls(walls, COLS, ROWS, idx);
  drawStartGoalPlayer();
}

function cancelAnimation(): void {
  if (stepTimer) clearInterval(stepTimer);
  stepTimer = undefined;
  RUNNING = false;
  disableControls([btnNew, btnSolve, btnReset, colsInput, rowsInput, algoSelect], false);
}

function animatePath(seq: number[]): void {
  let i = 0;
  const delay = Math.max(20, 1000 / clamp(parseInt(speedRange.value, 10) || 60, 1, 120));
  stepTimer = window.setInterval(() => {
    if (i < seq.length) {
      path = seq.slice(0, i + 1);
      redraw();
      i++;
    } else {
      clearInterval(stepTimer);
      stepTimer = undefined;
      RUNNING = false;
      disableControls([btnNew, btnSolve, btnReset, colsInput, rowsInput, algoSelect], false);
      redraw();
      drawSolutionDots(seq);
    }
  }, delay);
}

// Gestori di eventi
function onNewMaze(): void {
  cancelAnimation();
  COLS = clamp(parseInt(colsInput.value, 10) || 25, 5, 120);
  ROWS = clamp(parseInt(rowsInput.value, 10) || 25, 5, 120);
  walls = generateMaze(ROWS, COLS, inBounds, idx);
  const gridState = initGrid(ROWS, COLS);
  visited = gridState.visited;
  frontier = gridState.frontier;
  parent = gridState.parent;
  path = gridState.path;
  start = gridState.start;
  goal = gridState.goal;
  player = gridState.player;
  redraw();
  canvas.focus();
}

function onSolve(): void {
  cancelAnimation();
  redraw();
  RUNNING = true;
  disableControls([btnNew, btnSolve, btnReset, colsInput, rowsInput, algoSelect], true);
  solve({
    algorithm: algoSelect.value as 'bfs' | 'dfs',
    walls,
    visited,
    frontier,
    parent,
    start,
    goal,
    COLS,
    ROWS,
    inBounds,
    idx,
    redraw,
    animatePath,
    cancelAnimation,
    disableControls: (flag) => disableControls([btnNew, btnSolve, btnReset, colsInput, rowsInput, algoSelect], flag),
    speedValue: speedRange.value
  });
}

function onReset(): void {
  cancelAnimation();
  player = { r: 0, c: 0 };
  redraw();
  canvas.focus();
}

function onSpeedChange(): void {
  if (RUNNING) {
    cancelAnimation();
    // re-solve or reanimate depending on state
    if (path.length) animatePath(path.slice());
    else onSolve();
  }
}

function onMove(dr: number, dc: number): void {
  if (RUNNING) return;
  tryMove({
    player,
    walls,
    COLS,
    dr,
    dc,
    inBounds,
    idx,
    redraw,
    goal
  });
}

// Inizializzazione
initCanvas(canvas);

// Setup event listeners
setupEventListeners({
  btnNew,
  btnSolve,
  btnReset,
  colsInput,
  rowsInput,
  algoSelect,
  speedRange,
  canvas,
  onNewMaze,
  onSolve,
  onReset,
  onSpeedChange,
  onMove
});

// Avvio iniziale
onNewMaze();
setTimeout(() => canvas.focus(), 100);