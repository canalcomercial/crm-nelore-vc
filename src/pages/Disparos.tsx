import { useState, useMemo } from "react";
import { Plus, Send, Users, Filter as FilterIcon, MessageCircle } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useDisparos, useCriarDisparo, useTodosLeads, useFunis,
} from "@/hooks/useCrm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STATUS_DISPARO: Record<string, { label: string; cor: string }> = {
  rascunho: { label: "Rascunho", cor: "bg-secondary text-muted-foreground" },
  enviado: { label: "Enviado", cor: "bg-success/15 text-success" },
  agendado: { label: "Agendado", cor: "bg-info/15 text-info" },
  cancelado: { label: "Cancelado", cor: "bg-destructive/15 text-destructive" },
};

export default function DisparosPage() {
  const { data: disparos = [] } = useDisparos();
  const { data: leads = [] } = useTodosLeads();
  const { data: funis = [] } = useFunis();
  const criar = useCriarDisparo();

  const [open, setOpen] = useState(false);
  const [funilFiltro, setFunilFiltro] = useState<string>("todos");
  const [etapaFiltro, setEtapaFiltro] = useState<string>("todas");
  const [mensagem, setMensagem] = useState("");

  const funilSelecionado = funis.find((f) => f.id === funilFiltro);

  const contatosSelecionados = useMemo(() => {
    return leads.filter((l) => {
      if (!l.telefone) return false;
      if (funilFiltro !== "todos" && l.funil_id !== funilFiltro) return false;
      if (etapaFiltro !== "todas" && l.etapa !== etapaFiltro) return false;
      return true;
    });
  }, [leads, funilFiltro, etapaFiltro]);

  const handleCriar = (status: "rascunho" | "enviado") => {
    if (!mensagem.trim() || contatosSelecionados.length === 0) return;
    criar.mutate(
      {
        mensagem: mensagem.trim(),
        lista_contatos: contatosSelecionados.map((l) => ({
          lead_id: l.id,
          nome: l.nome,
          telefone: l.telefone!,
        })),
        status,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setMensagem("");
          setFunilFiltro("todos");
          setEtapaFiltro("todas");
        },
      }
    );
  };

  return (
    <>
      <Topbar title="Disparos" hideSearch />
      <div className="flex-1 overflow-auto p-5 space-y-4">
        <div className="flex items-center justify-between bg-surface border border-border rounded-lg p-3">
          <div>
            <h2 className="text-sm font-semibold">Campanhas em massa</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mensagens segmentadas para listas de leads. Envio via WhatsApp será conectado em breve.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5">
                <Plus className="h-4 w-4" /> Nova campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova campanha de disparo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Segmentação */}
                <div className="bg-primary-soft/30 border border-primary/15 rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <FilterIcon className="h-3.5 w-3.5" /> SEGMENTAÇÃO
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Funil</label>
                      <Select value={funilFiltro} onValueChange={(v) => { setFunilFiltro(v); setEtapaFiltro("todas"); }}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os funis</SelectItem>
                          {funis.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Etapa</label>
                      <Select value={etapaFiltro} onValueChange={setEtapaFiltro} disabled={!funilSelecionado}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas etapas</SelectItem>
                          {funilSelecionado?.etapas.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-primary">{contatosSelecionados.length}</span>
                    <span className="text-muted-foreground">contatos selecionados (com telefone)</span>
                  </div>
                </div>

                {/* Mensagem */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">Mensagem</label>
                  <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Ex: Olá {nome}, novidade da Nelore VC esta semana..."
                    className="text-xs min-h-[120px]" />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Use {"{nome}"} para personalização automática.
                  </p>
                </div>

                {/* Preview */}
                {contatosSelecionados.length > 0 && (
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">Preview de contatos (5 primeiros)</label>
                    <div className="bg-background border border-border rounded-md mt-1 max-h-32 overflow-y-auto">
                      {contatosSelecionados.slice(0, 5).map((l) => (
                        <div key={l.id} className="text-xs px-3 py-1.5 border-b border-border/50 last:border-0 flex justify-between">
                          <span>{l.nome}</span>
                          <span className="text-muted-foreground">{l.telefone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => handleCriar("rascunho")}
                  disabled={!mensagem.trim() || contatosSelecionados.length === 0}>
                  Salvar rascunho
                </Button>
                <Button onClick={() => handleCriar("enviado")}
                  disabled={!mensagem.trim() || contatosSelecionados.length === 0}>
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Registrar envio
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista */}
        {disparos.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-12 text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma campanha criada ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {disparos.map((d) => {
              const status = STATUS_DISPARO[d.status] ?? STATUS_DISPARO.rascunho;
              const totalLista = Array.isArray(d.lista_contatos) ? d.lista_contatos.length : 0;
              return (
                <div key={d.id} className="bg-surface border border-border rounded-lg p-4 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                    <Send className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", status.cor)}>
                        {status.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {format(new Date(d.criado_em), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{d.mensagem}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {totalLista} contatos
                      </span>
                      {d.total_enviados > 0 && (
                        <span className="text-success">
                          ✓ {d.total_enviados} enviados
                        </span>
                      )}
                    </div>
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
