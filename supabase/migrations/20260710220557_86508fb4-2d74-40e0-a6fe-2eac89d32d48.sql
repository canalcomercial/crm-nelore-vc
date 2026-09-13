CREATE POLICY "pagina_midia_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'pagina-comercial-midia');

CREATE POLICY "pagina_midia_coord_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pagina-comercial-midia' AND public.has_role(auth.uid(), 'coordenador'));

CREATE POLICY "pagina_midia_coord_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'pagina-comercial-midia' AND public.has_role(auth.uid(), 'coordenador'));

CREATE POLICY "pagina_midia_coord_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pagina-comercial-midia' AND public.has_role(auth.uid(), 'coordenador'));