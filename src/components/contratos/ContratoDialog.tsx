import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, MessageCircle, Copy, FileText, Loader2, CheckCircle2, Pencil, Check, X, Truck, RefreshCw } from 'lucide-react';
import type { Venda, Lead } from '@/types/crm';
import {
  useContratante, useTemplateAtivo, useContratosVenda, useCriarContrato,
  useAtualizarContrato, uploadContratoPdf,
} from '@/hooks/useContratos';
import { baixarContratoPdf, baixarNotaTransporte } from '@/lib/nota-transporte';
import { montarVariaveis, renderTemplate } from '@/lib/contrato-render';
import { htmlParaPdfBlob, sha256, baixarBlob, nomeArquivoSeguro } from '@/lib/contrato-pdf';
import { sanitizeContratoHtml } from '@/lib/sanitize-html';

import { toast } from 'sonner';
import type { Contrato, ContratoTipo } from '@/types/contratos';
import { CONTRATO_TIPOS, CAMPOS_EXTRAS_POR_TIPO, tipoDaCategoria, LABEL_TIPO } from '@/types/contratos';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  venda: Venda;
  lead: Lead | null;
}

export function ContratoDialog({ open, onOpenChange, venda, lead }: Props) {
  const { data: contratante } = useContratante();
  const [tipo, setTipo] = useState<ContratoTipo>(() => tipoDaCategoria(venda.categoria));
  const { data: template } = useTemplateAtivo(tipo);
  const { data: contratosExistentes = [] } = useContratosVenda(venda.id);
  const criar = useCriarContrato();
  const atualizar = useAtualizarContrato();

  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [gerando, setGerando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [baixando, setBaixando] = useState<'contrato' | 'transporte' | null>(null);
  const [editando, setEditando] = useState(false);
  const [htmlEditado, setHtmlEditado] = useState<string | null>(null);
  const [extras, setExtras] = useState<Record<string, string>>({});
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && contratosExistentes.length > 0) {
      setContrato(contratosExistentes[0]);
      if (contratosExistentes[0].tipo) setTipo(contratosExistentes[0].tipo);
    }
    if (!open) {
      setContrato(null);
      setEditando(false);
      setHtmlEditado(null);
    }
  }, [open, contratosExistentes]);

  // Pré-carrega campos extras a partir da venda ao abrir / mudar de tipo.
  // A venda é lida por ref de propósito: semear a cada mudança do objeto faria
  // um refetch em background apagar o que o usuário já digitou.
  const vendaRef = useRef(venda);
  vendaRef.current = venda;
  useEffect(() => {
    if (!open) return;
    const src = (vendaRef.current.campos_extras ?? {}) as Record<string, unknown>;
    const next: Record<string, string> = {};
    for (const f of CAMPOS_EXTRAS_POR_TIPO[tipo]) {
      const v = src[f.key];
      next[f.key] = v === undefined || v === null ? '' : String(v);
    }
    setExtras(next);
    setHtmlEditado(null);
  }, [open, tipo, venda.id]);

  const htmlBase = useMemo(() => {
    if (contrato) return contrato.conteudo_final;
    if (!template) return '';
    const numero = `PRE-${venda.id.slice(0, 6).toUpperCase()}`;
    const vendaComExtras = { ...venda, campos_extras: { ...(venda.campos_extras ?? {}), ...extras } };
    const vars = montarVariaveis(vendaComExtras, lead, contratante ?? null, numero, tipo);
    return renderTemplate(template.conteudo_html, vars);
  }, [contrato, template, venda, lead, contratante, tipo, extras]);

  const html = htmlEditado ?? htmlBase;

  const iniciarEdicao = () => {
    setHtmlEditado(html);
    setEditando(true);
  };

  const cancelarEdicao = () => {
    setEditando(false);
    setHtmlEditado(null);
  };

  const salvarEdicao = async () => {
    const novo = editorRef.current?.innerHTML ?? html;
    setHtmlEditado(novo);
    setEditando(false);
    if (contrato) {
      try {
        await atualizar.mutateAsync({ id: contrato.id, conteudo_final: novo });
        setContrato({ ...contrato, conteudo_final: novo });
        toast.success('Alterações salvas');
      } catch (e) {
        toast.error('Erro ao salvar', { description: (e as Error).message });
      }
    } else {
      toast.success('Edição aplicada — será usada ao gerar o PDF');
    }
  };

  const validaContratante = () => {
    if (!contratante?.razao_social || !contratante?.cnpj || !contratante?.foro) {
      toast.error('Preencha os dados da contratante em /admin/contratos antes.');
      return false;
    }
    return true;
  };

  const persistirExtrasNaVenda = async () => {
    if (CAMPOS_EXTRAS_POR_TIPO[tipo].length === 0) return;
    const merged = { ...(venda.campos_extras ?? {}), ...extras };
    const { error } = await supabase.from('vendas').update({ campos_extras: merged }).eq('id', venda.id);
    if (error) throw error;
  };

  const gerarPdfEUpload = async (c: Contrato) => {
    const blob = await htmlParaPdfBlob(c.conteudo_final);
    const hash = await sha256(blob);
    const path = await uploadContratoPdf(c.id, blob);
    await atualizar.mutateAsync({ id: c.id, pdf_path: path });
    return { path, hash, blob };
  };

  const handleGerar = async () => {
    if (!template || !validaContratante()) return;
    setGerando(true);
    try {
      await persistirExtrasNaVenda();
      let c = contrato;
      if (!c) {
        c = await criar.mutateAsync({
          venda_id: venda.id,
          template_id: template.id,
          conteudo_final: html.replace(/PRE-[A-Z0-9]+/g, ''),
          tipo,
        });
      }
      // Regenera com número real (a menos que o usuário tenha editado manualmente)
      const vendaComExtras = { ...venda, campos_extras: { ...(venda.campos_extras ?? {}), ...extras } };
      const finalHtml = htmlEditado
        ? htmlEditado.replace(/PRE-[A-Z0-9]+/g, String(c.numero))
        : renderTemplate(template.conteudo_html, montarVariaveis(vendaComExtras, lead, contratante ?? null, c.numero, tipo));
      await atualizar.mutateAsync({ id: c.id, conteudo_final: finalHtml });
      c = { ...c, conteudo_final: finalHtml };

      const { blob, path } = await gerarPdfEUpload(c);
      c = { ...c, pdf_path: path };
      baixarBlob(blob, `contrato-${c.numero}-${nomeArquivoSeguro(venda.cliente_nome)}.pdf`);
      setContrato(c);
      toast.success(`Contrato #${c.numero} gerado`);
    } catch (e) {
      toast.error('Erro ao gerar contrato', { description: (e as Error).message });
    } finally {
      setGerando(false);
    }
  };

  const handleEnviarWhatsApp = async () => {
    if (!template || !validaContratante()) return;
    const telefone = lead?.telefone?.replace(/\D/g, '');
    if (!telefone) { toast.error('Cliente sem telefone cadastrado.'); return; }
    setEnviando(true);
    try {
      await persistirExtrasNaVenda();
      let c = contrato;
      if (!c || !c.pdf_path) {
        c = c ?? await criar.mutateAsync({
          venda_id: venda.id, template_id: template.id, conteudo_final: html, tipo,
        });
        const vendaComExtras = { ...venda, campos_extras: { ...(venda.campos_extras ?? {}), ...extras } };
        const finalHtml = htmlEditado
          ? htmlEditado.replace(/PRE-[A-Z0-9]+/g, String(c.numero))
          : renderTemplate(template.conteudo_html, montarVariaveis(vendaComExtras, lead, contratante ?? null, c.numero, tipo));
        await atualizar.mutateAsync({ id: c.id, conteudo_final: finalHtml });
        c = { ...c, conteudo_final: finalHtml };
        const { path } = await gerarPdfEUpload(c);
        c = { ...c, pdf_path: path };
      }

      const linkAssinatura = `${window.location.origin}/contrato/${c.token_publico}`;
      const msg = `Olá ${venda.cliente_nome},\n\nSegue o contrato de compra e venda referente à sua aquisição (${venda.produto || venda.categoria}).\n\nAcesse, revise e assine eletronicamente:\n${linkAssinatura}\n\nQualquer dúvida estou à disposição.`;
      const wa = `https://wa.me/${telefone.startsWith('55') ? telefone : '55' + telefone}?text=${encodeURIComponent(msg)}`;
      window.open(wa, '_blank', 'noopener');

      await atualizar.mutateAsync({
        id: c.id,
        status: c.status === 'assinado' ? 'assinado' : 'enviado',
        enviado_whatsapp_em: new Date().toISOString(),
      });
      setContrato({ ...c, status: 'enviado' });
      toast.success('WhatsApp aberto com o link de assinatura');
    } catch (e) {
      toast.error('Erro ao preparar envio', { description: (e as Error).message });
    } finally {
      setEnviando(false);
    }
  };

  const copiarLink = async () => {
    if (!contrato) { toast.error('Gere o contrato primeiro.'); return; }
    const link = `${window.location.origin}/contrato/${contrato.token_publico}`;
    await navigator.clipboard.writeText(link);
    toast.success('Link copiado');
  };

  const baixarContrato = async () => {
    if (!contrato) return;
    setBaixando('contrato');
    try {
      await baixarContratoPdf(contrato, venda.cliente_nome);
    } catch (e) {
      toast.error('Erro ao baixar contrato', { description: (e as Error).message });
    } finally { setBaixando(null); }
  };

  const baixarTransporte = async () => {
    if (!contrato) return;
    setBaixando('transporte');
    try {
      await persistirExtrasNaVenda();
      await baixarNotaTransporte(contrato);
    } catch (e) {
      toast.error('Erro ao gerar nota de transporte', { description: (e as Error).message });
    } finally { setBaixando(null); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
            <FileText className="h-5 w-5" />
            {contrato ? `Contrato #${contrato.numero}` : 'Gerar contrato de compra e venda'}
            <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {LABEL_TIPO[tipo]}
            </span>
            {contrato?.status === 'assinado' && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-3 w-3" /> Assinado
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Cliente: <strong>{venda.cliente_nome}</strong> · Valor: <strong>{Number(venda.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-3 border-b border-border pb-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Tipo de contrato</label>
            <Select
              value={tipo}
              onValueChange={(v) => { if (!contrato) setTipo(v as ContratoTipo); }}
              disabled={!!contrato}
            >
              <SelectTrigger className="h-9 w-56 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTRATO_TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {contrato && (
            <p className="text-[10px] text-muted-foreground pb-2">
              O tipo não pode ser alterado após emitido — abra um novo contrato para trocar.
            </p>
          )}
        </div>

        {CAMPOS_EXTRAS_POR_TIPO[tipo].length > 0 && (
          <div className="border-b border-border py-3 max-h-[32vh] overflow-y-auto">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Dados específicos — {LABEL_TIPO[tipo]}
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CAMPOS_EXTRAS_POR_TIPO[tipo].map((f) => {
                const val = extras[f.key] ?? '';
                const onChange = (v: string) => setExtras((prev) => ({ ...prev, [f.key]: v }));
                if (f.type === 'textarea') {
                  return (
                    <div key={f.key} className="min-w-0 space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-medium text-muted-foreground">{f.label}</label>
                      <Textarea
                        value={val}
                        onChange={(e) => onChange(e.target.value)}
                        className="text-xs min-h-[60px]"
                      />
                    </div>
                  );
                }
                return (
                  <div key={f.key} className="min-w-0 space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">{f.label}</label>
                    <Input
                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                      value={val}
                      onChange={(e) => onChange(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="min-h-48 max-h-[50dvh] overflow-auto border border-border rounded-lg bg-white text-black p-3 sm:p-8 my-3">
          {editando ? (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="prose prose-sm max-w-none outline-none focus:ring-2 focus:ring-primary/40 rounded"
              dangerouslySetInnerHTML={{ __html: sanitizeContratoHtml(html) }}
            />
          ) : (
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeContratoHtml(html) }} />

          )}
        </div>

        <DialogFooter className="flex flex-wrap gap-2">
          {editando ? (
            <>
              <Button variant="outline" onClick={cancelarEdicao}>
                <X className="h-4 w-4 mr-1.5" /> Cancelar edição
              </Button>
              <Button onClick={salvarEdicao}>
                <Check className="h-4 w-4 mr-1.5" /> Salvar alterações
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={iniciarEdicao}>
              <Pencil className="h-4 w-4 mr-1.5" /> Editar documento
            </Button>
          )}
          {contrato && (
            <>
              <Button onClick={baixarContrato} disabled={baixando !== null || editando}>
                {baixando === 'contrato' ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
                Baixar contrato
              </Button>
              <Button variant="outline" onClick={baixarTransporte} disabled={baixando !== null || editando}>
                {baixando === 'transporte' ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Truck className="h-4 w-4 mr-1.5" />}
                Nota de transporte
              </Button>
            </>
          )}
          <Button variant="outline" onClick={copiarLink} disabled={!contrato || editando}>
            <Copy className="h-4 w-4 mr-1.5" /> Copiar link de assinatura
          </Button>
          <Button onClick={handleGerar} disabled={gerando || editando} variant="outline">
            {gerando
              ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              : contrato ? <RefreshCw className="h-4 w-4 mr-1.5" /> : <Download className="h-4 w-4 mr-1.5" />}
            {contrato ? 'Regerar PDF' : 'Emitir e baixar contrato'}
          </Button>
          <Button onClick={handleEnviarWhatsApp} disabled={enviando || editando} className="bg-[#25D366] hover:bg-[#20b858] text-white">
            {enviando ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-1.5" />}
            Enviar por WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
