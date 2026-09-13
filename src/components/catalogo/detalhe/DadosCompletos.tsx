import type { Animal } from "@/hooks/useCatalogo";

/**
 * Todos os dados cadastrais do animal em grupos legíveis.
 * Só renderiza os grupos que realmente têm informação preenchida.
 */

function fmtData(d?: string | null) {
  if (!d) return null;
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
}

function fmtNum(v?: number | null, sufixo = "") {
  if (v == null) return null;
  return `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}${sufixo}`;
}

function fmtBRL(v?: number | null) {
  if (v == null) return null;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

type Linha = [string, string | null | undefined];

function Grupo({ titulo, linhas }: { titulo: string; linhas: Linha[] }) {
  const itens = linhas.filter(([, v]) => v != null && String(v).trim() !== "") as [string, string][];
  if (!itens.length) return null;
  return (
    <div className="rounded-2xl border border-black/5 bg-white overflow-hidden">
      <div className="px-4 sm:px-5 py-2.5 border-b border-black/5 bg-neutral-50/80">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{titulo}</h3>
      </div>
      <dl className="divide-y divide-black/5">
        {itens.map(([k, v]) => (
          <div key={k} className="flex items-start gap-3 px-4 sm:px-5 py-2.5 text-sm">
            <dt className="w-2/5 shrink-0 text-neutral-500">{k}</dt>
            <dd className="min-w-0 flex-1 font-medium text-neutral-900 break-words">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function DadosCompletos({ animal }: { animal: Animal }) {
  const c = animal.ficha?.comercial;
  const p = animal.ficha?.prenhez;
  const obs = animal.ficha?.extras?.observacoes;

  const identificacao: Linha[] = [
    ["Nome", animal.nome],
    ["Lote", animal.lote],
    ["Registro", animal.registro],
    ["Categoria", animal.categoria],
    ["Raça", animal.raca],
    ["Sexo", animal.sexo === "macho" ? "Macho" : animal.sexo === "femea" ? "Fêmea" : null],
    ["Nascimento", fmtData(animal.nascimento)],
    ["Idade", c?.idade],
    ["Peso", fmtNum(animal.peso_kg, " kg")],
    ["CE", fmtNum(animal.ce_cm, " cm")],
    ["Registrado ABCZ", animal.registrado_abcz ? "Sim" : null],
  ];

const indices: Linha[] = [
    ["iABCZ", animal.iabcz != null ? String(animal.iabcz) : null],
    ["MGTe", animal.mgte != null ? String(animal.mgte) : null],
    ["IQG", animal.iqg != null ? String(animal.iqg) : null],
    ["Tipo genética", c?.tipo_genetica],
    ["CSG", c?.csg],
    ["CEIP", c?.ceip],
  ];

  const reproducao: Linha[] = [
    ["Estado reprodutivo", animal.estado_reprodutivo],
    ["Status da prenhez", p?.status],
    ["Data da inseminação", fmtData(p?.data_inseminacao)],
    ["Formato de acasalamento", p?.formato_acasalamento],
    ["Oócitos", p?.oocitos != null ? String(p.oocitos) : null],
    ["Embriões", p?.embrioes != null ? String(p.embrioes) : null],
    ["Pai da prenhez", animal.pai_prenhez],
    ["Previsão do parto", fmtData(animal.previsao_parto)],
  ];

  const comercial: Linha[] = [
    ["Valor total", fmtBRL(animal.preco_total)],
    ["Parcelamento", animal.parcelas && animal.valor_parcela ? `${animal.parcelas}x de ${fmtBRL(animal.valor_parcela)}` : null],
    ["Preço inicial", fmtBRL(c?.preco_inicial)],
    ["Comissão", animal.comissao_percentual != null ? `${fmtNum(animal.comissao_percentual)}%` : null],
    ["Quantidade", c?.quantidade != null ? String(c.quantidade) : null],
    ["Tipo do lote", c?.tipo],
    ["Espécie", c?.especie],
    ["Fornecedor", animal.fornecedor ?? c?.fornecedor ?? animal.fazenda],
    ["Localização", animal.localizacao ?? ([c?.cidade, c?.uf].filter(Boolean).join(" / ") || null)],
    ["Certificado", c?.certificado_erural ? "Sim" : null],
  ];

  return (
    <section id="dados" className="space-y-4">
      <header className="flex items-baseline gap-3">
        <h2 className="font-display text-xl sm:text-2xl font-semibold text-neutral-900">Informações completas</h2>
        <span className="h-px flex-1 bg-black/10" />
      </header>

      <div className="grid gap-4 md:grid-cols-2">
<Grupo titulo="Identificação" linhas={identificacao} />
        <Grupo titulo="Índices e certificações" linhas={indices} />
        <Grupo titulo="Reprodução" linhas={reproducao} />
        <Grupo titulo="Comercial" linhas={comercial} />
        {obs && <Grupo titulo="Observações" linhas={[["Observações", obs]]} />}
      </div>
    </section>
  );
}
