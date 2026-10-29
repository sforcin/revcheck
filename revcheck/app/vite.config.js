import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Requests to /api go to the Python backend, so the app and API look like one site.
    proxy: { "/api": "http://localhost:8000" },
  },
});
