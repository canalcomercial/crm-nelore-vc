import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    // String de conexão direta do Postgres do Supabase.
    // Supabase → Project Settings → Database → Connection string.
    url: process.env.DATABASE_URL ?? "",
  },
});
