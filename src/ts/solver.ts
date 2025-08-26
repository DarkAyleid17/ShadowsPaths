import { Algorithm } from './types';
import { neighbors } from './mazeGenerator';

export function solve({
  algorithm,
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
  disableControls,
  speedValue
}: {
  algorithm: Algorithm;
  walls: any[];
  visited: boolean[];
  frontier: boolean[];
  parent: number[];
  start: { r: number; c: number };
  goal: { r: number; c: number };
  COLS: number;
  ROWS: number;
  inBounds: (r: number, c: number) => boolean;
  idx: (r: number, c: number) => number;
  redraw: () => void;
  animatePath: (seq: number[]) => void;
  cancelAnimation: () => void;
  disableControls: (flag: boolean) => void;
  speedValue: string;
}): void {
  visited.fill(false);
  frontier.fill(false);
  parent.fill(-1);
  
  const startU = idx(start.r, start.c);
  const goalU = idx(goal.r, goal.c);

  const queue = [startU];
  visited[startU] = true;
  frontier[startU] = false;

  let found = false;
  const delay = 1000 / clamp(parseInt(speedValue, 10) || 60, 1, 120);

  let stepTimer = setInterval(() => {
    if (!queue.length) {
      // no more to explore → no solution
      cancelAnimation();
      redraw();
      alert('No solution possible');
      return;
    }

    const u = algorithm === 'bfs' ? queue.shift()! : queue.pop()!;

    for (const v of neighbors(u, walls, COLS, inBounds, idx)) {
      if (!visited[v]) {
        visited[v] = true;
        parent[v] = u;
        queue.push(v);
        frontier[v] = true;
      }
    }
    frontier[u] = false;

    if (u === goalU && !found) {
      found = true;
      // backtrack path
      let cur = u;
      const seq = [];
      while (cur !== -1) {
        seq.push(cur);
        cur = parent[cur];
      }
      seq.reverse();

      clearInterval(stepTimer);
      // animate final path then dots
      animatePath(seq);
      return;
    }
    redraw();
  }, delay);
}

function clamp(n: number, lo: number, hi: number): number { 
  return Math.max(lo, Math.min(hi, n)); 
}