import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// SPA fallback: serve index.html for non-file routes (fixes 404 on refresh)
function spaFallback() {
  return {
    name: "spa-fallback",
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url?.split("?")[0] ?? "";
        if (!url.includes(".") && url !== "/" && !url.startsWith("/@") && !url.startsWith("/node_modules")) {
          req.url = "/index.html";
        }
        next();
      });
    },
    configurePreviewServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url?.split("?")[0] ?? "";
        if (!url.includes(".") && url !== "/" && !url.startsWith("/@")) {
          req.url = "/index.html";
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), spaFallback(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
