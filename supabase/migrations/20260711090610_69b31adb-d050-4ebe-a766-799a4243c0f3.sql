
-- ============ CONTRATANTE (vendedora) ============
CREATE TABLE public.contrato_contratante (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL DEFAULT '',
  cnpj TEXT NOT NULL DEFAULT '',
  inscricao_estadual TEXT,
  endereco TEXT NOT NULL DEFAULT '',
  cidade TEXT NOT NULL DEFAULT '',
  uf TEXT NOT NULL DEFAULT '',
  cep TEXT,
  representante_nome TEXT NOT NULL DEFAULT '',
  representante_cpf TEXT NOT NULL DEFAULT '',
  representante_cargo TEXT,
  foro TEXT NOT NULL DEFAULT '',
  telefone TEXT,
  email TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contrato_contratante TO authenticated;
GRANT ALL ON public.contrato_contratante TO service_role;
ALTER TABLE public.contrato_contratante ENABLE ROW LEVEL SECURITY;
CREATE POLICY contratante_read ON public.contrato_contratante FOR SELECT TO authenticated USING (true);
CREATE POLICY contratante_write ON public.contrato_contratante FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coordenador'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'coordenador'::app_role));
CREATE TRIGGER trg_contratante_atualizado BEFORE UPDATE ON public.contrato_contratante
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_atualizado();

INSERT INTO public.contrato_contratante (razao_social, cnpj, endereco, cidade, uf, representante_nome, representante_cpf, foro)
VALUES ('', '', '', '', '', '', '', '');

-- ============ TEMPLATES ============
CREATE TABLE public.contrato_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  conteudo_html TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT false,
  versao INT NOT NULL DEFAULT 1,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contrato_templates TO authenticated;
GRANT ALL ON public.contrato_templates TO service_role;
ALTER TABLE public.contrato_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tpl_read ON public.contrato_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY tpl_write ON public.contrato_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coordenador'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'coordenador'::app_role));
CREATE TRIGGER trg_tpl_atualizado BEFORE UPDATE ON public.contrato_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_atualizado();

INSERT INTO public.contrato_templates (nome, ativo, conteudo_html) VALUES (
'Compra e Venda de Bovinos Nelore PO', true,
'<h1 style="text-align:center">CONTRATO DE COMPRA E VENDA DE BOVINOS</h1>
<p><strong>Contrato nº {{numero_contrato}}</strong></p>

<p>Pelo presente instrumento particular, de um lado:</p>

<p><strong>VENDEDORA:</strong> {{contratante_razao_social}}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {{contratante_cnpj}}, com sede em {{contratante_endereco}}, {{contratante_cidade}}/{{contratante_uf}}, neste ato representada por {{contratante_representante_nome}}, CPF nº {{contratante_representante_cpf}}, doravante denominada simplesmente <strong>VENDEDORA</strong>;</p>

<p>e, de outro lado:</p>

<p><strong>COMPRADOR(A):</strong> {{cliente_nome}}, CPF/CNPJ nº {{cliente_cpf}}, residente/estabelecido em {{cliente_fazenda}}, {{cliente_cidade}}/{{cliente_estado}}, telefone {{cliente_telefone}}, doravante denominado(a) simplesmente <strong>COMPRADOR(A)</strong>;</p>

<p>têm entre si justo e contratado o presente CONTRATO DE COMPRA E VENDA DE BOVINOS, com fundamento nos arts. 481 a 532 do Código Civil (Lei nº 10.406/2002), que se regerá pelas cláusulas seguintes:</p>

<h3>CLÁUSULA 1ª – DO OBJETO</h3>
<p>1.1. A VENDEDORA vende ao COMPRADOR(A), que adquire, {{quantidade}} ({{quantidade_extenso}}) cabeça(s) de bovinos da raça Nelore, categoria: {{produto}}, conforme especificações e registros anexos.</p>
<p>1.2. Os animais serão entregues acompanhados da respectiva Guia de Trânsito Animal (GTA), Documento de Sanidade Animal (DSA) e demais documentos exigidos pela IN MAPA nº 44/2007 e legislação sanitária vigente.</p>

<h3>CLÁUSULA 2ª – DO PREÇO E FORMA DE PAGAMENTO</h3>
<p>2.1. O preço total, certo e ajustado é de <strong>{{valor_total}}</strong> ({{valor_extenso}}), a ser pago pelo COMPRADOR(A) à VENDEDORA na forma de {{forma_pagamento}}.</p>
<p>2.2. Condições de parcelamento: {{parcelamento_descricao}}.</p>
<p>2.3. O atraso no pagamento de qualquer parcela sujeitará o COMPRADOR(A) a multa moratória de 2% (dois por cento), juros de mora de 1% (um por cento) ao mês e correção monetária pelo IGP-M/FGV, sem prejuízo da possibilidade de rescisão contratual e retomada dos animais.</p>

<h3>CLÁUSULA 3ª – DA TRADIÇÃO E DOS RISCOS</h3>
<p>3.1. A propriedade dos animais transfere-se ao COMPRADOR(A) com a tradição, nos termos do art. 1.267 do Código Civil, correndo por conta deste, a partir de então, todos os riscos, tributos e despesas com transporte, alimentação, manejo e sanidade.</p>
<p>3.2. Enquanto não integralizado o pagamento, os animais permanecerão em regime de reserva de domínio (art. 521 do Código Civil), podendo a VENDEDORA reavê-los em caso de inadimplemento.</p>

<h3>CLÁUSULA 4ª – DAS GARANTIAS SANITÁRIAS</h3>
<p>4.1. A VENDEDORA declara e garante que os animais objeto deste contrato encontram-se vacinados e testados negativamente para Brucelose e Tuberculose, conforme o Programa Nacional de Controle e Erradicação da Brucelose e Tuberculose Animal (PNCEBT), em atendimento à IN MAPA nº 10/2017.</p>
<p>4.2. Eventuais vícios ocultos deverão ser comunicados no prazo decadencial de 30 (trinta) dias contados da tradição, nos termos do art. 445 do Código Civil.</p>

<h3>CLÁUSULA 5ª – DA RESCISÃO E MULTA</h3>
<p>5.1. O descumprimento de qualquer cláusula deste contrato ensejará a rescisão de pleno direito, ficando a parte inadimplente sujeita ao pagamento de multa compensatória equivalente a 10% (dez por cento) sobre o valor total do contrato, sem prejuízo de perdas e danos apurados.</p>

<h3>CLÁUSULA 6ª – DA PROTEÇÃO DE DADOS (LGPD)</h3>
<p>6.1. As partes declaram estar cientes e concordes com o tratamento dos dados pessoais fornecidos para os fins específicos deste contrato, nos termos da Lei nº 13.709/2018 (LGPD), garantindo-se o sigilo e a segurança das informações.</p>

<h3>CLÁUSULA 7ª – DA ASSINATURA ELETRÔNICA</h3>
<p>7.1. As partes reconhecem a validade jurídica da assinatura eletrônica aposta neste contrato, nos termos do art. 10, §2º, da MP nº 2.200-2/2001, ficando registrados nome, CPF, endereço IP, data, hora e hash criptográfico do documento para fins de autenticidade e integridade.</p>

<h3>CLÁUSULA 8ª – DO FORO</h3>
<p>8.1. Fica eleito o foro da comarca de <strong>{{contratante_foro}}</strong>, com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir eventuais controvérsias oriundas do presente contrato.</p>

<p style="margin-top:32px">E, por estarem assim justas e contratadas, as partes firmam o presente em via eletrônica, produzindo todos os efeitos legais.</p>

<p style="margin-top:24px">{{contratante_cidade}}/{{contratante_uf}}, {{data_venda}}.</p>

<div style="margin-top:48px">
  <p>_________________________________________<br/>
  <strong>{{contratante_razao_social}}</strong><br/>
  CNPJ: {{contratante_cnpj}}<br/>
  Representante: {{contratante_representante_nome}}<br/>
  VENDEDORA</p>

  <p style="margin-top:32px">_________________________________________<br/>
  <strong>{{cliente_nome}}</strong><br/>
  CPF/CNPJ: {{cliente_cpf}}<br/>
  COMPRADOR(A)</p>
</div>');

-- ============ CONTRATOS ============
CREATE SEQUENCE IF NOT EXISTS public.contratos_numero_seq START 1000;

CREATE TABLE public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INT NOT NULL DEFAULT nextval('public.contratos_numero_seq'),
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.contrato_templates(id) ON DELETE SET NULL,
  conteudo_final TEXT NOT NULL,
  pdf_path TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','enviado','assinado','cancelado')),
  token_publico UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  enviado_whatsapp_em TIMESTAMPTZ,
  assinatura_nome TEXT,
  assinatura_cpf TEXT,
  assinatura_ip TEXT,
  assinatura_user_agent TEXT,
  assinatura_hash TEXT,
  assinado_em TIMESTAMPTZ,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contratos_venda ON public.contratos(venda_id);
CREATE INDEX idx_contratos_token ON public.contratos(token_publico);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos TO authenticated;
GRANT SELECT, UPDATE ON public.contratos TO anon;
GRANT ALL ON public.contratos TO service_role;

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY contratos_auth_all ON public.contratos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY contratos_public_read_by_token ON public.contratos FOR SELECT TO anon
  USING (true);

CREATE TRIGGER trg_contratos_atualizado BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_atualizado();
