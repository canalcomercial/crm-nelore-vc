import { Link } from "react-router-dom";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Animal } from "@/hooks/useCatalogo";

export function OutrosLotes({ lotes }: { lotes: Animal[] }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!lotes.length) return null;
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="font-display text-xl sm:text-2xl font-semibold text-neutral-900 whitespace-nowrap">Outros lotes do evento</h2>
        <span className="h-px flex-1 bg-black/10" />
        <div className="flex gap-1">
          <button aria-label="Anterior" onClick={() => scroll(-1)} className="h-8 w-8 rounded-full border border-black/10 flex items-center justify-center hover:bg-white"><ChevronLeft className="h-4 w-4" /></button>
          <button aria-label="Próximo" onClick={() => scroll(1)} className="h-8 w-8 rounded-full border border-black/10 flex items-center justify-center hover:bg-white"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      <div ref={ref} className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 scroll-smooth">
        {lotes.map((a) => (
          <Link
            key={a.id}
            to={`/catalogo/${a.id}`}
            className="shrink-0 w-40 snap-start group"
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-neutral-100 border border-black/5">
              {a.foto_url ? (
                <img src={a.foto_url} alt={a.nome} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-neutral-400 text-xs">Sem foto</div>
              )}
            </div>
            <div className="mt-2 text-xs text-[hsl(var(--catalog-primary))] font-semibold underline underline-offset-2 text-center">
              Ver Lote {a.lote ?? ""}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}