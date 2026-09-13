
-- Catálogo Nelore VC
CREATE TABLE IF NOT EXISTS public.animais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  lote text,
  categoria text,
  raca text,
  fazenda text,
  iabcz numeric,
  mgte numeric,
  iqg numeric,
  preco_total numeric,
  parcelas int,
  valor_parcela numeric,
  link_video text,
  foto_url text,
  destaque boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.animais TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.animais TO authenticated;
GRANT ALL ON public.animais TO service_role;
ALTER TABLE public.animais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "animais_public_read" ON public.animais FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "animais_coord_insert" ON public.animais FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'coordenador'));
CREATE POLICY "animais_coord_update" ON public.animais FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'coordenador')) WITH CHECK (public.has_role(auth.uid(), 'coordenador'));
CREATE POLICY "animais_coord_delete" ON public.animais FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'coordenador'));
CREATE TRIGGER trg_animais_atualizado BEFORE UPDATE ON public.animais FOR EACH ROW EXECUTE FUNCTION public.tg_set_atualizado();

CREATE TABLE IF NOT EXISTS public.eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  data date,
  descricao text,
  ativo boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.eventos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eventos TO authenticated;
GRANT ALL ON public.eventos TO service_role;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eventos_public_read" ON public.eventos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "eventos_coord_write" ON public.eventos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coordenador')) WITH CHECK (public.has_role(auth.uid(), 'coordenador'));

CREATE TABLE IF NOT EXISTS public.configuracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp text,
  mensagem_padrao text
);
GRANT SELECT ON public.configuracoes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes TO authenticated;
GRANT ALL ON public.configuracoes TO service_role;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config_public_read" ON public.configuracoes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "config_coord_write" ON public.configuracoes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coordenador')) WITH CHECK (public.has_role(auth.uid(), 'coordenador'));

INSERT INTO public.configuracoes (whatsapp, mensagem_padrao)
SELECT '', 'Olá! Tenho interesse no {nome} - Lote {lote}. Podemos conversar?'
WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes);

-- Storage bucket policies (bucket criado via tool)
CREATE POLICY "animais_fotos_public_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'animais-fotos');
CREATE POLICY "animais_fotos_coord_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'animais-fotos' AND public.has_role(auth.uid(), 'coordenador'));
CREATE POLICY "animais_fotos_coord_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'animais-fotos' AND public.has_role(auth.uid(), 'coordenador'));
CREATE POLICY "animais_fotos_coord_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'animais-fotos' AND public.has_role(auth.uid(), 'coordenador'));
