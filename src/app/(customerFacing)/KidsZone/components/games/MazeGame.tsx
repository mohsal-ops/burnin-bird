import { useState, useEffect, useCallback, useRef, JSX } from "react";
import { StaticImageData } from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Trophy, Timer, Shuffle } from "lucide-react";
import { mazeSettings, generateMaze, type Difficulty, type MazeCell } from "./mazeConfigs";
import DifficultySelector from "./DifficultySelector";
import foodChicken from "public/games/food-chicken-fries.jpg";
import foodTenders from "public/games/food-tenders-fries.jpg";

type Position = { x: number; y: number };

const goalImages: Record<Difficulty, StaticImageData> = {
  easy: foodChicken,
  medium: foodTenders,
  hard: foodChicken,
  expert: foodTenders,
};

const MazeGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [cells, setCells] = useState<MazeCell[][]>(() => generateMaze(mazeSettings.easy.rows, mazeSettings.easy.cols));
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [hasWon, setHasWon] = useState(false);
  const [moves, setMoves] = useState(0);
  const [timerMode, setTimerMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const config = mazeSettings[difficulty];

  const startNewMaze = useCallback((diff: Difficulty) => {
    const s = mazeSettings[diff];
    setCells(generateMaze(s.rows, s.cols));
    setPlayerPos({ x: 0, y: 0 });
    setHasWon(false);
    setGameOver(false);
    setMoves(0);
    setTimeLeft(s.timerSeconds);
  }, []);

  useEffect(() => { startNewMaze(difficulty); }, [difficulty, startNewMaze]);

  // Timer countdown
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timerMode && !hasWon && !gameOver && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { setGameOver(true); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerMode, hasWon, gameOver, timeLeft]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (hasWon || gameOver) return;
    setPlayerPos((prev) => {
      const newX = prev.x + dx;
      const newY = prev.y + dy;
      if (newX < 0 || newX >= config.cols || newY < 0 || newY >= config.rows) return prev;
      const current = cells[prev.y][prev.x];
      if (dx === 1 && current.right) return prev;
      if (dx === -1 && current.left) return prev;
      if (dy === 1 && current.bottom) return prev;
      if (dy === -1 && current.top) return prev;
      setMoves((m) => m + 1);
      if (cells[newY][newX].isGoal) setHasWon(true);
      return { x: newX, y: newY };
    });
  }, [hasWon, gameOver, config.cols, config.rows, cells]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp": e.preventDefault(); movePlayer(0, -1); break;
        case "ArrowDown": e.preventDefault(); movePlayer(0, 1); break;
        case "ArrowLeft": e.preventDefault(); movePlayer(-1, 0); break;
        case "ArrowRight": e.preventDefault(); movePlayer(1, 0); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePlayer]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const totalW = config.cols * config.cellSize + config.wallThickness;
  const totalH = config.rows * config.cellSize + config.wallThickness;

  return (
    <div className="game-card">
      <div className="text-center mb-4">
        <p className="text-muted-foreground text-sm mb-4">Navigate through the maze to find the meal!</p>
        <DifficultySelector currentDifficulty={difficulty} onSelect={setDifficulty} configs={mazeSettings} />
      </div>

      {/* Timer toggle */}
      <div className="flex justify-center gap-2 mb-4">
        <Button variant={timerMode ? "default" : "outline"} size="sm" onClick={() => { setTimerMode(!timerMode); startNewMaze(difficulty); }} className="gap-1">
          <Timer className="w-4 h-4" />
          {timerMode ? "Timer ON" : "Timer OFF"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => startNewMaze(difficulty)} className="gap-1">
          <Shuffle className="w-4 h-4" />
          New Maze
        </Button>
      </div>

      {hasWon && (
        <div className="bg-pickle/10 border-2 border-pickle rounded-xl p-4 mb-4 text-center animate-celebrate">
          <Trophy className="w-10 h-10 text-mustard mx-auto mb-2" />
          <p className="text-lg font-display text-pickle">🎉 Found it in {moves} moves! {timerMode && `(${formatTime(config.timerSeconds - timeLeft)})`} 🎉</p>
        </div>
      )}
      {gameOver && !hasWon && (
        <div className="bg-ketchup/10 border-2 border-ketchup rounded-xl p-4 mb-4 text-center">
          <p className="text-lg font-display text-ketchup">⏰ Time&apos;s up! Try again!</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        {/* Stats */}
        <div className="flex gap-4 text-center">
          <div className="bg-secondary/50 rounded-xl px-4 py-2">
            <p className="text-xs text-muted-foreground">Moves</p>
            <p className="text-xl font-display text-primary">{moves}</p>
          </div>
          {timerMode && (
            <div className={`bg-secondary/50 rounded-xl px-4 py-2 ${timeLeft <= 10 ? "animate-pulse" : ""}`}>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className={`text-xl font-display ${timeLeft <= 10 ? "text-ketchup" : "text-primary"}`}>{formatTime(timeLeft)}</p>
            </div>
          )}
        </div>

        {/* Maze */}
        <div className="flex justify-center overflow-auto max-w-full">
          <svg width={totalW} height={totalH} className="rounded-xl shadow-game" style={{ background: "hsl(var(--cream))" }}>
            {cells.map((row, r) =>
              row.map((cell, c) => (
                <g key={`${r}-${c}`}>
                  {cell.isGoal && (
                    <>
                      <rect x={c * config.cellSize + config.wallThickness / 2} y={r * config.cellSize + config.wallThickness / 2} width={config.cellSize} height={config.cellSize} fill="hsl(var(--pickle) / 0.1)" />
                      <image  href={goalImages[difficulty].src} x={c * config.cellSize + config.wallThickness / 2 + 2} y={r * config.cellSize + config.wallThickness / 2 + 2} width={config.cellSize - 4} height={config.cellSize - 4} preserveAspectRatio="xMidYMid slice" clipPath="inset(0 round 4px)" />
                    </>
                  )}
                </g>
              ))
            )}
            {cells.map((row, r) =>
              row.map((cell, c) => {
                const x = c * config.cellSize + config.wallThickness / 2;
                const y = r * config.cellSize + config.wallThickness / 2;
                const lines: JSX.Element[] = [];
                if (cell.top) lines.push(<line key={`${r}-${c}-t`} x1={x} y1={y} x2={x + config.cellSize} y2={y} stroke="hsl(var(--primary))" strokeWidth={config.wallThickness} strokeLinecap="round" />);
                if (cell.left) lines.push(<line key={`${r}-${c}-l`} x1={x} y1={y} x2={x} y2={y + config.cellSize} stroke="hsl(var(--primary))" strokeWidth={config.wallThickness} strokeLinecap="round" />);
                if (cell.right) lines.push(<line key={`${r}-${c}-r`} x1={x + config.cellSize} y1={y} x2={x + config.cellSize} y2={y + config.cellSize} stroke="hsl(var(--primary))" strokeWidth={config.wallThickness} strokeLinecap="round" />);
                if (cell.bottom) lines.push(<line key={`${r}-${c}-b`} x1={x} y1={y + config.cellSize} x2={x + config.cellSize} y2={y + config.cellSize} stroke="hsl(var(--primary))" strokeWidth={config.wallThickness} strokeLinecap="round" />);
                return lines;
              })
            )}
            <text x={playerPos.x * config.cellSize + config.wallThickness / 2 + config.cellSize / 2} y={playerPos.y * config.cellSize + config.wallThickness / 2 + config.cellSize / 2} textAnchor="middle" dominantBaseline="central" fontSize={config.cellSize * 0.55} className={hasWon ? "animate-celebrate" : ""} style={{ transition: "all 0.15s ease-out" }}>🧒</text>
          </svg>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => movePlayer(0, -1)} disabled={hasWon || gameOver} className="w-10 h-10 rounded-xl"><ArrowUp className="w-5 h-5" /></Button>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => movePlayer(-1, 0)} disabled={hasWon || gameOver} className="w-10 h-10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
            <Button variant="outline" size="icon" onClick={() => movePlayer(0, 1)} disabled={hasWon || gameOver} className="w-10 h-10 rounded-xl"><ArrowDown className="w-5 h-5" /></Button>
            <Button variant="outline" size="icon" onClick={() => movePlayer(1, 0)} disabled={hasWon || gameOver} className="w-10 h-10 rounded-xl"><ArrowRight className="w-5 h-5" /></Button>
          </div>
        </div>

        <Button onClick={() => startNewMaze(difficulty)} variant="secondary" size="sm" className="gap-2">
          <RotateCcw className="w-4 h-4" /> Play Again
        </Button>
        <p className="text-xs text-muted-foreground text-center">Use arrow keys or buttons to move!</p>
      </div>
    </div>
  );
};

export default MazeGame;
