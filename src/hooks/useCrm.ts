import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Funil, Lead, Mensagem, Interacao, FollowUp, Usuario, Venda, Disparo, DocumentoLead, StatusCadastro } from "@/types/crm";
import { toast } from "sonner";

export function useFunis() {
  return useQuery({
    queryKey: ["funis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funis").select("*").eq("ativo", true).order("ordem");
      if (error) throw error;
      return (data ?? []) as unknown as Funil[];
    },
  });
}

export function useCriarFunil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { nome: string; etapas: string[]; cor?: string | null }) => {
      const { data: funisExistentes } = await supabase.from("funis").select("ordem");
      const ordem = (funisExistentes ?? []).reduce((m, f: { ordem: number }) => Math.max(m, f.ordem), -1) + 1;
      const { data, error } = await supabase
        .from("funis")
        .insert({ nome: payload.nome, etapas: payload.etapas, cor: payload.cor ?? "#2D6A4F", ordem, ativo: true })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funis"] });
      toast.success("Funil criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAtualizarFunil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; nome?: string; etapas?: string[]; cor?: string | null; ativo?: boolean }) => {
      const { id, ...campos } = payload;
      const { error } = await supabase.from("funis").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funis"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Funil atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReordenarFunis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ordenados: { id: string; ordem: number }[]) => {
      // atualiza um por um para respeitar RLS/policies simples
      const results = await Promise.all(
        ordenados.map((f) =>
          supabase.from("funis").update({ ordem: f.ordem }).eq("id", f.id),
        ),
      );
      const err = results.find((r) => r.error)?.error;
      if (err) throw err;
    },
    onMutate: async (ordenados) => {
      await qc.cancelQueries({ queryKey: ["funis"] });
      const prev = qc.getQueryData<Funil[]>(["funis"]);
      if (prev) {
        const order = new Map(ordenados.map((f) => [f.id, f.ordem]));
        const next = [...prev]
          .map((f) => ({ ...f, ordem: order.get(f.id) ?? f.ordem }))
          .sort((a, b) => a.ordem - b.ordem);
        qc.setQueryData(["funis"], next);
      }
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["funis"], ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["funis"] });
    },
  });
}

export function useDuplicarFunil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (funil: Funil) => {
      const { data: funisExistentes } = await supabase.from("funis").select("ordem");
      const ordem = (funisExistentes ?? []).reduce((m, f: { ordem: number }) => Math.max(m, f.ordem), -1) + 1;
      const { data, error } = await supabase
        .from("funis")
        .insert({
          nome: `${funil.nome} (cópia)`,
          etapas: [...funil.etapas],
          cor: funil.cor ?? "#2D6A4F",
          ordem,
          ativo: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funis"] });
      toast.success("Funil duplicado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useExcluirFunil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, moverParaFunilId, moverParaEtapa }: {
      id: string;
      moverParaFunilId?: string | null;
      moverParaEtapa?: string | null;
    }) => {
      if (moverParaFunilId && moverParaEtapa) {
        // Move leads para outro funil/etapa
        const { error: updErr } = await supabase
          .from("leads")
          .update({
            funil_id: moverParaFunilId,
            etapa: moverParaEtapa,
            entrou_etapa_em: new Date().toISOString(),
          })
          .eq("funil_id", id);
        if (updErr) throw updErr;
      } else {
        // Apenas desvincula leads (preserva os registros)
        const { error: updErr } = await supabase
          .from("leads")
          .update({ funil_id: null, etapa: null })
          .eq("funil_id", id);
        if (updErr) throw updErr;
      }
      const { error } = await supabase.from("funis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funis"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Funil excluído");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useContarLeadsFunil(funilId: string | undefined) {
  return useQuery({
    queryKey: ["leads-count-funil", funilId],
    enabled: !!funilId,
    queryFn: async () => {
      if (!funilId) return 0;
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("funil_id", funilId)
        .is("deletado_em", null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useLeadsByFunil(funilId: string | undefined) {
  return useQuery({
    queryKey: ["leads", funilId],
    queryFn: async () => {
      if (!funilId) return [];
      const { data, error } = await supabase
        .from("leads").select("*")
        .eq("funil_id", funilId)
        .eq("arquivado", false)
        .is("deletado_em", null)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Lead[];
    },
    enabled: !!funilId,
  });
}

export function useLeadsArquivados() {
  return useQuery({
    queryKey: ["leads-arquivados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads").select("*")
        .or("arquivado.eq.true,etapa.eq.Perdido")
        .is("deletado_em", null)
        .order("arquivado_em", { ascending: false, nullsFirst: false })
        .limit(10000);
      if (error) throw error;
      return (data ?? []) as unknown as Lead[];
    },
  });
}

export function useArquivarLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, arquivado }: { id: string; arquivado: boolean }) => {
      const { error } = await supabase
        .from("leads")
        .update({
          arquivado,
          arquivado_em: arquivado ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
      await supabase.from("interacoes").insert({
        lead_id: id,
        tipo: arquivado ? "arquivamento" : "desarquivamento",
        conteudo: arquivado ? "Lead enviado ao banco de contatos" : "Lead reativado do banco",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["leads-arquivados"] });
      toast.success("Atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMoverLeadParaFunil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, funil_id, etapa }: { ids: string[]; funil_id: string; etapa: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({
          funil_id,
          etapa,
          arquivado: false,
          arquivado_em: null,
          motivo_perda: null,
          entrou_etapa_em: new Date().toISOString(),
        })
        .in("id", ids);
      if (error) throw error;
      // log por lead
      await supabase.from("interacoes").insert(
        ids.map((id) => ({
          lead_id: id,
          tipo: "mudanca_etapa",
          conteudo: `Reativado do banco para ${etapa}`,
        }))
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["leads-arquivados"] });
      toast.success("Contatos enviados ao funil");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUsuarios() {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, email, ativo")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return ((data ?? []) as { id: string; nome: string; email: string; ativo: boolean }[]).map((p) => ({
        id: p.id,
        nome: p.nome,
        email: p.email,
        perfil: "vendedor",
        ativo: p.ativo,
      })) as Usuario[];
    },
  });
}

export function useMensagens(leadId: string | undefined) {
  return useQuery({
    queryKey: ["mensagens", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from("mensagens_chat").select("*").eq("lead_id", leadId).order("criado_em");
      if (error) throw error;
      return (data ?? []) as Mensagem[];
    },
    enabled: !!leadId,
  });
}

export function useInteracoes(leadId: string | undefined) {
  return useQuery({
    queryKey: ["interacoes", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from("interacoes").select("*").eq("lead_id", leadId).order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Interacao[];
    },
    enabled: !!leadId,
  });
}

export function useFollowUpsVencidos() {
  return useQuery({
    queryKey: ["followups-vencidos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_ups")
        .select("*")
        .eq("status", "pendente")
        .lt("data_hora", new Date().toISOString());
      if (error) throw error;
      return (data ?? []) as FollowUp[];
    },
  });
}

export function useUpdateLeadEtapa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, etapa, funil_id }: { id: string; etapa: string; funil_id?: string }) => {
      const payload: { etapa: string; entrou_etapa_em: string; funil_id?: string } = {
        etapa,
        entrou_etapa_em: new Date().toISOString(),
      };
      if (funil_id) payload.funil_id = funil_id;
      const { error } = await supabase.from("leads").update(payload).eq("id", id);
      if (error) throw error;
      await supabase.from("interacoes").insert({
        lead_id: id, tipo: "mudanca_etapa", conteudo: `Movido para ${etapa}`,
      });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["interacoes", vars.id] });
      toast.success("Etapa atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useEnviarMensagem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lead_id, conteudo }: { lead_id: string; conteudo: string }) => {
      const { error } = await supabase
        .from("mensagens_chat")
        .insert({ lead_id, conteudo, direcao: "enviada" });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["mensagens", vars.lead_id] });
    },
  });
}

export function useSalvarAnotacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lead_id, conteudo, tipo }: { lead_id: string; conteudo: string; tipo?: string }) => {
      const { error } = await supabase
        .from("interacoes")
        .insert({ lead_id, tipo: tipo ?? "anotacao", conteudo });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["interacoes", vars.lead_id] });
      toast.success("Registro salvo");
    },
  });
}

export function useUpdateLeadVendedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      responsavel_id,
      responsavel_nome,
    }: {
      id: string;
      responsavel_id: string | null;
      responsavel_nome?: string | null;
    }) => {
      // pega responsável anterior para registrar no histórico
      const { data: leadAtual } = await supabase
        .from("leads")
        .select("responsavel_id, responsavel_nome")
        .eq("id", id)
        .maybeSingle();

      const payload: { responsavel_id: string | null; responsavel_nome?: string | null } = {
        responsavel_id,
      };
      if (responsavel_nome !== undefined) payload.responsavel_nome = responsavel_nome;
      const { error } = await supabase.from("leads").update(payload).eq("id", id);
      if (error) throw error;

      // resolve nomes legíveis para o log
      let novoNome: string | null = responsavel_nome ?? null;
      if (responsavel_id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("nome")
          .eq("id", responsavel_id)
          .maybeSingle();
        novoNome = prof?.nome ?? novoNome;
      }
      let antigoNome: string | null = leadAtual?.responsavel_nome ?? null;
      if (leadAtual?.responsavel_id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("nome")
          .eq("id", leadAtual.responsavel_id)
          .maybeSingle();
        antigoNome = prof?.nome ?? antigoNome;
      }

      const conteudo = antigoNome
        ? novoNome
          ? `Responsável alterado de ${antigoNome} para ${novoNome}`
          : `Responsável removido (era ${antigoNome})`
        : novoNome
          ? `Responsável definido: ${novoNome}`
          : null;

      if (conteudo) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("interacoes").insert({
          lead_id: id,
          tipo: "responsavel_alterado",
          conteudo,
          usuario_id: user?.id ?? null,
        });
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["interacoes", vars.id] });
      toast.success("Vendedor atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLeadCamposExtras() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, campos_extras,
    }: { id: string; campos_extras: Record<string, string | number | null> }) => {
      const { error } = await supabase
        .from("leads")
        .update({ campos_extras })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Informações salvas");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLeadCadastro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, cpf, status_cadastro,
    }: { id: string; cpf?: string | null; status_cadastro?: StatusCadastro }) => {
      const update: { cpf?: string | null; status_cadastro?: StatusCadastro } = {};
      if (cpf !== undefined) update.cpf = cpf;
      if (status_cadastro !== undefined) update.status_cadastro = status_cadastro;
      if (Object.keys(update).length === 0) return;
      const { error } = await supabase.from("leads").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLeadDados() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      nome?: string;
      fazenda?: string | null;
      telefone?: string | null;
      cidade?: string | null;
      estado?: string | null;
      tipo_cliente?: string | null;
      origem?: string | null;
      interesse?: string | null;
      endereco_propriedade?: string | null;
      inscricao_estadual?: string | null;
      nirf?: string | null;
      cib?: string | null;
      codigo_propriedade?: string | null;
    }) => {
      const { id, ...campos } = payload;
      if (Object.keys(campos).length === 0) return;
      const { error } = await supabase.from("leads").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Dados atualizados");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useExcluirLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete: marca o lead como excluído mas preserva o registro
      const { error } = await supabase
        .from("leads")
        .update({ deletado_em: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead excluído");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDocumentosLead(leadId: string | undefined) {
  return useQuery({
    queryKey: ["documentos-lead", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_lead")
        .select("*")
        .eq("lead_id", leadId!)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocumentoLead[];
    },
  });
}

export function useUploadDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, file }: { leadId: string; file: File }) => {
      if (file.size > 20 * 1024 * 1024) throw new Error("Arquivo maior que 20MB");
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Não autenticado");

      const safeName = file.name.replace(/[^\w.-]+/g, "_");
      const path = `${leadId}/${crypto.randomUUID()}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from("lead-documentos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("documentos_lead").insert({
        lead_id: leadId,
        nome: file.name,
        storage_path: path,
        tamanho_bytes: file.size,
        mime_type: file.type || null,
        enviado_por: userId,
      });
      if (insErr) {
        await supabase.storage.from("lead-documentos").remove([path]);
        throw insErr;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["documentos-lead", vars.leadId] });
      toast.success("Documento anexado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: DocumentoLead) => {
      const { error: stErr } = await supabase.storage
        .from("lead-documentos")
        .remove([doc.storage_path]);
      if (stErr) throw stErr;
      const { error: dbErr } = await supabase
        .from("documentos_lead")
        .delete()
        .eq("id", doc.id);
      if (dbErr) throw dbErr;
      return doc;
    },
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ["documentos-lead", doc.lead_id] });
      toast.success("Documento removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export async function getDocumentoUrl(storage_path: string) {
  const { data, error } = await supabase.storage
    .from("lead-documentos")
    .createSignedUrl(storage_path, 60 * 5);
  if (error) throw error;
  return data.signedUrl;
}

export function useUpdateLeadRespostasForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, respostas_formulario,
    }: { id: string; respostas_formulario: { pergunta: string; resposta: string }[] }) => {
      const { error } = await supabase
        .from("leads")
        .update({ respostas_formulario })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Respostas atualizadas");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMarcarPerdido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo, detalhes }: { id: string; motivo: string; detalhes?: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({
          etapa: "Perdido",
          motivo_perda: motivo,
          detalhes_perda: detalhes ?? null,
          entrou_etapa_em: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      const conteudo = detalhes && detalhes.trim()
        ? `Marcado como perdido: ${motivo} — ${detalhes.trim()}`
        : `Marcado como perdido: ${motivo}`;
      await supabase.from("interacoes").insert({ lead_id: id, tipo: "perda", conteudo });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead marcado como perdido");
    },
  });
}

/* ============= ATRIBUTOS PERSONALIZADOS (catálogo global) ============= */

export type AtributoPersonalizado = {
  id: string;
  chave: string;
  label: string;
  ordem: number;
  ativo: boolean;
  opcoes?: string[];
};

export function useAtributosPersonalizados() {
  return useQuery({
    queryKey: ["atributos_personalizados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atributos_personalizados" as never)
        .select("*")
        .eq("ativo", true)
        .order("ordem")
        .order("label");
      if (error) throw error;
      return (data ?? []) as unknown as AtributoPersonalizado[];
    },
  });
}

function slugAttr(label: string) {
  const base = label
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
    .slice(0, 50);
  return "attr_" + (base || `c${Date.now()}`);
}

export function useCriarAtributo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ label, chave }: { label: string; chave?: string }) => {
      const k = chave?.trim() || slugAttr(label);
      const { data, error } = await supabase
        .from("atributos_personalizados" as never)
        .insert({ chave: k, label: label.trim(), ordem: 50 } as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as AtributoPersonalizado;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atributos_personalizados"] });
      toast.success("Atributo criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRenomearAtributo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      const { error } = await supabase
        .from("atributos_personalizados" as never)
        .update({ label } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atributos_personalizados"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useExcluirAtributo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("atributos_personalizados" as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atributos_personalizados"] });
      toast.success("Atributo removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAtualizarOpcoesAtributo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, opcoes }: { id: string; opcoes: string[] }) => {
      const { error } = await supabase
        .from("atributos_personalizados" as never)
        .update({ opcoes } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atributos_personalizados"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ============= RESPOSTAS PRONTAS (perguntas livres do formulário) ============= */

export type RespostaPronta = { id: string; pergunta: string; resposta: string };

export function useRespostasProntas() {
  return useQuery({
    queryKey: ["respostas_prontas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("respostas_prontas" as never)
        .select("*")
        .order("pergunta")
        .order("resposta");
      if (error) throw error;
      return (data ?? []) as unknown as RespostaPronta[];
    },
  });
}

export function useCriarRespostaPronta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pergunta, resposta }: { pergunta: string; resposta: string }) => {
      const { error } = await supabase
        .from("respostas_prontas" as never)
        .insert({ pergunta: pergunta.trim(), resposta: resposta.trim() } as never);
      // ignora violação de unique
      if (error && !String(error.message).includes("duplicate")) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["respostas_prontas"] });
      toast.success("Resposta pronta salva");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useExcluirRespostaPronta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("respostas_prontas" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["respostas_prontas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ============= MOTIVOS DE PERDA ============= */

export function useMotivosPerda() {
  return useQuery({
    queryKey: ["motivos_perda"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("motivos_perda" as never)
        .select("*")
        .eq("ativo", true)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; nome: string; ordem: number; ativo: boolean }[];
    },
  });
}

export function useCriarMotivoPerda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nome: string) => {
      const { error } = await supabase.from("motivos_perda" as never).insert({ nome, ordem: 50 } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["motivos_perda"] });
      toast.success("Motivo adicionado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useExcluirMotivoPerda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("motivos_perda" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["motivos_perda"] });
      toast.success("Motivo removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ============= VENDAS ============= */

export function useVendas() {
  return useQuery({
    queryKey: ["vendas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendas").select("*").order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Venda[];
    },
  });
}

export function useVendasByLead(leadId: string | undefined) {
  return useQuery({
    queryKey: ["vendas", "lead", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from("vendas").select("*").eq("lead_id", leadId).order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Venda[];
    },
    enabled: !!leadId,
  });
}

export function useCriarVenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (venda: Omit<Venda, "id" | "criado_em">) => {
      const { data, error } = await supabase.from("vendas").insert(venda).select("id").single();
      if (error) throw error;
      // registra interação no lead
      if (venda.lead_id) {
        await supabase.from("interacoes").insert({
          lead_id: venda.lead_id,
          tipo: "venda",
          conteudo: `Venda registrada: ${venda.categoria} — R$ ${Number(venda.valor_total).toLocaleString("pt-BR")}`,
        });
      }
      return data?.id as string;
    },
    onSuccess: (vendaId) => {
      qc.invalidateQueries({ queryKey: ["vendas"] });
      qc.invalidateQueries({ queryKey: ["interacoes"] });
      toast.success("Venda registrada");
      // Gera contrato automaticamente em background
      if (vendaId) {
        (async () => {
          const tId = toast.loading("Gerando contrato automaticamente...");
          try {
            const { gerarContratoDaVenda } = await import("@/lib/contrato-auto");
            const c = await gerarContratoDaVenda(vendaId);
            qc.invalidateQueries({ queryKey: ["contratos_venda", vendaId] });
            qc.invalidateQueries({ queryKey: ["contratos_all"] });
            toast.success(`Contrato #${c.numero} gerado`, { id: tId });
          } catch (e) {
            toast.error("Contrato não gerado automaticamente", {
              id: tId,
              description: (e as Error).message,
            });
          }
        })();
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateVendaStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("vendas").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendas"] });
      toast.success("Status atualizado");
    },
  });
}

export function useUpdateVenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...campos }: { id: string } & Partial<Omit<Venda, "id" | "criado_em">>) => {
      const { error } = await supabase.from("vendas").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendas"] });
      toast.success("Venda atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteVenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendas"] });
      toast.success("Venda excluída");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateVendaPagamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      forma_pagamento?: string | null;
      tipo_parcelamento?: string | null;
      qtd_parcelas?: number | null;
      parcelamento_descricao?: string | null;
    }) => {
      const { id, ...campos } = payload;
      const { error } = await supabase.from("vendas").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendas"] });
      toast.success("Pagamento atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateVendaComissao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comissao_percentual }: { id: string; comissao_percentual: number | null }) => {
      const { error } = await supabase.from("vendas").update({ comissao_percentual }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendas"] });
      toast.success("Comissão atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useFollowUps(filtro?: "todos" | "pendentes" | "vencidos" | "feitos") {
  return useQuery({
    queryKey: ["followups", filtro ?? "todos"],
    queryFn: async () => {
      let q = supabase.from("follow_ups").select("*").order("data_hora");
      if (filtro === "pendentes") q = q.eq("status", "pendente");
      if (filtro === "feitos") q = q.eq("status", "feito");
      if (filtro === "vencidos") q = q.eq("status", "pendente").lt("data_hora", new Date().toISOString());
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as FollowUp[];
    },
  });
}

export function useCriarFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fu: Omit<FollowUp, "id">) => {
      const { error } = await supabase.from("follow_ups").insert(fu);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followups"] });
      qc.invalidateQueries({ queryKey: ["followups-vencidos"] });
      toast.success("Tarefa criada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMarcarFollowUpFeito() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observacao }: { id: string; observacao?: string }) => {
      const { error } = await supabase
        .from("follow_ups")
        .update({ status: "feito", observacao: observacao ?? null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followups"] });
      qc.invalidateQueries({ queryKey: ["followups-vencidos"] });
      toast.success("Tarefa concluída");
    },
  });
}

/* ============= LEADS (busca e filtros gerais) ============= */

export function useTodosLeads() {
  return useQuery({
    queryKey: ["todos-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads").select("*")
        .is("deletado_em", null)
        .order("criado_em", { ascending: false }).limit(10000);
      if (error) throw error;
      return (data ?? []) as unknown as Lead[];
    },
  });
}

export function useTodasInteracoes() {
  return useQuery({
    queryKey: ["todas-interacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interacoes")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as Interacao[];
    },
  });
}

/* ============= DISPAROS ============= */

export function useDisparos() {
  return useQuery({
    queryKey: ["disparos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disparos").select("*").order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Disparo[];
    },
  });
}

export function useCriarDisparo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (disparo: Omit<Disparo, "id" | "criado_em" | "total_enviados">) => {
      const { error } = await supabase.from("disparos").insert({
        ...disparo,
        total_enviados: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disparos"] });
      toast.success("Campanha criada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
