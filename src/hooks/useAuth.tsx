import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { Ctx, type AppRole, type Profile } from "@/hooks/auth-context";

export type { AppRole, Profile, AuthCtx } from "@/hooks/auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const identity = useRef<string | null>(null);
  const request = useRef(0);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async (sess: Session | null) => {
      const uid = sess?.user.id ?? null;
      const current = ++request.current;
      if (identity.current !== uid) {
        identity.current = uid;
        queryClient.clear();
        setProfile(null);
        setRoles([]);
      }
      setLoading(!!uid);
      setSession(sess);
      setUser(sess?.user ?? null);
      if (!uid) return;
      const [{ data: prof, error: profileError }, { data: rs, error: rolesError }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      if (current !== request.current) return;
      setProfile(profileError ? null : ((prof as Profile | null) ?? null));
      setRoles(rolesError ? [] : (rs ?? []).map((r) => r.role as AppRole));
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      // Não consultar o próprio client dentro do callback de autenticação.
      setTimeout(() => void loadSession(sess), 0);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      void loadSession(sess);
    }).catch(() => setLoading(false));

    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isCoordenador: roles.includes("coordenador"),
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
