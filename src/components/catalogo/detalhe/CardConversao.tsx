import { Button } from "@/components/ui/button";
import { MapPin, MessageCircle, Truck, Gavel } from "lucide-react";
import { type Animal } from "@/hooks/useCatalogo";

function fmtBRL(v?: number | null) {
  if (v == null) return "-";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

/**
 * Bloco comercial da ficha: preço, parcelamento e chamadas para ação.
 *
 * É apenas apresentacional — quem controla os diálogos de proposta e de contato
 * é a página do animal, para que o botão dentro da ficha do catálogo e os botões
 * daqui abram exatamente o mesmo fluxo.
 */
export function CardConversao({
  animal,
  onProposta,
  onLead,
}: {
  animal: Animal;
  onProposta: () => void;
  onLead: () => void;
}) {
  const temPreco = animal.preco_total != null;
  const temParcelas = animal.parcelas != null && animal.valor_parcela != null;

  return (
    <>
      <section className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
          {/* Identificação + valores */}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {animal.lote && (
                <span className="rounded bg-[hsl(var(--catalog-primary))]/10 text-[hsl(var(--catalog-primary))] font-semibold px-2 py-0.5">
                  Lote {animal.lote}
                </span>
              )}
              {animal.categoria && <span className="text-neutral-500">{animal.categoria}</span>}
              {animal.localizacao && (
                <span className="text-neutral-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {animal.localizacao}
                </span>
              )}
            </div>

            {temParcelas ? (
              <div className="text-3xl font-bold text-neutral-900 leading-none">
                {animal.parcelas}x de {fmtBRL(animal.valor_parcela)}
              </div>
            ) : temPreco ? (
              <div className="text-3xl font-bold text-neutral-900 leading-none">
                {fmtBRL(animal.preco_total)}
              </div>
            ) : (
              <div className="text-lg font-semibold text-neutral-700">Valor sob consulta</div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {temParcelas && temPreco && (
                <span className="rounded-md border border-black/5 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-700">
                  <span className="font-semibold text-[hsl(var(--catalog-primary))]">
                    Total {fmtBRL(animal.preco_total)}
                  </span>
                  <span className="text-neutral-500"> · parcelamento facilitado</span>
                </span>
              )}
              {animal.comissao_percentual ? (
                <span className="rounded-md border border-[hsl(var(--catalog-primary))]/20 bg-[hsl(var(--catalog-primary))]/5 px-3 py-1.5 text-xs text-[hsl(var(--catalog-primary))] font-semibold">
                  {Number(animal.comissao_percentual).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% de comissão
                </span>
              ) : null}
              <span className="rounded-md border border-black/5 bg-white px-3 py-1.5 text-xs flex items-center gap-1.5 text-neutral-700">
                <Truck className="h-3.5 w-3.5 text-[hsl(var(--catalog-primary))]" /> Frete grátis*
              </span>
              {animal.link_erural && (
                <a
                  href={animal.link_erural}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:border-[hsl(var(--catalog-accent,var(--catalog-primary)))] hover:text-[hsl(var(--catalog-accent,var(--catalog-primary)))] transition-colors"
                >
                  Ver lote na VC
                </a>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 lg:w-auto lg:min-w-[300px]">
            <Button
              onClick={onProposta}
              size="lg"
              className="bg-[hsl(var(--catalog-accent,var(--catalog-primary)))] hover:brightness-110 text-white font-semibold gap-2"
            >
              <Gavel className="h-4 w-4" /> Fazer proposta
            </Button>
            <Button
              onClick={onLead}
              variant="outline"
              size="lg"
              className="border-[hsl(var(--catalog-primary))] text-[hsl(var(--catalog-primary))] hover:bg-[hsl(var(--catalog-primary))]/10 gap-2"
            >
              <MessageCircle className="h-4 w-4" /> Falar com consultor
            </Button>
          </div>
        </div>
      </section>

      {/* Barra fixa mobile */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-black/10 p-3 flex gap-2 shadow-lg">
        <Button
          onClick={onProposta}
          className="flex-1 bg-[hsl(var(--catalog-accent,var(--catalog-primary)))] hover:brightness-110 text-white font-semibold"
        >
          Fazer proposta
        </Button>
        <Button
          onClick={onLead}
          variant="outline"
          className="flex-1 border-[hsl(var(--catalog-primary))] text-[hsl(var(--catalog-primary))] gap-1.5"
        >
          <MessageCircle className="h-4 w-4" /> Consultor
        </Button>
      </div>
    </>
  );
}
