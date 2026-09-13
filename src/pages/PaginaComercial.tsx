import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Award, BarChart3, Truck, Headphones, MessageCircle, Instagram, Mail, MapPin, Calendar, ArrowRight, Star, Beef, Milk, Dna, Layers, Play } from "lucide-react";
import { useAnimais, useEventosAtivos, useAnimaisPorEvento, type Animal } from "@/hooks/useCatalogo";
import { usePaginaConfig, usePaginaPublicConfig, type PaginaTema, type PaginaConteudo, type BotaoConfig, type BotaoAcao, type SecaoId, type SecaoVideo, type VideoItem } from "@/hooks/usePaginaComercial";
import { YouTubeLiveEmbed } from "@/components/pagina-comercial/YouTubeLiveEmbed";
import { applyGoogleFonts } from "@/lib/google-fonts";
import { abrirWhatsApp, msgInteresseAnimal, MSG_PADRAO_PAGINA_COMERCIAL } from "@/lib/whatsapp";
import logo from "@/assets/logo-nelore-vc.png";

const ICONE_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Award, BarChart3, Truck, HeadphonesIcon: Headphones, Headphones,
};

/** Ícone de cada categoria na faixa de atalhos acima da vitrine. */
const ICONE_CATEGORIA: Record<string, React.ComponentType<{ className?: string }>> = {
  touro: Beef,
  garrote: Beef,
  matriz: Milk,
  novilha: Milk,
  vaca: Milk,
  embriao: Dna,
  semen: Dna,
  coletivo: Layers,
};

function iconeDaCategoria(nome: string) {
  const chave = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  return ICONE_CATEGORIA[chave] ?? Award;
}

/** Itens de navegação do topo — refletem as seções da página. */
const NAV: { href: string; label: string }[] = [
  { href: "#sobre", label: "Sobre" },
  { href: "#evento", label: "Evento" },
  { href: "#lotes", label: "Lotes" },
  { href: "#faq", label: "Dúvidas" },
];

function fmtBRL(v?: number | null) {
  if (v == null) return "-";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function usePageMeta(preview: boolean) {
  useEffect(() => {
    document.title = preview ? "Prévia — Página Comercial" : "Nelore VC — Genética Nelore PO em Londrina/PR";
    const meta = document.querySelector('meta[name="description"]') ?? (() => {
      const m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); return m;
    })();
    meta.setAttribute("content", "Criatório Nelore VC — touros e matrizes PO com avaliação genética, leilões e assessoria especializada.");
  }, [preview]);
}

export default function PaginaComercial() {
  const isPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "draft";
  const { data: draftConfig, isLoading: loadingDraftCfg } = usePaginaConfig({ enabled: isPreview });
  const { data: publicConfig, isLoading: loadingPublicCfg } = usePaginaPublicConfig({ enabled: !isPreview });
  const { data: animais = [], isLoading: loadingAnimais } = useAnimais({ apenasAtivos: true });
  const { data: eventosAtivos = [] } = useEventosAtivos();
  const [eventoIdx, setEventoIdx] = useState(0);
  const evento = eventosAtivos[eventoIdx] ?? null;
  const { data: animaisEvento = [] } = useAnimaisPorEvento(evento?.id);
  const [override, setOverride] = useState<{ conteudo?: PaginaConteudo; tema?: PaginaTema } | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Header só ganha fundo/borda depois que a página rola — mantém o hero limpo.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  usePageMeta(isPreview);

  // Em modo preview: escuta postMessage do editor admin
  useEffect(() => {
    if (!isPreview) return;
    function onMsg(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "pagina-comercial:preview") {
        setOverride({ conteudo: e.data.conteudo, tema: e.data.tema });
      }
    }
    window.addEventListener("message", onMsg);
    // avisa parent que estamos prontos
    window.parent?.postMessage({ type: "pagina-comercial:ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMsg);
  }, [isPreview]);

  // Em preview, se draft existir, usa como fonte inicial
  const baseConteudo = isPreview ? (draftConfig?.conteudo_draft ?? draftConfig?.conteudo) : publicConfig?.conteudo;
  const baseTema = isPreview ? (draftConfig?.tema_draft ?? draftConfig?.tema) : publicConfig?.tema;

  const conteudo = override?.conteudo ?? baseConteudo;
  const tema: PaginaTema = override?.tema ?? baseTema ?? {
    // Paleta Nelore VC — preto, vermelho e branco do logo.
    cor_primaria: "#12171B", cor_accent: "#D0100B", cor_fundo: "#F4F5F6", cor_texto: "#12171B", radius: "12px",
  };

  // Aplica Google Fonts dinamicamente
  useEffect(() => {
    const fonts: { family: string; weights: number[] }[] = [];
    if (tema.font_heading?.family) fonts.push(tema.font_heading);
    if (tema.font_body?.family && tema.font_body.family !== tema.font_heading?.family) fonts.push(tema.font_body);
    if (fonts.length) applyGoogleFonts("pagina-comercial", fonts);
  }, [tema.font_heading, tema.font_body]);

  const destaques = useMemo(() => animais.filter((a) => a.destaque).slice(0, 8), [animais]);
  const totalDisponiveis = animais.length;

  /** Atalhos por categoria, montados a partir do que existe no catálogo. */
  const categorias = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const a of animais) {
      const c = a.categoria?.trim();
      if (!c) continue;
      mapa.set(c, (mapa.get(c) ?? 0) + 1);
    }
    return [...mapa.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nome, total]) => ({ nome, total }));
  }, [animais]);

  const diasParaEvento = useMemo(() => {
    if (!evento?.data) return null;
    const diff = Math.ceil((new Date(evento.data + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : null;
  }, [evento]);

  const whatsappNegocio = (conteudo?.rodape.whatsapp || "").replace(/\D/g, "");
  function abrirWhatsAppPg(mensagem?: string, numeroOverride?: string) {
    const numero = (numeroOverride ?? "").replace(/\D/g, "") || whatsappNegocio;
    if (!numero) {
      toast.error("WhatsApp da fazenda ainda não foi configurado.");
      return;
    }
    abrirWhatsApp(numero, mensagem);
  }

  const navigate = useNavigate();
  const secoesOrdem: SecaoId[] = useMemo(() => {
    const base: SecaoId[] = ["sobre", "video", "evento", "lotes", "video_2", "pilares", "depoimentos", "faq", "cta_final"];
    const salva = (conteudo?.secoes_ordem ?? []) as SecaoId[];
    const usadas = salva.filter((s) => base.includes(s));
    const faltantes = base.filter((s) => !usadas.includes(s));
    return [...usadas, ...faltantes];
  }, [conteudo?.secoes_ordem]);
  const secaoVisivel = (id: SecaoId) => (conteudo?.secoes_visiveis?.[id] ?? true) !== false;

  const executarAcao = (acao: BotaoAcao) => {
    if (acao.tipo === "lead") {
      abrirWhatsAppPg(acao.mensagem_sugerida ?? conteudo?.rodape.mensagem_padrao ?? MSG_PADRAO_PAGINA_COMERCIAL);
    } else if (acao.tipo === "link") {
      if (acao.nova_aba) window.open(acao.url, "_blank", "noopener,noreferrer");
      else window.location.href = acao.url;
    } else if (acao.tipo === "ancora") {
      const id = acao.secao_id === "top" ? "top" : acao.secao_id;
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (acao.tipo === "rota") {
      navigate(acao.path);
    } else if (acao.tipo === "whatsapp") {
      abrirWhatsAppPg(acao.mensagem ?? conteudo?.rodape.mensagem_padrao ?? MSG_PADRAO_PAGINA_COMERCIAL, acao.numero);
    }
  };

  const varianteClasses = (v: BotaoConfig["variante"]) => {
    if (v === "primary") return "pc-btn-primary";
    if (v === "outline") return "border border-[color:var(--pc-primary)] text-[color:var(--pc-primary)] bg-transparent hover:bg-[color:var(--pc-primary)]/5";
    if (v === "branco") return "bg-white text-[color:var(--pc-primary)] hover:bg-white/90";
    return "bg-transparent hover:bg-black/5";
  };

  const renderBotoes = (botoes?: BotaoConfig[]) => {
    if (!botoes || botoes.length === 0) return null;
    return botoes.map((b) => (
      <Button
        key={b.id}
        size="sm"
        className={`${varianteClasses(b.variante)} gap-1.5`}
        onClick={() => executarAcao(b.acao)}
      >
        {b.label}
      </Button>
    ));
  };

  if (isPreview ? loadingDraftCfg : loadingPublicCfg) {
    return <div className="min-h-screen bg-[#F7F5F0] p-8"><Skeleton className="h-32 w-full" /></div>;
  }

  const escala = tema.escala ?? "padrao";
  const escalaMult = escala === "compacta" ? 0.9 : escala === "ampla" ? 1.1 : 1;
  const sombraCss = tema.sombras === "nenhuma"
    ? "none"
    : tema.sombras === "marcante"
      ? "0 30px 80px -20px rgba(0,0,0,.35)"
      : "0 10px 30px -10px rgba(0,0,0,.15)";

  const styleVars = {
    ["--pc-primary" as string]: tema.cor_primaria,
    ["--pc-bg" as string]: tema.cor_fundo,
    ["--pc-text" as string]: tema.cor_texto,
    ["--pc-accent" as string]: tema.cor_accent ?? tema.cor_primaria,
    ["--pc-radius" as string]: tema.radius,
    ["--pc-scale" as string]: String(escalaMult),
    ["--pc-shadow" as string]: sombraCss,
    ["--pc-font-heading" as string]: tema.font_heading?.family ? `'${tema.font_heading.family}', Georgia, serif` : "'Fraunces', Georgia, serif",
    ["--pc-font-body" as string]: tema.font_body?.family ? `'${tema.font_body.family}', Inter, system-ui, sans-serif` : "Inter, system-ui, sans-serif",
  } as React.CSSProperties;

  const heroMidia = conteudo?.hero.midia;
  const heroYoutubeAtivo = heroMidia?.tipo === "youtube_live" && heroMidia.ativo && heroMidia.video_id;
  const heroVideoArquivo = heroMidia?.tipo === "video_arquivo" && heroMidia.url;
  const heroImagem = heroMidia?.tipo === "imagem" ? heroMidia.url : (conteudo?.hero.imagem_url ?? undefined);
  // Sem mídia configurada o hero fica só com texto — é assim que o vídeo "sai do topo".
  const temHeroMidia = Boolean(heroYoutubeAtivo || heroVideoArquivo || heroImagem || destaques[0]?.foto_url);

  return (
    <div className="pagina-comercial-root min-h-screen" style={styleVars}>
      <style>{`
        .pagina-comercial-root {
          background: var(--pc-bg); color: var(--pc-text);
          font-family: var(--pc-font-body); font-size: calc(1rem * var(--pc-scale));
          -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
        }
        .pc-display { font-family: var(--pc-font-heading); letter-spacing: -0.015em; }
        .pc-btn-primary { background: var(--pc-primary); color: #fff; }
        .pc-btn-primary:hover { filter: brightness(1.08); }
        .pc-accent { color: var(--pc-accent); }
        .pc-card { background: #fff; border-radius: var(--pc-radius); box-shadow: var(--pc-shadow); }

        /* Larguras e ritmo vertical — uma única fonte de verdade para todas as seções. */
        .pc-container { width: 100%; margin-inline: auto; max-width: 76rem; padding-inline: clamp(1rem, 4vw, 2rem); }
        .pc-container-sm { width: 100%; margin-inline: auto; max-width: 56rem; padding-inline: clamp(1rem, 4vw, 2rem); }
        .pc-section { padding-block: clamp(3.5rem, 8vw, 7rem); }
        .pc-section-tight { padding-block: clamp(2.5rem, 5vw, 4.5rem); }

        /* Escala tipográfica fluida: cresce com a tela, sem saltos entre breakpoints. */
        .pc-h1 { font-size: clamp(2.25rem, 6.2vw, 4.25rem); line-height: 1.03; font-weight: 600; }
        .pc-h2 { font-size: clamp(1.75rem, 3.6vw, 2.75rem); line-height: 1.14; font-weight: 600; }
        .pc-h3 { font-size: clamp(1.0625rem, 1.5vw, 1.375rem); line-height: 1.3; font-weight: 600; }
        .pc-lead { font-size: clamp(1rem, 1.5vw, 1.1875rem); line-height: 1.65; }
        .pc-measure { max-width: 60ch; }
        .pc-eyebrow {
          font-size: 0.6875rem; letter-spacing: 0.22em; text-transform: uppercase;
          font-weight: 700; color: var(--pc-accent);
        }

        /* Cabeçalho flutuante arredondado. */
        .pc-topbar {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          padding: 0.5rem 0.75rem; border-radius: 999px;
          background: color-mix(in srgb, #fff 82%, transparent);
          border: 1px solid rgba(0,0,0,0.06);
          backdrop-filter: blur(10px);
          transition: box-shadow 0.3s ease, background 0.3s ease, border-color 0.3s ease;
        }
        .pc-topbar-scrolled {
          background: color-mix(in srgb, #fff 96%, transparent);
          box-shadow: 0 12px 32px -18px rgba(0,0,0,0.45);
          border-color: rgba(0,0,0,0.09);
        }
        .pc-nav-pill {
          padding: 0.45rem 0.8rem; border-radius: 999px; white-space: nowrap;
          font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.01em;
          color: color-mix(in srgb, var(--pc-text) 72%, transparent);
          transition: background 0.2s ease, color 0.2s ease;
        }
        .pc-nav-pill:hover { background: rgba(0,0,0,0.05); color: var(--pc-text); }

        /* Mobile: chips pequenos numa faixa horizontal. */
        /* A faixa rola no dedo; o fade à direita avisa que há mais itens. */
        .pc-nav-scroll {
          -webkit-mask-image: linear-gradient(to right, #000 86%, transparent 100%);
          mask-image: linear-gradient(to right, #000 86%, transparent 100%);
          scrollbar-width: none;
        }
        .pc-nav-scroll::-webkit-scrollbar { display: none; }

        .pc-nav-chip {
          flex: 0 0 auto; white-space: nowrap;
          padding: 0.28rem 0.62rem; border-radius: 999px;
          font-size: 0.7rem; font-weight: 600;
          color: color-mix(in srgb, var(--pc-text) 70%, transparent);
          background: color-mix(in srgb, #fff 75%, transparent);
          border: 1px solid rgba(0,0,0,0.07);
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }
        .pc-nav-chip:hover, .pc-nav-chip:focus-visible {
          background: #fff; color: var(--pc-text); border-color: rgba(0,0,0,0.14);
        }

        /* Navegação com sublinhado que cresce da esquerda. */
        .pc-nav-link { position: relative; font-size: 0.8125rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; opacity: 0.72; transition: opacity 0.2s ease; }
        .pc-nav-link:hover { opacity: 1; }
        .pc-nav-link::after {
          content: ""; position: absolute; left: 0; right: 0; bottom: -7px; height: 1.5px;
          background: var(--pc-accent); transform: scaleX(0); transform-origin: left;
          transition: transform 0.28s ease;
        }
        .pc-nav-link:hover::after { transform: scaleX(1); }

        /* Cards de lote. */
        .pc-lote { transition: transform 0.35s ease, box-shadow 0.35s ease; }
        .pc-lote:hover { transform: translateY(-4px); box-shadow: 0 28px 60px -32px rgba(0,0,0,0.45); }
        .pc-chip {
          font-size: 0.625rem; letter-spacing: 0.06em; font-weight: 700; text-transform: uppercase;
          padding: 0.15rem 0.5rem; border-radius: 999px;
          background: color-mix(in srgb, var(--pc-primary) 10%, transparent); color: var(--pc-primary);
        }

        /* Faixa de números do hero. */
        .pc-stats { display: grid; gap: 1px; background: rgba(0,0,0,0.08); border-radius: var(--pc-radius); overflow: hidden; }
        .pc-stat { background: var(--pc-bg); padding: 0.875rem 1rem; text-align: center; }

        @media (prefers-reduced-motion: reduce) {
          .pc-lote, .pc-nav-link::after { transition: none; }
        }
      `}</style>

      {isPreview && (
        <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-black text-xs font-semibold text-center py-1">
          Modo prévia — rascunho não publicado
        </div>
      )}

      {/* NAV */}
      <header className="sticky top-0 z-40 pt-3 sm:pt-4">
        <div className="pc-container">
          <div className={`pc-topbar ${scrolled ? "pc-topbar-scrolled" : ""}`}>
            <a href="#top" className="flex items-center gap-2.5 shrink-0 pl-1">
              <img
                src={logo}
                alt="Nelore VC"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover ring-1 ring-black/10 shrink-0 bg-white"
              />
              <span className="pc-display text-base sm:text-lg lg:text-xl font-semibold whitespace-nowrap">
                Nelore <span className="pc-accent">VC</span>
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 shrink-0">
              {NAV.map((n) => (
                <a key={n.href} href={n.href} className="pc-nav-pill">{n.label}</a>
              ))}
              <Link to="/catalogo" className="pc-nav-pill hidden lg:inline-flex">Catálogo</Link>
            </nav>

            <Button
              size="sm"
              className="pc-btn-primary rounded-full shrink-0 text-xs sm:text-sm px-4 sm:px-5"
              onClick={() => abrirWhatsAppPg(MSG_PADRAO_PAGINA_COMERCIAL)}
            >
              <span className="hidden lg:inline">Falar com consultor</span>
              <span className="lg:hidden">Consultor</span>
            </Button>
          </div>

          {/* Mobile: navegação horizontal compacta, rolável — sem menu sanfonado. */}
          <nav className="pc-nav-scroll md:hidden mt-2 flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="pc-nav-chip">{n.label}</a>
            ))}
            <Link to="/catalogo" className="pc-nav-chip">Catálogo</Link>
          </nav>
        </div>
      </header>

      {/* HERO — texto e CTAs acima do vídeo/imagem */}
      <section id="top" className="relative overflow-hidden">
        <div className="pc-container pt-10 sm:pt-16 md:pt-20 pb-4 sm:pb-6">
          <div className="max-w-3xl mx-auto text-center mb-7 sm:mb-11">
            {conteudo?.hero.titulo && (
              <h1 className="pc-display pc-h1 text-[color:var(--pc-text)] text-balance">
                {conteudo.hero.titulo}
              </h1>
            )}
            {conteudo?.hero.subtitulo && (
              <p className="pc-lead pc-measure mt-5 text-black/65 mx-auto">
                {conteudo.hero.subtitulo}
              </p>
            )}
            <div className="mt-7 sm:mt-8 flex flex-wrap justify-center gap-2.5 sm:gap-3">
              {conteudo?.hero.botoes && conteudo.hero.botoes.length > 0 ? (
                renderBotoes(conteudo.hero.botoes)
              ) : (
                <>
              {conteudo?.hero.cta_primario && (
                    <Button size="lg" className="pc-btn-primary" onClick={() => abrirWhatsAppPg(MSG_PADRAO_PAGINA_COMERCIAL)}>
                      {conteudo.hero.cta_primario}
                    </Button>
                  )}
                  {conteudo?.hero.cta_secundario && (
                    <Button size="lg" variant="outline" className="border-[color:var(--pc-primary)] text-[color:var(--pc-primary)] bg-transparent hover:bg-[color:var(--pc-primary)]/5" onClick={() => document.getElementById("lotes")?.scrollIntoView({ behavior: "smooth" })}>
                      {conteudo.hero.cta_secundario}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          {temHeroMidia && (
          <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl ring-1 ring-black/5 shadow-lg sm:shadow-2xl">
            <div className="relative w-full aspect-[16/9] md:aspect-[21/9] md:min-h-[520px]">
              {heroYoutubeAtivo ? (
                <YouTubeLiveEmbed
                  videoId={heroMidia!.video_id!}
                  titulo={heroMidia!.titulo_live}
                  badge={heroMidia!.badge_texto ?? "AO VIVO"}
                  className="absolute inset-0"
                />
              ) : heroVideoArquivo ? (
                <video src={heroMidia!.url} poster={heroMidia!.poster} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
              ) : heroImagem ? (
                <img src={heroImagem} alt="Nelore VC" className="absolute inset-0 w-full h-full object-cover" />
              ) : destaques[0]?.foto_url ? (
                <img src={destaques[0].foto_url} alt={destaques[0].nome} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center text-white/60 pc-display text-4xl" style={{ background: "var(--pc-primary)" }}>
                  Nelore VC
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent" />
            </div>
          </div>
          )}

          {/* Faixa de números — só aparece quando há dado real para mostrar. */}
          {(totalDisponiveis > 0 || evento) && (
            <div
              className="pc-stats mt-5 sm:mt-7"
              style={{ gridTemplateColumns: `repeat(${[totalDisponiveis > 0, !!evento, diasParaEvento != null].filter(Boolean).length}, minmax(0, 1fr))` }}
            >
              {totalDisponiveis > 0 && (
                <div className="pc-stat">
                  <div className="pc-display text-2xl sm:text-3xl font-semibold">{totalDisponiveis}</div>
                  <div className="text-[11px] uppercase tracking-widest text-black/50 mt-0.5">
                    {totalDisponiveis === 1 ? "lote disponível" : "lotes disponíveis"}
                  </div>
                </div>
              )}
              {evento && (
                <div className="pc-stat">
                  <div className="pc-display text-2xl sm:text-3xl font-semibold">
                    {evento.data
                      ? new Date(evento.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                      : "—"}
                  </div>
                  <div className="text-[11px] uppercase tracking-widest text-black/50 mt-0.5">data do leilão</div>
                </div>
              )}
              {diasParaEvento != null && (
                <div className="pc-stat">
                  <div className="pc-display text-2xl sm:text-3xl font-semibold">{diasParaEvento}</div>
                  <div className="text-[11px] uppercase tracking-widest text-black/50 mt-0.5">
                    {diasParaEvento === 1 ? "dia restante" : "dias restantes"}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {secoesOrdem.map((sid) => {
        if (!secaoVisivel(sid)) return null;
        if (sid === "video" || sid === "video_2") {
          const bloco: SecaoVideo | undefined = conteudo?.videos?.[sid];
          const itens = (bloco?.itens ?? []).filter((v) => (v.tipo === "youtube" ? v.video_id : v.url));
          if (itens.length === 0) return null;
          return (
            <section key={sid} id={sid} className="pc-section border-t border-black/5">
              <div className="pc-container">
                {(bloco?.titulo || bloco?.descricao) && (
                  <div className="mb-8 sm:mb-12 max-w-2xl">
                    <div className="pc-eyebrow">Vídeos</div>
                    {bloco?.titulo && <h2 className="pc-display pc-h2 mt-3 text-balance">{bloco.titulo}</h2>}
                    {bloco?.descricao && <p className="mt-4 pc-lead pc-measure text-black/60">{bloco.descricao}</p>}
                  </div>
                )}
                <div className={itens.length === 1 ? "grid gap-6" : "grid gap-6 md:grid-cols-2"}>
                  {itens.map((v) => (
                    <VideoCard key={v.id} video={v} unico={itens.length === 1} />
                  ))}
                </div>
              </div>
            </section>
          );
        }
        if (sid === "sobre") return (
          <section key={sid} id="sobre" className="pc-section border-t border-black/5">
            <div className="pc-container grid md:grid-cols-12 gap-8 md:gap-14 items-center">
              {conteudo?.sobre.imagem_url && (
                <div className="md:col-span-5 order-1">
                  <img
                    src={conteudo.sobre.imagem_url}
                    alt={conteudo.sobre.titulo ?? "Nelore VC"}
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-[4/3] object-cover rounded-[var(--pc-radius)] ring-1 ring-black/5"
                    style={{ boxShadow: "var(--pc-shadow)" }}
                  />
                </div>
              )}
              <div className={conteudo?.sobre.imagem_url ? "md:col-span-7 order-2" : "md:col-span-12"}>
                <div className="pc-eyebrow">Institucional</div>
                <h2 className="pc-display pc-h2 mt-3 text-balance">{conteudo?.sobre.titulo}</h2>
                <div className="mt-5 max-w-[64px]" style={{ background: "var(--pc-accent)", height: "2px" }} />
                <p className="mt-6 pc-lead pc-measure text-black/70 whitespace-pre-line">
                  {conteudo?.sobre.texto}
                </p>
                <button
                  type="button"
                  onClick={() => document.getElementById("lotes")?.scrollIntoView({ behavior: "smooth" })}
                  className="group mt-7 inline-flex items-center gap-1.5 text-sm font-semibold pc-accent border-b border-current/40 pb-1 hover:border-current transition-colors"
                >
                  Conheça os lotes
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </section>
        );
        if (sid === "evento") return evento ? (
          <section key={sid} id="evento" className="pc-section-tight">
            <div className="pc-container-sm">
              {eventosAtivos.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                  {eventosAtivos.map((ev, i) => (
                    <button
                      key={ev.id}
                      onClick={() => setEventoIdx(i)}
                      className={`text-xs sm:text-sm px-3 py-1.5 rounded-full border transition-colors ${
                        i === eventoIdx
                          ? "bg-[color:var(--pc-primary)] text-white border-[color:var(--pc-primary)]"
                          : "bg-white text-[color:var(--pc-primary)] border-[color:var(--pc-primary)]/30 hover:bg-[color:var(--pc-primary)]/5"
                      }`}
                    >
                      {ev.nome}
                    </button>
                  ))}
                </div>
              )}
              <div
                className="pc-card overflow-hidden grid md:grid-cols-[1.2fr_1fr] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-2xl"
                style={{ boxShadow: "0 20px 60px -30px rgba(45,106,79,.35)" }}
                 onClick={(e) => {
                   if ((e.target as HTMLElement).closest("button,a")) return;
                   navigate(`/catalogo?evento=${evento.id}`);
                 }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") navigate(`/catalogo?evento=${evento.id}`); }}
              >
                <div className="p-6 sm:p-8 md:p-12 relative" style={{ background: "var(--pc-primary)", color: "#fff" }}>
                  <div className="text-xs uppercase tracking-widest opacity-80 flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Próximo evento</div>
                  <h3 className="pc-display pc-h2 mt-2">{evento.nome}</h3>
                  {evento.data && (
                    <p className="mt-2 opacity-90">{new Date(evento.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                  )}
                  {diasParaEvento != null && (
                    <div className="mt-4 inline-flex items-baseline gap-2 bg-white/15 border border-white/30 rounded-full px-4 py-1.5">
                      <span className="pc-display text-2xl font-semibold">{diasParaEvento}</span>
                      <span className="text-xs opacity-90">{diasParaEvento === 1 ? "dia restante" : "dias restantes"}</span>
                    </div>
                  )}
                  {evento.descricao && <p className="mt-4 text-white/90 leading-relaxed">{evento.descricao}</p>}
                  {animaisEvento.length > 0 && (
                    <div className="mt-5 flex -space-x-2">
                      {animaisEvento.slice(0, 6).map((a) => (
                        a.foto_url ? (
                          <img key={a.id} src={a.foto_url} alt={a.nome} title={a.nome} className="h-10 w-10 rounded-full object-cover border-2 border-white/70" />
                        ) : (
                          <div key={a.id} className="h-10 w-10 rounded-full bg-white/20 border-2 border-white/70" />
                        )
                      ))}
                      {animaisEvento.length > 6 && (
                        <div className="h-10 w-10 rounded-full bg-white/25 border-2 border-white/70 flex items-center justify-center text-[11px] font-semibold">
                          +{animaisEvento.length - 6}
                        </div>
                      )}
                      <span className="ml-3 self-center text-xs sm:text-sm opacity-90">{animaisEvento.length} {animaisEvento.length === 1 ? "animal selecionado" : "animais selecionados"}</span>
                    </div>
                  )}
                  <div className="mt-6 flex flex-wrap gap-2">
                  {conteudo?.evento_botoes && conteudo.evento_botoes.length > 0 ? (
                      renderBotoes(conteudo.evento_botoes)
                    ) : (
                      <>
                        <Button className="bg-white text-[color:var(--pc-primary)] hover:bg-white/90" onClick={(e) => { e.stopPropagation(); abrirWhatsAppPg(`Quero participar do ${evento.nome}`); }}>
                          Quero participar
                        </Button>
                        <Button variant="outline" className="border-white/50 bg-transparent text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); document.getElementById("lotes")?.scrollIntoView({ behavior: "smooth" }); }}>
                          Ver lotes <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="p-6 sm:p-8 md:p-12 flex flex-col justify-center gap-4 bg-white">
                  <div className="flex items-start gap-3"><Award className="h-5 w-5 pc-accent shrink-0 mt-0.5" /><div><div className="font-semibold">Lotes selecionados</div><div className="text-sm text-black/60">Animais avaliados por índice genético.</div></div></div>
                  <div className="flex items-start gap-3"><Headphones className="h-5 w-5 pc-accent shrink-0 mt-0.5" /><div><div className="font-semibold">Assessoria antecipada</div><div className="text-sm text-black/60">Consultor te orienta antes do dia D.</div></div></div>
                  <div className="flex items-start gap-3"><Truck className="h-5 w-5 pc-accent shrink-0 mt-0.5" /><div><div className="font-semibold">Frete facilitado</div><div className="text-sm text-black/60">Logística nacional em campanhas selecionadas.</div></div></div>
                </div>
              </div>
            </div>
          </section>
        ) : null;
        if (sid === "lotes") return (
          <section key={sid} id="lotes" className="pc-section border-t border-black/5">
            <div className="pc-container">
              {categorias.length > 1 && (
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-3 mb-10 sm:mb-14">
                  {categorias.map((c) => {
                    const Icone = iconeDaCategoria(c.nome);
                    return (
                      <Link
                        key={c.nome}
                        to={`/catalogo?categoria=${encodeURIComponent(c.nome)}`}
                        className="pc-card pc-lote group border border-black/5 p-5 sm:p-6 flex items-start gap-4"
                      >
                        <span
                          className="h-11 w-11 shrink-0 rounded-xl grid place-items-center text-white"
                          style={{ background: "var(--pc-primary)" }}
                        >
                          <Icone className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="pc-display pc-h3 block">{c.nome}</span>
                          <span className="block text-sm text-black/55 mt-0.5">
                            {c.total} {c.total === 1 ? "lote disponível" : "lotes disponíveis"}
                          </span>
                          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold pc-accent">
                            Ver disponíveis
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="flex items-end justify-between flex-wrap gap-4 mb-8 sm:mb-12">
                <div>
                  <div className="pc-eyebrow">Vitrine</div>
                  <h2 className="pc-display pc-h2 mt-3">Lotes em destaque</h2>
                  {totalDisponiveis > 0 && (
                    <p className="mt-2 text-sm text-black/50">
                      {totalDisponiveis} {totalDisponiveis === 1 ? "animal disponível no catálogo" : "animais disponíveis no catálogo"}
                    </p>
                  )}
                </div>
                <Link
                  to="/catalogo"
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold pc-accent border-b border-current/40 pb-1 hover:border-current transition-colors"
                >
                  Ver catálogo completo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              {loadingAnimais ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
                </div>
              ) : destaques.length === 0 ? (
                <div className="text-center py-16 text-black/50">Nenhum lote em destaque ainda.</div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {destaques.map((a) => <LoteCard key={a.id} animal={a} onInteresse={() => abrirWhatsAppPg(msgInteresseAnimal(a))} />)}
                </div>
              )}
            </div>
          </section>
        );
        if (sid === "pilares") return (
          <section key={sid} className="pc-section bg-white/60 border-t border-black/5">
            <div className="pc-container">
              <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14">
                <div className="pc-eyebrow">Por que Nelore VC</div>
                <h2 className="pc-display pc-h2 mt-2">Genética, avaliação e assessoria juntas</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {conteudo?.pilares.map((p, i) => {
                  const Icon = ICONE_MAP[p.icone ?? "Award"] ?? Award;
                  return (
                    <div key={i} className="pc-card p-5 sm:p-6 border border-black/5">
                      <div className="h-11 w-11 rounded-xl flex items-center justify-center text-white mb-4" style={{ background: "var(--pc-primary)" }}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="pc-display text-lg sm:text-xl mb-1">{p.titulo}</h3>
                      <p className="text-sm text-black/65 leading-relaxed">{p.descricao}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
        if (sid === "depoimentos") return conteudo?.depoimentos && conteudo.depoimentos.length > 0 ? (
          <section key={sid} className="pc-section">
            <div className="pc-container-sm">
              <div className="pc-eyebrow text-center">Depoimentos</div>
              <h2 className="pc-display pc-h2 text-center mt-2 mb-8 sm:mb-12">Quem cria com a gente</h2>
              <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
                {conteudo.depoimentos.map((d, i) => (
                  <blockquote key={i} className="pc-card p-6 sm:p-8 border border-black/5">
                    <p className="pc-display text-lg sm:text-xl leading-snug">"{d.texto}"</p>
                    <footer className="mt-4 text-sm text-black/60">— {d.nome}</footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </section>
        ) : null;
        if (sid === "faq") return conteudo?.faq && conteudo.faq.length > 0 ? (
          <section key={sid} id="faq" className="pc-section border-t border-black/5">
            <div className="pc-container-sm">
              <div className="pc-eyebrow">Dúvidas</div>
              <h2 className="pc-display pc-h2 mt-2 mb-6 sm:mb-8">Perguntas frequentes</h2>
              <Accordion type="single" collapsible className="pc-card border border-black/5 px-4 sm:px-6">
                {conteudo.faq.map((f, i) => (
                  <AccordionItem key={i} value={`f-${i}`}>
                    <AccordionTrigger className="text-left pc-display text-base sm:text-lg">{f.pergunta}</AccordionTrigger>
                    <AccordionContent className="text-black/70">{f.resposta}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        ) : null;
        if (sid === "cta_final") {
          const ctaBotoes = conteudo?.cta_final?.botoes;
          return (
            <section key={sid} id="cta_final" className="pc-section">
              <div className="pc-container-sm">
                <div className="pc-card p-6 sm:p-10 md:p-14 text-center" style={{ background: "var(--pc-primary)", color: "#fff" }}>
                  <h2 className="pc-display pc-h2">{conteudo?.cta_final?.titulo ?? "Pronto para escolher a genética do seu rebanho?"}</h2>
                  <p className="mt-3 opacity-90 max-w-2xl mx-auto text-sm sm:text-base">{conteudo?.cta_final?.texto ?? "Fale com um consultor Nelore VC agora e receba uma seleção personalizada."}</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {ctaBotoes && ctaBotoes.length > 0 ? renderBotoes(ctaBotoes) : (
                      <Button size="lg" className="bg-white text-[color:var(--pc-primary)] hover:bg-white/90" onClick={() => abrirWhatsAppPg(MSG_PADRAO_PAGINA_COMERCIAL)}>
                        <MessageCircle className="h-4 w-4 mr-2" /> Falar com consultor
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        }
        return null;
      })}

      {/* RODAPÉ */}
      <footer className="pc-section-tight border-t border-black/5">
        <div className="pc-container grid md:grid-cols-3 gap-6 sm:gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <img src={logo} alt="" className="h-8 w-8 rounded-full object-cover" />
              <span className="pc-display text-lg font-semibold">Nelore <span className="pc-accent">VC</span></span>
            </div>
            <p className="text-black/60">Genética Nelore PO — Londrina/PR</p>
          </div>
          <div className="space-y-2 text-black/70">
            {conteudo?.rodape.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 pc-accent" /> {conteudo.rodape.email}</div>}
            {conteudo?.rodape.endereco && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 pc-accent" /> {conteudo.rodape.endereco}</div>}
            {conteudo?.rodape.instagram && <a href={conteudo.rodape.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:opacity-70"><Instagram className="h-4 w-4 pc-accent" /> Instagram</a>}
          </div>
          <div className="md:text-right">
            <Button className="pc-btn-primary gap-2 w-full sm:w-auto" onClick={() => abrirWhatsAppPg(MSG_PADRAO_PAGINA_COMERCIAL)}>
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </Button>
          </div>
        </div>
        <div className="pc-container mt-8 pt-6 border-t border-black/5 text-xs text-black/50">
          © {new Date().getFullYear()} Nelore VC. Todos os direitos reservados.
        </div>
      </footer>

    </div>
  );
}

/** Um vídeo da página: YouTube (com selo de ao vivo) ou arquivo mp4. */
function VideoCard({ video, unico }: { video: VideoItem; unico: boolean }) {
  const src =
    video.tipo === "youtube" && video.video_id
      ? `https://www.youtube.com/embed/${video.video_id}?rel=0&modestbranding=1${video.ao_vivo ? "&autoplay=1&mute=1" : ""}`
      : null;

  return (
    <figure className="pc-card overflow-hidden border border-black/5">
      <div className={`relative w-full bg-black ${unico ? "aspect-video" : "aspect-video"}`}>
        {src ? (
          <iframe
            src={src}
            title={video.titulo || "Vídeo Nelore VC"}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : video.url ? (
          <video
            src={video.url}
            poster={video.poster}
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-white/40 text-sm">
            <Play className="h-6 w-6" />
          </div>
        )}
        {video.ao_vivo && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--pc-accent)] px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Ao vivo
          </span>
        )}
      </div>
      {(video.titulo || video.descricao) && (
        <figcaption className="p-4 sm:p-5">
          {video.titulo && <div className="pc-display pc-h3">{video.titulo}</div>}
          {video.descricao && <p className="mt-1.5 text-sm text-black/55 leading-relaxed">{video.descricao}</p>}
        </figcaption>
      )}
    </figure>
  );
}

function LoteCard({ animal, onInteresse }: { animal: Animal; onInteresse: () => void }) {
  const indices = [
    animal.iabcz != null ? { label: "iABCZ", valor: animal.iabcz } : null,
    animal.mgte != null ? { label: "MGTe", valor: animal.mgte } : null,
    animal.iqg != null ? { label: "IQG", valor: animal.iqg } : null,
  ].filter(Boolean) as { label: string; valor: number }[];

  return (
    <article className="pc-lote pc-card overflow-hidden border border-black/5 flex flex-col group">
      <Link to={`/catalogo/${animal.id}`} className="relative aspect-[4/5] bg-black/5 block overflow-hidden">
        {animal.foto_url ? (
          <img
            src={animal.foto_url}
            alt={animal.nome}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-black/30 text-xs">Sem foto</div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
        {animal.lote && (
          <span className="absolute top-3 left-3 text-[10px] font-bold tracking-wider text-white px-2 py-1 rounded-full backdrop-blur-sm" style={{ background: "color-mix(in srgb, var(--pc-primary) 88%, transparent)" }}>
            LOTE {animal.lote}
          </span>
        )}
        {animal.destaque && (
          <span className="absolute top-3 right-3 bg-white/90 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> DESTAQUE
          </span>
        )}
      </Link>

      <div className="p-3.5 sm:p-5 flex-1 flex flex-col gap-3">
        <div className="min-w-0">
          <Link
            to={`/catalogo/${animal.id}`}
            className="pc-display pc-h3 line-clamp-1 hover:opacity-70 transition-opacity block"
          >
            {animal.nome}
          </Link>
          {(animal.categoria || animal.raca) && (
            <p className="text-[11px] sm:text-xs uppercase tracking-wider text-black/45 mt-1">
              {[animal.categoria, animal.raca].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {indices.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {indices.map((ix) => (
              <span key={ix.label} className="pc-chip">
                {ix.label} {ix.valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
              </span>
            ))}
          </div>
        )}

        {animal.parcelas && animal.valor_parcela ? (
          <div className="mt-auto">
            <p className="pc-display text-base sm:text-xl font-semibold pc-accent leading-none">
              {animal.parcelas}x {fmtBRL(animal.valor_parcela)}
            </p>
            {animal.preco_total && (
              <p className="text-[11px] sm:text-xs text-black/45 mt-1">Total {fmtBRL(animal.preco_total)}</p>
            )}
          </div>
        ) : (
          <div className="mt-auto" />
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" className="pc-btn-primary gap-1.5 text-xs sm:text-sm h-8 sm:h-9 flex-1" onClick={onInteresse}>
            <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Tenho interesse
          </Button>
          <Link
            to={`/catalogo/${animal.id}`}
            aria-label={`Ver ficha de ${animal.nome}`}
            className="h-8 sm:h-9 px-2.5 grid place-items-center rounded-md border border-black/10 text-black/60 hover:text-[color:var(--pc-primary)] hover:border-[color:var(--pc-primary)]/40 transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
