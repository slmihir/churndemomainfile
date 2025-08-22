
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import mockApiPlugin from "./vite.mock";

export default defineConfig({
  plugins: [
    react(),
    mockApiPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
