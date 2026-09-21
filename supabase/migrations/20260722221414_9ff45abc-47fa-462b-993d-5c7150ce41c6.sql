
-- 1) Rewrite policies referencing public.has_role -> private.has_role
-- public.animais
DROP POLICY IF EXISTS "animais_coord_delete" ON public.animais;
CREATE POLICY "animais_coord_delete" ON public.animais FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "animais_coord_insert" ON public.animais;
CREATE POLICY "animais_coord_insert" ON public.animais FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "animais_coord_update" ON public.animais;
CREATE POLICY "animais_coord_update" ON public.animais FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'coordenador')) WITH CHECK (private.has_role(auth.uid(),'coordenador'));

-- public.atributos_personalizados
DROP POLICY IF EXISTS "atributos_delete_coord" ON public.atributos_personalizados;
CREATE POLICY "atributos_delete_coord" ON public.atributos_personalizados FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "atributos_insert_coord" ON public.atributos_personalizados;
CREATE POLICY "atributos_insert_coord" ON public.atributos_personalizados FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "atributos_update_coord" ON public.atributos_personalizados;
CREATE POLICY "atributos_update_coord" ON public.atributos_personalizados FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'coordenador')) WITH CHECK (private.has_role(auth.uid(),'coordenador'));

-- public.configuracoes
DROP POLICY IF EXISTS "config_coord_write" ON public.configuracoes;
CREATE POLICY "config_coord_write" ON public.configuracoes FOR ALL TO authenticated USING (private.has_role(auth.uid(),'coordenador')) WITH CHECK (private.has_role(auth.uid(),'coordenador'));

-- public.contrato_templates
DROP POLICY IF EXISTS "tpl_write" ON public.contrato_templates;
CREATE POLICY "tpl_write" ON public.contrato_templates FOR ALL TO authenticated USING (private.has_role(auth.uid(),'coordenador')) WITH CHECK (private.has_role(auth.uid(),'coordenador'));

-- public.documentos_lead
DROP POLICY IF EXISTS "documentos_lead_delete_owner_or_coord" ON public.documentos_lead;
CREATE POLICY "documentos_lead_delete_owner_or_coord" ON public.documentos_lead FOR DELETE TO authenticated USING (enviado_por = auth.uid() OR private.has_role(auth.uid(),'coordenador'));

-- public.eventos
DROP POLICY IF EXISTS "eventos_coord_write" ON public.eventos;
CREATE POLICY "eventos_coord_write" ON public.eventos FOR ALL TO authenticated USING (private.has_role(auth.uid(),'coordenador')) WITH CHECK (private.has_role(auth.uid(),'coordenador'));

-- public.formularios
DROP POLICY IF EXISTS "formularios_delete_coord" ON public.formularios;
CREATE POLICY "formularios_delete_coord" ON public.formularios FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "formularios_insert_coord" ON public.formularios;
CREATE POLICY "formularios_insert_coord" ON public.formularios FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "formularios_update_coord" ON public.formularios;
CREATE POLICY "formularios_update_coord" ON public.formularios FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'coordenador')) WITH CHECK (private.has_role(auth.uid(),'coordenador'));

-- public.funis
DROP POLICY IF EXISTS "funis_delete_coord" ON public.funis;
CREATE POLICY "funis_delete_coord" ON public.funis FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "funis_modify_coord" ON public.funis;
CREATE POLICY "funis_modify_coord" ON public.funis FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "funis_update_coord" ON public.funis;
CREATE POLICY "funis_update_coord" ON public.funis FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'coordenador')) WITH CHECK (private.has_role(auth.uid(),'coordenador'));

-- public.meta_config
DROP POLICY IF EXISTS "coordenador gerencia meta_config" ON public.meta_config;
CREATE POLICY "coordenador gerencia meta_config" ON public.meta_config FOR ALL TO authenticated USING (private.has_role(auth.uid(),'coordenador')) WITH CHECK (private.has_role(auth.uid(),'coordenador'));

-- public.meta_eventos_log
DROP POLICY IF EXISTS "coordenador gerencia meta_eventos_log" ON public.meta_eventos_log;
CREATE POLICY "coordenador gerencia meta_eventos_log" ON public.meta_eventos_log FOR ALL TO authenticated USING (private.has_role(auth.uid(),'coordenador')) WITH CHECK (private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "coordenador le meta_eventos_log" ON public.meta_eventos_log;
CREATE POLICY "coordenador le meta_eventos_log" ON public.meta_eventos_log FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'coordenador'));

-- public.meta_formularios
DROP POLICY IF EXISTS "coordenador gerencia meta_formularios" ON public.meta_formularios;
CREATE POLICY "coordenador gerencia meta_formularios" ON public.meta_formularios FOR ALL TO authenticated USING (private.has_role(auth.uid(),'coordenador')) WITH CHECK (private.has_role(auth.uid(),'coordenador'));

-- public.motivos_perda
DROP POLICY IF EXISTS "motivos_perda_delete_coord" ON public.motivos_perda;
CREATE POLICY "motivos_perda_delete_coord" ON public.motivos_perda FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "motivos_perda_insert_coord" ON public.motivos_perda;
CREATE POLICY "motivos_perda_insert_coord" ON public.motivos_perda FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "motivos_perda_update_coord" ON public.motivos_perda;
CREATE POLICY "motivos_perda_update_coord" ON public.motivos_perda FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'coordenador')) WITH CHECK (private.has_role(auth.uid(),'coordenador'));

-- public.pagina_comercial_config (coord write)
DROP POLICY IF EXISTS "Coordenadores gerenciam config" ON public.pagina_comercial_config;
CREATE POLICY "Coordenadores gerenciam config" ON public.pagina_comercial_config FOR ALL TO authenticated USING (private.has_role(auth.uid(),'coordenador')) WITH CHECK (private.has_role(auth.uid(),'coordenador'));

-- public.propostas
DROP POLICY IF EXISTS "Coordenador gerencia propostas" ON public.propostas;
CREATE POLICY "Coordenador gerencia propostas" ON public.propostas FOR ALL TO authenticated USING (private.has_role(auth.uid(),'coordenador')) WITH CHECK (private.has_role(auth.uid(),'coordenador'));

-- public.respostas_prontas
DROP POLICY IF EXISTS "respostas_prontas_delete_coord" ON public.respostas_prontas;
CREATE POLICY "respostas_prontas_delete_coord" ON public.respostas_prontas FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'coordenador'));

-- public.user_roles
DROP POLICY IF EXISTS "user_roles_delete_coord" ON public.user_roles;
CREATE POLICY "user_roles_delete_coord" ON public.user_roles FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "user_roles_insert_coord" ON public.user_roles;
CREATE POLICY "user_roles_insert_coord" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "user_roles_update_coord" ON public.user_roles;
CREATE POLICY "user_roles_update_coord" ON public.user_roles FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'coordenador')) WITH CHECK (private.has_role(auth.uid(),'coordenador'));

-- storage.objects
DROP POLICY IF EXISTS "lead_docs_delete_owner_or_coord" ON storage.objects;
CREATE POLICY "lead_docs_delete_owner_or_coord" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='lead-documentos' AND (owner=auth.uid() OR private.has_role(auth.uid(),'coordenador')));

DROP POLICY IF EXISTS "animais_fotos_coord_insert" ON storage.objects;
CREATE POLICY "animais_fotos_coord_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='animais-fotos' AND private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "animais_fotos_coord_update" ON storage.objects;
CREATE POLICY "animais_fotos_coord_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='animais-fotos' AND private.has_role(auth.uid(),'coordenador')) WITH CHECK (bucket_id='animais-fotos' AND private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "animais_fotos_coord_delete" ON storage.objects;
CREATE POLICY "animais_fotos_coord_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='animais-fotos' AND private.has_role(auth.uid(),'coordenador'));

DROP POLICY IF EXISTS "pagina_midia_coord_insert" ON storage.objects;
CREATE POLICY "pagina_midia_coord_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='pagina-comercial-midia' AND private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "pagina_midia_coord_update" ON storage.objects;
CREATE POLICY "pagina_midia_coord_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='pagina-comercial-midia' AND private.has_role(auth.uid(),'coordenador')) WITH CHECK (bucket_id='pagina-comercial-midia' AND private.has_role(auth.uid(),'coordenador'));
DROP POLICY IF EXISTS "pagina_midia_coord_delete" ON storage.objects;
CREATE POLICY "pagina_midia_coord_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='pagina-comercial-midia' AND private.has_role(auth.uid(),'coordenador'));

-- 2) Fix contratos_pdf_update WITH CHECK (ownership enforced on write)
DROP POLICY IF EXISTS "contratos_pdf_update" ON storage.objects;
CREATE POLICY "contratos_pdf_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id='contratos-pdf' AND (owner=auth.uid() OR private.has_role(auth.uid(),'coordenador')))
  WITH CHECK (bucket_id='contratos-pdf' AND (owner=auth.uid() OR private.has_role(auth.uid(),'coordenador')));

-- 3) Public page config: hide drafts from anon; expose only published columns via view
DROP POLICY IF EXISTS "Config ativa é pública" ON public.pagina_comercial_config;

CREATE OR REPLACE VIEW public.pagina_comercial_config_public
WITH (security_invoker = true) AS
SELECT id, conteudo, tema, funil_id, etapa_inicial, responsavel_padrao_id, ativo,
       criado_em, atualizado_em, publicado_em, publicado_por
FROM public.pagina_comercial_config
WHERE ativo = true;

GRANT SELECT ON public.pagina_comercial_config_public TO anon, authenticated;

-- Allow anon/authenticated to read active rows (needed for the invoker view to see rows)
CREATE POLICY "pagina_config_public_read_ativo" ON public.pagina_comercial_config
  FOR SELECT TO anon, authenticated
  USING (ativo = true);

-- Prevent anon from reading draft columns via direct table access
REVOKE SELECT ON public.pagina_comercial_config FROM anon;
GRANT SELECT (id, conteudo, tema, funil_id, etapa_inicial, responsavel_padrao_id, ativo,
              criado_em, atualizado_em, publicado_em, publicado_por)
  ON public.pagina_comercial_config TO anon;

-- 4) Drop public.has_role from exposed schema (kept as private.has_role)
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
