import { useState } from "react";
import { Play, Gavel } from "lucide-react";
import {
  blocoTemDados,
  sexoDoAnimal,
  youtubeEmbedUrl,
  type Animal,
  type GeneticaBloco,
  type GeneticaFonte,
} from "@/hooks/useCatalogo";

/**
 * Ficha do animal no padrão do catálogo impresso de leilão, na paleta Nelore VC.
 *
 * Estrutura: cabeçalho de lote, pill de registro/nascimento, mídia com CTA,
 * pedigree em colchetes, três blocos de avaliação genética (PMGZ / ANCP /
 * GenePlus) e, no rodapé, o bloco do ventre (fêmeas), a cria ao pé quando
 * existir, ou os dados do reprodutor (touros).
 */

/**
 * Paleta Nelore VC — preto, vermelho e branco, tirados do logo.
 * É fixa de propósito: a ficha tem que sair igual em qualquer evento.
 */
const VC = {
  preto: "#12171B",
  pretoSuave: "#2A3238",
  vermelho: "#D0100B",
  vermelhoSuave: "#FBE9E8",
  linha: "#D7DBDE",
  caixa: "#F1F2F3",
  cardBg: "#EFF0F1",
  linhaZebra: "#F7F7F8",
  cinzaTexto: "#5B656C",
} as const;

/** Cor institucional de cada fonte — usada só no selo, para identificar a origem. */
const FONTE_COR: Record<GeneticaFonte, string> = {
  pmgz: "#1B6FB5",
  ancp: "#6FA8DC",
  geneplus: "#1E6B4E",
};

const FONTE_NOME: Record<GeneticaFonte, string> = {
  pmgz: "PMGZ",
  ancp: "ANCP",
  geneplus: "GENE PLUS",
};

function fmtData(d?: string | null) {
  if (!d) return null;
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
}

function fmtNumero(v?: number | null, sufixo = "") {
  if (v == null) return null;
  return `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}${sufixo}`;
}

/* ------------------------------------------------------------------ */
/* Cabeçalho                                                           */
/* ------------------------------------------------------------------ */

function CabecalhoLote({ animal }: { animal: Animal }) {
  const qtd = animal.ficha?.comercial?.quantidade;
  const tipo = qtd && qtd > 1 ? `${qtd} ANIMAIS` : animal.categoria?.trim() ? animal.categoria.toUpperCase() : "INDIVIDUAL";
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5">
      <span className="hidden sm:block h-px flex-1 max-w-[120px]" style={{ background: VC.linha }} />
      <span className="text-[11px] sm:text-sm font-bold tracking-[0.28em]" style={{ color: VC.preto }}>LOTE</span>
      {animal.lote && (
        <span
          className={`grid place-items-center h-11 sm:h-14 px-2 rounded-full font-extrabold ${
            animal.lote.length > 2
              ? "min-w-[2.75rem] sm:min-w-[3.5rem] text-lg sm:text-2xl"
              : "w-11 sm:w-14 text-xl sm:text-3xl"
          }`}
          style={{ border: `2px solid ${VC.vermelho}`, color: VC.preto }}
        >
          {animal.lote}
        </span>
      )}
      <span className="text-[9px] sm:text-[11px] font-semibold tracking-[0.28em] truncate max-w-[40vw]" style={{ color: VC.cinzaTexto }}>
        {tipo}
      </span>
      <span className="hidden sm:block h-px flex-1 max-w-[120px]" style={{ background: VC.linha }} />
    </div>
  );
}

/** Marca discreta ao lado do registro, no espírito do selo do catálogo. */
function MarcaRegistro() {
  return (
    <svg
      viewBox="0 0 24 18"
      aria-hidden
      className="h-3.5 w-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 2c0 5 2 7 4 8" />
      <path d="M22 2c0 5-2 7-4 8" />
      <path d="M6 10c0 4 2.7 6 6 6s6-2 6-6c0-2-1.2-3.5-3-4H9c-1.8.5-3 2-3 4Z" />
    </svg>
  );
}

function PillIdentificacao({ animal }: { animal: Animal }) {
  const nascimento = fmtData(animal.nascimento);
  if (!animal.registro && !nascimento) return null;
  return (
    <div
      className="mx-auto inline-flex items-stretch rounded-full overflow-hidden text-xs sm:text-sm"
      style={{ border: `1.5px solid ${VC.preto}` }}
    >
      {animal.registro && (
        <span
          className="px-3 sm:px-5 py-1.5 font-bold text-white flex items-center gap-2"
          style={{ background: VC.preto }}
        >
          <MarcaRegistro />
          {animal.registro}
        </span>
      )}
      {nascimento && (
        <span className="px-3 sm:px-5 py-1.5 font-semibold bg-white" style={{ color: VC.preto }}>
          Nasc: {nascimento}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mídia                                                               */
/* ------------------------------------------------------------------ */

function MidiaLote({
  animal,
  onProposta,
  textoProposta,
}: {
  animal: Animal;
  onProposta?: () => void;
  textoProposta: string;
}) {
  const [tocando, setTocando] = useState(false);
  const embed = youtubeEmbedUrl(animal.link_video);
  const preLance = animal.link_pre_lance?.trim();

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* A mídia fica limpa: nada de botão por cima atrapalhando a visualização. */}
      <div
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-900 aspect-[4/3] sm:aspect-[16/10]"
        style={{ border: `3px solid ${VC.preto}` }}
      >
        {tocando && embed ? (
          <iframe
            src={`${embed}${embed.includes("?") ? "&" : "?"}autoplay=1`}
            title={animal.nome}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
          />
        ) : animal.foto_url ? (
          <img
            src={animal.foto_url}
            alt={animal.nome}
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
        ) : embed ? (
          <iframe src={embed} title={animal.nome} className="w-full h-full" allowFullScreen />
        ) : (
          <div className="w-full h-full grid place-items-center text-white/40 text-sm">Sem mídia</div>
        )}
      </div>

      {/* Ações abaixo da mídia — no celular ocupam a largura toda, com alvo de toque grande. */}
      {(embed || preLance || onProposta) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {embed && !tocando && (
            <button
              type="button"
              onClick={() => setTocando(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 sm:py-2.5 text-sm font-semibold transition-colors"
              style={{ border: `1.5px solid ${VC.preto}`, color: VC.preto }}
            >
              <Play className="h-4 w-4 fill-current" /> Assistir ao vídeo
            </button>
          )}
          {embed && tocando && (
            <button
              type="button"
              onClick={() => setTocando(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 sm:py-2.5 text-sm font-semibold transition-colors"
              style={{ border: `1.5px solid ${VC.linha}`, color: VC.cinzaTexto }}
            >
              Voltar para a foto
            </button>
          )}

          {preLance ? (
            <a
              href={preLance}
              target="_blank"
              rel="noreferrer"
              className="sm:ml-auto inline-flex items-center justify-center gap-2 rounded-full px-6 sm:px-8 py-3 sm:py-2.5 text-xs sm:text-sm font-semibold tracking-[0.1em] uppercase text-white shadow-sm transition-transform hover:scale-[1.02]"
              style={{ background: VC.vermelho }}
            >
              <Gavel className="h-4 w-4" /> Dê seu pré-lance
            </a>
          ) : onProposta ? (
            <button
              type="button"
              onClick={onProposta}
              className="sm:ml-auto inline-flex items-center justify-center gap-2 rounded-full px-6 sm:px-8 py-3 sm:py-2.5 text-xs sm:text-sm font-semibold tracking-[0.1em] uppercase text-white shadow-sm transition-transform hover:scale-[1.02]"
              style={{ background: VC.vermelho }}
            >
              <Gavel className="h-4 w-4" /> {textoProposta}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pedigree                                                            */
/* ------------------------------------------------------------------ */

function AvoLabel({ nome }: { nome?: string | null }) {
  return (
    <div
      className="text-center text-[10px] sm:text-xs font-bold tracking-wide uppercase leading-tight px-0.5"
      style={{ color: VC.pretoSuave }}
    >
      {nome || "—"}
    </div>
  );
}

function PedigreeCatalogo({ animal }: { animal: Animal }) {
  const temAlgo =
    animal.pai ||
    animal.mae ||
    animal.avo_paterno_pai ||
    animal.avo_paterno_mae ||
    animal.avo_materno_pai ||
    animal.avo_materno_mae;
  if (!temAlgo) return null;

  const bracket = "h-2.5 sm:h-3.5";
  const borda = `1.5px solid ${VC.linha}`;

  return (
    <section aria-label="Pedigree" className="grid grid-cols-2 gap-x-3 sm:gap-x-8">
      <AvoLabel nome={animal.avo_paterno_pai} />
      <AvoLabel nome={animal.avo_materno_pai} />

      <div className={`${bracket} rounded-tl-xl`} style={{ borderTop: borda, borderLeft: borda }} />
      <div className={`${bracket} rounded-tr-xl`} style={{ borderTop: borda, borderRight: borda }} />

      <div className="col-span-2 my-1.5 sm:my-2 flex items-center gap-1.5 sm:gap-3">
        <span className="text-sm sm:text-base leading-none" style={{ color: VC.pretoSuave }} aria-hidden>♂</span>
        <span className="hidden sm:inline text-xs font-bold tracking-wide" style={{ color: VC.preto }}>PAI</span>
        <span
          className="flex-1 min-w-0 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-center text-[11px] sm:text-sm font-semibold truncate"
          style={{ background: VC.caixa, color: VC.preto }}
        >
          {animal.pai || "—"}
        </span>
        <span className="text-[10px] sm:text-sm font-semibold shrink-0" style={{ color: VC.cinzaTexto }}>X</span>
        <span
          className="flex-1 min-w-0 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-center text-[11px] sm:text-sm font-semibold truncate"
          style={{ background: VC.caixa, color: VC.preto }}
        >
          {animal.mae || "—"}
        </span>
        <span className="hidden sm:inline text-xs font-bold tracking-wide" style={{ color: VC.preto }}>MÃE</span>
        <span className="text-sm sm:text-base leading-none" style={{ color: VC.vermelho }} aria-hidden>♀</span>
      </div>

      <div className={`${bracket} rounded-bl-xl`} style={{ borderBottom: borda, borderLeft: borda }} />
      <div className={`${bracket} rounded-br-xl`} style={{ borderBottom: borda, borderRight: borda }} />

      <AvoLabel nome={animal.avo_paterno_mae} />
      <AvoLabel nome={animal.avo_materno_mae} />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Blocos genéticos                                                    */
/* ------------------------------------------------------------------ */

const HEX = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

function HexBadge({ fonte }: { fonte: GeneticaFonte }) {
  const cor = FONTE_COR[fonte];
  return (
    <div className="h-12 w-[112px] grid place-items-center" style={{ background: cor, clipPath: HEX }}>
      <div className="h-[42px] w-[103px] grid place-items-center bg-white" style={{ clipPath: HEX }}>
        <span className="text-[11px] font-extrabold tracking-tight leading-none text-center" style={{ color: cor }}>
          {FONTE_NOME[fonte]}
        </span>
      </div>
    </div>
  );
}

function BlocoGenetico({ fonte, bloco }: { fonte: GeneticaFonte; bloco: GeneticaBloco }) {
  const cor = FONTE_COR[fonte];
  const resumo = (bloco.resumo ?? []).filter((r) => (r.label ?? "").trim() !== "");
  const linhas = (bloco.linhas ?? []).filter(
    (l) => (l.dep ?? "").trim() !== "" || (l.indice ?? "").trim() !== "" || (l.top ?? "").trim() !== "",
  );

  return (
    <div className="relative pt-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
        <HexBadge fonte={fonte} />
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: VC.cardBg }}>
        {resumo.length > 0 && (
          <div
            className="pt-8 pb-4 px-3 grid gap-1 text-center"
            style={{ gridTemplateColumns: `repeat(${resumo.length}, minmax(0, 1fr))` }}
          >
            {resumo.map((r, i) => (
              <div key={`${r.label}-${i}`}>
                <div className="text-[11px] sm:text-xs font-bold" style={{ color: VC.pretoSuave }}>{r.label}</div>
                <div className="text-xl sm:text-2xl font-extrabold leading-tight" style={{ color: VC.preto }}>
                  {r.valor?.trim() || "–"}
                </div>
              </div>
            ))}
          </div>
        )}

        {linhas.length > 0 && (
          <>
            <div
              className="grid grid-cols-3 text-white text-[10px] sm:text-xs font-bold tracking-wide"
              style={{ background: VC.preto, borderBottom: `2px solid ${cor}` }}
            >
              <span className="py-1.5 px-2 text-center">DEP</span>
              <span className="py-1.5 px-2 text-center">ÍNDICE</span>
              <span className="py-1.5 px-2 text-center">TOP</span>
            </div>
            <div>
              {linhas.map((l, i) => (
                <div
                  key={`${l.dep}-${i}`}
                  className="grid grid-cols-3 text-[11px] sm:text-xs"
                  style={{ background: i % 2 === 0 ? "#FFFFFF" : VC.linhaZebra, color: VC.preto }}
                >
                  <span className="py-1.5 px-2 text-center font-medium">{l.dep || "—"}</span>
                  <span className="py-1.5 px-2 text-center">{l.indice || "—"}</span>
                  <span className="py-1.5 px-2 text-center">{l.top || "—"}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Blocos de rodapé                                                    */
/* ------------------------------------------------------------------ */

type ItemRodape = { label: string; valor: string; alt?: boolean };

function PillRodape({ label, valor, alt }: ItemRodape) {
  return (
    <div className="min-w-0">
      <div
        className="rounded-full px-3 sm:px-4 py-1 text-center text-[10px] sm:text-xs font-bold tracking-wide truncate"
        style={{
          background: alt ? VC.caixa : VC.preto,
          color: alt ? VC.pretoSuave : "#FFFFFF",
        }}
      >
        {label}
      </div>
      <div
        className="mt-1.5 rounded-full bg-white px-3 sm:px-4 py-1.5 text-center text-[11px] sm:text-sm font-semibold truncate"
        style={{ border: `1px solid ${VC.linha}`, color: VC.preto }}
      >
        {valor}
      </div>
    </div>
  );
}

function SecaoRodape({ titulo, itens }: { titulo: string; itens: ItemRodape[] }) {
  if (itens.length === 0) return null;
  return (
    <section>
      <h2
        className="text-center text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] uppercase mb-3"
        style={{ color: VC.cinzaTexto }}
      >
        {titulo}
      </h2>
      <div className="grid grid-cols-2 sm:flex sm:justify-center gap-2 sm:gap-3 max-w-3xl mx-auto">
        {itens.map((it) => (
          <div key={it.label} className={it.alt ? "sm:w-32" : "sm:w-52"}>
            <PillRodape {...it} />
          </div>
        ))}
      </div>
    </section>
  );
}

function itensVentre(animal: Animal): ItemRodape[] {
  const v = animal.genetica?.ventre;
  const parto = fmtData(animal.previsao_parto);
  return [
    animal.pai_prenhez ? { label: "PAI DA PRENHEZ", valor: animal.pai_prenhez } : null,
    parto ? { label: "PREV. PARTO", valor: parto } : null,
    v?.iabcz?.trim() ? { label: "iABCZ", valor: v.iabcz.trim(), alt: true } : null,
    v?.deca?.trim() ? { label: "DECA", valor: v.deca.trim(), alt: true } : null,
    v?.mgte?.trim() ? { label: "MGTe", valor: v.mgte.trim(), alt: true } : null,
    v?.top_mgte?.trim() ? { label: "TOP", valor: v.top_mgte.trim(), alt: true } : null,
  ].filter(Boolean) as ItemRodape[];
}

/** Peso e CE — mostrados sempre que a planilha trouxer, independente do sexo. */
function itensFisicos(animal: Animal): ItemRodape[] {
  const peso = fmtNumero(animal.peso_kg, " kg");
  const ce = fmtNumero(animal.ce_cm, " cm");
  return [
    peso ? { label: "PESO", valor: peso } : null,
    ce ? { label: "CE", valor: ce } : null,
  ].filter(Boolean) as ItemRodape[];
}

function itensCria(animal: Animal): ItemRodape[] {
  const c = animal.ficha?.cria;
  if (!c) return [];
  const nasc = fmtData(c.nascimento);
  return [
    c.registro ? { label: "REGISTRO", valor: c.registro } : null,
    c.pai ? { label: "PAI DA CRIA", valor: c.pai } : null,
    nasc ? { label: "NASC.", valor: nasc, alt: true } : null,
    c.sexo ? { label: "SEXO", valor: c.sexo, alt: true } : null,
    c.iabcz?.trim() ? { label: "iABCZ", valor: c.iabcz.trim(), alt: true } : null,
    c.deca?.trim() ? { label: "DECA", valor: c.deca.trim(), alt: true } : null,
  ].filter(Boolean) as ItemRodape[];
}

/* ------------------------------------------------------------------ */
/* Ficha completa — tudo o que veio da planilha                        */
/* ------------------------------------------------------------------ */

type Campo = { label: string; valor: string };

function campo(label: string, valor: unknown): Campo | null {
  if (valor == null) return null;
  const s = typeof valor === "number" ? valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : String(valor).trim();
  return s === "" ? null : { label, valor: s };
}

/**
 * Lista todos os campos importados que ainda não apareceram na ficha visual.
 *
 * O objetivo é simples: nada que veio da planilha pode se perder. Campos já
 * exibidos acima (nome, lote, registro, nascimento, pedigree, índices, peso,
 * CE, prenhez e cria) ficam de fora para não repetir.
 */
function camposImportados(animal: Animal): Campo[] {
  const c = animal.ficha?.comercial ?? {};
  const p = animal.ficha?.prenhez ?? {};
  const cria = animal.ficha?.cria ?? {};

  return [
    // Identificação e origem
    campo("Raça", animal.raca),
    campo("Tipo", c.tipo),
    campo("Tipo genético", c.tipo_genetica),
    campo("Espécie", c.especie),
    campo("Idade", c.idade),
    campo("Quantidade", c.quantidade),
    campo("Fornecedor", c.fornecedor ?? animal.fornecedor ?? animal.fazenda),
    campo("Cidade", c.cidade),
    campo("UF", c.uf),
    campo("Localização", !c.cidade && !c.uf ? animal.localizacao : null),

    // Registros e certificações
    campo("ORG", c.org),
    campo("CSG", c.csg),
    campo("CEIP", c.ceip),
    campo("Registrado na ABCZ", animal.registrado_abcz ? "Sim" : null),
    campo("Certificado", c.certificado_erural === true ? "Sim" : c.certificado_erural === false ? "Não" : null),

    // Comercial
    campo("Preço inicial", c.preco_inicial != null ? `R$ ${c.preco_inicial.toLocaleString("pt-BR")}` : null),
    campo("% comercializado", c.percentual_comercializado != null ? `${c.percentual_comercializado}%` : null),

    // Reprodução
    campo("Status reprodutivo", p.status ?? animal.estado_reprodutivo),
    campo("Data da inseminação", fmtData(p.data_inseminacao)),
    campo("Formato do acasalamento", p.formato_acasalamento),
    campo("Oócitos", p.oocitos),
    campo("Embriões", p.embrioes),

    // Cria ao pé (complementos que não cabem nas pílulas)
    campo("MGTe da cria", cria.mgte),
    campo("Top MGTe da cria", cria.top_mgte),

    // Observações e links
    campo("Observações", animal.ficha?.extras?.observacoes),
    // vídeo e pré-lance já têm botão próprio acima — não repetimos aqui
    campo("Link do lote", animal.link_erural),
    campo("UTM do vídeo", c.utm_video),
    campo("UTM do pré-lance", c.utm_pl),
    campo("Drive", c.drive),
  ].filter(Boolean) as Campo[];
}

function ehLink(v: string) {
  return /^https?:\/\//i.test(v);
}

function FichaCompleta({ campos }: { campos: Campo[] }) {
  if (campos.length === 0) return null;
  return (
    <section>
      <h2
        className="text-center text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] uppercase mb-4"
        style={{ color: VC.cinzaTexto }}
      >
        Ficha completa
      </h2>
      <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0 max-w-4xl mx-auto">
        {campos.map((c) => (
          <div
            key={c.label}
            className="flex items-baseline justify-between gap-3 py-2 text-[13px] sm:text-sm"
            style={{ borderBottom: `1px solid ${VC.linha}` }}
          >
            <dt className="shrink-0 font-medium" style={{ color: VC.cinzaTexto }}>{c.label}</dt>
            <dd className="min-w-0 text-right font-semibold" style={{ color: VC.preto }}>
              {ehLink(c.valor) ? (
                <a
                  href={c.valor}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:opacity-70 break-all"
                  style={{ color: VC.vermelho }}
                >
                  abrir link
                </a>
              ) : (
                <span className="break-words">{c.valor}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Componente principal                                                */
/* ------------------------------------------------------------------ */

export function FichaCatalogo({
  animal,
  onProposta,
  textoProposta = "Faça sua proposta",
  mostrarFichaCompleta = false,
}: {
  animal: Animal;
  onProposta?: () => void;
  textoProposta?: string;
  /** Liga a lista escrita com todos os campos importados (admin › Catálogo › Layout). */
  mostrarFichaCompleta?: boolean;
}) {
  const genetica = animal.genetica ?? {};
  const blocos = (["pmgz", "ancp", "geneplus"] as GeneticaFonte[])
    .map((fonte) => ({ fonte, bloco: genetica[fonte] }))
    .filter((b): b is { fonte: GeneticaFonte; bloco: GeneticaBloco } => blocoTemDados(b.bloco));

  const ehMacho = sexoDoAnimal(animal) === "macho";
  const rodape = ehMacho
    ? { titulo: "Informações do reprodutor", itens: itensFisicos(animal) }
    : { titulo: "Informações do ventre", itens: itensVentre(animal) };
  const cria = itensCria(animal);

  return (
    <article className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-black/5">
      <div className="h-2" style={{ background: VC.preto }} />
      <div className="h-1" style={{ background: VC.vermelho }} />

      <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <header className="space-y-3 sm:space-y-4">
          <CabecalhoLote animal={animal} />
          <h1
            className="text-center font-sans text-3xl sm:text-5xl font-extrabold uppercase tracking-tight leading-none break-words"
            style={{ color: VC.preto }}
          >
            {animal.nome}
          </h1>
          <div className="flex justify-center">
            <PillIdentificacao animal={animal} />
          </div>
        </header>

        <MidiaLote animal={animal} onProposta={onProposta} textoProposta={textoProposta} />

        <PedigreeCatalogo animal={animal} />

        {blocos.length > 0 && (
          <div
            className={
              blocos.length === 1
                ? "grid gap-8"
                : blocos.length === 2
                  ? "grid gap-8 sm:gap-5 sm:grid-cols-2"
                  : "grid gap-8 sm:gap-5 sm:grid-cols-2 md:grid-cols-3"
            }
          >
            {blocos.map(({ fonte, bloco }) => (
              <BlocoGenetico key={fonte} fonte={fonte} bloco={bloco} />
            ))}
          </div>
        )}

        <SecaoRodape titulo={rodape.titulo} itens={rodape.itens} />
        <SecaoRodape titulo="Cria ao pé" itens={cria} />

        {mostrarFichaCompleta && <FichaCompleta campos={camposImportados(animal)} />}

        {animal.descricao_longa && (
          <p
            className="max-w-3xl mx-auto text-center text-sm leading-relaxed whitespace-pre-line"
            style={{ color: VC.cinzaTexto }}
          >
            {animal.descricao_longa}
          </p>
        )}
      </div>
    </article>
  );
}
