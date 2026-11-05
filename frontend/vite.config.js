import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server proxies /api and /socket.io to the Express backend,
// so the React app and the Socket.IO engine share one origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
      "/socket.io": { target: "http://localhost:5000", ws: true },
    },
  },
});
