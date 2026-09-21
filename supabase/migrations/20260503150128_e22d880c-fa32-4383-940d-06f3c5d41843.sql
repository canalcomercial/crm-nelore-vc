ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS vendedor_externo TEXT,
  ADD COLUMN IF NOT EXISTS tipo_vendedor TEXT NOT NULL DEFAULT 'interno';