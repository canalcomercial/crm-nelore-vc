import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PilarConteudo = { titulo: string; descricao: string; icone?: string };
export type DepoimentoConteudo = { nome: string; texto: string };
export type FaqConteudo = { pergunta: string; resposta: string };

export type HeroMidiaTipo = "imagem" | "video_arquivo" | "youtube_live";
export type HeroMidia = {
  tipo: HeroMidiaTipo;
  url?: string;
  poster?: string;
  video_id?: string;
  ativo?: boolean;
  badge_texto?: string;
  titulo_live?: string;
};

export type PaginaConteudo = {
  hero: {
    titulo: string; subtitulo: string; cta_primario: string; cta_secundario: string;
    imagem_url?: string;
    midia?: HeroMidia;
    botoes?: BotaoConfig[];
  };
  sobre: { titulo: string; texto: string; imagem_url?: string };
  pilares: PilarConteudo[];
  depoimentos: DepoimentoConteudo[];
  faq: FaqConteudo[];
  rodape: { whatsapp: string; email: string; endereco: string; instagram?: string; mensagem_padrao: string };
  secoes_ordem?: SecaoId[];
  secoes_visiveis?: Partial<Record<SecaoId, boolean>>;
  /** Conteúdo dos blocos de vídeo, por posição. */
  videos?: Partial<Record<BlocoVideoId, SecaoVideo>>;
  evento_botoes?: BotaoConfig[];
  cta_final?: { titulo?: string; texto?: string; botoes?: BotaoConfig[] };
};

export type SecaoId =
  | "sobre"
  | "video"
  | "evento"
  | "lotes"
  | "video_2"
  | "pilares"
  | "depoimentos"
  | "faq"
  | "cta_final";

export const SECOES_DISPONIVEIS: { id: SecaoId; label: string }[] = [
  { id: "sobre", label: "Sobre" },
  { id: "video", label: "Vídeos (bloco 1)" },
  { id: "evento", label: "Próximo evento" },
  { id: "lotes", label: "Lotes em destaque" },
  { id: "video_2", label: "Vídeos (bloco 2)" },
  { id: "pilares", label: "Pilares de valor" },
  { id: "depoimentos", label: "Depoimentos" },
  { id: "faq", label: "Perguntas frequentes" },
  { id: "cta_final", label: "Chamada final (CTA)" },
];

/** Blocos de vídeo que podem ser colocados em qualquer ponto da página. */
export type BlocoVideoId = "video" | "video_2";

export const BLOCOS_VIDEO: { id: BlocoVideoId; label: string }[] = [
  { id: "video", label: "Vídeos (bloco 1)" },
  { id: "video_2", label: "Vídeos (bloco 2)" },
];

export type VideoItem = {
  id: string;
  titulo?: string;
  descricao?: string;
  /** youtube = usa video_id; arquivo = usa url (mp4 etc.) */
  tipo: "youtube" | "arquivo";
  video_id?: string;
  url?: string;
  poster?: string;
  /** Mostra o selo "AO VIVO" e ativa o autoplay do embed. */
  ao_vivo?: boolean;
};

export type SecaoVideo = {
  titulo?: string;
  descricao?: string;
  itens: VideoItem[];
};

/** Extrai o ID do vídeo de qualquer formato de link do YouTube. */
export function youtubeIdDaUrl(url?: string | null): string | null {
  if (!url) return null;
  const s = url.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}

export type BotaoAcao =
  | { tipo: "lead"; mensagem_sugerida?: string; origem_secao?: string }
  | { tipo: "link"; url: string; nova_aba?: boolean }
  | { tipo: "ancora"; secao_id: SecaoId | "top" }
  | { tipo: "whatsapp"; numero?: string; mensagem?: string }
  | { tipo: "rota"; path: string };

export type BotaoVariante = "primary" | "outline" | "ghost" | "branco";

export type BotaoConfig = {
  id: string;
  label: string;
  variante: BotaoVariante;
  acao: BotaoAcao;
  icone?: string;
};

export type FontConfig = { family: string; weights: number[] };

export type PaginaTema = {
  cor_primaria: string;
  cor_fundo: string;
  cor_texto: string;
  cor_accent?: string;
  cor_muted?: string;
  radius: string;
  font_heading?: FontConfig;
  font_body?: FontConfig;
  escala?: "compacta" | "padrao" | "ampla";
  sombras?: "nenhuma" | "suave" | "marcante";
};

export type PaginaComercialConfig = {
  id: string;
  conteudo: PaginaConteudo;
  tema: PaginaTema;
  conteudo_draft: PaginaConteudo | null;
  tema_draft: PaginaTema | null;
  publicado_em: string | null;
  publicado_por: string | null;
  funil_id: string | null;
  etapa_inicial: string | null;
  responsavel_padrao_id: string | null;
  ativo: boolean;
};

const PAGINA_CONFIG_QUERY_KEY = ["pagina-comercial-config"] as const;
const PAGINA_PUBLIC_CONFIG_QUERY_KEY = ["pagina-comercial-config-public"] as const;

type QueryToggle = { enabled?: boolean };

export function usePaginaConfig(options?: QueryToggle) {
  return useQuery({
    queryKey: PAGINA_CONFIG_QUERY_KEY,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagina_comercial_config")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as PaginaComercialConfig | null;
    },
  });
}

export function usePaginaPublicConfig(options?: QueryToggle) {
  return useQuery({
    queryKey: PAGINA_PUBLIC_CONFIG_QUERY_KEY,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagina_comercial_config_public")
        .select("id, conteudo, tema, publicado_em, publicado_por, funil_id, etapa_inicial, responsavel_padrao_id, ativo")
        .eq("ativo", true)
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        conteudo_draft: null,
        tema_draft: null,
      } as unknown as PaginaComercialConfig;
    },
  });
}

export function useSalvarPaginaConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<PaginaComercialConfig> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase
        .from("pagina_comercial_config")
        .update(rest as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAGINA_CONFIG_QUERY_KEY });
      qc.invalidateQueries({ queryKey: PAGINA_PUBLIC_CONFIG_QUERY_KEY });
      toast.success("Página comercial atualizada");
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao salvar"),
  });
}

/** Salva o rascunho sem publicar. Silencioso (sem toast) para autosave. */
export function useSalvarDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; conteudo_draft: PaginaConteudo; tema_draft: PaginaTema }) => {
      const { id, ...rest } = payload;
      const { error } = await supabase
        .from("pagina_comercial_config")
        .update(rest as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PAGINA_CONFIG_QUERY_KEY }),
    onError: (e: Error) => toast.error(e.message ?? "Erro ao salvar rascunho"),
  });
}

/** Publica: copia draft -> publicado. */
export function usePublicarDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; conteudo_draft: PaginaConteudo; tema_draft: PaginaTema }) => {
      const { data: sess } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("pagina_comercial_config")
        .update({
          conteudo: payload.conteudo_draft as never,
          tema: payload.tema_draft as never,
          conteudo_draft: payload.conteudo_draft as never,
          tema_draft: payload.tema_draft as never,
          publicado_em: new Date().toISOString(),
          publicado_por: sess.user?.id ?? null,
        } as never)
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAGINA_CONFIG_QUERY_KEY });
      qc.invalidateQueries({ queryKey: PAGINA_PUBLIC_CONFIG_QUERY_KEY });
      toast.success("Alterações publicadas");
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao publicar"),
  });
}

/** Descarta rascunho: copia publicado -> rascunho. */
export function useDescartarDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; conteudo: PaginaConteudo; tema: PaginaTema }) => {
      const { error } = await supabase
        .from("pagina_comercial_config")
        .update({
          conteudo_draft: payload.conteudo as never,
          tema_draft: payload.tema as never,
        } as never)
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAGINA_CONFIG_QUERY_KEY });
      toast.success("Rascunho descartado");
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao descartar"),
  });
}

// ---------------------- Mídia (bucket pagina-comercial-midia) ----------------------

const MIDIA_BUCKET = "pagina-comercial-midia";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5; // 5 anos

export type MidiaItem = {
  nome: string;
  path: string;
  url: string;
  tipo: "imagem" | "video" | "outro";
  tamanho: number;
  criado_em: string;
};

function detectarTipo(nome: string): MidiaItem["tipo"] {
  const ext = nome.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext)) return "imagem";
  if (["mp4", "webm", "mov"].includes(ext)) return "video";
  return "outro";
}

export function useListarMidia() {
  return useQuery({
    queryKey: ["pagina-midia"],
    queryFn: async () => {
      const { data: files, error } = await supabase.storage
        .from(MIDIA_BUCKET)
        .list("public", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      const items = await Promise.all((files ?? []).filter((f) => f.name && !f.name.startsWith(".")).map(async (f) => {
        const path = `public/${f.name}`;
        const { data: signed } = await supabase.storage.from(MIDIA_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
        return {
          nome: f.name,
          path,
          url: signed?.signedUrl ?? "",
          tipo: detectarTipo(f.name),
          tamanho: (f.metadata as { size?: number } | null)?.size ?? 0,
          criado_em: f.created_at ?? "",
        } satisfies MidiaItem;
      }));
      return items;
    },
  });
}

export function useUploadMidia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<MidiaItem> => {
      const isImg = file.type.startsWith("image/");
      const isVid = file.type.startsWith("video/");
      if (!isImg && !isVid) throw new Error("Apenas imagens ou vídeos são permitidos");
      const maxImg = 5 * 1024 * 1024;
      const maxVid = 1024 * 1024 * 1024;
      if (isImg && file.size > maxImg) throw new Error("Imagem excede 5MB");
      if (isVid && file.size > maxVid) throw new Error("Vídeo excede 1GB");

      const safe = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/-+/g, "-");
      const path = `public/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from(MIDIA_BUCKET).upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: file.type,
      });
      if (error) throw error;
      const { data: signed, error: signErr } = await supabase.storage.from(MIDIA_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
      if (signErr) throw signErr;
      return {
        nome: safe, path, url: signed.signedUrl,
        tipo: isImg ? "imagem" : "video",
        tamanho: file.size, criado_em: new Date().toISOString(),
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagina-midia"] });
      toast.success("Arquivo enviado");
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro no upload"),
  });
}

export function useDeletarMidia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (path: string) => {
      const { error } = await supabase.storage.from(MIDIA_BUCKET).remove([path]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagina-midia"] });
      toast.success("Arquivo removido");
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao remover"),
  });
}

export type LeadPaginaRow = {
  id: string;
  nome: string;
  telefone: string | null;
  interesse: string | null;
  observacoes: string | null;
  origem: string | null;
  criado_em: string;
  campos_extras: Record<string, unknown>;
  responsavel_nome: string | null;
  etapa: string | null;
};

export function useLeadsPagina() {
  return useQuery({
    queryKey: ["leads-pagina-comercial"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, nome, telefone, interesse, observacoes, origem, criado_em, campos_extras, responsavel_nome, etapa")
        .eq("origem", "pagina_comercial")
        .is("deletado_em", null)
        .order("criado_em", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as LeadPaginaRow[];
    },
  });
}

export function useLeadsPaginaRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("leads-pagina-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => {
          qc.invalidateQueries({ queryKey: ["leads-pagina-comercial"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

export async function enviarLeadPaginaComercial(payload: {
  nome: string;
  telefone: string;
  email?: string;
  mensagem?: string;
  animal_id?: string | null;
  animal_nome?: string | null;
  animal_lote?: string | null;
  evento_id?: string | null;
  origem_secao?: string | null;
}) {
  const { data, error } = await supabase.functions.invoke("pagina-comercial-lead", {
    body: payload,
  });
  if (error) throw error;
  return data as { ok: boolean; lead_id: string };
}