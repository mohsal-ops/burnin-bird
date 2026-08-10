import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RotateCcw, Lightbulb } from "lucide-react";
import { crosswordConfigs, type Difficulty, type Clue } from "./crosswordConfigs";
import DifficultySelector from "./DifficultySelector";

type CellData = {
  letter: string;
  userInput: string;
  isActive: boolean;
  clueNumber?: number;
};

const createGrid = (gridRows: number, gridCols: number, clues: Clue[]): CellData[][] => {
  const grid: CellData[][] = Array(gridRows)
    .fill(null)
    .map(() =>
      Array(gridCols)
        .fill(null)
        .map(() => ({
          letter: "",
          userInput: "",
          isActive: false,
        }))
    );

  clues.forEach((clue) => {
    for (let i = 0; i < clue.answer.length; i++) {
      const row = clue.direction === "across" ? clue.row : clue.row + i;
      const col = clue.direction === "across" ? clue.col + i : clue.col;
      
      if (row < gridRows && col < gridCols) {
        grid[row][col].letter = clue.answer[i];
        grid[row][col].isActive = true;
        if (i === 0) {
          grid[row][col].clueNumber = clue.number;
        }
      }
    }
  });

  return grid;
};

const CrosswordGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const config = crosswordConfigs[difficulty];
  
  const [grid, setGrid] = useState<CellData[][]>(() => 
    createGrid(config.gridRows, config.gridCols, config.clues)
  );
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [showHint, setShowHint] = useState(false);

  const handleDifficultyChange = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    const newConfig = crosswordConfigs[newDifficulty];
    setGrid(createGrid(newConfig.gridRows, newConfig.gridCols, newConfig.clues));
    setSelectedCell(null);
    setShowHint(false);
  }, []);

  const handleCellInput = (row: number, col: number, value: string) => {
    const newGrid = [...grid.map((r) => [...r.map((c) => ({ ...c }))])];
    newGrid[row][col].userInput = value.toUpperCase().slice(-1);
    setGrid(newGrid);
    moveToNextCell(row, col);
  };

  const moveToNextCell = (row: number, col: number) => {
    if (col + 1 < config.gridCols && grid[row][col + 1]?.isActive) {
      setSelectedCell({ row, col: col + 1 });
      return;
    }
    if (row + 1 < config.gridRows && grid[row + 1]?.[col]?.isActive) {
      setSelectedCell({ row: row + 1, col });
    }
  };

  const checkAnswers = () => {
    let correct = 0;
    let total = 0;

    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.isActive) {
          total++;
          if (cell.userInput === cell.letter) {
            correct++;
          }
        }
      });
    });

    return { correct, total, isComplete: correct === total && total > 0 };
  };

  const resetGame = () => {
    setGrid(createGrid(config.gridRows, config.gridCols, config.clues));
    setSelectedCell(null);
    setShowHint(false);
  };

  const revealHint = () => {
    if (!selectedCell) return;
    
    const newGrid = [...grid.map((r) => [...r.map((c) => ({ ...c }))])];
    const cell = newGrid[selectedCell.row][selectedCell.col];
    if (cell.isActive) {
      cell.userInput = cell.letter;
    }
    setGrid(newGrid);
  };

  const result = checkAnswers();
  const cellSize = difficulty === "expert" ? 32 : difficulty === "hard" ? 34 : 36;

  return (
    <div className="game-card">
      <div className="text-center mb-4">
        <p className="text-muted-foreground text-sm mb-4">
          Fill in the puzzle with yummy food words!
        </p>
        
        <DifficultySelector
          currentDifficulty={difficulty}
          onSelect={handleDifficultyChange}
          configs={crosswordConfigs}
        />
      </div>

      {result.isComplete && (
        <div className="bg-pickle/10 border-2 border-pickle rounded-xl p-4 mb-4 text-center animate-celebrate">
          <CheckCircle2 className="w-10 h-10 text-pickle mx-auto mb-2" />
          <p className="text-lg font-display text-pickle">
            🎉 Amazing! You solved it! 🎉
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">
        {/* Crossword Grid */}
        <div className="shrink-0">
          <div
            className="grid gap-0.5 bg-border p-1 rounded-xl shadow-game"
            style={{
              gridTemplateColumns: `repeat(${config.gridCols}, ${cellSize}px)`,
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`relative ${
                    cell.isActive
                      ? selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                        ? "bg-primary/20"
                        : "bg-cream"
                      : "bg-primary/80"
                  } ${cell.isActive ? "cursor-pointer" : ""}`}
                  style={{ width: cellSize, height: cellSize }}
                  onClick={() => cell.isActive && setSelectedCell({ row: rowIndex, col: colIndex })}
                >
                  {cell.clueNumber && (
                    <span className="absolute top-0.5 left-1 text-[9px] font-bold text-primary">
                      {cell.clueNumber}
                    </span>
                  )}
                  {cell.isActive && (
                    <input
                      type="text"
                      maxLength={1}
                      value={cell.userInput}
                      onChange={(e) => handleCellInput(rowIndex, colIndex, e.target.value)}
                      className={`w-full h-full text-center font-display text-base uppercase bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 rounded ${
                        cell.userInput && cell.userInput !== cell.letter
                          ? "text-ketchup"
                          : cell.userInput === cell.letter
                          ? "text-pickle"
                          : "text-foreground"
                      }`}
                      style={{ caretColor: "transparent" }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Clues */}
        <div className="flex-1 min-w-55 max-w-70">
          <div className="space-y-3">
            <div>
              <h4 className="font-display text-primary text-sm mb-1">Across →</h4>
              <ul className="space-y-1 text-xs">
                {config.clues
                  .filter((c) => c.direction === "across")
                  .map((clue) => (
                    <li key={clue.number} className="text-muted-foreground">
                      <span className="font-bold text-foreground">{clue.number}.</span> {clue.clue}
                      {showHint && (
                        <span className="text-primary ml-1">({clue.answer.length})</span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display text-primary text-sm mb-1">Down ↓</h4>
              <ul className="space-y-1 text-xs">
                {config.clues
                  .filter((c) => c.direction === "down")
                  .map((clue) => (
                    <li key={clue.number} className="text-muted-foreground">
                      <span className="font-bold text-foreground">{clue.number}.</span> {clue.clue}
                      {showHint && (
                        <span className="text-primary ml-1">({clue.answer.length})</span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          {/* Stats & Controls */}
          <div className="mt-4 space-y-2">
            <div className="bg-secondary/50 rounded-xl px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-lg font-display text-primary">
                {result.correct}/{result.total}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Button
                onClick={() => setShowHint(!showHint)}
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
              >
                <Lightbulb className="w-3 h-3" />
                {showHint ? "Hide" : "Hints"}
              </Button>
              <Button
                onClick={revealHint}
                variant="outline"
                size="sm"
                disabled={!selectedCell}
                className="text-xs"
              >
                Reveal
              </Button>
              <Button onClick={resetGame} variant="secondary" size="sm" className="gap-1 text-xs">
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrosswordGame;
