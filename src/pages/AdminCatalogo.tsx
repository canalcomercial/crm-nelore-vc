import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Upload, ExternalLink, Image as ImageIcon, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useAnimais,
  useEventos,
  useConfiguracao,
  useExcluirAnimal,
  useToggleAtivoAnimal,
  useSalvarEvento,
  useExcluirEvento,
  useSalvarConfiguracao,
  useAtualizarAnimaisEvento,
  type Animal,
  type Evento,
} from "@/hooks/useCatalogo";
import { AnimalForm } from "@/components/catalogo/admin/AnimalForm";
import { ImportarAnimaisDialog } from "@/components/catalogo/admin/ImportarAnimaisDialog";
import { LayoutEditor } from "@/components/catalogo/admin/LayoutEditor";
import { FaqEditor } from "@/components/catalogo/admin/FaqEditor";
import { generateCoverForVideo } from "@/lib/frame-extraction";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminCatalogoPage() {
  return (
    <>
      <Topbar title="Catálogo Nelore VC" hideSearch actions={
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link to="/catalogo" target="_blank"><ExternalLink className="h-4 w-4" /> Ver vitrine</Link>
        </Button>
      } />
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <Tabs defaultValue="animais" className="max-w-6xl mx-auto">
          <div className="-mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
            <TabsList className="w-max">
              <TabsTrigger value="animais">Animais</TabsTrigger>
              <TabsTrigger value="evento">Evento atual</TabsTrigger>
              <TabsTrigger value="layout">Layout & Prévia</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="config">Configurações</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="animais" className="mt-4"><AnimaisTab /></TabsContent>
          <TabsContent value="evento" className="mt-4"><EventoTab /></TabsContent>
          <TabsContent value="layout" className="mt-4"><LayoutEditor /></TabsContent>
          <TabsContent value="faq" className="mt-4"><FaqEditor /></TabsContent>
          <TabsContent value="config" className="mt-4"><ConfigTab /></TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function AnimaisTab() {
  const { data: animais = [], isLoading } = useAnimais();
  const excluir = useExcluirAnimal();
  const toggleAtivo = useToggleAtivoAnimal();
  const [editar, setEditar] = useState<Animal | null>(null);
  const [novo, setNovo] = useState(false);
  const [importar, setImportar] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [progresso, setProgresso] = useState<{ atual: number; total: number } | null>(null);
  const qc = useQueryClient();

  const gerarCapas = async () => {
    const pendentes = animais.filter((a) => !a.foto_url && a.link_video);
    if (pendentes.length === 0) {
      toast.info("Todos os animais com vídeo já possuem capa.");
      return;
    }
    if (!confirm(`Gerar capas automáticas para ${pendentes.length} animal(is) a partir do vídeo?`)) return;
    setGerando(true);
    setProgresso({ atual: 0, total: pendentes.length });
    let ok = 0, falhas = 0;
    for (let i = 0; i < pendentes.length; i++) {
      const a = pendentes[i];
      setProgresso({ atual: i + 1, total: pendentes.length });
      try {
        const url = await generateCoverForVideo(a.link_video!);
        if (!url) { falhas++; continue; }
        const { error } = await supabase.from("animais").update({ foto_url: url }).eq("id", a.id);
        if (error) throw error;
        ok++;
      } catch (e) {
        console.error("Falha ao gerar capa", a.nome, e);
        falhas++;
      }
    }
    setGerando(false);
    setProgresso(null);
    qc.invalidateQueries({ queryKey: ["animais"] });
    toast.success(`Capas geradas: ${ok}${falhas ? ` — ${falhas} falha(s)` : ""}`);
  };

  const semCapaComVideo = animais.filter((a) => !a.foto_url && a.link_video).length;

  return (
    <div className="bg-surface rounded-lg border p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="text-sm text-muted-foreground">
          {animais.length} animais cadastrados
          {semCapaComVideo > 0 && (
            <span className="ml-2 text-xs">· {semCapaComVideo} sem capa com vídeo</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"

            onClick={gerarCapas}
            disabled={gerando || semCapaComVideo === 0}
            className="gap-1.5"
            title="Extrai automaticamente uma imagem de capa a partir do vídeo dos animais que ainda não têm foto"
          >
            {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            {gerando && progresso
              ? `Gerando capas... ${progresso.atual}/${progresso.total}`
              : "Gerar capas dos vídeos"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportar(true)} className="gap-1.5"><Upload className="h-4 w-4" /> Importar CSV</Button>
          <Button size="sm" onClick={() => setNovo(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Novo animal</Button>
        </div>
      </div>
      <div className="-mx-3 sm:mx-0 overflow-x-auto">
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-14"></TableHead>
              <TableHead>Lote</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Categoria</TableHead>
              <TableHead className="hidden md:table-cell">Preço</TableHead>
              <TableHead className="hidden md:table-cell">Destaque</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : animais.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum animal cadastrado.</TableCell></TableRow>
            ) : animais.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  {a.foto_url ? <img src={a.foto_url} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-muted" />}
                </TableCell>
                <TableCell className="font-mono text-xs">{a.lote ?? "-"}</TableCell>
                <TableCell className="font-medium">{a.nome}</TableCell>
                <TableCell className="hidden sm:table-cell">{a.categoria ?? "-"}</TableCell>
                <TableCell className="hidden md:table-cell">{a.preco_total ? a.preco_total.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "-"}</TableCell>
                <TableCell className="hidden md:table-cell">{a.destaque && <Badge>Destaque</Badge>}</TableCell>
                <TableCell><Switch checked={a.ativo} onCheckedChange={(v) => toggleAtivo.mutate({ id: a.id, ativo: v })} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditar(a)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Excluir ${a.nome}?`)) excluir.mutate(a.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

          </TableBody>
        </Table>
      </div>
      <AnimalForm open={novo || !!editar} onOpenChange={(v) => { if (!v) { setNovo(false); setEditar(null); } }} animal={editar} />
      <ImportarAnimaisDialog open={importar} onOpenChange={setImportar} />
    </div>
  );
}

function EventoTab() {
  const { data: eventos = [] } = useEventos();
  const { data: animais = [] } = useAnimais();
  const salvar = useSalvarEvento();
  const excluir = useExcluirEvento();
  const atualizarAnimais = useAtualizarAnimaisEvento();
  const [form, setForm] = useState<Partial<Evento>>({ ativo: true });
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const editar = (e: Evento) => {
    setForm(e);
    const associados = animais.filter((a) => a.evento_id === e.id).map((a) => a.id);
    setSelecionados(new Set(associados));
  };
  const submit = async () => {
    if (!form.nome) return;
    // Salva evento e obtém id (retorna void; refaz busca para pegar id caso novo)
    if (form.id) {
      await salvar.mutateAsync(form);
      await atualizarAnimais.mutateAsync({ eventoId: form.id, animalIds: Array.from(selecionados) });
    } else {
      // Insere e recupera o id
      const { data, error } = await supabase.from("eventos").insert(form as any).select("id").single();
      if (error) { toast.error(error.message); return; }
      const novoId = data!.id as string;
      if (selecionados.size > 0) {
        await atualizarAnimais.mutateAsync({ eventoId: novoId, animalIds: Array.from(selecionados) });
      }
      toast.success("Evento criado");
    }
    setForm({ ativo: true });
    setSelecionados(new Set());
  };

  const toggle = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-surface rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold">{form.id ? "Editar evento" : "Novo evento"}</h3>
        <div><Label className="text-xs">Nome</Label><Input value={form.nome ?? ""} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} /></div>
        <div><Label className="text-xs">Data</Label><Input type="date" value={form.data ?? ""} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} /></div>
        <div><Label className="text-xs">Descrição</Label><Textarea rows={4} value={form.descricao ?? ""} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} /></div>
        <div className="flex items-center gap-2"><Switch checked={form.ativo ?? true} onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))} /><Label className="text-sm">Ativo (aparece no banner)</Label></div>
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-semibold">Animais deste evento ({selecionados.size} selecionados)</Label>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelecionados(new Set(animais.map((a) => a.id)))}>
                Selecionar todos
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelecionados(new Set())}>
                Limpar
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">Marque quais animais aparecem no card deste evento na página comercial.</p>

          <div className="max-h-60 overflow-y-auto border rounded-md divide-y">
            {animais.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nenhum animal cadastrado.</p>}
            {animais.map((a) => {
              const outroEvento = a.evento_id && a.evento_id !== form.id;
              return (
                <label key={a.id} className={`flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-muted/40 ${outroEvento ? "opacity-60" : ""}`}>
                  <input
                    type="checkbox"
                    checked={selecionados.has(a.id)}
                    onChange={() => toggle(a.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{a.nome} {a.lote && <span className="text-xs text-muted-foreground">· Lote {a.lote}</span>}</div>
                    {outroEvento && <div className="text-[10px] text-amber-600">Já vinculado a outro evento — será movido</div>}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2">
          {form.id && <Button variant="outline" onClick={() => { setForm({ ativo: true }); setSelecionados(new Set()); }}>Cancelar</Button>}
          <Button onClick={submit}>Salvar</Button>
        </div>
      </div>
      <div className="bg-surface rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Eventos cadastrados</h3>
        <div className="space-y-2">
          {eventos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum evento.</p>}
          {eventos.map((e) => (
            <div key={e.id} className="flex items-center gap-2 border rounded p-2">
              <div className="flex-1">
                <div className="text-sm font-medium flex items-center gap-2">{e.nome} {e.ativo && <Badge>Ativo</Badge>}</div>
                <div className="text-xs text-muted-foreground">{e.data ?? "sem data"}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => editar(e)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Excluir ${e.nome}?`)) excluir.mutate(e.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfigTab() {
  const { data: config } = useConfiguracao();
  const salvar = useSalvarConfiguracao();
  const [whatsapp, setWhatsapp] = useState(config?.whatsapp ?? "");
  const [msg, setMsg] = useState(config?.mensagem_padrao ?? "");

  // sincroniza quando carrega
  useState(() => { /* noop */ });
  if (config && whatsapp === "" && msg === "" && (config.whatsapp || config.mensagem_padrao)) {
    setWhatsapp(config.whatsapp ?? "");
    setMsg(config.mensagem_padrao ?? "");
  }

  return (
    <div className="bg-surface rounded-lg border p-4 max-w-xl space-y-4">
      <div>
        <Label className="text-xs">WhatsApp da fazenda (com DDI)</Label>
        <Input placeholder="5511999999999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        <p className="text-[11px] text-muted-foreground mt-1">Formato: 55 + DDD + número. Ex.: 5511999999999</p>
      </div>
      <div>
        <Label className="text-xs">Mensagem padrão do botão "Tenho interesse"</Label>
        <Textarea rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} />
        <p className="text-[11px] text-muted-foreground mt-1">Use <code>{"{nome}"}</code> e <code>{"{lote}"}</code> como variáveis.</p>
      </div>
      <Button onClick={() => salvar.mutate({ whatsapp, mensagem_padrao: msg })}>Salvar</Button>
    </div>
  );
}
