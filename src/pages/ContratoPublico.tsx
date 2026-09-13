import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useContratoPorToken } from '@/hooks/useContratos';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeContratoHtml } from '@/lib/sanitize-html';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CheckCircle2, FileText, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function ContratoPublico() {
  const { token } = useParams<{ token: string }>();
  const { data: contrato, isLoading, refetch } = useContratoPorToken(token);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [aceite, setAceite] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!contrato) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-xl font-semibold mb-1">Contrato não encontrado</h1>
          <p className="text-sm text-muted-foreground">O link pode estar incorreto ou expirado.</p>
        </div>
      </div>
    );
  }

  const jaAssinado = contrato.status === 'assinado';

  const assinar = async () => {
    if (!nome.trim() || !cpf.trim() || !aceite) {
      toast.error('Preencha nome, CPF e marque o aceite.');
      return;
    }
    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke('assinar-contrato', {
        body: { token, nome: nome.trim(), cpf: cpf.trim(), aceite: true },
      });
      if (error) throw error;
      toast.success('Contrato assinado com sucesso!');
      await refetch();
    } catch (e) {
      toast.error('Erro ao assinar', { description: (e as Error).message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-center gap-3 bg-surface border border-border rounded-lg p-4">
          <FileText className="h-6 w-6 text-primary" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Contrato nº {contrato.numero}</h1>
            <p className="text-xs text-muted-foreground">Leia com atenção antes de assinar eletronicamente.</p>
          </div>
          {jaAssinado && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Assinado
            </span>
          )}
        </header>

        <article
          className="bg-white text-black rounded-lg shadow-sm border border-border p-8 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeContratoHtml(contrato.conteudo_final) }}
        />

        {jaAssinado ? (
          <div className="bg-success/10 border border-success/30 rounded-lg p-5 text-sm space-y-1">
            <div className="flex items-center gap-2 font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" /> Contrato assinado eletronicamente
            </div>
            <p className="text-xs text-muted-foreground">
              Por: <strong>{contrato.assinatura_nome}</strong> (CPF {contrato.assinatura_cpf})
            </p>
            <p className="text-xs text-muted-foreground">
              Em: {new Date(contrato.assinado_em!).toLocaleString('pt-BR')} · IP: {contrato.assinatura_ip}
            </p>
            {contrato.assinatura_hash && (
              <p className="text-[10px] text-muted-foreground font-mono break-all">Hash: {contrato.assinatura_hash}</p>
            )}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">Assinar eletronicamente</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              A assinatura eletrônica tem validade jurídica nos termos do art. 10, §2º, da MP 2.200-2/2001.
              Registramos nome, CPF, endereço IP e data/hora para autenticidade.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nome completo</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como consta no CPF" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CPF/CNPJ</Label>
                <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="aceite" checked={aceite} onCheckedChange={(v) => setAceite(!!v)} className="mt-0.5" />
              <Label htmlFor="aceite" className="text-xs leading-relaxed">
                Li e concordo com todas as cláusulas do presente contrato e reconheço a validade jurídica desta assinatura eletrônica.
              </Label>
            </div>
            <Button onClick={assinar} disabled={enviando} className="w-full">
              {enviando ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
              Assinar contrato
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}