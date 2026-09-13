CREATE TABLE public.lead_contatos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT,
  observacao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_contatos_lead_id ON public.lead_contatos(lead_id);

ALTER TABLE public.lead_contatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_contatos_all_auth"
ON public.lead_contatos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);