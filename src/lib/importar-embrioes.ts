import * as XLSX from "xlsx";
import { normalizarCabecalho, numero } from "./importar-erural";
import {
  ANCP_SIGLAS,
  type EmbriaoAcasalamento,
  type EmbriaoDados,
  type EmbriaoPessoa,
  type EmbriaoProjecao,
} from "@/types/embrioes";

/**
 * Planilha EXCLUSIVA de embriões.
 *
 * Uma linha por acasalamento. Linhas com o mesmo LOTE formam um único pacote
 * (o primeiro preenchimento de cada campo do pacote vale). Uma linha sem LOTE
 * logo abaixo de um pacote é tratada como mais um acasalamento desse pacote.
 * Vários nomes numa célula (doadoras, touros) podem ser separados por ";" ou
 * quebra de linha — o registro correspondente segue a mesma ordem.
 */

export type ColunaEmbriao = { grupo: string; campo: string; chave: string; alias?: string[]; ajuda?: string };

const ANCP_COLUNAS: ColunaEmbriao[] = ANCP_SIGLAS.flatMap((s) => [
  { grupo: "PROJEÇÕES ANCP", campo: s, chave: `ancp:${s}` },
  { grupo: "PROJEÇÕES ANCP", campo: `TOP ${s}`, chave: `ancptop:${s}`, alias: [`TOP_${s}`, `TOP% ${s}`, `TOP %${s}`, `${s} TOP`, `${s} TOP%`, `${s}_TOP`, `TOP ${s}%`] },
]);

export const EMBRIOES_COLUNAS: ColunaEmbriao[] = [
  { grupo: "PACOTE", campo: "LOTE", chave: "lote", alias: ["PACOTE", "Nº LOTE", "N LOTE"] },
  { grupo: "PACOTE", campo: "NOME DO PACOTE", chave: "nome", alias: ["TITULO", "TÍTULO", "NOME PACOTE", "PACOTE DE"] },
  { grupo: "PACOTE", campo: "CRIATÓRIO", chave: "criatorio", alias: ["CRIATORIO", "VENDEDOR", "FORNECEDOR", "FAZENDA"] },
  { grupo: "PACOTE", campo: "LOGO CRIATÓRIO (URL)", chave: "logo_url", alias: ["LOGO", "LOGO URL"] },
  { grupo: "PACOTE", campo: "QTD EMBRIÕES", chave: "quantidade", alias: ["QUANTIDADE", "EMBRIOES", "QTD EMBRIOES DO PACOTE", "EMBRIOES DT", "N EMBRIOES", "Nº EMBRIOES", "QTD", "QTDE", "QTDE EMBRIOES", "QUANTIDADE DE EMBRIOES", "EMBRIOES NO PACOTE"] },
  { grupo: "PACOTE", campo: "TIPO EMBRIÃO", chave: "tipo", alias: ["TIPO EMBRIAO", "TIPO"] },
  { grupo: "PACOTE", campo: "GARANTIA PRENHEZES", chave: "garantia_prenhezes", alias: ["GARANTIA", "PRENHEZES GARANTIDAS"] },
  { grupo: "PACOTE", campo: "GARANTIA %", chave: "garantia_percentual", alias: ["GARANTIA PERCENTUAL", "% GARANTIA"] },
  { grupo: "PACOTE", campo: "RAÇA", chave: "raca", alias: ["RACA"] },
  { grupo: "PACOTE", campo: "CIDADE/UF", chave: "localizacao", alias: ["LOCALIZACAO", "CIDADE", "LOCAL", "CIDADE UF"] },
  { grupo: "PACOTE", campo: "SÊMEN", chave: "semen", alias: ["SEMEN", "TIPO SEMEN"] },
  { grupo: "COMERCIAL", campo: "VALOR POR EMBRIÃO", chave: "valor_embriao", alias: ["VALOR EMBRIAO", "PRECO EMBRIAO"] },
  { grupo: "COMERCIAL", campo: "VALOR DO PACOTE", chave: "valor_pacote", alias: ["VALOR PACOTE", "PRECO TOTAL", "VALOR TOTAL"] },
  { grupo: "COMERCIAL", campo: "PARCELAS", chave: "parcelas", alias: ["Nº PARCELAS", "QTD PARCELAS", "N PARCELAS", "Nº DE PARCELAS", "NUMERO DE PARCELAS", "PARCELAMENTO"] },
  { grupo: "COMERCIAL", campo: "CONDIÇÕES DE PAGAMENTO", chave: "condicoes", alias: ["CONDICOES", "CONDICOES DE PAGAMENTO", "PAGAMENTO"] },
  { grupo: "COMERCIAL", campo: "BÔNUS / OBSERVAÇÕES", chave: "observacoes", alias: ["OBSERVACOES", "OBS", "BONUS", "OBSERVACAO", "BONUS OBSERVACOES"] },
  { grupo: "COMERCIAL", campo: "REGRAS DA GARANTIA", chave: "regras_garantia", alias: ["PRE-REQUISITOS", "PRE REQUISITOS", "CONDICOES DA GARANTIA", "GARANTIA REGRAS"] },
  { grupo: "COMERCIAL", campo: "WHATSAPP CRIATÓRIO", chave: "whatsapp", alias: ["WHATSAPP", "TELEFONE", "CONTATO"] },
  { grupo: "COMERCIAL", campo: "INSTAGRAM CRIATÓRIO", chave: "instagram", alias: ["INSTAGRAM"] },
  { grupo: "MÍDIA", campo: "LINK VÍDEO", chave: "link_video", alias: ["LINK VIDEO", "LINK YOUTUBE", "VIDEO"] },
  { grupo: "MÍDIA", campo: "LINK VÍDEO DOADORA", chave: "link_video_doadora", alias: ["VIDEO DOADORA", "LINK VIDEO DOADORA"] },
  { grupo: "MÍDIA", campo: "LINK ACASALAMENTOS", chave: "link_acasalamentos", alias: ["LINK PDF ACASALAMENTOS"] },
  { grupo: "MÍDIA", campo: "FOTO DOADORA (URL)", chave: "fotos", alias: ["FOTO", "FOTO URL", "FOTOS"] },
  { grupo: "MÍDIA", campo: "DESTAQUE", chave: "destaque" },
  { grupo: "ACASALAMENTO", campo: "QTD NESTE ACASALAMENTO", chave: "acas_qtd", alias: ["EMBRIOES DESTE ACASALAMENTO", "QTD ACASALAMENTO"] },
  { grupo: "ACASALAMENTO", campo: "DOADORA", chave: "doadora", alias: ["DOADORAS", "MAE", "NOME DOADORA"] },
  { grupo: "ACASALAMENTO", campo: "REG DOADORA", chave: "reg_doadora", alias: ["REGISTRO DOADORA", "RGD DOADORA"] },
  { grupo: "ACASALAMENTO", campo: "AVÔ MATERNO", chave: "avo", alias: ["AVO MATERNO", "AVOS MATERNOS", "PAI DA DOADORA"] },
  { grupo: "ACASALAMENTO", campo: "REG AVÔ MATERNO", chave: "reg_avo", alias: ["REG AVO MATERNO", "REGISTRO AVO MATERNO"] },
  { grupo: "ACASALAMENTO", campo: "AVÓ MATERNA", chave: "avo_f", alias: ["AVO MATERNA", "MAE DA DOADORA"] },
  { grupo: "ACASALAMENTO", campo: "REG AVÓ MATERNA", chave: "reg_avo_f", alias: ["REG AVO MATERNA", "REGISTRO AVO MATERNA"] },
  { grupo: "ACASALAMENTO", campo: "ACASALAMENTO (TOURO)", chave: "touro", alias: ["TOURO", "TOUROS", "ACASALAMENTO", "TOURO UTILIZADO", "PAI"] },
  { grupo: "ACASALAMENTO", campo: "REG TOURO", chave: "reg_touro", alias: ["REGISTRO TOURO", "RGD TOURO", "REG ACASALAMENTO", "REGISTRO ACASALAMENTO"] },
  { grupo: "ACASALAMENTO", campo: "PAI DO TOURO", chave: "pai_touro", alias: ["AVO PATERNO", "PAI TOURO"] },
  { grupo: "ACASALAMENTO", campo: "REG PAI DO TOURO", chave: "reg_pai_touro", alias: ["REG AVO PATERNO", "REGISTRO AVO PATERNO"] },
  { grupo: "ACASALAMENTO", campo: "MÃE DO TOURO", chave: "mae_touro", alias: ["AVO PATERNA", "MAE TOURO"] },
  { grupo: "ACASALAMENTO", campo: "REG MÃE DO TOURO", chave: "reg_mae_touro", alias: ["REG AVO PATERNA", "REGISTRO AVO PATERNA"] },
  { grupo: "ACASALAMENTO", campo: "LIVRE ACASALAMENTO", chave: "livre", alias: ["LIVRE"] },
  { grupo: "ACASALAMENTO", campo: "OBS ACASALAMENTO", chave: "obs_acas", alias: ["OBSERVACAO ACASALAMENTO"] },
  ...ANCP_COLUNAS,
  { grupo: "PMGZ", campo: "iABCZ", chave: "iabcz", alias: ["IABCZ", "IABCZ EMBRIAO", "IABCZ PREVISTO"] },
  { grupo: "PMGZ", campo: "DECA", chave: "deca" },
  { grupo: "PMGZ", campo: "P%", chave: "p", alias: ["P %", "P", "PERCENTIL"] },
];

/* ------------------------------------------------------------------ */

function txt(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toLocaleDateString("pt-BR");
  return String(v).trim();
}

/** Número genético no padrão brasileiro (41.55 → "41,55"); texto é mantido. */
export function valorBR(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "number") return v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
  const s = String(v).trim();
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s).toLocaleString("pt-BR", { maximumFractionDigits: 3 });
  return s;
}

function sim(v: unknown): boolean {
  return /^(sim|s|x|true|1|verdadeiro|yes)$/i.test(txt(v));
}

function lista(v: unknown, separarVirgula = false): string[] {
  const re = separarVirgula ? /[;\n|,]+/ : /[;\n|]+/;
  return txt(v).split(re).map((s) => s.trim()).filter(Boolean);
}

function pessoas(nomes: unknown, registros: unknown, separarVirgula = false): EmbriaoPessoa[] {
  const ns = lista(nomes, separarVirgula);
  const rs = lista(registros, separarVirgula);
  if (ns.length === 0 && rs.length > 0) return rs.map((r) => ({ nome: r }));
  return ns.map((bruto, i) => {
    // "BETINA FIV (LCF 923)" → nome + registro
    const m = bruto.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    const nome = m ? m[1].trim() : bruto;
    const registro = rs[i] || (m ? m[2].trim() : "");
    return registro ? { nome, registro } : { nome };
  });
}

/**
 * Mapeia cabeçalhos fora do padrão pelo significado (ex.: "Embriões DT",
 * "Nº de parcelas", "NOME AVÔ MAT.", "RGD AVÓ PAT."). O texto original
 * (com acentos) é usado para diferenciar AVÔ (macho) de AVÓ (fêmea).
 */
function chavePorAproximacao(n: string, bruto = ""): string | null {
  const reg = /\b(REG|REGISTRO|RGD|RGN|RG)\b/.test(n);
  const femea = /AVÓ|AVÒ|AVÓS/i.test(bruto) || /\bMAE\b/.test(n);
  const avo = /\bAVO(S)?\b/.test(n);
  if (avo && /\bMAT/.test(n)) return femea ? (reg ? "reg_avo_f" : "avo_f") : reg ? "reg_avo" : "avo";
  if (avo && /\bPAT/.test(n)) return femea ? (reg ? "reg_mae_touro" : "mae_touro") : reg ? "reg_pai_touro" : "pai_touro";
  if (/EMBRI/.test(n) && /(QTD|QUANT|N |Nº|DT|PACOTE)/.test(n) && !/VALOR|PRECO|ACASALAMENTO/.test(n)) return "quantidade";
  if (/PARCEL/.test(n)) return "parcelas";
  if (/GARANTIA/.test(n) && /%|PERCENT/.test(n)) return "garantia_percentual";
  if (/GARANTIA/.test(n) && !/REGRA|REQUISITO|CONDIC/.test(n)) return "garantia_prenhezes";
  if (/VALOR|PRECO/.test(n) && /EMBRI/.test(n)) return "valor_embriao";
  if (/VALOR|PRECO/.test(n) && /PACOTE|TOTAL|LOTE/.test(n)) return "valor_pacote";
  if (reg && /DOADORA|\bMAE\b/.test(n)) return "reg_doadora";
  if (reg && /(TOURO|ACASAL|\bPAI\b)/.test(n)) return "reg_touro";
  if (/DOADORA/.test(n) && !/VIDEO|FOTO/.test(n)) return "doadora";
  if (/(TOURO|ACASALAMENTO)/.test(n) && !/LINK|QTD|OBS|LIVRE/.test(n)) return "touro";
  if (/CRIATORIO|VENDEDOR|FORNECEDOR/.test(n)) return "criatorio";
  if (/SEMEN|SEXAD/.test(n)) return "semen";
  if (/VIDEO|YOUTUBE/.test(n)) return "link_video";
  return null;
}

const INDICE_COLUNAS = (() => {
  const m = new Map<string, string>();
  for (const c of EMBRIOES_COLUNAS) {
    for (const nome of [c.campo, ...(c.alias ?? [])]) {
      const n = normalizarCabecalho(nome);
      if (!m.has(n)) m.set(n, c.chave);
    }
  }
  return m;
})();

function acharCabecalho(matriz: unknown[][]): number {
  // Escolhe, entre as primeiras linhas, a que tem mais colunas reconhecidas
  // (a linha de grupos "PACOTE | ACASALAMENTO | ANCP" fica de fora).
  let melhor = -1;
  let melhorPontos = 0;
  for (let i = 0; i < Math.min(matriz.length, 20); i++) {
    const norm = (matriz[i] ?? []).map(normalizarCabecalho).filter(Boolean);
    const temLote = norm.some((c) => /^(LOTE|PACOTE|N LOTE|Nº LOTE|LOTE Nº)$/.test(c));
    const temEmbriao = norm.some((c) => /DOADORA|EMBRI|ACASALAMENTO|^TOURO/.test(c));
    if (!temLote || !temEmbriao) continue;
    const pontos = norm.filter((c) => INDICE_COLUNAS.has(c) || chavePorAproximacao(c) || /^TOP ?%?$/.test(c)).length;
    if (pontos >= 3 && pontos > melhorPontos) { melhor = i; melhorPontos = pontos; }
  }
  return melhor;
}

export type ResultadoEmbrioes = {
  pacotes: Record<string, unknown>[];
  acasalamentos: number;
  ignoradas: number;
  colunasDesconhecidas: string[];
  linhaCabecalho: number;
  avisos: string[];
};

type Pacote = {
  lote: string;
  campos: Record<string, unknown>;
  acasalamentos: EmbriaoAcasalamento[];
  /** Colunas da planilha sem campo próprio, na ordem em que aparecem. */
  extras: Map<string, string[]>;
};

function acasalamentoDaLinha(get: (k: string) => unknown): EmbriaoAcasalamento | null {
  const ancp: EmbriaoProjecao[] = [];
  for (const s of ANCP_SIGLAS) {
    const valor = valorBR(get(`ancp:${s}`));
    const top = valorBR(get(`ancptop:${s}`));
    if (valor || top) ancp.push({ sigla: s, valor, top });
  }
  const pmgz = { iabcz: valorBR(get("iabcz")), deca: valorBR(get("deca")), p: valorBR(get("p")) };
  const touroTxt = txt(get("touro"));
  const livre = sim(get("livre")) || /livre acasalamento/i.test(touroTxt);
  const a: EmbriaoAcasalamento = {
    quantidade: numero(get("acas_qtd")),
    doadoras: pessoas(get("doadora"), get("reg_doadora")),
    avos_maternos: pessoas(get("avo"), get("reg_avo")),
    avos_maternas: pessoas(get("avo_f"), get("reg_avo_f")),
    avos_paternos: pessoas(get("pai_touro"), get("reg_pai_touro")),
    avos_paternas: pessoas(get("mae_touro"), get("reg_mae_touro")),
    touros: livre && /^livre acasalamento\*?$/i.test(touroTxt) ? [] : pessoas(get("touro"), get("reg_touro"), true),
    livre_acasalamento: livre || undefined,
    observacao: txt(get("obs_acas")) || undefined,
    ancp,
    pmgz: Object.fromEntries(Object.entries(pmgz).filter(([, v]) => v)) as EmbriaoAcasalamento["pmgz"],
  };
  for (const k of ["avos_maternas", "avos_paternos", "avos_paternas"] as const) if (!a[k]?.length) delete a[k];
  const vazio = !a.doadoras.length && !a.avos_maternos.length && !a.touros.length && !a.livre_acasalamento
    && !a.ancp.length && !Object.keys(a.pmgz).length && a.quantidade == null;
  return vazio ? null : a;
}

/** Converte uma aba da planilha de embriões em linhas prontas para `animais`. */
export function mapearPlanilhaEmbrioes(matriz: unknown[][], opts: { eventoId?: string | null } = {}): ResultadoEmbrioes {
  const idx = acharCabecalho(matriz);
  const vazio: ResultadoEmbrioes = { pacotes: [], acasalamentos: 0, ignoradas: 0, colunasDesconhecidas: [], linhaCabecalho: -1, avisos: [] };
  if (idx < 0) {
    vazio.avisos.push('Não encontrei o cabeçalho da planilha de embriões. Ele precisa ter as colunas "LOTE" e "DOADORA" (ou "NOME DO PACOTE"). Baixe o modelo de embriões.');
    return vazio;
  }
  const brutos = (matriz[idx] ?? []).map((v) => txt(v));
  const cab = brutos.map(normalizarCabecalho);
  const colPorChave = new Map<string, number>();
  const desconhecidas: string[] = [];
  /** Colunas sem campo próprio: viram informações extras do pacote (nada é descartado). */
  const colExtras: { i: number; rotulo: string }[] = [];
  let ultimaDep: string | null = null;
  let ultimaPmgz = false;
  cab.forEach((c, i) => {
    if (!c) return;
    // "TOP" / "TOP%" logo depois de uma DEP (layout do catálogo: MGTe | TOP% | D3P | TOP% …)
    if (/^(TOP|TOP ?%|TOP\s*\(%\))$/.test(c) && ultimaDep) {
      const k = `ancptop:${ultimaDep}`;
      if (!colPorChave.has(k)) colPorChave.set(k, i);
      ultimaDep = null;
      return;
    }
    if (/^(P ?%|DECA)$/.test(c) && ultimaPmgz) {
      const k = c === "DECA" ? "deca" : "p";
      if (!colPorChave.has(k)) colPorChave.set(k, i);
      return;
    }
    const chave = INDICE_COLUNAS.get(c) ?? chavePorAproximacao(c, brutos[i]);
    ultimaDep = chave?.startsWith("ancp:") ? chave.slice(5) : null;
    ultimaPmgz = chave === "iabcz" || (ultimaPmgz && (chave === "deca" || chave === "p"));
    if (chave && !colPorChave.has(chave)) colPorChave.set(chave, i);
    else if (!chave) {
      desconhecidas.push(brutos[i] || c);
      colExtras.push({ i, rotulo: brutos[i] || c });
    }
  });

  const pacotes: Pacote[] = [];
  const porLote = new Map<string, Pacote>();
  let ignoradas = 0;
  let totalAcas = 0;

  for (let r = idx + 1; r < matriz.length; r++) {
    const linha = matriz[r] ?? [];
    const get = (k: string) => {
      const i = colPorChave.get(k);
      return i == null ? null : linha[i];
    };
    if (linha.every((v) => txt(v) === "")) continue;
    const loteTxt = txt(get("lote")).replace(/^lote\s*/i, "").replace(/^pacote\s*/i, "");
    let pacote: Pacote | undefined;
    if (loteTxt) {
      const chave = normalizarCabecalho(loteTxt);
      pacote = porLote.get(chave);
      if (!pacote) {
        pacote = { lote: loteTxt, campos: {}, acasalamentos: [], extras: new Map() };
        porLote.set(chave, pacote);
        pacotes.push(pacote);
      }
    } else {
      pacote = pacotes[pacotes.length - 1];
    }
    if (!pacote) { ignoradas++; continue; }

    for (const c of EMBRIOES_COLUNAS) {
      if (c.grupo === "ACASALAMENTO" || c.grupo === "PROJEÇÕES ANCP" || c.grupo === "PMGZ" || c.chave === "lote") continue;
      const v = get(c.chave);
      if (txt(v) !== "" && pacote.campos[c.chave] == null) pacote.campos[c.chave] = v;
    }
    for (const e of colExtras) {
      const v = txt(linha[e.i]);
      if (!v) continue;
      const atual = pacote.extras.get(e.rotulo) ?? [];
      if (!atual.includes(v)) atual.push(v);
      pacote.extras.set(e.rotulo, atual);
    }
    const a = acasalamentoDaLinha(get);
    if (a) { pacote.acasalamentos.push(a); totalAcas++; }
  }

  const linhas = pacotes.map((p) => montarLinhaAnimal(p, opts.eventoId ?? null));
  const avisos: string[] = [];
  if (!linhas.length) avisos.push("Nenhum pacote de embriões encontrado abaixo do cabeçalho.");
  return { pacotes: linhas, acasalamentos: totalAcas, ignoradas, colunasDesconhecidas: desconhecidas, linhaCabecalho: idx + 1, avisos };
}

function montarLinhaAnimal(p: Pacote, eventoId: string | null): Record<string, unknown> {
  const c = p.campos;
  const quantidade = numero(c.quantidade)
    ?? (p.acasalamentos.reduce((s, a) => s + (a.quantidade ?? 0), 0) || null);
  const valorEmbriao = numero(c.valor_embriao);
  let valorPacote = numero(c.valor_pacote);
  if (valorPacote == null && valorEmbriao != null && quantidade) valorPacote = valorEmbriao * quantidade;
  const parcelas = numero(c.parcelas);
  const tipo = txt(c.tipo) || "DT";
  const fotos = lista(c.fotos, false).flatMap((s) => s.split(/\s+/)).filter((s) => /^https?:\/\//i.test(s));

  const dados: EmbriaoDados = {
    quantidade,
    tipo,
    garantia_prenhezes: numero(c.garantia_prenhezes),
    garantia_percentual: numero(String(c.garantia_percentual ?? "").replace("%", "")),
    raca: txt(c.raca) || undefined,
    semen: txt(c.semen) || undefined,
    criatorio: txt(c.criatorio) || undefined,
    logo_url: txt(c.logo_url) || undefined,
    valor_embriao: valorEmbriao,
    valor_pacote: valorPacote,
    parcelas,
    condicoes: txt(c.condicoes) || undefined,
    observacoes: txt(c.observacoes) || undefined,
    regras_garantia: txt(c.regras_garantia) || undefined,
    localizacao: txt(c.localizacao) || undefined,
    whatsapp: txt(c.whatsapp) || undefined,
    instagram: txt(c.instagram) || undefined,
    link_video: txt(c.link_video) || undefined,
    link_video_doadora: txt(c.link_video_doadora) || undefined,
    link_acasalamentos: txt(c.link_acasalamentos) || undefined,
    fotos: fotos.length ? fotos : undefined,
    extras: p.extras.size ? [...p.extras].map(([rotulo, vs]) => ({ rotulo, valor: vs.join(" · ") })) : undefined,
    acasalamentos: p.acasalamentos,
  };

  const primeiro = p.acasalamentos[0];
  const mgte = primeiro?.ancp.find((x) => x.sigla === "MGTe")?.valor;
  const nomes = (arr?: EmbriaoPessoa[]) => (arr ?? []).map((x) => x.nome).join(", ") || null;
  const todas = (sel: (a: EmbriaoAcasalamento) => EmbriaoPessoa[]) => {
    const vistos = new Set<string>();
    const out: EmbriaoPessoa[] = [];
    for (const a of p.acasalamentos) for (const x of sel(a)) if (!vistos.has(x.nome)) { vistos.add(x.nome); out.push(x); }
    return out;
  };

  return {
    nome: txt(c.nome) || `Pacote de embriões — Lote ${p.lote}`,
    lote: p.lote,
    categoria: "Embrião",
    raca: dados.raca ?? "Nelore",
    fazenda: dados.criatorio ?? null,
    localizacao: dados.localizacao ?? null,
    fornecedor: dados.criatorio ?? null,
    mgte: mgte ? numero(mgte) : null,
    iabcz: primeiro?.pmgz.iabcz ? numero(primeiro.pmgz.iabcz) : null,
    preco_total: valorPacote,
    parcelas,
    valor_parcela: valorPacote != null && parcelas ? Math.round((valorPacote / parcelas) * 100) / 100 : null,
    link_video: dados.link_video ?? null,
    foto_url: fotos[0] ?? null,
    destaque: sim(c.destaque),
    ativo: true,
    descricao_longa: dados.observacoes ?? null,
    mae: nomes(todas((a) => a.doadoras)),
    pai: nomes(todas((a) => a.touros)) ?? (p.acasalamentos.some((a) => a.livre_acasalamento) ? "Livre acasalamento" : null),
    avo_materno_pai: nomes(todas((a) => a.avos_maternos)),
    avo_materno_mae: nomes(todas((a) => a.avos_maternas ?? [])),
    avo_paterno_pai: nomes(todas((a) => a.avos_paternos ?? [])),
    avo_paterno_mae: nomes(todas((a) => a.avos_paternas ?? [])),
    evento_id: eventoId,
    embriao: dados,
  };
}

/** Lê o arquivo inteiro (todas as abas) e junta os pacotes encontrados. */
export function mapearArquivoEmbrioes(dados: ArrayBuffer | Uint8Array, nomeArquivo: string, opts: { eventoId?: string | null } = {}): ResultadoEmbrioes {
  const bytes = dados instanceof Uint8Array ? dados : new Uint8Array(dados);
  const wb = /\.csv$/i.test(nomeArquivo)
    ? XLSX.read(new TextDecoder("utf-8").decode(bytes), { type: "string" })
    : XLSX.read(bytes, { type: "array" });
  const final: ResultadoEmbrioes = { pacotes: [], acasalamentos: 0, ignoradas: 0, colunasDesconhecidas: [], linhaCabecalho: -1, avisos: [] };
  const vistos = new Set<string>();
  for (const nome of wb.SheetNames) {
    const ws = wb.Sheets[nome];
    if (!ws) continue;
    const matriz = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null, blankrows: false });
    const r = mapearPlanilhaEmbrioes(matriz, opts);
    if (!r.pacotes.length) { if (!final.avisos.length) final.avisos.push(...r.avisos); continue; }
    if (final.linhaCabecalho < 0) final.linhaCabecalho = r.linhaCabecalho;
    final.acasalamentos += r.acasalamentos;
    final.ignoradas += r.ignoradas;
    for (const c of r.colunasDesconhecidas) if (!final.colunasDesconhecidas.includes(c)) final.colunasDesconhecidas.push(c);
    for (const p of r.pacotes) {
      const k = normalizarCabecalho(p.lote);
      if (vistos.has(k)) continue;
      vistos.add(k);
      final.pacotes.push(p);
    }
  }
  if (final.pacotes.length) final.avisos = [];
  return final;
}

/* ------------------------------------------------------------------ */
/* Modelo                                                              */
/* ------------------------------------------------------------------ */

type Exemplo = Record<string, string | number>;

/** Exemplos reais do catálogo Shopping Excelência Genética + pacote misto. */
export const EXEMPLOS_EMBRIOES: Exemplo[] = [
  {
    lote: "1", nome: "Família FNAN Celestial", criatorio: "Nelore F.N.A.N", quantidade: 6, tipo: "DT", garantia_prenhezes: 2,
    raca: "Nelore PO", semen: "Convencional", valor_embriao: 3500, parcelas: 30, condicoes: "30 parcelas (1+29)",
    link_video: "https://www.youtube.com/watch?v=exemplo1",
    touro: "NOBRE DA 7P", reg_touro: "FNFJ 7",
    "ancp:MGTe": 42, "ancptop:MGTe": 0.1, "ancp:D3P": 93.58, "ancptop:D3P": 0.5, "ancp:DSTAY": 94.71, "ancptop:DSTAY": 1,
    "ancp:DPE365": 2.35, "ancptop:DPE365": 0.5, "ancp:MP120": 5.1, "ancptop:MP120": 3, "ancp:DP210": 27.7, "ancptop:DP210": 0.1,
    "ancp:DP450": 45, "ancptop:DP450": 0.1, "ancp:DAOL": 6.32, "ancptop:DAOL": 0.5, "ancp:DACAB": 0.79, "ancptop:DACAB": 4,
    iabcz: 40.73, p: 0.1,
  },
  {
    lote: "2", nome: "Oferta Limitada", criatorio: "Nelore F.N.A.N", quantidade: 6, tipo: "DT", garantia_prenhezes: 2, raca: "Nelore PO",
    valor_embriao: 3000, parcelas: 30, condicoes: "30 parcelas (1+29)",
    doadora: "FNAN CELESTIAL FIV", reg_doadora: "FNAN 120", avo: "DIPLOMATA DA AGRONOVA", reg_avo: "FANO 2762",
    touro: "Livre acasalamento", livre: "SIM", obs_acas: "*Touro com comprovada qualidade de sêmen de central e não sexado",
  },
  {
    lote: "3", nome: "Equilíbrio Tipo e Avaliação", criatorio: "Nelore F.N.A.N", quantidade: 6, tipo: "DT", garantia_prenhezes: 2, raca: "Nelore PO",
    valor_embriao: 3200, parcelas: 30, condicoes: "30 parcelas (1+29)",
    doadora: "BETINA FIV", reg_doadora: "LCF 923", avo: "DIPLOMATA DA AGRONOVA", reg_avo: "FANO 2762", touro: "REM OURO", reg_touro: "REM CA6364",
    "ancp:MGTe": 41.55, "ancptop:MGTe": 0.1, "ancp:D3P": 89.81, "ancptop:D3P": 3, "ancp:DSTAY": 94.44, "ancptop:DSTAY": 1,
    "ancp:DPE365": 1.9, "ancptop:DPE365": 2, "ancp:MP120": 4.34, "ancptop:MP120": 5, "ancp:DP210": 25.82, "ancptop:DP210": 0.1,
    "ancp:DP450": 42.38, "ancptop:DP450": 0.1, "ancp:DAOL": 8.28, "ancptop:DAOL": 0.1, "ancp:DACAB": 0.92, "ancptop:DACAB": 3,
    iabcz: 40.76, p: 0.1,
  },
  {
    lote: "12", nome: "Irmãs Fender FIV Guadalupe", criatorio: "ACN Agropecuária", quantidade: 6, tipo: "DT", garantia_prenhezes: 2,
    raca: "Nelore PO", semen: "Sexado de Fêmea", valor_embriao: 2800, parcelas: 30,
    touro: "ALL IN JBJ", reg_touro: "JBJ2407",
    "ancp:MGTe": 35.34, "ancptop:MGTe": 0.1, "ancp:D3P": 91.54, "ancptop:D3P": 2, "ancp:DSTAY": 95.05, "ancptop:DSTAY": 0.5,
    "ancp:DPE365": 1.41, "ancptop:DPE365": 7, "ancp:MP120": 5.71, "ancptop:MP120": 2, "ancp:DP210": 16.99, "ancptop:DP210": 4,
    "ancp:DP450": 34.13, "ancptop:DP450": 2, "ancp:DAOL": 5.81, "ancptop:DAOL": 1, "ancp:DACAB": 0.78, "ancptop:DACAB": 5,
    iabcz: 32.6, deca: 1,
  },
  {
    lote: "38", nome: "Excelência Premium", criatorio: "Nelore VC", quantidade: 6, tipo: "DT", garantia_prenhezes: 2, raca: "Nelore PO",
    valor_embriao: 4500, parcelas: 30, condicoes: "30 parcelas (1+29)", whatsapp: "34 99167 2300", instagram: "@nelorevc",
    doadora: "VCN3443; VCN3433; VCN3445", avo: "GURUPI MAT.", reg_avo: "7475 DA IPB", touro: "ABSOLUTO RG", reg_touro: "RGMC11",
    "ancp:MGTe": 41.5, "ancptop:MGTe": 0.1, "ancp:D3P": 92.27, "ancptop:D3P": 1, "ancp:DSTAY": 94.56, "ancptop:DSTAY": 1,
    "ancp:DPE365": 2.01, "ancptop:DPE365": 1, "ancp:MP120": 3.41, "ancptop:MP120": 11, "ancp:DP210": 29.59, "ancptop:DP210": 0.1,
    "ancp:DP450": 48.64, "ancptop:DP450": 0.1, "ancp:DAOL": 6.42, "ancptop:DAOL": 0.5, "ancp:DACAB": 0.82, "ancptop:DACAB": 4,
    iabcz: 38.29, p: 0.1,
  },
  {
    lote: "36", nome: "Base Nelore VC", criatorio: "Nelore VC", quantidade: 12, tipo: "DT", garantia_percentual: 35, raca: "Nelore PO",
    semen: "Convencional", valor_embriao: 1800, parcelas: 8, observacoes: "Na compra de 2 pacotes (24 embriões), receba 6 unidades de bônus, totalizando 30.",
    regras_garantia: "Garantia de 35% de concepção aos 30 dias de gestação (tolerância até 40 dias). Procedimentos por veterinário habilitado; transferência do pacote em um único dia.",
    localizacao: "Prata/MG",
    acas_qtd: 7, doadora: "VCA 8599", avo: "OBAMA MACHADINHO", avo_f: "7550 FIV PO DA VC",
    touro: "LANDROVER DA XARAES", reg_touro: "011NE04482", pai_touro: "IDEALIZADOR FIV DA XARAES", mae_touro: "JETTA DA XARAES",
    "ancp:MGTe": 36.87, "ancptop:MGTe": 0.1, "ancp:MP120": 2.6, "ancptop:MP120": 14, "ancp:DP210": 19.48, "ancptop:DP210": 1,
    "ancp:DP365": 38.24, "ancptop:DP365": 0.5, "ancp:DPE365": 1.94, "ancptop:DPE365": 1, "ancp:DAOL": 7.01, "ancptop:DAOL": 0.1,
    "ancp:DACAB": 1.1, "ancptop:DACAB": 1, "ancp:D3P": 90.09, "ancptop:D3P": 0.1, "ancp:DSTAY": 94.61, "ancptop:DSTAY": 0.5,
  },
  {
    lote: "", acas_qtd: 5, doadora: "VCA 8283", avo: "DIPLOMATA AGRONOVA", avo_f: "7550 FIV PO DA VC",
    touro: "LANDROVER DA XARAES", reg_touro: "011NE04482", pai_touro: "IDEALIZADOR FIV DA XARAES", mae_touro: "JETTA DA XARAES",
    "ancp:MGTe": 34.87, "ancptop:MGTe": 0.1, "ancp:MP120": 3.03, "ancptop:MP120": 10, "ancp:DP210": 18.28, "ancptop:DP210": 1,
    "ancp:DP365": 35.36, "ancptop:DP365": 0.5, "ancp:DPE365": 1.74, "ancptop:DPE365": 2, "ancp:DAOL": 6.63, "ancptop:DAOL": 0.5,
    "ancp:DACAB": 0.87, "ancptop:DACAB": 2, "ancp:D3P": 89.59, "ancptop:D3P": 0.1, "ancp:DSTAY": 93.17, "ancptop:DSTAY": 1,
  },
];

export function gerarModeloEmbrioesBytes(): ArrayBuffer {
  const grupos: string[] = [];
  const campos: string[] = [];
  let ultimo = "";
  for (const c of EMBRIOES_COLUNAS) {
    grupos.push(c.grupo === ultimo ? "" : c.grupo);
    ultimo = c.grupo;
    campos.push(c.campo);
  }
  const linhas = EXEMPLOS_EMBRIOES.map((ex) => EMBRIOES_COLUNAS.map((c) => ex[c.chave] ?? ""));
  const ws = XLSX.utils.aoa_to_sheet([grupos, campos, ...linhas]);
  ws["!cols"] = campos.map((c) => ({ wch: Math.max(10, Math.min(28, c.length + 4)) }));
  const instrucoes = XLSX.utils.aoa_to_sheet([
    ["PLANILHA DE EMBRIÕES — COMO PREENCHER"],
    [""],
    ["1. Uma linha por acasalamento. Pacotes com um único acasalamento ocupam uma linha."],
    ["2. Pacote com vários acasalamentos: repita o mesmo LOTE (ou deixe LOTE vazio) nas linhas de baixo."],
    ["3. Vários nomes na mesma célula (doadoras, avôs, touros): separe por ponto e vírgula ( ; )."],
    ["4. Livre acasalamento: escreva SIM na coluna LIVRE ACASALAMENTO."],
    ["   Pedigree completo (catálogo Alta): PAI DO TOURO, MÃE DO TOURO, AVÔ MATERNO e AVÓ MATERNA."],
    ["   Nome com registro entre parênteses também funciona: BETINA FIV (LCF 923)."],
    ["5. Garantia: use GARANTIA PRENHEZES (ex.: 2) ou GARANTIA % (ex.: 35)."],
    ["6. VALOR DO PACOTE pode ficar vazio: é calculado por VALOR POR EMBRIÃO × QTD EMBRIÕES."],
    ["7. Projeções ANCP: preencha a DEP e o TOP% de cada característica. O que ficar vazio não aparece."],
    ["   Também aceita o layout do catálogo: coluna TOP% logo depois de cada DEP (MGTe | TOP% | D3P | TOP% ...)."],
    ["8. PMGZ: iABCZ com DECA ou P%."],
  ]);
  instrucoes["!cols"] = [{ wch: 100 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Embrioes");
  XLSX.utils.book_append_sheet(wb, instrucoes, "Como preencher");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

export function gerarModeloEmbrioes(): Blob {
  return new Blob([gerarModeloEmbrioesBytes()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
