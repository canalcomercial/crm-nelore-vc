import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, AlertCircle, RotateCcw, TrendingUp, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, YAxis } from "recharts";
import { useMetaEventos, useMetaFormularios, useReprocessarEvento } from "@/hooks/useMeta";

function iconFor(status: string) {
  if (status === "processado") return <CheckCircle2 className="h-3 w-3" />;
  if (status === "erro") return <XCircle className="h-3 w-3" />;
  return <AlertCircle className="h-3 w-3" />;
}
function classFor(status: string) {
  if (status === "processado") return "bg-success/15 text-success";
  if (status === "erro") return "bg-destructive/15 text-destructive";
  if (status === "ignorado") return "bg-warning/15 text-warning";
  return "bg-info/15 text-info";
}

function useLeadsMetaCount() {
  return useQuery({
    queryKey: ["meta_leads_kpis"],
    queryFn: async () => {
      const hojeIni = new Date();
      hojeIni.setHours(0, 0, 0, 0);
      const semana = new Date();
      semana.setDate(semana.getDate() - 7);

      const { count: hoje } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("origem", "meta_lead_ads")
        .is("deletado_em", null)
        .gte("criado_em", hojeIni.toISOString());

      const { count: semanaCount } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("origem", "meta_lead_ads")
        .is("deletado_em", null)
        .gte("criado_em", semana.toISOString());

      return { hoje: hoje ?? 0, semana: semanaCount ?? 0 };
    },
  });
}

export function DashboardTab() {
  const qc = useQueryClient();
  const { data: eventos = [] } = useMetaEventos();
  const { data: forms = [] } = useMetaFormularios();
  const { data: kpis } = useLeadsMetaCount();
  const reprocessar = useReprocessarEvento();
  const [formFilter, setFormFilter] = useState<string>("todos");

  // Realtime — invalida logs quando muda a tabela
  useEffect(() => {
    const ch = supabase
      .channel("meta-eventos-log-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "meta_eventos_log" }, () => {
        qc.invalidateQueries({ queryKey: ["meta_eventos_log"] });
        qc.invalidateQueries({ queryKey: ["meta_leads_kpis"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const filtered = useMemo(
    () => eventos.filter((e) => formFilter === "todos" || e.form_id === formFilter),
    [eventos, formFilter],
  );

  const total = filtered.length || 1;
  const processados = filtered.filter((e) => e.status === "processado").length;
  const erros24h = filtered.filter((e) => {
    if (e.status !== "erro") return false;
    return new Date(e.criado_em).getTime() > Date.now() - 24 * 60 * 60 * 1000;
  }).length;
  const taxaSucesso = Math.round((processados / total) * 100);

  // Série diária (14 dias)
  const serieDiaria = useMemo(() => {
    const dias: { dia: string; total: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      dias.push({ dia: format(d, "dd/MM", { locale: ptBR }), total: 0 });
    }
    filtered.forEach((e) => {
      const d = new Date(e.criado_em);
      d.setHours(0, 0, 0, 0);
      const label = format(d, "dd/MM", { locale: ptBR });
      const item = dias.find((x) => x.dia === label);
      if (item) item.total += 1;
    });
    return dias;
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Leads hoje" value={kpis?.hoje ?? 0} />
        <KpiCard label="Leads 7 dias" value={kpis?.semana ?? 0} />
        <KpiCard label="Taxa de sucesso" value={`${taxaSucesso}%`} icon={<TrendingUp className="h-4 w-4 text-success" />} />
        <KpiCard label="Erros 24h" value={erros24h} tone={erros24h > 0 ? "danger" : "default"} />
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold">Eventos por dia (últimos 14)</div>
            <div className="text-xs text-muted-foreground">Baseado no log do webhook</div>
          </div>
          <Select value={formFilter} onValueChange={setFormFilter}>
            <SelectTrigger className="h-8 text-xs w-[220px]"><SelectValue placeholder="Todos os formulários" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os formulários</SelectItem>
              {forms.map((f) => (
                <SelectItem key={f.form_id} value={f.form_id}>{f.form_nome || f.form_id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serieDiaria}>
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Últimos eventos (tempo real)</div>
            <div className="text-xs text-muted-foreground">Atualiza automaticamente conforme o webhook recebe.</div>
          </div>
          <Badge variant="outline" className="text-[10px]">{filtered.length} eventos</Badge>
        </div>
        <div className="divide-y max-h-[420px] overflow-y-auto">
          {filtered.slice(0, 40).map((e) => (
            <div key={e.id} className="p-3 flex items-center gap-3 hover:bg-muted/30">
              <Badge className={classFor(e.status)}>{iconFor(e.status)}<span className="ml-1">{e.status}</span></Badge>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono truncate">{e.form_id ?? "—"}</div>
                {e.erro && <div className="text-[11px] text-destructive truncate">{e.erro}</div>}
              </div>
              <div className="text-[11px] text-muted-foreground">{format(new Date(e.criado_em), "dd/MM HH:mm:ss", { locale: ptBR })}</div>
              {e.lead_id && (
                <Button size="sm" variant="ghost" asChild className="h-7">
                  <a href={`/?lead=${e.lead_id}`}><ArrowUpRight className="h-3.5 w-3.5" /></a>
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => reprocessar.mutate(e.id)} className="h-7 gap-1 text-[11px]">
                <RotateCcw className="h-3 w-3" /> Reprocessar
              </Button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhum evento ainda.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, icon, tone = "default" }: { label: string; value: string | number; icon?: React.ReactNode; tone?: "default" | "danger" }) {
  return (
    <Card className={`p-4 ${tone === "danger" ? "border-destructive/40" : ""}`}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center justify-between">
        <div className={`text-2xl font-semibold ${tone === "danger" ? "text-destructive" : ""}`}>{value}</div>
        {icon}
      </div>
    </Card>
  );
}