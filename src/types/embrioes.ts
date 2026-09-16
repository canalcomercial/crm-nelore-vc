/**
 * Catálogo de EMBRIÕES — tipos exclusivos.
 *
 * Um "lote" de embriões é um PACOTE: quantidade de embriões, garantia de
 * prenhezes, criatório e um ou mais ACASALAMENTOS (doadora × touro), cada um
 * com suas projeções genéticas (ANCP e PMGZ). Fica gravado na coluna
 * `animais.embriao` (jsonb) com `categoria = 'Embrião'`, sem alterar a
 * estrutura de fêmeas e touros.
 */

export type EmbriaoPessoa = { nome: string; registro?: string };

/** Uma característica ANCP projetada para o embrião (ex.: MGTe 42 · TOP 0,1). */
export type EmbriaoProjecao = { sigla: string; valor: string; top: string };

export type EmbriaoPmgz = { iabcz?: string; deca?: string; p?: string };

export type EmbriaoAcasalamento = {
  /** Embriões deste acasalamento dentro do pacote (quando o pacote mistura acasalamentos). */
  quantidade?: number | null;
  doadoras: EmbriaoPessoa[];
  /** Pai da doadora (avô materno do embrião) */
  avos_maternos: EmbriaoPessoa[];
  /** Mãe da doadora (avó materna do embrião) */
  avos_maternas?: EmbriaoPessoa[];
  touros: EmbriaoPessoa[];
  /** Pai do touro (avô paterno do embrião) */
  avos_paternos?: EmbriaoPessoa[];
  /** Mãe do touro (avó paterna do embrião) */
  avos_paternas?: EmbriaoPessoa[];
  livre_acasalamento?: boolean;
  /** Nota do acasalamento (ex.: "*Touro com comprovada qualidade de sêmen de central"). */
  observacao?: string;
  ancp: EmbriaoProjecao[];
  pmgz: EmbriaoPmgz;
};

export type EmbriaoDados = {
  quantidade: number | null;
  /** DT, FIV, IN VITRO… */
  tipo: string;
  garantia_prenhezes: number | null;
  garantia_percentual: number | null;
  raca?: string;
  /** Convencional, Sexado de Fêmea, Sexado de Macho */
  semen?: string;
  criatorio?: string;
  logo_url?: string;
  valor_embriao?: number | null;
  valor_pacote?: number | null;
  parcelas?: number | null;
  condicoes?: string;
  observacoes?: string;
  /** Pré-requisitos / regras da garantia de prenhez */
  regras_garantia?: string;
  localizacao?: string;
  whatsapp?: string;
  instagram?: string;
  link_video?: string;
  link_video_doadora?: string;
  link_acasalamentos?: string;
  fotos?: string[];
  acasalamentos: EmbriaoAcasalamento[];
};

/** Ordem de exibição das projeções ANCP (a primeira fica em destaque). */
export const ANCP_SIGLAS = ["MGTe", "D3P", "DSTAY", "DPE365", "MP120", "DP210", "DP450", "DAOL", "DACAB", "DP365"] as const;

export type EventoTipo = "animais" | "embrioes";

/** Informações extras do evento exibidas na capa do catálogo de embriões. */
export type EventoDetalhes = {
  subtitulo?: string;
  data_fim?: string;
  horario?: string;
  local?: string;
  parcelas_destaque?: string;
  parcelas_detalhe?: string;
  link_playlist?: string;
  link_condicoes?: string;
  whatsapp?: string;
  instagram?: string;
  capa_url?: string;
};

export function ehCategoriaEmbriao(categoria?: string | null): boolean {
  return /embri/i.test(categoria ?? "");
}
