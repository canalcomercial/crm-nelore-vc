import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { CSSPropertiesComVars } from "@/lib/utils";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimalCard } from "@/components/catalogo/AnimalCard";
import { useAnimais, useConfiguracao, useEventosAtivos, ordenarPorLote, LAYOUT_PADRAO, type Animal, type CatalogoLayout } from "@/hooks/useCatalogo";
import { abrirWhatsApp, msgInteresseAnimal } from "@/lib/whatsapp";
import { toast } from "sonner";
import logo from "@/assets/logo-nelore-vc.png";

type OrdemKey = "padrao" | "maior_preco" | "menor_preco" | "maior_iabcz";
const CATEGORIAS = ["Todas", "Touro", "Matriz", "Garrote", "Embrião"];

export default function CatalogoPage() {
  const { data: animais = [], isLoading } = useAnimais({ apenasAtivos: true });
  const { data: eventosAtivos = [] } = useEventosAtivos();
  const { data: config } = useConfiguracao();
  const [ordem, setOrdem] = useState<OrdemKey>("padrao");
  const [params] = useSearchParams();
  // A landing manda ?categoria=Touro para abrir o catálogo já filtrado.
  const [categoria, setCategoria] = useState<string>(params.get("categoria") ?? "Todas");
  const isPreview = params.get("preview") === "layout";
  const eventoParam = params.get("evento");
  const eventoIdxFromParam = eventoParam ? eventosAtivos.findIndex((e) => e.id === eventoParam) : -1;
  const [eventoIdxState, setEventoIdxState] = useState(0);
  const eventoIdx = eventoIdxFromParam >= 0 ? eventoIdxFromParam : eventoIdxState;
  const setEventoIdx = setEventoIdxState;
  const evento = eventosAtivos[eventoIdx] ?? null;
  const [layoutOverride, setLayoutOverride] = useState<CatalogoLayout | null>(null);

  const layout: CatalogoLayout = layoutOverride ?? { ...LAYOUT_PADRAO, ...(config?.layout as CatalogoLayout | null) };

  // Propaga cores do tema ao :root para portais (Dialog/Toast) herdarem.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--catalog-primary", layout.cor_primary);
    root.style.setProperty("--catalog-bg", layout.cor_bg);
    return () => {
      root.style.removeProperty("--catalog-primary");
      root.style.removeProperty("--catalog-bg");
    };
  }, [layout.cor_primary, layout.cor_bg]);

  useEffect(() => {
    if (!isPreview) return;
    window.parent?.postMessage({ type: "catalogo:ready" }, window.location.origin);
    function onMsg(e: MessageEvent) {
      if (e.data?.type === "catalogo:preview" && e.data.layout) {
        setLayoutOverride(e.data.layout);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [isPreview]);

  // Mobile: horizontal snap scroll. Desktop: grid controlled via media queries.

  const lista = useMemo(() => {
    let l = [...animais];
    if (evento) l = l.filter((a) => a.evento_id === evento.id);
    if (categoria !== "Todas") l = l.filter((a) => a.categoria === categoria);
    switch (ordem) {
      case "padrao": l = ordenarPorLote(l); break;
      case "maior_preco": l.sort((a, b) => (b.preco_total ?? 0) - (a.preco_total ?? 0)); break;
      case "menor_preco": l.sort((a, b) => (a.preco_total ?? Infinity) - (b.preco_total ?? Infinity)); break;
      case "maior_iabcz": l.sort((a, b) => (b.iabcz ?? 0) - (a.iabcz ?? 0)); break;
    }
    return l;
  }, [animais, ordem, categoria, evento]);

  const CARROSSEL_QTD = 6;
  const PAGINA = 12;
  const destaquesCarrossel = useMemo(() => lista.slice(0, CARROSSEL_QTD), [lista]);
  const restantes = useMemo(() => lista.slice(CARROSSEL_QTD), [lista]);
  const [visiveis, setVisiveis] = useState(PAGINA);
  const restantesVisiveis = useMemo(() => restantes.slice(0, visiveis), [restantes, visiveis]);
  const sentinelaRef = useRef<HTMLDivElement>(null);

  useEffect(() => setVisiveis(PAGINA), [categoria, ordem, evento?.id]);

  useEffect(() => {
    const el = sentinelaRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisiveis((v) => v + PAGINA);
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [restantesVisiveis.length, restantes.length]);

  const abrirInteresse = (a: Animal) => {
    const numero = config?.whatsapp?.replace(/\D/g, "");
    if (!numero) {
      toast.error("WhatsApp da fazenda ainda não foi configurado.");
      return;
    }
    abrirWhatsApp(numero, msgInteresseAnimal(a));
  };

  const abrirVideo = (a: Animal) => {
    if (a.link_video) window.open(a.link_video, "_blank");
  };

  return (
    <div
      className="min-h-screen text-neutral-900"
      // Aplica o tema via CSS vars locais, para a prévia refletir o layout salvo.
      style={{
        "--catalog-primary": layout.cor_primary,
        "--catalog-bg": layout.cor_bg,
        backgroundColor: `hsl(${layout.cor_bg})`,
      } as CSSPropertiesComVars}
    >
      <header className="bg-white border-b border-black/5 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/catalogo" className="flex items-center gap-2">
            <img src={logo} alt="Nelore VC" className="h-9 w-9 rounded-full object-cover" />
            <span className="font-display text-lg font-semibold text-[hsl(var(--catalog-primary))]">Nelore VC</span>
          </Link>
          {evento?.nome && <span className="hidden md:block text-sm text-neutral-500 border-l pl-4 ml-2">{evento.nome}</span>}
          <nav className="ml-auto flex items-center gap-5 text-sm text-neutral-600">
            {[
              { id: "inicio", label: "Início" },
              { id: "animais", label: "Animais" },
              { id: "sobre", label: "Sobre" },
              { id: "contato", label: "Contato" },
            ].map((it) => (
              <a
                key={it.id}
                href={`#${it.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(it.id);
                  if (!el) return;
                  const top = el.getBoundingClientRect().top + window.scrollY - 64;
                  window.scrollTo({ top, behavior: "smooth" });
                  history.replaceState(null, "", `#${it.id}`);
                }}
                className="hover:text-[hsl(var(--catalog-primary))] cursor-pointer"
              >
                {it.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section id="inicio" className="bg-[hsl(var(--catalog-primary))] text-white">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
          {eventosAtivos.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {eventosAtivos.map((ev, i) => (
                <button
                  key={ev.id}
                  onClick={() => setEventoIdx(i)}
                  className={`text-xs sm:text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    i === eventoIdx
                      ? "bg-white text-[hsl(var(--catalog-primary))] border-white"
                      : "bg-transparent text-white border-white/40 hover:bg-white/10"
                  }`}
                >
                  {ev.nome}
                </button>
              ))}
            </div>
          )}
          {evento ? (
            <>
              {evento.data && <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-3">{new Date(evento.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>}
              <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">{evento.nome}</h1>
              {evento.descricao && <p className="mt-4 text-white/85 max-w-2xl text-base md:text-lg">{evento.descricao}</p>}
            </>
          ) : (
            <>
              {(layout.hero_kicker ?? "") && <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-3">{layout.hero_kicker}</p>}
              <h1 className="font-display text-4xl md:text-5xl font-bold">{layout.hero_titulo ?? "Genética Nelore de Elite"}</h1>
              {(layout.hero_subtitulo ?? "") && <p className="mt-4 text-white/85 max-w-2xl">{layout.hero_subtitulo}</p>}
            </>

          )}
        </div>
      </section>

      <section id="animais" className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="sr-only">{layout.titulo_secao_animais}</h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Users className="h-4 w-4 text-[hsl(var(--catalog-primary))]" />
            <span><b className="text-neutral-900">{animais.length}</b> {animais.length === 1 ? layout.texto_contador_singular : layout.texto_contador_plural}</span>
          </div>
          <div className="flex gap-2">
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="w-[160px] bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={ordem} onValueChange={(v) => setOrdem(v as OrdemKey)}>
              <SelectTrigger className="w-[190px] bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="padrao">Ordem padrão</SelectItem>
                <SelectItem value="maior_preco">Maior preço</SelectItem>
                <SelectItem value="menor_preco">Menor preço</SelectItem>
                <SelectItem value="maior_iabcz">Maior IABCZ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="catalog-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="catalog-item bg-white rounded-xl overflow-hidden border border-black/5">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-4 space-y-2"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-9 w-full mt-4" /></div>
              </div>
            ))}
          </div>
        ) : lista.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-neutral-500 border border-black/5">
            Nenhum animal disponível no momento.
          </div>
        ) : (
          <>
            <div className="catalog-grid">
              {destaquesCarrossel.map((a) => (
                <div key={a.id} className="catalog-item">
                  <AnimalCard animal={a} layout={layout} onInteresse={() => abrirInteresse(a)} onVerVideo={() => abrirVideo(a)} />
                </div>
              ))}
            </div>

            {restantes.length > 0 && (
              <div className="mt-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  {restantesVisiveis.map((a) => (
                    <AnimalCard key={a.id} animal={a} layout={layout} onInteresse={() => abrirInteresse(a)} onVerVideo={() => abrirVideo(a)} />
                  ))}
                </div>
                {restantesVisiveis.length < restantes.length && (
                  <div ref={sentinelaRef} className="py-8 text-center text-sm text-neutral-500">
                    Carregando mais animais...
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <style>{`
          .catalog-grid {
            display: flex;
            gap: 1rem;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            margin-left: -1rem;
            margin-right: -1rem;
            padding: 0.25rem 1rem 0.75rem;
            scrollbar-width: none;
          }
          .catalog-grid::-webkit-scrollbar { display: none; }
          .catalog-grid > .catalog-item {
            flex: 0 0 82%;
            scroll-snap-align: start;
          }
          @media (min-width: 640px) {
            .catalog-grid > .catalog-item { flex-basis: 55%; }
          }
          @media (min-width: 768px) {
            .catalog-grid {
              display: grid;
              gap: 1.5rem;
              overflow: visible;
              margin: 0;
              padding: 0;
              grid-template-columns: repeat(${layout.colunas_tablet}, minmax(0, 1fr));
            }
            .catalog-grid > .catalog-item { flex: initial; }
          }
          @media (min-width: 1024px) {
            .catalog-grid { grid-template-columns: repeat(${layout.colunas_desktop}, minmax(0, 1fr)); }
          }
        `}</style>
      </section>

      <section id="sobre" className="bg-white border-t border-black/5">
        <div className="max-w-6xl mx-auto px-4 py-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-display text-3xl font-bold text-[hsl(var(--catalog-primary))]">{layout.texto_sobre_titulo}</h2>
            <p className="mt-4 text-neutral-600 leading-relaxed whitespace-pre-line">{layout.texto_sobre_corpo}</p>
          </div>
          <div className="bg-[hsl(var(--catalog-bg))] rounded-xl p-8 border border-black/5">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><div className="font-display text-3xl font-bold text-[hsl(var(--catalog-primary))]">{animais.length}</div><div className="text-xs text-neutral-500 mt-1">Animais</div></div>
              <div><div className="font-display text-3xl font-bold text-[hsl(var(--catalog-primary))]">{animais.filter((a) => a.destaque).length}</div><div className="text-xs text-neutral-500 mt-1">Destaques</div></div>
              <div><div className="font-display text-3xl font-bold text-[hsl(var(--catalog-primary))]">100%</div><div className="text-xs text-neutral-500 mt-1">Elite</div></div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contato" className="bg-[hsl(var(--catalog-primary))] text-white/90">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Nelore VC" className="h-10 w-10 rounded-full bg-white p-0.5" />
            <div>
              <div className="font-display text-lg font-semibold text-white">Nelore VC</div>
              <div className="text-xs text-white/70">Genética de elite</div>
            </div>
          </div>
          {config?.whatsapp && (
            <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-sm hover:text-white">
              WhatsApp: {config.whatsapp}
            </a>
          )}
        </div>
      </footer>

    </div>
  );
}
