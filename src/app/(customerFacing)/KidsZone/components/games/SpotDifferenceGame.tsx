import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy } from "lucide-react";
import type { Difficulty } from "./mazeConfigs";
import DifficultySelector from "./DifficultySelector";

const configs: Record<Difficulty, { name: string; emoji: string; gridSize: number; diffCount: number }> = {
  easy: { name: "Easy", emoji: "🌟", gridSize: 4, diffCount: 3 },
  medium: { name: "Medium", emoji: "⭐", gridSize: 5, diffCount: 4 },
  hard: { name: "Hard", emoji: "🔥", gridSize: 5, diffCount: 5 },
  expert: { name: "Expert", emoji: "💎", gridSize: 6, diffCount: 7 },
};

const allEmojis = ["🍗", "🍔", "🌭", "🍟", "🥪", "🍖", "🌮", "🧇", "🥓", "🍳", "🥤", "🍦", "🍩", "🧁", "🥧", "🍰", "🧀", "🥚", "🍞", "🥨", "🥐", "🧆", "🍕", "🥘", "🍜", "🥗", "🍲", "🥫", "🍱", "🧃", "🍮", "🍯", "🍿", "🥜", "🍫", "🍬"];

interface Diff { row: number; col: number; original: string; changed: string; }

function generateScene(gridSize: number, diffCount: number) {
  const grid: string[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => allEmojis[Math.floor(Math.random() * 18)])
  );

  const positions: [number, number][] = [];
  while (positions.length < diffCount) {
    const r = Math.floor(Math.random() * gridSize);
    const c = Math.floor(Math.random() * gridSize);
    if (!positions.some(([pr, pc]) => pr === r && pc === c)) positions.push([r, c]);
  }

  const diffs: Diff[] = positions.map(([row, col]) => {
    const original = grid[row][col];
    let changed: string;
    do { changed = allEmojis[Math.floor(Math.random() * allEmojis.length)]; } while (changed === original);
    return { row, col, original, changed };
  });

  const altGrid = grid.map((row) => [...row]);
  diffs.forEach((d) => { altGrid[d.row][d.col] = d.changed; });

  return { grid, altGrid, diffs };
}

const SpotDifferenceGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const config = configs[difficulty];
  const [scene, setScene] = useState(() => generateScene(config.gridSize, config.diffCount));
  const [found, setFound] = useState<Set<string>>(new Set());
  const [wrongClick, setWrongClick] = useState<string | null>(null);

  const hasWon = found.size === scene.diffs.length;

  const resetGame = useCallback((diff: Difficulty) => {
    const c = configs[diff];
    setScene(generateScene(c.gridSize, c.diffCount));
    setFound(new Set());
    setWrongClick(null);
  }, []);

  const handleClick = (row: number, col: number, isRight: boolean) => {
    if (hasWon) return;
    const key = `${row}-${col}`;
    const isDiff = scene.diffs.some((d) => d.row === row && d.col === col);

    if (isDiff && !found.has(key)) {
      setFound((prev) => new Set(prev).add(key));
      setWrongClick(null);
    } else if (!isDiff) {
      setWrongClick(`${isRight ? "r" : "l"}-${key}`);
      setTimeout(() => setWrongClick(null), 600);
    }
  };

  const renderGrid = (grid: string[][], isRight: boolean) => (
    <div className="grid gap-1 bg-card p-2 rounded-xl border border-border shadow-game" style={{ gridTemplateColumns: `repeat(${config.gridSize}, minmax(0, 1fr))` }}>
      {grid.map((row, r) =>
        row.map((emoji, c) => {
          const key = `${r}-${c}`;
          const isFound = found.has(key);
          const isWrong = wrongClick === `${isRight ? "r" : "l"}-${key}`;
          return (
            <button
              key={key}
              onClick={() => handleClick(r, c, isRight)}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg text-xl transition-all ${
                isFound ? "bg-pickle/20 ring-2 ring-pickle scale-95" :
                isWrong ? "bg-ketchup/20 ring-2 ring-ketchup animate-wiggle" :
                "bg-cream hover:bg-primary/10"
              }`}
            >
              {emoji}
            </button>
          );
        })
      )}
    </div>
  );

  return (
    <div className="game-card">
      <div className="text-center mb-4">
        <p className="text-muted-foreground text-sm mb-4">Find all differences between the two scenes!</p>
        <DifficultySelector currentDifficulty={difficulty} onSelect={(d) => { setDifficulty(d); resetGame(d); }} configs={configs} />
      </div>

      {hasWon && (
        <div className="bg-pickle/10 border-2 border-pickle rounded-xl p-4 mb-4 text-center animate-celebrate">
          <Trophy className="w-10 h-10 text-mustard mx-auto mb-2" />
          <p className="text-lg font-display text-pickle">🎉 Eagle eyes! Found them all! 🎉</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <div className="bg-secondary/50 rounded-xl px-4 py-2 text-center">
          <p className="text-xs text-muted-foreground">Found</p>
          <p className="text-xl font-display text-primary">{found.size}/{scene.diffs.length}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="text-center">
            <p className="text-sm font-display text-primary mb-2">Scene A</p>
            {renderGrid(scene.grid, false)}
          </div>
          <div className="text-2xl font-display text-muted-foreground hidden sm:block">VS</div>
          <div className="text-center">
            <p className="text-sm font-display text-primary mb-2">Scene B</p>
            {renderGrid(scene.altGrid, true)}
          </div>
        </div>

        <Button onClick={() => resetGame(difficulty)} variant="secondary" size="sm" className="gap-2">
          <RotateCcw className="w-4 h-4" /> New Scene
        </Button>
      </div>
    </div>
  );
};

export default SpotDifferenceGame;
