import { RefreshCw, RotateCcw, CheckCircle2, XCircle, AlertCircle, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMetaEventos, useReprocessarEvento } from "@/hooks/useMeta";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS: Record<string, { label: string; className: string; Icon: LucideIcon }> = {
  processado: { label: "Processado", className: "bg-success/15 text-success", Icon: CheckCircle2 },
  ignorado: { label: "Ignorado (form não cadastrado)", className: "bg-warning/15 text-warning", Icon: AlertCircle },
  erro: { label: "Erro", className: "bg-destructive/15 text-destructive", Icon: XCircle },
  recebido: { label: "Recebido", className: "bg-info/15 text-info", Icon: AlertCircle },
};

export function LogTab() {
  const { data: eventos = [], isLoading } = useMetaEventos();
  const reprocessar = useReprocessarEvento();
  const qc = useQueryClient();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Últimos 200 eventos recebidos do Meta.</p>
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["meta_eventos_log"] })} className="gap-1.5">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Data</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Form ID</TableHead>
              <TableHead className="text-xs">Leadgen ID</TableHead>
              <TableHead className="text-xs">Erro</TableHead>
              <TableHead className="text-xs w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground">Carregando…</TableCell></TableRow>}
            {!isLoading && eventos.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">Nenhum evento ainda.</TableCell></TableRow>
            )}
            {eventos.map((ev) => {
              const st = STATUS[ev.status] ?? STATUS.recebido;
              return (
                <TableRow key={ev.id}>
                  <TableCell className="text-[11px]">{format(new Date(ev.criado_em), "dd/MM HH:mm:ss", { locale: ptBR })}</TableCell>
                  <TableCell>
                    <Badge className={st.className}><st.Icon className="h-3 w-3 mr-1" />{st.label}</Badge>
                  </TableCell>
                  <TableCell className="text-[11px] font-mono">{ev.form_id ?? "—"}</TableCell>
                  <TableCell className="text-[11px] font-mono">{ev.leadgen_id ?? "—"}</TableCell>
                  <TableCell className="text-[11px] text-destructive max-w-[240px] truncate">{ev.erro ?? ""}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs"
                      onClick={() => reprocessar.mutate(ev.id)} disabled={reprocessar.isPending}>
                      <RotateCcw className="h-3.5 w-3.5" /> Reprocessar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}