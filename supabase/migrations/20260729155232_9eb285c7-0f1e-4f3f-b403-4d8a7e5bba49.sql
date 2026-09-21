
DROP POLICY IF EXISTS formularios_select_publico_ativo_view ON public.formularios;
DROP VIEW IF EXISTS public.formularios_publicos;

CREATE OR REPLACE FUNCTION public.get_formulario_publico(_slug text)
RETURNS TABLE (
  id uuid,
  slug text,
  titulo text,
  descricao text,
  campos jsonb,
  mensagem_sucesso text,
  cor text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, slug, titulo, descricao, campos, mensagem_sucesso, cor
  FROM public.formularios
  WHERE slug = _slug AND ativo = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_formulario_publico(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_formulario_publico(text) TO anon, authenticated;
