import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PAGINA_COMERCIAL_URL } from "@/lib/public-urls";
import { ExternalLink, Copy, Check, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useFunis } from "@/hooks/useCrm";
import type { PaginaComercialConfig } from "@/hooks/usePaginaComercial";

type LeadRow = { criado_em: string; campos_extras: Record<string, unknown> | null };

function useMetricasPagina() {
  return useQuery({
    queryKey: ["pagina-comercial-metricas"],
    queryFn: async () => {
      const trinta = new Date();
      trinta.setDate(trinta.getDate() - 30);
      const { data } = await supabase
        .from("leads")
        .select("criado_em, campos_extras")
        .eq("origem", "pagina_comercial")
        .is("deletado_em", null)
        .gte("criado_em", trinta.toISOString());
      return (data ?? []) as LeadRow[];
    },
  });
}

export function MetricasCard({ config }: { config: PaginaComercialConfig }) {
  const { data: leads = [] } = useMetricasPagina();
  const { data: funis = [] } = useFunis();
  const [copiado, setCopiado] = useState(false);

  const hojeIni = new Date(); hojeIni.setHours(0, 0, 0, 0);
  const semana = new Date(); semana.setDate(semana.getDate() - 7);

  const hoje = leads.filter((l) => new Date(l.criado_em) >= hojeIni).length;
  const sete = leads.filter((l) => new Date(l.criado_em) >= semana).length;
  const total = leads.length;

  const porSecao: Record<string, number> = {};
  leads.forEach((l) => {
    const secao = ((l.campos_extras?.pagina_comercial as { origem_secao?: string } | undefined)?.origem_secao) ?? "outro";
    porSecao[secao] = (porSecao[secao] ?? 0) + 1;
  });
  const secoes = Object.entries(porSecao).sort((a, b) => b[1] - a[1]);

  const funil = funis.find((f) => f.id === config.funil_id);
  const url = PAGINA_COMERCIAL_URL;

  const copiar = async () => {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
    toast.success("Link copiado");
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-sm font-semibold">Métricas & status</div>
          <div className="text-xs text-muted-foreground">Últimos 30 dias · origem <code>pagina_comercial</code></div>
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={copiar} className="gap-1.5">
            {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copiar link
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <a href={PAGINA_COMERCIAL_URL} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /> Ver página</a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Kpi label="Hoje" value={hoje} />
        <Kpi label="7 dias" value={sete} />
        <Kpi label="30 dias" value={total} />
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Leads por seção</div>
        <div className="flex flex-wrap gap-1.5">
          {secoes.length === 0 && <span className="text-xs text-muted-foreground">Nenhum lead capturado ainda.</span>}
          {secoes.map(([s, n]) => (
            <Badge key={s} variant="outline" className="text-[11px]">{s} <span className="ml-1 font-semibold">{n}</span></Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center text-xs">
        <Badge variant={config.ativo ? "default" : "outline"}>{config.ativo ? "Página ativa" : "Página inativa"}</Badge>
        {config.publicado_em && (
          <span className="text-muted-foreground">Publicada em {new Date(config.publicado_em).toLocaleString("pt-BR")}</span>
        )}
        {funil ? (
          <Badge variant="outline">Funil: {funil.nome}{config.etapa_inicial ? ` › ${config.etapa_inicial}` : ""}</Badge>
        ) : (
          <Badge variant="outline" className="text-warning border-warning/40 bg-warning/5 gap-1"><AlertTriangle className="h-3 w-3" /> Sem funil configurado</Badge>
        )}
      </div>
    </Card>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-md p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}