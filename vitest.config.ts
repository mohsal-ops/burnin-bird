import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit + contract tests. Adapters are tested against a mocked global fetch and
// recorded JSON fixtures in tests/fixtures — no network, no real accounts.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
});
