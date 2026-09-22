import { useState, useMemo } from "react";
import { Plus, DollarSign, Package, Filter, BarChart3, Pencil, CalendarIcon, X, Percent, Trash2, FileSignature } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useVendas, useUpdateVendaPagamento, useUpdateVendaComissao, useDeleteVenda, useTodosLeads, useUsuarios, useFunis } from "@/hooks/useCrm";
import { CATEGORIAS_VENDA, FORMAS_PAGAMENTO, TIPOS_PARCELAMENTO, type Venda, type Lead } from "@/types/crm";
import { VendaDialog } from "@/components/vendas/VendaDialog";
import { ContratoDialog } from "@/components/contratos/ContratoDialog";
import { LeadPanel } from "@/components/funis/LeadPanel";
import { useAuth } from "@/hooks/auth-context";
import {
  format, startOfDay, endOfDay, startOfMonth, endOfMonth,
  subDays, subMonths, startOfYear, endOfYear, isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type PeriodoModo =
  | "todos" | "hoje" | "7d" | "30d"
  | "mes_atual" | "mes_passado" | "ano_atual"
  | "mes" | "ano" | "range";

const MESES_PT = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];


export default function VendasPage() {
  const { data: vendas = [] } = useVendas();
  const { data: leads = [] } = useTodosLeads();
  const { data: usuarios = [] } = useUsuarios();
  const { data: funis = [] } = useFunis();
  const { isCoordenador } = useAuth();

  const leadById = useMemo(() => {
    const m = new Map<string, typeof leads[number]>();
    for (const l of leads) m.set(l.id, l);
    return m;
  }, [leads]);
  const userById = useMemo(() => {
    const m = new Map<string, typeof usuarios[number]>();
    for (const u of usuarios) m.set(u.id, u);
    return m;
  }, [usuarios]);

  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [busca, setBusca] = useState("");
  const hoje = new Date();
  const [periodo, setPeriodo] = useState<PeriodoModo>("todos");
  const [mesEsp, setMesEsp] = useState<number>(hoje.getMonth());
  const [anoEsp, setAnoEsp] = useState<number>(hoje.getFullYear());
  const [dataDe, setDataDe] = useState<Date | undefined>();
  const [dataAte, setDataAte] = useState<Date | undefined>();
  const [leadAberto, setLeadAberto] = useState<Lead | null>(null);
  const funilDoLead = useMemo(
    () => (leadAberto ? funis.find((f) => f.id === leadAberto.funil_id) : undefined),
    [leadAberto, funis]
  );

  const anosDisponiveis = useMemo(() => {
    const set = new Set<number>([new Date().getFullYear()]);
    for (const v of vendas) set.add(new Date(v.data_venda ?? v.criado_em).getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [vendas]);

  const intervaloAtivo = useMemo<{ start: Date; end: Date } | null>(() => {
    const ref = new Date();
    switch (periodo) {
      case "todos": return null;
      case "hoje": return { start: startOfDay(ref), end: endOfDay(ref) };
      case "7d": return { start: startOfDay(subDays(ref, 6)), end: endOfDay(ref) };
      case "30d": return { start: startOfDay(subDays(ref, 29)), end: endOfDay(ref) };
      case "mes_atual": return { start: startOfMonth(ref), end: endOfMonth(ref) };
      case "mes_passado": {
        const m = subMonths(ref, 1);
        return { start: startOfMonth(m), end: endOfMonth(m) };
      }
      case "ano_atual": return { start: startOfYear(ref), end: endOfYear(ref) };
      case "mes": {
        const d = new Date(anoEsp, mesEsp, 1);
        return { start: startOfMonth(d), end: endOfMonth(d) };
      }
      case "ano": {
        const d = new Date(anoEsp, 0, 1);
        return { start: startOfYear(d), end: endOfYear(d) };
      }
      case "range":
        if (dataDe && dataAte) return { start: startOfDay(dataDe), end: endOfDay(dataAte) };
        if (dataDe) return { start: startOfDay(dataDe), end: endOfDay(dataDe) };
        return null;
    }
  }, [periodo, mesEsp, anoEsp, dataDe, dataAte]);

  const periodoLabel = useMemo(() => {
    if (!intervaloAtivo) return "Todo o histórico";
    if (periodo === "hoje") return "Hoje";
    if (periodo === "7d") return "Últimos 7 dias";
    if (periodo === "30d") return "Últimos 30 dias";
    if (periodo === "mes_atual") return format(intervaloAtivo.start, "MMMM 'de' yyyy", { locale: ptBR });
    if (periodo === "mes_passado") return format(intervaloAtivo.start, "MMMM 'de' yyyy", { locale: ptBR });
    if (periodo === "ano_atual" || periodo === "ano") return String(intervaloAtivo.start.getFullYear());
    if (periodo === "mes") return `${MESES_PT[mesEsp]}/${anoEsp}`;
    if (periodo === "range") {
      const s = format(intervaloAtivo.start, "dd/MM/yy", { locale: ptBR });
      const e = format(intervaloAtivo.end, "dd/MM/yy", { locale: ptBR });
      return `${s} – ${e}`;
    }
    return "";
  }, [intervaloAtivo, periodo, mesEsp, anoEsp]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return vendas.filter((v) => {
      if (filtroCategoria !== "todas" && v.categoria !== filtroCategoria) return false;
      if (q) {
        const lead = v.lead_id ? leadById.get(v.lead_id) : null;
        const vendedorNome = v.vendedor_id ? userById.get(v.vendedor_id)?.nome ?? "" : (v.vendedor_externo ?? "");
        const hay = [
          v.cliente_nome,
          v.produto ?? "",
          lead?.telefone ?? "",
          lead?.fazenda ?? "",
          v.fazenda_fornecedor ?? "",
          vendedorNome,
        ].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (intervaloAtivo) {
        const d = new Date(v.data_venda ?? v.criado_em);
        if (!isWithinInterval(d, intervaloAtivo)) return false;
      }
      return true;
    });
  }, [vendas, filtroCategoria, busca, intervaloAtivo, leadById, userById]);

  const stats = useMemo(() => {
    const total = filtradas.reduce((s, v) => s + Number(v.valor_total), 0);
    const qtd = filtradas.reduce((s, v) => s + v.quantidade, 0);
    const ticket = filtradas.length > 0 ? total / filtradas.length : 0;
    let comissaoTotal = 0;
    let somaPct = 0;
    let nComPct = 0;
    for (const v of filtradas) {
      const pct = v.comissao_percentual ? Number(v.comissao_percentual) : 0;
      if (pct > 0) {
        comissaoTotal += (Number(v.valor_total) * pct) / 100;
        somaPct += pct;
        nComPct++;
      }
    }
    const mediaPct = nComPct > 0 ? somaPct / nComPct : 0;
    return { total, qtd, ticket, n: filtradas.length, comissaoTotal, mediaPct, nComPct };
  }, [filtradas]);

  const porCategoria = useMemo(() => {
    const map = new Map<string, { categoria: string; total: number; qtd: number; n: number }>();
    for (const v of filtradas) {
      const cur = map.get(v.categoria) ?? { categoria: v.categoria, total: 0, qtd: 0, n: 0 };
      cur.total += Number(v.valor_total);
      cur.qtd += v.quantidade;
      cur.n += 1;
      map.set(v.categoria, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtradas]);

  const maxCat = porCategoria[0]?.total ?? 0;

  return (
    <>
      <Topbar
        title="Vendas"
        actions={
          <VendaDialog
            trigger={
              <Button size="sm" className="h-9 gap-1.5">
                <Plus className="h-4 w-4" /> Lançar nova venda
              </Button>
            }
          />
        }
      />
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi icon={DollarSign} label="Faturamento" value={fmtBRL(stats.total)} sub={`${stats.n} vendas · ${periodoLabel}`} />
          <Kpi icon={BarChart3} label="Ticket médio" value={fmtBRL(stats.ticket)} sub={periodoLabel} />
          <Kpi icon={Package} label="Quantidade" value={String(stats.qtd)} sub={`Animais/itens · ${periodoLabel}`} />
          <Kpi
            icon={Percent}
            label="Comissão total"
            value={fmtBRL(stats.comissaoTotal)}
            sub={stats.nComPct > 0 ? `Média ${stats.mediaPct.toFixed(1)}% · ${stats.nComPct} ${stats.nComPct === 1 ? "venda" : "vendas"}` : "Sem comissão informada"}
          />
        </div>

        {/* Faturamento por produto/categoria */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Faturamento por produto</h2>
          </div>
          {porCategoria.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma venda no período.</p>
          ) : (
            <div className="space-y-2">
              {porCategoria.map((c) => {
                const pct = maxCat > 0 ? (c.total / maxCat) * 100 : 0;
                const pctTotal = stats.total > 0 ? (c.total / stats.total) * 100 : 0;
                return (
                  <div key={c.categoria} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{c.categoria}</span>
                      <span className="text-muted-foreground">
                        {c.n} {c.n === 1 ? "venda" : "vendas"} · {c.qtd} un · <span className="text-foreground font-semibold">{fmtBRL(c.total)}</span> ({pctTotal.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Filtros + ação */}
        {/* Filtros + ação */}
        <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-2 bg-surface border border-border rounded-lg p-3">
          <div className="hidden sm:flex items-center">
            <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          </div>
          <Input
            placeholder="Buscar nome, telefone, fazenda, vendedor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-8 w-full sm:w-64 text-xs"
          />
          <Select value={periodo} onValueChange={(v: PeriodoModo) => setPeriodo(v)}>
            <SelectTrigger className="h-8 w-full sm:w-44 text-xs"><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo o histórico</SelectItem>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="mes_atual">Este mês</SelectItem>
              <SelectItem value="mes_passado">Mês passado</SelectItem>
              <SelectItem value="ano_atual">Este ano</SelectItem>
              <SelectItem value="mes">Mês específico…</SelectItem>
              <SelectItem value="ano">Ano específico…</SelectItem>
              <SelectItem value="range">Intervalo personalizado…</SelectItem>
            </SelectContent>
          </Select>

          {periodo === "mes" && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={String(mesEsp)} onValueChange={(v) => setMesEsp(Number(v))}>
                <SelectTrigger className="h-8 w-full sm:w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MESES_PT.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(anoEsp)} onValueChange={(v) => setAnoEsp(Number(v))}>
                <SelectTrigger className="h-8 w-full sm:w-24 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {anosDisponiveis.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {periodo === "ano" && (
            <Select value={String(anoEsp)} onValueChange={(v) => setAnoEsp(Number(v))}>
              <SelectTrigger className="h-8 w-full sm:w-24 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {anosDisponiveis.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {periodo === "range" && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-auto"><DateBtn label="De" date={dataDe} onChange={setDataDe} /></div>
              <div className="w-full sm:w-auto"><DateBtn label="Até" date={dataAte} onChange={setDataAte} /></div>
            </div>
          )}

          {periodo !== "todos" && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1 w-full sm:w-auto justify-start sm:justify-center"
              onClick={() => { setPeriodo("todos"); setDataDe(undefined); setDataAte(undefined); }}>
              <X className="h-3 w-3" /> Limpar data
            </Button>
          )}

          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="h-8 w-full sm:w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas categorias</SelectItem>
              {CATEGORIAS_VENDA.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Data</TableHead>
                <TableHead className="text-xs">Cliente</TableHead>
                <TableHead className="text-xs">Categoria</TableHead>
                <TableHead className="text-xs">Produto</TableHead>
                <TableHead className="text-xs text-right">Qtd</TableHead>
                <TableHead className="text-xs text-right">Valor</TableHead>
                <TableHead className="text-xs">Comissão</TableHead>
                <TableHead className="text-xs">Vendedor</TableHead>
                <TableHead className="text-xs">Pagamento</TableHead>
                {isCoordenador && <TableHead className="text-xs w-20"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isCoordenador ? 10 : 9} className="text-center text-muted-foreground text-xs py-8">
                    Nenhuma venda encontrada.
                  </TableCell>
                </TableRow>
              )}
              {filtradas.map((v) => (
                <TableRow
                  key={v.id}
                  className="text-xs cursor-pointer hover:bg-muted/40"
                  onClick={() => {
                    const l = v.lead_id ? leadById.get(v.lead_id) : null;
                    if (l) setLeadAberto(l);
                  }}
                >
                  <TableCell>{format(new Date(v.data_venda ?? v.criado_em), "dd/MM/yy", { locale: ptBR })}</TableCell>
                  <TableCell className="font-medium">
                    <span className={v.lead_id ? "underline decoration-dotted underline-offset-2" : ""}>
                      {v.cliente_nome}
                    </span>
                  </TableCell>
                  <TableCell>{v.categoria}</TableCell>
                  <TableCell className="text-muted-foreground">{v.produto ?? "—"}</TableCell>
                  <TableCell className="text-right">{v.quantidade}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtBRL(Number(v.valor_total))}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <ComissaoCell venda={v} />
                  </TableCell>
                  <TableCell className="text-xs">
                    {(() => {
                      const tipo = v.tipo_vendedor ?? "interno";
                      if (tipo === "interno") {
                        return v.vendedor_id ? (userById.get(v.vendedor_id)?.nome ?? "—") : "—";
                      }
                      const prefix = tipo === "leiloeira" ? "Leiloeira: " : "Externo: ";
                      return v.vendedor_externo ? `${prefix}${v.vendedor_externo}` : "—";
                    })()}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <PagamentoCell venda={v} />
                  </TableCell>
                  {isCoordenador && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <CoordActions venda={v} lead={v.lead_id ? leadById.get(v.lead_id) ?? null : null} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <LeadPanel
        lead={leadAberto}
        funil={funilDoLead}
        onClose={() => setLeadAberto(null)}
      />
    </>
  );
}

function PagamentoCell({ venda }: { venda: Venda }) {
  const update = useUpdateVendaPagamento();
  const [open, setOpen] = useState(false);
  const [forma, setForma] = useState(venda.forma_pagamento ?? "À vista");
  const [tipo, setTipo] = useState(venda.tipo_parcelamento ?? "À vista");
  const [qtd, setQtd] = useState<string>(venda.qtd_parcelas ? String(venda.qtd_parcelas) : "");
  const [desc, setDesc] = useState(venda.parcelamento_descricao ?? "");

  const resumo = venda.parcelamento_descricao
    || [venda.qtd_parcelas ? `${venda.qtd_parcelas}x` : null, venda.tipo_parcelamento]
        .filter(Boolean).join(" ")
    || venda.forma_pagamento
    || "—";

  const salvar = () => {
    update.mutate(
      {
        id: venda.id,
        forma_pagamento: forma || null,
        tipo_parcelamento: tipo || null,
        qtd_parcelas: qtd ? Number(qtd) : null,
        parcelamento_descricao: desc || null,
      },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 hover:text-primary transition-colors text-left max-w-[180px] truncate group">
          <span className="truncate">{resumo}</span>
          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 space-y-3" align="end">
        <div className="text-xs font-semibold">Pagamento</div>
        <div className="space-y-1">
          <label className="text-[11px] text-muted-foreground">Forma</label>
          <Select value={forma} onValueChange={setForma}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Tipo parcelamento</label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS_PARCELAMENTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Nº parcelas</label>
            <Input type="number" min={1} value={qtd} onChange={(e) => setQtd(e.target.value)}
              placeholder="Ex: 30" className="h-8 text-xs" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-muted-foreground">Descrição livre</label>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder='Ex: "30x diretas" / "12x + 12x duplo"'
            className="h-8 text-xs" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={salvar} disabled={update.isPending}>
            Salvar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ComissaoCell({ venda }: { venda: Venda }) {
  const update = useUpdateVendaComissao();
  const [open, setOpen] = useState(false);
  const [pct, setPct] = useState<string>(
    venda.comissao_percentual != null ? String(venda.comissao_percentual) : ""
  );

  const pctNum = pct ? Number(pct) : 0;
  const valor = (Number(venda.valor_total) * pctNum) / 100;

  const salvar = () => {
    update.mutate(
      { id: venda.id, comissao_percentual: pct ? Number(pct) : null },
      { onSuccess: () => setOpen(false) }
    );
  };

  const resumo = venda.comissao_percentual != null
    ? `${Number(venda.comissao_percentual).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% · ${fmtBRL((Number(venda.valor_total) * Number(venda.comissao_percentual)) / 100)}`
    : "—";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 hover:text-primary transition-colors text-left max-w-[160px] truncate group">
          <span className="truncate">{resumo}</span>
          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-3" align="end">
        <div className="text-xs font-semibold">Comissão</div>
        <div className="space-y-1">
          <label className="text-[11px] text-muted-foreground">Percentual (%)</label>
          <Input
            type="number" min={0} max={100} step="0.1"
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            placeholder="Ex: 10" className="h-8 text-xs"
          />
        </div>
        <div className="text-[11px] text-muted-foreground">
          Valor da comissão: <span className="text-foreground font-semibold">{fmtBRL(valor)}</span>
        </div>
        <div className="flex justify-between gap-2 pt-1">
          <Button size="sm" variant="ghost" className="h-7 text-xs"
            onClick={() => { setPct(""); update.mutate({ id: venda.id, comissao_percentual: null }, { onSuccess: () => setOpen(false) }); }}
            disabled={update.isPending}>
            Limpar
          </Button>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={salvar} disabled={update.isPending}>
              Salvar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Kpi({
  icon: Icon, label, value, sub,
}: {
  icon: typeof DollarSign; label: string; value: string; sub?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-2xl font-display font-bold mt-1">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}


function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function CoordActions({ venda, lead }: { venda: Venda; lead: Lead | null }) {
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [contratoOpen, setContratoOpen] = useState(false);
  const del = useDeleteVenda();
  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-primary hover:text-primary"
        title="Gerar contrato"
        onClick={() => setContratoOpen(true)}
      >
        <FileSignature className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        title="Editar venda"
        onClick={() => setEditOpen(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
        title="Excluir venda"
        onClick={() => setDelOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <VendaDialog open={editOpen} onOpenChange={setEditOpen} venda={venda} />
      <ContratoDialog open={contratoOpen} onOpenChange={setContratoOpen} venda={venda} lead={lead} />
      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta venda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A venda de {venda.cliente_nome} será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => del.mutate(venda.id, { onSuccess: () => setDelOpen(false) })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DateBtn({
  label, date, onChange,
}: {
  label: string; date?: Date; onChange: (d: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 text-xs gap-1.5 font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-3 w-3" />
          {date ? format(date, "dd/MM/yy", { locale: ptBR }) : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onChange}
          initialFocus
          locale={ptBR}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
