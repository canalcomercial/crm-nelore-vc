import { useMemo, useState } from "react";
import { DollarSign, Users, TrendingUp, Target, Award, Phone, MessageSquare, Filter } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { useVendas, useTodosLeads, useFunis, useUsuarios, useTodasInteracoes } from "@/hooks/useCrm";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format, startOfMonth, subMonths, isAfter, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const CORES = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--accent-foreground))", "#6B7B95"];

/** Classifica o tipo bruto da interação */
function classificaContato(tipo: string): "ligacao" | "mensagem" | "outro" {
  const t = (tipo ?? "").toLowerCase();
  if (t.includes("liga") || t === "call" || t.includes("telefone")) return "ligacao";
  if (t.includes("mensag") || t.includes("whats") || t.includes("sms") || t.includes("chat") || t === "message")
    return "mensagem";
  return "outro";
}

export default function RelatoriosPage() {
  const { data: vendas = [] } = useVendas();
  const { data: leads = [] } = useTodosLeads();
  const { data: funis = [] } = useFunis();
  const { data: usuarios = [] } = useUsuarios();
  const { data: interacoes = [] } = useTodasInteracoes();

  // Filtros do painel de contatos
  const [periodo, setPeriodo] = useState<"7d" | "30d" | "mes" | "tudo">("30d");
  const [tipoContato, setTipoContato] = useState<"todos" | "ligacao" | "mensagem">("todos");
  const [vendedorFiltro, setVendedorFiltro] = useState<string>("todos");
  const [agrupamento, setAgrupamento] = useState<"dia" | "mes">("dia");

  const contatos = useMemo(() => {
    const agora = new Date();
    let inicio: Date | null = null;
    if (periodo === "7d") inicio = subDays(startOfDay(agora), 6);
    else if (periodo === "30d") inicio = subDays(startOfDay(agora), 29);
    else if (periodo === "mes") inicio = startOfMonth(agora);

    return interacoes
      .map((i) => ({ ...i, _tipo: classificaContato(i.tipo) }))
      .filter((i) => i._tipo !== "outro")
      .filter((i) => (tipoContato === "todos" ? true : i._tipo === tipoContato))
      .filter((i) => (vendedorFiltro === "todos" ? true : i.usuario_id === vendedorFiltro))
      .filter((i) => (inicio ? new Date(i.criado_em) >= inicio : true));
  }, [interacoes, periodo, tipoContato, vendedorFiltro]);

  // Por vendedor (resumo)
  const contatosPorVendedor = useMemo(() => {
    const map = new Map<string, { ligacao: number; mensagem: number; total: number }>();
    contatos.forEach((c) => {
      const id = c.usuario_id ?? "sem_vendedor";
      const cur = map.get(id) ?? { ligacao: 0, mensagem: 0, total: 0 };
      if (c._tipo === "ligacao") cur.ligacao += 1;
      if (c._tipo === "mensagem") cur.mensagem += 1;
      cur.total += 1;
      map.set(id, cur);
    });
    return Array.from(map.entries())
      .map(([id, v]) => ({
        id,
        nome: id === "sem_vendedor" ? "Sem vendedor" : usuarios.find((u) => u.id === id)?.nome ?? "—",
        ...v,
      }))
      .sort((a, b) => b.total - a.total);
  }, [contatos, usuarios]);

  // Série temporal (dia ou mês)
  const contatosPorPeriodo = useMemo(() => {
    const map = new Map<string, { label: string; ligacao: number; mensagem: number }>();
    contatos.forEach((c) => {
      const d = new Date(c.criado_em);
      const key = agrupamento === "dia" ? format(d, "yyyy-MM-dd") : format(d, "yyyy-MM");
      const label = agrupamento === "dia"
        ? format(d, "dd/MM", { locale: ptBR })
        : format(d, "MMM/yy", { locale: ptBR });
      const cur = map.get(key) ?? { label, ligacao: 0, mensagem: 0 };
      if (c._tipo === "ligacao") cur.ligacao += 1;
      if (c._tipo === "mensagem") cur.mensagem += 1;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [contatos, agrupamento]);

  const totalLig = contatos.filter((c) => c._tipo === "ligacao").length;
  const totalMsg = contatos.filter((c) => c._tipo === "mensagem").length;

  // Mesma base usada no Kanban: não arquivados, com funil_id válido,
  // e etapa pertencente às etapas atuais do funil.
  const leadsAtivos = useMemo(() => {
    const etapasPorFunil = new Map<string, Set<string>>();
    funis.forEach((f) => etapasPorFunil.set(f.id, new Set(f.etapas)));
    return leads.filter((l) => {
      if (l.arquivado) return false;
      if (!l.funil_id || !l.etapa) return false;
      const etapas = etapasPorFunil.get(l.funil_id);
      return !!etapas && etapas.has(l.etapa);
    });
  }, [leads, funis]);

  const stats = useMemo(() => {
    const inicioMes = startOfMonth(new Date());
    const vendasMes = vendas.filter((v) => isAfter(new Date(v.criado_em), inicioMes));
    const totalMes = vendasMes.reduce((s, v) => s + Number(v.valor_total), 0);
    const totalGeral = vendas.reduce((s, v) => s + Number(v.valor_total), 0);
    const ticketMedio = vendas.length > 0 ? totalGeral / vendas.length : 0;
    const leadsConvertidos = new Set(vendas.map((v) => v.lead_id).filter(Boolean)).size;
    const baseLeads = leadsAtivos.length;
    const taxaConversao = baseLeads > 0 ? (leadsConvertidos / baseLeads) * 100 : 0;
    return {
      totalMes, totalGeral, ticketMedio, taxaConversao,
      qtdVendasMes: vendasMes.length, qtdLeads: baseLeads,
    };
  }, [vendas, leadsAtivos]);

  // Vendas por mês (últimos 6 meses)
  const vendasPorMes = useMemo(() => {
    const meses: { mes: string; valor: number; qtd: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const ref = subMonths(new Date(), i);
      const inicio = startOfMonth(ref);
      const fim = startOfMonth(subMonths(ref, -1));
      const vs = vendas.filter((v) => {
        const d = new Date(v.criado_em);
        return d >= inicio && d < fim;
      });
      meses.push({
        mes: format(ref, "MMM/yy", { locale: ptBR }),
        valor: vs.reduce((s, v) => s + Number(v.valor_total), 0),
        qtd: vs.length,
      });
    }
    return meses;
  }, [vendas]);

  // Vendas por categoria
  const porCategoria = useMemo(() => {
    const map = new Map<string, number>();
    vendas.forEach((v) => map.set(v.categoria, (map.get(v.categoria) ?? 0) + Number(v.valor_total)));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [vendas]);

  // Leads por funil
  const leadsPorFunil = useMemo(() => {
    return funis.map((f) => ({
      nome: f.nome,
      total: leadsAtivos.filter((l) => l.funil_id === f.id).length,
    }));
  }, [funis, leadsAtivos]);

  // Ranking vendedores
  const rankingVendedores = useMemo(() => {
    const map = new Map<string, { vendas: number; valor: number }>();
    vendas.forEach((v) => {
      if (!v.vendedor_id) return;
      const cur = map.get(v.vendedor_id) ?? { vendas: 0, valor: 0 };
      cur.vendas += 1;
      cur.valor += Number(v.valor_total);
      map.set(v.vendedor_id, cur);
    });
    return Array.from(map.entries())
      .map(([id, dados]) => ({
        nome: usuarios.find((u) => u.id === id)?.nome ?? "—",
        ...dados,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [vendas, usuarios]);

  return (
    <>
      <Topbar title="Relatórios" hideSearch />
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* KPIs principais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi icon={DollarSign} label="Faturamento do mês" value={fmtBRL(stats.totalMes)}
            sub={`${stats.qtdVendasMes} vendas`} tone="primary" />
          <Kpi icon={TrendingUp} label="Ticket médio" value={fmtBRL(stats.ticketMedio)}
            sub="Por venda" />
          <Kpi icon={Users} label="Leads totais" value={String(stats.qtdLeads)}
            sub="Base ativa" />
          <Kpi icon={Target} label="Taxa de conversão" value={`${stats.taxaConversao.toFixed(1)}%`}
            sub="Leads → Vendas" tone="success" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Faturamento mensal */}
          <Card title="Faturamento — últimos 6 meses">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={vendasPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => fmtBRL(v)}
                />
                <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Vendas por categoria */}
          <Card title="Vendas por categoria">
            {porCategoria.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={porCategoria} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                    {porCategoria.map((_, i) => (
                      <Cell key={i} fill={CORES[i % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtBRL(v)}
                    contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Leads por funil */}
          <Card title="Leads por funil">
            {leadsPorFunil.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={leadsPorFunil} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="nome" type="category" width={120}
                    tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Ranking */}
          <Card title="Top 5 vendedores" icon={Award}>
            {rankingVendedores.length === 0 ? <Empty msg="Nenhuma venda com vendedor atribuído ainda" /> : (
              <div className="space-y-2">
                {rankingVendedores.map((r, i) => (
                  <div key={r.nome} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm",
                      i === 0 ? "bg-warning text-warning-foreground"
                        : i === 1 ? "bg-muted-foreground/20 text-foreground"
                        : "bg-secondary text-muted-foreground"
                    )}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.nome}</p>
                      <p className="text-[11px] text-muted-foreground">{r.vendas} vendas</p>
                    </div>
                    <p className="text-sm font-display font-bold text-primary">{fmtBRL(r.valor)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ===== Contatos por vendedor ===== */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold mr-2">Contatos por vendedor</h3>

            <div className="flex items-center gap-1 ml-auto">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as typeof periodo)}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="mes">Este mês</SelectItem>
                <SelectItem value="tudo">Todo o período</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoContato} onValueChange={(v) => setTipoContato(v as typeof tipoContato)}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="ligacao">Ligações</SelectItem>
                <SelectItem value="mensagem">Mensagens</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vendedorFiltro} onValueChange={setVendedorFiltro}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos vendedores</SelectItem>
                {usuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={agrupamento} onValueChange={(v) => setAgrupamento(v as typeof agrupamento)}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dia">Por dia</SelectItem>
                <SelectItem value="mes">Por mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* mini KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <MiniKpi icon={Phone} label="Ligações" value={String(totalLig)} tone="info" />
            <MiniKpi icon={MessageSquare} label="Mensagens" value={String(totalMsg)} tone="success" />
            <MiniKpi icon={Users} label="Total contatos" value={String(totalLig + totalMsg)} />
          </div>

          {/* gráfico temporal */}
          <div>
            {contatosPorPeriodo.length === 0 ? <Empty msg="Sem contatos no período" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={contatosPorPeriodo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="ligacao" name="Ligações" stackId="a" fill="hsl(var(--info))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="mensagem" name="Mensagens" stackId="a" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* tabela por vendedor */}
          <div className="border border-border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Vendedor</TableHead>
                  <TableHead className="text-xs text-right">Ligações</TableHead>
                  <TableHead className="text-xs text-right">Mensagens</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contatosPorVendedor.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground text-xs py-6">
                      Nenhum contato no período.
                    </TableCell>
                  </TableRow>
                )}
                {contatosPorVendedor.map((v) => (
                  <TableRow key={v.id} className="text-xs">
                    <TableCell className="font-medium">{v.nome}</TableCell>
                    <TableCell className="text-right">{v.ligacao}</TableCell>
                    <TableCell className="text-right">{v.mensagem}</TableCell>
                    <TableCell className="text-right font-semibold">{v.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}

function MiniKpi({ icon: Icon, label, value, tone }: {
  icon: typeof DollarSign; label: string; value: string;
  tone?: "info" | "success";
}) {
  return (
    <div className="bg-background border border-border rounded-md p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        <Icon className={cn(
          "h-3.5 w-3.5",
          tone === "info" && "text-info",
          tone === "success" && "text-success",
        )} />
        {label}
      </div>
      <div className="text-xl font-display font-bold mt-0.5">{value}</div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone }: {
  icon: typeof DollarSign; label: string; value: string; sub?: string;
  tone?: "primary" | "success" | "warning";
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        <Icon className={cn(
          "h-3.5 w-3.5",
          tone === "primary" && "text-primary",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
        )} />
        {label}
      </div>
      <div className={cn("text-2xl font-display font-bold mt-1",
        tone === "primary" && "text-primary",
        tone === "success" && "text-success",
      )}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function Card({ title, icon: Icon, children }: {
  title: string; icon?: typeof DollarSign; children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Empty({ msg = "Sem dados ainda" }: { msg?: string }) {
  return (
    <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground">
      {msg}
    </div>
  );
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
