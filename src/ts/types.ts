// Definizioni di tipi e interfacce
export interface Wall {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

export interface Point {
  r: number;
  c: number;
}

export interface Edge {
  from: number;
  to: number;
  dir: string;
}

export type Algorithm = 'bfs' | 'dfs';

// Costanti esportate
export const PADDING = 16;