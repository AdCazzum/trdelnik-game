import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/// <reference types="vite/client" />

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/merits': {
        target: process.env.VITE_MERITS_API_URL || 'https://merits-staging.blockscout.com/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/merits/, ''),
      }
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
