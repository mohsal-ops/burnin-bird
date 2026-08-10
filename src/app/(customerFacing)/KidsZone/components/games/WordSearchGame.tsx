import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy } from "lucide-react";
import type { Difficulty } from "./mazeConfigs";
import DifficultySelector from "./DifficultySelector";

const configs: Record<
  Difficulty,
  { rows: number; cols: number; words: string[]; name: string; emoji: string }
> = {
  easy: {
    rows: 8,
    cols: 8,
    words: ["WINGS", "FRIES", "BURGER", "SAUCE"],
    name: "Easy",
    emoji: "🌟",
  },
  medium: {
    rows: 10,
    cols: 10,
    words: ["WINGS", "FRIES", "BURGER", "TENDERS", "RANCH", "CRISPY"],
    name: "Medium",
    emoji: "⭐",
  },
  hard: {
    rows: 12,
    cols: 12,
    words: [
      "WINGS",
      "FRIES",
      "BURGER",
      "TENDERS",
      "SANDWICH",
      "CHICKEN",
      "CRISPY",
      "GRILLED",
    ],
    name: "Hard",
    emoji: "🔥",
  },
  expert: {
    rows: 14,
    cols: 14,
    words: [
      "WINGS",
      "FRIES",
      "BURGER",
      "TENDERS",
      "SANDWICH",
      "CHICKEN",
      "CRISPY",
      "GRILLED",
      "NUGGETS",
      "STRIPS",
    ],
    name: "Expert",
    emoji: "💎",
  },
};

type Pos = { r: number; c: number };
type Placement = { word: string; cells: Pos[] };

function generateGrid(
  rows: number,
  cols: number,
  words: string[],
): { grid: string[][]; placements: Placement[] } {
  const grid: string[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(""),
  );
  const placements: Placement[] = [];
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [0, -1],
    [-1, 0],
  ];

  for (const word of [...words].sort((a, b) => b.length - a.length)) {
    let placed = false;
    for (let attempt = 0; attempt < 200 && !placed; attempt++) {
      const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      const endR = r + dr * (word.length - 1);
      const endC = c + dc * (word.length - 1);
      if (endR < 0 || endR >= rows || endC < 0 || endC >= cols) continue;

      let ok = true;
      const cells: Pos[] = [];
      for (let i = 0; i < word.length; i++) {
        const cr = r + dr * i,
          cc = c + dc * i;
        if (grid[cr][cc] !== "" && grid[cr][cc] !== word[i]) {
          ok = false;
          break;
        }
        cells.push({ r: cr, c: cc });
      }
      if (!ok) continue;

      cells.forEach((p, i) => {
        grid[p.r][p.c] = word[i];
      });
      placements.push({ word, cells });
      placed = true;
    }
  }

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c] === "")
        grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));

  return { grid, placements };
}

const WordSearchGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const config = configs[difficulty];
  const [{ grid, placements }, setData] = useState(() =>
    generateGrid(config.rows, config.cols, config.words),
  );
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [dragStart, setDragStart] = useState<Pos | null>(null);
  const [dragEnd, setDragEnd] = useState<Pos | null>(null);
  const isDragging = useRef(false);

  const resetGame = useCallback((diff: Difficulty) => {
    const c = configs[diff];
    setData(generateGrid(c.rows, c.cols, c.words));
    setFoundWords(new Set());
    setDragStart(null);
    setDragEnd(null);
  }, []);

  const handleDifficultyChange = (d: Difficulty) => {
    setDifficulty(d);
    resetGame(d);
  };

  const getCellsInLine = (a: Pos, b: Pos): Pos[] | null => {
    const dr = Math.sign(b.r - a.r),
      dc = Math.sign(b.c - a.c);
    const lenR = Math.abs(b.r - a.r),
      lenC = Math.abs(b.c - a.c);
    if (lenR !== 0 && lenC !== 0 && lenR !== lenC) return null;
    const len = Math.max(lenR, lenC);
    if (len === 0) return [{ r: a.r, c: a.c }];
    return Array.from({ length: len + 1 }, (_, i) => ({
      r: a.r + dr * i,
      c: a.c + dc * i,
    }));
  };

  const checkSelection = (start: Pos, end: Pos) => {
    const cells = getCellsInLine(start, end);
    if (!cells || cells.length <= 1) return;

    const word = cells.map((p) => grid[p.r][p.c]).join("");
    const revWord = [...word].reverse().join("");

    const match = placements.find(
      (p) => (p.word === word || p.word === revWord) && !foundWords.has(p.word),
    );

    if (match) {
      setFoundWords((prev) => new Set(prev).add(match.word));
    }
  };

  const handlePointerDown = (r: number, c: number) => {
    isDragging.current = true;
    setDragStart({ r, c });
    setDragEnd({ r, c });
  };

  const handlePointerEnter = (r: number, c: number) => {
    if (isDragging.current && dragStart) {
      setDragEnd({ r, c });
    }
  };

  const handlePointerUp = () => {
    if (dragStart && dragEnd) {
      checkSelection(dragStart, dragEnd);
    }
    isDragging.current = false;
    setDragStart(null);
    setDragEnd(null);
  };

  const getDragCells = (): Set<string> => {
    const set = new Set<string>();
    if (!dragStart || !dragEnd) return set;
    const cells = getCellsInLine(dragStart, dragEnd);
    if (cells) cells.forEach((p) => set.add(`${p.r}-${p.c}`));
    return set;
  };

  const dragCells = getDragCells();

  const isFound = (r: number, c: number) =>
    placements.some(
      (p) =>
        foundWords.has(p.word) &&
        p.cells.some((cell) => cell.r === r && cell.c === c),
    );

  const hasWon = foundWords.size === placements.length && placements.length > 0;

  return (
    <div className="game-card">
      <div className="text-center mb-4">
        <p className="text-muted-foreground text-sm mb-4">
          Find all the hidden food words!
        </p>
        <DifficultySelector
          currentDifficulty={difficulty}
          onSelect={handleDifficultyChange}
          configs={configs}
        />
      </div>

      {hasWon && (
        <div className="bg-pickle/10 border-2 border-pickle rounded-xl p-4 mb-4 text-center animate-celebrate">
          <Trophy className="w-10 h-10 text-mustard mx-auto mb-2" />
          <p className="text-lg font-display text-pickle">
            🎉 Found them all! 🎉
          </p>
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        {/* Word Bank */}
        <div className="flex flex-wrap gap-2 justify-center">
          {config.words.map((w) => (
            <span
              key={w}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                foundWords.has(w)
                  ? "bg-pickle/20 text-pickle line-through"
                  : "bg-secondary text-foreground"
              }`}
            >
              {w}
            </span>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Drag across letters to select a word
        </p>

        {/* Grid */}
        <div
          className="grid gap-0.5 bg-border p-1 rounded-xl shadow-game select-none"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, 28px)`,
            touchAction: "none",
          }}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {grid.map((row, r) =>
            row.map((letter, c) => (
              <button
                key={`${r}-${c}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handlePointerDown(r, c);
                }}
                onPointerEnter={() => handlePointerEnter(r, c)}
                className={`w-7 h-7 text-xs font-bold rounded transition-all ${
                  dragCells.has(`${r}-${c}`)
                    ? "bg-primary text-primary-foreground scale-110"
                    : isFound(r, c)
                      ? "bg-primary text-pickle ring-1 ring-pickle"
                      : "bg-cream text-foreground hover:bg-primary/10"
                }`}
              >
                {letter}
              </button>
            )),
          )}
        </div>

        <div className="bg-secondary/50 rounded-xl px-4 py-2 text-center">
          <p className="text-xs text-muted-foreground">Found</p>
          <p className="text-xl font-display text-primary">
            {foundWords.size}/{placements.length}
          </p>
        </div>

        <Button
          onClick={() => resetGame(difficulty)}
          variant="secondary"
          size="sm"
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" /> New Puzzle
        </Button>
      </div>
    </div>
  );
};

export default WordSearchGame;
