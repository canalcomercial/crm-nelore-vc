-- 1) Remove SECURITY DEFINER view; use invoker + column-level grants
ALTER VIEW public.pagina_comercial_config_public SET (security_invoker = true);

REVOKE SELECT ON public.pagina_comercial_config FROM anon, authenticated;

GRANT SELECT (id, conteudo, tema, funil_id, etapa_inicial, responsavel_padrao_id,
              ativo, criado_em, atualizado_em, publicado_em, publicado_por)
  ON public.pagina_comercial_config TO anon, authenticated;

DROP POLICY IF EXISTS pagina_config_public_read_ativo ON public.pagina_comercial_config;
CREATE POLICY pagina_config_public_read_ativo
  ON public.pagina_comercial_config
  FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

GRANT SELECT ON public.pagina_comercial_config_public TO anon, authenticated;

-- 2) Limit anonymous access on formularios to public-facing columns only
REVOKE SELECT ON public.formularios FROM anon;
GRANT SELECT (id, slug, titulo, descricao, campos, mensagem_sucesso, cor, ativo)
  ON public.formularios TO anon;

-- 3) Stop broadcasting raw Meta webhook payloads over Realtime
ALTER PUBLICATION supabase_realtime DROP TABLE public.meta_eventos_log;