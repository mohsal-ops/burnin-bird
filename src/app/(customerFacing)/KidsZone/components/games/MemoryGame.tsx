import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy, Timer } from "lucide-react";
import type { Difficulty } from "./mazeConfigs";
import DifficultySelector from "./DifficultySelector";

const configs: Record<Difficulty, { cols: number; rows: number; name: string; emoji: string }> = {
  easy: { cols: 3, rows: 4, name: "Easy", emoji: "🌟" },
  medium: { cols: 4, rows: 4, name: "Medium", emoji: "⭐" },
  hard: { cols: 4, rows: 5, name: "Hard", emoji: "🔥" },
  expert: { cols: 5, rows: 6, name: "Expert", emoji: "💎" },
};

const foodEmojis = ["🍗", "🍔", "🌭", "🍟", "🥪", "🍖", "🌮", "🧇", "🥓", "🍳", "🥤", "🍦", "🍩", "🧁", "🥧"];

interface Card { id: number; emoji: string; flipped: boolean; matched: boolean; }

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const createCards = (rows: number, cols: number): Card[] => {
  const pairCount = (rows * cols) / 2;
  const emojis = shuffle(foodEmojis).slice(0, pairCount);
  return shuffle([...emojis, ...emojis].map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false })));
};

const MemoryGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [cards, setCards] = useState<Card[]>(() => createCards(configs.easy.rows, configs.easy.cols));
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [hasWon, setHasWon] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const config = configs[difficulty];

  useEffect(() => {
    if (hasWon) return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [hasWon, startTime]);

  const resetGame = useCallback((diff: Difficulty) => {
    const c = configs[diff];
    setCards(createCards(c.rows, c.cols));
    setSelected([]);
    setMoves(0);
    setHasWon(false);
  }, []);

  const handleDifficultyChange = (d: Difficulty) => { setDifficulty(d); resetGame(d); };

  const handleCardClick = (index: number) => {
    if (hasWon || selected.length >= 2 || cards[index].flipped || cards[index].matched) return;

    const newCards = cards.map((c, i) => i === index ? { ...c, flipped: true } : c);
    const newSelected = [...selected, index];
    setCards(newCards);
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newSelected;
      if (newCards[a].emoji === newCards[b].emoji) {
        setTimeout(() => {
          const matched = newCards.map((c, i) => (i === a || i === b) ? { ...c, matched: true } : c);
          setCards(matched);
          setSelected([]);
          if (matched.every((c) => c.matched)) setHasWon(true);
        }, 400);
      } else {
        setTimeout(() => {
          setCards(newCards.map((c, i) => (i === a || i === b) ? { ...c, flipped: false } : c));
          setSelected([]);
        }, 800);
      }
    }
  };

  return (
    <div className="game-card">
      <div className="text-center mb-4">
        <p className="text-muted-foreground text-sm mb-4">Find all the matching food pairs!</p>
        <DifficultySelector currentDifficulty={difficulty} onSelect={handleDifficultyChange} configs={configs} />
      </div>

      {hasWon && (
        <div className="bg-pickle/10 border-2 border-pickle rounded-xl p-4 mb-4 text-center animate-celebrate">
          <Trophy className="w-10 h-10 text-mustard mx-auto mb-2" />
          <p className="text-lg font-display text-pickle">🎉 Perfect Memory! {moves} moves! 🎉</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-4 text-center">
          <div className="bg-secondary/50 rounded-xl px-4 py-2">
            <p className="text-xs text-muted-foreground">Moves</p>
            <p className="text-xl font-display text-primary">{moves}</p>
          </div>
          <div className="bg-secondary/50 rounded-xl px-4 py-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" />Time</p>
            <p className="text-xl font-display text-primary">{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}</p>
          </div>
        </div>

        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))` }}>
          {cards.map((card, i) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(i)}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-2xl font-bold transition-all duration-300 transform ${
                card.flipped || card.matched
                  ? "bg-card border-2 border-primary/30 scale-100 rotate-0"
                  : "bg-primary text-primary-foreground hover:scale-105 cursor-pointer"
              } ${card.matched ? "opacity-60 scale-95" : ""}`}
              disabled={card.matched}
            >
              {card.flipped || card.matched ? card.emoji : "?"}
            </button>
          ))}
        </div>

        <Button onClick={() => resetGame(difficulty)} variant="secondary" size="sm" className="gap-2">
          <RotateCcw className="w-4 h-4" /> Play Again
        </Button>
      </div>
    </div>
  );
};

export default MemoryGame;
