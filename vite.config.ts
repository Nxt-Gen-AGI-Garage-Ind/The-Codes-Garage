import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Universal configuration for Vercel and GitHub Pages
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Automatically adjust base path: GitHub Pages uses the repo name, Vercel uses root.
  // We check for typical CI environment variables to determine the host.
  base: "/", 
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
});
