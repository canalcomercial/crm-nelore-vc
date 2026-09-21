ALTER TABLE public.vendas
ADD COLUMN IF NOT EXISTS comissao_percentual numeric(5,2);

COMMENT ON COLUMN public.vendas.comissao_percentual IS 'Percentual de comissao da venda (0 a 100)';