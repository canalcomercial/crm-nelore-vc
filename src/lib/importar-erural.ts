import * as XLSX from "xlsx";
import type { GeneticaAnimal, GeneticaBloco, GeneticaLinha } from "@/hooks/useCatalogo";

/**
 * Leitura e mapeamento da planilha base erural (modelo 2026).
 *
 * O arquivo tem duas linhas de cabeçalho — a de cima agrupa (LOTE, ANIMAL,
 * GENEALOGIA, INDICES, ABCZ, ANCP, GENEPLUS, PRENHEZ, CRIA) e a de baixo nomeia
 * o campo. Os dados começam logo abaixo. O mapeamento aqui é **por nome de
 * coluna**, não por posição, então a planilha pode ganhar, perder ou trocar
 * colunas de lugar sem quebrar a importação.
 */

/* ------------------------------------------------------------------ */
/* Utilidades de normalização                                          */
/* ------------------------------------------------------------------ */

/** Maiúsculas, sem acento, sem pontuação supérflua e com espaços colapsados. */
export function normalizarCabecalho(v: unknown): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[.:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function texto(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/** Aceita 18.000,00 / 1234.5 / "39 cm" / número puro. */
export function numero(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = String(v).trim().replace(/[^\d,.\-]/g, "");
  if (!s) return null;
  const temVirgula = s.includes(",");
  const temPonto = s.includes(".");
  if (temVirgula && temPonto) s = s.replace(/\./g, "").replace(",", ".");
  else if (temVirgula) s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Devolve ISO (yyyy-mm-dd) a partir de Date, serial do Excel ou dd/mm/aaaa. */
export function data(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
  }
  if (typeof v === "number") {
    // Serial do Excel (base 1899-12-30)
    const ms = Math.round((v - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  const br = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (br) {
    const [, d1, m1, y1] = br;
    const ano = y1.length === 2 ? `20${y1}` : y1;
    return `${ano}-${m1.padStart(2, "0")}-${d1.padStart(2, "0")}`;
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? iso[0] : null;
}

function booleano(v: unknown): boolean | null {
  if (v == null || v === "") return null;
  if (typeof v === "boolean") return v;
  return /^(true|1|sim|s|verdadeiro|x)$/i.test(String(v).trim());
}

/** macho | femea a partir de MACHO/M/TOURO ou FEMEA/F/MATRIZ. */
export function genero(v: unknown): "macho" | "femea" | null {
  const s = normalizarCabecalho(v);
  if (!s) return null;
  if (/^(M|MACHO|TOURO|GARROTE|BEZERRO|REPRODUTOR)/.test(s)) return "macho";
  if (/^(F|FEMEA|MATRIZ|NOVILHA|VACA|BEZERRA)/.test(s)) return "femea";
  return null;
}

/** Formata para exibição na ficha mantendo o padrão brasileiro. */
function valorGenetico(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "number") return v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
  const n = numero(v);
  if (n != null && /^[\d\s.,-]+$/.test(String(v))) {
    return n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
  }
  return String(v).trim();
}

/* ------------------------------------------------------------------ */
/* Definição das colunas da base erural                                */
/* ------------------------------------------------------------------ */

/** Linhas das tabelas DEP/ÍNDICE/TOP: rótulo exibido + colunas de origem. */
type DefLinha = { rotulo: string; colValor: string; colTop: string };

const ABCZ_LINHAS: DefLinha[] = [
  { rotulo: "PNg", colValor: "DEP PN-EDG", colTop: "DECA PN-EDG" },
  { rotulo: "PDg", colValor: "DEP PD-EDG", colTop: "DECA PD-EDG" },
  { rotulo: "PSg", colValor: "DEP PS-EDG", colTop: "DECA PS-EDG" },
  { rotulo: "PM-EMg", colValor: "DEP PM-EM", colTop: "DECA PM-EM" },
  { rotulo: "IPPg", colValor: "DEP IPPG", colTop: "DECA IPPG" },
  { rotulo: "STAYg", colValor: "DEP STAYG", colTop: "DECA STAYG" },
  { rotulo: "PE365g", colValor: "PE-365G DEP", colTop: "PE-365G DECA" },
  { rotulo: "AOLg", colValor: "DEP AOLG", colTop: "DECA AOLG" },
  { rotulo: "ACABg", colValor: "DEP ACAB", colTop: "DECA ACAB" },
];

const ANCP_LINHAS: DefLinha[] = [
  { rotulo: "DPN", colValor: "DEP DPN", colTop: "TOP_DPN" },
  { rotulo: "DP210", colValor: "DEP DP210", colTop: "TOP DP210" },
  { rotulo: "DP450", colValor: "DEP DP450", colTop: "TOP DP450" },
  { rotulo: "MP120", colValor: "DEP MP120", colTop: "TOP MP120" },
  { rotulo: "D3P", colValor: "DEP D3P", colTop: "TOP D3P" },
  { rotulo: "DSTAY", colValor: "DEP DSTAY", colTop: "TOP DSTAY" },
  { rotulo: "DIPP", colValor: "DIPP", colTop: "TOP_DIPP" },
  { rotulo: "DPE365", colValor: "DEP DPE365", colTop: "TOP DPE365" },
  { rotulo: "DAOL", colValor: "DEP DAOL", colTop: "TOP DAOL" },
  { rotulo: "DACAB", colValor: "DEP DACAB", colTop: "TOP DACAB" },
  { rotulo: "MAR", colValor: "DEP MAR", colTop: "TOP MA" },
];

const GENEPLUS_LINHAS: DefLinha[] = [
  { rotulo: "PN", colValor: "PN DEP", colTop: "PN PT" },
  { rotulo: "PM120", colValor: "PM120 DEP", colTop: "PM120 PT" },
  { rotulo: "GPD", colValor: "GPD DEP", colTop: "GPD PT" },
  { rotulo: "PD", colValor: "PD DEP", colTop: "PD PT" },
  { rotulo: "IPP", colValor: "IPP DEP", colTop: "IPP PT" },
  { rotulo: "STAY", colValor: "STAY DEP", colTop: "STAY PT" },
  { rotulo: "PES", colValor: "PES DEP", colTop: "PES PT" },
  { rotulo: "AOL", colValor: "AOL DEP", colTop: "AOL PT" },
  { rotulo: "EGS", colValor: "EGS DEP", colTop: "EGS PT" },
  { rotulo: "MAR", colValor: "MAR DEP", colTop: "MAR PT" },
];

/** Nomes antigos aceitos para cada coluna atual. */
const ALIAS_COLUNAS: Record<string, string[]> = {
  "LINK DO LOTE": ["URL ERURAL"],
  CERTIFICADO: ["CERTIFICADO ERURAL"],
};

/** Ordem oficial das colunas — usada para gerar o modelo. */
export const BASE_ERURAL_COLUNAS: { grupo: string; campo: string; exemplo?: string }[] = [
  { grupo: "LINK", campo: "LINK DO LOTE" },
  { grupo: "LINK", campo: "UTM VIDEO" },
  { grupo: "LINK", campo: "UTM PL" },
  { grupo: "LINK", campo: "DRIVE" },
  { grupo: "LINK YOUTUBE", campo: "LINK YOUTUBE", exemplo: "https://youtu.be/xxxx" },
  { grupo: "PRÉ-LANCE", campo: "P.L." },
  { grupo: "OBSERVAÇÃO", campo: "OBS.:" },
  { grupo: "LOTE", campo: "LOTE", exemplo: "1" },
  { grupo: "LOTE", campo: "FORNECEDOR", exemplo: "Nelore VC" },
  { grupo: "LOTE", campo: "UF", exemplo: "PR" },
  { grupo: "LOTE", campo: "CIDADE", exemplo: "Londrina" },
  { grupo: "LOTE", campo: "PRECO INICIAL", exemplo: "18000" },
  { grupo: "LOTE", campo: "CERTIFICADO", exemplo: "TRUE" },
  { grupo: "LOTE", campo: "PERCENTUAL COMERCIALIZADO", exemplo: "8" },
  { grupo: "ANIMAL", campo: "TIPO", exemplo: "Genética" },
  { grupo: "ANIMAL", campo: "TIPO GENETICA", exemplo: "P.O." },
  { grupo: "ANIMAL", campo: "CATEGORIA", exemplo: "Bovino" },
  { grupo: "ANIMAL", campo: "RAÇA", exemplo: "Nelore" },
  { grupo: "ANIMAL", campo: "NOME ANIMAL", exemplo: "9335 FIV PO DA VC" },
  { grupo: "ANIMAL", campo: "REGISTRO ANIMAL", exemplo: "VCA - 9335" },
  { grupo: "ANIMAL", campo: "NASC ANIMAL", exemplo: "01/04/2025" },
  { grupo: "ANIMAL", campo: "PESO (kg)", exemplo: "" },
  { grupo: "ANIMAL", campo: "CE", exemplo: "" },
  { grupo: "ANIMAL", campo: "GENERO", exemplo: "Fêmea" },
  { grupo: "ANIMAL", campo: "IDADE" },
  { grupo: "ANIMAL", campo: "QUANTIDADE", exemplo: "1" },
  { grupo: "ANIMAL", campo: "ORG", exemplo: "zebu" },
  { grupo: "ANIMAL", campo: "CSG" },
  { grupo: "ANIMAL", campo: "CEIP" },
  { grupo: "GENEALOGIA", campo: "NOME PAI", exemplo: "REM1416L FIV GENETICA ADITIVA" },
  { grupo: "GENEALOGIA", campo: "AVO PATERNO", exemplo: "REM GRINGO GENETICA ADITIVA" },
  { grupo: "GENEALOGIA", campo: "AVO PATERNA", exemplo: "REM GUAIAMA" },
  { grupo: "GENEALOGIA", campo: "MAE", exemplo: "8295 FIV PO DA VC" },
  { grupo: "GENEALOGIA", campo: "AVO MATERNO", exemplo: "DIPLOMATA DA AGRONOVA" },
  { grupo: "GENEALOGIA", campo: "AVO MATERNA", exemplo: "7175 PO DA VC" },
  { grupo: "INDICES", campo: "iABCZ ANIMAL", exemplo: "33,51" },
  { grupo: "INDICES", campo: "DECA ANIMAL", exemplo: "1" },
  { grupo: "INDICES", campo: "P%", exemplo: "0,1" },
  { grupo: "INDICES", campo: "MGTe", exemplo: "36,05" },
  { grupo: "INDICES", campo: "TOP_MGTe", exemplo: "0,1" },
  { grupo: "INDICES", campo: "IQG", exemplo: "41,74" },
  { grupo: "INDICES", campo: "TOP_IQG", exemplo: "0,1" },
  ...ABCZ_LINHAS.flatMap((l) => [
    { grupo: "ABCZ", campo: l.colValor.replace("PN-EDG", "PN-EDg").replace("PD-EDG", "PD-EDg").replace("PS-EDG", "PS-EDg").replace("IPPG", "IPPg").replace("STAYG", "STAYg").replace("PE-365G", "PE-365g").replace("AOLG", "AOLg") },
    { grupo: "ABCZ", campo: l.colTop.replace("PN-EDG", "PN-EDg").replace("PD-EDG", "PD-EDg").replace("PS-EDG", "PS-EDg").replace("IPPG", "IPPg").replace("STAYG", "STAYg").replace("PE-365G", "PE-365g").replace("AOLG", "AOLg") },
  ]),
  ...ANCP_LINHAS.flatMap((l) => [
    { grupo: "ANCP", campo: l.colValor },
    { grupo: "ANCP", campo: l.colTop },
  ]),
  ...GENEPLUS_LINHAS.flatMap((l) => [
    { grupo: "GENEPLUS", campo: l.colValor.replace(" DEP", " Dep") },
    { grupo: "GENEPLUS", campo: l.colTop.replace(" PT", " Pt") },
  ]),
  { grupo: "PRENHEZ", campo: "STATUS REPRODUTIVO", exemplo: "Prenhe" },
  { grupo: "PRENHEZ", campo: "DATA INSEMINACAO" },
  { grupo: "PRENHEZ", campo: "PREVISAO PARTO", exemplo: "01/02/2027" },
  { grupo: "PRENHEZ", campo: "FORMATO ACASALAMENTO" },
  { grupo: "PRENHEZ", campo: "OOCITOS" },
  { grupo: "PRENHEZ", campo: "EMBRIOES" },
  { grupo: "PRENHEZ", campo: "PAI DA PRENHEZ", exemplo: "PARATUDO FIV RG" },
  { grupo: "PRENHEZ", campo: "Iabcz PRENHEZ", exemplo: "31,52" },
  { grupo: "PRENHEZ", campo: "DECA PRENHEZ", exemplo: "1" },
  { grupo: "PRENHEZ", campo: "MGTe PRENHEZ" },
  { grupo: "PRENHEZ", campo: "TOP_MGTe PRENHEZ" },
  { grupo: "CRIA", campo: "RGN CRIA" },
  { grupo: "CRIA", campo: "PAI CRIA" },
  { grupo: "CRIA", campo: "NASC. CRIA" },
  { grupo: "CRIA", campo: "SEXO CRIA" },
  { grupo: "CRIA", campo: "iABCZg CRIA" },
  { grupo: "CRIA", campo: "DECA CRIA" },
  { grupo: "CRIA", campo: "MGTe CRIA" },
  { grupo: "CRIA", campo: "TOP_MGTe CRIA" },
  { grupo: "EXTRAS", campo: "OBSs" },
];

/* ------------------------------------------------------------------ */
/* Leitura do arquivo                                                  */
/* ------------------------------------------------------------------ */

/**
 * Lê xlsx/xls/csv e devolve a primeira aba como matriz de valores brutos.
 *
 * `File.arrayBuffer()` devolve um ArrayBuffer, mas o SheetJS no modo "array"
 * espera bytes — passar o ArrayBuffer cru faz a leitura voltar vazia sem erro.
 * Por isso normalizamos para Uint8Array antes de ler.
 */
export function lerArquivo(dados: ArrayBuffer | Uint8Array, nomeArquivo: string): unknown[][] {
  const bytes = dados instanceof Uint8Array ? dados : new Uint8Array(dados);
  const ehTexto = /\.csv$/i.test(nomeArquivo);
  const wb = ehTexto
    ? XLSX.read(new TextDecoder("utf-8").decode(bytes), { type: "string", cellDates: true, raw: false })
    : XLSX.read(bytes, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null, blankrows: false });
}

/* ------------------------------------------------------------------ */
/* Mapeamento                                                          */
/* ------------------------------------------------------------------ */

export type ResultadoImportacao = {
  animais: Record<string, unknown>[];
  /** Linhas puladas por não terem nome de animal. */
  ignoradas: number;
  /** Colunas do arquivo que não fazem parte da base conhecida. */
  colunasDesconhecidas: string[];
  /** Índice da linha (1-based) usada como cabeçalho de campos. */
  linhaCabecalho: number;
  avisos: string[];
};

/** Localiza a linha de cabeçalho de campos — a que contém "NOME ANIMAL". */
function acharLinhaCabecalho(matriz: unknown[][]): number {
  for (let i = 0; i < Math.min(matriz.length, 12); i++) {
    const norm = (matriz[i] ?? []).map(normalizarCabecalho);
    if (norm.includes("NOME ANIMAL")) return i;
  }
  return -1;
}

function blocoVazio(): GeneticaBloco {
  return { resumo: [], linhas: [] };
}

function adicionarResumo(b: GeneticaBloco, label: string, valor: unknown) {
  const v = valorGenetico(valor);
  if (v) b.resumo.push({ label, valor: v });
}

function montarLinhas(get: (col: string) => unknown, defs: DefLinha[]): GeneticaLinha[] {
  const linhas: GeneticaLinha[] = [];
  for (const d of defs) {
    const indice = valorGenetico(get(d.colValor));
    const top = valorGenetico(get(d.colTop));
    if (!indice && !top) continue;
    linhas.push({ dep: d.rotulo, indice, top });
  }
  return linhas;
}

function limparObjeto<T extends Record<string, unknown>>(o: T): T | null {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v == null || v === "") continue;
    out[k] = v;
  }
  return Object.keys(out).length ? (out as T) : null;
}

/**
 * Converte a matriz lida do arquivo em linhas prontas para inserir em `animais`.
 * Linhas sem NOME ANIMAL são ignoradas (a planilha base vem com centenas delas em branco).
 */
export function mapearBaseErural(matriz: unknown[][]): ResultadoImportacao {
  const avisos: string[] = [];
  const idxCab = acharLinhaCabecalho(matriz);
  if (idxCab < 0) {
    return {
      animais: [],
      ignoradas: 0,
      colunasDesconhecidas: [],
      linhaCabecalho: -1,
      avisos: ['Não encontrei a coluna "NOME ANIMAL". Confira se o arquivo é a planilha base do catálogo.'],
    };
  }

  const campos = (matriz[idxCab] ?? []).map(normalizarCabecalho);
  const grupos = idxCab > 0 ? (matriz[idxCab - 1] ?? []).map(normalizarCabecalho) : [];

  // nome do campo -> índice da coluna (primeira ocorrência vence)
  const porCampo = new Map<string, number>();
  campos.forEach((c, i) => {
    if (c && !porCampo.has(c)) porCampo.set(c, i);
  });
  // "GRUPO|CAMPO" -> índice, para desempatar nomes repetidos entre blocos
  const porGrupoCampo = new Map<string, number>();
  let grupoAtual = "";
  campos.forEach((c, i) => {
    if (grupos[i]) grupoAtual = grupos[i];
    if (c) porGrupoCampo.set(`${grupoAtual}|${c}`, i);
  });

  const conhecidas = new Set<string>();
  const marcar = (c: string) => conhecidas.add(c);

  const animais: Record<string, unknown>[] = [];
  let ignoradas = 0;

  for (let r = idxCab + 1; r < matriz.length; r++) {
    const linha = matriz[r] ?? [];
    const get = (col: string, grupo?: string): unknown => {
      const c = normalizarCabecalho(col);
      marcar(c);
      let i = grupo ? porGrupoCampo.get(`${normalizarCabecalho(grupo)}|${c}`) ?? porCampo.get(c) : porCampo.get(c);
      if (i == null) {
        // aceita os nomes antigos das colunas (planilhas já baixadas continuam funcionando)
        for (const alt of ALIAS_COLUNAS[c] ?? []) {
          const a = normalizarCabecalho(alt);
          marcar(a);
          i = porCampo.get(a);
          if (i != null) break;
        }
      }
      return i == null ? null : linha[i] ?? null;
    };

    const nome = texto(get("NOME ANIMAL"));
    if (!nome) {
      if (linha.some((v) => v != null && String(v).trim() !== "")) ignoradas++;
      continue;
    }

    /* --- genética --------------------------------------------------- */
    const pmgz = blocoVazio();
    adicionarResumo(pmgz, "iABCZ", get("iABCZ ANIMAL"));
    adicionarResumo(pmgz, "DECA", get("DECA ANIMAL"));
    adicionarResumo(pmgz, "P%", get("P%"));
    pmgz.linhas = montarLinhas((c) => get(c, "ABCZ"), ABCZ_LINHAS);

    const ancp = blocoVazio();
    adicionarResumo(ancp, "MGTe", get("MGTe"));
    adicionarResumo(ancp, "TOP", get("TOP_MGTe"));
    ancp.linhas = montarLinhas((c) => get(c, "ANCP"), ANCP_LINHAS);

    const geneplus = blocoVazio();
    adicionarResumo(geneplus, "IQG", get("IQG"));
    adicionarResumo(geneplus, "TOP", get("TOP_IQG"));
    geneplus.linhas = montarLinhas((c) => get(c, "GENEPLUS"), GENEPLUS_LINHAS);

    const ventre = limparObjeto({
      iabcz: valorGenetico(get("Iabcz PRENHEZ")),
      deca: valorGenetico(get("DECA PRENHEZ")),
      mgte: valorGenetico(get("MGTe PRENHEZ")),
      top_mgte: valorGenetico(get("TOP_MGTe PRENHEZ")),
    });

    const genetica: GeneticaAnimal = {};
    if (pmgz.resumo.length || pmgz.linhas.length) genetica.pmgz = pmgz;
    if (ancp.resumo.length || ancp.linhas.length) genetica.ancp = ancp;
    if (geneplus.resumo.length || geneplus.linhas.length) genetica.geneplus = geneplus;
    if (ventre) genetica.ventre = ventre;

    /* --- blocos livres ---------------------------------------------- */
    const uf = texto(get("UF"));
    const cidade = texto(get("CIDADE"));
    const quantidade = numero(get("QUANTIDADE"));

    const comercial = limparObjeto({
      fornecedor: texto(get("FORNECEDOR")),
      uf,
      cidade,
      preco_inicial: numero(get("PRECO INICIAL")),
      certificado_erural: booleano(get("CERTIFICADO")),
      percentual_comercializado: numero(get("PERCENTUAL COMERCIALIZADO")),
      tipo: texto(get("TIPO")),
      tipo_genetica: texto(get("TIPO GENETICA")),
      especie: texto(get("CATEGORIA")),
      idade: texto(get("IDADE")),
      quantidade,
      org: texto(get("ORG")),
      csg: texto(get("CSG")),
      ceip: texto(get("CEIP")),
      utm_video: texto(get("UTM VIDEO")),
      utm_pl: texto(get("UTM PL")),
      drive: texto(get("DRIVE")),
    });

    const prenhez = limparObjeto({
      status: texto(get("STATUS REPRODUTIVO")),
      data_inseminacao: data(get("DATA INSEMINACAO")),
      formato_acasalamento: texto(get("FORMATO ACASALAMENTO")),
      oocitos: numero(get("OOCITOS")),
      embrioes: numero(get("EMBRIOES")),
    });

    const cria = limparObjeto({
      registro: texto(get("RGN CRIA")),
      pai: texto(get("PAI CRIA")),
      nascimento: data(get("NASC CRIA")),
      sexo: texto(get("SEXO CRIA")),
      iabcz: valorGenetico(get("iABCZg CRIA")),
      deca: valorGenetico(get("DECA CRIA")),
      mgte: valorGenetico(get("MGTe CRIA")),
      top_mgte: valorGenetico(get("TOP_MGTe CRIA")),
    });

    const extras = limparObjeto({ observacoes: texto(get("OBSs")) });

    const ficha = limparObjeto({ comercial, prenhez, cria, extras }) ?? {};

    /* --- categoria e sexo ------------------------------------------- */
    // Nem toda planilha traz a coluna GENERO (catálogos só de touros, por
    // exemplo). A CE (circunferência escrotal) só existe em macho e a prenhez
    // só em fêmea, então esses campos identificam o sexo quando a coluna não vem.
    const ceCm = numero(get("CE"));
    const temPrenhez = Boolean(texto(get("PAI DA PRENHEZ")) || data(get("PREVISAO PARTO")));
    const sexo = genero(get("GENERO")) ?? (ceCm != null ? "macho" : temPrenhez ? "femea" : null);
    const categoria =
      quantidade != null && quantidade > 1
        ? "Coletivo"
        : sexo === "macho"
          ? "Touro"
          : sexo === "femea"
            ? "Matriz"
            : null;

    const localizacao = [cidade, uf].filter(Boolean).join(" - ") || null;

    const animal: Record<string, unknown> = {
      nome,
      lote: texto(get("LOTE")),
      registro: texto(get("REGISTRO ANIMAL")),
      raca: texto(get("RAÇA")),
      fazenda: texto(get("FORNECEDOR")),
      fornecedor: texto(get("FORNECEDOR")),
      localizacao,
      categoria,
      sexo,
      nascimento: data(get("NASC ANIMAL")),
      peso_kg: numero(get("PESO (kg)")),
      ce_cm: ceCm,
      link_video: texto(get("LINK YOUTUBE")),
      link_erural: texto(get("LINK DO LOTE")),
      link_pre_lance: texto(get("P.L.")),
      descricao_longa: texto(get("OBS.:")),
      preco_total: numero(get("PRECO INICIAL")),
      comissao_percentual: numero(get("PERCENTUAL COMERCIALIZADO")),
      pai: texto(get("NOME PAI")),
      avo_paterno_pai: texto(get("AVO PATERNO")),
      avo_paterno_mae: texto(get("AVO PATERNA")),
      mae: texto(get("MAE")),
      avo_materno_pai: texto(get("AVO MATERNO")),
      avo_materno_mae: texto(get("AVO MATERNA")),
      iabcz: numero(get("iABCZ ANIMAL")),
      mgte: numero(get("MGTe")),
      iqg: numero(get("IQG")),
      estado_reprodutivo: texto(get("STATUS REPRODUTIVO")),
      previsao_parto: data(get("PREVISAO PARTO")),
      pai_prenhez: texto(get("PAI DA PRENHEZ")),
      genetica,
      ficha,
      ativo: true,
    };

    // Não envia chaves nulas para não sobrescrever defaults do banco.
    for (const k of Object.keys(animal)) {
      if (animal[k] == null) delete animal[k];
    }

    animais.push(animal);
  }

  const colunasDesconhecidas = animais.length
    ? campos.filter((c, i) => c && !conhecidas.has(c) && campos.indexOf(c) === i)
    : [];

  if (animais.length === 0 && ignoradas === 0) {
    avisos.push("A planilha não tem nenhuma linha preenchida abaixo do cabeçalho.");
  }

  return { animais, ignoradas, colunasDesconhecidas, linhaCabecalho: idxCab + 1, avisos };
}

/* ------------------------------------------------------------------ */
/* Modelo para download                                                */
/* ------------------------------------------------------------------ */

/** Gera o arquivo modelo com as duas linhas de cabeçalho e uma linha de exemplo. */
export function gerarModeloBaseErural(): Blob {
  const grupos: string[] = [];
  const campos: string[] = [];
  const exemplo: string[] = [];
  let ultimoGrupo = "";
  for (const c of BASE_ERURAL_COLUNAS) {
    grupos.push(c.grupo === ultimoGrupo ? "" : c.grupo);
    ultimoGrupo = c.grupo;
    campos.push(c.campo);
    exemplo.push(c.exemplo ?? "");
  }
  const ws = XLSX.utils.aoa_to_sheet([grupos, campos, exemplo]);
  ws["!cols"] = campos.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Base Catalogo VC");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/* ------------------------------------------------------------------ */
/* Layout "planilha de leilão" (abas MACHOS / FEMEAS)                  */
/* ------------------------------------------------------------------ */

/**
 * Algumas planilhas de leilão não usam os nomes da base erural: o cabeçalho
 * traz apenas "NOME" dentro do grupo ANIMAL, a genealogia vira uma coluna
 * "NOME" por parentesco e os blocos PMGZ / ANCP / GENEPLUS repetem
 * DECA / TOP / Pt ao lado de cada DEP. Este mapeamento lê esse formato
 * usando a linha de grupos como contexto.
 */

type Coluna = { grupo: string; campo: string; idx: number };

const PLACEHOLDERS = new Set(["XX", "X X", "-", "--", "N/A", "NA"]);

function textoLeilao(v: unknown): string | null {
  const s = texto(v);
  if (!s) return null;
  return PLACEHOLDERS.has(normalizarCabecalho(s)) ? null : s;
}

const ROTULO_PAR = /^(DECA|TOP|PT|P %|%)$/;

/** Rótulos amigáveis para os cabeçalhos normalizados (maiúsculos). */
const ROTULOS: Record<string, string> = {
  IABCZG: "iABCZg",
  IABCZ: "iABCZ",
  MGTE: "MGTe",
  IQGG: "IQGg",
  IQG: "IQG",
  PT: "Pt",
  TOP: "TOP",
  DECA: "DECA",
};

function rotulo(campo: string): string {
  return ROTULOS[campo] ?? campo;
}

function ehLinhaCabecalhoLeilao(norm: string[]): boolean {
  return norm.includes("NOME") && norm.includes("LOTE");
}

function acharLinhaCabecalhoLeilao(matriz: unknown[][]): number {
  for (let i = 0; i < Math.min(matriz.length, 15); i++) {
    if (ehLinhaCabecalhoLeilao((matriz[i] ?? []).map(normalizarCabecalho))) return i;
  }
  return -1;
}

/** Monta a lista de colunas com o grupo propagado para a direita. */
function colunasComGrupo(matriz: unknown[][], idxCab: number): Coluna[] {
  const campos = (matriz[idxCab] ?? []).map(normalizarCabecalho);
  const gruposCrus = idxCab > 0 ? (matriz[idxCab - 1] ?? []).map(normalizarCabecalho) : [];
  const cols: Coluna[] = [];
  let grupo = "";
  for (let i = 0; i < campos.length; i++) {
    if (gruposCrus[i]) grupo = gruposCrus[i];
    cols.push({ grupo, campo: campos[i] ?? "", idx: i });
  }
  return cols;
}

const GRUPOS_GENETICA: { grupo: string; chave: "pmgz" | "ancp" | "geneplus" }[] = [
  { grupo: "PMGZ", chave: "pmgz" },
  { grupo: "ANCP", chave: "ancp" },
  { grupo: "GENEPLUS", chave: "geneplus" },
];

/** Lê um bloco genético emparelhando cada DEP com o DECA/TOP/Pt à direita. */
function blocoLeilao(cols: Coluna[], linha: unknown[]): GeneticaBloco {
  const bloco = blocoVazio();
  let primeiro = true;
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i];
    if (!c.campo || ROTULO_PAR.test(c.campo)) continue;
    const prox = cols[i + 1];
    const par = prox && ROTULO_PAR.test(prox.campo) ? prox : null;
    const valor = valorGenetico(linha[c.idx]);
    const top = par ? valorGenetico(linha[par.idx]) : "";
    if (primeiro) {
      primeiro = false;
      adicionarResumo(bloco, rotulo(c.campo), linha[c.idx]);
      if (par) adicionarResumo(bloco, rotulo(par.campo), linha[par.idx]);
      // colunas soltas de percentual logo após o índice principal
      const extra = cols[i + 2];
      if (extra && /^(%|P %)$/.test(extra.campo)) adicionarResumo(bloco, "P%", linha[extra.idx]);
      continue;
    }
    if (!valor && !top) continue;
    bloco.linhas.push({ dep: rotulo(c.campo), indice: valor, top });
  }
  return bloco;
}

/** Converte "SETEMBRO DE 2026" ou uma data real em ISO quando possível. */
const MESES = ["JANEIRO", "FEVEREIRO", "MARCO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
function dataPorExtenso(v: unknown): string | null {
  const direta = data(v);
  if (direta) return direta;
  const s = normalizarCabecalho(v);
  const m = s.match(/^([A-Z]+)\s+DE\s+(\d{4})$/);
  if (!m) return null;
  const mes = MESES.indexOf(m[1]);
  if (mes < 0) return null;
  return `${m[2]}-${String(mes + 1).padStart(2, "0")}-01`;
}

/**
 * Mapeia uma aba no formato "planilha de leilão".
 * Linhas sem nome de animal são ignoradas.
 */
export function mapearPlanilhaLeilao(matriz: unknown[][]): ResultadoImportacao {
  const idxCab = acharLinhaCabecalhoLeilao(matriz);
  if (idxCab < 0) {
    return {
      animais: [],
      ignoradas: 0,
      colunasDesconhecidas: [],
      linhaCabecalho: -1,
      avisos: ['Não encontrei as colunas "LOTE" e "NOME" nesta aba.'],
    };
  }

  const cols = colunasComGrupo(matriz, idxCab);
  const geral = cols.filter((c) => !["PMGZ", "ANCP", "GENEPLUS"].includes(c.grupo));

  const idxDe = (campo: string, grupo?: string): number | null => {
    const alvo = normalizarCabecalho(campo);
    const g = grupo ? normalizarCabecalho(grupo) : null;
    const achou = geral.find((c) => c.campo === alvo && (!g || c.grupo === g));
    return achou ? achou.idx : null;
  };

  const idxGrupo = (grupo: string, campo = "NOME"): number | null => idxDe(campo, grupo);

  const animais: Record<string, unknown>[] = [];
  let ignoradas = 0;

  const iNome = idxDe("NOME", "ANIMAL") ?? idxDe("NOME");

  for (let r = idxCab + 1; r < matriz.length; r++) {
    const linha = matriz[r] ?? [];
    const val = (i: number | null) => (i == null ? null : linha[i] ?? null);
    const txt = (i: number | null) => textoLeilao(val(i));

    const nome = iNome == null ? null : textoLeilao(linha[iNome]);
    if (!nome || normalizarCabecalho(nome) === "NOME") {
      if (linha.some((v) => v != null && String(v).trim() !== "")) ignoradas++;
      continue;
    }

    /* genética por bloco */
    const genetica: GeneticaAnimal = {};
    for (const { grupo, chave } of GRUPOS_GENETICA) {
      const doGrupo = cols.filter((c) => c.grupo === grupo);
      if (!doGrupo.length) continue;
      const bloco = blocoLeilao(doGrupo, linha);
      if (bloco.resumo.length || bloco.linhas.length) genetica[chave] = bloco;
    }

    const iabczPrenhez = valorGenetico(val(idxDe("iABCZ", "DADOS PRENHEZ")));
    const decaPrenhez = valorGenetico(val(idxDe("DECA", "DADOS PRENHEZ")));
    const ventre = limparObjeto({ iabcz: iabczPrenhez, deca: decaPrenhez });
    if (ventre) genetica.ventre = ventre;

    const serie = txt(idxDe("SERIE / RGD")) ?? txt(idxDe("SERIE"));
    const rgn = txt(idxDe("RGN")) ?? txt(idxDe("RGD"));
    const registro = [serie, rgn].filter(Boolean).join(" - ") || null;

    const previsaoTexto = txt(idxDe("PREV PARTO", "DADOS PRENHEZ")) ?? txt(idxDe("PREV PARTO"));
    const paiPrenhez = txt(idxDe("ACASALAMENTO", "DADOS PRENHEZ")) ?? txt(idxDe("PRENHEZ", "ACASALAMENTO"));

    const prenhez = limparObjeto({
      status: previsaoTexto || paiPrenhez ? "Prenhe" : null,
      data_inseminacao: dataPorExtenso(val(idxDe("DATA IA", "DADOS PRENHEZ"))),
      previsao_texto: previsaoTexto,
    });

    const cria = limparObjeto({
      registro: txt(idxDe("RGN", "DADOS DA CRIA")),
      pai: txt(idxDe("PAI DA CRIA", "DADOS DA CRIA")),
      nascimento: dataPorExtenso(val(idxDe("NASC", "DADOS DA CRIA"))),
      sexo: txt(idxDe("SEXO", "DADOS DA CRIA")),
      iabcz: valorGenetico(val(idxDe("iABCZ", "DADOS DA CRIA"))),
      deca: valorGenetico(val(idxDe("DECA", "DADOS DA CRIA"))),
    });

    const fornecedor = txt(idxDe("VENDEDOR"));
    const comercial = limparObjeto({
      fornecedor,
      csg: txt(idxDe("CSG")),
    });

    const extras = limparObjeto({ observacoes: txt(idxDe("OBS")) });
    const ficha = limparObjeto({ comercial, prenhez, cria, extras }) ?? {};

    const sexo = genero(val(idxDe("SEXO", "ANIMAL")) ?? val(idxDe("SEXO")));
    const categoria = sexo === "macho" ? "Touro" : sexo === "femea" ? "Matriz" : null;

    const animal: Record<string, unknown> = {
      nome,
      lote: txt(idxDe("LOTE")),
      registro,
      raca: "Nelore",
      fazenda: fornecedor,
      fornecedor,
      categoria,
      sexo,
      nascimento: data(val(idxDe("NASC", "ANIMAL")) ?? val(idxDe("NASC"))),
      peso_kg: numero(val(idxDe("PESO"))),
      ce_cm: numero(val(idxDe("CE"))),
      descricao_longa: txt(idxDe("OBS")),
      pai: txt(idxGrupo("PAI")),
      avo_paterno_pai: txt(idxGrupo("AVO PATERNO")),
      avo_paterno_mae: txt(idxGrupo("AVO PATERNA")),
      mae: txt(idxGrupo("MAE")),
      avo_materno_pai: txt(idxGrupo("AVO MATERNO")),
      avo_materno_mae: txt(idxGrupo("AVO MATERNA")),
      iabcz: numero(val(idxDe("iABCZg", "PMGZ") ?? cols.find((c) => c.grupo === "PMGZ" && c.campo === "IABCZG")?.idx ?? null)),
      mgte: numero(val(cols.find((c) => c.grupo === "ANCP" && c.campo === "MGTE")?.idx ?? null)),
      iqg: numero(val(cols.find((c) => c.grupo === "GENEPLUS" && c.campo === "IQGG")?.idx ?? null)),
      estado_reprodutivo: previsaoTexto || paiPrenhez ? "Prenhe" : null,
      previsao_parto: dataPorExtenso(previsaoTexto),
      pai_prenhez: paiPrenhez,
      genetica,
      ficha,
      ativo: true,
    };

    for (const k of Object.keys(animal)) {
      if (animal[k] == null) delete animal[k];
    }

    animais.push(animal);
  }

  return {
    animais,
    ignoradas,
    colunasDesconhecidas: [],
    linhaCabecalho: idxCab + 1,
    avisos: animais.length ? [] : ["Nenhuma linha com nome de animal foi encontrada nesta aba."],
  };
}

/* ------------------------------------------------------------------ */
/* Leitura de todas as abas + escolha automática do layout             */
/* ------------------------------------------------------------------ */

export type Aba = { nome: string; matriz: unknown[][] };

/** Lê xlsx/xls/csv devolvendo todas as abas como matrizes. */
export function lerAbas(dados: ArrayBuffer | Uint8Array, nomeArquivo: string): Aba[] {
  const bytes = dados instanceof Uint8Array ? dados : new Uint8Array(dados);
  const ehTexto = /\.csv$/i.test(nomeArquivo);
  const wb = ehTexto
    ? XLSX.read(new TextDecoder("utf-8").decode(bytes), { type: "string", cellDates: true, raw: false })
    : XLSX.read(bytes, { type: "array", cellDates: true });
  return wb.SheetNames.map((nome) => {
    const ws = wb.Sheets[nome];
    return {
      nome,
      matriz: ws ? XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null, blankrows: false }) : [],
    };
  });
}

/** Mapeia uma aba escolhendo entre base erural e planilha de leilão. */
export function mapearAba(matriz: unknown[][]): ResultadoImportacao {
  const temNomeAnimal = matriz
    .slice(0, 15)
    .some((l) => (l ?? []).map(normalizarCabecalho).includes("NOME ANIMAL"));
  return temNomeAnimal ? mapearBaseErural(matriz) : mapearPlanilhaLeilao(matriz);
}

/**
 * Mapeia o arquivo inteiro: junta todas as abas reconhecidas e remove
 * duplicatas (planilhas de leilão costumam ter uma aba "RESUMO" com os
 * mesmos animais).
 */
export function mapearArquivo(abas: Aba[]): ResultadoImportacao {
  const animais: Record<string, unknown>[] = [];
  const vistos = new Set<string>();
  const avisos: string[] = [];
  const colunasDesconhecidas: string[] = [];
  let ignoradas = 0;
  let linhaCabecalho = -1;

  for (const aba of abas) {
    const r = mapearAba(aba.matriz);
    if (!r.animais.length) continue;
    if (linhaCabecalho < 0) linhaCabecalho = r.linhaCabecalho;
    ignoradas += r.ignoradas;
    for (const c of r.colunasDesconhecidas) if (!colunasDesconhecidas.includes(c)) colunasDesconhecidas.push(c);
    for (const a of r.animais) {
      const chave = `${normalizarCabecalho(a.nome)}|${normalizarCabecalho(a.lote ?? "")}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      animais.push(a);
    }
  }

  if (!animais.length) {
    avisos.push(
      'Não reconheci nenhuma linha de animal. A planilha precisa ter uma linha de cabeçalho com "NOME ANIMAL" (base erural) ou "LOTE" + "NOME" (planilha de leilão).',
    );
  }

  return { animais, ignoradas, colunasDesconhecidas, linhaCabecalho, avisos };
}
