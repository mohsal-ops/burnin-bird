import type { Difficulty } from "./mazeConfigs";

interface DifficultySelectorProps {
  currentDifficulty: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
  configs: Record<Difficulty, { name: string; emoji: string }>;
}

const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"];

const levelColors: Record<Difficulty, { active: string; ring: string }> = {
  easy: { active: "bg-emerald-500/15 text-emerald-600 ring-emerald-500/30", ring: "bg-emerald-500" },
  medium: { active: "bg-amber-500/15 text-amber-600 ring-amber-500/30", ring: "bg-amber-500" },
  hard: { active: "bg-orange-500/15 text-orange-600 ring-orange-500/30", ring: "bg-orange-500" },
  expert: { active: "bg-red-500/15 text-red-600 ring-red-500/30", ring: "bg-red-500" },
};

const DifficultySelector = ({ currentDifficulty, onSelect, configs }: DifficultySelectorProps) => {
  const currentIdx = difficulties.indexOf(currentDifficulty);

  return (
    <div className="flex flex-col items-center gap-3 mb-5">
      {/* Level path visualization */}
      <div className="flex items-center gap-0">
        {difficulties.map((diff, i) => {
          const isActive = diff === currentDifficulty;
          const isPast = i <= currentIdx;
          const colors = levelColors[diff];

          return (
            <div key={diff} className="flex items-center">
              {/* Connector line */}
              {i > 0 && (
                <div className={`w-6 sm:w-10 h-0.5 transition-all duration-300 ${
                  i <= currentIdx ? colors.ring : "bg-border"
                }`} />
              )}

              {/* Level node */}
              <button
                onClick={() => onSelect(diff)}
                className={`relative flex flex-col items-center gap-1 transition-all duration-300 group`}
              >
                {/* Circle */}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold transition-all duration-300 border-2 ${
                  isActive
                    ? `${colors.active} border-current scale-110 shadow-lg`
                    : isPast
                    ? `${colors.active} border-transparent opacity-70`
                    : "bg-secondary/60 border-border text-muted-foreground hover:border-primary/30 hover:scale-105"
                }`}>
                  {configs[diff].emoji}
                </div>

                {/* Label */}
                <span className={`text-[10px] sm:text-xs font-bold transition-all ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {configs[diff].name}
                </span>

                {/* Active indicator dot */}
                {isActive && (
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${colors.ring} animate-pulse border-2 border-background`} />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DifficultySelector;
