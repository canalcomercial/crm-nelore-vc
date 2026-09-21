import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Pencil, User, Search, X, GripVertical } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { KanbanColumn } from "@/components/funis/KanbanColumn";
import { LeadPanel } from "@/components/funis/LeadPanel";
import { FunilEditor } from "@/components/funis/FunilEditor";
import { NovoLeadDialog } from "@/components/funis/NovoLeadDialog";
import { useFunis, useLeadsByFunil, useUpdateLeadEtapa, useTodosLeads, useReordenarFunis } from "@/hooks/useCrm";
import { useEquipe } from "@/hooks/useEquipe";
import { useAuth } from "@/hooks/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Funil, Lead } from "@/types/crm";
import { cn } from "@/lib/utils";

export default function FunisPage() {
  const { data: funis = [], isLoading: loadingFunis } = useFunis();
  const [funilId, setFunilId] = useState<string | undefined>();
  const activeFunil = funis.find((f) => f.id === funilId) ?? funis[0];
  const currentFunilId = funilId ?? funis[0]?.id;
  const { data: leads = [] } = useLeadsByFunil(currentFunilId);
  const { data: todosLeads = [] } = useTodosLeads();
  const { data: equipe = [] } = useEquipe();
  const { user, isCoordenador } = useAuth();
  const [vendedorFiltro, setVendedorFiltro] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [vendedorInicializado, setVendedorInicializado] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [funilEditando, setFunilEditando] = useState<Funil | null>(null);
  const [novoLeadOpen, setNovoLeadOpen] = useState(false);
  const updateEtapa = useUpdateLeadEtapa();
  const reordenarFunis = useReordenarFunis();
  const [searchParams, setSearchParams] = useSearchParams();

  // Inicializa filtro: vendedor vê apenas seus leads por padrão; coordenador vê todos
  useEffect(() => {
    if (vendedorInicializado || !user) return;
    setVendedorFiltro(isCoordenador ? "todos" : user.id);
    setVendedorInicializado(true);
  }, [user, isCoordenador, vendedorInicializado]);

  // Abrir lead via ?lead=<id> (vem de Tarefas / outras páginas)
  useEffect(() => {
    const id = searchParams.get("lead");
    if (!id) return;
    const found = todosLeads.find((l) => l.id === id);
    if (found) {
      setSelectedLead(found);
      if (found.funil_id && found.funil_id !== currentFunilId) {
        setFunilId(found.funil_id);
      }
      // limpa o param para não reabrir ao fechar
      const next = new URLSearchParams(searchParams);
      next.delete("lead");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, todosLeads, currentFunilId, setSearchParams]);

  const abrirNovoFunil = () => { setFunilEditando(null); setEditorOpen(true); };
  const abrirEditarFunil = () => { if (activeFunil) { setFunilEditando(activeFunil); setEditorOpen(true); } };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const pillSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleReorderFunis = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = funis.findIndex((f) => f.id === active.id);
    const newIndex = funis.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordenado = arrayMove(funis, oldIndex, newIndex);
    reordenarFunis.mutate(reordenado.map((f, idx) => ({ id: f.id, ordem: idx })));
  };

  const leadsFiltrados = useMemo(() => {
    let base = leads;
    if (vendedorFiltro === "sem") base = leads.filter((l) => !l.responsavel_id);
    else if (vendedorFiltro !== "todos") base = leads.filter((l) => l.responsavel_id === vendedorFiltro);
    return base;
  }, [leads, vendedorFiltro]);

  // Busca global: procura em todos os funis para que o lead seja encontrado
  // mesmo estando em outro funil. Ao clicar num resultado, trocamos de funil
  // e abrimos o painel do lead.
  const resultadosBusca = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    const qDigits = q.replace(/\D/g, "");
    return todosLeads
      .filter((l) => {
        const nome = (l.nome ?? "").toLowerCase();
        const fazenda = (l.fazenda ?? "").toLowerCase();
        const tel = (l.telefone ?? "").replace(/\D/g, "");
        const cpf = (l.cpf ?? "").replace(/\D/g, "");
        if (nome.includes(q) || fazenda.includes(q)) return true;
        if (qDigits && qDigits.length >= 3 && (tel.includes(qDigits) || cpf.includes(qDigits))) return true;
        return false;
      })
      .slice(0, 30);
  }, [todosLeads, busca]);

  const [buscaFocada, setBuscaFocada] = useState(false);

  const abrirLeadDaBusca = (lead: Lead) => {
    if (lead.funil_id && lead.funil_id !== currentFunilId) {
      setFunilId(lead.funil_id);
    }
    setSelectedLead(lead);
    setBusca("");
    setBuscaFocada(false);
  };

  const leadsByEtapa = useMemo(() => {
    const map = new Map<string, Lead[]>();
    activeFunil?.etapas.forEach((et) => map.set(et, []));
    leadsFiltrados.forEach((l) => {
      if (l.etapa && map.has(l.etapa)) map.get(l.etapa)!.push(l);
    });
    return map;
  }, [leadsFiltrados, activeFunil]);

  const handleDragEnd = (e: DragEndEvent) => {
    const lead = e.active.data.current?.lead as Lead | undefined;
    const novaEtapa = e.over?.id as string | undefined;
    if (!lead || !novaEtapa || lead.etapa === novaEtapa) return;
    updateEtapa.mutate({ id: lead.id, etapa: novaEtapa });
  };

  return (
    <>
      <Topbar title="Funis" onNewLead={() => setNovoLeadOpen(true)} />
      <div className="flex-1 flex flex-col min-h-0">
        {/* Funil pills */}
        <div className="px-3 sm:px-5 py-3 border-b border-border bg-surface flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin -mx-1 px-1">
            {loadingFunis && <span className="text-xs text-muted-foreground">Carregando funis...</span>}
            <DndContext sensors={pillSensors} collisionDetection={closestCenter} onDragEnd={handleReorderFunis}>
              <SortableContext items={funis.map((f) => f.id)} strategy={horizontalListSortingStrategy}>
                <div className="flex items-center gap-1.5">
                  {funis.map((f) => (
                    <SortableFunilPill
                      key={f.id}
                      funil={f}
                      active={(currentFunilId ?? funis[0]?.id) === f.id}
                      onClick={() => setFunilId(f.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <button
              onClick={abrirNovoFunil}
              className="ml-1 h-7 w-7 shrink-0 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary flex items-center justify-center"
              title="Novo funil"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="lg:ml-auto grid grid-cols-2 sm:flex items-center gap-2 w-full lg:w-auto">
            <div className="relative col-span-2 sm:col-span-1 w-full sm:w-auto">
              <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onFocus={() => setBuscaFocada(true)}
                onBlur={() => setTimeout(() => setBuscaFocada(false), 150)}
                placeholder="Buscar lead neste funil..."
                className="h-8 w-full sm:w-[260px] pl-7 pr-7 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {busca && (
                <button
                  onClick={() => { setBusca(""); setBuscaFocada(false); }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title="Limpar"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              {buscaFocada && busca.trim() && (
                <div className="absolute z-50 mt-1 left-0 w-[min(320px,calc(100vw-2rem))] max-h-[360px] overflow-y-auto rounded-md border border-border bg-popover shadow-lg scrollbar-thin">
                  {resultadosBusca.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                      Nenhum lead encontrado
                    </div>
                  ) : (
                    resultadosBusca.map((l) => {
                      const funilNome = funis.find((f) => f.id === l.funil_id)?.nome ?? "Sem funil";
                      return (
                        <button
                          key={l.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => abrirLeadDaBusca(l)}
                          className="w-full text-left px-3 py-2 hover:bg-secondary border-b border-border last:border-b-0"
                        >
                          <div className="text-xs font-semibold text-foreground truncate">{l.nome}</div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground truncate">
                            <span className="px-1.5 py-0.5 rounded bg-secondary">{funilNome}</span>
                            {l.etapa && <span>· {l.etapa}</span>}
                            {l.telefone && <span>· {l.telefone}</span>}
                          </div>
                          {l.fazenda && (
                            <div className="text-[10px] text-muted-foreground truncate">{l.fazenda}</div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <div className="col-span-1 w-full sm:w-auto flex">
              <Select value={vendedorFiltro} onValueChange={setVendedorFiltro}>
                <SelectTrigger className="h-8 w-full sm:w-[180px] text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder="Vendedor" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os vendedores</SelectItem>
                  {user && (
                    <SelectItem value={user.id}>Meus leads</SelectItem>
                  )}
                  <SelectItem value="sem">Sem responsável</SelectItem>
                  {equipe
                    .filter((m) => m.ativo && m.id !== user?.id)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 w-full sm:w-auto flex justify-end">
              {activeFunil && (
                <button
                  onClick={abrirEditarFunil}
                  className="h-8 px-3 rounded-md text-xs border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center gap-1.5 w-full sm:w-auto"
                  title="Editar funil atual"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Kanban */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 sm:p-5 scrollbar-thin snap-x snap-mandatory md:snap-none">
          {activeFunil && (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="flex gap-3 h-full min-h-[400px]">
                {activeFunil.etapas.map((etapa) => (
                  <KanbanColumn
                    key={etapa}
                    etapa={etapa}
                    leads={leadsByEtapa.get(etapa) ?? []}
                    onLeadClick={setSelectedLead}
                  />
                ))}
              </div>
            </DndContext>
          )}
        </div>
      </div>

      <LeadPanel
        lead={selectedLead}
        funil={activeFunil}
        onClose={() => setSelectedLead(null)}
      />

      <FunilEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        funil={funilEditando}
      />

      <NovoLeadDialog
        open={novoLeadOpen}
        onOpenChange={setNovoLeadOpen}
        funilPadrao={activeFunil}
      />
    </>
  );
}

function SortableFunilPill({
  funil,
  active,
  onClick,
}: {
  funil: Funil;
  active: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: funil.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center rounded-full border transition-colors overflow-hidden",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-surface text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className={cn(
          "pl-2 pr-1 py-1.5 cursor-grab active:cursor-grabbing opacity-60 hover:opacity-100",
          isDragging && "cursor-grabbing",
        )}
        title="Arraste para reordenar"
        aria-label={`Reordenar ${funil.nome}`}
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <button
        onClick={onClick}
        className="pr-3 pl-0.5 py-1.5 text-xs font-medium whitespace-nowrap"
      >
        {funil.nome}
      </button>
    </div>
  );
}
