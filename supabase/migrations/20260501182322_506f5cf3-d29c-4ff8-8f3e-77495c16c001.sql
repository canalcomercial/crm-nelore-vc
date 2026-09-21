-- 1. Enum de papéis
CREATE TYPE public.app_role AS ENUM ('coordenador', 'vendedor');

-- 2. Tabela profiles (1:1 com auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Tabela user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Função has_role (security definer evita recursão em RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Trigger: ao criar usuário no auth, cria profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _nome TEXT;
  _role public.app_role;
  _is_first BOOLEAN;
BEGIN
  _nome := COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, _nome, NEW.email);

  -- Primeiro usuário do sistema vira coordenador automaticamente
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO _is_first;

  IF _is_first THEN
    _role := 'coordenador';
  ELSE
    _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'vendedor');
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Trigger atualizado_em em profiles
CREATE TRIGGER trg_profiles_atualizado
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_set_atualizado();

-- 7. Policies profiles
CREATE POLICY "profiles_select_authenticated"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_self_or_coord"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'coordenador'))
WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'coordenador'));

CREATE POLICY "profiles_delete_coord"
ON public.profiles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'coordenador'));

-- 8. Policies user_roles
CREATE POLICY "user_roles_select_authenticated"
ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_roles_insert_coord"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'coordenador'));

CREATE POLICY "user_roles_update_coord"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'coordenador'))
WITH CHECK (public.has_role(auth.uid(), 'coordenador'));

CREATE POLICY "user_roles_delete_coord"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'coordenador'));

-- 9. Limpa tabela usuarios antiga (recriar do zero)
DELETE FROM public.usuarios;

-- 10. Substitui policies abertas por policies que exigem login
DROP POLICY IF EXISTS open_all ON public.leads;
DROP POLICY IF EXISTS open_all ON public.funis;
DROP POLICY IF EXISTS open_all ON public.vendas;
DROP POLICY IF EXISTS open_all ON public.interacoes;
DROP POLICY IF EXISTS open_all ON public.mensagens_chat;
DROP POLICY IF EXISTS open_all ON public.follow_ups;
DROP POLICY IF EXISTS open_all ON public.disparos;
DROP POLICY IF EXISTS open_all ON public.usuarios;

-- leads
CREATE POLICY "leads_select_auth" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "leads_insert_auth" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "leads_update_auth" ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "leads_delete_coord" ON public.leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'coordenador'));

-- funis
CREATE POLICY "funis_select_auth" ON public.funis FOR SELECT TO authenticated USING (true);
CREATE POLICY "funis_modify_coord" ON public.funis FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'coordenador'));
CREATE POLICY "funis_update_coord" ON public.funis FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'coordenador')) WITH CHECK (public.has_role(auth.uid(), 'coordenador'));
CREATE POLICY "funis_delete_coord" ON public.funis FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'coordenador'));

-- vendas
CREATE POLICY "vendas_select_auth" ON public.vendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "vendas_insert_auth" ON public.vendas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vendas_update_auth" ON public.vendas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vendas_delete_coord" ON public.vendas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'coordenador'));

-- interacoes / mensagens / followups / disparos: tudo autenticado
CREATE POLICY "interacoes_all_auth" ON public.interacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mensagens_all_auth" ON public.mensagens_chat FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "followups_all_auth" ON public.follow_ups FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "disparos_all_auth" ON public.disparos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- usuarios (legado): mantida só leitura para evitar quebrar referências; gestão real vai pelo profiles
CREATE POLICY "usuarios_select_auth" ON public.usuarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "usuarios_modify_coord" ON public.usuarios FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coordenador')) WITH CHECK (public.has_role(auth.uid(), 'coordenador'));