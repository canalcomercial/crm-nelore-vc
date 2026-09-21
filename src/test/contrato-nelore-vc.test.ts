import { describe, it, expect, vi } from 'vitest';

// Estes testes validam geração de documentos, sem acessar o banco de produção.
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { montarVariaveis, renderTemplate, calcularParcelas } from '@/lib/contrato-render';
import { TEMPLATE_NELORE_VC_HTML } from '@/lib/templates/contrato-nelore-vc';
import { montarNotaTransporteHtml } from '@/lib/nota-transporte';
import type { Venda, Lead } from '@/types/crm';
import type { Contrato, ContratoContratante } from '@/types/contratos';

const venda = {
  id: 'v1', lead_id: 'l1', cliente_nome: 'DEMIVAN PEREIRA DA GAMA', produto: 'Touro Nelore PO', categoria: 'Touros Nelore PO',
  quantidade: 1, valor_total: 82500, leilao_evento: null, fazenda_fornecedor: null, vendedor_id: null,
  forma_pagamento: 'Parcelado', parcelamento_descricao: '1 + 29', qtd_parcelas: 30, tipo_parcelamento: 'Diretas',
  status: 'em_aberto', observacoes: null, comissao_percentual: null, data_venda: '2026-09-14T12:00:00.000Z',
  vendedor_externo: null, tipo_vendedor: 'interno', criado_em: '2026-09-14T12:00:00.000Z',
  campos_extras: { bovinos_nota: '159', bovinos_lote: '12', bovinos_comissao_percentual: '8', bovinos_primeiro_vencimento: '2026-09-28', bovinos_especificacao_lote: 'Touro VC 1234\nRGD 5678' },
} as unknown as Venda;
const lead = {
  id: 'l1', nome: 'DEMIVAN PEREIRA DA GAMA', cpf: '63431700144', telefone: '63999934304', fazenda: 'FAZENDA PIQUIZEIRO',
  cidade: 'FORMOSO DO ARAGUAIA', estado: 'TO', endereco_propriedade: 'Rod. TO-374 km 20', inscricao_estadual: '29.123.456-7',
  nirf: '1.234.567-8', cib: '9999', codigo_propriedade: 'TO-0001',
} as unknown as Lead;
const contratante = {
  id: 'c1', razao_social: 'JOSE AUGUSTO FRANCO VILELA', cnpj: '490.067.546-68', inscricao_estadual: null,
  endereco: 'ROD. BR 153, KM 111 - CX POSTAL 89', cidade: 'PRATA', uf: 'MG', cep: null, representante_nome: 'JOSE',
  representante_cpf: '490.067.546-68', representante_cargo: null, foro: 'PRATA/MG', telefone: '(34) 9.9167-2700', email: null,
} as ContratoContratante;

describe('Modelo Nelore VC', () => {
  it('renderiza sem variáveis pendentes e com 30 parcelas', () => {
    const vars = montarVariaveis(venda, lead, contratante, 1234, 'bovinos');
    const html = renderTemplate(TEMPLATE_NELORE_VC_HTML, vars);
    expect(html).not.toMatch(/\{\{\w+\}\}/);
    expect(html).toContain('30ª parc.');
    expect(html).toContain('R$&nbsp;82.500,00'.replace('&nbsp;', ' '));
    expect(html).toContain('FAZENDA PIQUIZEIRO');
    expect(html).toContain('1.234.567-8');
    expect(vars.bovinos_valor_comissao).toContain('6.600,00');
    (globalThis as { __html?: string }).__html = html;
  });

  it('parcelas somam o total e vencem mensalmente', () => {
    const p = calcularParcelas(1000, 3, new Date(2026, 0, 31));
    expect(p.reduce((s, x) => s + x.valor, 0)).toBeCloseTo(1000, 2);
    expect(p[1].vencimento.getMonth()).toBe(1);
    expect(p[1].vencimento.getDate()).toBe(28);
  });

  it('nota de transporte traz documentação das duas fazendas', () => {
    const html = montarNotaTransporteHtml({ contrato: { numero: 1234 } as Contrato, venda, lead, contratante: { ...contratante, fazenda_nome: 'ESTANCIA VC', nirf: '7.777.777-7' } });
    expect(html).toContain('ESTANCIA VC');
    expect(html).toContain('7.777.777-7');
    expect(html).toContain('TO-0001');
    expect(html).toContain('29.123.456-7');
  });
});

describe('Modelo padrão por tipo', () => {
  it('embriões e sêmen usam o mesmo modelo, sem variáveis pendentes', async () => {
    const { templatePadraoNeloreVC } = await import('@/lib/templates/contrato-nelore-vc');
    for (const tipo of ['embrioes', 'semen'] as const) {
      const vars = montarVariaveis(venda, lead, contratante, 1234, tipo);
      const html = renderTemplate(templatePadraoNeloreVC(tipo).html, vars);
      expect(html).not.toMatch(/\{\{\w+\}\}/);
      expect(html).toContain('NOTA PROMISSÓRIA RURAL ÚNICA');
      expect(html).toContain('30ª parc.');
    }
  });
});
