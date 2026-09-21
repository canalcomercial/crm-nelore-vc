-- 1. Leads: novos campos
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS status_cadastro TEXT NOT NULL DEFAULT 'sem_cadastro';

ALTER TABLE public.leads
  ADD CONSTRAINT leads_status_cadastro_check
  CHECK (status_cadastro IN ('sem_cadastro', 'aprovado', 'reprovado'));

-- 2. Tabela de documentos
CREATE TABLE IF NOT EXISTS public.documentos_lead (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  nome TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tamanho_bytes BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  enviado_por UUID,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documentos_lead_lead_id ON public.documentos_lead(lead_id);

ALTER TABLE public.documentos_lead ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documentos_lead_select_auth"
  ON public.documentos_lead FOR SELECT TO authenticated USING (true);

CREATE POLICY "documentos_lead_insert_auth"
  ON public.documentos_lead FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = enviado_por);

CREATE POLICY "documentos_lead_delete_owner_or_coord"
  ON public.documentos_lead FOR DELETE TO authenticated
  USING (enviado_por = auth.uid() OR public.has_role(auth.uid(), 'coordenador'));

-- 3. Bucket privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-documentos', 'lead-documentos', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Policies do bucket
CREATE POLICY "lead_docs_select_auth"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lead-documentos');

CREATE POLICY "lead_docs_insert_auth"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lead-documentos' AND auth.uid() = owner);

CREATE POLICY "lead_docs_delete_owner_or_coord"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'lead-documentos'
    AND (owner = auth.uid() OR public.has_role(auth.uid(), 'coordenador'))
  );