
-- 1) INSERT: permitir se venda pertence ao usuário, se é coordenador, OU se qualquer usuário autenticado (trigger seta criado_por)
DROP POLICY IF EXISTS contratos_insert_venda_owner_or_coord ON public.contratos;
CREATE POLICY contratos_insert_any_auth ON public.contratos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendas v WHERE v.id = contratos.venda_id)
  );

-- 2) has_contrato_access: inclui criado_por
CREATE OR REPLACE FUNCTION private.has_contrato_access(_contrato_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contratos c
    JOIN public.vendas v ON v.id = c.venda_id
    WHERE c.id = _contrato_id
      AND (
        v.vendedor_id = auth.uid()
        OR c.criado_por = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'coordenador')
      )
  )
$$;

-- 3) SELECT: já inclui criado_por, mas garantir consistência (recria)
DROP POLICY IF EXISTS contratos_select_own_or_coord ON public.contratos;
CREATE POLICY contratos_select_own_or_coord ON public.contratos
  FOR SELECT TO authenticated
  USING (
    criado_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.vendas v
      WHERE v.id = contratos.venda_id
        AND (v.vendedor_id = auth.uid() OR private.has_role(auth.uid(), 'coordenador'::app_role))
    )
  );

-- 4) Storage: SELECT do PDF também precisa considerar criado_por do contrato
DROP POLICY IF EXISTS contratos_pdf_select ON storage.objects;
CREATE POLICY contratos_pdf_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'contratos-pdf'
    AND EXISTS (
      SELECT 1 FROM public.contratos c
      LEFT JOIN public.vendas v ON v.id = c.venda_id
      WHERE c.pdf_path = objects.name
        AND (
          c.criado_por = auth.uid()
          OR v.vendedor_id = auth.uid()
          OR private.has_role(auth.uid(), 'coordenador'::app_role)
        )
    )
  );
