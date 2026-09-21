-- Usuarios
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  perfil TEXT NOT NULL DEFAULT 'vendedor',
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Funis
CREATE TABLE public.funis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  etapas JSONB NOT NULL DEFAULT '[]'::jsonb,
  cor TEXT DEFAULT '#2D6A4F',
  ordem INT NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL,
  nome TEXT NOT NULL,
  fazenda TEXT,
  telefone TEXT,
  cidade TEXT,
  estado TEXT,
  tipo_cliente TEXT,
  origem TEXT,
  interesse TEXT,
  funil_id UUID REFERENCES public.funis(id) ON DELETE SET NULL,
  etapa TEXT,
  responsavel_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  motivo_perda TEXT,
  observacoes TEXT,
  entrou_etapa_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_contato TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_funil ON public.leads(funil_id);
CREATE INDEX idx_leads_etapa ON public.leads(etapa);

-- Interacoes
CREATE TABLE public.interacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  conteudo TEXT,
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_interacoes_lead ON public.interacoes(lead_id);

-- Mensagens chat
CREATE TABLE public.mensagens_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  direcao TEXT NOT NULL CHECK (direcao IN ('enviada','recebida')),
  lido BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mensagens_lead ON public.mensagens_chat(lead_id);

-- Vendas
CREATE TABLE public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  cliente_nome TEXT NOT NULL,
  produto TEXT,
  categoria TEXT NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  valor_total NUMERIC(12,2) NOT NULL,
  leilao_evento TEXT,
  fazenda_fornecedor TEXT,
  vendedor_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  forma_pagamento TEXT,
  status TEXT NOT NULL DEFAULT 'em_aberto',
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vendas_status ON public.vendas(status);
CREATE INDEX idx_vendas_data ON public.vendas(criado_em);

-- Follow ups
CREATE TABLE public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  data_hora TIMESTAMPTZ NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'ligacao',
  observacao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  responsavel_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_followups_status ON public.follow_ups(status);
CREATE INDEX idx_followups_data ON public.follow_ups(data_hora);

-- Disparos
CREATE TABLE public.disparos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lista_contatos JSONB NOT NULL DEFAULT '[]'::jsonb,
  mensagem TEXT NOT NULL,
  total_enviados INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'rascunho',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS (open access for now - pre-auth phase)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disparos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_all" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.funis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.interacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.mensagens_chat FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.vendas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.follow_ups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.disparos FOR ALL USING (true) WITH CHECK (true);

-- updated trigger for leads
CREATE OR REPLACE FUNCTION public.tg_set_atualizado()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;
CREATE TRIGGER set_atualizado_leads BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.tg_set_atualizado();

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_chat;