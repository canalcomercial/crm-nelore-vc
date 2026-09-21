
ALTER TABLE public.animais
  ADD COLUMN IF NOT EXISTS descricao_longa text,
  ADD COLUMN IF NOT EXISTS nascimento date,
  ADD COLUMN IF NOT EXISTS peso_kg numeric,
  ADD COLUMN IF NOT EXISTS localizacao text,
  ADD COLUMN IF NOT EXISTS fornecedor text,
  ADD COLUMN IF NOT EXISTS estado_reprodutivo text,
  ADD COLUMN IF NOT EXISTS previsao_parto date,
  ADD COLUMN IF NOT EXISTS pai_prenhez text,
  ADD COLUMN IF NOT EXISTS registrado_abcz boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pai text,
  ADD COLUMN IF NOT EXISTS mae text,
  ADD COLUMN IF NOT EXISTS avo_paterno_pai text,
  ADD COLUMN IF NOT EXISTS avo_paterno_mae text,
  ADD COLUMN IF NOT EXISTS avo_materno_pai text,
  ADD COLUMN IF NOT EXISTS avo_materno_mae text,
  ADD COLUMN IF NOT EXISTS avaliacoes jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS faq jsonb NOT NULL DEFAULT jsonb_build_array(
    jsonb_build_object('titulo','Frete e Pagamento','conteudo','Frete grátis dentro do estado. Consulte condições especiais de parcelamento e comissão diferenciada em propostas fechadas até a data do evento.'),
    jsonb_build_object('titulo','Segurança e Garantia','conteudo','Todos os animais são registrados e passam por avaliação técnica antes da comercialização, com garantia de saúde e procedência.'),
    jsonb_build_object('titulo','Assessoria','conteudo','Nossa equipe acompanha o comprador antes, durante e após a aquisição, com suporte técnico especializado.'),
    jsonb_build_object('titulo','Como funciona','conteudo','Envie sua proposta ou fale com um consultor. Confirmada a negociação, cuidamos da documentação, transporte e entrega.'),
    jsonb_build_object('titulo','Papel do CRM','conteudo','Centralizamos suas informações para agilizar o atendimento e manter todo o histórico da negociação.')
  );

CREATE TABLE IF NOT EXISTS public.propostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid REFERENCES public.animais(id) ON DELETE SET NULL,
  nome text NOT NULL,
  telefone text NOT NULL,
  email text,
  valor_ofertado numeric,
  parcelas int,
  mensagem text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propostas TO authenticated;
GRANT ALL ON public.propostas TO service_role;

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coordenador gerencia propostas"
  ON public.propostas FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'coordenador'))
  WITH CHECK (public.has_role(auth.uid(), 'coordenador'));
