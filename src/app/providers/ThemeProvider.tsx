"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * App-wide theme provider (light / dark / system).
 *
 * Wraps next-themes so the rest of the app can call `useTheme()`. The provider
 * toggles a `dark` class on <html>, which drives the `@custom-variant dark`
 * setup in globals.css and every `hsl(var(--token))` design token.
 *
 * `attribute="class"` + `defaultTheme="light"` + `enableSystem={false}` means a
 * first visit (no stored choice) always shows LIGHT - it does not follow the
 * visitor's OS dark setting - and an explicit toggle is persisted to
 * localStorage by next-themes.
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
      defaultTheme="light"
      enableSystem={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
