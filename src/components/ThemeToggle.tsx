"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Light / dark theme toggle.
 *
 * Uses next-themes `resolvedTheme` (which collapses "system" to the concrete
 * light/dark actually showing) so the icon always matches what's on screen.
 *
 * Hydration: next-themes can't know the resolved theme during SSR, so we render
 * a same-size, non-interactive placeholder until mounted. This prevents both the
 * hydration mismatch and a flash of the wrong icon on first paint.
 *
 * The sun/moon crossfade is pure CSS (opacity + rotate), so a toggle is
 * instant - there's no in-flight animation that could desync from the theme,
 * and rapid clicks simply flip back and forth cleanly.
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
        className={cn(
          "inline-flex h-10 w-10 shrink-0 rounded-full",
          className,
        )}
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
        "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        "border border-border bg-background text-foreground",
        "transition-colors hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <Sun
        className={cn(
          "absolute h-5 w-5 transition-all duration-300",
          isDark
            ? "-rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100",
        )}
        strokeWidth={2}
      />
      <Moon
        className={cn(
          "absolute h-5 w-5 transition-all duration-300",
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
