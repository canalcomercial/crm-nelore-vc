import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Formulario } from "@/types/formulario";
import { toast } from "sonner";

export function useFormularios() {
  return useQuery({
    queryKey: ["formularios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formularios")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Formulario[];
    },
  });
}

export function useFormularioPorSlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["formulario", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("formularios")
        .select("id, slug, titulo, descricao, campos, mensagem_sucesso, cor, ativo")
        .eq("slug", slug)
        .eq("ativo", true)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Formulario | null;
    },
    enabled: !!slug,
  });
}

export function useSalvarFormulario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Partial<Formulario> & { id?: string },
    ) => {
      if (payload.id) {
        const { id, total_respostas, criado_em, atualizado_em, ...campos } = payload;
        const { error } = await supabase.from("formularios").update(campos as never).eq("id", id);
        if (error) throw error;
        return id;
      } else {
        const { data, error } = await supabase
          .from("formularios")
          .insert(payload as never)
          .select()
          .single();
        if (error) throw error;
        return (data as { id: string }).id;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["formularios"] });
      toast.success("Formulário salvo");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useExcluirFormulario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("formularios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["formularios"] });
      toast.success("Formulário excluído");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
