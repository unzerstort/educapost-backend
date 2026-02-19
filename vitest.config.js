import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      all: true,
      branches: 80,
      include: ["src/**/*.js"],

      exclude: ["src/db/index.js", "__tests__/"],
    },
  },
});
