import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { ehCategoriaEmbriao, type EmbriaoDados, type EventoDetalhes, type EventoTipo } from "@/types/embrioes";

export type Animal = {
  id: string;
  nome: string;
  lote: string | null;
  categoria: string | null;
  raca: string | null;
  fazenda: string | null;
  iabcz: number | null;
  mgte: number | null;
  iqg: number | null;
  preco_total: number | null;
  parcelas: number | null;
  valor_parcela: number | null;
  link_video: string | null;
  foto_url: string | null;
  destaque: boolean;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  descricao_longa?: string | null;
  nascimento?: string | null;
  peso_kg?: number | null;
  localizacao?: string | null;
  fornecedor?: string | null;
  estado_reprodutivo?: string | null;
  previsao_parto?: string | null;
  pai_prenhez?: string | null;
  registrado_abcz?: boolean | null;
  pai?: string | null;
  mae?: string | null;
  avo_paterno_pai?: string | null;
  avo_paterno_mae?: string | null;
  avo_materno_pai?: string | null;
  avo_materno_mae?: string | null;
  avaliacoes?: AvaliacaoLinha[] | null;
  comissao_percentual?: number | null;
  evento_id?: string | null;
  /** macho | femea — define o bloco final da ficha (ventre x reprodutor) */
  sexo?: SexoAnimal | null;
  /** Registro exibido no cabeçalho da ficha (ex.: "VCA - 9335") */
  registro?: string | null;
  /** Circunferência escrotal em cm (touros) */
  ce_cm?: number | null;
  /** Blocos de avaliação genética no padrão do catálogo impresso */
  genetica?: GeneticaAnimal | null;
  /** Dados da planilha base erural sem coluna própria (lote, prenhez, cria) */
  ficha?: FichaAnimal | null;
  /** URL do lote na erural */
  link_erural?: string | null;
  /** URL do pré-lance */
  link_pre_lance?: string | null;
  /** Pacote de embriões (somente categoria Embrião) — ver src/types/embrioes.ts */
  embriao?: EmbriaoDados | null;
};

/** Lote de embriões usa a página exclusiva de embriões; fêmeas e touros seguem a ficha padrão. */
export function ehEmbriao(animal: Pick<Animal, "categoria" | "embriao"> | null | undefined): boolean {
  if (!animal) return false;
  return !!animal.embriao || ehCategoriaEmbriao(animal.categoria);
}

export type SexoAnimal = "macho" | "femea";

export type AvaliacaoLinha = { caracteristica: string; dep: string; deca: string };

/** Uma linha da tabela DEP / ÍNDICE / TOP de um bloco genético. */
export type GeneticaLinha = { dep: string; indice: string; top: string };

/** Um número em destaque no topo do bloco (ex.: iABCZ 27,42). */
export type GeneticaResumo = { label: string; valor: string };

export type GeneticaBloco = {
  resumo: GeneticaResumo[];
  linhas: GeneticaLinha[];
};

/** Informações do ventre (fêmeas prenhes) exibidas no rodapé da ficha. */
export type GeneticaVentre = { iabcz?: string; deca?: string; mgte?: string; top_mgte?: string };

/** Blocos da planilha base erural que não têm coluna própria. */
export type FichaComercial = {
  fornecedor?: string; uf?: string; cidade?: string;
  preco_inicial?: number; certificado_erural?: boolean; percentual_comercializado?: number;
  tipo?: string; tipo_genetica?: string; especie?: string;
  idade?: string; quantidade?: number; org?: string; csg?: string; ceip?: string;
  utm_video?: string; utm_pl?: string; drive?: string;
};

export type FichaPrenhez = {
  status?: string; data_inseminacao?: string;
  formato_acasalamento?: string; oocitos?: number; embrioes?: number;
};

/** Cria ao pé — bezerro(a) acompanhando a matriz no lote. */
export type FichaCria = {
  registro?: string; pai?: string; nascimento?: string; sexo?: string;
  iabcz?: string; deca?: string; mgte?: string; top_mgte?: string;
};

export type FichaAnimal = {
  comercial?: FichaComercial;
  prenhez?: FichaPrenhez;
  cria?: FichaCria;
  extras?: { observacoes?: string };
};

export type GeneticaAnimal = {
  pmgz?: GeneticaBloco;
  ancp?: GeneticaBloco;
  geneplus?: GeneticaBloco;
  ventre?: GeneticaVentre;
};

export type GeneticaFonte = "pmgz" | "ancp" | "geneplus";

/** Rótulos de resumo esperados por fonte — usados como esqueleto no admin. */
export const GENETICA_RESUMO_PADRAO: Record<GeneticaFonte, string[]> = {
  pmgz: ["iABCZ", "DECA", "P%"],
  ancp: ["MGTe", "TOP"],
  geneplus: ["IQG", "TOP"],
};

export const GENETICA_FONTES: { id: GeneticaFonte; nome: string }[] = [
  { id: "pmgz", nome: "PMGZ" },
  { id: "ancp", nome: "ANCP" },
  { id: "geneplus", nome: "GenePlus" },
];

export function blocoGeneticoVazio(fonte: GeneticaFonte): GeneticaBloco {
  return {
    resumo: GENETICA_RESUMO_PADRAO[fonte].map((label) => ({ label, valor: "" })),
    linhas: [],
  };
}

export function blocoTemDados(b?: GeneticaBloco | null): boolean {
  if (!b) return false;
  const temResumo = (b.resumo ?? []).some((r) => (r.valor ?? "").trim() !== "");
  const temLinhas = (b.linhas ?? []).some(
    (l) => (l.dep ?? "").trim() !== "" || (l.indice ?? "").trim() !== "" || (l.top ?? "").trim() !== "",
  );
  return temResumo || temLinhas;
}

/**
 * Sexo efetivo do animal: usa o campo explícito e, quando ausente, infere pela
 * categoria e depois pelos próprios dados — CE (circunferência escrotal) só
 * existe em macho e prenhez só em fêmea.
 */
export function sexoDoAnimal(
  animal: Pick<Animal, "sexo" | "categoria" | "ce_cm" | "pai_prenhez" | "previsao_parto">,
): SexoAnimal | null {
  if (animal.sexo === "macho" || animal.sexo === "femea") return animal.sexo;
  const cat = (animal.categoria ?? "").toLowerCase();
  if (/^(touro|garrote|reprodutor|bezerro)/.test(cat)) return "macho";
  if (/^(matriz|novilha|vaca|bezerra|f[eê]mea)/.test(cat)) return "femea";
  if (animal.ce_cm != null) return "macho";
  if (animal.pai_prenhez || animal.previsao_parto) return "femea";
  return null;
}
export type FaqItem = { titulo: string; conteudo: string };

export type Evento = {
  id: string;
  nome: string;
  data: string | null;
  descricao: string | null;
  ativo: boolean;
  criado_em: string;
  /** animais (padrão) | embrioes — evento de embriões abre o catálogo exclusivo de embriões */
  tipo?: EventoTipo | null;
  detalhes?: EventoDetalhes | null;
};

export type Configuracao = {
  id: string;
  whatsapp: string | null;
  mensagem_padrao: string | null;
  layout?: CatalogoLayout | null;
  faq?: FaqItem[] | null;
};

export type CatalogoLayout = {
  colunas_desktop: 2 | 3 | 4;
  colunas_tablet: 1 | 2 | 3;
  colunas_mobile: 1 | 2;
  estilo_card: "padrao" | "compacto" | "ampliado";
  mostrar_indices: boolean;
  mostrar_preco: boolean;
  mostrar_categoria: boolean;
  mostrar_lote_badge: boolean;
  botao_interesse_texto: string;
  botao_video_texto: string;
  texto_contador_singular: string;
  texto_contador_plural: string;
  titulo_secao_animais: string;
  texto_sobre_titulo: string;
  texto_sobre_corpo: string;
  /** Cabeçalho do topo do catálogo (usado quando não há evento selecionado). */
  hero_kicker?: string;
  hero_titulo?: string;
  hero_subtitulo?: string;

  cor_primary: string;
  cor_bg: string;
  /** Cor de destaque (CTAs e realces). Padrão: vermelho Nelore VC. */
  cor_accent?: string;
  /**
   * Lista, no fim da ficha do animal, todos os campos importados da planilha
   * que não têm lugar fixo no layout do catálogo. Desligado por padrão — a
   * ficha fica limpa, no formato do catálogo impresso; ligue quando quiser a
   * conferência campo a campo do que foi importado.
   */
  mostrar_ficha_completa?: boolean;
};

export const LAYOUT_PADRAO: CatalogoLayout = {
  colunas_desktop: 3,
  colunas_tablet: 2,
  colunas_mobile: 1,
  estilo_card: "padrao",
  mostrar_indices: true,
  mostrar_preco: true,
  mostrar_categoria: true,
  mostrar_lote_badge: true,
  botao_interesse_texto: "Tenho interesse",
  botao_video_texto: "Ver vídeo",
  texto_contador_singular: "animal disponível",
  texto_contador_plural: "animais disponíveis",
  titulo_secao_animais: "Animais",
  texto_sobre_titulo: "Sobre a Nelore VC",
  texto_sobre_corpo:
    "Trabalhamos com genética Nelore de alto padrão, com foco em índices de performance e qualidade comprovada.",
  hero_kicker: "Catálogo",
  hero_titulo: "Genética Nelore de Elite",
  hero_subtitulo: "Animais selecionados para o melhoramento do seu rebanho.",

  cor_primary: "207 20% 9%",
  cor_accent: "358 92% 42%",
  cor_bg: "210 12% 96%",
  mostrar_ficha_completa: false,
};

/** Ordena lotes em sequência numérica natural (1, 2, 10) em vez de alfabética. */
export function ordenarPorLote<T extends { lote?: string | null }>(lista: T[]): T[] {
  const chave = (l?: string | null) => {
    const m = String(l ?? "").match(/\d+/);
    return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER;
  };
  return [...lista].sort((a, b) => {
    const d = chave(a.lote) - chave(b.lote);
    if (d !== 0) return d;
    return String(a.lote ?? "").localeCompare(String(b.lote ?? ""), "pt-BR", { numeric: true });
  });
}

export function useAnimais(opts?: { apenasAtivos?: boolean }) {
  return useQuery({
    queryKey: ["animais", opts?.apenasAtivos ?? false],
    queryFn: async () => {
      let q = supabase.from("animais").select("*").order("destaque", { ascending: false }).order("lote", { ascending: true });
      if (opts?.apenasAtivos) q = q.eq("ativo", true);
      const { data, error } = await q;
      if (error) throw error;
      return ordenarPorLote((data ?? []) as unknown as Animal[]);
    },
  });
}

export function useAnimal(id: string | undefined) {
  return useQuery({
    queryKey: ["animal", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("animais").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as unknown as Animal | null;
    },
  });
}

export function useOutrosLotes(animalId: string | undefined, limit = 8) {
  return useQuery({
    queryKey: ["outros-lotes", animalId],
    enabled: !!animalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("animais")
        .select("*")
        .eq("ativo", true)
        .neq("id", animalId!)
        .order("destaque", { ascending: false })
        .order("lote", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return ordenarPorLote((data ?? []) as unknown as Animal[]);
    },
  });
}

export function useEventoAtivo() {
  return useQuery({
    queryKey: ["evento-ativo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("eventos").select("*").eq("ativo", true).order("criado_em", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data as Evento | null;
    },
  });
}

export function useEventosAtivos() {
  return useQuery({
    queryKey: ["eventos-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventos")
        .select("*")
        .eq("ativo", true)
        .order("data", { ascending: true, nullsFirst: false })
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Evento[];
    },
  });
}

export function useEvento(id: string | null | undefined) {
  return useQuery({
    queryKey: ["evento", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("eventos").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as unknown as Evento | null;
    },
  });
}

export function useEventos() {
  return useQuery({
    queryKey: ["eventos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("eventos").select("*").order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Evento[];
    },
  });
}

export function useAnimaisPorEvento(eventoId: string | undefined) {
  return useQuery({
    queryKey: ["animais-por-evento", eventoId],
    enabled: !!eventoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("animais")
        .select("*")
        .eq("evento_id", eventoId!)
        .eq("ativo", true)
        .order("lote", { ascending: true });
      if (error) throw error;
      return ordenarPorLote((data ?? []) as unknown as Animal[]);
    },
  });
}

export function useAtualizarAnimaisEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventoId, animalIds }: { eventoId: string; animalIds: string[] }) => {
      // Desassocia os que estavam neste evento e não estão mais selecionados
      const { data: atuais, error: e1 } = await supabase
        .from("animais").select("id").eq("evento_id", eventoId);
      if (e1) throw e1;
      const atuaisIds = (atuais ?? []).map((a) => a.id as string);
      const remover = atuaisIds.filter((id) => !animalIds.includes(id));
      const adicionar = animalIds.filter((id) => !atuaisIds.includes(id));
      if (remover.length) {
        const { error } = await supabase.from("animais").update({ evento_id: null } as never).in("id", remover);
        if (error) throw error;
      }
      if (adicionar.length) {
        const { error } = await supabase.from("animais").update({ evento_id: eventoId } as never).in("id", adicionar);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["animais"] });
      qc.invalidateQueries({ queryKey: ["animais-por-evento", v.eventoId] });
      toast.success("Animais do evento atualizados");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao atualizar animais do evento"),
  });
}

export function useConfiguracao() {
  return useQuery({
    queryKey: ["configuracao"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as unknown as Configuracao | null;
    },
  });
}

const COLUNAS_ANIMAL = [
  "nome","lote","categoria","raca","fazenda","iabcz","mgte","iqg","preco_total","parcelas",
  "valor_parcela","link_video","foto_url","destaque","ativo","descricao_longa","nascimento",
  "peso_kg","localizacao","fornecedor","estado_reprodutivo","previsao_parto","pai_prenhez",
  "registrado_abcz","pai","mae","avo_paterno_pai","avo_paterno_mae","avo_materno_pai",
  "avo_materno_mae","avaliacoes","comissao_percentual","evento_id","sexo","registro","ce_cm",
  "genetica","link_erural","link_pre_lance","ficha","embriao",
] as const;

function payloadAnimal(a: Partial<Animal>): TablesInsert<"animais"> {
  const out: Record<string, unknown> = {};
  const src = a as Record<string, unknown>;
  for (const k of COLUNAS_ANIMAL) if (k in src) out[k] = src[k] === "" ? null : src[k];
  return out as TablesInsert<"animais">;
}

export function useSalvarAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: Partial<Animal> & { id?: string }) => {
      const payload = payloadAnimal(a);
      if (a.id) {
        const { error } = await supabase.from("animais").update(payload as TablesUpdate<"animais">).eq("id", a.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("animais").insert(payload);
        if (error) throw error;
      }
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["animais"] });
      toast.success("Animal salvo");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao salvar"),
  });
}

export function useExcluirAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("animais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["animais"] });
      toast.success("Animal excluído");
    },
    onError: (e: Error) => toast.error(e.message || "Erro"),
  });
}

export function useToggleAtivoAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("animais").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["animais"] }),
  });
}

export function useSalvarEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: Partial<Evento> & { id?: string }) => {
      if (e.id) {
        const { id, ...rest } = e;
        const { error } = await supabase.from("eventos").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("eventos").insert(e as TablesInsert<"eventos">);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eventos"] });
      qc.invalidateQueries({ queryKey: ["evento-ativo"] });
      qc.invalidateQueries({ queryKey: ["eventos-ativos"] });
      toast.success("Evento salvo");
    },
    onError: (e: Error) => toast.error(e.message || "Erro"),
  });
}

export function useExcluirEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("eventos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eventos"] });
      qc.invalidateQueries({ queryKey: ["evento-ativo"] });
    },
  });
}

export function useSalvarConfiguracao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Partial<Configuracao>) => {
      const { data: existente } = await supabase.from("configuracoes").select("id").limit(1).maybeSingle();
      if (existente?.id) {
        const { error } = await supabase.from("configuracoes").update(c as TablesUpdate<"configuracoes">).eq("id", existente.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("configuracoes").insert(c as TablesInsert<"configuracoes">);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["configuracao"] });
      toast.success("Configurações salvas");
    },
    onError: (e: Error) => toast.error(e.message || "Erro"),
  });
}

export async function uploadFotoAnimal(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("animais-fotos").upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const { data, error: se } = await supabase.storage.from("animais-fotos").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (se) throw se;
  return data.signedUrl;
}

export function buildWhatsappLink(whatsapp: string, mensagem: string, animal: Animal) {
  const num = (whatsapp ?? "").replace(/\D/g, "");
  const msg = (mensagem ?? "Olá! Tenho interesse no {nome} - Lote {lote}.")
    .split("{nome}").join(animal.nome ?? "")
    .split("{lote}").join(animal.lote ?? "-");
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

export function youtubeEmbedUrl(link?: string | null): string | null {
  if (!link) return null;
  try {
    const u = new URL(link);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.searchParams.get("v")) return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    if (u.pathname.startsWith("/embed/")) return link;
    if (u.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
  } catch { /* ignore */ }
  return null;
}
