export type RespostaFormulario = {
  pergunta: string;
  resposta: string;
  grupo?: string;
};

export type StatusCadastro = 'sem_cadastro' | 'aprovado' | 'reprovado';

export type Lead = {
  id: string;
  numero: number;
  nome: string;
  fazenda: string | null;
  telefone: string | null;
  cpf: string | null;
  status_cadastro: StatusCadastro;
  cidade: string | null;
  estado: string | null;
  tipo_cliente: string | null;
  origem: string | null;
  interesse: string | null;
  funil_id: string | null;
  etapa: string | null;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  motivo_perda: string | null;
  observacoes: string | null;
  campos_extras: Record<string, string | number | null>;
  respostas_formulario: RespostaFormulario[];
  meta_lead_id: string | null;
  meta_form_id: string | null;
  meta_form_nome: string | null;
  entrou_etapa_em: string;
  ultimo_contato: string | null;
  arquivado: boolean;
  arquivado_em: string | null;
  criado_em: string;
  atualizado_em: string;
};

export const STATUS_CADASTRO: { value: StatusCadastro; label: string; cor: string }[] = [
  { value: 'sem_cadastro', label: 'Sem cadastro', cor: 'bg-warning/15 text-warning border-warning/30' },
  { value: 'aprovado', label: 'Cadastro aprovado', cor: 'bg-success/15 text-success border-success/30' },
  { value: 'reprovado', label: 'Cadastro reprovado', cor: 'bg-destructive/15 text-destructive border-destructive/30' },
];

export type DocumentoLead = {
  id: string;
  lead_id: string;
  nome: string;
  storage_path: string;
  tamanho_bytes: number;
  mime_type: string | null;
  enviado_por: string | null;
  criado_em: string;
};

/** Campos extras "fixos" sugeridos — aparecem sempre no painel.
 *  Vendedor pode adicionar outros campos livres além destes. */
export const CAMPOS_EXTRAS_PADRAO: { key: string; label: string; tipo?: 'texto' | 'numero' }[] = [
  { key: 'orcamento', label: 'Orçamento', tipo: 'numero' },
  { key: 'prazo_compra', label: 'Prazo p/ comprar' },
  { key: 'raca_preferida', label: 'Raça preferida' },
  { key: 'qtd_cabecas', label: 'Qtd. cabeças', tipo: 'numero' },
  { key: 'finalidade', label: 'Finalidade' },
  { key: 'forma_pagamento', label: 'Forma de pagamento' },
];

export type Funil = {
  id: string;
  nome: string;
  etapas: string[];
  cor: string | null;
  ordem: number;
  ativo: boolean;
};

export type Mensagem = {
  id: string;
  lead_id: string;
  conteudo: string;
  direcao: 'enviada' | 'recebida';
  lido: boolean;
  criado_em: string;
};

export type Interacao = {
  id: string;
  lead_id: string;
  tipo: string;
  conteudo: string | null;
  usuario_id: string | null;
  criado_em: string;
};

export type FollowUp = {
  id: string;
  lead_id: string;
  data_hora: string;
  tipo: string;
  observacao: string | null;
  status: string;
  responsavel_id: string | null;
};

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
};

export const MOTIVOS_PERDA = [
  'Sem resposta',
  'Sem perfil',
  'Sem recurso financeiro',
  'Comprou de outro',
  'Apenas curioso',
  'Produto não atendia',
  'Outro',
] as const;

export type Venda = {
  id: string;
  lead_id: string | null;
  cliente_nome: string;
  produto: string | null;
  categoria: string;
  quantidade: number;
  valor_total: number;
  leilao_evento: string | null;
  fazenda_fornecedor: string | null;
  vendedor_id: string | null;
  forma_pagamento: string | null;
  parcelamento_descricao: string | null;
  qtd_parcelas: number | null;
  tipo_parcelamento: string | null;
  status: string;
  observacoes: string | null;
  comissao_percentual: number | null;
  data_venda: string | null;
  vendedor_externo: string | null;
  tipo_vendedor: string | null;
  criado_em: string;
  campos_extras?: Record<string, string | number | null> | null;
};

export const TIPOS_PARCELAMENTO = [
  'À vista',
  'Diretas',
  'Duplo',
  'Triplo',
  'Quádruplo',
  'Personalizado',
] as const;

export const CATEGORIAS_VENDA = [
  'Fêmeas Nelore PO',
  'Touros Nelore PO',
  'Embriões',
  'Sêmen',
  'Outros',
] as const;

export const FORMAS_PAGAMENTO = [
  'À vista',
  'Parcelado',
  'Boleto',
  'Pix',
  'Permuta',
  'Financiamento',
] as const;

export const STATUS_VENDA = [
  { value: 'em_aberto', label: 'Em aberto', cor: 'bg-warning/15 text-warning' },
  { value: 'pago', label: 'Pago', cor: 'bg-success/15 text-success' },
  { value: 'parcial', label: 'Parcial', cor: 'bg-info/15 text-info' },
  { value: 'cancelado', label: 'Cancelado', cor: 'bg-destructive/15 text-destructive' },
] as const;

export type Disparo = {
  id: string;
  mensagem: string;
  lista_contatos: { lead_id: string; nome: string; telefone: string }[];
  total_enviados: number;
  status: string;
  criado_em: string;
};

