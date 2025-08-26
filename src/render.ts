import { type Wall, type Point, PADDING } from './types';
import { disableControls } from './controls';
import { algoSelect, btnNew, btnReset, btnSolve, canvas, ctx, dimensionsInput, speedRange } from './main';
import { clamp } from './utils';

export const inBounds = (r: number, c: number) => r >= 0 && c >= 0 && r < ROWS && c < COLS;
export const idx = (r: number, c: number) => r * COLS + c;

// Variabili di rendering
export let CELL = 0;
export let WALL_W = 0;
export let COLS = 0;
export let ROWS = 0;
export let walls: Wall[] = [];
export let visited: boolean[] = [];
export let frontier: boolean[] = [];
export let path: number[] = [];
export let start: Point = { r: 0, c: 0 };
export let goal: Point = { r: 0, c: 0 };
export let player: Point = { r: 0, c: 0 };
export let stepTimer: number | undefined = undefined;
export let parent: number[] = [];
export let RUNNING = false;

export function SetRows(rows: number){
  ROWS = rows;
  return ROWS;
}
export function SetCols(cols: number){
  COLS = cols;
  return COLS;
}

export function SetWalls(walls_in: Wall[]) {
  walls = walls_in;
  return walls;
}

export function SetVisited(visited_in: boolean[]) {
  visited = visited_in;
  return visited;
}

export function SetFrontier(frontier_in: boolean[]) {
  frontier = frontier_in;
  return frontier;
}

export function SetPath(path_in: number[]) {
  path = path_in;
  return path;
}

export function SetStart(start_in: Point) {
  start = start_in;
  return start;
}

export function SetGoal(goal_in: Point) {
  goal = goal_in;
  return goal;
}

export function SetPlayer(player_in: Point) {
  player = player_in;
  return player;
}

export function SetParent(parent_in: number[]) {
  parent = parent_in;
  return parent;
}

export function SetRunning(running_in: boolean) {
  RUNNING = running_in;
  return RUNNING;
}

// Funzioni di rendering
export function drawVisitedFrontier(): void {
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

export function drawPathOverlay(): void {
  for (const u of path) {
    const r = Math.floor(u / COLS), c = u % COLS;
    fillCell(r, c, getComputedStyle(document.documentElement).getPropertyValue('--path'));
  }
}

export function drawStartGoalPlayer(): void {
  // start & goal
  fillCell(start.r, start.c, getComputedStyle(document.documentElement).getPropertyValue('--start'));
  fillCell(goal.r, goal.c, getComputedStyle(document.documentElement).getPropertyValue('--goal'));

  // player
  const x = PADDING * 2 + player.c * Cell() + Cell() / 2;
  const y = PADDING * 2 + player.r * Cell() + Cell() / 2;
  const r = Math.max(3, Math.min(14, Cell() * 0.3));
  ctx.save();
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--player');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

export function redraw(): void {
  resizeCanvas();
  computeCell(COLS, ROWS);
  clearBoard();
  drawGrid(COLS, ROWS);
  drawVisitedFrontier();
  drawPathOverlay();
  drawWalls(walls, COLS, ROWS, idx);
  drawStartGoalPlayer();
}

export function cancelAnimation(): void {
  if (stepTimer) clearInterval(stepTimer);
  stepTimer = undefined;
  RUNNING = false;
  disableControls([btnNew, btnSolve, btnReset, dimensionsInput, algoSelect], false);
}

export function animatePath(seq: number[]): void {
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
      disableControls([btnNew, btnSolve, btnReset, dimensionsInput, algoSelect], false);
      redraw();
      drawSolutionDots(seq, COLS);
    }
  }, delay);
}


export function Cell(): number {
  return CELL;
}

// Funzioni di rendering
export function resizeCanvas(): void {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const dw = Math.floor(rect.width * dpr);
  const dh = Math.floor(rect.height * dpr);
  canvas.width = dw;
  canvas.height = dh;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function computeCell(COLS: number, ROWS: number): number {
  const side = Math.min(canvas.clientWidth, canvas.clientHeight) - 2 * PADDING;
  const maxG = Math.max(COLS, ROWS);
  CELL = Math.max(6, Math.floor(side / maxG));
  WALL_W = Math.max(1, Math.floor(CELL * 0.125));
  return CELL;
}

// Funzioni di disegno
export function clearBoard(): void {
  ctx.fillStyle = '#0b0f20';
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}

export function drawGrid(COLS: number, ROWS: number): void {
  ctx.save();
  ctx.strokeStyle = '#1b2144';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let r = 0; r <= ROWS; r++) {
    const y = PADDING * 2 + r * CELL + .5;
    ctx.moveTo(PADDING * 2, y);
    ctx.lineTo(PADDING * 2 + COLS * CELL, y);
  }
  for (let c = 0; c <= COLS; c++) {
    const x = PADDING * 2 + c * CELL + .5;
    ctx.moveTo(x, PADDING * 2);
    ctx.lineTo(x, PADDING * 2 + ROWS * CELL);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawWalls(walls: Wall[], COLS: number, ROWS: number, idx: (r: number, c: number) => number): void {
  ctx.save();
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--wall');
  ctx.lineWidth = WALL_W;
  ctx.lineCap = 'square';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const u = idx(r, c);
      const x = PADDING * 2 + c * CELL;
      const y = PADDING * 2 + r * CELL;
      ctx.beginPath();
      if (walls[u].top) { ctx.moveTo(x, y); ctx.lineTo(x + CELL, y); }
      if (walls[u].left) { ctx.moveTo(x, y); ctx.lineTo(x, y + CELL); }
      if (r === ROWS - 1 && walls[u].bottom) {
        ctx.moveTo(x, y + CELL); ctx.lineTo(x + CELL, y + CELL);
      }
      if (c === COLS - 1 && walls[u].right) {
        ctx.moveTo(x + CELL, y); ctx.lineTo(x + CELL, y + CELL);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function fillCell(r: number, c: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(
    PADDING * 2 + c * CELL + WALL_W,
    PADDING * 2 + r * CELL + WALL_W,
    CELL - 2 * WALL_W,
    CELL - 2 * WALL_W
  );
}

export function drawSolutionDots(seq: number[], COLS: number): void {
  ctx.save();
  ctx.fillStyle = '#000';
  for (const u of seq) {
    const r = Math.floor(u / COLS), c = u % COLS;
    const x = PADDING * 2 + c * CELL + CELL / 2;
    const y = PADDING * 2 + r * CELL + CELL / 2;
    const rad = Math.max(2, CELL * 0.1);
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

