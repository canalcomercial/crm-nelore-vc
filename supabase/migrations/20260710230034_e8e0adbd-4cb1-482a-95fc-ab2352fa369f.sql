ALTER TABLE public.meta_config ADD COLUMN IF NOT EXISTS verificado_em timestamptz;
ALTER TABLE public.meta_config ADD COLUMN IF NOT EXISTS paginas_disponiveis jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'meta_eventos_log'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.meta_eventos_log';
  END IF;
END $$;

ALTER TABLE public.meta_eventos_log REPLICA IDENTITY FULL;