import { Link } from "react-router-dom";
import { Dna, ShieldCheck } from "lucide-react";
import type { Animal } from "@/hooks/useCatalogo";
import { brl, dadosEmbriao, ehSexado, textoGarantia } from "@/lib/embrioes";
import { VC } from "./paleta";

/** Cartão do pacote de embriões — mesma família visual do catálogo Nelore VC. */
export function EmbriaoCard({ animal, compacto = false }: { animal: Animal; compacto?: boolean }) {
  const d = dadosEmbriao(animal);
  const g = textoGarantia(d);
  const a = d.acasalamentos[0];
  const mgte = a?.ancp.find((p) => p.sigla === "MGTe");
  const doadoras = d.acasalamentos.flatMap((x) => x.doadoras).map((x) => x.nome);
  const touros = d.acasalamentos.flatMap((x) => x.touros).map((x) => x.nome);
  const livre = d.acasalamentos.some((x) => x.livre_acasalamento);
  const foto = animal.foto_url ?? d.fotos?.[0];

  return (
    <Link
      to={`/catalogo/${animal.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2"
      style={{ outlineColor: VC.vermelho }}
      data-testid="embriao-card"
    >
      {foto ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
          <img src={foto} alt={animal.nome} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
          <LoteSelo lote={animal.lote} className="absolute left-3 top-3" />
        </div>
      ) : (
        <div className="relative px-4 pt-4 pb-3 text-white" style={{ background: VC.preto }}>
          <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: VC.vermelho }} />
          <div className="flex items-center justify-between gap-3">
            <LoteSelo lote={animal.lote} />
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">{d.criatorio}</span>
          </div>
          {!compacto && (doadoras.length > 0 ? (
              <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
                <span className="truncate text-xs font-bold uppercase">{doadoras[0]}{doadoras.length > 1 ? ` +${doadoras.length - 1}` : ""}</span>
                <span className="text-lg" style={{ color: VC.vermelho }}>×</span>
                <span className="truncate text-xs font-bold uppercase">{touros[0] ?? (livre ? "Livre acasalamento" : "—")}</span>
              </div>
            ) : (
              <div className="mt-3 text-center text-xs font-bold uppercase truncate">
                <span className="mr-2 text-[10px] font-semibold tracking-[0.2em] text-white/60">Acasalamento</span>
                {touros.join(" · ") || (livre ? "Livre acasalamento" : "—")}
              </div>
            ))}
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-extrabold uppercase leading-tight tracking-tight line-clamp-2" style={{ color: VC.preto }}>{animal.nome}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide">
          {d.quantidade != null && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-white" style={{ background: VC.preto }}>
              <Dna className="h-3 w-3" /> {d.quantidade} embriões {d.tipo}
            </span>
          )}
          {g && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: VC.vermelhoSuave, color: VC.vermelho }}>
              <ShieldCheck className="h-3 w-3" /> Garantia {g.numero}
            </span>
          )}
          {ehSexado(d.semen) && <span className="rounded-full px-2 py-0.5" style={{ background: VC.caixa, color: VC.pretoSuave }}>Sexado</span>}
        </div>

        {!compacto && (
          <dl className="mt-3 space-y-1 text-xs">
            {doadoras.length > 0 && (
              <div className="flex gap-2"><dt className="w-16 shrink-0" style={{ color: VC.cinzaTexto }}>Doadora</dt><dd className="truncate font-semibold" style={{ color: VC.preto }}>{doadoras.join(", ")}</dd></div>
            )}
            {(touros.length > 0 || livre) && (
              <div className="flex gap-2"><dt className="w-16 shrink-0" style={{ color: VC.cinzaTexto }}>Touro</dt><dd className="truncate font-semibold" style={{ color: VC.preto }}>{touros.length ? touros.join(", ") : "Livre acasalamento"}</dd></div>
            )}
          </dl>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="flex gap-3 text-center">
            {mgte?.valor && (
              <div><div className="text-[10px] font-bold" style={{ color: VC.cinzaTexto }}>MGTe</div><div className="text-base font-extrabold leading-none" style={{ color: VC.preto }}>{mgte.valor}</div></div>
            )}
            {mgte?.top && (
              <div><div className="text-[10px] font-bold" style={{ color: VC.cinzaTexto }}>TOP</div><div className="text-base font-extrabold leading-none" style={{ color: VC.vermelho }}>{mgte.top}%</div></div>
            )}
            {a?.pmgz.iabcz && (
              <div><div className="text-[10px] font-bold" style={{ color: VC.cinzaTexto }}>iABCZ</div><div className="text-base font-extrabold leading-none" style={{ color: VC.preto }}>{a.pmgz.iabcz}</div></div>
            )}
          </div>
          {d.valor_embriao != null ? (
            <div className="text-right leading-tight">
              <div className="text-[10px] uppercase tracking-wide" style={{ color: VC.cinzaTexto }}>por embrião</div>
              <div className="text-base font-extrabold" style={{ color: VC.preto }}>{brl(d.valor_embriao)}</div>
            </div>
          ) : (
            <span className="text-xs font-semibold underline underline-offset-2" style={{ color: VC.vermelho }}>Ver pacote</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function LoteSelo({ lote, className = "" }: { lote?: string | null; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-[10px] font-bold tracking-[0.2em] shadow-sm ${className}`} style={{ color: VC.preto }}>
      LOTE
      <span className="grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs tracking-normal" style={{ border: `2px solid ${VC.vermelho}` }}>{lote ?? "—"}</span>
    </span>
  );
}
