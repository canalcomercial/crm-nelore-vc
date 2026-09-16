import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type MetaFormulario = {
  id: string;
  form_id: string;
  form_nome: string | null;
  page_id: string | null;
  page_nome: string | null;
  funil_id: string | null;
  etapa: string | null;
  responsavel_id: string | null;
  mapa_campos: Record<string, string>;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type MetaEventoLog = {
  id: string;
  leadgen_id: string | null;
  form_id: string | null;
  payload: any;
  status: string;
  lead_id: string | null;
  erro: string | null;
  criado_em: string;
};

export function useMetaConfig() {
  return useQuery({
    queryKey: ["meta_config"],
    queryFn: async () => {
      const { data } = await supabase
        .from("meta_config" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      return data as any;
    },
  });
}

export function useSalvarMetaConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { app_id?: string; verify_token_hint?: string; page_access_token_set?: boolean; ativo?: boolean; id?: string }) => {
      if (payload.id) {
        const { error } = await supabase.from("meta_config" as any).update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("meta_config" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meta_config"] });
      toast.success("Configuração salva");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMetaFormularios() {
  return useQuery({
    queryKey: ["meta_formularios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meta_formularios" as any)
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MetaFormulario[];
    },
  });
}

export function useSalvarFormularioMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<MetaFormulario> & { form_id: string }) => {
      const { id, ...rest } = payload as any;
      if (id) {
        const { error } = await supabase.from("meta_formularios" as any).update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("meta_formularios" as any).insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meta_formularios"] });
      toast.success("Formulário salvo");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useExcluirFormularioMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meta_formularios" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meta_formularios"] });
      toast.success("Formulário removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMetaEventos() {
  return useQuery({
    queryKey: ["meta_eventos_log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meta_eventos_log" as any)
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as MetaEventoLog[];
    },
  });
}

export function useReprocessarEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (evento_id: string) => {
      const { data, error } = await supabase.functions.invoke("meta-reprocessar-evento", {
        body: { evento_id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meta_eventos_log"] });
      toast.success("Evento reprocessado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useListarFormsMeta() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("meta-listar-forms");
      if (error) throw error;
      return data as { paginas: Array<{ page_id: string; page_nome: string; forms: Array<{ id: string; name: string; status: string }> }> };
    },
    onError: (e: Error) => toast.error(e.message),
  });
}