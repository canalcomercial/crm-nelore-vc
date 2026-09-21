CREATE TABLE public.formularios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  campos JSONB NOT NULL DEFAULT '[]'::jsonb,
  funil_id UUID,
  etapa TEXT,
  responsavel_id UUID,
  mensagem_sucesso TEXT NOT NULL DEFAULT 'Recebemos seus dados! Em breve entraremos em contato.',
  cor TEXT NOT NULL DEFAULT '#2D6A4F',
  ativo BOOLEAN NOT NULL DEFAULT true,
  total_respostas INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_formularios_slug ON public.formularios(slug);

ALTER TABLE public.formularios ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ler formulários ativos (página pública)
CREATE POLICY formularios_select_publico_ativo
ON public.formularios FOR SELECT
TO anon
USING (ativo = true);

-- Usuários autenticados veem todos
CREATE POLICY formularios_select_auth
ON public.formularios FOR SELECT
TO authenticated
USING (true);

CREATE POLICY formularios_insert_coord
ON public.formularios FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'coordenador'::app_role));

CREATE POLICY formularios_update_coord
ON public.formularios FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'coordenador'::app_role))
WITH CHECK (has_role(auth.uid(), 'coordenador'::app_role));

CREATE POLICY formularios_delete_coord
ON public.formularios FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'coordenador'::app_role));

CREATE TRIGGER tg_formularios_atualizado
BEFORE UPDATE ON public.formularios
FOR EACH ROW EXECUTE FUNCTION public.tg_set_atualizado();