ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS parcelamento_descricao text,
  ADD COLUMN IF NOT EXISTS qtd_parcelas integer,
  ADD COLUMN IF NOT EXISTS tipo_parcelamento text;
