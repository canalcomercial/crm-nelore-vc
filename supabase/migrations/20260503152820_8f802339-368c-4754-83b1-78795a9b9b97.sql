
CREATE TABLE public.motivos_perda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.motivos_perda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "motivos_perda_select_auth" ON public.motivos_perda
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "motivos_perda_insert_coord" ON public.motivos_perda
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'coordenador'::app_role));
CREATE POLICY "motivos_perda_update_coord" ON public.motivos_perda
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'coordenador'::app_role)) WITH CHECK (has_role(auth.uid(), 'coordenador'::app_role));
CREATE POLICY "motivos_perda_delete_coord" ON public.motivos_perda
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'coordenador'::app_role));

INSERT INTO public.motivos_perda (nome, ordem) VALUES
  ('Sem resposta', 1),
  ('Sem perfil', 2),
  ('Sem recurso financeiro', 3),
  ('Comprou de outro', 4),
  ('Apenas curioso', 5),
  ('Produto não atendia', 6),
  ('Outro', 99);

ALTER TABLE public.leads ADD COLUMN detalhes_perda text;
