
-- meta_config (linha única)
CREATE TABLE public.meta_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id text,
  verify_token_hint text,
  page_access_token_set boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_config TO authenticated;
GRANT ALL ON public.meta_config TO service_role;
ALTER TABLE public.meta_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coordenador gerencia meta_config" ON public.meta_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coordenador'))
  WITH CHECK (public.has_role(auth.uid(), 'coordenador'));
CREATE TRIGGER trg_meta_config_atualizado BEFORE UPDATE ON public.meta_config
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_atualizado();

-- meta_formularios
CREATE TABLE public.meta_formularios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id text NOT NULL UNIQUE,
  form_nome text,
  page_id text,
  page_nome text,
  funil_id uuid REFERENCES public.funis(id) ON DELETE SET NULL,
  etapa text,
  responsavel_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  mapa_campos jsonb NOT NULL DEFAULT '{}'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_formularios TO authenticated;
GRANT ALL ON public.meta_formularios TO service_role;
ALTER TABLE public.meta_formularios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coordenador gerencia meta_formularios" ON public.meta_formularios
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coordenador'))
  WITH CHECK (public.has_role(auth.uid(), 'coordenador'));
CREATE TRIGGER trg_meta_formularios_atualizado BEFORE UPDATE ON public.meta_formularios
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_atualizado();

-- meta_eventos_log
CREATE TABLE public.meta_eventos_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leadgen_id text,
  form_id text,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'recebido',
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  erro text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_meta_eventos_log_criado ON public.meta_eventos_log(criado_em DESC);
CREATE INDEX idx_meta_eventos_log_form ON public.meta_eventos_log(form_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_eventos_log TO authenticated;
GRANT ALL ON public.meta_eventos_log TO service_role;
ALTER TABLE public.meta_eventos_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coordenador le meta_eventos_log" ON public.meta_eventos_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coordenador'));
CREATE POLICY "coordenador gerencia meta_eventos_log" ON public.meta_eventos_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coordenador'))
  WITH CHECK (public.has_role(auth.uid(), 'coordenador'));
