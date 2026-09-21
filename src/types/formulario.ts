export type CampoFormularioTipo =
  | "texto"
  | "email"
  | "telefone"
  | "numero"
  | "selecao"
  | "textarea";

export type CampoFormularioMapeamento =
  | "nome"
  | "telefone"
  | "email"
  | "cidade"
  | "estado"
  | "fazenda"
  | "tipo_cliente"
  | "interesse"
  | "observacoes"
  | `attr:${string}`
  | null;

export type CampoFormulario = {
  key: string;
  label: string;
  tipo: CampoFormularioTipo;
  obrigatorio: boolean;
  opcoes?: string[];
  mapeamento?: CampoFormularioMapeamento;
  placeholder?: string;
};

export type Formulario = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  campos: CampoFormulario[];
  funil_id: string | null;
  etapa: string | null;
  responsavel_id: string | null;
  mensagem_sucesso: string;
  cor: string;
  ativo: boolean;
  total_respostas: number;
  criado_em: string;
  atualizado_em: string;
};

export const CAMPOS_PADRAO: CampoFormulario[] = [
  { key: "nome", label: "Nome completo", tipo: "texto", obrigatorio: true, mapeamento: "nome" },
  { key: "telefone", label: "WhatsApp / Telefone", tipo: "telefone", obrigatorio: true, mapeamento: "telefone" },
  { key: "email", label: "Email", tipo: "email", obrigatorio: false, mapeamento: "email" },
  { key: "cidade", label: "Cidade", tipo: "texto", obrigatorio: false, mapeamento: "cidade" },
  { key: "estado", label: "Estado (UF)", tipo: "texto", obrigatorio: false, mapeamento: "estado" },
  { key: "interesse", label: "No que tem interesse?", tipo: "textarea", obrigatorio: false, mapeamento: "interesse" },
];

export function slugify(s: string) {
  return s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
