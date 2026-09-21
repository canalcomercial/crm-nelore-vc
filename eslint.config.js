import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "drizzle/migrations"] },
  {
    // Código do app (browser + React).
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Variável não usada é sinal de código morto ou de um bug de refatoração.
      // Prefixar com `_` marca o descarte intencional (ex.: `(_event, sess) => …`).
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    // Edge Functions rodam em Deno, não no browser: sem `window`/`document`,
    // e com o global `Deno`. Sem este bloco o ESLint as checava com os globals
    // errados e deixaria passar uso indevido de APIs de browser.
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["supabase/functions/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.deno },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Arquivos de configuração e testes rodam em Node.
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["*.config.{ts,js}", "src/test/**/*.{ts,tsx}", "drizzle/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.node },
    },
  },
);
