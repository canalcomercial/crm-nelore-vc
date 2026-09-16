export type ContratoStatus = 'rascunho' | 'enviado' | 'assinado' | 'cancelado';

export type ContratoTipo = 'bovinos' | 'embrioes' | 'semen';

export const CONTRATO_TIPOS: { value: ContratoTipo; label: string }[] = [
  { value: 'bovinos', label: 'Compra e Venda (Bovinos)' },
  { value: 'embrioes', label: 'Embriões' },
  { value: 'semen', label: 'Sêmen' },
];

export const LABEL_TIPO: Record<ContratoTipo, string> = {
  bovinos: 'Bovinos',
  embrioes: 'Embriões',
  semen: 'Sêmen',
};

export type ContratoContratante = {
  id: string;
  razao_social: string;
  cnpj: string;
  inscricao_estadual: string | null;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string | null;
  representante_nome: string;
  representante_cpf: string;
  representante_cargo: string | null;
  foro: string;
  telefone: string | null;
  email: string | null;
  // Documentação da propriedade do vendedor (usada na nota de transporte)
  fazenda_nome?: string | null;
  endereco_propriedade?: string | null;
  nirf?: string | null;
  cib?: string | null;
  codigo_propriedade?: string | null;
  municipio_propriedade?: string | null;
};

export type ContratoTemplate = {
  id: string;
  nome: string;
  conteudo_html: string;
  ativo: boolean;
  versao: number;
  atualizado_em: string;
  tipo: ContratoTipo;
};

export type Contrato = {
  id: string;
  numero: number;
  venda_id: string;
  template_id: string | null;
  conteudo_final: string;
  pdf_path: string | null;
  status: ContratoStatus;
  tipo: ContratoTipo;
  token_publico: string;
  enviado_whatsapp_em: string | null;
  assinatura_nome: string | null;
  assinatura_cpf: string | null;
  assinatura_ip: string | null;
  assinatura_hash: string | null;
  assinado_em: string | null;
  criado_em: string;
};

export const VARIAVEIS_COMUNS: { key: string; label: string }[] = [
  { key: 'numero_contrato', label: 'Número do contrato' },
  { key: 'cliente_nome', label: 'Nome do cliente' },
  { key: 'cliente_cpf', label: 'CPF/CNPJ do cliente' },
  { key: 'cliente_telefone', label: 'Telefone do cliente' },
  { key: 'cliente_fazenda', label: 'Fazenda do cliente' },
  { key: 'cliente_cidade', label: 'Cidade do cliente' },
  { key: 'cliente_estado', label: 'Estado do cliente' },
  { key: 'cliente_endereco_propriedade', label: 'Cliente — endereço da propriedade' },
  { key: 'cliente_inscricao_estadual', label: 'Cliente — inscrição estadual' },
  { key: 'cliente_nirf', label: 'Cliente — NIRF' },
  { key: 'cliente_cib', label: 'Cliente — CIB' },
  { key: 'cliente_codigo_propriedade', label: 'Cliente — código da propriedade' },
  { key: 'produto', label: 'Produto / categoria' },
  { key: 'quantidade', label: 'Quantidade' },
  { key: 'quantidade_extenso', label: 'Quantidade por extenso' },
  { key: 'valor_total', label: 'Valor total (R$)' },
  { key: 'valor_extenso', label: 'Valor por extenso' },
  { key: 'forma_pagamento', label: 'Forma de pagamento' },
  { key: 'parcelamento_descricao', label: 'Descrição do parcelamento' },
  { key: 'qtd_parcelas', label: 'Nº de parcelas' },
  { key: 'data_venda', label: 'Data da venda' },
  { key: 'data_venda_curta', label: 'Data da venda (dd/mm/aaaa)' },
  { key: 'data_venda_maiuscula', label: 'Data da venda (14 DE SETEMBRO DE 2026)' },
  { key: 'ano_venda', label: 'Ano da venda' },
  { key: 'valor_unitario', label: 'Valor unitário (R$)' },
  { key: 'contratante_razao_social', label: 'Contratante — razão social' },
  { key: 'contratante_cnpj', label: 'Contratante — CNPJ' },
  { key: 'contratante_endereco', label: 'Contratante — endereço' },
  { key: 'contratante_cidade', label: 'Contratante — cidade' },
  { key: 'contratante_uf', label: 'Contratante — UF' },
  { key: 'contratante_representante_nome', label: 'Contratante — representante' },
  { key: 'contratante_representante_cpf', label: 'Contratante — CPF representante' },
  { key: 'contratante_foro', label: 'Contratante — foro' },
  { key: 'contratante_telefone', label: 'Contratante — telefone' },
  { key: 'contratante_inscricao_estadual', label: 'Contratante — inscrição estadual' },
  { key: 'contratante_cep', label: 'Contratante — CEP' },
  { key: 'contratante_fazenda', label: 'Contratante — fazenda' },
];

// Backwards-compat alias
export const VARIAVEIS_CONTRATO = VARIAVEIS_COMUNS;

export const VARIAVEIS_POR_TIPO: Record<ContratoTipo, { key: string; label: string }[]> = {
  bovinos: [
    { key: 'bovinos_nota', label: 'Nota nº' },
    { key: 'bovinos_lote', label: 'Lote' },
    { key: 'bovinos_especificacao_lote', label: 'Especificação do lote' },
    { key: 'bovinos_contato_2', label: 'Contato 2 do comprador' },
    { key: 'bovinos_cep', label: 'CEP do comprador' },
    { key: 'bovinos_nf_nome', label: 'Nota fiscal em nome de' },
    { key: 'bovinos_nf_inscricao', label: 'NF — inscrição estadual' },
    { key: 'bovinos_nf_municipio', label: 'NF — município' },
    { key: 'bovinos_valor_lance', label: 'Valor do lance (R$)' },
    { key: 'bovinos_valor_desconto', label: 'Valor do desconto (R$)' },
    { key: 'bovinos_valor_liquido', label: 'Valor líquido (R$)' },
    { key: 'bovinos_valor_liquido_extenso', label: 'Valor líquido por extenso' },
    { key: 'bovinos_comissao_percentual', label: '% comissão' },
    { key: 'bovinos_valor_comissao', label: 'Valor da comissão (R$)' },
    { key: 'bovinos_qtd_parcelas', label: 'Nº de parcelas (calculado)' },
    { key: 'bovinos_primeiro_vencimento', label: 'Vencimento da 1ª parcela' },
    { key: 'bovinos_ultimo_vencimento', label: 'Vencimento da última parcela' },
    { key: 'bovinos_praca', label: 'Praça de pagamento (cidade/UF)' },
    { key: 'bovinos_avalista_nome', label: 'Avalista — nome' },
    { key: 'bovinos_avalista_cpf', label: 'Avalista — CPF/CNPJ' },
    { key: 'bovinos_testemunha1', label: 'Testemunha 1' },
    { key: 'bovinos_testemunha2', label: 'Testemunha 2' },
    { key: 'tabela_parcelas_html', label: 'Tabela de parcelas (automática)' },
  ],
  embrioes: [
    { key: 'embrioes_raca', label: 'Embriões — raça' },
    { key: 'embrioes_doadora_nome', label: 'Embriões — doadora' },
    { key: 'embrioes_doadora_registro', label: 'Embriões — reg. doadora' },
    { key: 'embrioes_touro_nome', label: 'Embriões — touro' },
    { key: 'embrioes_touro_registro', label: 'Embriões — reg. touro' },
    { key: 'embrioes_qtd', label: 'Embriões — quantidade' },
    { key: 'embrioes_lote', label: 'Embriões — lote / partida' },
    { key: 'embrioes_laboratorio', label: 'Embriões — laboratório' },
    { key: 'embrioes_data_coleta', label: 'Embriões — data da coleta' },
    { key: 'embrioes_entrega', label: 'Embriões — forma de entrega' },
  ],
  semen: [
    { key: 'semen_touro_nome', label: 'Sêmen — touro' },
    { key: 'semen_touro_registro', label: 'Sêmen — registro' },
    { key: 'semen_touro_rgn', label: 'Sêmen — RGN' },
    { key: 'semen_central', label: 'Sêmen — central de coleta' },
    { key: 'semen_partida', label: 'Sêmen — partida' },
    { key: 'semen_qtd_doses', label: 'Sêmen — qtd. doses' },
    { key: 'semen_data_coleta', label: 'Sêmen — data de coleta' },
    { key: 'semen_armazenamento', label: 'Sêmen — armazenamento' },
  ],
};

export const CAMPOS_EXTRAS_POR_TIPO: Record<ContratoTipo, { key: string; label: string; type?: 'text' | 'number' | 'date' | 'textarea' }[]> = {
  bovinos: [
    { key: 'bovinos_nota', label: 'Nota nº' },
    { key: 'bovinos_lote', label: 'Lote' },
    { key: 'bovinos_especificacao_lote', label: 'Especificação do lote (animais, RGD, idade...)', type: 'textarea' },
    { key: 'bovinos_valor_lance', label: 'Valor do lance (R$)', type: 'number' },
    { key: 'bovinos_valor_desconto', label: 'Valor do desconto (R$)', type: 'number' },
    { key: 'bovinos_comissao_percentual', label: '% comissão', type: 'number' },
    { key: 'bovinos_primeiro_vencimento', label: 'Vencimento da 1ª parcela', type: 'date' },
    { key: 'bovinos_praca', label: 'Praça de pagamento (cidade/UF)' },
    { key: 'bovinos_contato_2', label: 'Contato 2 do comprador' },
    { key: 'bovinos_cep', label: 'CEP do comprador' },
    { key: 'bovinos_nf_nome', label: 'Nota fiscal em nome de' },
    { key: 'bovinos_nf_inscricao', label: 'NF — inscrição estadual' },
    { key: 'bovinos_nf_municipio', label: 'NF — município' },
    { key: 'bovinos_avalista_nome', label: 'Avalista — nome' },
    { key: 'bovinos_avalista_cpf', label: 'Avalista — CPF/CNPJ' },
    { key: 'bovinos_testemunha1', label: 'Testemunha 1 — nome' },
    { key: 'bovinos_testemunha2', label: 'Testemunha 2 — nome' },
  ],
  embrioes: [
    { key: 'embrioes_raca', label: 'Raça' },
    { key: 'embrioes_doadora_nome', label: 'Doadora — nome' },
    { key: 'embrioes_doadora_registro', label: 'Doadora — registro' },
    { key: 'embrioes_touro_nome', label: 'Touro — nome' },
    { key: 'embrioes_touro_registro', label: 'Touro — registro' },
    { key: 'embrioes_qtd', label: 'Quantidade de embriões', type: 'number' },
    { key: 'embrioes_lote', label: 'Lote / partida' },
    { key: 'embrioes_laboratorio', label: 'Laboratório' },
    { key: 'embrioes_data_coleta', label: 'Data da coleta', type: 'date' },
    { key: 'embrioes_entrega', label: 'Forma de entrega', type: 'textarea' },
  ],
  semen: [
    { key: 'semen_touro_nome', label: 'Touro — nome' },
    { key: 'semen_touro_registro', label: 'Touro — registro' },
    { key: 'semen_touro_rgn', label: 'Touro — RGN' },
    { key: 'semen_central', label: 'Central de coleta' },
    { key: 'semen_partida', label: 'Partida' },
    { key: 'semen_qtd_doses', label: 'Qtd. de doses', type: 'number' },
    { key: 'semen_data_coleta', label: 'Data de coleta', type: 'date' },
    { key: 'semen_armazenamento', label: 'Condições de armazenamento', type: 'textarea' },
  ],
};

export function tipoDaCategoria(categoria: string | null | undefined): ContratoTipo {
  const c = (categoria ?? '').toLowerCase();
  if (c.includes('embri')) return 'embrioes';
  if (c.includes('sêmen') || c.includes('semen')) return 'semen';
  return 'bovinos';
}