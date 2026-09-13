
-- Helper: pode acessar contrato (via vendedor da venda OU coordenador)
CREATE OR REPLACE FUNCTION private.has_contrato_access(_contrato_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contratos c
    JOIN public.vendas v ON v.id = c.venda_id
    WHERE c.id = _contrato_id
      AND (
        v.vendedor_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'coordenador')
      )
  )
$$;
REVOKE ALL ON FUNCTION private.has_contrato_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_contrato_access(uuid) TO authenticated;

-- Trigger para preencher criado_por
CREATE OR REPLACE FUNCTION public.tg_contratos_set_criado_por()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.criado_por IS NULL THEN NEW.criado_por := auth.uid(); END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contratos_set_criado_por ON public.contratos;
CREATE TRIGGER contratos_set_criado_por
  BEFORE INSERT ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.tg_contratos_set_criado_por();

-- contratos: policies novas
DROP POLICY IF EXISTS contratos_auth_all ON public.contratos;
DROP POLICY IF EXISTS contratos_public_read_by_token ON public.contratos;

CREATE POLICY contratos_select_own_or_coord ON public.contratos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendas v
      WHERE v.id = contratos.venda_id
        AND (v.vendedor_id = auth.uid() OR private.has_role(auth.uid(),'coordenador'))
    )
    OR criado_por = auth.uid()
  );

CREATE POLICY contratos_insert_venda_owner_or_coord ON public.contratos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendas v
      WHERE v.id = venda_id
        AND (v.vendedor_id = auth.uid() OR private.has_role(auth.uid(),'coordenador'))
    )
  );

CREATE POLICY contratos_update_own_or_coord ON public.contratos
  FOR UPDATE TO authenticated
  USING (private.has_contrato_access(id))
  WITH CHECK (private.has_contrato_access(id));

CREATE POLICY contratos_delete_coord ON public.contratos
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(),'coordenador'));

-- disparos: coordenador only
DROP POLICY IF EXISTS disparos_all_auth ON public.disparos;
CREATE POLICY disparos_all_coord ON public.disparos
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'coordenador'))
  WITH CHECK (private.has_role(auth.uid(),'coordenador'));

-- respostas_prontas: INSERT/UPDATE by coordenador
DROP POLICY IF EXISTS respostas_prontas_insert_auth ON public.respostas_prontas;
CREATE POLICY respostas_prontas_insert_coord ON public.respostas_prontas
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(),'coordenador'));

-- Storage: contratos-pdf
DROP POLICY IF EXISTS contratos_pdf_auth_all ON storage.objects;

CREATE POLICY contratos_pdf_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'contratos-pdf' AND EXISTS (
      SELECT 1 FROM public.contratos c
      JOIN public.vendas v ON v.id = c.venda_id
      WHERE c.pdf_path = storage.objects.name
        AND (v.vendedor_id = auth.uid() OR private.has_role(auth.uid(),'coordenador'))
    )
  );

CREATE POLICY contratos_pdf_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contratos-pdf' AND owner = auth.uid());

CREATE POLICY contratos_pdf_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'contratos-pdf'
    AND (owner = auth.uid() OR private.has_role(auth.uid(),'coordenador'))
  )
  WITH CHECK (bucket_id = 'contratos-pdf');

CREATE POLICY contratos_pdf_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'contratos-pdf'
    AND (owner = auth.uid() OR private.has_role(auth.uid(),'coordenador'))
  );

-- Storage: lead-documentos SELECT restrito
DROP POLICY IF EXISTS lead_docs_select_auth ON storage.objects;
CREATE POLICY lead_docs_select_scoped ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'lead-documentos' AND EXISTS (
      SELECT 1 FROM public.documentos_lead d
      WHERE d.storage_path = storage.objects.name
        AND private.has_lead_access(d.lead_id)
    )
  );
