import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAGINA_COMERCIAL_URL } from "@/lib/public-urls";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, MessageCircle, Trash2, Plus, ArrowUpRight } from "lucide-react";
import {
  usePaginaConfig, useSalvarPaginaConfig, useSalvarDraft, usePublicarDraft, useDescartarDraft,
  useLeadsPagina, useLeadsPaginaRealtime,
  type PaginaConteudo, type PaginaTema,
} from "@/hooks/usePaginaComercial";
import { useFunis } from "@/hooks/useCrm";
import { useAnimais, useSalvarAnimal } from "@/hooks/useCatalogo";
import { HeroMidiaEditor } from "@/components/pagina-comercial/admin/HeroMidiaEditor";
import { TemaEditor } from "@/components/pagina-comercial/admin/TemaEditor";
import { MediaLibrary } from "@/components/pagina-comercial/admin/MediaLibrary";
import { PreviewFrame } from "@/components/pagina-comercial/admin/PreviewFrame";
import { PublicarBar } from "@/components/pagina-comercial/admin/PublicarBar";
import { MetricasCard } from "@/components/pagina-comercial/admin/MetricasCard";
import { SecoesEditor } from "@/components/pagina-comercial/admin/SecoesEditor";
import { VideosEditor } from "@/components/pagina-comercial/admin/VideosEditor";

type Rascunho = {
  conteudo: PaginaConteudo;
  tema: PaginaTema;
  funil_id: string | null;
  etapa_inicial: string | null;
  ativo: boolean;
};

export default function AdminPaginaComercial() {
  useLeadsPaginaRealtime();
  const { data: config, isLoading } = usePaginaConfig();
  const salvarDraft = useSalvarDraft();
  const salvarConfig = useSalvarPaginaConfig();
  const publicarDraft = usePublicarDraft();
  const descartarDraft = useDescartarDraft();
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (config && !rascunho) {
      const cDraft = (config.conteudo_draft as PaginaConteudo | null) ?? config.conteudo;
      const tDraft = (config.tema_draft as PaginaTema | null) ?? config.tema;
      setRascunho({
        conteudo: cDraft, tema: tDraft,
        funil_id: config.funil_id, etapa_inicial: config.etapa_inicial,
        ativo: config.ativo,
      });
    }
  }, [config, rascunho]);

  if (isLoading || !config || !rascunho) {
    return <div className="p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  const publishedSnapshot = { conteudo: config.conteudo, tema: config.tema };
  const draftSnapshot = { conteudo: rascunho.conteudo, tema: rascunho.tema };
  const dirty = JSON.stringify(draftSnapshot) !== JSON.stringify(publishedSnapshot);

  const update = (p: Partial<Rascunho>) => {
    setRascunho((r) => (r ? { ...r, ...p } : r));
    // funil_id / etapa_inicial / ativo salvam imediatamente (não fazem parte do fluxo de publicação)
    const meta: Partial<{ funil_id: string | null; etapa_inicial: string | null; ativo: boolean }> = {};
    if ("funil_id" in p) meta.funil_id = p.funil_id ?? null;
    if ("etapa_inicial" in p) meta.etapa_inicial = p.etapa_inicial ?? null;
    if ("ativo" in p) meta.ativo = p.ativo!;
    if (Object.keys(meta).length) {
      salvarConfig.mutate({ id: config.id, ...meta });
    } else {
      scheduleAutosave();
    }
  };
  const updateConteudo = <K extends keyof PaginaConteudo>(k: K, v: PaginaConteudo[K]) =>
    setRascunho((r) => {
      if (!r) return r;
      scheduleAutosave();
      return { ...r, conteudo: { ...r.conteudo, [k]: v } };
    });

  function scheduleAutosave() {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
      setRascunho((cur) => {
        if (!cur) return cur;
        salvarDraft.mutate({ id: config.id, conteudo_draft: cur.conteudo, tema_draft: cur.tema });
        return cur;
      });
    }, 3000);
  }

  function salvarAgora() {
    salvarDraft.mutate({ id: config.id, conteudo_draft: rascunho!.conteudo, tema_draft: rascunho!.tema });
  }
  function publicarAgora() {
    publicarDraft.mutate({ id: config.id, conteudo_draft: rascunho!.conteudo, tema_draft: rascunho!.tema });
  }
  function descartarAgora() {
    if (!confirm("Descartar rascunho e voltar à versão publicada?")) return;
    descartarDraft.mutate({ id: config.id, conteudo: config.conteudo, tema: config.tema });
    setRascunho({
      conteudo: config.conteudo, tema: config.tema,
      funil_id: config.funil_id, etapa_inicial: config.etapa_inicial, ativo: config.ativo,
    });
  }

  return (
    <div className="h-screen flex flex-col">
      <PublicarBar
        dirty={dirty}
        publicado={!dirty}
        saving={salvarDraft.isPending}
        publishing={publicarDraft.isPending}
        onSalvar={salvarAgora}
        onPublicar={publicarAgora}
        onDescartar={descartarAgora}
        publicadoEm={config.publicado_em}
      />
      <div className="flex-1 grid lg:grid-cols-[minmax(420px,42%)_1fr] overflow-hidden">
        <div className="overflow-y-auto p-5 border-r">
          <div className="mb-4">
            <MetricasCard config={config} />
          </div>
          <Tabs defaultValue="conteudo">
        <TabsList>
          <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
          <TabsTrigger value="secoes">Seções e botões</TabsTrigger>
          <TabsTrigger value="videos">Vídeos</TabsTrigger>
          <TabsTrigger value="identidade">Identidade</TabsTrigger>
          <TabsTrigger value="midia">Mídia</TabsTrigger>
          <TabsTrigger value="lotes">Lotes em destaque</TabsTrigger>
          <TabsTrigger value="captura">Captura de leads</TabsTrigger>
          <TabsTrigger value="leads">Leads recebidos</TabsTrigger>
        </TabsList>

        <TabsContent value="conteudo" className="space-y-6 mt-6">
          <Section titulo="Hero (topo da página)">
            <Field label="Título"><Input value={rascunho.conteudo.hero.titulo} onChange={(e) => updateConteudo("hero", { ...rascunho.conteudo.hero, titulo: e.target.value })} /></Field>
            <Field label="Subtítulo"><Textarea rows={2} value={rascunho.conteudo.hero.subtitulo} onChange={(e) => updateConteudo("hero", { ...rascunho.conteudo.hero, subtitulo: e.target.value })} /></Field>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="CTA primário"><Input value={rascunho.conteudo.hero.cta_primario} onChange={(e) => updateConteudo("hero", { ...rascunho.conteudo.hero, cta_primario: e.target.value })} /></Field>
              <Field label="CTA secundário"><Input value={rascunho.conteudo.hero.cta_secundario} onChange={(e) => updateConteudo("hero", { ...rascunho.conteudo.hero, cta_secundario: e.target.value })} /></Field>
            </div>
            <HeroMidiaEditor
              value={rascunho.conteudo.hero.midia}
              onChange={(m) => updateConteudo("hero", { ...rascunho.conteudo.hero, midia: m })}
            />
          </Section>

          <Section titulo="Sobre">
            <Field label="Título"><Input value={rascunho.conteudo.sobre.titulo} onChange={(e) => updateConteudo("sobre", { ...rascunho.conteudo.sobre, titulo: e.target.value })} /></Field>
            <Field label="Texto institucional"><Textarea rows={5} value={rascunho.conteudo.sobre.texto} onChange={(e) => updateConteudo("sobre", { ...rascunho.conteudo.sobre, texto: e.target.value })} /></Field>
          </Section>

          <Section titulo="Pilares de valor" onAdd={() => updateConteudo("pilares", [...rascunho.conteudo.pilares, { titulo: "Novo pilar", descricao: "", icone: "Award" }])}>
            {rascunho.conteudo.pilares.map((p, i) => (
              <div key={i} className="grid md:grid-cols-[1fr_2fr_140px_40px] gap-2 items-start">
                <Input value={p.titulo} onChange={(e) => {
                  const arr = [...rascunho.conteudo.pilares]; arr[i] = { ...p, titulo: e.target.value }; updateConteudo("pilares", arr);
                }} placeholder="Título" />
                <Input value={p.descricao} onChange={(e) => {
                  const arr = [...rascunho.conteudo.pilares]; arr[i] = { ...p, descricao: e.target.value }; updateConteudo("pilares", arr);
                }} placeholder="Descrição" />
                <Input value={p.icone ?? ""} onChange={(e) => {
                  const arr = [...rascunho.conteudo.pilares]; arr[i] = { ...p, icone: e.target.value }; updateConteudo("pilares", arr);
                }} placeholder="Ícone (Award, Truck...)" />
                <Button size="icon" variant="ghost" onClick={() => updateConteudo("pilares", rascunho.conteudo.pilares.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </Section>

          <Section titulo="Depoimentos" onAdd={() => updateConteudo("depoimentos", [...rascunho.conteudo.depoimentos, { nome: "Cliente", texto: "" }])}>
            {rascunho.conteudo.depoimentos.map((d, i) => (
              <div key={i} className="grid md:grid-cols-[220px_1fr_40px] gap-2 items-start">
                <Input value={d.nome} onChange={(e) => {
                  const arr = [...rascunho.conteudo.depoimentos]; arr[i] = { ...d, nome: e.target.value }; updateConteudo("depoimentos", arr);
                }} placeholder="Nome/local" />
                <Textarea rows={2} value={d.texto} onChange={(e) => {
                  const arr = [...rascunho.conteudo.depoimentos]; arr[i] = { ...d, texto: e.target.value }; updateConteudo("depoimentos", arr);
                }} placeholder="Depoimento" />
                <Button size="icon" variant="ghost" onClick={() => updateConteudo("depoimentos", rascunho.conteudo.depoimentos.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </Section>

          <Section titulo="FAQ" onAdd={() => updateConteudo("faq", [...rascunho.conteudo.faq, { pergunta: "Nova pergunta", resposta: "" }])}>
            {rascunho.conteudo.faq.map((f, i) => (
              <div key={i} className="grid md:grid-cols-[1fr_2fr_40px] gap-2 items-start">
                <Input value={f.pergunta} onChange={(e) => {
                  const arr = [...rascunho.conteudo.faq]; arr[i] = { ...f, pergunta: e.target.value }; updateConteudo("faq", arr);
                }} placeholder="Pergunta" />
                <Textarea rows={2} value={f.resposta} onChange={(e) => {
                  const arr = [...rascunho.conteudo.faq]; arr[i] = { ...f, resposta: e.target.value }; updateConteudo("faq", arr);
                }} placeholder="Resposta" />
                <Button size="icon" variant="ghost" onClick={() => updateConteudo("faq", rascunho.conteudo.faq.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </Section>

          <Section titulo="Rodapé / Contato">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="WhatsApp (com DDI e DDD)"><Input value={rascunho.conteudo.rodape.whatsapp} onChange={(e) => updateConteudo("rodape", { ...rascunho.conteudo.rodape, whatsapp: e.target.value })} placeholder="5543999999999" /></Field>
              <Field label="Email"><Input value={rascunho.conteudo.rodape.email} onChange={(e) => updateConteudo("rodape", { ...rascunho.conteudo.rodape, email: e.target.value })} /></Field>
              <Field label="Endereço"><Input value={rascunho.conteudo.rodape.endereco} onChange={(e) => updateConteudo("rodape", { ...rascunho.conteudo.rodape, endereco: e.target.value })} /></Field>
              <Field label="Instagram (URL)"><Input value={rascunho.conteudo.rodape.instagram ?? ""} onChange={(e) => updateConteudo("rodape", { ...rascunho.conteudo.rodape, instagram: e.target.value })} /></Field>
            </div>
            <Field label="Mensagem padrão WhatsApp"><Textarea rows={2} value={rascunho.conteudo.rodape.mensagem_padrao} onChange={(e) => updateConteudo("rodape", { ...rascunho.conteudo.rodape, mensagem_padrao: e.target.value })} /></Field>
          </Section>
        </TabsContent>

        <TabsContent value="identidade" className="mt-6 space-y-4">
          <Card className="p-5">
            <TemaEditor value={rascunho.tema} onChange={(t) => update({ tema: t })} />
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Switch checked={rascunho.ativo} onCheckedChange={(v) => update({ ativo: v })} />
              <span className="text-sm">Página pública ativa em <a href={PAGINA_COMERCIAL_URL} target="_blank" rel="noreferrer" className="underline"><code>{PAGINA_COMERCIAL_URL.replace(/^https?:\/\//, "")}</code></a></span>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          <VideosEditor
            conteudo={rascunho.conteudo}
            onChange={(patch) => setRascunho((r) => {
              if (!r) return r;
              scheduleAutosave();
              return { ...r, conteudo: { ...r.conteudo, ...patch } };
            })}
          />
        </TabsContent>

        <TabsContent value="secoes" className="mt-6">
          <SecoesEditor
            conteudo={rascunho.conteudo}
            onChange={(patch) => setRascunho((r) => {
              if (!r) return r;
              scheduleAutosave();
              return { ...r, conteudo: { ...r.conteudo, ...patch } };
            })}
          />
        </TabsContent>

        <TabsContent value="midia" className="mt-6">
          <Card className="p-5">
            <h2 className="font-semibold mb-3">Biblioteca de mídia</h2>
            <p className="text-sm text-muted-foreground mb-4">Envie imagens (≤5MB) e vídeos (≤50MB). Cada arquivo gera uma URL estável para uso em qualquer seção.</p>
            <MediaLibrary />
          </Card>
        </TabsContent>

        <TabsContent value="lotes" className="mt-6">
          <LotesDestaqueTab />
        </TabsContent>

        <TabsContent value="captura" className="mt-6">
          <CapturaTab rascunho={rascunho} update={update} />
        </TabsContent>

        <TabsContent value="leads" className="mt-6">
          <LeadsTab />
        </TabsContent>
          </Tabs>
        </div>
        <div className="hidden lg:block bg-muted/20">
          <PreviewFrame conteudo={rascunho.conteudo} tema={rascunho.tema} />
        </div>
      </div>
    </div>
  );
}

function Section({ titulo, children, onAdd }: { titulo: string; children: React.ReactNode; onAdd?: () => void }) {
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{titulo}</h2>
        {onAdd && <Button variant="outline" size="sm" onClick={onAdd}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>}
      </div>
      {children}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}

function LotesDestaqueTab() {
  const { data: animais = [] } = useAnimais();
  const salvarAnimal = useSalvarAnimal();
  const destaques = animais.filter((a) => a.destaque);
  return (
    <Card className="p-5 space-y-4">
      <div>
        <h2 className="font-semibold">Lotes em destaque</h2>
        <p className="text-sm text-muted-foreground">Ative "destaque" para mostrar um animal na vitrine da página comercial (máx. 8).</p>
      </div>
      <div className="text-sm">
        <Badge variant="secondary">{destaques.length} em destaque</Badge>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {animais.map((a) => (
          <div key={a.id} className="flex items-center gap-3 border rounded-lg p-3">
            <div className="h-12 w-12 rounded overflow-hidden bg-muted shrink-0">
              {a.foto_url && <img src={a.foto_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{a.nome}</div>
              <div className="text-xs text-muted-foreground">{a.lote ? `Lote ${a.lote}` : "—"} · {a.categoria ?? ""}</div>
            </div>
            <Switch checked={a.destaque} onCheckedChange={(v) => salvarAnimal.mutate({ id: a.id, destaque: v })} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function CapturaTab({ rascunho, update }: { rascunho: { funil_id: string | null; etapa_inicial: string | null }; update: (p: Partial<{ funil_id: string | null; etapa_inicial: string | null }>) => void }) {
  const { data: funis = [] } = useFunis();
  const funil = funis.find((f) => f.id === rascunho.funil_id);
  const etapas = (funil?.etapas ?? []) as string[];
  return (
    <Card className="p-5 space-y-4">
      <div>
        <h2 className="font-semibold">Onde os leads da página caem</h2>
        <p className="text-sm text-muted-foreground">Todo lead capturado é criado com origem <code>pagina_comercial</code> e entra no funil escolhido.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Funil">
          <select className="border rounded-md h-9 px-2 text-sm w-full bg-background" value={rascunho.funil_id ?? ""} onChange={(e) => update({ funil_id: e.target.value || null, etapa_inicial: null })}>
            <option value="">— Nenhum —</option>
            {funis.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </Field>
        <Field label="Etapa inicial">
          <select className="border rounded-md h-9 px-2 text-sm w-full bg-background" value={rascunho.etapa_inicial ?? ""} onChange={(e) => update({ etapa_inicial: e.target.value || null })}>
            <option value="">— Primeira etapa do funil —</option>
            {etapas.map((et) => <option key={et} value={et}>{et}</option>)}
          </select>
        </Field>
      </div>
    </Card>
  );
}

function LeadsTab() {
  const { data: leads = [], isLoading } = useLeadsPagina();
  const rows = useMemo(() => leads, [leads]);
  if (isLoading) return <div className="p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-5 border-b">
        <h2 className="font-semibold">Leads da página ({leads.length})</h2>
        <p className="text-sm text-muted-foreground">Atualização em tempo real. Cada linha é um contato originado da vitrine.</p>
      </div>
      <div className="divide-y">
        {rows.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum lead ainda.</div>}
        {rows.map((l) => {
          const extra = (l.campos_extras?.pagina_comercial ?? {}) as {
            animal_nome?: string; animal_lote?: string; origem_secao?: string; mensagem?: string;
          };
          const wa = l.telefone ? `https://wa.me/${l.telefone.replace(/\D/g, "")}` : null;
          return (
            <div key={l.id} className="p-4 flex items-start gap-4 hover:bg-muted/40">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{l.nome}</span>
                  <span className="text-xs text-muted-foreground">{l.telefone}</span>
                  {extra.origem_secao && <Badge variant="outline" className="text-[10px]">{extra.origem_secao}</Badge>}
                  {extra.animal_lote && <Badge className="text-[10px]">Lote {extra.animal_lote}</Badge>}
                </div>
                {extra.animal_nome && <div className="text-sm text-muted-foreground mt-0.5">{extra.animal_nome}</div>}
                {l.interesse && !extra.animal_nome && <div className="text-sm text-muted-foreground mt-0.5">{l.interesse}</div>}
                {extra.mensagem && <div className="text-xs text-muted-foreground mt-1 italic">"{extra.mensagem}"</div>}
                <div className="text-[11px] text-muted-foreground mt-1">{new Date(l.criado_em).toLocaleString("pt-BR")}</div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {wa && <Button size="sm" variant="outline" asChild><a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /></a></Button>}
                <Button size="sm" variant="outline" asChild><a href={`/?lead=${l.id}`}><ArrowUpRight className="h-4 w-4" /></a></Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}