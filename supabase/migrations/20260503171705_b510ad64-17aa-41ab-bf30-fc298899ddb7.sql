ALTER TABLE public.atributos_personalizados
  ADD COLUMN IF NOT EXISTS opcoes jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.respostas_prontas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta text NOT NULL,
  resposta text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pergunta, resposta)
);

ALTER TABLE public.respostas_prontas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "respostas_prontas_select_auth" ON public.respostas_prontas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "respostas_prontas_insert_auth" ON public.respostas_prontas
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "respostas_prontas_delete_coord" ON public.respostas_prontas
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'coordenador'::app_role));

CREATE INDEX IF NOT EXISTS respostas_prontas_pergunta_idx ON public.respostas_prontas (pergunta);