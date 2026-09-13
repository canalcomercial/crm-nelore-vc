ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deletado_em timestamptz;
CREATE INDEX IF NOT EXISTS idx_leads_deletado_em ON public.leads(deletado_em);