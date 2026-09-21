import type { Animal } from "@/hooks/useCatalogo";
import type { EmbriaoAcasalamento, EmbriaoDados, EmbriaoPessoa } from "@/types/embrioes";

/**
 * Dados do pacote para exibição. Usa `animal.embriao` (planilha de embriões)
 * e, para um embrião cadastrado à mão sem a planilha, monta o pacote a partir
 * dos campos comuns (mãe = doadora, pai = touro, MGTe, iABCZ).
 */
export function dadosEmbriao(animal: Animal): EmbriaoDados {
  if (animal.embriao && Array.isArray(animal.embriao.acasalamentos)) return animal.embriao;
  const pessoas = (s?: string | null): EmbriaoPessoa[] =>
    (s ?? "").split(/[;,]+/).map((x) => x.trim()).filter(Boolean).map((nome) => ({ nome }));
  const acas: EmbriaoAcasalamento = {
    doadoras: pessoas(animal.mae),
    avos_maternos: pessoas(animal.avo_materno_pai),
    touros: pessoas(animal.pai),
    ancp: animal.mgte != null ? [{ sigla: "MGTe", valor: animal.mgte.toLocaleString("pt-BR"), top: "" }] : [],
    pmgz: animal.iabcz != null ? { iabcz: animal.iabcz.toLocaleString("pt-BR") } : {},
  };
  const temAcas = acas.doadoras.length || acas.touros.length || acas.ancp.length || Object.keys(acas.pmgz).length;
  return {
    quantidade: animal.ficha?.comercial?.quantidade ?? null,
    tipo: "DT",
    garantia_prenhezes: null,
    garantia_percentual: null,
    raca: animal.raca ?? undefined,
    criatorio: animal.fazenda ?? animal.fornecedor ?? undefined,
    valor_pacote: animal.preco_total,
    parcelas: animal.parcelas,
    observacoes: animal.descricao_longa ?? undefined,
    link_video: animal.link_video ?? undefined,
    fotos: animal.foto_url ? [animal.foto_url] : undefined,
    acasalamentos: temAcas ? [acas] : [],
  };
}

export function brl(v?: number | null, casas = 0): string {
  if (v == null) return "";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function textoGarantia(d: EmbriaoDados): { numero: string; rotulo: string } | null {
  if (d.garantia_prenhezes != null) return { numero: String(d.garantia_prenhezes), rotulo: d.garantia_prenhezes === 1 ? "prenhez" : "prenhezes" };
  if (d.garantia_percentual != null) return { numero: `${d.garantia_percentual.toLocaleString("pt-BR")}%`, rotulo: "de prenhezes" };
  return null;
}

export function ehSexado(semen?: string): boolean {
  return /sexad/i.test(semen ?? "");
}

/** "Lotes 1 a 10" por criatório, na ordem dos lotes. */
export function faixasPorCriatorio(lotes: Animal[]): { criatorio: string; de: string; ate: string; total: number }[] {
  const grupos: { criatorio: string; lotes: string[] }[] = [];
  for (const a of lotes) {
    const c = (a.embriao?.criatorio ?? a.fazenda ?? a.fornecedor ?? "").trim() || "Outros";
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.criatorio === c) ultimo.lotes.push(a.lote ?? "");
    else grupos.push({ criatorio: c, lotes: [a.lote ?? ""] });
  }
  return grupos.map((g) => ({ criatorio: g.criatorio, de: g.lotes[0], ate: g.lotes[g.lotes.length - 1], total: g.lotes.length }));
}

export function msgInteresseEmbriao(a: Pick<Animal, "nome" | "lote">, evento?: string | null) {
  return `Olá! Tenho interesse no pacote de embriões ${a.nome}${a.lote ? ` — Lote ${a.lote}` : ""}${evento ? ` (${evento})` : ""}.`;
}

export function msgPropostaEmbriao(a: Pick<Animal, "nome" | "lote">, evento?: string | null) {
  return `Olá! Quero fazer uma proposta pelo pacote de embriões ${a.nome}${a.lote ? ` — Lote ${a.lote}` : ""}${evento ? ` (${evento})` : ""}.`;
}
