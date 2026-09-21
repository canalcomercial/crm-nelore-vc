ALTER TABLE public.pagina_comercial_config
  ADD COLUMN IF NOT EXISTS conteudo_draft jsonb,
  ADD COLUMN IF NOT EXISTS tema_draft jsonb,
  ADD COLUMN IF NOT EXISTS publicado_em timestamptz,
  ADD COLUMN IF NOT EXISTS publicado_por uuid;

UPDATE public.pagina_comercial_config
SET conteudo_draft = COALESCE(conteudo_draft, conteudo),
    tema_draft = COALESCE(tema_draft, tema),
    publicado_em = COALESCE(publicado_em, criado_em);