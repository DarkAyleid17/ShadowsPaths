import { Wall, Point, PADDING } from './types';

// Variabili di rendering
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;let CELL: number;
let WALL_W: number = 2;



export function Cell(): number {
  return CELL;
}
// Funzioni di rendering
export function initCanvas(canvasElement: HTMLCanvasElement): void {
  canvas = canvasElement;
  ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  resizeCanvas();
}

export function resizeCanvas(): void {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const dw = Math.floor(rect.width * dpr);
  const dh = Math.floor(rect.height * dpr);
  if (canvas.width !== dw || canvas.height !== dh) {
    canvas.width = dw;
    canvas.height = dh;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function computeCell(COLS: number, ROWS: number): number {
  const side = Math.min(canvas.clientWidth, canvas.clientHeight) - 2 * PADDING;
  const maxG = Math.max(COLS, ROWS);
  CELL = Math.max(6, Math.floor(side / maxG));
  WALL_W = Math.max(1, Math.floor(CELL * 0.12));
  return CELL;
}

// Funzioni di disegno
export function clearBoard(): void {
  ctx.fillStyle = '#0b0f20';
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}

export function drawGrid(COLS: number, ROWS: number): void {
  const ox = PADDING, oy = PADDING;
  ctx.save();
  ctx.strokeStyle = '#1b2144';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let r = 0; r <= ROWS; r++) {
    const y = oy + r * CELL + .5;
    ctx.moveTo(ox, y);
    ctx.lineTo(ox + COLS * CELL, y);
  }
  for (let c = 0; c <= COLS; c++) {
    const x = ox + c * CELL + .5;
    ctx.moveTo(x, oy);
    ctx.lineTo(x, oy + ROWS * CELL);
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
      const x = PADDING + c * CELL, y = PADDING + r * CELL;
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
    PADDING + c * CELL + WALL_W,
    PADDING + r * CELL + WALL_W,
    CELL - 2 * WALL_W,
    CELL - 2 * WALL_W
  );
}