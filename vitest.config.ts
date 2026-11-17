import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // The scoring engine and probe statistics are what users trust; the UI copy is not measured.
      include: ["src/lib/audit/**", "src/lib/compare/**", "src/lib/probe/**", "src/lib/cache.ts", "src/lib/badge.ts"],
      reporter: ["text", "html"],
      thresholds: { statements: 90, branches: 80, functions: 90, lines: 90 },
    },
  },
});
