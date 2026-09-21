import type { AvaliacaoLinha } from "@/hooks/useCatalogo";

export function AvaliacaoGenetica({ linhas }: { linhas?: AvaliacaoLinha[] | null }) {
  if (!linhas || linhas.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-black/5 bg-white">
      <div className="px-4 py-2 border-b border-black/5 bg-amber-50/70 text-amber-900 text-xs font-medium tracking-wide">
        ABCZ · Avaliação Genética
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-neutral-600">
            <th className="py-2 px-4 font-medium w-1/2">Característica</th>
            <th className="py-2 px-4 font-medium">DEP</th>
            <th className="py-2 px-4 font-medium">DECA</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-neutral-50/60"}>
              <td className="py-2 px-4 uppercase tracking-wide text-neutral-800 border-t border-black/5">{l.caracteristica}</td>
              <td className="py-2 px-4 text-neutral-900 border-t border-black/5">{l.dep || "-"}</td>
              <td className="py-2 px-4 text-[hsl(var(--catalog-primary))] font-medium border-t border-black/5">{l.deca || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}