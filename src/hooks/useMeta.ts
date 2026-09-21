import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type MetaConfig = Tables<"meta_config">;

export type MetaFormulario = Omit<Tables<"meta_formularios">, "mapa_campos"> & {
  mapa_campos: Record<string, string>;
};

export type MetaEventoLog = Tables<"meta_eventos_log">;

/** O payload do log é JSON livre vindo do webhook da Meta. */
export type MetaEventoPayload = Json;

export function useMetaConfig() {
  return useQuery({
    queryKey: ["meta_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meta_config")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSalvarMetaConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"meta_config"> & { id?: string }) => {
      if (payload.id) {
        const { error } = await supabase.from("meta_config").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("meta_config").insert(payload);
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
        .from("meta_formularios")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MetaFormulario[];
    },
  });
}

export function useSalvarFormularioMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<MetaFormulario> & { form_id: string }) => {
      const { id, ...rest } = payload;
      if (id) {
        const { error } = await supabase.from("meta_formularios").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("meta_formularios")
          .insert(rest as TablesInsert<"meta_formularios">);
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
      const { error } = await supabase.from("meta_formularios").delete().eq("id", id);
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
        .from("meta_eventos_log")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
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

export type MetaPaginaComForms = {
  page_id: string;
  page_nome: string;
  forms: Array<{ id: string; name: string; status: string }>;
};

export function useListarFormsMeta() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("meta-listar-forms");
      if (error) throw error;
      return data as { paginas: MetaPaginaComForms[] };
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
