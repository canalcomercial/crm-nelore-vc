import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "coordenador" | "vendedor";

export type Profile = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
};

export type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isCoordenador: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

/**
 * Contexto e hook ficam separados do `AuthProvider` para que o arquivo do
 * provider exporte apenas o componente — requisito do Fast Refresh do Vite.
 */
export const Ctx = createContext<AuthCtx | undefined>(undefined);

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
