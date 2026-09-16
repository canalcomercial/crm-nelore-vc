import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { gerarModeloEmbrioesBytes, mapearArquivoEmbrioes, valorBR } from "@/lib/importar-embrioes";
import type { EmbriaoDados } from "@/types/embrioes";

async function modeloBytes() {
  return new Uint8Array(gerarModeloEmbrioesBytes());
}

describe("Planilha de embriões", () => {
  it("lê o modelo: pacotes, acasalamentos e projeções", async () => {
    const r = mapearArquivoEmbrioes(await modeloBytes(), "modelo.xlsx", { eventoId: "ev1" });
    expect(r.avisos).toEqual([]);
    expect(r.pacotes).toHaveLength(6);
    expect(r.acasalamentos).toBe(7);
    const l1 = r.pacotes[0];
    expect(l1).toMatchObject({ lote: "1", nome: "Família FNAN Celestial", categoria: "Embrião", evento_id: "ev1", preco_total: 21000, parcelas: 30 });
    const d1 = l1.embriao as EmbriaoDados;
    expect(d1.quantidade).toBe(6);
    expect(d1.garantia_prenhezes).toBe(2);
    expect(d1.acasalamentos[0].touros[0]).toEqual({ nome: "NOBRE DA 7P", registro: "FNFJ 7" });
    expect(d1.acasalamentos[0].ancp[0]).toEqual({ sigla: "MGTe", valor: "42", top: "0,1" });
    expect(d1.acasalamentos[0].pmgz).toEqual({ iabcz: "40,73", p: "0,1" });

    const l2 = r.pacotes[1].embriao as EmbriaoDados;
    expect(l2.acasalamentos[0].livre_acasalamento).toBe(true);
    expect(l2.acasalamentos[0].touros).toEqual([]);
    expect(l2.acasalamentos[0].doadoras[0]).toEqual({ nome: "FNAN CELESTIAL FIV", registro: "FNAN 120" });

    const misto = r.pacotes[5];
    const dm = misto.embriao as EmbriaoDados;
    expect(misto.lote).toBe("36");
    expect(dm.acasalamentos).toHaveLength(2);
    expect(dm.acasalamentos.map((a) => a.quantidade)).toEqual([7, 5]);
    expect(dm.garantia_percentual).toBe(35);
    expect(misto.mae).toBe("VCA 8599, VCA 8283");
    expect(dm.acasalamentos[0].avos_paternos?.[0].nome).toBe("IDEALIZADOR FIV DA XARAES");
    expect(dm.acasalamentos[0].avos_maternas?.[0].nome).toBe("7550 FIV PO DA VC");
    expect(dm.regras_garantia).toMatch(/35%/);
    const l38 = r.pacotes[4].embriao as EmbriaoDados;
    expect(l38.acasalamentos[0].doadoras.map((d) => d.nome)).toEqual(["VCN3443", "VCN3433", "VCN3445"]);
  });

  it("aceita cabeçalho simples, vários nomes e texto com vírgula", () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Lote", "Nome do pacote", "Qtd embriões", "Garantia", "Doadoras", "Touros", "MGTe", "TOP MGTe"],
      ["20", "Família Jade", "10", "4", "FVC14183; FVCP1901; FVC14838", "Livre acasalamento", "", ""],
      ["41", "Melhores da Safra", 30, 10, "", "BRONZE FIV JMP, ABSOLUTO RG", "39,91", "0,1"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "x");
    const bytes = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
    const r = mapearArquivoEmbrioes(bytes, "x.xlsx");
    expect(r.pacotes).toHaveLength(2);
    const a = (r.pacotes[0].embriao as EmbriaoDados).acasalamentos[0];
    expect(a.doadoras.map((d) => d.nome)).toEqual(["FVC14183", "FVCP1901", "FVC14838"]);
    expect(a.livre_acasalamento).toBe(true);
    const b = (r.pacotes[1].embriao as EmbriaoDados).acasalamentos[0];
    expect(b.touros.map((t) => t.nome)).toEqual(["BRONZE FIV JMP", "ABSOLUTO RG"]);
    expect(b.ancp[0]).toEqual({ sigla: "MGTe", valor: "39,91", top: "0,1" });
  });

  it("entende o layout do catálogo: TOP% logo após cada DEP e cabeçalhos livres", () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Lote", "Título", "Embriões DT", "Garantia prenhezes", "Nº de parcelas", "Doadora", "Avô materno do embrião", "Acasalamento", "MGTe", "TOP%", "D3P", "TOP%", "iABCZ", "P%"],
      ["38", "Excelência Premium", 6, 2, 30, "BETINA FIV (LCF 923)", "GURUPI MAT. (7475 DA IPB)", "ABSOLUTO RG (RGMC11)", 41.503, 0.1, 92.268, 1, 38.293, 0.1],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "x");
    const r = mapearArquivoEmbrioes(XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer, "x.xlsx");
    expect(r.colunasDesconhecidas).toEqual([]);
    const p = r.pacotes[0];
    const d = p.embriao as EmbriaoDados;
    expect(p.nome).toBe("Excelência Premium");
    expect(d.quantidade).toBe(6);
    expect(d.garantia_prenhezes).toBe(2);
    expect(d.parcelas).toBe(30);
    const a = d.acasalamentos[0];
    expect(a.doadoras[0]).toEqual({ nome: "BETINA FIV", registro: "LCF 923" });
    expect(a.avos_maternos[0]).toEqual({ nome: "GURUPI MAT.", registro: "7475 DA IPB" });
    expect(a.touros[0]).toEqual({ nome: "ABSOLUTO RG", registro: "RGMC11" });
    expect(a.ancp).toEqual([{ sigla: "MGTe", valor: "41,503", top: "0,1" }, { sigla: "D3P", valor: "92,268", top: "1" }]);
    expect(a.pmgz).toEqual({ iabcz: "38,293", p: "0,1" });
  });

  it("avisa quando não é planilha de embriões", () => {
    const ws = XLSX.utils.aoa_to_sheet([["NOME ANIMAL", "RGD"], ["X", "Y"]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "x");
    const r = mapearArquivoEmbrioes(XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer, "x.xlsx");
    expect(r.pacotes).toHaveLength(0);
    expect(r.avisos[0]).toMatch(/cabeçalho/);
    expect(valorBR(41.55)).toBe("41,55");
  });
});
