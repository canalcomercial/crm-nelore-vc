
-- Restrict public SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Update contratante policies: restrict SELECT to coordenador (uses private.has_role)
DROP POLICY IF EXISTS contratante_read ON public.contrato_contratante;
DROP POLICY IF EXISTS contratante_write ON public.contrato_contratante;

CREATE POLICY contratante_read ON public.contrato_contratante
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'coordenador'::public.app_role));

CREATE POLICY contratante_write ON public.contrato_contratante
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'coordenador'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'coordenador'::public.app_role));

-- Tighten contratos INSERT: user must own the sale (vendedor) or be coordenador
DROP POLICY IF EXISTS contratos_insert_any_auth ON public.contratos;

CREATE POLICY contratos_insert_owner_or_coord ON public.contratos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendas v
      WHERE v.id = contratos.venda_id
        AND (v.vendedor_id = auth.uid() OR private.has_role(auth.uid(), 'coordenador'::public.app_role))
    )
  );
