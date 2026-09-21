import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  if (command === "build") {
    for (const name of ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"]) {
      if (!env[name]?.trim()) throw new Error(`Configuração de build ausente: ${name}`);
    }
    if (!/^https?:$/.test(new URL(env.VITE_SUPABASE_URL!).protocol)) {
      throw new Error("VITE_SUPABASE_URL deve ser uma URL HTTP válida.");
    }
    if (env.VITE_SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_secret_")) {
      throw new Error("Use somente uma chave pública do Supabase no frontend.");
    }
  }
  return ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  });
});
