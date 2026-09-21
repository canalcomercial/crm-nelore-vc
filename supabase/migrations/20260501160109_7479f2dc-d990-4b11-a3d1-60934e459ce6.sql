ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS campos_extras jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS respostas_formulario jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS meta_lead_id text,
  ADD COLUMN IF NOT EXISTS meta_form_id text,
  ADD COLUMN IF NOT EXISTS meta_form_nome text;

CREATE UNIQUE INDEX IF NOT EXISTS leads_meta_lead_id_unique
  ON public.leads (meta_lead_id) WHERE meta_lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_campos_extras_gin ON public.leads USING gin (campos_extras);