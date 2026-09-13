import type { Animal } from "@/hooks/useCatalogo";

function fmtDate(d?: string | null) {
  if (!d) return "-";
  try { return new Date(d + "T00:00:00").toLocaleDateString("pt-BR"); } catch { return d; }
}

export function FichaTecnica({ animal }: { animal: Animal }) {
  const rows: [string, React.ReactNode][] = [
    ["Nome (Registro)", animal.nome + (animal.lote ? ` (${animal.lote})` : "")],
    ["Categoria", animal.categoria ?? "-"],
    ["Raça", animal.raca ?? "-"],
    ["Nascimento", fmtDate(animal.nascimento)],
    ["iABCZ - Ranking", animal.iabcz != null ? String(animal.iabcz) : "-"],
    ["MGTE", animal.mgte != null ? String(animal.mgte) : "-"],
    ["IQG", animal.iqg != null ? String(animal.iqg) : "-"],
    ["Estado Reprodutivo", animal.estado_reprodutivo ?? "-"],
    ["Previsão do Parto", fmtDate(animal.previsao_parto)],
    ["Pai da Prenhez", animal.pai_prenhez ?? "-"],
    ["Peso", animal.peso_kg != null ? `${animal.peso_kg} kg` : "-"],
    ["Fornecedor", animal.fornecedor ?? animal.fazenda ?? "-"],
    ["Localização", animal.localizacao ?? "-"],
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-black/5 bg-white">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([k, v], i) => (
            <tr key={k} className={i % 2 === 0 ? "bg-white" : "bg-neutral-50/60"}>
              <th className="text-left font-medium text-neutral-700 py-2.5 px-4 w-1/3 border-b border-black/5">{k}</th>
              <td className="py-2.5 px-4 text-neutral-900 border-b border-black/5">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}