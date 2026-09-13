import type { Animal } from "@/hooks/useCatalogo";

function Node({ nome, sexo }: { nome?: string | null; sexo: "m" | "f" }) {
  const symbol = sexo === "m" ? "♂" : "♀";
  const color = sexo === "m" ? "text-sky-600" : "text-rose-500";
  return (
    <div className="flex items-center gap-2 rounded-md border border-black/5 bg-white px-3 py-2 text-sm">
      <span className={`text-base leading-none ${color}`} aria-label={sexo === "m" ? "macho" : "fêmea"}>{symbol}</span>
      <span className="uppercase tracking-wide text-neutral-800 truncate">{nome || "—"}</span>
    </div>
  );
}

export function Pedigree({ animal }: { animal: Animal }) {
  const has =
    animal.pai || animal.mae ||
    animal.avo_paterno_pai || animal.avo_paterno_mae ||
    animal.avo_materno_pai || animal.avo_materno_mae;
  if (!has) return null;
  return (
    <section>
      <div className="grid grid-cols-2 gap-8 mb-3 text-xs uppercase tracking-wider text-neutral-500">
        <div className="text-center">Avós</div>
        <div className="text-center">Pais</div>
      </div>
      <div className="grid grid-cols-2 gap-8 items-center">
        <div className="space-y-2">
          <Node nome={animal.avo_paterno_pai} sexo="m" />
          <Node nome={animal.avo_paterno_mae} sexo="f" />
          <div className="h-6" />
          <Node nome={animal.avo_materno_pai} sexo="m" />
          <Node nome={animal.avo_materno_mae} sexo="f" />
        </div>
        <div className="space-y-6 flex flex-col justify-center h-full">
          <Node nome={animal.pai} sexo="m" />
          <Node nome={animal.mae} sexo="f" />
        </div>
      </div>
    </section>
  );
}