import { Play, MessageCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { Animal } from "@/hooks/useCatalogo";
import type { CatalogoLayout } from "@/hooks/useCatalogo";
import { LAYOUT_PADRAO } from "@/hooks/useCatalogo";

function fmtBRL(v?: number | null) {
  if (v == null) return "-";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function AnimalCard({
  animal,
  onInteresse,
  onVerVideo,
  layout: layoutProp,
}: {
  animal: Animal;
  onInteresse: () => void;
  onVerVideo: () => void;
  layout?: CatalogoLayout;
}) {
  const layout = layoutProp ?? LAYOUT_PADRAO;
  const compact = layout.estilo_card === "compacto";
  const ampliado = layout.estilo_card === "ampliado";
  return (
    <article className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-black/5 flex flex-col">
      <Link to={`/catalogo/${animal.id}`} className={`relative bg-neutral-100 overflow-hidden text-left block ${ampliado ? "aspect-[4/5]" : compact ? "aspect-[5/4]" : "aspect-[4/3]"}`}>
        {animal.foto_url ? (
          <img
            src={animal.foto_url}
            alt={animal.nome}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-neutral-400 text-xs">Sem foto</div>
        )}
        {animal.lote && layout.mostrar_lote_badge && (
          <span className="absolute top-3 left-3 bg-[hsl(var(--catalog-primary))] text-white text-xs font-bold px-2.5 py-1 rounded tracking-wider">
            LOTE {animal.lote}
          </span>
        )}
        {animal.destaque && (
          <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
            <Star className="h-3 w-3 fill-white" /> DESTAQUE
          </span>
        )}
        {animal.link_video && (
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
            <span className="h-14 w-14 rounded-full bg-white/95 flex items-center justify-center">
              <Play className="h-6 w-6 text-[hsl(var(--catalog-primary))] fill-current ml-0.5" />
            </span>
          </span>
        )}
      </Link>
      <div className={`${compact ? "p-3 gap-2" : "p-4 gap-3"} flex-1 flex flex-col`}>
        <div>
          <Link to={`/catalogo/${animal.id}`} className="block hover:opacity-70 transition-opacity">
            <h3 className={`font-display font-semibold text-neutral-900 leading-tight line-clamp-1 ${ampliado ? "text-xl" : compact ? "text-base" : "text-lg"}`}>{animal.nome}</h3>
          </Link>
          {layout.mostrar_categoria && animal.categoria && <p className="text-xs text-neutral-500 mt-0.5">{animal.categoria}{animal.raca ? ` · ${animal.raca}` : ""}</p>}
        </div>
        {layout.mostrar_indices && (
          <div className="grid grid-cols-3 gap-2 text-center border-y border-neutral-100 py-2">
            <Stat label="IABCZ" value={animal.iabcz} />
            <Stat label="MGTE" value={animal.mgte} />
            <Stat label="IQG" value={animal.iqg} />
          </div>
        )}
        {layout.mostrar_preco && (
        <div>
          {animal.parcelas && animal.valor_parcela ? (
            <p className="text-lg font-bold text-[hsl(var(--catalog-primary))]">
              {animal.parcelas}x {fmtBRL(animal.valor_parcela)}
            </p>
          ) : null}
          {animal.preco_total ? (
            <p className="text-xs text-neutral-500">Total {fmtBRL(animal.preco_total)}</p>
          ) : null}
        </div>
        )}
        <div className="mt-auto flex gap-2">
          <Button
            onClick={onInteresse}
            className="flex-1 bg-[hsl(var(--catalog-primary))] hover:bg-[hsl(var(--catalog-primary))]/90 text-white gap-1.5"
            size="sm"
          >
            <MessageCircle className="h-4 w-4" /> {layout.botao_interesse_texto}
          </Button>
          <Button
            onClick={onVerVideo}
            variant="outline"
            size="sm"
            className="border-[hsl(var(--catalog-primary))]/30 text-[hsl(var(--catalog-primary))]"
            disabled={!animal.link_video}
            title={layout.botao_video_texto}
          >
            <Play className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-semibold text-neutral-800">{value != null ? value : "-"}</div>
    </div>
  );
}
