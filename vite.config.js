import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4001, 
    proxy: {
      "/socket.io": {
        target: "https://guessing-game-backend-y7a9.onrender.com",
        changeOrigin: true,
        ws: true
      }
    }
  },
  define: {
    "process.env": {}
  }
});