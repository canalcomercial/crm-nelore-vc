import { supabase } from '@/integrations/supabase/client';
import { escapeHtml } from './sanitize-html';
import { htmlParaPdfBlob, baixarBlob, nomeArquivoSeguro } from './contrato-pdf';
import type { Contrato, ContratoContratante } from '@/types/contratos';
import type { Lead, Venda } from '@/types/crm';

type Dados = {
  contrato: Contrato;
  venda: Venda | null;
  lead: Lead | null;
  contratante: ContratoContratante | null;
};

const LINHA = '<span style="color:#9a9a9a;">____________________</span>';

function v(x: unknown): string {
  if (x === undefined || x === null) return LINHA;
  const s = String(x).trim();
  if (!s || s === '—') return LINHA;
  return escapeHtml(s);
}

function juntar(...partes: (string | null | undefined)[]): string {
  return partes.map((p) => (p ?? '').trim()).filter(Boolean).join(' / ');
}

const TITULO = 'background:#1f3b2c;color:#fff;font-weight:bold;font-size:12px;padding:5px 8px;letter-spacing:1px;';
const LBL = 'border:1px solid #444;padding:4px 7px;font-size:10.5px;font-weight:bold;background:#f1f1f1;white-space:nowrap;width:1%;';
const TD = 'border:1px solid #444;padding:4px 7px;font-size:11.5px;';

function linha(label: string, valor: string, label2?: string, valor2?: string) {
  if (label2 === undefined) {
    return `<tr><td style="${LBL}">${label}</td><td style="${TD}" colspan="3">${valor}</td></tr>`;
  }
  return `<tr><td style="${LBL}">${label}</td><td style="${TD}">${valor}</td><td style="${LBL}">${label2}</td><td style="${TD}">${valor2}</td></tr>`;
}

/** Monta o HTML da Nota de Transporte com toda a documentação das fazendas vendedora e compradora. */
export function montarNotaTransporteHtml({ contrato, venda, lead, contratante: c }: Dados): string {
  const extras = ((venda?.campos_extras ?? {}) as Record<string, unknown>);
  const ex = (k: string) => (extras[k] === undefined || extras[k] === null ? '' : String(extras[k]));
  const emitidoEm = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const dataVenda = venda?.data_venda ? new Date(venda.data_venda).toLocaleDateString('pt-BR') : '';
  const especificacao = ex('bovinos_especificacao_lote')
    || [venda?.quantidade, venda?.produto || venda?.categoria].filter(Boolean).join(' ');

  const vendedorMunicipio = c?.municipio_propriedade || juntar(c?.cidade, c?.uf);
  const compradorMunicipio = juntar(lead?.cidade, lead?.estado);

  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;">
<table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
<tr>
<td style="border:2px solid #1f3b2c;padding:8px 10px;">
<div style="font-size:17px;font-weight:bold;">NOTA DE TRANSPORTE DE ANIMAIS</div>
<div style="font-size:11px;color:#333;">Documentação das propriedades de origem e destino — acompanha o transportador</div>
<div style="font-size:13px;font-weight:bold;color:#1f3b2c;margin-top:2px;">NELORE VC</div>
</td>
<td style="border:2px solid #1f3b2c;padding:8px 10px;width:210px;font-size:11px;line-height:1.6;">
<div><strong>Contrato nº:</strong> ${escapeHtml(String(contrato.numero))}</div>
<div><strong>Nota:</strong> ${v(ex('bovinos_nota'))}</div>
<div><strong>Lote:</strong> ${v(ex('bovinos_lote'))}</div>
<div><strong>Data da venda:</strong> ${v(dataVenda)}</div>
<div><strong>Emitida em:</strong> ${escapeHtml(emitidoEm)}</div>
</td>
</tr>
</table>

<div style="${TITULO}">1. ORIGEM — FAZENDA VENDEDORA (REMETENTE)</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
${linha('VENDEDOR', v(c?.razao_social), 'CPF/CNPJ', v(c?.cnpj))}
${linha('INSC. ESTADUAL', v(c?.inscricao_estadual), 'TELEFONE', v(c?.telefone))}
${linha('FAZENDA', v(c?.fazenda_nome))}
${linha('ENDEREÇO DA PROPRIEDADE', v(c?.endereco_propriedade || c?.endereco))}
${linha('MUNICÍPIO / UF', v(vendedorMunicipio), 'CEP', v(c?.cep))}
${linha('NIRF', v(c?.nirf), 'CIB', v(c?.cib))}
${linha('CÓD. DA PROPRIEDADE', v(c?.codigo_propriedade))}
</table>

<div style="${TITULO}">2. DESTINO — FAZENDA COMPRADORA (DESTINATÁRIO)</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
${linha('COMPRADOR', v(lead?.nome || venda?.cliente_nome), 'CPF/CNPJ', v(lead?.cpf))}
${linha('INSC. ESTADUAL', v(lead?.inscricao_estadual || ex('bovinos_nf_inscricao')), 'TELEFONE', v(juntar(lead?.telefone, ex('bovinos_contato_2'))))}
${linha('FAZENDA', v(lead?.fazenda))}
${linha('ENDEREÇO DA PROPRIEDADE', v(lead?.endereco_propriedade))}
${linha('MUNICÍPIO / UF', v(compradorMunicipio), 'CEP', v(ex('bovinos_cep')))}
${linha('NIRF', v(lead?.nirf), 'CIB', v(lead?.cib))}
${linha('CÓD. DA PROPRIEDADE', v(lead?.codigo_propriedade))}
${linha('NOTA FISCAL EM NOME DE', v(ex('bovinos_nf_nome') || lead?.nome || venda?.cliente_nome), 'MUNICÍPIO (NF)', v(ex('bovinos_nf_municipio')))}
</table>

<div style="${TITULO}">3. CARGA</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
${linha('CATEGORIA / PRODUTO', v(juntar(venda?.categoria, venda?.produto)), 'QUANTIDADE', v(venda?.quantidade))}
<tr><td style="${LBL}">ESPECIFICAÇÃO DO LOTE</td><td style="${TD}white-space:pre-line;" colspan="3">${v(especificacao)}</td></tr>
</table>

<div style="${TITULO}">4. DOCUMENTOS QUE ACOMPANHAM A CARGA</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
${linha('GTA Nº', LINHA, 'EMISSÃO GTA', LINHA)}
${linha('NOTA FISCAL Nº', LINHA, 'SÉRIE', LINHA)}
<tr><td style="${TD}" colspan="4">
☐ GTA — Guia de Trânsito Animal &nbsp;&nbsp; ☐ Nota Fiscal de produtor &nbsp;&nbsp; ☐ Atestados de brucelose / tuberculose<br/>
☐ Comprovante de vacinação &nbsp;&nbsp; ☐ Cópia do contrato nº ${escapeHtml(String(contrato.numero))} &nbsp;&nbsp; ☐ Registros genealógicos (RGD/RGN)
</td></tr>
</table>

<div style="${TITULO}">5. TRANSPORTADOR</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
${linha('TRANSPORTADORA', LINHA, 'CPF/CNPJ', LINHA)}
${linha('MOTORISTA', LINHA, 'CPF', LINHA)}
${linha('CNH', LINHA, 'TELEFONE', LINHA)}
${linha('PLACA CAVALO', LINHA, 'PLACA CARRETA', LINHA)}
${linha('SAÍDA (DATA/HORA)', LINHA, 'CHEGADA (DATA/HORA)', LINHA)}
${linha('Nº DE ANIMAIS EMBARCADOS', LINHA, 'Nº DE ANIMAIS RECEBIDOS', LINHA)}
</table>

<div style="${TD}margin-bottom:26px;min-height:40px;"><strong style="font-size:10.5px;">OBSERVAÇÕES:</strong><br/>${venda?.observacoes ? escapeHtml(venda.observacoes) : ''}</div>

<table style="width:100%;border-collapse:collapse;">
<tr>
<td style="width:33%;text-align:center;font-size:10.5px;padding:0 6px;">____________________________<br/><strong>${escapeHtml(c?.razao_social || 'Vendedor')}</strong><br/>EXPEDIDOR / VENDEDOR</td>
<td style="width:33%;text-align:center;font-size:10.5px;padding:0 6px;">____________________________<br/><strong>&nbsp;</strong><br/>MOTORISTA</td>
<td style="width:33%;text-align:center;font-size:10.5px;padding:0 6px;">____________________________<br/><strong>${escapeHtml(lead?.nome || venda?.cliente_nome || 'Comprador')}</strong><br/>RECEBEDOR / COMPRADOR</td>
</tr>
</table>
</div>`;
}

async function carregarDados(contrato: Contrato): Promise<Dados> {
  const { data: venda } = await supabase.from('vendas').select('*').eq('id', contrato.venda_id).maybeSingle();
  let lead: Lead | null = null;
  const leadId = (venda as { lead_id?: string | null } | null)?.lead_id;
  if (leadId) {
    const { data } = await supabase.from('leads').select('*').eq('id', leadId).maybeSingle();
    lead = (data ?? null) as unknown as Lead | null;
  }
  const { data: contratante } = await supabase.from('contrato_contratante').select('*').limit(1).maybeSingle();
  return {
    contrato,
    venda: (venda ?? null) as unknown as Venda | null,
    lead,
    contratante: (contratante ?? null) as unknown as ContratoContratante | null,
  };
}

/** Gera e baixa o PDF da Nota de Transporte de um contrato emitido. */
export async function baixarNotaTransporte(contrato: Contrato): Promise<void> {
  const dados = await carregarDados(contrato);
  const html = montarNotaTransporteHtml(dados);
  const blob = await htmlParaPdfBlob(html, { umaPagina: true });
  const cliente = dados.lead?.nome || dados.venda?.cliente_nome || 'cliente';
  baixarBlob(blob, `nota-transporte-${contrato.numero}-${nomeArquivoSeguro(cliente)}.pdf`);
}

/**
 * Baixa o PDF do contrato. Usa o PDF salvo no storage quando existir;
 * caso contrário gera na hora a partir do conteúdo final.
 */
export async function baixarContratoPdf(contrato: Contrato, clienteNome?: string): Promise<void> {
  const nome = `contrato-${contrato.numero}-${nomeArquivoSeguro(clienteNome || 'cliente')}.pdf`;
  if (contrato.pdf_path) {
    const { data, error } = await supabase.storage.from('contratos-pdf').download(contrato.pdf_path);
    if (!error && data) {
      baixarBlob(data, nome);
      return;
    }
  }
  if (!contrato.conteudo_final) throw new Error('Contrato sem conteúdo para gerar o PDF.');
  const blob = await htmlParaPdfBlob(contrato.conteudo_final);
  baixarBlob(blob, nome);
}
