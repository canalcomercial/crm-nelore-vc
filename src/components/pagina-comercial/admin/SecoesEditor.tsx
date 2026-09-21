import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  SECOES_DISPONIVEIS,
  type BotaoConfig,
  type BotaoAcao,
  type PaginaConteudo,
  type SecaoId,
} from "@/hooks/usePaginaComercial";

export function SecoesEditor({
  conteudo,
  onChange,
}: {
  conteudo: PaginaConteudo;
  onChange: (patch: Partial<PaginaConteudo>) => void;
}) {
  const ordem: SecaoId[] = useMemo(() => {
    const salva = conteudo.secoes_ordem ?? [];
    const base = SECOES_DISPONIVEIS.map((s) => s.id);
    const usados = salva.filter((s) => base.includes(s));
    const faltantes = base.filter((s) => !usados.includes(s));
    return [...usados, ...faltantes];
  }, [conteudo.secoes_ordem]);

  const visiveis = conteudo.secoes_visiveis ?? {};

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ordem.indexOf(active.id as SecaoId);
    const newIndex = ordem.indexOf(over.id as SecaoId);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange({ secoes_ordem: arrayMove(ordem, oldIndex, newIndex) });
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="mb-3">
          <h2 className="font-semibold">Ordem e visibilidade das seções</h2>
          <p className="text-sm text-muted-foreground">Arraste para reordenar. Desative o interruptor para ocultar da página pública.</p>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ordem} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {ordem.map((id) => (
                <SortableSecao
                  key={id}
                  id={id}
                  ativa={visiveis[id] !== false}
                  onToggle={(v) => onChange({ secoes_visiveis: { ...visiveis, [id]: v } })}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </Card>

      <BotoesEditor
        titulo="Botões do topo (hero)"
        botoes={conteudo.hero.botoes ?? []}
        onChange={(botoes) => onChange({ hero: { ...conteudo.hero, botoes } })}
      />

      <BotoesEditor
        titulo="Botões do card de evento"
        botoes={conteudo.evento_botoes ?? []}
        onChange={(botoes) => onChange({ evento_botoes: botoes })}
      />

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Chamada final (CTA)</h2>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Título</Label>
            <Input
              value={conteudo.cta_final?.titulo ?? ""}
              placeholder="Pronto para escolher a genética do seu rebanho?"
              onChange={(e) => onChange({ cta_final: { ...conteudo.cta_final, titulo: e.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Texto</Label>
            <Input
              value={conteudo.cta_final?.texto ?? ""}
              placeholder="Fale com um consultor Nelore VC agora."
              onChange={(e) => onChange({ cta_final: { ...conteudo.cta_final, texto: e.target.value } })}
            />
          </div>
        </div>
        <BotoesEditor
          titulo="Botões do CTA final"
          embutido
          botoes={conteudo.cta_final?.botoes ?? []}
          onChange={(botoes) => onChange({ cta_final: { ...conteudo.cta_final, botoes } })}
        />
      </Card>
    </div>
  );
}

function SortableSecao({ id, ativa, onToggle }: { id: SecaoId; ativa: boolean; onToggle: (v: boolean) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const label = SECOES_DISPONIVEIS.find((s) => s.id === id)?.label ?? id;
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 border rounded-md p-2.5 bg-background">
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Arrastar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-sm flex-1">{label}</span>
      <Switch checked={ativa} onCheckedChange={onToggle} />
    </div>
  );
}

function novoBotao(): BotaoConfig {
  return {
    id: crypto.randomUUID(),
    label: "Falar com consultor",
    variante: "primary",
    acao: { tipo: "lead" },
  };
}

function BotoesEditor({
  titulo,
  botoes,
  onChange,
  embutido,
}: {
  titulo: string;
  botoes: BotaoConfig[];
  onChange: (b: BotaoConfig[]) => void;
  embutido?: boolean;
}) {
  const content = (
    <div className="space-y-3">
      {botoes.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum botão. Clique em "Adicionar botão" para criar.</p>
      )}
      {botoes.map((b, i) => (
        <div key={b.id} className="border rounded-md p-3 space-y-3 bg-background">
          <div className="grid md:grid-cols-[1fr_160px_40px] gap-2 items-start">
            <div className="space-y-1.5">
              <Label className="text-xs">Texto do botão</Label>
              <Input value={b.label} onChange={(e) => {
                const arr = [...botoes]; arr[i] = { ...b, label: e.target.value }; onChange(arr);
              }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Estilo</Label>
              <select
                className="border rounded-md h-9 px-2 text-sm w-full bg-background"
                value={b.variante}
                onChange={(e) => {
                  const arr = [...botoes]; arr[i] = { ...b, variante: e.target.value as BotaoConfig["variante"] }; onChange(arr);
                }}
              >
                <option value="primary">Preenchido</option>
                <option value="outline">Contorno</option>
                <option value="ghost">Transparente</option>
                <option value="branco">Branco (sobre fundo colorido)</option>
              </select>
            </div>
            <Button size="icon" variant="ghost" className="mt-6" onClick={() => onChange(botoes.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <AcaoEditor acao={b.acao} onChange={(acao) => {
            const arr = [...botoes]; arr[i] = { ...b, acao }; onChange(arr);
          }} />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...botoes, novoBotao()])}>
        <Plus className="h-4 w-4 mr-1" /> Adicionar botão
      </Button>
    </div>
  );
  if (embutido) return <div className="pt-2"><div className="text-sm font-medium mb-2">{titulo}</div>{content}</div>;
  return (
    <Card className="p-5 space-y-3">
      <h2 className="font-semibold">{titulo}</h2>
      {content}
    </Card>
  );
}

function AcaoEditor({ acao, onChange }: { acao: BotaoAcao; onChange: (a: BotaoAcao) => void }) {
  return (
    <div className="grid gap-2">
      <div className="space-y-1.5">
        <Label className="text-xs">Ação ao clicar</Label>
        <select
          className="border rounded-md h-9 px-2 text-sm w-full bg-background"
          value={acao.tipo}
          onChange={(e) => {
            const tipo = e.target.value as BotaoAcao["tipo"];
            if (tipo === "lead") onChange({ tipo: "lead" });
            else if (tipo === "link") onChange({ tipo: "link", url: "https://" });
            else if (tipo === "ancora") onChange({ tipo: "ancora", secao_id: "lotes" });
            else if (tipo === "whatsapp") onChange({ tipo: "whatsapp" });
            else onChange({ tipo: "rota", path: "/catalogo" });
          }}
        >
          <option value="lead">Abrir formulário de lead</option>
          <option value="ancora">Rolar até uma seção</option>
          <option value="link">Abrir link externo</option>
          <option value="rota">Ir para uma página do site</option>
          <option value="whatsapp">Abrir WhatsApp</option>
        </select>
      </div>
      {acao.tipo === "lead" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Mensagem sugerida (opcional)</Label>
          <Input
            value={acao.mensagem_sugerida ?? ""}
            placeholder="Ex.: Quero saber mais sobre o próximo leilão"
            onChange={(e) => onChange({ ...acao, mensagem_sugerida: e.target.value })}
          />
        </div>
      )}
      {acao.tipo === "link" && (
        <div className="grid md:grid-cols-[1fr_140px] gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">URL</Label>
            <Input value={acao.url} onChange={(e) => onChange({ ...acao, url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Abrir em</Label>
            <select
              className="border rounded-md h-9 px-2 text-sm w-full bg-background"
              value={acao.nova_aba ? "nova" : "mesma"}
              onChange={(e) => onChange({ ...acao, nova_aba: e.target.value === "nova" })}
            >
              <option value="nova">Nova aba</option>
              <option value="mesma">Mesma aba</option>
            </select>
          </div>
        </div>
      )}
      {acao.tipo === "ancora" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Seção alvo</Label>
          <select
            className="border rounded-md h-9 px-2 text-sm w-full bg-background"
            value={acao.secao_id}
            onChange={(e) => onChange({ ...acao, secao_id: e.target.value as SecaoId | "top" })}
          >
            <option value="top">Topo</option>
            {SECOES_DISPONIVEIS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      )}
      {acao.tipo === "rota" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Caminho interno</Label>
          <Input value={acao.path} onChange={(e) => onChange({ ...acao, path: e.target.value })} placeholder="/catalogo" />
        </div>
      )}
      {acao.tipo === "whatsapp" && (
        <div className="grid md:grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Número (opcional — usa o do rodapé se vazio)</Label>
            <Input value={acao.numero ?? ""} onChange={(e) => onChange({ ...acao, numero: e.target.value })} placeholder="5543999999999" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Mensagem inicial (opcional)</Label>
            <Input value={acao.mensagem ?? ""} onChange={(e) => onChange({ ...acao, mensagem: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}