import { useMemo, useState } from "react";
import {
  useTodosLeads, useFunis, useUsuarios,
  useArquivarLead, useMoverLeadParaFunil, useCriarDisparo,
} from "@/hooks/useCrm";
import type { Lead } from "@/types/crm";
import { STATUS_CADASTRO } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, ArrowRightLeft, MessageCircle, Send, Undo2, Filter, Download } from "lucide-react";
import * as XLSX from "xlsx";
import type { Funil, Usuario } from "@/types/crm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { LeadPanel } from "@/components/funis/LeadPanel";

const ALL = "__all__";

export default function BancoContatosPage() {
  const { data: leads = [], isLoading } = useTodosLeads();
  const { data: funis = [] } = useFunis();
  const { data: usuarios = [] } = useUsuarios();
  const arquivar = useArquivarLead();
  const mover = useMoverLeadParaFunil();
  const criarDisparo = useCriarDisparo();

  const [busca, setBusca] = useState("");
  const [funilFiltro, setFunilFiltro] = useState<string>(ALL);
  const [etapaFiltro, setEtapaFiltro] = useState<string>(ALL);
  const [vendedorFiltro, setVendedorFiltro] = useState<string>(ALL);
  const [statusFiltro, setStatusFiltro] = useState<string>(ALL); // ativo|arquivado|perdido
  const [cadastroFiltro, setCadastroFiltro] = useState<string>(ALL);
  const [estadoFiltro, setEstadoFiltro] = useState<string>(ALL);
  const [tipoFiltro, setTipoFiltro] = useState<string>(ALL);
  const [interesseFiltro, setInteresseFiltro] = useState<string>("");

  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [moverOpen, setMoverOpen] = useState(false);
  const [moverFunilId, setMoverFunilId] = useState<string>("");
  const [moverEtapa, setMoverEtapa] = useState<string>("");
  const [disparoOpen, setDisparoOpen] = useState(false);
  const [disparoMsg, setDisparoMsg] = useState("");
  const [leadAberto, setLeadAberto] = useState<Lead | null>(null);
  const funilDoLead = useMemo(
    () => (leadAberto ? funis.find((f) => f.id === leadAberto.funil_id) ?? null : null),
    [funis, leadAberto]
  );

  const estados = useMemo(
    () => Array.from(new Set(leads.map((l) => l.estado).filter(Boolean))).sort() as string[],
    [leads]
  );
  const tipos = useMemo(
    () => Array.from(new Set(leads.map((l) => l.tipo_cliente).filter(Boolean))).sort() as string[],
    [leads]
  );

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const i = interesseFiltro.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFiltro === "arquivado" && !l.arquivado) return false;
      if (statusFiltro === "perdido" && l.etapa !== "Perdido") return false;
      if (statusFiltro === "ativo" && (l.arquivado || l.etapa === "Perdido")) return false;
      if (cadastroFiltro !== ALL && l.status_cadastro !== cadastroFiltro) return false;
      if (funilFiltro !== ALL && l.funil_id !== funilFiltro) return false;
      if (etapaFiltro !== ALL && l.etapa !== etapaFiltro) return false;
      if (vendedorFiltro !== ALL && l.responsavel_id !== vendedorFiltro) return false;
      if (estadoFiltro !== ALL && l.estado !== estadoFiltro) return false;
      if (tipoFiltro !== ALL && l.tipo_cliente !== tipoFiltro) return false;
      if (i && !(l.interesse?.toLowerCase().includes(i))) return false;
      if (q) {
        const hay = `${l.nome} ${l.fazenda ?? ""} ${l.telefone ?? ""} ${l.cidade ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, busca, statusFiltro, cadastroFiltro, funilFiltro, etapaFiltro, vendedorFiltro, estadoFiltro, tipoFiltro, interesseFiltro]);

  const etapasDisponiveis = useMemo(() => {
    if (funilFiltro === ALL) return [];
    return funis.find((f) => f.id === funilFiltro)?.etapas ?? [];
  }, [funis, funilFiltro]);

  const toggleSel = (id: string) => {
    setSelecionados((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const toggleTodos = () => {
    setSelecionados((s) => {
      if (s.size === filtrados.length) return new Set();
      return new Set(filtrados.map((l) => l.id));
    });
  };

  const selecionadosArr = filtrados.filter((l) => selecionados.has(l.id));
  const funilSelecionado = funis.find((f) => f.id === moverFunilId);

  const onMoverConfirmar = async () => {
    if (!moverFunilId || !moverEtapa) {
      toast.error("Escolha funil e etapa");
      return;
    }
    await mover.mutateAsync({
      ids: Array.from(selecionados),
      funil_id: moverFunilId,
      etapa: moverEtapa,
    });
    setSelecionados(new Set());
    setMoverOpen(false);
    setMoverFunilId("");
    setMoverEtapa("");
  };

  const onWhatsappMassa = () => {
    const comTel = selecionadosArr.filter((l) => l.telefone);
    if (!comTel.length) {
      toast.error("Nenhum selecionado tem telefone");
      return;
    }
    if (comTel.length > 5) {
      toast.info(`Abrindo apenas os 5 primeiros (${comTel.length} selecionados). Para envio em massa real, use Disparos.`);
    }
    comTel.slice(0, 5).forEach((l, i) => {
      setTimeout(() => {
        window.open(`https://wa.me/${l.telefone!.replace(/\D/g, "")}`, "_blank");
      }, i * 250);
    });
  };

  const onCriarDisparo = async () => {
    if (!disparoMsg.trim()) {
      toast.error("Escreva a mensagem");
      return;
    }
    const lista = selecionadosArr
      .filter((l) => l.telefone)
      .map((l) => ({ lead_id: l.id, nome: l.nome, telefone: l.telefone! }));
    if (!lista.length) {
      toast.error("Nenhum selecionado tem telefone");
      return;
    }
    await criarDisparo.mutateAsync({
      mensagem: disparoMsg.trim(),
      lista_contatos: lista,
      status: "rascunho",
    });
    setDisparoOpen(false);
    setDisparoMsg("");
    setSelecionados(new Set());
  };

  const onDesarquivar = (l: Lead) => {
    arquivar.mutate({ id: l.id, arquivado: false });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="h-14 shrink-0 border-b border-border bg-surface flex items-center px-5 gap-3">
        <h1 className="text-base font-semibold tracking-tight">Banco de Contatos</h1>
        <Badge variant="secondary" className="text-[10px]"><span>{`${filtrados.length} de 10.000`}</span></Badge>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 ml-2" onClick={() => exportarExcel(filtrados, funis, usuarios)}>
          <Download className="h-3.5 w-3.5" /> Exportar Excel
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {selecionados.size > 0 && (
            <>
              <span className="text-xs text-muted-foreground">{selecionados.size} selecionado(s)</span>
              <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onWhatsappMassa}>
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </Button>
              <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setDisparoOpen(true)}>
                <Send className="h-3.5 w-3.5" /> Disparo
              </Button>
              <Button size="sm" className="h-8 gap-1.5" onClick={() => setMoverOpen(true)}>
                <ArrowRightLeft className="h-3.5 w-3.5" /> Mover para funil
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Filtros */}
      <div className="px-5 py-3 border-b border-border bg-surface flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nome, fazenda, telefone, cidade..."
            className="h-9 pl-8 text-sm"
          />
        </div>
        <FilterSelect value={statusFiltro} onChange={setStatusFiltro} placeholder="Status"
          options={[{ v: "ativo", l: "Ativos" }, { v: "arquivado", l: "Arquivados" }, { v: "perdido", l: "Perdidos" }]} />
        <FilterSelect value={cadastroFiltro} onChange={setCadastroFiltro} placeholder="Cadastro"
          options={STATUS_CADASTRO.map((s) => ({ v: s.value, l: s.label }))} />
        <FilterSelect value={funilFiltro} onChange={(v) => { setFunilFiltro(v); setEtapaFiltro(ALL); }} placeholder="Funil"
          options={funis.map((f) => ({ v: f.id, l: f.nome }))} />
        {funilFiltro !== ALL && etapasDisponiveis.length > 0 && (
          <FilterSelect value={etapaFiltro} onChange={setEtapaFiltro} placeholder="Etapa"
            options={etapasDisponiveis.map((e) => ({ v: e, l: e }))} />
        )}
        <FilterSelect value={vendedorFiltro} onChange={setVendedorFiltro} placeholder="Vendedor"
          options={usuarios.map((u) => ({ v: u.id, l: u.nome }))} />
        <FilterSelect value={estadoFiltro} onChange={setEstadoFiltro} placeholder="Estado"
          options={estados.map((e) => ({ v: e, l: e }))} />
        <FilterSelect value={tipoFiltro} onChange={setTipoFiltro} placeholder="Tipo"
          options={tipos.map((t) => ({ v: t, l: t }))} />
        <Input
          value={interesseFiltro}
          onChange={(e) => setInteresseFiltro(e.target.value)}
          placeholder="Interesse contém..."
          className="h-9 w-44 text-sm"
        />
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <p className="p-5 text-sm text-muted-foreground">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <Filter className="h-6 w-6 mx-auto mb-2 opacity-40" />
            Nenhum contato no banco com esses filtros.
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-surface z-10">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selecionados.size > 0 && selecionados.size === filtrados.length}
                    onCheckedChange={toggleTodos}
                  />
                </TableHead>
                <TableHead>Nome / Fazenda</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Interesse</TableHead>
                <TableHead>Funil origem</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Arquivado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((l) => {
                const funil = funis.find((f) => f.id === l.funil_id);
                const vend = usuarios.find((u) => u.id === l.responsavel_id);
                const isPerdido = l.etapa === "Perdido";
                return (
                  <TableRow
                    key={l.id}
                    data-state={selecionados.has(l.id) ? "selected" : undefined}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setLeadAberto(l)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selecionados.has(l.id)}
                        onCheckedChange={() => toggleSel(l.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">#{l.numero} {l.nome}</div>
                      {l.fazenda && <div className="text-[11px] text-muted-foreground">{l.fazenda}</div>}
                    </TableCell>
                    <TableCell className="text-xs">{l.telefone ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {[l.cidade, l.estado].filter(Boolean).join(" / ") || "—"}
                    </TableCell>
                    <TableCell className="text-xs">{l.tipo_cliente ?? "—"}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate" title={l.interesse ?? ""}>
                      {l.interesse ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">{funil?.nome ?? "—"}</TableCell>
                    <TableCell className="text-xs">{vend?.nome ?? "—"}</TableCell>
                    <TableCell>
                      {isPerdido ? (
                        <Badge variant="destructive" className="text-[10px]">Perdido</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Arquivado</Badge>
                      )}
                      {isPerdido && l.motivo_perda && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">{l.motivo_perda}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      {l.arquivado_em ? format(new Date(l.arquivado_em), "dd/MM/yy", { locale: ptBR }) : "—"}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {l.arquivado && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1"
                          onClick={() => onDesarquivar(l)}>
                          <Undo2 className="h-3 w-3" /> Desarquivar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal mover para funil */}
      <Dialog open={moverOpen} onOpenChange={setMoverOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mover {selecionados.size} contato(s) para funil</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Funil</label>
              <Select value={moverFunilId} onValueChange={(v) => { setMoverFunilId(v); setMoverEtapa(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione um funil" /></SelectTrigger>
                <SelectContent>
                  {funis.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Etapa inicial</label>
              <Select value={moverEtapa} onValueChange={setMoverEtapa} disabled={!funilSelecionado}>
                <SelectTrigger><SelectValue placeholder={funilSelecionado ? "Selecione" : "Escolha o funil primeiro"} /></SelectTrigger>
                <SelectContent>
                  {funilSelecionado?.etapas.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoverOpen(false)}>Cancelar</Button>
            <Button onClick={onMoverConfirmar} disabled={mover.isPending}>
              {mover.isPending ? "Movendo..." : "Mover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal disparo */}
      <Dialog open={disparoOpen} onOpenChange={setDisparoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar disparo para {selecionados.size} contato(s)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Será criada uma campanha em rascunho na página Disparos com os contatos selecionados que possuem telefone.
            </p>
            <Textarea
              value={disparoMsg}
              onChange={(e) => setDisparoMsg(e.target.value)}
              placeholder="Mensagem do disparo..."
              className="min-h-[120px] text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisparoOpen(false)}>Cancelar</Button>
            <Button onClick={onCriarDisparo} disabled={criarDisparo.isPending}>
              {criarDisparo.isPending ? "Criando..." : "Criar campanha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LeadPanel
        lead={leadAberto}
        funil={funilDoLead}
        onClose={() => setLeadAberto(null)}
      />
    </div>
  );
}

function FilterSelect({
  value, onChange, options, placeholder,
}: {
  value: string; onChange: (v: string) => void; placeholder: string;
  options: { v: string; l: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[160px] text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>Todos · {placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function exportarExcel(leads: Lead[], funis: Funil[], usuarios: Usuario[]) {
  const funilMap = new Map(funis.map((f) => [f.id, f.nome]));
  const userMap = new Map(usuarios.map((u) => [u.id, u.nome]));
  const cadastroLabel: Record<string, string> = {
    sem_cadastro: "Sem cadastro",
    aprovado: "Aprovado",
    reprovado: "Reprovado",
  };

  // Coleta todas as chaves de campos_extras
  const extraKeys = new Set<string>();
  leads.forEach((l) => Object.keys(l.campos_extras ?? {}).forEach((k) => extraKeys.add(k)));

  const rows = leads.map((l) => {
    const base: Record<string, unknown> = {
      Numero: l.numero,
      Nome: l.nome,
      Fazenda: l.fazenda ?? "",
      Telefone: l.telefone ?? "",
      CPF: l.cpf ?? "",
      Cidade: l.cidade ?? "",
      Estado: l.estado ?? "",
      Tipo: l.tipo_cliente ?? "",
      Origem: l.origem ?? "",
      Interesse: l.interesse ?? "",
      Funil: funilMap.get(l.funil_id ?? "") ?? "",
      Etapa: l.etapa ?? "",
      Vendedor: userMap.get(l.responsavel_id ?? "") ?? "",
      Cadastro: cadastroLabel[l.status_cadastro] ?? l.status_cadastro,
      Status: l.arquivado ? "Arquivado" : l.etapa === "Perdido" ? "Perdido" : "Ativo",
      MotivoPerda: l.motivo_perda ?? "",
      Observacoes: l.observacoes ?? "",
      CriadoEm: l.criado_em ? format(new Date(l.criado_em), "dd/MM/yyyy") : "",
      UltimoContato: l.ultimo_contato ? format(new Date(l.ultimo_contato), "dd/MM/yyyy") : "",
    };
    extraKeys.forEach((k) => {
      base[`extra_${k}`] = (l.campos_extras as Record<string, unknown>)?.[k] ?? "";
    });
    return base;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Contatos");
  XLSX.writeFile(wb, `contatos-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  toast.success(`${rows.length} contatos exportados`);
}
