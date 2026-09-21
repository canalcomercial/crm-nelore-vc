import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock, Dna, Instagram, MapPin, MessageCircle, PlayCircle, ScrollText, Search, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnimaisPorEvento, useConfiguracao, LAYOUT_PADRAO, type CatalogoLayout, type Evento } from "@/hooks/useCatalogo";
import { EmbriaoCard } from "@/components/catalogo/embrioes/EmbriaoCard";
import { faixasPorCriatorio } from "@/lib/embrioes";
import { normalizarCabecalho } from "@/lib/importar-erural";
import { abrirWhatsApp } from "@/lib/whatsapp";
import logo from "@/assets/logo-nelore-vc.png";

function dataBR(iso?: string | null, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit" }) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR", opts);
}

/**
 * Catálogo de um evento de EMBRIÕES (evento.tipo = "embrioes"), no mesmo
 * padrão visual da vitrine de fêmeas e touros.
 */
export default function EmbrioesCatalogoPage({ evento, outrosEventos = [] }: { evento: Evento; outrosEventos?: Evento[] }) {
  const { data: lotes = [], isLoading } = useAnimaisPorEvento(evento.id);
  const { data: config } = useConfiguracao();
  const [criatorio, setCriatorio] = useState("todos");
  const [busca, setBusca] = useState("");
  const det = evento.detalhes ?? {};
  const layout: CatalogoLayout = { ...LAYOUT_PADRAO, ...(config?.layout as CatalogoLayout | null) };
  const whatsapp = (det.whatsapp || config?.whatsapp || "").replace(/\D/g, "");

  useEffect(() => { document.title = `Embriões · ${evento.nome} | Nelore VC`; }, [evento.nome]);
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--catalog-primary", layout.cor_primary);
    root.style.setProperty("--catalog-bg", layout.cor_bg);
    return () => { root.style.removeProperty("--catalog-primary"); root.style.removeProperty("--catalog-bg"); };
  }, [layout.cor_primary, layout.cor_bg]);

  const faixas = useMemo(() => faixasPorCriatorio(lotes), [lotes]);
  const criatorios = useMemo(() => Array.from(new Set(faixas.map((f) => f.criatorio))), [faixas]);
  const totalEmbrioes = useMemo(() => lotes.reduce((s, a) => s + (a.embriao?.quantidade ?? 0), 0), [lotes]);
  const totalGarantia = useMemo(() => lotes.reduce((s, a) => s + (a.embriao?.garantia_prenhezes ?? 0), 0), [lotes]);

  const lista = useMemo(() => {
    const q = normalizarCabecalho(busca);
    return lotes.filter((a) => {
      const c = (a.embriao?.criatorio ?? a.fazenda ?? "").trim() || "Outros";
      if (criatorio !== "todos" && c !== criatorio) return false;
      if (!q) return true;
      return normalizarCabecalho([a.lote, a.nome, a.mae, a.pai, a.avo_materno_pai, c].join(" ")).includes(q);
    });
  }, [lotes, criatorio, busca]);

  const inicio = dataBR(evento.data);
  const fim = dataBR(det.data_fim);

  return (
    <div className="min-h-screen text-neutral-900" style={{ ["--catalog-primary" as never]: layout.cor_primary, ["--catalog-bg" as never]: layout.cor_bg, backgroundColor: `hsl(${layout.cor_bg})` }}>
      <header className="bg-white border-b border-black/5 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/catalogo" className="flex items-center gap-2">
            <img src={logo} alt="Nelore VC" className="h-9 w-9 rounded-full object-cover" />
            <span className="font-display text-lg font-semibold text-[hsl(var(--catalog-primary))]">Nelore VC</span>
          </Link>
          <span className="hidden md:block text-sm text-neutral-500 border-l pl-4 ml-2 truncate">{evento.nome}</span>
          <nav className="ml-auto flex items-center gap-4 text-sm text-neutral-600">
            <a href="#pacotes" className="hover:text-[hsl(var(--catalog-primary))]">Pacotes</a>
            {whatsapp && <a href="#contato" className="hidden sm:inline hover:text-[hsl(var(--catalog-primary))]">Contato</a>}
          </nav>
        </div>
      </header>

      <section className="bg-[hsl(var(--catalog-primary))] text-white relative overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-[#D0100B]" />
        {det.capa_url && <img src={det.capa_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16">
          {outrosEventos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-xs sm:text-sm px-3 py-1.5 rounded-full border bg-white text-[hsl(var(--catalog-primary))] border-white">{evento.nome} · Embriões</span>
              {outrosEventos.map((ev) => (
                <Link key={ev.id} to={`/catalogo?evento=${ev.id}`} className="text-xs sm:text-sm px-3 py-1.5 rounded-full border text-white border-white/40 hover:bg-white/10">{ev.nome}</Link>
              ))}
            </div>
          )}
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/70 mb-3 flex items-center gap-2"><Dna className="h-3.5 w-3.5" /> Catálogo de embriões{det.subtitulo ? ` · ${det.subtitulo}` : ""}</p>
              <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight" data-testid="evento-nome">{evento.nome}</h1>
              {evento.descricao && <p className="mt-4 text-white/85 max-w-2xl text-base md:text-lg">{evento.descricao}</p>}
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/90">
                {inicio && <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {fim ? `${inicio} a ${fim}` : dataBR(evento.data, { day: "2-digit", month: "long", year: "numeric" })}</span>}
                {det.horario && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {det.horario}</span>}
                {det.local && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {det.local}</span>}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {det.link_playlist && <a href={det.link_playlist} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[hsl(var(--catalog-primary))] hover:bg-white/90"><PlayCircle className="h-4 w-4" /> Assista à playlist</a>}
                {det.link_condicoes && <a href={det.link_condicoes} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-sm font-semibold hover:bg-white/10"><ScrollText className="h-4 w-4" /> Condições</a>}
                {det.instagram && <a href={`https://instagram.com/${det.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-sm font-semibold hover:bg-white/10"><Instagram className="h-4 w-4" /> {det.instagram.replace(/^@?/, "@")}</a>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <Numero valor={lotes.length} rotulo={lotes.length === 1 ? "pacote" : "pacotes"} />
              <Numero valor={totalEmbrioes || "—"} rotulo="embriões" />
              {det.parcelas_destaque ? (
                <div className="rounded-xl bg-[#D0100B] px-2 py-3">
                  <div className="font-display text-3xl font-bold leading-none">{det.parcelas_destaque}</div>
                  <div className="mt-1 text-[11px] text-white/85 leading-tight">parcelas {det.parcelas_detalhe}</div>
                </div>
              ) : (
                <Numero valor={totalGarantia || "—"} rotulo="prenhezes garantidas" />
              )}
            </div>
          </div>
        </div>
      </section>


      <section id="pacotes" className="max-w-6xl mx-auto px-4 py-8 scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <ShieldCheck className="h-4 w-4 text-[hsl(var(--catalog-primary))]" />
            <span><b className="text-neutral-900">{lista.length}</b> {lista.length === 1 ? "pacote disponível" : "pacotes disponíveis"}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <label className="relative">
              <span className="sr-only">Buscar lote, doadora ou touro</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input id="busca-embrioes" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Lote, doadora ou touro"
                className="h-10 w-full sm:w-64 rounded-md border border-input bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--catalog-primary))]/30" />
            </label>
            <Select value={criatorio} onValueChange={setCriatorio}>
              <SelectTrigger className="w-full sm:w-[210px] bg-white" aria-label="Filtrar por criatório"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os criatórios</SelectItem>
                {criatorios.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : lista.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-neutral-500 border border-black/5">
            {lotes.length ? "Nenhum pacote encontrado com esse filtro." : "Nenhum pacote de embriões publicado neste evento ainda."}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="grade-embrioes">
            {lista.map((a) => <EmbriaoCard key={a.id} animal={a} />)}
          </div>
        )}
      </section>

      <footer id="contato" className="bg-[hsl(var(--catalog-primary))] text-white/90">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Nelore VC" className="h-10 w-10 rounded-full bg-white p-0.5" />
            <div>
              <div className="font-display text-lg font-semibold text-white">Nelore VC</div>
              <div className="text-xs text-white/70">{evento.nome}</div>
            </div>
          </div>
          {whatsapp && (
            <button type="button" onClick={() => abrirWhatsApp(whatsapp, `Olá! Vim pelo catálogo de embriões ${evento.nome}.`)} className="inline-flex items-center gap-2 text-sm hover:text-white">
              <MessageCircle className="h-4 w-4" /> WhatsApp: {det.whatsapp || config?.whatsapp}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

function Numero({ valor, rotulo }: { valor: number | string; rotulo: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-2 py-3 ring-1 ring-white/15">
      <div className="font-display text-3xl font-bold leading-none">{valor}</div>
      <div className="mt-1 text-[11px] text-white/75 leading-tight">{rotulo}</div>
    </div>
  );
}
