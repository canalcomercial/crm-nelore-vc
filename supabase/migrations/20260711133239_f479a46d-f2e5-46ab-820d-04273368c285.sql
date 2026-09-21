
DROP POLICY IF EXISTS user_roles_select_authenticated ON public.user_roles;

CREATE POLICY user_roles_select_self_or_coord ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'coordenador'));
