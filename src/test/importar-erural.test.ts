import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import {
  BASE_ERURAL_COLUNAS,
  lerArquivo,
  mapearBaseErural,
  normalizarCabecalho,
  numero,
  data,
  genero,
} from "@/lib/importar-erural";

/** Monta um .xlsx no formato da base erural com as linhas informadas. */
function planilha(linhas: Record<string, string | number>[]): ArrayBuffer {
  const grupos: string[] = [];
  const campos: string[] = [];
  let ultimo = "";
  for (const c of BASE_ERURAL_COLUNAS) {
    grupos.push(c.grupo === ultimo ? "" : c.grupo);
    ultimo = c.grupo;
    campos.push(c.campo);
  }
  const corpo = linhas.map((l) => campos.map((c) => l[c] ?? ""));
  const ws = XLSX.utils.aoa_to_sheet([grupos, campos, ...corpo]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Nova Base Sheet");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

const LINHA_FEMEA: Record<string, string | number> = {
  "LINK DO LOTE": "https://erural.net/lote/2",
  "LINK YOUTUBE": "https://youtu.be/abc123",
  "P.L.": "https://erural.net/pre-lance/2",
  "OBS.:": "Fêmea prenhe de touro provado.",
  LOTE: "2",
  FORNECEDOR: "Nelore VC",
  UF: "PR",
  CIDADE: "Londrina",
  "PRECO INICIAL": "18.000,00",
  "CERTIFICADO": "TRUE",
  "PERCENTUAL COMERCIALIZADO": "8",
  RAÇA: "Nelore",
  "NOME ANIMAL": "9335 FIV PO DA VC",
  "REGISTRO ANIMAL": "VCA - 9335",
  "NASC ANIMAL": "01/04/2025",
  GENERO: "Fêmea",
  QUANTIDADE: 1,
  "NOME PAI": "REM1416L FIV GENETICA ADITIVA",
  "AVO PATERNO": "REM GRINGO GENETICA ADITIVA",
  "AVO PATERNA": "REM GUAIAMA",
  MAE: "8295 FIV PO DA VC",
  "AVO MATERNO": "DIPLOMATA DA AGRONOVA",
  "AVO MATERNA": "7175 PO DA VC",
  "iABCZ ANIMAL": "33,51",
  "DECA ANIMAL": "1",
  "P%": "0,1",
  MGTe: "36,05",
  TOP_MGTe: "0,1",
  IQG: "41,74",
  TOP_IQG: "0,1",
  "DEP PN-EDg": "0,85",
  "DECA PN-EDg": "10",
  "DEP PD-EDg": "20,12",
  "DECA PD-EDg": "1",
  "DEP DP210": "21,82",
  "TOP DP210": "1",
  "DEP MAR": "0,06",
  "TOP MA": "20",
  "EGS Dep": "1,41",
  "EGS Pt": "4",
  "MAR Dep": "0,68",
  "MAR Pt": "22",
  "STATUS REPRODUTIVO": "Prenhe",
  "PREVISAO PARTO": "01/02/2027",
  "PAI DA PRENHEZ": "PARATUDO FIV RG",
  "Iabcz PRENHEZ": "31,52",
  "DECA PRENHEZ": "1",
  "RGN CRIA": "VCA - 9999",
  "PAI CRIA": "SUPREMO FIV JMP",
  "NASC. CRIA": "10/01/2026",
  "SEXO CRIA": "Macho",
};

const LINHA_TOURO: Record<string, string | number> = {
  LOTE: "200",
  "NOME ANIMAL": "8226 FIV PO DA VC",
  "REGISTRO ANIMAL": "VCA - 8226",
  "NASC ANIMAL": "08/03/2023",
  "PESO (kg)": "965",
  CE: "39",
  GENERO: "Macho",
  QUANTIDADE: 1,
};

describe("normalização de valores", () => {
  it("normaliza cabeçalhos com acento e pontuação", () => {
    expect(normalizarCabecalho("RAÇA")).toBe("RACA");
    expect(normalizarCabecalho("P.L.")).toBe("PL");
    expect(normalizarCabecalho("NASC. CRIA")).toBe("NASC CRIA");
    expect(normalizarCabecalho("  iABCZ   ANIMAL ")).toBe("IABCZ ANIMAL");
  });

  it("lê números no padrão brasileiro", () => {
    expect(numero("18.000,00")).toBe(18000);
    expect(numero("33,51")).toBe(33.51);
    expect(numero("965")).toBe(965);
    expect(numero("39 cm")).toBe(39);
    expect(numero("")).toBeNull();
  });

  it("lê datas em dd/mm/aaaa e Date", () => {
    expect(data("01/04/2025")).toBe("2025-04-01");
    expect(data(new Date(2027, 1, 1))).toBe("2027-02-01");
    expect(data("")).toBeNull();
  });

  it("normaliza o gênero", () => {
    expect(genero("Fêmea")).toBe("femea");
    expect(genero("M")).toBe("macho");
    expect(genero("Touro")).toBe("macho");
    expect(genero("")).toBeNull();
  });
});

describe("mapeamento da base erural", () => {
  const res = mapearBaseErural(lerArquivo(planilha([LINHA_FEMEA, LINHA_TOURO]), "base.xlsx"));

  it("encontra o cabeçalho e as duas linhas", () => {
    expect(res.linhaCabecalho).toBe(2);
    expect(res.animais).toHaveLength(2);
    expect(res.colunasDesconhecidas).toEqual([]);
  });

  it("mapeia identificação, pedigree e comercial da fêmea", () => {
    const a = res.animais[0];
    expect(a.nome).toBe("9335 FIV PO DA VC");
    expect(a.lote).toBe("2");
    expect(a.registro).toBe("VCA - 9335");
    expect(a.sexo).toBe("femea");
    expect(a.categoria).toBe("Matriz");
    expect(a.nascimento).toBe("2025-04-01");
    expect(a.localizacao).toBe("Londrina - PR");
    expect(a.preco_total).toBe(18000);
    expect(a.comissao_percentual).toBe(8);
    expect(a.pai).toBe("REM1416L FIV GENETICA ADITIVA");
    expect(a.avo_materno_mae).toBe("7175 PO DA VC");
    expect(a.link_pre_lance).toBe("https://erural.net/pre-lance/2");
    expect(a.link_erural).toBe("https://erural.net/lote/2");
    expect(a.link_video).toBe("https://youtu.be/abc123");
  });

  it("monta os três blocos genéticos com resumo e tabela", () => {
    const g = res.animais[0].genetica as Record<string, { resumo: unknown[]; linhas: unknown[] }>;
    expect(g.pmgz.resumo).toEqual([
      { label: "iABCZ", valor: "33,51" },
      { label: "DECA", valor: "1" },
      { label: "P%", valor: "0,1" },
    ]);
    expect(g.pmgz.linhas).toEqual([
      { dep: "PNg", indice: "0,85", top: "10" },
      { dep: "PDg", indice: "20,12", top: "1" },
    ]);
    expect(g.ancp.resumo).toEqual([
      { label: "MGTe", valor: "36,05" },
      { label: "TOP", valor: "0,1" },
    ]);
    expect(g.ancp.linhas).toEqual([
      { dep: "DP210", indice: "21,82", top: "1" },
      { dep: "MAR", indice: "0,06", top: "20" },
    ]);
    expect(g.geneplus.linhas).toEqual([
      { dep: "EGS", indice: "1,41", top: "4" },
      { dep: "MAR", indice: "0,68", top: "22" },
    ]);
  });

  it("separa MAR da ANCP e do GenePlus pelo grupo do cabeçalho", () => {
    const g = res.animais[0].genetica as Record<string, { linhas: { dep: string; indice: string }[] }>;
    const marAncp = g.ancp.linhas.find((l) => l.dep === "MAR");
    const marGp = g.geneplus.linhas.find((l) => l.dep === "MAR");
    expect(marAncp?.indice).toBe("0,06");
    expect(marGp?.indice).toBe("0,68");
  });

  it("leva prenhez para o ventre e guarda a cria ao pé", () => {
    const a = res.animais[0];
    const g = a.genetica as { ventre?: Record<string, string> };
    expect(a.estado_reprodutivo).toBe("Prenhe");
    expect(a.previsao_parto).toBe("2027-02-01");
    expect(a.pai_prenhez).toBe("PARATUDO FIV RG");
    expect(g.ventre).toEqual({ iabcz: "31,52", deca: "1" });

    const ficha = a.ficha as { cria?: Record<string, unknown>; comercial?: Record<string, unknown> };
    expect(ficha.cria).toMatchObject({
      registro: "VCA - 9999",
      pai: "SUPREMO FIV JMP",
      nascimento: "2026-01-10",
      sexo: "Macho",
    });
    expect(ficha.comercial).toMatchObject({ uf: "PR", cidade: "Londrina", certificado_erural: true });
  });

  it("classifica o macho e traz peso e CE", () => {
    const t = res.animais[1];
    expect(t.sexo).toBe("macho");
    expect(t.categoria).toBe("Touro");
    expect(t.peso_kg).toBe(965);
    expect(t.ce_cm).toBe(39);
    expect(t.ficha).toEqual({ comercial: { quantidade: 1 } });
  });

  it("ignora linhas sem nome de animal", () => {
    const vazia = mapearBaseErural(lerArquivo(planilha([{ LOTE: "9" }]), "base.xlsx"));
    expect(vazia.animais).toHaveLength(0);
    expect(vazia.ignoradas).toBe(1);
  });

  it("avisa quando o arquivo não é a base erural", () => {
    const ws = XLSX.utils.aoa_to_sheet([["a", "b"], [1, 2]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "x");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
    const r = mapearBaseErural(lerArquivo(buf, "outro.xlsx"));
    expect(r.animais).toHaveLength(0);
    expect(r.avisos[0]).toContain("NOME ANIMAL");
  });
});
