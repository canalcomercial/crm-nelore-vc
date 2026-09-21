import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AppRole, Profile } from "./useAuth";

export type MembroEquipe = Profile & { roles: AppRole[] };

export function useEquipe() {
  return useQuery({
    queryKey: ["equipe"],
    queryFn: async (): Promise<MembroEquipe[]> => {
      const [{ data: profs, error: e1 }, { data: roles, error: e2 }] = await Promise.all([
        supabase.from("profiles").select("*").order("nome"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      const byUser = new Map<string, AppRole[]>();
      ((roles ?? []) as { user_id: string; role: AppRole }[]).forEach((r) => {
        byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role]);
      });
      return ((profs ?? []) as Profile[]).map((p) => ({ ...p, roles: byUser.get(p.id) ?? [] }));
    },
  });
}

export function useCriarMembro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { nome: string; email: string; role: AppRole; password: string }) => {
      const { data, error } = await supabase.functions.invoke("criar-membro", {
        body: payload,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipe"] });
      toast.success("Membro criado com sucesso");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAtualizarRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      // remove papéis existentes e seta o novo
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", user_id);
      if (delErr) throw delErr;
      const { error: insErr } = await supabase.from("user_roles").insert({ user_id, role });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipe"] });
      toast.success("Função atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleAtivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("profiles").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipe"] });
      toast.success("Status atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useExcluirMembro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user_id: string) => {
      const { data, error } = await supabase.functions.invoke("excluir-membro", {
        body: { user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipe"] });
      toast.success("Membro excluído");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
