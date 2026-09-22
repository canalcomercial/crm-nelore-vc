import { supabase } from '@/integrations/supabase/client';
import { montarVariaveis, renderTemplate } from './contrato-render';
import { htmlParaPdfBlob } from './contrato-pdf';
import { uploadContratoPdf } from '@/hooks/useContratos';
import type { Venda, Lead } from '@/types/crm';
import type { Contrato, ContratoContratante, ContratoTemplate } from '@/types/contratos';
import { tipoDaCategoria } from '@/types/contratos';

/**
 * Gera automaticamente o contrato PDF para uma venda recém-criada.
 * - Busca template ativo, contratante e lead
 * - Cria a linha em `contratos`, renderiza HTML com variáveis
 * - Gera o PDF via html2canvas/jsPDF e salva no bucket `contratos-pdf`
 * - Atualiza `conteudo_final` e `pdf_path`
 *
 * Retorna o contrato criado ou lança erro se pré-requisitos faltarem.
 */
export async function gerarContratoDaVenda(vendaId: string): Promise<Contrato> {
  const { data: venda, error: vErr } = await supabase
    .from('vendas').select('*').eq('id', vendaId).single();
  if (vErr || !venda) throw new Error('Venda não encontrada');

  const tipo = tipoDaCategoria((venda as { categoria?: string }).categoria);
  const { data: template, error: tErr } = await supabase
    .from('contrato_templates').select('*')
    .eq('ativo', true).eq('tipo', tipo)
    .order('atualizado_em', { ascending: false })
    .limit(1).maybeSingle();
  if (tErr) throw tErr;
  if (!template) throw new Error(`Nenhum template de contrato ativo do tipo "${tipo}". Configure em /admin/contratos.`);

  const { data: contratante, error: cErr } = await supabase
    .from('contrato_contratante').select('*').limit(1).maybeSingle();
  if (cErr) throw cErr;
  if (!contratante?.razao_social || !contratante?.cnpj || !contratante?.foro) {
    throw new Error('Dados da contratante incompletos. Preencha em /admin/contratos.');
  }

  let lead: Lead | null = null;
  if (venda.lead_id) {
    const { data } = await supabase.from('leads').select('*').eq('id', venda.lead_id).maybeSingle();
    lead = (data ?? null) as unknown as Lead | null;
  }

  // Cria contrato (número é gerado por default no banco)
  const { data: contratoCriado, error: insErr } = await supabase
    .from('contratos')
    .insert({
      venda_id: vendaId,
      template_id: (template as ContratoTemplate).id,
      conteudo_final: '',
      tipo,
    })
    .select('*').single();
  if (insErr || !contratoCriado) throw insErr ?? new Error('Falha ao criar contrato');
  const contrato = contratoCriado as Contrato;

  const vars = montarVariaveis(
    venda as unknown as Venda,
    lead,
    contratante as ContratoContratante,
    contrato.numero,
    tipo,
  );
  const finalHtml = renderTemplate((template as ContratoTemplate).conteudo_html, vars);

  const { error: conteudoError } = await supabase.from('contratos').update({ conteudo_final: finalHtml }).eq('id', contrato.id);
  if (conteudoError) throw conteudoError;

  const blob = await htmlParaPdfBlob(finalHtml);
  const path = await uploadContratoPdf(contrato.id, blob);
  const { error: pdfError } = await supabase.from('contratos').update({ pdf_path: path }).eq('id', contrato.id);
  if (pdfError) throw pdfError;

  return { ...contrato, conteudo_final: finalHtml, pdf_path: path };
}
