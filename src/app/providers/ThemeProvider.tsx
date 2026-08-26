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
 * `attribute="class"` + `defaultTheme="system"` + `enableSystem` means a first
 * visit matches the visitor's OS setting, and an explicit choice is persisted
 * to localStorage by next-themes.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
