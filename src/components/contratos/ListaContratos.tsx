import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useContratos } from '@/hooks/useContratos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Copy, ExternalLink, CheckCircle2, Clock, Truck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LABEL_TIPO, type ContratoTipo } from '@/types/contratos';
import { baixarContratoPdf, baixarNotaTransporte } from '@/lib/nota-transporte';

const STATUS_LABEL: Record<string, { label: string; cor: string }> = {
  rascunho: { label: 'Rascunho', cor: 'bg-muted text-muted-foreground' },
  enviado: { label: 'Enviado', cor: 'bg-info/15 text-info' },
  assinado: { label: 'Assinado', cor: 'bg-success/15 text-success' },
  cancelado: { label: 'Cancelado', cor: 'bg-destructive/15 text-destructive' },
};

export function ListaContratos() {
  const { data: contratos = [], isLoading } = useContratos();
  const [baixando, setBaixando] = useState<string | null>(null);

  const executar = async (chave: string, fn: () => Promise<void>, erro: string) => {
    try {
      setBaixando(chave);
      await fn();
    } catch (e) {
      toast.error(erro, { description: (e as Error).message });
    } finally { setBaixando(null); }
  };

  const copiarLink = async (token: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/contrato/${token}`);
    toast.success('Link copiado');
  };

  if (isLoading) return <div className="p-6 text-sm">Carregando...</div>;

  return (
    <div className="bg-surface border border-border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Nº</TableHead>
            <TableHead className="text-xs">Cliente</TableHead>
            <TableHead className="text-xs">Tipo</TableHead>
            <TableHead className="text-xs">Emitido</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs">Assinante</TableHead>
            <TableHead className="text-xs">Assinado em</TableHead>
            <TableHead className="text-xs min-w-[330px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contratos.length === 0 && (
            <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
              Nenhum contrato emitido ainda.
            </TableCell></TableRow>
          )}
          {contratos.map((c) => {
            const s = STATUS_LABEL[c.status] ?? STATUS_LABEL.rascunho;
            const tipoLabel = LABEL_TIPO[(c.tipo ?? 'bovinos') as ContratoTipo];
            const cliente = c.vendas?.cliente_nome || '—';
            const chaveContrato = `${c.id}-contrato`;
            const chaveTransporte = `${c.id}-transporte`;
            return (
              <TableRow key={c.id} className="text-xs">
                <TableCell className="font-mono">#{c.numero}</TableCell>
                <TableCell className="max-w-[180px] truncate" title={cliente}>{cliente}</TableCell>
                <TableCell>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                    {tipoLabel}
                  </span>
                </TableCell>
                <TableCell>{format(new Date(c.criado_em), 'dd/MM/yy HH:mm', { locale: ptBR })}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${s.cor}`}>
                    {c.status === 'assinado' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {s.label}
                  </span>
                </TableCell>
                <TableCell>{c.assinatura_nome || '—'}</TableCell>
                <TableCell>{c.assinado_em ? format(new Date(c.assinado_em), 'dd/MM/yy HH:mm', { locale: ptBR }) : '—'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      size="sm" variant="outline" className="h-7 px-2 text-[11px]"
                      onClick={() => executar(chaveContrato, () => baixarContratoPdf(c, cliente), 'Erro ao baixar contrato')}
                      disabled={baixando === chaveContrato}
                      title="Baixar contrato em PDF"
                    >
                      {baixando === chaveContrato
                        ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        : <Download className="h-3.5 w-3.5 mr-1" />}
                      Baixar contrato
                    </Button>
                    <Button
                      size="sm" variant="outline" className="h-7 px-2 text-[11px]"
                      onClick={() => executar(chaveTransporte, () => baixarNotaTransporte(c), 'Erro ao gerar nota de transporte')}
                      disabled={baixando === chaveTransporte}
                      title="Baixar nota de transporte (documentação das fazendas para o caminhoneiro)"
                    >
                      {baixando === chaveTransporte
                        ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        : <Truck className="h-3.5 w-3.5 mr-1" />}
                      Nota de transporte
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copiarLink(c.token_publico)} title="Copiar link">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <a href={`/contrato/${c.token_publico}`} target="_blank" rel="noopener noreferrer"
                      className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded" title="Abrir link">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
