import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE_PATH || "/", // 👈 VERY IMPORTANT

  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },



  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
