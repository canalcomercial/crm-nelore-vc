-- public.rls_auto_enable() é uma salvaguarda do Supabase: um event trigger
-- (ensure_rls) que liga RLS automaticamente em tabelas novas criadas no schema
-- public. Event triggers rodam com os privilégios do dono do trigger,
-- independentemente de GRANT EXECUTE, então expor a função via /rest/v1/rpc
-- para anon/authenticated não tem utilidade e é sinalizado pelos advisors
-- 0028/0029 do database linter.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
