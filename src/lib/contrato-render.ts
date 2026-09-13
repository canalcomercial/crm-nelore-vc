import type { ContratoContratante } from '@/types/contratos';
import type { ContratoTipo } from '@/types/contratos';
import type { Venda } from '@/types/crm';
import type { Lead } from '@/types/crm';
import { escapeHtml } from './sanitize-html';


function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function extensoInt(n: number): string {
  if (n === 0) return 'zero';
  const un = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const dez = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  const nnn = (v: number): string => {
    if (v === 100) return 'cem';
    const c = Math.floor(v / 100);
    const resto = v % 100;
    const parts: string[] = [];
    if (c) parts.push(centenas[c]);
    if (resto >= 10 && resto < 20) parts.push(dez[resto - 10]);
    else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      if (d) parts.push(dezenas[d]);
      if (u) parts.push(un[u]);
    }
    return parts.join(' e ');
  };
  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const parts: string[] = [];
  if (milhoes) parts.push(`${nnn(milhoes)} ${milhoes === 1 ? 'milhão' : 'milhões'}`);
  if (milhares) parts.push(`${milhares === 1 ? 'mil' : nnn(milhares) + ' mil'}`);
  if (resto) parts.push(nnn(resto));
  return parts.join(' e ');
}

export function valorPorExtenso(v: number): string {
  const reais = Math.floor(v);
  const centavos = Math.round((v - reais) * 100);
  const partes: string[] = [];
  if (reais > 0) partes.push(`${extensoInt(reais)} ${reais === 1 ? 'real' : 'reais'}`);
  if (centavos > 0) partes.push(`${extensoInt(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`);
  return partes.join(' e ') || 'zero reais';
}

export function montarVariaveis(
  venda: Venda,
  lead: Lead | null,
  contratante: ContratoContratante | null,
  numero: number | string,
  tipo: ContratoTipo = 'bovinos',
): Record<string, string> {
  const valor = Number(venda.valor_total) || 0;
  const dataVenda = venda.data_venda ? new Date(venda.data_venda) : new Date(venda.criado_em);
  const dataFmt = dataVenda.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const extras = (venda.campos_extras ?? {}) as Record<string, unknown>;
  const getExtra = (k: string) => {
    const v = extras[k];
    if (v === undefined || v === null || v === '') return '—';
    return String(v);
  };
  const base: Record<string, string> = {
    numero_contrato: String(numero),
    cliente_nome: venda.cliente_nome || '—',
    cliente_cpf: lead?.cpf || '—',
    cliente_telefone: lead?.telefone || '—',
    cliente_fazenda: lead?.fazenda || venda.fazenda_fornecedor || '—',
    cliente_cidade: lead?.cidade || '—',
    cliente_estado: lead?.estado || '—',
    produto: venda.produto || venda.categoria,
    quantidade: String(venda.quantidade),
    quantidade_extenso: extensoInt(venda.quantidade),
    valor_total: fmtBRL(valor),
    valor_extenso: valorPorExtenso(valor),
    forma_pagamento: venda.forma_pagamento || 'À vista',
    parcelamento_descricao: venda.parcelamento_descricao
      || (venda.qtd_parcelas ? `${venda.qtd_parcelas}x ${venda.tipo_parcelamento || ''}`.trim() : 'À vista'),
    qtd_parcelas: venda.qtd_parcelas ? String(venda.qtd_parcelas) : '—',
    data_venda: dataFmt,
    contratante_razao_social: contratante?.razao_social || '—',
    contratante_cnpj: contratante?.cnpj || '—',
    contratante_endereco: contratante?.endereco || '—',
    contratante_cidade: contratante?.cidade || '—',
    contratante_uf: contratante?.uf || '—',
    contratante_representante_nome: contratante?.representante_nome || '—',
    contratante_representante_cpf: contratante?.representante_cpf || '—',
    contratante_foro: contratante?.foro || contratante?.cidade || '—',
  };
  if (tipo === 'embrioes') {
    for (const k of [
      'embrioes_raca','embrioes_doadora_nome','embrioes_doadora_registro',
      'embrioes_touro_nome','embrioes_touro_registro','embrioes_qtd',
      'embrioes_lote','embrioes_laboratorio','embrioes_data_coleta','embrioes_entrega',
    ]) base[k] = getExtra(k);
  } else if (tipo === 'semen') {
    for (const k of [
      'semen_touro_nome','semen_touro_registro','semen_touro_rgn',
      'semen_central','semen_partida','semen_qtd_doses',
      'semen_data_coleta','semen_armazenamento',
    ]) base[k] = getExtra(k);
  }
  return base;
}

export function renderTemplate(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    vars[k] !== undefined ? escapeHtml(vars[k]) : `{{${k}}}`,
  );
}
