ALTER TABLE public.animais
  ADD COLUMN IF NOT EXISTS sexo text,
  ADD COLUMN IF NOT EXISTS registro text,
  ADD COLUMN IF NOT EXISTS ce_cm numeric,
  ADD COLUMN IF NOT EXISTS genetica jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.animais.sexo IS 'macho | femea — define o bloco final da ficha (ventre x reprodutor)';
COMMENT ON COLUMN public.animais.registro IS 'Registro do animal exibido no cabeçalho da ficha (ex.: VCA - 9335)';
COMMENT ON COLUMN public.animais.ce_cm IS 'Circunferência escrotal em centímetros (touros)';
COMMENT ON COLUMN public.animais.genetica IS 'Blocos de avaliação genética: { pmgz, ancp, geneplus, ventre }';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'animais_sexo_check') THEN
    ALTER TABLE public.animais
      ADD CONSTRAINT animais_sexo_check CHECK (sexo IS NULL OR sexo IN ('macho', 'femea'));
  END IF;
END $$;

UPDATE public.animais
   SET sexo = CASE
     WHEN categoria ILIKE 'touro%'   THEN 'macho'
     WHEN categoria ILIKE 'garrote%' THEN 'macho'
     WHEN categoria ILIKE 'matriz%'  THEN 'femea'
     WHEN categoria ILIKE 'novilha%' THEN 'femea'
     WHEN categoria ILIKE 'vaca%'    THEN 'femea'
     ELSE NULL
   END
 WHERE sexo IS NULL;

ALTER TABLE public.animais
  ADD COLUMN IF NOT EXISTS link_erural text,
  ADD COLUMN IF NOT EXISTS link_pre_lance text,
  ADD COLUMN IF NOT EXISTS ficha jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.animais.link_erural IS 'URL do lote na erural (coluna URL ERURAL da planilha base)';
COMMENT ON COLUMN public.animais.link_pre_lance IS 'URL do pré-lance (coluna P.L. da planilha base)';
COMMENT ON COLUMN public.animais.ficha IS 'Dados da planilha base erural sem coluna própria';

CREATE INDEX IF NOT EXISTS animais_registro_idx ON public.animais (registro) WHERE registro IS NOT NULL;