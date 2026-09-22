-- Storage now populates owner_id; owner is a deprecated UUID column.
-- Keep PDFs private and require access to the contract named in the folder.
alter policy contratos_pdf_insert on storage.objects
with check (
  bucket_id = 'contratos-pdf'
  and coalesce(owner_id, owner::text) = (select auth.uid()::text)
  and exists (
    select 1 from public.contratos c
    where c.id::text = (storage.foldername(name))[1]
  )
);
alter policy contratos_pdf_update on storage.objects
using (
  bucket_id = 'contratos-pdf'
  and (coalesce(owner_id, owner::text) = (select auth.uid()::text)
       or private.has_role(auth.uid(), 'coordenador'::public.app_role))
)
with check (
  bucket_id = 'contratos-pdf'
  and (coalesce(owner_id, owner::text) = (select auth.uid()::text)
       or private.has_role(auth.uid(), 'coordenador'::public.app_role))
  and exists (
    select 1 from public.contratos c
    where c.id::text = (storage.foldername(name))[1]
  )
);
alter policy contratos_pdf_delete on storage.objects
using (
  bucket_id = 'contratos-pdf'
  and (coalesce(owner_id, owner::text) = (select auth.uid()::text)
       or private.has_role(auth.uid(), 'coordenador'::public.app_role))
);
