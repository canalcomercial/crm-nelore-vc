
-- Restrict anonymous access to formularios: expose only public-safe columns via a view
DROP POLICY IF EXISTS formularios_select_publico_ativo ON public.formularios;

CREATE OR REPLACE VIEW public.formularios_publicos
WITH (security_invoker = false) AS
SELECT id, slug, titulo, descricao, campos, mensagem_sucesso, cor, ativo
FROM public.formularios
WHERE ativo = true;

GRANT SELECT ON public.formularios_publicos TO anon, authenticated;
