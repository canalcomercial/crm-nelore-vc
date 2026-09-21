import type { ContratoContratante } from '@/types/contratos';
import type { ContratoTipo } from '@/types/contratos';
import type { Venda } from '@/types/crm';
import type { Lead } from '@/types/crm';
import { escapeHtml } from './sanitize-html';


export function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function extensoInt(n: number): string {
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
  // Aceita as chaves padrão (doc_*) e as antigas (bovinos_*) de forma intercambiável.
  const rawExtra = (k: string) => {
    const alt = k.startsWith('doc_')
      ? `bovinos_${k.slice(4)}`
      : k.startsWith('bovinos_') ? `doc_${k.slice(8)}` : null;
    const v = extras[k] ?? (alt ? extras[alt] : undefined);
    return v;
  };
  const getExtra = (k: string) => {
    const v = rawExtra(k);
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
    cliente_endereco_propriedade: lead?.endereco_propriedade || '—',
    cliente_inscricao_estadual: lead?.inscricao_estadual || '—',
    cliente_nirf: lead?.nirf || '—',
    cliente_cib: lead?.cib || '—',
    cliente_codigo_propriedade: lead?.codigo_propriedade || '—',
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
    data_venda_curta: dataVenda.toLocaleDateString('pt-BR'),
    data_venda_maiuscula: dataFmt.toUpperCase(),
    ano_venda: String(dataVenda.getFullYear()),
    valor_unitario: fmtBRL(venda.quantidade ? valor / venda.quantidade : valor),
    contratante_razao_social: contratante?.razao_social || '—',
    contratante_cnpj: contratante?.cnpj || '—',
    contratante_endereco: contratante?.endereco || '—',
    contratante_cidade: contratante?.cidade || '—',
    contratante_uf: contratante?.uf || '—',
    contratante_representante_nome: contratante?.representante_nome || '—',
    contratante_representante_cpf: contratante?.representante_cpf || '—',
    contratante_foro: contratante?.foro || contratante?.cidade || '—',
    contratante_telefone: contratante?.telefone || '—',
    contratante_inscricao_estadual: contratante?.inscricao_estadual || '—',
    contratante_cep: contratante?.cep || '—',
    contratante_fazenda: contratante?.fazenda_nome || '—',
  };
  // Bloco padrão (nota/lote, valores, comissão, parcelas, avalista, testemunhas)
  // vale para TODOS os tipos de contrato — só as informações mudam.
  const padrao = montarVariaveisPadrao(venda, contratante, dataVenda, getExtra);
  Object.assign(base, padrao);
  for (const [k, v] of Object.entries(padrao)) {
    if (k.startsWith('bovinos_')) base[`doc_${k.slice(8)}`] = v;
  }
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

function numExtra(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const direto = Number(v);
  if (Number.isFinite(direto)) return direto;
  const br = Number(String(v).replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(br) ? br : null;
}

function parseDataLocal(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addMeses(d: Date, meses: number): Date {
  const r = new Date(d.getFullYear(), d.getMonth() + meses, 1);
  const ultimoDia = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  r.setDate(Math.min(d.getDate(), ultimoDia));
  return r;
}

export type Parcela = { numero: number; valor: number; vencimento: Date };

/** Calcula as parcelas mensais a partir do valor líquido e do 1º vencimento. */
export function calcularParcelas(valorLiquido: number, qtd: number, primeiroVenc: Date): Parcela[] {
  const n = Math.max(1, Math.floor(qtd || 1));
  const centavos = Math.round(valorLiquido * 100);
  const base = Math.floor(centavos / n);
  const resto = centavos - base * n;
  return Array.from({ length: n }, (_, i) => ({
    numero: i + 1,
    valor: (base + (i === n - 1 ? resto : 0)) / 100,
    vencimento: addMeses(primeiroVenc, i),
  }));
}

/** Tabela HTML das parcelas (3 colunas por linha, como no modelo Nelore VC). */
export function tabelaParcelasHtml(parcelas: Parcela[]): string {
  const td = 'border:1px solid #999;padding:3px 6px;font-size:11px;';
  const cells = parcelas.map((p) =>
    `<td style="${td}white-space:nowrap"><strong>${p.numero}ª parc.</strong></td>`
    + `<td style="${td}text-align:right;white-space:nowrap">${escapeHtml(fmtBRL(p.valor))}</td>`
    + `<td style="${td}text-align:center;white-space:nowrap">${escapeHtml(p.vencimento.toLocaleDateString('pt-BR'))}</td>`,
  );
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 3) {
    const chunk = cells.slice(i, i + 3);
    while (chunk.length < 3) chunk.push(`<td style="${td}"></td><td style="${td}"></td><td style="${td}"></td>`);
    rows.push(`<tr>${chunk.join('')}</tr>`);
  }
  return `<table style="width:100%;border-collapse:collapse;margin:6px 0">${rows.join('')}</table>`;
}

function montarVariaveisPadrao(
  venda: Venda,
  contratante: ContratoContratante | null,
  dataVenda: Date,
  getExtra: (k: string) => string,
): Record<string, string> {
  const opt = (k: string) => (getExtra(k) === '—' ? undefined : getExtra(k));
  const valor = Number(venda.valor_total) || 0;
  const qtdParcelas = venda.qtd_parcelas && venda.qtd_parcelas > 0 ? venda.qtd_parcelas : 1;
  const quantidade = venda.quantidade && venda.quantidade > 0 ? venda.quantidade : 1;
  const desconto = numExtra(opt('bovinos_valor_desconto')) ?? 0;
  const liquido = Math.max(0, valor - desconto);
  const lance = numExtra(opt('bovinos_valor_lance')) ?? valor / qtdParcelas / quantidade;
  const comissaoPct = numExtra(opt('bovinos_comissao_percentual')) ?? (venda.comissao_percentual ?? 0);
  const primeiroVencStr = opt('bovinos_primeiro_vencimento') ?? '';
  const primeiroVenc = (primeiroVencStr && parseDataLocal(primeiroVencStr)) || dataVenda;
  const parcelas = calcularParcelas(liquido, qtdParcelas, primeiroVenc);

  const praca = getExtra('bovinos_praca') !== '—'
    ? getExtra('bovinos_praca')
    : [contratante?.cidade, contratante?.uf].filter(Boolean).join('/') || '—';

  const vazioSeTraco = (k: string) => (getExtra(k) === '—' ? '' : getExtra(k));

  return {
    bovinos_nota: getExtra('bovinos_nota'),
    bovinos_lote: getExtra('bovinos_lote'),
    bovinos_especificacao_lote: getExtra('bovinos_especificacao_lote') !== '—'
      ? getExtra('bovinos_especificacao_lote')
      : `${venda.quantidade} ${venda.produto || venda.categoria}`,
    bovinos_contato_2: getExtra('bovinos_contato_2'),
    bovinos_cep: getExtra('bovinos_cep'),
    bovinos_nf_nome: getExtra('bovinos_nf_nome') !== '—' ? getExtra('bovinos_nf_nome') : venda.cliente_nome || '—',
    bovinos_nf_inscricao: getExtra('bovinos_nf_inscricao'),
    bovinos_nf_municipio: getExtra('bovinos_nf_municipio'),
    bovinos_valor_lance: fmtBRL(lance),
    bovinos_valor_desconto: fmtBRL(desconto),
    bovinos_valor_liquido: fmtBRL(liquido),
    bovinos_valor_liquido_extenso: valorPorExtenso(liquido),
    bovinos_comissao_percentual: `${comissaoPct.toLocaleString('pt-BR')}%`,
    bovinos_valor_comissao: fmtBRL((valor * comissaoPct) / 100),
    bovinos_qtd_parcelas: String(parcelas.length),
    bovinos_primeiro_vencimento: primeiroVenc.toLocaleDateString('pt-BR'),
    bovinos_ultimo_vencimento: parcelas[parcelas.length - 1].vencimento.toLocaleDateString('pt-BR'),
    bovinos_praca: praca,
    bovinos_avalista_nome: vazioSeTraco('bovinos_avalista_nome'),
    bovinos_avalista_cpf: vazioSeTraco('bovinos_avalista_cpf'),
    bovinos_testemunha1: vazioSeTraco('bovinos_testemunha1'),
    bovinos_testemunha2: vazioSeTraco('bovinos_testemunha2'),
    tabela_parcelas_html: tabelaParcelasHtml(parcelas),
  };
}

/**
 * Substitui {{variavel}} pelo valor escapado.
 * Variáveis terminadas em `_html` são geradas internamente (já escapadas) e entram cruas.
 */
export function renderTemplate(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, k: string) => {
    if (vars[k] === undefined) return `{{${k}}}`;
    return k.endsWith('_html') ? vars[k] : escapeHtml(vars[k]);
  });
}
