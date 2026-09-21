-- Remove broad public read on the base table (exposed drafts + publicado_por)
DROP POLICY IF EXISTS pagina_config_public_read_ativo ON public.pagina_comercial_config;

-- Public view serves only published columns; run it as definer so it works without the base policy
ALTER VIEW public.pagina_comercial_config_public SET (security_invoker = false);

GRANT SELECT ON public.pagina_comercial_config_public TO anon, authenticated;
