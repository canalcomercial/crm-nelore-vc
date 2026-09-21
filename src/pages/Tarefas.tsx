import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Phone, MessageCircle, Calendar as CalendarIcon, Check, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useFollowUps, useCriarFollowUp, useMarcarFollowUpFeito,
  useTodosLeads, useUsuarios,
} from "@/hooks/useCrm";
import { format, isPast, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function soDigitos(s?: string | null) { return (s ?? "").replace(/\D+/g, ""); }
function whatsappUrl(tel?: string | null) {
  const d = soDigitos(tel);
  if (!d) return null;
  // adiciona DDI 55 se vier sem
  const num = d.length <= 11 ? `55${d}` : d;
  return `https://wa.me/${num}`;
}
function telUrl(tel?: string | null) {
  const d = soDigitos(tel);
  return d ? `tel:+${d.length <= 11 ? `55${d}` : d}` : null;
}

const TIPOS_TAREFA = [
  { value: "ligacao", label: "Ligação", icon: Phone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "visita", label: "Visita", icon: CalendarIcon },
  { value: "outro", label: "Outro", icon: Clock },
] as const;

export default function TarefasPage() {
  const navigate = useNavigate();
  const [aba, setAba] = useState<"pendentes" | "feitos">("pendentes");
  const [vendedorFiltro, setVendedorFiltro] = useState<string>("todos");
  const { data: tarefas = [] } = useFollowUps("todos");
  const { data: leads = [] } = useTodosLeads();
  const { data: usuarios = [] } = useUsuarios();
  const criar = useCriarFollowUp();
  const marcarFeito = useMarcarFollowUpFeito();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    lead_id: "",
    tipo: "ligacao",
    data_hora: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    observacao: "",
    responsavel_id: "",
  });

  const isFeito = (s: string | null | undefined) => s === "feito" || s === "concluida" || s === "concluída";

  const { pendentes, concluidas, totalPendentes, totalConcluidas, totalVencidas } = useMemo(() => {
    const base = vendedorFiltro === "todos"
      ? tarefas
      : tarefas.filter((t) => t.responsavel_id === vendedorFiltro);
    const pend = base.filter((t) => !isFeito(t.status));
    const feitas = base.filter((t) => isFeito(t.status));
    pend.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    feitas.sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
    const venc = pend.filter((t) => isPast(new Date(t.data_hora))).length;
    return {
      pendentes: pend,
      concluidas: feitas,
      totalPendentes: pend.length,
      totalConcluidas: feitas.length,
      totalVencidas: venc,
    };
  }, [tarefas, vendedorFiltro]);

  const tarefasFiltradas = aba === "pendentes" ? pendentes : concluidas;

  const leadById = useMemo(() => {
    const m = new Map<string, typeof leads[number]>();
    leads.forEach((l) => m.set(l.id, l));
    return m;
  }, [leads]);

  const usuarioById = useMemo(() => {
    const m = new Map<string, string>();
    usuarios.forEach((u) => m.set(u.id, u.nome));
    return m;
  }, [usuarios]);

  const handleCriar = () => {
    if (!form.lead_id) return;
    criar.mutate(
      {
        lead_id: form.lead_id,
        tipo: form.tipo,
        data_hora: new Date(form.data_hora).toISOString(),
        observacao: form.observacao || null,
        responsavel_id: form.responsavel_id || null,
        status: "pendente",
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm((f) => ({ ...f, lead_id: "", observacao: "" }));
        },
      }
    );
  };

  const dialogNovaTarefa = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5">
          <Plus className="h-4 w-4" /> Adicionar tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova tarefa</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Lead *</label>
            <Select value={form.lead_id} onValueChange={(v) => setForm({ ...form, lead_id: v })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent className="max-h-72">
                {leads.slice(0, 100).map((l) => (
                  <SelectItem key={l.id} value={l.id}>#{l.numero} â€” {l.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Tipo</label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_TAREFA.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Data e hora</label>
              <Input type="datetime-local" value={form.data_hora}
                onChange={(e) => setForm({ ...form, data_hora: e.target.value })}
                className="h-9 text-xs" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Responsável</label>
            <Select value={form.responsavel_id}
              onValueChange={(v) => setForm({ ...form, responsavel_id: v })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {usuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Observação</label>
            <Textarea value={form.observacao}
              onChange={(e) => setForm({ ...form, observacao: e.target.value })}
              className="text-xs min-h-[60px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleCriar} disabled={!form.lead_id}>Criar tarefa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const abrirLead = (leadId: string) => navigate(`/?lead=${leadId}`);

  return (
    <>
      <Topbar title="Tarefas" actions={dialogNovaTarefa} />
      <div className="flex-1 overflow-auto p-5 space-y-4">
        {/* Contadores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-surface border border-border rounded-lg p-3">
            <div className="text-[11px] text-muted-foreground">Pendentes</div>
            <div className="text-xl font-semibold">{totalPendentes}</div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-3">
            <div className="text-[11px] text-muted-foreground">Vencidas</div>
            <div className="text-xl font-semibold text-destructive">{totalVencidas}</div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-3">
            <div className="text-[11px] text-muted-foreground">Concluídas</div>
            <div className="text-xl font-semibold text-success">{totalConcluidas}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-surface border border-border rounded-lg p-2 flex-wrap">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {[
              { v: "pendentes" as const, l: "Tarefas pendentes", badge: totalPendentes },
              { v: "feitos" as const, l: "Tarefas concluídas", badge: totalConcluidas },
            ].map((f) => (
              <button
                key={f.v}
                onClick={() => setAba(f.v)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 flex-1 justify-center sm:flex-none",
                  aba === f.v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                )}
              >
                {f.l}
                {f.badge !== undefined && f.badge > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 rounded-full",
                    aba === f.v ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-muted-foreground"
                  )}>
                    {f.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="sm:ml-auto flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] text-muted-foreground hidden sm:inline">Vendedor:</span>
            <Select value={vendedorFiltro} onValueChange={setVendedorFiltro}>
              <SelectTrigger className="h-8 text-xs w-full sm:w-[200px]">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os vendedores</SelectItem>
                {usuarios.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista */}
        {tarefasFiltradas.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-12 text-center text-sm text-muted-foreground">
            Nenhuma tarefa nesta visualização.
          </div>
        ) : (
          <div className="space-y-2">
            {tarefasFiltradas.map((t) => {
              const tipo = TIPOS_TAREFA.find((x) => x.value === t.tipo);
              const Icon = tipo?.icon ?? Clock;
              const feito = isFeito(t.status);
              const vencido = !feito && isPast(new Date(t.data_hora));
              const lead = leadById.get(t.lead_id);
              const wa = whatsappUrl(lead?.telefone);
              const tel = telUrl(lead?.telefone);
              return (
                <div
                  key={t.id}
                  className={cn(
                    "bg-surface border rounded-lg p-3 flex items-center gap-3 transition-colors",
                    feito && "opacity-60",
                    vencido && !feito ? "border-destructive/40" : "border-border"
                  )}
                >
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                    feito ? "bg-success/15 text-success"
                      : vencido ? "bg-destructive/15 text-destructive"
                      : "bg-primary-soft text-primary"
                  )}>
                    {feito ? <Check className="h-4 w-4" />
                      : vencido ? <AlertCircle className="h-4 w-4" />
                      : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => lead && abrirLead(lead.id)}
                        className="text-sm font-medium hover:text-primary inline-flex items-center gap-1"
                        title="Abrir lead"
                      >
                        {lead?.nome ?? "Lead"}
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </button>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-wide">
                        {tipo?.label ?? t.tipo}
                      </span>
                      {lead?.telefone && (
                        <span className="text-[10px] text-muted-foreground">{lead.telefone}</span>
                      )}
                    </div>
                    {t.observacao && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{t.observacao}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn(
                      "text-xs font-medium",
                      vencido && !feito && "text-destructive"
                    )}>
                      {format(new Date(t.data_hora), "dd/MM HH:mm", { locale: ptBR })}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(t.data_hora), { addSuffix: true, locale: ptBR })}
                    </div>
                    {t.responsavel_id && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {usuarioById.get(t.responsavel_id)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon" variant="outline" className="h-8 w-8"
                      title={wa ? "Abrir WhatsApp" : "Sem telefone"}
                      disabled={!wa}
                      onClick={() => wa && window.open(wa, "_blank", "noopener,noreferrer")}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="outline" className="h-8 w-8"
                      title={tel ? "Ligar" : "Sem telefone"}
                      disabled={!tel}
                      onClick={() => {
                        if (!tel) return;
                        window.location.href = tel;
                        toast.message("Abrindo discador...");
                      }}
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </Button>
                    {!feito && (
                      <Button
                        size="sm" variant="outline" className="h-8 text-xs gap-1"
                        onClick={() => marcarFeito.mutate({ id: t.id })}
                      >
                        <Check className="h-3 w-3" /> Concluir
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
