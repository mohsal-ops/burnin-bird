export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface MazeCell {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
  isStart?: boolean;
  isGoal?: boolean;
}

export interface MazeSettings {
  cols: number;
  rows: number;
  cellSize: number;
  wallThickness: number;
  name: string;
  emoji: string;
  goalEmoji: string;
  timerSeconds: number;
}

export const mazeSettings: Record<Difficulty, MazeSettings> = {
  easy: { cols: 7, rows: 7, cellSize: 48, wallThickness: 3, name: "Easy", emoji: "🌟", goalEmoji: "🍗", timerSeconds: 60 },
  medium: { cols: 10, rows: 10, cellSize: 38, wallThickness: 3, name: "Medium", emoji: "⭐", goalEmoji: "🍔", timerSeconds: 120 },
  hard: { cols: 14, rows: 14, cellSize: 30, wallThickness: 2, name: "Hard", emoji: "🔥", goalEmoji: "🍟", timerSeconds: 240 },
  expert: { cols: 20, rows: 20, cellSize: 22, wallThickness: 2, name: "Expert", emoji: "💎", goalEmoji: "🥪", timerSeconds: 420 },
};

export function generateMaze(rows: number, cols: number): MazeCell[][] {
  const cells: MazeCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      top: true, right: true, bottom: true, left: true,
    }))
  );

  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const stack: [number, number][] = [[0, 0]];
  visited[0][0] = true;

  type Wall = "top" | "bottom" | "left" | "right";
  const dirs: [number, number, Wall, Wall][] = [
    [-1, 0, "top", "bottom"],
    [1, 0, "bottom", "top"],
    [0, -1, "left", "right"],
    [0, 1, "right", "left"],
  ];

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const neighbors = dirs
      .map(([dr, dc, w1, w2]) => [r + dr, c + dc, w1, w2] as [number, number, Wall, Wall])
      .filter(([nr, nc]) => nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr as number][nc as number]);

    if (neighbors.length > 0) {
      const [nr, nc, w1, w2] = neighbors[Math.floor(Math.random() * neighbors.length)];
      cells[r][c][w1] = false;
      cells[nr as number][nc as number][w2] = false;
      visited[nr as number][nc as number] = true;
      stack.push([nr as number, nc as number]);
    } else {
      stack.pop();
    }
  }

  cells[0][0].isStart = true;
  cells[rows - 1][cols - 1].isGoal = true;

  return cells;
}
