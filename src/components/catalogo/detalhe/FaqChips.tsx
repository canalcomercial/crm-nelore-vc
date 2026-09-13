import { useState } from "react";
import type { FaqItem } from "@/hooks/useCatalogo";
import { ChevronDown } from "lucide-react";

export function FaqChips({ faq }: { faq?: FaqItem[] | null }) {
  const [aberto, setAberto] = useState<number | null>(null);
  if (!faq || faq.length === 0) return null;
  return (
    <section>
      <h3 className="text-neutral-700 text-sm mb-3">Qual informação você precisa?</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {faq.map((f, i) => (
          <button
            key={i}
            onClick={() => setAberto(aberto === i ? null : i)}
            className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
              aberto === i
                ? "bg-[hsl(var(--catalog-primary))] text-white border-[hsl(var(--catalog-primary))]"
                : "border-[hsl(var(--catalog-primary))]/30 text-[hsl(var(--catalog-primary))] hover:bg-[hsl(var(--catalog-primary))]/5"
            }`}
          >
            {f.titulo}
          </button>
        ))}
      </div>
      {aberto != null && (
        <div className="rounded-lg border border-black/5 bg-white p-4 text-sm text-neutral-700 leading-relaxed whitespace-pre-line flex gap-3">
          <ChevronDown className="h-4 w-4 text-[hsl(var(--catalog-primary))] shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-neutral-900 mb-1">{faq[aberto].titulo}</div>
            {faq[aberto].conteudo}
          </div>
        </div>
      )}
    </section>
  );
}