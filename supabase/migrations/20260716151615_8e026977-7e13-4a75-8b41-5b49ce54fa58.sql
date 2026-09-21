
-- Add tipo to contrato_templates
ALTER TABLE public.contrato_templates
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'bovinos';

ALTER TABLE public.contrato_templates
  DROP CONSTRAINT IF EXISTS contrato_templates_tipo_check;
ALTER TABLE public.contrato_templates
  ADD CONSTRAINT contrato_templates_tipo_check
  CHECK (tipo IN ('bovinos','embrioes','semen'));

CREATE UNIQUE INDEX IF NOT EXISTS contrato_templates_tipo_ativo_uidx
  ON public.contrato_templates (tipo) WHERE ativo = true;

-- Add tipo to contratos
ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'bovinos';

ALTER TABLE public.contratos
  DROP CONSTRAINT IF EXISTS contratos_tipo_check;
ALTER TABLE public.contratos
  ADD CONSTRAINT contratos_tipo_check
  CHECK (tipo IN ('bovinos','embrioes','semen'));

-- Garantir que o template existente é bovinos
UPDATE public.contrato_templates SET tipo = 'bovinos' WHERE tipo IS NULL OR tipo = 'bovinos';

-- Seed template de Embriões
INSERT INTO public.contrato_templates (nome, tipo, ativo, versao, conteudo_html)
SELECT
  'Compra e Venda de Embriões Bovinos',
  'embrioes',
  true,
  1,
$$<h1 style="text-align:center;">CONTRATO DE COMPRA E VENDA DE EMBRIÕES BOVINOS Nº {{numero_contrato}}</h1>
<p><strong>CONTRATANTE / VENDEDORA:</strong> {{contratante_razao_social}}, CNPJ {{contratante_cnpj}}, com sede em {{contratante_endereco}}, {{contratante_cidade}}/{{contratante_uf}}, neste ato representada por {{contratante_representante_nome}}, CPF {{contratante_representante_cpf}}.</p>
<p><strong>CONTRATADO / COMPRADOR:</strong> {{cliente_nome}}, CPF/CNPJ {{cliente_cpf}}, residente em {{cliente_cidade}}/{{cliente_estado}}, fazenda {{cliente_fazenda}}, telefone {{cliente_telefone}}.</p>
<h3>Cláusula 1ª — Objeto</h3>
<p>O presente contrato tem por objeto a compra e venda de <strong>{{embrioes_qtd}}</strong> ({{quantidade_extenso}}) embriões bovinos da raça <strong>{{embrioes_raca}}</strong>, provenientes da doadora <strong>{{embrioes_doadora_nome}}</strong> (registro {{embrioes_doadora_registro}}) cobertos pelo touro <strong>{{embrioes_touro_nome}}</strong> (registro {{embrioes_touro_registro}}), lote/partida {{embrioes_lote}}, coletados em {{embrioes_data_coleta}} no laboratório {{embrioes_laboratorio}}.</p>
<h3>Cláusula 2ª — Preço e pagamento</h3>
<p>O valor total é de <strong>{{valor_total}}</strong> ({{valor_extenso}}), pago na forma: {{forma_pagamento}} — {{parcelamento_descricao}}.</p>
<h3>Cláusula 3ª — Entrega</h3>
<p>Entrega: {{embrioes_entrega}}. Os embriões seguem em botijão de nitrogênio líquido, com identificação e certificado de origem.</p>
<h3>Cláusula 4ª — Garantias</h3>
<p>A vendedora garante a origem genética e a rastreabilidade dos embriões, não se responsabilizando por resultados de implantação após a entrega.</p>
<h3>Cláusula 5ª — Foro</h3>
<p>Fica eleito o foro de {{contratante_foro}}.</p>
<p style="margin-top:40px;">{{contratante_cidade}}, {{data_venda}}.</p>
<p style="margin-top:60px;">_______________________________<br/>{{contratante_razao_social}}</p>
<p style="margin-top:40px;">_______________________________<br/>{{cliente_nome}}</p>$$
WHERE NOT EXISTS (
  SELECT 1 FROM public.contrato_templates WHERE tipo='embrioes' AND ativo=true
);

-- Seed template de Sêmen
INSERT INTO public.contrato_templates (nome, tipo, ativo, versao, conteudo_html)
SELECT
  'Compra e Venda de Sêmen Bovino',
  'semen',
  true,
  1,
$$<h1 style="text-align:center;">CONTRATO DE COMPRA E VENDA DE SÊMEN BOVINO Nº {{numero_contrato}}</h1>
<p><strong>CONTRATANTE / VENDEDORA:</strong> {{contratante_razao_social}}, CNPJ {{contratante_cnpj}}, com sede em {{contratante_endereco}}, {{contratante_cidade}}/{{contratante_uf}}, neste ato representada por {{contratante_representante_nome}}, CPF {{contratante_representante_cpf}}.</p>
<p><strong>CONTRATADO / COMPRADOR:</strong> {{cliente_nome}}, CPF/CNPJ {{cliente_cpf}}, residente em {{cliente_cidade}}/{{cliente_estado}}, fazenda {{cliente_fazenda}}, telefone {{cliente_telefone}}.</p>
<h3>Cláusula 1ª — Objeto</h3>
<p>Compra e venda de <strong>{{semen_qtd_doses}}</strong> ({{quantidade_extenso}}) doses de sêmen do touro <strong>{{semen_touro_nome}}</strong>, registro {{semen_touro_registro}}, RGN {{semen_touro_rgn}}, coletado em {{semen_data_coleta}} na central <strong>{{semen_central}}</strong>, partida {{semen_partida}}.</p>
<h3>Cláusula 2ª — Preço e pagamento</h3>
<p>O valor total é de <strong>{{valor_total}}</strong> ({{valor_extenso}}), pago na forma: {{forma_pagamento}} — {{parcelamento_descricao}}.</p>
<h3>Cláusula 3ª — Armazenamento e entrega</h3>
<p>{{semen_armazenamento}}. As doses são entregues em botijão de nitrogênio líquido, com identificação de partida e certificado de origem emitido pela central.</p>
<h3>Cláusula 4ª — Garantias</h3>
<p>A vendedora garante a origem e a qualidade das doses no momento da entrega, não se responsabilizando por resultados de fertilização ou manejo posterior à entrega.</p>
<h3>Cláusula 5ª — Foro</h3>
<p>Fica eleito o foro de {{contratante_foro}}.</p>
<p style="margin-top:40px;">{{contratante_cidade}}, {{data_venda}}.</p>
<p style="margin-top:60px;">_______________________________<br/>{{contratante_razao_social}}</p>
<p style="margin-top:40px;">_______________________________<br/>{{cliente_nome}}</p>$$
WHERE NOT EXISTS (
  SELECT 1 FROM public.contrato_templates WHERE tipo='semen' AND ativo=true
);
