import { useState, useEffect, useMemo } from "react";
import { X, MessageCircle, Phone, DollarSign, Calendar, XCircle, ArrowRightLeft, Archive, Pencil, Plus, Trash2, Settings2, User, UserPlus, Check, FileText } from "lucide-react";
import type { Lead, Funil, Venda } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useFunis, useInteracoes, useUsuarios, useVendasByLead,
  useSalvarAnotacao, useUpdateLeadEtapa, useMarcarPerdido, useUpdateLeadVendedor,
  useArquivarLead, useUpdateLeadCadastro, useUpdateLeadCamposExtras,
  useMotivosPerda, useCriarMotivoPerda, useExcluirMotivoPerda,
  useAtributosPersonalizados, useCriarAtributo, useExcluirAtributo, useRenomearAtributo,
  useAtualizarOpcoesAtributo,
  useUpdateLeadDados, useExcluirLead,
} from "@/hooks/useCrm";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { VendaDialog } from "@/components/vendas/VendaDialog";
import { EmitirContratoDialog } from "@/components/contratos/EmitirContratoDialog";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { STATUS_CADASTRO, type StatusCadastro } from "@/types/crm";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LeadCamposExtras } from "./LeadCamposExtras";
import { FollowUpDialog } from "./FollowUpDialog";
import { DocumentosLead } from "./DocumentosLead";
import { ContatosAdicionais } from "./ContatosAdicionais";

interface Props {
  lead: Lead | null;
  funil: Funil | undefined;
  onClose: () => void;
}

interface InnerProps {
  lead: Lead;
  funil: Funil;
  onClose: () => void;
}

function formatCpf(v: string) {
  const d = (v ?? "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

type TipoConversa = "ligacao" | "whatsapp" | "reuniao" | "email" | "outro";

const TIPOS_CONVERSA_LABEL: Record<string, string> = {
  conversa_ligacao: "Ligação",
  conversa_whatsapp: "WhatsApp",
  conversa_reuniao: "Reunião",
  conversa_email: "Email",
  conversa_outro: "Outro",
};

function tipoConversaLabel(tipo: string) {
  return TIPOS_CONVERSA_LABEL[tipo] ?? tipo;
}

export function LeadPanel({ lead, funil, onClose }: Props) {
  if (!lead || !funil) return null;
  return <LeadPanelInner lead={lead} funil={funil} onClose={onClose} />;
}

function LeadPanelInner({ lead, funil, onClose }: InnerProps) {
  const { data: funis = [] } = useFunis();
  const { data: usuarios = [] } = useUsuarios();
  const { data: interacoes = [] } = useInteracoes(lead.id);
  const { data: vendasLead = [] } = useVendasByLead(lead.id);
  const salvarNota = useSalvarAnotacao();
  const updateEtapa = useUpdateLeadEtapa();
  const updateVendedor = useUpdateLeadVendedor();
  const marcarPerdido = useMarcarPerdido();
  const arquivarLead = useArquivarLead();
  const updateCadastro = useUpdateLeadCadastro();
  const updateDados = useUpdateLeadDados();
  const excluirLead = useExcluirLead();
  const { isCoordenador } = useAuth();

  const [anotacao, setAnotacao] = useState("");
  const [tipoConversa, setTipoConversa] = useState<TipoConversa>("ligacao");
  const [perdaOpen, setPerdaOpen] = useState(false);
  const [vendaOpen, setVendaOpen] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const [contratoOpen, setContratoOpen] = useState(false);

  const { data: motivosPerda = [] } = useMotivosPerda();
  const criarMotivo = useCriarMotivoPerda();
  const excluirMotivo = useExcluirMotivoPerda();
  const [motivo, setMotivo] = useState<string>("");
  const [detalhesPerda, setDetalhesPerda] = useState("");
  const [novoMotivo, setNovoMotivo] = useState("");
  const [gerenciarMotivos, setGerenciarMotivos] = useState(false);
  const [cpfInput, setCpfInput] = useState("");
  const [excluirOpen, setExcluirOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    setAnotacao("");
    setPerdaOpen(false);
    setVendaOpen(false);
    setFollowOpen(false);
    setContratoOpen(false);
    setMotivo("");
  }, [lead.id]);

  useEffect(() => {
    if (!motivo && motivosPerda.length > 0) setMotivo(motivosPerda[0].nome);
  }, [motivosPerda, motivo]);

  useEffect(() => {
    setCpfInput(formatCpf(lead.cpf ?? ""));
  }, [lead.id, lead.cpf]);

  const interacoesConversa = useMemo(
    () => interacoes.filter((i) => i.tipo?.startsWith("conversa_")),
    [interacoes]
  );
  const interacoesSistema = useMemo(
    () => interacoes.filter((i) => !i.tipo?.startsWith("conversa_")),
    [interacoes]
  );

  const handleSalvarConversa = () => {
    if (!anotacao.trim()) return;
    salvarNota.mutate(
      { lead_id: lead.id, conteudo: anotacao.trim(), tipo: `conversa_${tipoConversa}` },
      { onSuccess: () => setAnotacao("") }
    );
  };

  return (
    <>
      {/* Panel */}
      <aside className="fixed inset-0 md:inset-auto md:top-0 md:right-0 md:h-full md:w-[400px] w-full h-[100dvh] bg-surface md:border-l border-border shadow-2xl z-50 flex flex-col">
        <>
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-muted-foreground mb-0.5">#{lead.numero}</div>
                <h2 className="text-base font-semibold leading-tight truncate">{lead.nome}</h2>
                {lead.fazenda && (
                  <p className="text-xs text-muted-foreground truncate">{lead.fazenda}</p>
                )}
                {(() => {
                  const atual = STATUS_CADASTRO.find((x) => x.value === lead.status_cadastro) ?? STATUS_CADASTRO[0];
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            "inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium border hover:opacity-80 transition-opacity",
                            atual.cor
                          )}
                          title="Alterar status do cadastro"
                        >
                          {atual.label}
                          <ArrowRightLeft className="h-2.5 w-2.5 opacity-70" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {STATUS_CADASTRO.map((s) => (
                          <DropdownMenuItem
                            key={s.value}
                            onClick={() =>
                              updateCadastro.mutate({
                                id: lead.id,
                                status_cadastro: s.value as StatusCadastro,
                              })
                            }
                          >
                            {s.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                })()}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="h-7 w-7 shrink-0 rounded-md hover:bg-secondary inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                  title="Editar lead"
                  aria-label="Editar lead"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {isCoordenador && (
                  <button
                    type="button"
                    onClick={() => setExcluirOpen(true)}
                    className="h-7 w-7 shrink-0 rounded-md hover:bg-destructive/10 inline-flex items-center justify-center text-muted-foreground hover:text-destructive"
                    title="Excluir lead"
                    aria-label="Excluir lead"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="h-7 w-7 shrink-0 rounded-md hover:bg-secondary inline-flex items-center justify-center text-muted-foreground"
                  aria-label="Fechar painel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick actions */}
            <div className="px-5 py-3 border-b border-border grid grid-cols-7 gap-1.5">
              <ActionBtn icon={Phone} label="Ligar" onClick={() => {
                if (lead.telefone) window.location.href = `tel:+${lead.telefone.replace(/\D/g, "")}`;
              }} />
              <ActionBtn icon={MessageCircle} label="WhatsApp" onClick={() => {
                if (lead.telefone) window.open(`https://wa.me/${lead.telefone.replace(/\D/g, "")}`);
              }} />
              <ActionBtn icon={DollarSign} label="Venda" onClick={() => setVendaOpen(true)} />
              <ActionBtn icon={FileText} label="Contrato" onClick={() => setContratoOpen(true)} />
              <ActionBtn icon={Calendar} label="Follow" onClick={() => setFollowOpen(true)} />
              <ActionBtn icon={Archive} label="Arquivar" onClick={() => {
                arquivarLead.mutate({ id: lead.id, arquivado: true });
                onClose();
              }} />
              <ActionBtn icon={XCircle} label="Perdido" variant="danger" onClick={() => setPerdaOpen(true)} />
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-5">
                {/* Dados */}
                <Section title="Dados do cliente">
                  <DataRow label="Telefone" value={lead.telefone} />
                  <EmailRow lead={lead} />
                  <div className="flex items-center justify-between gap-3 text-xs py-1">
                    <span className="text-muted-foreground">CPF</span>
                    <Input
                      value={cpfInput}
                      onChange={(e) => setCpfInput(formatCpf(e.target.value))}
                      onBlur={() => {
                        const digits = cpfInput.replace(/\D/g, "");
                        const current = (lead.cpf ?? "").replace(/\D/g, "");
                        if (digits === current) return;
                        if (digits && digits.length !== 11) {
                          setCpfInput(formatCpf(lead.cpf ?? ""));
                          return;
                        }
                        updateCadastro.mutate({ id: lead.id, cpf: digits || null });
                      }}
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      className="h-7 text-xs w-[160px] text-right"
                    />
                  </div>
                  <DataRow label="Localização" value={[lead.cidade, lead.estado].filter(Boolean).join(" / ")} />
                  <DataRow label="Origem" value={lead.origem} />
                  <DataRow label="Interesse" value={lead.interesse} />
                  <DataRow label="Fazenda" value={lead.fazenda} />

                  <TipoProjetoPills lead={lead} />

                  <div className="pt-2 mt-1 border-t border-border/60">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Status do cadastro
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_CADASTRO.map((s) => {
                        const ativo = (lead.status_cadastro ?? "sem_cadastro") === s.value;
                        return (
                          <button
                            key={s.value}
                            onClick={() =>
                              updateCadastro.mutate({ id: lead.id, status_cadastro: s.value as StatusCadastro })
                            }
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border",
                              ativo
                                ? s.cor
                                : "bg-background text-muted-foreground border-border hover:border-primary/50"
                            )}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Section>

                {/* Contatos adicionais */}
                <Section title="Contatos adicionais">
                  <ContatosAdicionais leadId={lead.id} />
                </Section>

                {/* Informações comerciais */}
                <LeadCamposExtras lead={lead} />

                {/* Documentos */}
                <Section title="Documentos">
                  <DocumentosLead leadId={lead.id} />
                </Section>

                {/* Compras do cliente */}
                <Section
                  title={`Compras do cliente${vendasLead.length ? ` (${vendasLead.length})` : ""}`}
                  right={
                    <button
                      onClick={() => setVendaOpen(true)}
                      className="text-[11px] text-primary font-medium hover:underline"
                    >
                      + Nova venda
                    </button>
                  }
                >
                  {vendasLead.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">Nenhuma compra registrada.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {vendasLead.map((v) => (
                        <VendaItem key={v.id} venda={v} canEdit={isCoordenador} />
                      ))}
                      <div className="text-[11px] text-right text-muted-foreground pt-1">
                        Total: <span className="font-semibold text-foreground">
                          {vendasLead.reduce((s, v) => s + Number(v.valor_total), 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  )}
                </Section>

                {/* Vendedor */}
                <Section title="Vendedor responsável">
                  <VendedorCombobox
                    lead={lead}
                    usuarios={usuarios}
                    onPick={(responsavel_id, responsavel_nome) =>
                      updateVendedor.mutate({
                        id: lead.id,
                        responsavel_id,
                        responsavel_nome,
                      })
                    }
                  />
                </Section>

                {/* Etapa */}
                <Section title="Etapa atual" right={
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-[11px] text-primary font-medium flex items-center gap-1 hover:underline">
                        <ArrowRightLeft className="h-3 w-3" /> Mover funil
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {funis.filter(f => f.id !== funil.id).map(f => (
                        <DropdownMenuItem
                          key={f.id}
                          onClick={() => updateEtapa.mutate({
                            id: lead.id, etapa: f.etapas[0], funil_id: f.id,
                          })}
                        >
                          → {f.nome}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                }>
                  <div className="flex flex-wrap gap-1.5">
                    {funil.etapas.map((et) => (
                      <button
                        key={et}
                        onClick={() => updateEtapa.mutate({ id: lead.id, etapa: et })}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border",
                          lead.etapa === et
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50"
                        )}
                      >
                        {et}
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Histórico de conversa com o lead */}
                <Section title="Histórico de conversa com o lead">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select value={tipoConversa} onValueChange={(v) => setTipoConversa(v as TipoConversa)}>
                        <SelectTrigger className="h-8 w-[160px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ligacao">Ligação</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="reuniao">Reunião</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-[10px] text-muted-foreground">
                        Registre o que foi conversado, combinado ou trocado.
                      </span>
                    </div>
                    <Textarea
                      value={anotacao}
                      onChange={(e) => setAnotacao(e.target.value)}
                      placeholder={
                        tipoConversa === "ligacao"
                          ? "Resumo da ligação: o que foi falado, próximos passos..."
                          : tipoConversa === "whatsapp"
                          ? "Cole ou resuma a troca de mensagens no WhatsApp..."
                          : tipoConversa === "reuniao"
                          ? "Resumo da reunião e decisões..."
                          : tipoConversa === "email"
                          ? "Resumo do email enviado/recebido..."
                          : "Resumo da conversa..."
                      }
                      className="min-h-[100px] text-xs resize-none"
                    />
                    <Button size="sm" className="h-8" onClick={handleSalvarConversa} disabled={!anotacao.trim()}>
                      Salvar registro
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {interacoesConversa.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">Nenhuma conversa registrada ainda.</p>
                    ) : (
                      interacoesConversa.slice(0, 30).map((it) => (
                        <div key={it.id} className="border border-border rounded-md p-2 bg-background">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase tracking-wide font-semibold text-primary">
                              {tipoConversaLabel(it.tipo)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(it.criado_em), "dd/MM/yy HH:mm")}
                            </span>
                          </div>
                          <p className="text-xs text-foreground whitespace-pre-wrap leading-snug">{it.conteudo}</p>
                        </div>
                      ))
                    )}
                  </div>
                </Section>

                {/* Histórico de atividades automáticas */}
                <Section title="Histórico de atividades">
                  {interacoesSistema.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">Nenhuma atividade.</p>
                  ) : (
                    <div className="space-y-2">
                      {interacoesSistema.slice(0, 8).map((it) => (
                        <div key={it.id} className="flex gap-2 text-xs">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground leading-snug">{it.conteudo}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(it.criado_em), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              </div>
            </div>

            {/* Modal motivo de perda */}
            <VendaDialog
              open={vendaOpen}
              onOpenChange={setVendaOpen}
              leadId={lead.id}
              clienteNome={lead.nome}
            />

            <FollowUpDialog
              open={followOpen}
              onOpenChange={setFollowOpen}
              lead={lead}
            />

            <EmitirContratoDialog
              open={contratoOpen}
              onOpenChange={setContratoOpen}
              lead={lead}
            />

            <AlertDialog open={excluirOpen} onOpenChange={setExcluirOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {lead.nome} e todo o seu histórico serão removidos permanentemente. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async () => {
                      await excluirLead.mutateAsync(lead.id);
                      setExcluirOpen(false);
                      onClose();
                    }}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <EditarLeadDialog
              open={editOpen}
              onOpenChange={setEditOpen}
              lead={lead}
              onSave={async (campos) => {
                await updateDados.mutateAsync({ id: lead.id, ...campos });
                setEditOpen(false);
              }}
              saving={updateDados.isPending}
            />

            <Dialog open={perdaOpen} onOpenChange={(o) => { setPerdaOpen(o); if (!o) { setGerenciarMotivos(false); setNovoMotivo(""); setDetalhesPerda(""); } }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Motivo da perda</DialogTitle>
                  <DialogDescription>Selecione o motivo pelo qual este lead foi perdido.</DialogDescription>
                </DialogHeader>

                {!gerenciarMotivos ? (
                  <>
                    <div className="space-y-2 py-2 max-h-64 overflow-auto">
                      {motivosPerda.map((m) => (
                        <label key={m.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="radio" name="motivo" value={m.nome}
                            checked={motivo === m.nome}
                            onChange={() => setMotivo(m.nome)}
                          />
                          {m.nome}
                        </label>
                      ))}
                      {motivosPerda.length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhum motivo cadastrado.</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Detalhes (opcional)</label>
                      <Textarea
                        value={detalhesPerda}
                        onChange={(e) => setDetalhesPerda(e.target.value)}
                        placeholder="Escreva mais detalhes sobre o motivo da perda..."
                        rows={3}
                      />
                    </div>

                    {isCoordenador && (
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline self-start"
                        onClick={() => setGerenciarMotivos(true)}
                      >
                        Gerenciar motivos
                      </button>
                    )}

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setPerdaOpen(false)}>Cancelar</Button>
                      <Button
                        variant="destructive"
                        disabled={!motivo}
                        onClick={() => {
                          marcarPerdido.mutate({ id: lead.id, motivo, detalhes: detalhesPerda });
                          setPerdaOpen(false);
                          setDetalhesPerda("");
                          onClose();
                        }}
                      >
                        Confirmar perda
                      </Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <div className="space-y-2 py-2 max-h-64 overflow-auto">
                      {motivosPerda.map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-sm border rounded px-2 py-1">
                          <span>{m.nome}</span>
                          <button
                            type="button"
                            className="text-destructive hover:opacity-70"
                            onClick={() => excluirMotivo.mutate(m.id)}
                            aria-label="Remover motivo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={novoMotivo}
                        onChange={(e) => setNovoMotivo(e.target.value)}
                        placeholder="Novo motivo..."
                      />
                      <Button
                        onClick={() => {
                          const n = novoMotivo.trim();
                          if (!n) return;
                          criarMotivo.mutate(n, { onSuccess: () => setNovoMotivo("") });
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setGerenciarMotivos(false)}>Voltar</Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
        </>
      </aside>
    </>
  );
}

function ActionBtn({
  icon: Icon, label, onClick, variant = "default",
}: { icon: typeof X; label: string; onClick?: () => void; variant?: "default" | "danger" }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 py-2 rounded-md text-[10px] font-medium transition-colors",
        variant === "danger"
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-secondary"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function Section({
  title, children, right,
}: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {right}
      </div>
      {children}
    </div>
  );
}

const TIPOS_PROJETO = ["Faço cria", "Faço recria", "Faço engorda", "Faço seleção genética"] as const;

function TipoProjetoPills({ lead }: { lead: Lead }) {
  const update = useUpdateLeadCamposExtras();
  const extras = (lead.campos_extras ?? {}) as Record<string, string | number | null>;
  const atual = String(extras.tipo_projeto ?? "");

  const selecionar = (valor: string) => {
    const next = { ...extras };
    if (atual === valor) delete next.tipo_projeto;
    else next.tipo_projeto = valor;
    update.mutate({ id: lead.id, campos_extras: next });
  };

  return (
    <div className="pt-2 mt-1 border-t border-border/60">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        Tipo do projeto
      </p>
      <div className="flex flex-wrap gap-1.5">
        {TIPOS_PROJETO.map((t) => {
          const ativo = atual === t;
          return (
            <button
              key={t}
              onClick={() => selecionar(t)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border",
                ativo
                  ? "bg-primary/15 text-primary border-primary/40"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3 text-xs py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium text-right truncate">{value}</span>
    </div>
  );
}

type EditarLeadCampos = {
  nome?: string;
  telefone?: string | null;
  cidade?: string | null;
  estado?: string | null;
  tipo_cliente?: string | null;
  origem?: string | null;
  interesse?: string | null;
  fazenda?: string | null;
};

function EditarLeadDialog({
  open, onOpenChange, lead, onSave, saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead: Lead;
  onSave: (campos: EditarLeadCampos) => Promise<void> | void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    nome: lead.nome ?? "",
    telefone: lead.telefone ?? "",
    cidade: lead.cidade ?? "",
    estado: lead.estado ?? "",
    tipo_cliente: lead.tipo_cliente ?? "",
    origem: lead.origem ?? "",
    interesse: lead.interesse ?? "",
    fazenda: lead.fazenda ?? "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        nome: lead.nome ?? "",
        telefone: lead.telefone ?? "",
        cidade: lead.cidade ?? "",
        estado: lead.estado ?? "",
        tipo_cliente: lead.tipo_cliente ?? "",
        origem: lead.origem ?? "",
        interesse: lead.interesse ?? "",
        fazenda: lead.fazenda ?? "",
      });
    }
  }, [open, lead]);

  const handleSalvar = async () => {
    const nome = form.nome.trim();
    if (!nome) return;
    await onSave({
      nome,
      telefone: form.telefone.trim() || null,
      cidade: form.cidade.trim() || null,
      estado: form.estado.trim() || null,
      tipo_cliente: form.tipo_cliente.trim() || null,
      origem: form.origem.trim() || null,
      interesse: form.interesse.trim() || null,
      fazenda: form.fazenda.trim() || null,
    });
  };

  const Field = ({
    label, value, onChange, placeholder, inputMode,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    inputMode?: "text" | "tel" | "numeric";
  }) => (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="h-8 text-xs"
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar lead</DialogTitle>
          <DialogDescription>Atualize os dados do lead.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="col-span-2">
            <Field label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
          </div>
          <Field label="Telefone" value={form.telefone} onChange={(v) => setForm({ ...form, telefone: v })} placeholder="DDD + número" inputMode="tel" />
          <Field label="Fazenda" value={form.fazenda} onChange={(v) => setForm({ ...form, fazenda: v })} />
          <Field label="Cidade" value={form.cidade} onChange={(v) => setForm({ ...form, cidade: v })} />
          <Field label="Estado" value={form.estado} onChange={(v) => setForm({ ...form, estado: v })} placeholder="UF" />
          <Field label="Tipo de cliente" value={form.tipo_cliente} onChange={(v) => setForm({ ...form, tipo_cliente: v })} />
          <Field label="Origem" value={form.origem} onChange={(v) => setForm({ ...form, origem: v })} />
          <div className="col-span-2">
            <Field label="Interesse" value={form.interesse} onChange={(v) => setForm({ ...form, interesse: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSalvar} disabled={saving || !form.nome.trim()}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VendaItem({ venda, canEdit }: { venda: Venda; canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-background border border-border rounded-md p-2 text-xs group">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium truncate">{venda.categoria}{venda.produto ? ` · ${venda.produto}` : ""}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-semibold text-primary">
            {Number(venda.valor_total).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
          </span>
          {canEdit && (
            <button
              onClick={() => setOpen(true)}
              className="opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
              title="Editar venda"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
        <span>{venda.quantidade} un · {venda.parcelamento_descricao || venda.forma_pagamento || "—"}</span>
        <span>{format(new Date(venda.data_venda ?? venda.criado_em), "dd/MM/yy", { locale: ptBR })}</span>
      </div>
      {canEdit && <VendaDialog open={open} onOpenChange={setOpen} venda={venda} />}
    </div>
  );
}

function EmailRow({ lead }: { lead: Lead }) {
  const update = useUpdateLeadCamposExtras();
  const extras = (lead.campos_extras ?? {}) as Record<string, string | number | null>;
  const emailAtual = String(extras.email ?? "");
  const [valor, setValor] = useState(emailAtual);

  useEffect(() => { setValor(emailAtual); }, [emailAtual, lead.id]);

  const salvar = () => {
    if (valor === emailAtual) return;
    if (valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
      setValor(emailAtual);
      return;
    }
    const next = { ...extras };
    if (valor) next.email = valor;
    else delete next.email;
    update.mutate({ id: lead.id, campos_extras: next });
  };

  return (
    <div className="flex items-center justify-between gap-3 text-xs py-1">
      <span className="text-muted-foreground">Email</span>
      <Input
        type="email"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={salvar}
        placeholder="cliente@exemplo.com"
        className="h-7 text-xs w-[200px] text-right"
      />
    </div>
  );
}

function AtributosPersonalizados({ lead }: { lead: Lead }) {
  const { isCoordenador } = useAuth();
  const { data: catalogo = [] } = useAtributosPersonalizados();
  const criarAttr = useCriarAtributo();
  const excluirAttr = useExcluirAtributo();
  const renomearAttr = useRenomearAtributo();
  const updateExtras = useUpdateLeadCamposExtras();
  const updateOpcoes = useAtualizarOpcoesAtributo();

  const [adicionando, setAdicionando] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const extras = (lead.campos_extras ?? {}) as Record<string, string | number | null>;

  const salvarValor = (chave: string, valor: string) => {
    const next = { ...extras };
    if (valor) next[chave] = valor;
    else delete next[chave];
    updateExtras.mutate({ id: lead.id, campos_extras: next });
  };

  // Atributos legados (existem no lead mas não no catálogo)
  const chavesCatalogo = new Set(catalogo.map((a) => a.chave));
  const legados = Object.keys(extras).filter(
    (k) => k.startsWith("attr_") && !chavesCatalogo.has(k)
  );

  const removerLegado = (k: string) => {
    const next = { ...extras };
    delete next[k];
    updateExtras.mutate({ id: lead.id, campos_extras: next });
  };

  const criar = () => {
    const n = novoNome.trim();
    if (!n) return;
    criarAttr.mutate(
      { label: n },
      {
        onSuccess: () => {
          setNovoNome("");
          setAdicionando(false);
        },
      }
    );
  };

  return (
    <Section
      title="Atributos personalizados"
      right={
        <button
          onClick={() => setAdicionando((v) => !v)}
          className="text-[11px] text-primary font-medium flex items-center gap-1 hover:underline"
        >
          <Plus className="h-3 w-3" /> Novo
        </button>
      }
    >
      {catalogo.length === 0 && legados.length === 0 && !adicionando && (
        <p className="text-[11px] text-muted-foreground italic">
          Nenhum atributo cadastrado. Crie um — ele aparecerá em todos os leads.
        </p>
      )}

      <div className="space-y-1.5">
        {catalogo.map((a) => {
          const opcoes = (a.opcoes ?? []) as string[];
          const valorAtual = String(extras[a.chave] ?? "");
          return (
            <div key={a.id} className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs">
                {editId === a.id ? (
                  <Input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={() => {
                      const v = editLabel.trim();
                      if (v && v !== a.label) renomearAttr.mutate({ id: a.id, label: v });
                      setEditId(null);
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    autoFocus
                    className="h-7 text-xs w-1/3"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => isCoordenador && (setEditId(a.id), setEditLabel(a.label))}
                    className={cn(
                      "text-muted-foreground w-1/3 text-left truncate",
                      isCoordenador && "hover:text-foreground"
                    )}
                    title={isCoordenador ? "Renomear" : a.label}
                  >
                    {a.label}
                  </button>
                )}
                <Input
                  defaultValue={valorAtual}
                  key={a.chave + valorAtual}
                  onBlur={(e) => {
                    if (e.target.value !== valorAtual) salvarValor(a.chave, e.target.value);
                  }}
                  className="h-7 text-xs flex-1"
                  placeholder="—"
                />
                {isCoordenador && (
                  <OpcoesAtributoPopover
                    atributo={a}
                    onSave={(novas) => updateOpcoes.mutate({ id: a.id, opcoes: novas })}
                  />
                )}
                {isCoordenador && (
                  <button
                    onClick={() => {
                      if (confirm(`Remover o atributo "${a.label}" de todos os leads?`)) {
                        excluirAttr.mutate(a.id);
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive"
                    title="Remover do catálogo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              {opcoes.length > 0 && (
                <div className="flex flex-wrap gap-1 pl-[33%]">
                  {opcoes.map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => salvarValor(a.chave, valorAtual === op ? "" : op)}
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded border transition",
                        valorAtual === op
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 border-border hover:bg-muted"
                      )}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {legados.length > 0 && (
          <div className="pt-2 mt-1 border-t border-dashed border-border space-y-1">
            <p className="text-[10px] text-muted-foreground">Atributos antigos deste lead:</p>
            {legados.map((k) => (
              <div key={k} className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground capitalize w-1/3 truncate">
                  {k.replace(/^attr_/, "").replace(/_/g, " ")}
                </span>
                <Input
                  defaultValue={String(extras[k] ?? "")}
                  onBlur={(e) => salvarValor(k, e.target.value)}
                  className="h-7 text-xs flex-1"
                />
                <button
                  onClick={() => removerLegado(k)}
                  className="text-muted-foreground hover:text-destructive"
                  title="Remover deste lead"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {adicionando && (
        <div className="flex gap-1.5 mt-2">
          <Input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome do atributo (ex: Orçamento)"
            className="h-7 text-xs flex-1"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") criar(); }}
          />
          <Button size="sm" className="h-7 px-2 text-[11px]" onClick={criar} disabled={criarAttr.isPending}>
            Criar
          </Button>
        </div>
      )}
      {adicionando && (
        <p className="text-[10px] text-muted-foreground mt-1">
          Esse atributo aparecerá em <strong>todos os leads</strong>.
        </p>
      )}
    </Section>
  );
}

function OpcoesAtributoPopover({
  atributo,
  onSave,
}: {
  atributo: { id: string; label: string; opcoes?: string[] };
  onSave: (opcoes: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [opcoes, setOpcoes] = useState<string[]>(atributo.opcoes ?? []);
  const [nova, setNova] = useState("");

  useEffect(() => {
    if (open) setOpcoes(atributo.opcoes ?? []);
  }, [open, atributo.opcoes]);

  const adicionar = () => {
    const v = nova.trim();
    if (!v || opcoes.includes(v)) return;
    setOpcoes([...opcoes, v]);
    setNova("");
  };

  const remover = (i: number) => setOpcoes(opcoes.filter((_, idx) => idx !== i));

  const salvar = () => {
    onSave(opcoes);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="text-muted-foreground hover:text-foreground"
          title="Respostas rápidas"
        >
          <Settings2 className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <p className="text-[11px] font-semibold mb-1.5">Respostas rápidas — {atributo.label}</p>
        <p className="text-[10px] text-muted-foreground mb-2">
          Aparecem como botões clicáveis para todos os vendedores.
        </p>
        <div className="space-y-1 mb-2 max-h-40 overflow-y-auto">
          {opcoes.length === 0 && (
            <p className="text-[10px] text-muted-foreground italic">Nenhuma opção ainda.</p>
          )}
          {opcoes.map((op, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs bg-muted/40 rounded px-2 py-1">
              <span className="flex-1 truncate">{op}</span>
              <button onClick={() => remover(i)} className="text-muted-foreground hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mb-2">
          <Input
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionar(); } }}
            placeholder="Nova opção"
            className="h-7 text-xs"
          />
          <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={adicionar}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <Button size="sm" className="w-full h-7 text-[11px]" onClick={salvar}>
          Salvar
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function VendedorCombobox({
  lead,
  usuarios,
  onPick,
}: {
  lead: Lead;
  usuarios: { id: string; nome: string }[];
  onPick: (responsavel_id: string | null, responsavel_nome: string | null) => void;
}) {
  const currentName = lead.responsavel_id
    ? usuarios.find((u) => u.id === lead.responsavel_id)?.nome ?? "Usuário removido"
    : lead.responsavel_nome ?? "";
  const isExterno = !lead.responsavel_id && !!lead.responsavel_nome;

  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!editing) setQuery("");
  }, [editing, lead.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) => u.nome.toLowerCase().includes(q));
  }, [usuarios, query]);

  const exactMatch = usuarios.find(
    (u) => u.nome.toLowerCase() === query.trim().toLowerCase()
  );

  const initials = (currentName || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  if (!editing) {
    if (!currentName) {
      return (
        <button
          onClick={() => setEditing(true)}
          className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-dashed border-border hover:border-primary/60 hover:bg-accent/40 transition-colors text-left group"
        >
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <UserPlus className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">Atribuir responsável</p>
            <p className="text-[10px] text-muted-foreground">
              Escolha um vendedor ou digite um nome
            </p>
          </div>
        </button>
      );
    }
    return (
      <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-accent/30">
        <div
          className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0",
            isExterno
              ? "bg-warning/20 text-warning border border-warning/30"
              : "bg-primary/15 text-primary border border-primary/25"
          )}
        >
          {initials || <User className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{currentName}</p>
          <p className="text-[10px] text-muted-foreground">
            {isExterno ? "Externo (não cadastrado)" : "Vendedor cadastrado"}
          </p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="h-7 w-7 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground"
          title="Alterar responsável"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background p-2 space-y-1.5">
      <div className="flex gap-1.5">
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const v = query.trim();
              if (!v) return;
              if (exactMatch) onPick(exactMatch.id, null);
              else onPick(null, v);
              setEditing(false);
            }
            if (e.key === "Escape") setEditing(false);
          }}
          placeholder="Buscar ou digitar nome..."
          className="h-8 text-xs flex-1"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => setEditing(false)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="max-h-44 overflow-y-auto space-y-0.5">
        {currentName && (
          <button
            type="button"
            onClick={() => {
              onPick(null, null);
              setEditing(false);
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-accent text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" /> Remover responsável
          </button>
        )}
        {filtered.map((u) => {
          const isCurrent = u.id === lead.responsavel_id;
          const inits = u.nome.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("");
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                onPick(u.id, null);
                setEditing(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-accent"
            >
              <span className="h-6 w-6 rounded-full bg-primary/15 text-primary text-[10px] font-semibold flex items-center justify-center shrink-0">
                {inits}
              </span>
              <span className="flex-1 truncate text-left">{u.nome}</span>
              {isCurrent && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          );
        })}
        {query.trim() && !exactMatch && (
          <button
            type="button"
            onClick={() => {
              const v = query.trim();
              onPick(null, v);
              setEditing(false);
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-accent border-t border-border mt-1 pt-2"
          >
            <span className="h-6 w-6 rounded-full bg-warning/20 text-warning border border-warning/30 flex items-center justify-center shrink-0">
              <UserPlus className="h-3 w-3" />
            </span>
            <span className="flex-1 truncate text-left">
              Usar <span className="font-semibold">"{query.trim()}"</span>{" "}
              <span className="text-muted-foreground">(externo)</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
