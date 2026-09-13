DROP POLICY IF EXISTS leads_delete_coord ON public.leads;
CREATE POLICY leads_delete_auth ON public.leads FOR DELETE TO authenticated USING (true);