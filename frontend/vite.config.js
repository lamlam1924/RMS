import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  // Extract protocol, host, and port from API_BASE_URL
  const apiUrl = new URL(apiBaseUrl);
  const apiTarget = `${apiUrl.protocol}//${apiUrl.host}`;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
