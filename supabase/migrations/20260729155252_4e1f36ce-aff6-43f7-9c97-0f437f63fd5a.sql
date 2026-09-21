
DROP FUNCTION IF EXISTS public.get_formulario_publico(text);

CREATE POLICY formularios_select_publico_ativo
ON public.formularios FOR SELECT TO anon
USING (ativo = true);

REVOKE SELECT ON public.formularios FROM anon;
GRANT SELECT (id, slug, titulo, descricao, campos, mensagem_sucesso, cor, ativo)
  ON public.formularios TO anon;
