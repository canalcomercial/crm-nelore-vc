
ALTER VIEW public.formularios_publicos SET (security_invoker = true);
-- Re-grant anon read on base table filtered by RLS policy for the view path
CREATE POLICY formularios_select_publico_ativo_view
ON public.formularios FOR SELECT TO anon
USING (ativo = true);
