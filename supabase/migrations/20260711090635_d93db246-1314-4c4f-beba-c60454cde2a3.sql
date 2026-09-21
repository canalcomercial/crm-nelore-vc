
CREATE POLICY contratos_pdf_auth_all ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'contratos-pdf')
  WITH CHECK (bucket_id = 'contratos-pdf');
