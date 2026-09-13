ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS data_venda timestamptz;
UPDATE public.vendas SET data_venda = criado_em WHERE data_venda IS NULL;