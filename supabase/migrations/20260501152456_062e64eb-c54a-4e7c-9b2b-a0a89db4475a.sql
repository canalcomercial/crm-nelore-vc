UPDATE public.funis
SET etapas = '["Recém Comprado", "Acompanhamento", "Recompra Fêmeas", "Recompra Machos", "Pendência a Resolver", "Fidelizado"]'::jsonb
WHERE id = 'aaaaaaaa-0000-0000-0000-000000000005';

UPDATE public.leads
SET etapa = 'Recompra Fêmeas'
WHERE funil_id = 'aaaaaaaa-0000-0000-0000-000000000005' AND etapa = 'Recompra';