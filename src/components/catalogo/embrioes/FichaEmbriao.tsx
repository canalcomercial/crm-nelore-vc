import { useState, type ReactNode } from "react";
import { Dna, ExternalLink, FileSearch, Gavel, Instagram, Play, ShieldCheck, Gift } from "lucide-react";
import { youtubeEmbedUrl, type Animal } from "@/hooks/useCatalogo";
import type { EmbriaoAcasalamento, EmbriaoDados, EmbriaoPessoa, EmbriaoProjecao } from "@/types/embrioes";
import { dadosEmbriao, ehSexado, textoGarantia } from "@/lib/embrioes";
import { FONTE_COR, VC, topDestaque } from "./paleta";

/**
 * Ficha do PACOTE DE EMBRIÕES no mesmo padrão visual da ficha de fêmeas e
 * touros (branco, preto e vermelho Nelore VC), reunindo tudo o que os
 * catálogos de embriões trazem: quantidade × garantia, sêmen, criatório,
 * doadora × touro com os quatro avós, projeções ANCP (MGTe em destaque e
 * tabela DEP/TOP%) e PMGZ, pacotes com vários acasalamentos, regras da
 * garantia, bônus e links.
 */
export function FichaEmbriao({ animal, onProposta }: { animal: Animal; onProposta?: () => void }) {
  const d = dadosEmbriao(animal);
  const multiplos = d.acasalamentos.length > 1;

  return (
    <article className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-black/5">
      <div className="h-2" style={{ background: VC.preto }} />
      <div className="h-1" style={{ background: VC.vermelho }} />

      <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-7 sm:space-y-9">
        <Cabecalho animal={animal} dados={d} />
        <Midia animal={animal} dados={d} onProposta={onProposta} />

        {d.acasalamentos.length === 0 && (
          <p className="text-center text-sm" style={{ color: VC.cinzaTexto }}>Os acasalamentos deste pacote serão publicados em breve.</p>
        )}

        {d.acasalamentos.map((a, i) => (
          <section key={i} aria-label={`Acasalamento ${i + 1}`} className={multiplos ? "rounded-2xl p-3 sm:p-5 space-y-6" : "space-y-7 sm:space-y-9"} style={multiplos ? { border: `1px solid ${VC.linha}` } : undefined}>
            {multiplos && <TituloAcasalamento indice={i + 1} total={d.acasalamentos.length} quantidade={a.quantidade} />}
            <Pedigree a={a} semen={d.semen} />
            <Projecoes a={a} />
          </section>
        ))}

        <InformacoesPacote dados={d} animal={animal} />
        <GarantiaECondicoes dados={d} />

        {animal.descricao_longa && animal.descricao_longa !== d.observacoes && (
          <p className="max-w-3xl mx-auto text-center text-sm leading-relaxed whitespace-pre-line" style={{ color: VC.cinzaTexto }}>
            {animal.descricao_longa}
          </p>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */

function Cabecalho({ animal, dados }: { animal: Animal; dados: EmbriaoDados }) {
  const garantia = textoGarantia(dados);
  const origem = [dados.criatorio, dados.localizacao ?? animal.localizacao].filter(Boolean).join(" · ");
  return (
    <header className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <span className="hidden sm:block h-px flex-1 max-w-[120px]" style={{ background: VC.linha }} />
        <span className="text-[11px] sm:text-sm font-bold tracking-[0.28em]" style={{ color: VC.preto }}>LOTE</span>
        {animal.lote && (
          <span
            className={`grid place-items-center h-11 sm:h-14 px-2 rounded-full font-extrabold ${animal.lote.length > 2 ? "min-w-[2.75rem] sm:min-w-[3.5rem] text-lg sm:text-2xl" : "w-11 sm:w-14 text-xl sm:text-3xl"}`}
            style={{ border: `2px solid ${VC.vermelho}`, color: VC.preto }}
            data-testid="embriao-lote"
          >
            {animal.lote}
          </span>
        )}
        <span className="text-[9px] sm:text-[11px] font-semibold tracking-[0.28em]" style={{ color: VC.cinzaTexto }}>
          PACOTE DE <span className="font-display italic normal-case tracking-normal text-sm sm:text-lg" style={{ color: VC.vermelho }}>Embriões</span>
        </span>
        <span className="hidden sm:block h-px flex-1 max-w-[120px]" style={{ background: VC.linha }} />
      </div>

      {origem && (
        <p className="text-center text-[10px] sm:text-xs font-semibold tracking-[0.24em] uppercase" style={{ color: VC.cinzaTexto }}>{origem}</p>
      )}

      <h1 className="text-center font-sans text-3xl sm:text-5xl font-extrabold uppercase tracking-tight leading-none break-words" style={{ color: VC.preto }}>
        {animal.nome}
      </h1>

      {(dados.quantidade != null || garantia || dados.semen) && (
        <div className="flex justify-center">
          <div className="inline-flex flex-wrap justify-center items-stretch rounded-2xl sm:rounded-full overflow-hidden text-xs sm:text-sm" style={{ border: `1.5px solid ${VC.preto}` }}>
            {dados.quantidade != null && (
              <span className="px-3 sm:px-5 py-1.5 font-bold text-white flex items-center gap-2" style={{ background: VC.preto }} data-testid="embriao-qtd">
                <Dna className="h-3.5 w-3.5" /> {dados.quantidade} {dados.quantidade === 1 ? "EMBRIÃO" : "EMBRIÕES"} {dados.tipo}
              </span>
            )}
            {garantia && (
              <span className="px-3 sm:px-5 py-1.5 font-semibold bg-white flex items-center gap-1.5" style={{ color: VC.preto }}>
                GARANTIA <b className="text-base sm:text-lg leading-none" style={{ color: VC.vermelho }}>{garantia.numero}</b> {garantia.rotulo.toUpperCase()}
              </span>
            )}
            {dados.semen && (
              <span
                className="px-3 sm:px-5 py-1.5 font-semibold flex items-center"
                style={ehSexado(dados.semen) ? { background: VC.vermelhoSuave, color: VC.vermelho, borderLeft: `1.5px solid ${VC.preto}` } : { background: VC.caixa, color: VC.pretoSuave, borderLeft: `1.5px solid ${VC.preto}` }}
              >
                SÊMEN {dados.semen.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */

function Midia({ animal, dados, onProposta }: { animal: Animal; dados: EmbriaoDados; onProposta?: () => void }) {
  const [tocando, setTocando] = useState(false);
  const linkVideo = dados.link_video ?? animal.link_video ?? null;
  const embed = youtubeEmbedUrl(linkVideo);
  const foto = animal.foto_url ?? dados.fotos?.[0] ?? null;
  const a = dados.acasalamentos[0];
  const mgte = a?.ancp.find((p) => p.sigla === "MGTe");

  return (
    <div className="space-y-3 sm:space-y-4">
      {(foto || embed) ? (
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-900 aspect-[4/3] sm:aspect-[16/9]" style={{ border: `3px solid ${VC.preto}` }}>
          {tocando && embed ? (
            <iframe src={`${embed}${embed.includes("?") ? "&" : "?"}autoplay=1`} title={animal.nome} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media; picture-in-picture" />
          ) : foto ? (
            <img src={foto} alt={`Doadora do lote ${animal.lote ?? ""}`} className="w-full h-full object-cover" />
          ) : (
            <iframe src={embed!} title={animal.nome} className="w-full h-full" allowFullScreen />
          )}
        </div>
      ) : (
        /* Sem foto: capa do pacote com o acasalamento em destaque. */
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl px-5 py-7 sm:px-10 sm:py-10 text-white" style={{ background: `radial-gradient(900px 300px at 50% -40%, ${VC.pretoSuave}, ${VC.preto})`, border: `3px solid ${VC.preto}` }} data-testid="capa-embriao">
          <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: VC.vermelho }} />
          <DnaFundo />
          {a ? (
            <div className="relative grid gap-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <CapaLado rotulo={a.doadoras.length > 1 ? "Doadoras" : "Doadora"} pessoas={a.doadoras} vazio="—" />
              <div className="text-center text-3xl sm:text-5xl font-light" style={{ color: VC.vermelho }} aria-hidden>×</div>
              <CapaLado rotulo={a.touros.length > 1 ? "Touros" : "Acasalamento"} pessoas={a.touros} vazio={a.livre_acasalamento ? "Livre acasalamento" : "—"} />
            </div>
          ) : (
            <div className="relative text-center text-sm text-white/70">Pacote de embriões</div>
          )}
          {(mgte?.valor || a?.pmgz.iabcz) && (
            <div className="relative mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
              {mgte?.valor && <CapaIndice rotulo="MGTe" valor={mgte.valor} extra={mgte.top ? `TOP ${mgte.top}%` : undefined} />}
              {a?.pmgz.iabcz && <CapaIndice rotulo="iABCZ" valor={a.pmgz.iabcz} extra={a.pmgz.p ? `P ${a.pmgz.p}%` : a.pmgz.deca ? `DECA ${a.pmgz.deca}` : undefined} />}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
        {embed && !tocando && (
          <button type="button" onClick={() => setTocando(true)} className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 sm:py-2.5 text-sm font-semibold" style={{ border: `1.5px solid ${VC.preto}`, color: VC.preto }}>
            <Play className="h-4 w-4 fill-current" /> Assistir ao vídeo
          </button>
        )}
        {embed && tocando && foto && (
          <button type="button" onClick={() => setTocando(false)} className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 sm:py-2.5 text-sm font-semibold" style={{ border: `1.5px solid ${VC.linha}`, color: VC.cinzaTexto }}>
            Voltar para a foto
          </button>
        )}
        {linkVideo && !embed && (
          <a href={linkVideo} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 sm:py-2.5 text-sm font-semibold" style={{ border: `1.5px solid ${VC.preto}`, color: VC.preto }}>
            <Play className="h-4 w-4 fill-current" /> Assistir ao vídeo
          </a>
        )}
        {dados.link_video_doadora && (
          <a href={dados.link_video_doadora} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 sm:py-2.5 text-sm font-semibold" style={{ border: `1.5px solid ${VC.linha}`, color: VC.pretoSuave }}>
            <Play className="h-4 w-4" /> Vídeo da doadora
          </a>
        )}
        {onProposta && (
          <button type="button" onClick={onProposta} className="sm:ml-auto inline-flex items-center justify-center gap-2 rounded-full px-6 sm:px-8 py-3 sm:py-2.5 text-xs sm:text-sm font-semibold tracking-[0.1em] uppercase text-white shadow-sm transition-transform hover:scale-[1.02]" style={{ background: VC.vermelho }}>
            <Gavel className="h-4 w-4" /> Faça sua proposta
          </button>
        )}
      </div>
    </div>
  );
}

function CapaLado({ rotulo, pessoas, vazio }: { rotulo: string; pessoas: EmbriaoPessoa[]; vazio: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] sm:text-[11px] font-semibold tracking-[0.28em] uppercase text-white/60">{rotulo}</div>
      {pessoas.length ? pessoas.map((p, i) => (
        <div key={i} className="mt-1.5">
          <div className="text-lg sm:text-2xl font-extrabold uppercase leading-tight">{p.nome}</div>
          {p.registro && <div className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] text-white/60">{p.registro}</div>}
        </div>
      )) : <div className="mt-1.5 text-lg sm:text-2xl font-extrabold uppercase">{vazio}</div>}
    </div>
  );
}

function CapaIndice({ rotulo, valor, extra }: { rotulo: string; valor: string; extra?: string }) {
  return (
    <span className="inline-flex items-baseline gap-2 rounded-full bg-white/10 px-4 py-1.5 ring-1 ring-white/15">
      <span className="text-[10px] font-bold tracking-[0.2em] text-white/70">{rotulo}</span>
      <span className="text-lg font-extrabold">{valor}</span>
      {extra && <span className="text-[11px] font-semibold" style={{ color: "#FF8A85" }}>{extra}</span>}
    </span>
  );
}

function DnaFundo() {
  const pontos = Array.from({ length: 26 }, (_, i) => i);
  return (
    <svg className="absolute right-3 top-0 h-full w-24 opacity-[0.12] sm:right-8" viewBox="0 0 40 260" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {pontos.map((i) => {
        const y = i * 10 + 5;
        const x = Math.sin(i / 2.2) * 14;
        return (
          <g key={i}>
            <line x1={20 + x} y1={y} x2={20 - x} y2={y} stroke="#fff" strokeWidth="1.2" />
            <circle cx={20 + x} cy={y} r="2.2" fill="#fff" />
            <circle cx={20 - x} cy={y} r="2.2" fill={VC.vermelho} />
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */

function TituloAcasalamento({ indice, total, quantidade }: { indice: number; total: number; quantidade?: number | null }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="h-px flex-1 max-w-[100px]" style={{ background: VC.linha }} />
      <span className="text-[10px] sm:text-xs font-bold tracking-[0.24em] uppercase" style={{ color: VC.preto }}>
        Acasalamento {indice} <span style={{ color: VC.cinzaTexto }}>de {total}</span>
      </span>
      {quantidade != null && (
        <span className="rounded-full px-2.5 py-0.5 text-[10px] sm:text-xs font-bold" style={{ background: VC.vermelhoSuave, color: VC.vermelho }}>
          {quantidade} {quantidade === 1 ? "embrião" : "embriões"}
        </span>
      )}
      <span className="h-px flex-1 max-w-[100px]" style={{ background: VC.linha }} />
    </div>
  );
}

function Avo({ papel, pessoas }: { papel: string; pessoas?: EmbriaoPessoa[] }) {
  return (
    <div className="text-center leading-tight px-0.5 min-h-[1.5rem]">
      {pessoas?.length ? (
        <>
          <div className="text-[9px] sm:text-[10px] font-semibold tracking-[0.18em] uppercase" style={{ color: VC.cinzaTexto }}>{papel}</div>
          <div className="text-[10px] sm:text-xs font-bold tracking-wide uppercase" style={{ color: VC.pretoSuave }}>
            {pessoas.map((p) => (p.registro ? `${p.nome} (${p.registro})` : p.nome)).join(" · ")}
          </div>
        </>
      ) : null}
    </div>
  );
}

function CaixaPais({ pessoas, vazio, testid }: { pessoas: EmbriaoPessoa[]; vazio: ReactNode; testid?: string }) {
  return (
    <div className="flex-1 min-w-0 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-center" style={{ background: VC.caixa, color: VC.preto }} data-testid={testid}>
      {pessoas.length ? pessoas.map((p, i) => (
        <div key={i} className={i > 0 ? "mt-1 pt-1 border-t border-black/5" : undefined}>
          <div className="text-[11px] sm:text-sm font-semibold uppercase break-words">{p.nome}</div>
          {p.registro && <div className="text-[9px] sm:text-[11px] font-medium tracking-wide" style={{ color: VC.cinzaTexto }}>{p.registro}</div>}
        </div>
      )) : <div className="text-[11px] sm:text-sm font-semibold uppercase">{vazio}</div>}
    </div>
  );
}

function Pedigree({ a, semen }: { a: EmbriaoAcasalamento; semen?: string }) {
  const temAcima = !!(a.avos_paternos?.length || a.avos_maternos.length);
  const temAbaixo = !!(a.avos_paternas?.length || a.avos_maternas?.length);
  const bracket = "h-2.5 sm:h-3.5";
  const borda = `1.5px solid ${VC.linha}`;
  const livre = a.livre_acasalamento && !a.touros.length;

  return (
    <section aria-label="Acasalamento" className="space-y-2">
      <h2 className="text-center text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: VC.cinzaTexto }}>
        Acasalamento do embrião
      </h2>
      <div className="grid grid-cols-2 gap-x-3 sm:gap-x-8">
        {temAcima && (
          <>
            <Avo papel="Avô paterno" pessoas={a.avos_paternos} />
            <Avo papel="Avô materno" pessoas={a.avos_maternos} />
            <div className={`${bracket} rounded-tl-xl`} style={{ borderTop: borda, borderLeft: borda }} />
            <div className={`${bracket} rounded-tr-xl`} style={{ borderTop: borda, borderRight: borda }} />
          </>
        )}

        <div className="col-span-2 my-1.5 sm:my-2 flex items-center gap-1.5 sm:gap-3">
          <span className="text-sm sm:text-base leading-none" style={{ color: VC.pretoSuave }} aria-hidden>♂</span>
          <span className="hidden sm:inline text-xs font-bold tracking-wide whitespace-nowrap" style={{ color: VC.preto }}>{a.touros.length > 1 ? "TOUROS" : "TOURO"}</span>
          <CaixaPais pessoas={a.touros} vazio={livre ? "Livre acasalamento" : "—"} testid="caixa-touro" />
          <span className="text-[10px] sm:text-sm font-semibold shrink-0" style={{ color: VC.cinzaTexto }}>X</span>
          <CaixaPais pessoas={a.doadoras} vazio="—" testid="caixa-doadora" />
          <span className="hidden sm:inline text-xs font-bold tracking-wide whitespace-nowrap" style={{ color: VC.preto }}>{a.doadoras.length > 1 ? "DOADORAS" : "DOADORA"}</span>
          <span className="text-sm sm:text-base leading-none" style={{ color: VC.vermelho }} aria-hidden>♀</span>
        </div>

        {temAbaixo && (
          <>
            <div className={`${bracket} rounded-bl-xl`} style={{ borderBottom: borda, borderLeft: borda }} />
            <div className={`${bracket} rounded-br-xl`} style={{ borderBottom: borda, borderRight: borda }} />
            <Avo papel="Avó paterna" pessoas={a.avos_paternas} />
            <Avo papel="Avó materna" pessoas={a.avos_maternas} />
          </>
        )}
      </div>
      {(a.observacao || ehSexado(semen)) && (
        <p className="text-center text-[11px] sm:text-xs" style={{ color: VC.cinzaTexto }}>
          {a.observacao}
          {a.observacao && ehSexado(semen) ? " · " : ""}
          {ehSexado(semen) && <b style={{ color: VC.vermelho }}>Produzido com sêmen {semen!.toLowerCase()}</b>}
        </p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

const HEX = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

function HexBadge({ nome, cor }: { nome: string; cor: string }) {
  return (
    <div className="h-12 w-[112px] grid place-items-center" style={{ background: cor, clipPath: HEX }}>
      <div className="h-[42px] w-[103px] grid place-items-center bg-white" style={{ clipPath: HEX }}>
        <span className="text-[11px] font-extrabold tracking-tight leading-none text-center" style={{ color: cor }}>{nome}</span>
      </div>
    </div>
  );
}

function Resumo({ itens }: { itens: { rotulo: string; valor?: string; destaque?: boolean }[] }) {
  const vis = itens.filter((i) => i.valor);
  return (
    <div className="pt-8 pb-4 px-3 grid gap-1 text-center" style={{ gridTemplateColumns: `repeat(${vis.length}, minmax(0, 1fr))` }}>
      {vis.map((r) => (
        <div key={r.rotulo}>
          <div className="text-[11px] sm:text-xs font-bold" style={{ color: VC.pretoSuave }}>{r.rotulo}</div>
          <div className="text-xl sm:text-2xl font-extrabold leading-tight" style={{ color: r.destaque ? VC.vermelho : VC.preto }}>{r.valor}</div>
        </div>
      ))}
    </div>
  );
}

function Projecoes({ a }: { a: EmbriaoAcasalamento }) {
  const mgte = a.ancp.find((p) => p.sigla === "MGTe");
  const linhas = a.ancp.filter((p) => p.sigla !== "MGTe");
  const temTop = linhas.some((l) => l.top);
  const temPmgz = !!(a.pmgz.iabcz || a.pmgz.deca || a.pmgz.p);
  const temAncp = a.ancp.length > 0;
  if (!temAncp && !temPmgz) return null;

  return (
    <section aria-label="Projeções do embrião" className="space-y-3">
      <h2 className="text-center text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: VC.cinzaTexto }}>
        Projeções do embrião
      </h2>
      <div className={temAncp && temPmgz ? "grid gap-8 sm:gap-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start" : "grid gap-8 max-w-xl mx-auto w-full"}>
        {temAncp && (
          <div className="relative pt-6" data-testid="bloco-ancp">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10"><HexBadge nome="ANCP" cor={FONTE_COR.ancp} /></div>
            <div className="rounded-2xl overflow-hidden" style={{ background: VC.cardBg }}>
              {mgte ? (
                <Resumo itens={[{ rotulo: "MGTe", valor: mgte.valor }, { rotulo: "TOP%", valor: mgte.top, destaque: topDestaque(mgte.top) }]} />
              ) : <div className="pt-8" />}
              {linhas.length > 0 && (
                <>
                  <div className="sm:grid sm:grid-cols-2" style={{ background: VC.preto, borderBottom: `2px solid ${FONTE_COR.ancp}` }}>
                    {[0, 1].map((k) => (
                      <div key={k} className={`${k === 1 ? "hidden sm:grid" : "grid"} ${temTop ? "grid-cols-3" : "grid-cols-2"} text-white text-[10px] sm:text-xs font-bold tracking-wide`}>
                        <span className="py-1.5 px-2 text-center">CARACT.</span>
                        <span className="py-1.5 px-2 text-center">DEP</span>
                        {temTop && <span className="py-1.5 px-2 text-center">TOP%</span>}
                      </div>
                    ))}
                  </div>
                  <div className="sm:grid sm:grid-cols-2">
                    {linhas.map((l, i) => <LinhaProjecao key={l.sigla} l={l} i={i} temTop={temTop} />)}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {temPmgz && (
          <div className="relative pt-6" data-testid="bloco-pmgz">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10"><HexBadge nome="PMGZ" cor={FONTE_COR.pmgz} /></div>
            <div className="rounded-2xl overflow-hidden" style={{ background: VC.cardBg }}>
              <Resumo itens={[{ rotulo: "iABCZ", valor: a.pmgz.iabcz }, { rotulo: "DECA", valor: a.pmgz.deca }, { rotulo: "P%", valor: a.pmgz.p, destaque: topDestaque(a.pmgz.p) }]} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function LinhaProjecao({ l, i, temTop }: { l: EmbriaoProjecao; i: number; temTop: boolean }) {
  const destaque = topDestaque(l.top);
  return (
    <div
      className={`grid ${temTop ? "grid-cols-3" : "grid-cols-2"} text-[11px] sm:text-xs sm:odd:border-r sm:odd:border-black/5`}
      style={{ background: i % 2 === 0 ? "#FFFFFF" : VC.linhaZebra, color: VC.preto }}
      data-testid={`proj-${l.sigla}`}
    >
      <span className="py-1.5 px-2 text-center font-bold">{l.sigla}</span>
      <span className="py-1.5 px-2 text-center">{l.valor || "—"}</span>
      {temTop && (
        <span className="py-1.5 px-2 text-center">
          {l.top ? (
            <span className="inline-block min-w-[2.5rem] rounded px-1.5 font-semibold" style={destaque ? { background: VC.vermelhoSuave, color: VC.vermelho } : undefined}>{l.top}</span>
          ) : "—"}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function InformacoesPacote({ dados, animal }: { dados: EmbriaoDados; animal: Animal }) {
  const garantia = textoGarantia(dados);
  const itens = [
    dados.quantidade != null ? { label: "EMBRIÕES", valor: String(dados.quantidade) } : null,
    dados.tipo ? { label: "TIPO", valor: dados.tipo } : null,
    garantia ? { label: "GARANTIA", valor: garantia.numero.endsWith("%") ? `${garantia.numero} prenhez` : `${garantia.numero} ${garantia.rotulo}` } : null,
    dados.acasalamentos.length > 1 ? { label: "ACASALAMENTOS", valor: String(dados.acasalamentos.length) } : null,
    dados.semen ? { label: "SÊMEN", valor: dados.semen, alt: true } : null,
    (dados.raca ?? animal.raca) ? { label: "RAÇA", valor: (dados.raca ?? animal.raca)!, alt: true } : null,
    dados.criatorio ? { label: "CRIATÓRIO", valor: dados.criatorio, alt: true } : null,
  ].filter(Boolean) as { label: string; valor: string; alt?: boolean }[];
  if (!itens.length) return null;
  return (
    <section>
      <h2 className="text-center text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] uppercase mb-3" style={{ color: VC.cinzaTexto }}>
        Informações do pacote
      </h2>
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2 sm:gap-3 max-w-4xl mx-auto">
        {itens.map((it) => (
          <div key={it.label} className="min-w-0 sm:w-40">
            <div className="rounded-full px-3 py-1 text-center text-[10px] sm:text-xs font-bold tracking-wide truncate" style={{ background: it.alt ? VC.caixa : VC.preto, color: it.alt ? VC.pretoSuave : "#FFFFFF" }}>{it.label}</div>
            <div className="mt-1.5 rounded-full bg-white px-3 py-1.5 text-center text-[11px] sm:text-sm font-semibold truncate" style={{ border: `1px solid ${VC.linha}`, color: VC.preto }} title={it.valor}>{it.valor}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GarantiaECondicoes({ dados }: { dados: EmbriaoDados }) {
  const blocos = [
    dados.regras_garantia ? { icone: <ShieldCheck className="h-4 w-4" />, titulo: "Garantia de prenhez", texto: dados.regras_garantia } : null,
    dados.observacoes ? { icone: <Gift className="h-4 w-4" />, titulo: "Bônus e observações", texto: dados.observacoes } : null,
  ].filter(Boolean) as { icone: ReactNode; titulo: string; texto: string }[];
  const links = [
    dados.link_acasalamentos ? { href: dados.link_acasalamentos, rotulo: "Ver todos os acasalamentos", icone: <FileSearch className="h-4 w-4" /> } : null,
    dados.instagram ? { href: `https://instagram.com/${dados.instagram.replace(/^@/, "")}`, rotulo: dados.instagram.replace(/^@?/, "@"), icone: <Instagram className="h-4 w-4" /> } : null,
  ].filter(Boolean) as { href: string; rotulo: string; icone: ReactNode }[];
  if (!blocos.length && !links.length) return null;
  return (
    <section className="space-y-3">
      {blocos.length > 0 && (
        <div className={`grid gap-3 ${blocos.length > 1 ? "sm:grid-cols-2" : "max-w-3xl mx-auto"}`}>
          {blocos.map((b) => (
            <div key={b.titulo} className="rounded-2xl p-4 sm:p-5" style={{ background: VC.cardBg }}>
              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase" style={{ color: VC.preto }}>
                <span style={{ color: VC.vermelho }}>{b.icone}</span> {b.titulo}
              </div>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line" style={{ color: VC.pretoSuave }} data-testid={b.titulo.startsWith("Garantia") ? "embriao-garantia" : "embriao-obs"}>{b.texto}</p>
            </div>
          ))}
        </div>
      )}
      {links.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold" style={{ border: `1.5px solid ${VC.linha}`, color: VC.preto }}>
              {l.icone} {l.rotulo} <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
