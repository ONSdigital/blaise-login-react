import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import pkg from "./package.json" with { type: "json" };

const currentDir = import.meta.dirname;

export default defineConfig({
  plugins: [
    react(),
    dts({
      rollupTypes: true,
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/setupTests.ts"],
    }),
  ],
  build: {
    outDir: "dist",
    sourcemap: true,
    lib: {
      entry: resolve(currentDir, "src/index.tsx"),
      name: "BlaiseLoginReactClient",
      fileName: (format) => `index.${format === "es" ? "es.js" : "js"}`,
    },
    rollupOptions: {
      external: [
        ...Object.keys(pkg.peerDependencies || {}),
        ...Object.keys(pkg.dependencies || {}),
        "react/jsx-runtime",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react-router-dom": "ReactRouterDOM",
          "react/jsx-runtime": "jsxRuntime",
          axios: "axios",
          formik: "Formik",
          "universal-cookie": "UniversalCookie",
          "blaise-design-system-react-components": "BlaiseDesignSystem",
          "blaise-api-node-client": "BlaiseApiClient",
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    globals: true,
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/mocks/**", "src/**/*.test.{ts,tsx}", "src/setupTests.ts"],
    },
    server: {
      deps: {
        inline: ["react-loader-spinner"],
      },
    },
  },
});
