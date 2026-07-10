import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Appflow Live-Update trunkira pojedinačni JS chunk ~1 MB+ → bijeli ekran.
        // Izdvoj samo čiste (ne-React) libove; React + SVE što ga importuje mora
        // ostati u JEDNOM "vendor" chunk-u, inače: undefined 'useState'.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("/leaflet/")) return "vendor-leaflet";
          if (id.includes("firebase") || id.includes("@firebase")) return "vendor-firebase";
          if (id.includes("@capacitor")) return "vendor-capacitor";
          return "vendor";
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
