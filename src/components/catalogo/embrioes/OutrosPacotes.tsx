import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Animal } from "@/hooks/useCatalogo";
import { EmbriaoCard } from "./EmbriaoCard";

/** Carrossel "Outros pacotes do evento" no formato dos outros lotes do catálogo. */
export function OutrosPacotes({ lotes }: { lotes: Animal[] }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!lotes.length) return null;
  const rolar = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="font-display text-xl sm:text-2xl font-semibold text-neutral-900 whitespace-nowrap">Outros pacotes do evento</h2>
        <span className="h-px flex-1 bg-black/10" />
        <div className="flex gap-1">
          <button aria-label="Anterior" onClick={() => rolar(-1)} className="h-8 w-8 rounded-full border border-black/10 flex items-center justify-center hover:bg-white"><ChevronLeft className="h-4 w-4" /></button>
          <button aria-label="Próximo" onClick={() => rolar(1)} className="h-8 w-8 rounded-full border border-black/10 flex items-center justify-center hover:bg-white"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 scroll-smooth">
        {lotes.map((a) => (
          <div key={a.id} className="w-64 shrink-0 snap-start"><EmbriaoCard animal={a} compacto /></div>
        ))}
      </div>
    </section>
  );
}
