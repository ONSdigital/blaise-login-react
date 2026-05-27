import { tmpdir } from "os";
import { resolve } from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text"],
      reportsDirectory: resolve(tmpdir(), `blaise-login-react-server-coverage-${process.pid}`),
      include: ["src/**/*.ts"],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
      exclude: ["src/**/*.mock.ts", "src/**/*.test.ts", "src/**/*.types.ts", "src/index.ts"],
    },
  },
});
