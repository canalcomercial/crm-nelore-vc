
CREATE TABLE public.pagina_comercial_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conteudo JSONB NOT NULL DEFAULT '{}'::jsonb,
  tema JSONB NOT NULL DEFAULT '{}'::jsonb,
  funil_id UUID REFERENCES public.funis(id) ON DELETE SET NULL,
  etapa_inicial TEXT,
  responsavel_padrao_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pagina_comercial_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagina_comercial_config TO authenticated;
GRANT ALL ON public.pagina_comercial_config TO service_role;

ALTER TABLE public.pagina_comercial_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Config ativa é pública"
  ON public.pagina_comercial_config FOR SELECT
  USING (ativo = true);

CREATE POLICY "Coordenadores gerenciam config"
  ON public.pagina_comercial_config FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'coordenador'))
  WITH CHECK (public.has_role(auth.uid(), 'coordenador'));

CREATE TRIGGER trg_pagina_comercial_atualizado
  BEFORE UPDATE ON public.pagina_comercial_config
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_atualizado();

-- Seed inicial com conteúdo Nelore VC
INSERT INTO public.pagina_comercial_config (conteudo, tema, ativo) VALUES (
  jsonb_build_object(
    'hero', jsonb_build_object(
      'titulo', 'Genética Nelore que transforma rebanhos',
      'subtitulo', 'Criatório Nelore VC — animais PO selecionados por avaliação genética, performance a pasto e histórico de leilões premiados.',
      'cta_primario', 'Ver lotes em destaque',
      'cta_secundario', 'Falar com consultor',
      'imagem_url', ''
    ),
    'sobre', jsonb_build_object(
      'titulo', 'Sobre a Nelore VC',
      'texto', 'A Nelore VC é referência na produção de Nelore Puro de Origem, com criatório em Londrina/PR e histórico consolidado em eventos como o Shopping Nelore VC – Nova Geração, o Leilão Genética Nelore VC – Etapa Fêmeas, o Leilão Virtual Nelore VC – Fêmeas Premium e o Leilão Touros Nelore VC. Trabalhamos com foco em fertilidade, precocidade, acabamento e rendimento a pasto, entregando genética de alta performance para pequenos, médios e grandes pecuaristas.',
      'imagem_url', ''
    ),
    'pilares', jsonb_build_array(
      jsonb_build_object('titulo', 'Genética PO', 'descricao', 'Animais Puros de Origem com registro ABCZ e rastreabilidade completa.', 'icone', 'Award'),
      jsonb_build_object('titulo', 'Avaliação IABCZ', 'descricao', 'DEPs e DECAs auditadas, com destaque em índices de peso, acabamento e stayability.', 'icone', 'BarChart3'),
      jsonb_build_object('titulo', 'Assessoria completa', 'descricao', 'Consultores prontos para orientar sua compra, do lote ao pós-venda.', 'icone', 'HeadphonesIcon'),
      jsonb_build_object('titulo', 'Frete facilitado', 'descricao', 'Logística nacional com opções de frete grátis em campanhas selecionadas.', 'icone', 'Truck')
    ),
    'depoimentos', jsonb_build_array(
      jsonb_build_object('nome', 'Pecuarista — MG', 'texto', 'Comprei matrizes do Leilão Genética Nelore VC e o desempenho reprodutivo superou minha expectativa.'),
      jsonb_build_object('nome', 'Criador — GO', 'texto', 'Touros da Nelore VC entregaram bezerros pesados e uniformes já na primeira safra.')
    ),
    'faq', jsonb_build_array(
      jsonb_build_object('pergunta', 'Como funciona o frete?', 'resposta', 'Trabalhamos com transportadoras parceiras. Em campanhas selecionadas o frete é gratuito — consulte o consultor.'),
      jsonb_build_object('pergunta', 'Quais formas de pagamento?', 'resposta', 'Parcelamento em até 36x com condições especiais, análise de crédito realizada pela equipe comercial.'),
      jsonb_build_object('pergunta', 'Vocês emitem GTA e registro?', 'resposta', 'Sim. Todos os animais são PO, com registro ABCZ e GTA emitida no ato da retirada.'),
      jsonb_build_object('pergunta', 'Como faço para participar de um leilão?', 'resposta', 'Basta se cadastrar no evento em destaque desta página que um consultor entra em contato antecipadamente.')
    ),
    'rodape', jsonb_build_object(
      'whatsapp', '5543999999999',
      'email', 'contato@nelorevc.com.br',
      'endereco', 'Londrina - PR',
      'instagram', 'https://instagram.com/nelorevc',
      'mensagem_padrao', 'Olá! Vim pela página comercial e gostaria de mais informações.'
    )
  ),
  jsonb_build_object(
    'cor_primaria', '#2D6A4F',
    'cor_fundo', '#F7F5F0',
    'cor_texto', '#1a1a1a',
    'radius', '12px'
  ),
  true
);
