import { defineConfig, lazyPlugins } from "vite-plus";
import react from "@vitejs/plugin-react";
import process from "node:process";
import { fileURLToPath } from "node:url";
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: lazyPlugins(() => [react()]),
  lint: {
    plugins: ["typescript", "react", "jsx-a11y", "oxc"],
    categories: { correctness: "error" },
    options: { typeAware: true, typeCheck: true },
    rules: {},
    env: { builtin: true, browser: true },
    ignorePatterns: ["src/components/arc/**", "src-tauri/**", "dist/**"],
  },
  fmt: {
    printWidth: 100,
    ignorePatterns: ["src/components/arc/**", "src-tauri/**", "dist/**", "docs/**", "bun.lock"],
  },
  resolve: {
    // tsconfig の paths と同じ。Arc の "@/components/arc/..." を解決する
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
