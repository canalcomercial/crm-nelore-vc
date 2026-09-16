ALTER TABLE public.animais
  ADD COLUMN IF NOT EXISTS embriao jsonb;

COMMENT ON COLUMN public.animais.embriao IS
  'Pacote de embriões importado pela planilha de embriões (categoria = Embrião). Estrutura em src/types/embrioes.ts';

CREATE INDEX IF NOT EXISTS idx_animais_evento_categoria ON public.animais (evento_id, categoria);

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'animais',
  ADD COLUMN IF NOT EXISTS detalhes jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.eventos DROP CONSTRAINT IF EXISTS eventos_tipo_check;
ALTER TABLE public.eventos
  ADD CONSTRAINT eventos_tipo_check CHECK (tipo IN ('animais', 'embrioes'));

COMMENT ON COLUMN public.eventos.detalhes IS
  'Capa do catálogo de embriões: subtitulo, data_fim, horario, local, parcelas_destaque, parcelas_detalhe, link_playlist, link_condicoes, whatsapp, instagram, capa_url';