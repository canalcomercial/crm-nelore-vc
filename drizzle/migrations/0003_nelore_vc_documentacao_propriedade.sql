ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS endereco_propriedade text,
  ADD COLUMN IF NOT EXISTS inscricao_estadual text,
  ADD COLUMN IF NOT EXISTS nirf text,
  ADD COLUMN IF NOT EXISTS cib text,
  ADD COLUMN IF NOT EXISTS codigo_propriedade text;

ALTER TABLE public.contrato_contratante
  ADD COLUMN IF NOT EXISTS fazenda_nome text,
  ADD COLUMN IF NOT EXISTS endereco_propriedade text,
  ADD COLUMN IF NOT EXISTS municipio_propriedade text,
  ADD COLUMN IF NOT EXISTS nirf text,
  ADD COLUMN IF NOT EXISTS cib text,
  ADD COLUMN IF NOT EXISTS codigo_propriedade text;