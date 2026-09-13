
-- 1. Fix search_path on tg_set_atualizado
CREATE OR REPLACE FUNCTION public.tg_set_atualizado()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

-- 2. Private schema for internal helpers (not exposed via PostgREST)
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_lead_access(_lead_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = _lead_id
      AND (
        l.responsavel_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'coordenador')
      )
  )
$$;
REVOKE ALL ON FUNCTION private.has_lead_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_lead_access(uuid) TO authenticated;

-- 3. Lock down existing SECURITY DEFINER functions in public
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 4. profiles: SELECT self or coordenador
DROP POLICY IF EXISTS profiles_select_authenticated ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self_or_coord ON public.profiles;
DROP POLICY IF EXISTS profiles_delete_coord ON public.profiles;

CREATE POLICY profiles_select_self_or_coord ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR private.has_role(auth.uid(), 'coordenador'));

CREATE POLICY profiles_update_self_or_coord ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR private.has_role(auth.uid(), 'coordenador'))
  WITH CHECK (id = auth.uid() OR private.has_role(auth.uid(), 'coordenador'));

CREATE POLICY profiles_delete_coord ON public.profiles
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'coordenador'));

-- 5. usuarios: coordenador only
DROP POLICY IF EXISTS usuarios_select_auth ON public.usuarios;
DROP POLICY IF EXISTS usuarios_modify_coord ON public.usuarios;

CREATE POLICY usuarios_select_coord ON public.usuarios
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'coordenador'));

CREATE POLICY usuarios_modify_coord ON public.usuarios
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'coordenador'))
  WITH CHECK (private.has_role(auth.uid(), 'coordenador'));

-- 6. leads: responsavel_id or coordenador
DROP POLICY IF EXISTS leads_select_auth ON public.leads;
DROP POLICY IF EXISTS leads_insert_auth ON public.leads;
DROP POLICY IF EXISTS leads_update_auth ON public.leads;
DROP POLICY IF EXISTS leads_delete_auth ON public.leads;

CREATE POLICY leads_select_own_or_coord ON public.leads
  FOR SELECT TO authenticated
  USING (responsavel_id = auth.uid() OR private.has_role(auth.uid(), 'coordenador'));

CREATE POLICY leads_insert_own_or_coord ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (responsavel_id = auth.uid() OR responsavel_id IS NULL OR private.has_role(auth.uid(), 'coordenador'));

CREATE POLICY leads_update_own_or_coord ON public.leads
  FOR UPDATE TO authenticated
  USING (responsavel_id = auth.uid() OR private.has_role(auth.uid(), 'coordenador'))
  WITH CHECK (responsavel_id = auth.uid() OR private.has_role(auth.uid(), 'coordenador'));

CREATE POLICY leads_delete_coord ON public.leads
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'coordenador'));

-- 7. vendas: vendedor_id or coordenador
DROP POLICY IF EXISTS vendas_select_auth ON public.vendas;
DROP POLICY IF EXISTS vendas_insert_auth ON public.vendas;
DROP POLICY IF EXISTS vendas_update_auth ON public.vendas;
DROP POLICY IF EXISTS vendas_delete_coord ON public.vendas;

CREATE POLICY vendas_select_own_or_coord ON public.vendas
  FOR SELECT TO authenticated
  USING (vendedor_id = auth.uid() OR private.has_role(auth.uid(), 'coordenador'));

CREATE POLICY vendas_insert_own_or_coord ON public.vendas
  FOR INSERT TO authenticated
  WITH CHECK (vendedor_id = auth.uid() OR private.has_role(auth.uid(), 'coordenador'));

CREATE POLICY vendas_update_own_or_coord ON public.vendas
  FOR UPDATE TO authenticated
  USING (vendedor_id = auth.uid() OR private.has_role(auth.uid(), 'coordenador'))
  WITH CHECK (vendedor_id = auth.uid() OR private.has_role(auth.uid(), 'coordenador'));

CREATE POLICY vendas_delete_coord ON public.vendas
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'coordenador'));

-- 8. documentos_lead: SELECT restricted by lead access
DROP POLICY IF EXISTS documentos_lead_select_auth ON public.documentos_lead;
CREATE POLICY documentos_lead_select_lead_access ON public.documentos_lead
  FOR SELECT TO authenticated
  USING (private.has_lead_access(lead_id));

-- 9. lead-scoped tables: restrict ALL by lead access
DROP POLICY IF EXISTS interacoes_all_auth ON public.interacoes;
CREATE POLICY interacoes_all_lead_access ON public.interacoes
  FOR ALL TO authenticated
  USING (private.has_lead_access(lead_id))
  WITH CHECK (private.has_lead_access(lead_id));

DROP POLICY IF EXISTS followups_all_auth ON public.follow_ups;
CREATE POLICY followups_all_lead_access ON public.follow_ups
  FOR ALL TO authenticated
  USING (private.has_lead_access(lead_id))
  WITH CHECK (private.has_lead_access(lead_id));

DROP POLICY IF EXISTS lead_contatos_all_auth ON public.lead_contatos;
CREATE POLICY lead_contatos_all_lead_access ON public.lead_contatos
  FOR ALL TO authenticated
  USING (private.has_lead_access(lead_id))
  WITH CHECK (private.has_lead_access(lead_id));

DROP POLICY IF EXISTS mensagens_all_auth ON public.mensagens_chat;
CREATE POLICY mensagens_all_lead_access ON public.mensagens_chat
  FOR ALL TO authenticated
  USING (private.has_lead_access(lead_id))
  WITH CHECK (private.has_lead_access(lead_id));
