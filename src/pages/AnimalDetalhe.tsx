import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, ChevronRight, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnimal,
  useAnimais,
  useConfiguracao,
  useEventoAtivo,
  useOutrosLotes,
  LAYOUT_PADRAO,
  type CatalogoLayout,
} from "@/hooks/useCatalogo";
import { FichaCatalogo } from "@/components/catalogo/detalhe/FichaCatalogo";
import { FaqChips } from "@/components/catalogo/detalhe/FaqChips";
import { OutrosLotes } from "@/components/catalogo/detalhe/OutrosLotes";
import { CardConversao } from "@/components/catalogo/detalhe/CardConversao";
import { DadosCompletos } from "@/components/catalogo/detalhe/DadosCompletos";
import { AvaliacaoGenetica } from "@/components/catalogo/detalhe/AvaliacaoGenetica";
import { abrirWhatsApp, msgInteresseAnimal, msgPropostaAnimal } from "@/lib/whatsapp";
import { toast } from "sonner";
import logo from "@/assets/logo-nelore-vc.png";

export default function AnimalDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { data: animal, isLoading } = useAnimal(id);
  const { data: config } = useConfiguracao();
  const { data: evento } = useEventoAtivo();
  const { data: outros = [] } = useOutrosLotes(id);
  const { data: todos = [] } = useAnimais({ apenasAtivos: true });

  const layout: CatalogoLayout = (config?.layout as CatalogoLayout | null) ?? LAYOUT_PADRAO;

  const abrirWhatsAppAnimal = (mensagem: string) => {
    const numero = config?.whatsapp?.replace(/\D/g, "");
    if (!numero) {
      toast.error("WhatsApp da fazenda ainda não foi configurado.");
      return;
    }
    abrirWhatsApp(numero, mensagem);
  };

  // Propaga as cores do tema para o :root para que portais (Dialog, Toast) também herdem.
  useEffect(() => {
    const root = document.documentElement;
    const prevP = root.style.getPropertyValue("--catalog-primary");
    const prevA = root.style.getPropertyValue("--catalog-accent");
    const prevB = root.style.getPropertyValue("--catalog-bg");
    root.style.setProperty("--catalog-primary", layout.cor_primary);
    root.style.setProperty("--catalog-accent", layout.cor_accent ?? LAYOUT_PADRAO.cor_accent ?? layout.cor_primary);
    root.style.setProperty("--catalog-bg", layout.cor_bg);
    return () => {
      if (prevP) root.style.setProperty("--catalog-primary", prevP); else root.style.removeProperty("--catalog-primary");
      if (prevA) root.style.setProperty("--catalog-accent", prevA); else root.style.removeProperty("--catalog-accent");
      if (prevB) root.style.setProperty("--catalog-bg", prevB); else root.style.removeProperty("--catalog-bg");
    };
  }, [layout.cor_primary, layout.cor_accent, layout.cor_bg]);

  const proximoLote = useMemo(() => {
    if (!animal || !todos.length) return null;
    const idx = todos.findIndex((a) => a.id === animal.id);
    if (idx < 0) return null;
    return todos[(idx + 1) % todos.length];
  }, [animal, todos]);

  useEffect(() => {
    if (!animal) return;
    document.title = `Lote ${animal.lote ?? "-"} · ${animal.nome} | Nelore VC`;
    const desc = (animal.descricao_longa ?? "").slice(0, 155);
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = desc || `Ficha completa do Lote ${animal.lote ?? "-"} · ${animal.nome} — Nelore VC.`;
  }, [animal]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--catalog-bg))] p-6">
        <Skeleton className="h-96 max-w-4xl mx-auto rounded-3xl" />
      </div>
    );
  }
  if (!animal) {
    return (
      <div className="min-h-screen bg-[hsl(var(--catalog-bg))] flex items-center justify-center text-neutral-500">
        Lote não encontrado.
        <Link to="/catalogo" className="ml-2 underline text-[hsl(var(--catalog-primary))]">Voltar ao catálogo</Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-neutral-900 pb-24 lg:pb-10"
      style={{
        ["--catalog-primary" as never]: layout.cor_primary,
        ["--catalog-accent" as never]: layout.cor_accent ?? LAYOUT_PADRAO.cor_accent ?? layout.cor_primary,
        ["--catalog-bg" as never]: layout.cor_bg,
        backgroundColor: `hsl(${layout.cor_bg})`,
      }}
    >
      {/* Header flutuante com bordas arredondadas */}
      <header className="sticky top-0 z-40 px-3 sm:px-4 pt-3">
        <div className="max-w-5xl mx-auto rounded-2xl border border-black/5 bg-white/90 backdrop-blur-md shadow-sm">
          <div className="px-4 h-14 sm:h-16 flex items-center gap-4">
            <Link to="/catalogo" className="flex items-center gap-2 min-w-0">
              <img src={logo} alt="Nelore VC" className="h-9 w-9 rounded-full object-cover" />
              <span className="font-display text-base sm:text-lg font-semibold text-[hsl(var(--catalog-primary))] truncate">
                Nelore VC
              </span>
            </Link>
            <nav className="ml-auto hidden md:flex items-center gap-5 text-sm text-neutral-600">
              <a href="#dados" className="hover:text-[hsl(var(--catalog-primary))]">Informações</a>
              <a href="#lotes" className="hover:text-[hsl(var(--catalog-primary))]">Outros lotes</a>
              <Link
                to="/catalogo"
                className="rounded-full bg-[hsl(var(--catalog-primary))] text-white px-4 py-1.5 text-xs font-semibold hover:brightness-110"
              >
                Voltar ao catálogo
              </Link>
            </nav>
            <Link to="/catalogo" className="md:hidden ml-auto text-xs font-semibold text-[hsl(var(--catalog-primary))]">
              Catálogo
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb + próximo */}
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-3 flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-1.5 min-w-0">
          <Link to="/catalogo" className="hover:text-[hsl(var(--catalog-primary))] whitespace-nowrap">Catálogo</Link>
          {evento?.nome && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="truncate">{evento.nome}</span>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-neutral-900 font-medium">Lote {animal.lote ?? "-"}</span>
        </div>
        {proximoLote && (
          <Link
            to={`/catalogo/${proximoLote.id}`}
            className="text-[hsl(var(--catalog-primary))] flex items-center gap-1 hover:underline whitespace-nowrap"
          >
            Próximo Lote <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Ficha em formato de catálogo */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 space-y-6 sm:space-y-10">
        <FichaCatalogo
          animal={animal}
          onProposta={() => abrirWhatsAppAnimal(msgPropostaAnimal(animal))}
          mostrarFichaCompleta={layout.mostrar_ficha_completa === true}
        />

        <CardConversao
          animal={animal}
          onProposta={() => abrirWhatsAppAnimal(msgPropostaAnimal(animal))}
          onLead={() => abrirWhatsAppAnimal(msgInteresseAnimal(animal))}
        />

        {animal.registrado_abcz && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-2.5 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Animal registrado na ABCZ
          </div>
        )}

        {layout.mostrar_ficha_completa === true && <DadosCompletos animal={animal} />}

        {animal.avaliacoes && animal.avaliacoes.length > 0 && (
          <section>
            <header className="flex items-baseline gap-3 mb-3">
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-neutral-900">Avaliação genética</h2>
              <span className="h-px flex-1 bg-black/10" />
            </header>
            <AvaliacaoGenetica linhas={animal.avaliacoes} />
          </section>
        )}

        <FaqChips faq={config?.faq} />

        {evento && (
          <section>
            <header className="flex items-baseline gap-3 mb-3">
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-neutral-900">Conheça o evento</h2>
              <span className="h-px flex-1 bg-black/10" />
            </header>
            <div className="rounded-2xl border border-black/5 bg-white p-4 flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl bg-[hsl(var(--catalog-primary))]/10 flex items-center justify-center text-[hsl(var(--catalog-primary))] text-xs font-semibold">
                {evento.data
                  ? new Date(evento.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                  : "Evento"}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-neutral-500">
                  {evento.data
                    ? new Date(evento.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
                    : ""}
                </div>
                <div className="font-medium text-neutral-900">{evento.nome}</div>
              </div>
            </div>
          </section>
        )}

        <div id="lotes">
          <OutrosLotes lotes={outros} />
        </div>
      </div>


      {/* Footer */}
      <footer className="mt-10 px-3 sm:px-4 pb-4">
        <div className="max-w-5xl mx-auto rounded-2xl bg-[hsl(var(--catalog-primary))] text-white/90 px-4 py-8 flex flex-col md:flex-row gap-4 items-center justify-between">

          <div className="flex items-center gap-3">
            <img src={logo} alt="Nelore VC" className="h-9 w-9 rounded-full bg-white p-0.5" />
            <div className="font-display text-lg font-semibold text-white">Nelore VC</div>
          </div>
          {config?.whatsapp && (
            <a
              href={`https://wa.me/${config.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm hover:text-white"
            >
              WhatsApp: {config.whatsapp}
            </a>
          )}
        </div>
      </footer>

    </div>
  );
}
