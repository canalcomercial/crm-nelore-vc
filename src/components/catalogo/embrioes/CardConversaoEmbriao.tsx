import { Button } from "@/components/ui/button";
import { Gavel, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import type { Animal } from "@/hooks/useCatalogo";
import { brl, dadosEmbriao, textoGarantia } from "@/lib/embrioes";

/** Bloco comercial do pacote de embriões — mesmo formato do card de fêmeas e touros. */
export function CardConversaoEmbriao({ animal, onProposta, onLead }: { animal: Animal; onProposta: () => void; onLead: () => void }) {
  const d = dadosEmbriao(animal);
  const garantia = textoGarantia(d);
  const pacote = d.valor_pacote ?? animal.preco_total;
  const parcelas = d.parcelas ?? animal.parcelas;
  const valorParcela = pacote != null && parcelas ? pacote / parcelas : animal.valor_parcela;
  const local = d.localizacao ?? animal.localizacao;

  return (
    <>
      <section className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6 shadow-sm" data-testid="conversao-embriao">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {animal.lote && (
                <span className="rounded bg-[hsl(var(--catalog-primary))]/10 text-[hsl(var(--catalog-primary))] font-semibold px-2 py-0.5">Lote {animal.lote}</span>
              )}
              <span className="text-neutral-500">Pacote de embriões{d.quantidade != null ? ` · ${d.quantidade} embriões ${d.tipo}` : ""}</span>
              {local && <span className="text-neutral-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {local}</span>}
            </div>

            {d.valor_embriao != null ? (
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-3xl font-bold text-neutral-900 leading-none">{brl(d.valor_embriao)}</span>
                <span className="text-sm text-neutral-500">por embrião</span>
              </div>
            ) : parcelas && valorParcela ? (
              <div className="text-3xl font-bold text-neutral-900 leading-none">{parcelas}x de {brl(valorParcela)}</div>
            ) : pacote != null ? (
              <div className="text-3xl font-bold text-neutral-900 leading-none">{brl(pacote)}</div>
            ) : (
              <div className="text-lg font-semibold text-neutral-700">Valor sob consulta</div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {pacote != null && (
                <span className="rounded-md border border-black/5 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-700">
                  <span className="font-semibold text-[hsl(var(--catalog-primary))]">Pacote {brl(pacote)}</span>
                  {parcelas && valorParcela ? <span className="text-neutral-500"> · {parcelas}x de {brl(valorParcela, 2)}</span> : null}
                </span>
              )}
              {d.condicoes && (
                <span className="rounded-md border border-black/5 bg-white px-3 py-1.5 text-xs text-neutral-700">{d.condicoes}</span>
              )}
              {garantia && (
                <span className="rounded-md border border-[hsl(var(--catalog-accent,var(--catalog-primary)))]/25 bg-[hsl(var(--catalog-accent,var(--catalog-primary)))]/5 px-3 py-1.5 text-xs flex items-center gap-1.5 font-semibold text-[hsl(var(--catalog-accent,var(--catalog-primary)))]">
                  <ShieldCheck className="h-3.5 w-3.5" /> Garantia de {garantia.numero} {garantia.rotulo}
                </span>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 lg:w-auto lg:min-w-[300px]">
            <Button onClick={onProposta} size="lg" className="bg-[hsl(var(--catalog-accent,var(--catalog-primary)))] hover:brightness-110 text-white font-semibold gap-2">
              <Gavel className="h-4 w-4" /> Fazer proposta
            </Button>
            <Button onClick={onLead} variant="outline" size="lg" className="border-[hsl(var(--catalog-primary))] text-[hsl(var(--catalog-primary))] hover:bg-[hsl(var(--catalog-primary))]/10 gap-2">
              <MessageCircle className="h-4 w-4" /> Falar com consultor
            </Button>
          </div>
        </div>
      </section>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-black/10 p-3 flex gap-2 shadow-lg">
        <Button onClick={onProposta} className="flex-1 bg-[hsl(var(--catalog-accent,var(--catalog-primary)))] hover:brightness-110 text-white font-semibold">Fazer proposta</Button>
        <Button onClick={onLead} variant="outline" className="flex-1 border-[hsl(var(--catalog-primary))] text-[hsl(var(--catalog-primary))] gap-1.5">
          <MessageCircle className="h-4 w-4" /> Consultor
        </Button>
      </div>
    </>
  );
}
