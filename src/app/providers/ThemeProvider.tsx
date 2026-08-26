"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";
import { SITE_CONFIG } from "@/lib/siteConfig";

/**
 * App-wide theme provider (light / dark / system).
 *
 * Wraps next-themes so the rest of the app can call `useTheme()`. The provider
 * toggles a `dark` class on <html>, which drives the `@custom-variant dark`
 * setup in globals.css and every `hsl(var(--token))` design token.
 *
 * The starting theme comes from `SITE_CONFIG.defaultTheme` (per brand), and
 * FALLS BACK TO "light" if it is ever unset - a first visit is never dark by
 * accident and never follows the OS setting (`enableSystem={false}`). The
 * header toggle still switches it and the choice persists to localStorage.
 *
 * `disableTransitionOnChange` is intentionally OFF so the toggle's sun<->moon
 * icon animation is allowed to play on switch (that flag suppresses all CSS
 * transitions for a frame during the theme change).
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={SITE_CONFIG.defaultTheme ?? "light"}
      enableSystem={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
