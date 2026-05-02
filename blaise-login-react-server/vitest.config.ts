import { defineConfig } from "vitest/config";

const EXCLUDE_PATTERNS = ["src/**/*.test.ts"];

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: EXCLUDE_PATTERNS,
    },
  },
});
