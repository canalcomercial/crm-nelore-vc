CREATE TABLE public.atributos_personalizados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  label text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atributos_personalizados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "atributos_select_auth" ON public.atributos_personalizados
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "atributos_insert_coord" ON public.atributos_personalizados
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'coordenador'::app_role));

CREATE POLICY "atributos_update_coord" ON public.atributos_personalizados
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'coordenador'::app_role)) WITH CHECK (has_role(auth.uid(), 'coordenador'::app_role));

CREATE POLICY "atributos_delete_coord" ON public.atributos_personalizados
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'coordenador'::app_role));