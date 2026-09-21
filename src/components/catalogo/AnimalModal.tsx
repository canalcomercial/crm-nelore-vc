import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { youtubeEmbedUrl, type Animal } from "@/hooks/useCatalogo";

function fmtBRL(v?: number | null) {
  if (v == null) return "-";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function AnimalModal({
  animal,
  open,
  onOpenChange,
  onInteresse,
}: {
  animal: Animal | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onInteresse: (a: Animal) => void;
}) {
  if (!animal) return null;
  const embed = youtubeEmbedUrl(animal.link_video);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:w-screen max-md:max-w-none max-md:rounded-none max-md:border-0">
        <div className="grid md:grid-cols-2 max-md:h-full max-md:overflow-y-auto">
          <div className="bg-black aspect-video md:aspect-auto">
            {embed ? (
              <iframe
                src={embed}
                title={animal.nome}
                className="w-full h-full min-h-[240px]"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : animal.foto_url ? (
              <img src={animal.foto_url} alt={animal.nome} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full min-h-[240px] flex items-center justify-center text-white/40 text-sm">Sem mídia</div>
            )}
          </div>
          <div className="p-6 space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-2 text-xs">
                {animal.lote && <span className="bg-[hsl(var(--catalog-primary))] text-white font-bold px-2 py-0.5 rounded">LOTE {animal.lote}</span>}
                {animal.categoria && <span className="text-neutral-500">{animal.categoria}</span>}
              </div>
              <DialogTitle className="font-display text-2xl">{animal.nome}</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-neutral-600 space-y-1">
              {animal.raca && <p><b>Raça:</b> {animal.raca}</p>}
              {animal.fazenda && <p><b>Fazenda:</b> {animal.fazenda}</p>}
            </div>
            <div className="grid grid-cols-3 gap-2 border-y py-3">
              <Info label="IABCZ" value={animal.iabcz} />
              <Info label="MGTE" value={animal.mgte} />
              <Info label="IQG" value={animal.iqg} />
            </div>
            <div>
              {animal.parcelas && animal.valor_parcela && (
                <p className="text-2xl font-bold text-[hsl(var(--catalog-primary))]">
                  {animal.parcelas}x {fmtBRL(animal.valor_parcela)}
                </p>
              )}
              {animal.preco_total && <p className="text-sm text-neutral-500">Total {fmtBRL(animal.preco_total)}</p>}
            </div>
            <Button
              className="w-full bg-[hsl(var(--catalog-primary))] hover:bg-[hsl(var(--catalog-primary))]/90 text-white gap-2"
              onClick={() => onInteresse(animal)}
            >
              <MessageCircle className="h-4 w-4" /> Tenho interesse
            </Button>
            <Button asChild variant="outline" className="w-full gap-2 border-[hsl(var(--catalog-primary))]/30 text-[hsl(var(--catalog-primary))]">
              <Link to={`/catalogo/${animal.id}`}>Ver ficha completa <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="font-semibold text-neutral-900">{value != null ? value : "-"}</div>
    </div>
  );
}
