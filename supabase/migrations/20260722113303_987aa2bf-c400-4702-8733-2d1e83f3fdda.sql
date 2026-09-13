ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS evento_id uuid REFERENCES public.eventos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_animais_evento_id ON public.animais(evento_id);