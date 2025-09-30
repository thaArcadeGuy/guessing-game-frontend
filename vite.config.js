import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4001, 
    proxy: {
      "/socket.io": {
        target: "http://localhost:4000",
        changeOrigin: true,
        ws: true
      }
    }
  },
  build: {
     outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  // Remove the base property or set it to empty
  base: "",
});