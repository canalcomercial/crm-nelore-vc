import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTemplateAtivo, useSalvarTemplate } from '@/hooks/useContratos';
import {
  VARIAVEIS_COMUNS,
  VARIAVEIS_POR_TIPO,
  CONTRATO_TIPOS,
  type ContratoTipo,
} from '@/types/contratos';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Copy, Loader2, Eye, Code, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeContratoHtml } from '@/lib/sanitize-html';
import { TEMPLATE_NELORE_VC_HTML, TEMPLATE_NELORE_VC_NOME } from '@/lib/templates/contrato-nelore-vc';


export function TemplateEditor() {
  const [tipo, setTipo] = useState<ContratoTipo>('bovinos');
  const { data: tpl, isLoading } = useTemplateAtivo(tipo);
  const salvar = useSalvarTemplate();
  const [html, setHtml] = useState('');
  const [nome, setNome] = useState('');
  const [modo, setModo] = useState<'edit' | 'preview'>('edit');
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (tpl) { setHtml(tpl.conteudo_html); setNome(tpl.nome); }
    else { setHtml(''); setNome(''); }
  }, [tpl?.id]);

  const variaveis = useMemo(
    () => [...VARIAVEIS_COMUNS, ...VARIAVEIS_POR_TIPO[tipo]],
    [tipo],
  );

  const insertVar = (key: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const token = `{{${key}}}`;
    setHtml((prev) => prev.slice(0, start) + token + prev.slice(end));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + token.length, start + token.length); }, 0);
  };

  return (
    <div className="grid grid-cols-[1fr_240px] gap-4">
      <div className="space-y-3">
        <Tabs value={tipo} onValueChange={(v) => setTipo(v as ContratoTipo)}>
          <TabsList>
            {CONTRATO_TIPOS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {isLoading ? (
          <div className="p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : !tpl ? (
          <div className="p-6 text-sm text-muted-foreground">Nenhum template ativo para este tipo.</div>
        ) : (
          <>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="text-lg font-semibold bg-transparent outline-none border-b border-transparent focus:border-border"
            />
          </div>
          <div className="flex gap-1">
            {tipo === 'bovinos' && (
              <Button
                variant="outline"
                size="sm"
                title="Carrega o modelo oficial Nelore VC (nota de leilão + nota promissória + cláusulas). Clique em Salvar template para gravar."
                onClick={() => {
                  setHtml(TEMPLATE_NELORE_VC_HTML);
                  setNome(TEMPLATE_NELORE_VC_NOME);
                  setModo('preview');
                  toast.success('Modelo Nelore VC carregado', { description: 'Revise e clique em "Salvar template".' });
                }}
              >
                <Wand2 className="h-3.5 w-3.5 mr-1" /> Aplicar modelo Nelore VC
              </Button>
            )}
            <Button variant={modo === 'edit' ? 'default' : 'outline'} size="sm" onClick={() => setModo('edit')}>
              <Code className="h-3.5 w-3.5 mr-1" /> Editar
            </Button>
            <Button variant={modo === 'preview' ? 'default' : 'outline'} size="sm" onClick={() => setModo('preview')}>
              <Eye className="h-3.5 w-3.5 mr-1" /> Preview
            </Button>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Dica: use <code className="font-mono">{'<div class="quebra-pagina"></div>'}</code> para iniciar uma nova página no PDF.
        </p>

        {modo === 'edit' ? (
          <Textarea
            ref={taRef}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="font-mono text-xs min-h-[600px]"
            spellCheck={false}
          />
        ) : (
          <div className="border border-border rounded-lg p-8 bg-white text-black min-h-[600px] prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeContratoHtml(html) }}
          />
        )}

        <div className="flex justify-end">
          <Button
            onClick={() => salvar.mutate({ id: tpl.id, conteudo_html: html, nome })}
            disabled={salvar.isPending}
          >
            {salvar.isPending ? 'Salvando...' : 'Salvar template'}
          </Button>
        </div>
          </>
        )}
      </div>

      <div className="bg-surface border border-border rounded-lg p-3 h-fit sticky top-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Variáveis</h3>
        <p className="text-[10px] text-muted-foreground mb-2">Clique para inserir no cursor.</p>
        <div className="space-y-1 max-h-[640px] overflow-y-auto">
          {variaveis.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVar(v.key)}
              className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 rounded hover:bg-muted/60 group"
            >
              <Copy className="h-3 w-3 opacity-40 group-hover:opacity-100 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-mono text-primary truncate">{`{{${v.key}}}`}</div>
                <div className="text-[10px] text-muted-foreground truncate">{v.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}