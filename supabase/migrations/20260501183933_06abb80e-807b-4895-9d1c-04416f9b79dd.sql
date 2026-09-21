ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS arquivado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS arquivado_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_arquivado ON public.leads(arquivado);