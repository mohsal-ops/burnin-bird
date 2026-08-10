import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy } from "lucide-react";
import type { Difficulty } from "./mazeConfigs";
import DifficultySelector from "./DifficultySelector";

const configs: Record<Difficulty, { name: string; emoji: string }> = {
  easy: { name: "Easy", emoji: "🌟" },
  medium: { name: "Medium", emoji: "⭐" },
  hard: { name: "Hard", emoji: "🔥" },
  expert: { name: "Expert", emoji: "💎" },
};

type Cell = "🍗" | "🍔" | null;
type Board = Cell[];

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const checkWinner = (board: Board): Cell => {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
  }
  return null;
};

const minimax = (board: Board, isMax: boolean): number => {
  const winner = checkWinner(board);
  if (winner === "🍔") return 10;
  if (winner === "🍗") return -10;
  if (board.every((c) => c !== null)) return 0;

  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "🍔";
        best = Math.max(best, minimax(board, false));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "🍗";
        best = Math.min(best, minimax(board, true));
        board[i] = null;
      }
    }
    return best;
  }
};

const getAIMove = (board: Board, difficulty: Difficulty): number => {
  const empty = board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
  if (empty.length === 0) return -1;

  // Easy: random
  if (difficulty === "easy") return empty[Math.floor(Math.random() * empty.length)];

  // Medium: 50% smart
  if (difficulty === "medium" && Math.random() < 0.5) return empty[Math.floor(Math.random() * empty.length)];

  // Hard/Expert: minimax
  let bestScore = -Infinity;
  let bestMove = empty[0];
  for (const i of empty) {
    board[i] = "🍔";
    const score = minimax(board, false);
    board[i] = null;
    if (score > bestScore) { bestScore = score; bestMove = i; }
  }
  return bestMove;
};

const TicTacToeGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [scores, setScores] = useState({ player: 0, ai: 0, draws: 0 });

  const winner = checkWinner(board);
  const isDraw = !winner && board.every((c) => c !== null);
  const gameOver = !!winner || isDraw;

  // AI move
  useEffect(() => {
    if (!isPlayerTurn && !gameOver) {
      const timeout = setTimeout(() => {
        const move = getAIMove([...board], difficulty);
        if (move >= 0) {
          const newBoard = [...board];
          newBoard[move] = "🍔";
          setBoard(newBoard);
          setIsPlayerTurn(true);
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isPlayerTurn, gameOver, board, difficulty]);

  // Score tracking
  useEffect(() => {
    if (winner === "🍗") setScores((s) => ({ ...s, player: s.player + 1 }));
    else if (winner === "🍔") setScores((s) => ({ ...s, ai: s.ai + 1 }));
    else if (isDraw) setScores((s) => ({ ...s, draws: s.draws + 1 }));
  }, [winner, isDraw]);

  const handleClick = (i: number) => {
    if (!isPlayerTurn || board[i] || gameOver) return;
    const newBoard = [...board];
    newBoard[i] = "🍗";
    setBoard(newBoard);
    setIsPlayerTurn(false);
  };

  const resetGame = () => { setBoard(Array(9).fill(null)); setIsPlayerTurn(true); };

  return (
    <div className="game-card">
      <div className="text-center mb-4">
        <p className="text-muted-foreground text-sm mb-4">You&apos;re 🍗 - beat the 🍔 AI!</p>
        <DifficultySelector currentDifficulty={difficulty} onSelect={(d) => { setDifficulty(d); resetGame(); }} configs={configs} />
      </div>

      {winner && (
        <div className={`${winner === "🍗" ? "bg-pickle/10 border-pickle" : "bg-ketchup/10 border-ketchup"} border-2 rounded-xl p-4 mb-4 text-center animate-celebrate`}>
          <Trophy className="w-10 h-10 text-mustard mx-auto mb-2" />
          <p className={`text-lg font-display ${winner === "🍗" ? "text-pickle" : "text-ketchup"}`}>
            {winner === "🍗" ? "🎉 You won!" : "🍔 AI wins!"} 
          </p>
        </div>
      )}
      {isDraw && (
        <div className="bg-secondary border-2 border-border rounded-xl p-4 mb-4 text-center">
          <p className="text-lg font-display text-muted-foreground">🤝 It&apos;s a draw!</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-4 text-center">
          <div className="bg-pickle/10 rounded-xl px-4 py-2">
            <p className="text-xs text-muted-foreground">You 🍗</p>
            <p className="text-xl font-display text-pickle">{scores.player}</p>
          </div>
          <div className="bg-secondary/50 rounded-xl px-4 py-2">
            <p className="text-xs text-muted-foreground">Draws</p>
            <p className="text-xl font-display text-primary">{scores.draws}</p>
          </div>
          <div className="bg-ketchup/10 rounded-xl px-4 py-2">
            <p className="text-xs text-muted-foreground">AI 🍔</p>
            <p className="text-xl font-display text-ketchup">{scores.ai}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              disabled={!!cell || gameOver || !isPlayerTurn}
              className={`w-20 h-20 rounded-xl text-4xl font-bold transition-all border-2 ${
                cell ? "border-primary/20 bg-card" : "border-border bg-cream hover:bg-primary/10 hover:scale-105 cursor-pointer"
              } ${!cell && !gameOver && isPlayerTurn ? "hover:border-primary/40" : ""}`}
            >
              {cell}
            </button>
          ))}
        </div>

        {!isPlayerTurn && !gameOver && (
          <p className="text-sm text-muted-foreground animate-pulse">🍔 AI is thinking...</p>
        )}

        <Button onClick={resetGame} variant="secondary" size="sm" className="gap-2">
          <RotateCcw className="w-4 h-4" /> Play Again
        </Button>
      </div>
    </div>
  );
};

export default TicTacToeGame;
