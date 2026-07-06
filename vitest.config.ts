import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      provider: "v8",
      include: ["src/lib/*.ts"],
      reporter: ["text", "json", "html"],
    },
  },
});
