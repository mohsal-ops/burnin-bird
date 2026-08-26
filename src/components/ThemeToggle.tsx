"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Light / dark theme toggle - icon only, no chrome around it.
 *
 * Uses next-themes `resolvedTheme` so the icon always matches what's on screen.
 *
 * Hydration: next-themes can't know the resolved theme during SSR, so we render
 * a same-size, non-interactive placeholder until mounted. This prevents both the
 * hydration mismatch and a flash of the wrong icon on first paint.
 *
 * The sun<->moon swap is a CSS rotate + scale + fade crossfade, so a toggle
 * animates smoothly and rapid clicks just flip back and forth cleanly.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  if (!mounted) {
    // Reserve the exact footprint so the nav doesn't shift on hydration.
    return (
      <span
        aria-hidden
        className={cn("inline-flex h-9 w-9 shrink-0", className)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
        "text-foreground/80 transition-colors hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Sun
        className={cn(
          "absolute h-5 w-5 transition-all duration-500 ease-out",
          isDark
            ? "-rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100",
        )}
        strokeWidth={2}
      />
      <Moon
        className={cn(
          "absolute h-5 w-5 transition-all duration-500 ease-out",
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-0 opacity-0",
        )}
        strokeWidth={2}
      />
    </button>
  );
}

export default ThemeToggle;
