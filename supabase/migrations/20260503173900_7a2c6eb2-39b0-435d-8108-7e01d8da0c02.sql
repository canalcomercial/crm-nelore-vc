
DO $$
DECLARE
  _uid uuid;
  _email text := 'joaovictorszootec@gmail.com';
  _password text := '3925Jo9294.';
  _nome text := 'João Victor';
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = _email;

  IF _uid IS NULL THEN
    _uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', _uid, 'authenticated', 'authenticated',
      _email, crypt(_password, gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('nome', _nome),
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), _uid,
      jsonb_build_object('sub', _uid::text, 'email', _email, 'email_verified', true),
      'email', _uid::text, now(), now(), now());
  ELSE
    UPDATE auth.users
       SET encrypted_password = crypt(_password, gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = _uid;
  END IF;

  INSERT INTO public.profiles (id, nome, email, ativo)
  VALUES (_uid, _nome, _email, true)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, ativo = true;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'coordenador')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
