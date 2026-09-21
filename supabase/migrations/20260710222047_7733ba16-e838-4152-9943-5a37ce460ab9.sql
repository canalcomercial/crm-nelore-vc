
ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS layout jsonb NOT NULL DEFAULT jsonb_build_object(
    'colunas_desktop', 3,
    'colunas_tablet', 2,
    'colunas_mobile', 1,
    'estilo_card', 'padrao',
    'mostrar_indices', true,
    'mostrar_preco', true,
    'mostrar_categoria', true,
    'mostrar_lote_badge', true,
    'botao_interesse_texto', 'Tenho interesse',
    'botao_video_texto', 'Ver vídeo',
    'texto_contador_singular', 'animal disponível',
    'texto_contador_plural', 'animais disponíveis',
    'titulo_secao_animais', 'Animais',
    'texto_sobre_titulo', 'Sobre a Nelore VC',
    'texto_sobre_corpo', 'Trabalhamos com genética Nelore de alto padrão, com foco em índices de performance e qualidade comprovada.',
    'cor_primary', '158 45% 22%',
    'cor_bg', '38 33% 96%'
  );
