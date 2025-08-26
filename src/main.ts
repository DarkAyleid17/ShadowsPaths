import { animatePath, cancelAnimation, COLS, frontier, goal, idx, inBounds, path, player, redraw, resizeCanvas, ROWS, RUNNING, start, visited, walls, parent, SetRows, SetCols, SetWalls, SetFrontier, SetParent, SetPath, SetStart, SetVisited, SetPlayer, SetRunning, SetGoal } from './render';
import { initGrid, generateMaze } from './mazeGenerator';
import { solve } from './solver';
import { disableControls, tryMove, setupEventListeners } from './controls';
import { clamp } from './utils';

// Elementi DOM
export const canvas = document.getElementById('maze') as HTMLCanvasElement;
export const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
export const dimensionsInput = document.getElementById('dimensions') as HTMLInputElement;
export const algoSelect = document.getElementById('algo') as HTMLSelectElement;
export const speedRange = document.getElementById('speed') as HTMLInputElement;
export const btnNew = document.getElementById('New') as HTMLButtonElement;
export const btnSolve = document.getElementById('Solve') as HTMLButtonElement;
export const btnReset = document.getElementById('Reset') as HTMLButtonElement;

function onNewMaze(): void {
  cancelAnimation();
  SetRows(SetCols(clamp(parseInt(dimensionsInput.value, 10) || 25, 5, 40)));
  SetWalls(generateMaze(ROWS, COLS, inBounds, idx));
  const gridState = initGrid(ROWS, COLS);
  SetVisited(gridState.visited);
  SetFrontier(gridState.frontier);
  SetParent(gridState.parent);
  SetPath(gridState.path);
  SetStart(gridState.start);
  SetGoal(gridState.goal);
  SetPlayer(gridState.player);
  redraw();
  canvas.focus();
}

function onReset(): void {
  cancelAnimation();
  SetPlayer({ r: 0, c: 0 });
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

function onSolve(): void {
  cancelAnimation();
  redraw();
  SetRunning(true);
  disableControls([btnNew, btnSolve, btnReset, dimensionsInput, algoSelect], true);
  solve({
    algorithm: algoSelect.value as 'bfs' | 'dfs',
    walls,
    visited,
    frontier,
    parent,
    start,
    goal,
    COLS,
    inBounds,
    idx,
    redraw,
    animatePath,
    cancelAnimation,
    speedValue: speedRange.value
  });
}

// Setup event listeners
setupEventListeners({
  btnNew,
  btnSolve,
  btnReset,
  speedRange,
  canvas,
  onNewMaze,
  onSolve,
  onReset,
  onSpeedChange,
  onMove
});

// Avvio iniziale
resizeCanvas();
onNewMaze();
setTimeout(() => canvas.focus(), 100);