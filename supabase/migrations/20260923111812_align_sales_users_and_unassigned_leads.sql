-- The application assigns auth/profile UUIDs, not IDs from the unused legacy usuarios table.
alter table public.vendas drop constraint vendas_vendedor_id_fkey;
alter table public.vendas add constraint vendas_vendedor_id_fkey
  foreign key (vendedor_id) references public.profiles(id) on delete set null;
alter table public.interacoes drop constraint interacoes_usuario_id_fkey;
alter table public.interacoes add constraint interacoes_usuario_id_fkey
  foreign key (usuario_id) references public.profiles(id) on delete set null;

-- Sellers can work their own leads and the shared queue awaiting assignment.
alter policy leads_select_own_or_coord on public.leads
  using (responsavel_id = (select auth.uid())
         or responsavel_id is null
         or private.has_role((select auth.uid()), 'coordenador'::public.app_role));
alter policy leads_update_own_or_coord on public.leads
  using (responsavel_id = (select auth.uid())
         or responsavel_id is null
         or private.has_role((select auth.uid()), 'coordenador'::public.app_role))
  with check (responsavel_id = (select auth.uid())
         or responsavel_id is null
         or private.has_role((select auth.uid()), 'coordenador'::public.app_role));

-- Related interactions, tasks and documents use the same access rule.
create or replace function private.has_lead_access(_lead_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1 from public.leads l
    where l.id = _lead_id
      and (l.responsavel_id = auth.uid()
           or l.responsavel_id is null
           or exists (
             select 1 from public.user_roles ur
             where ur.user_id = auth.uid() and ur.role = 'coordenador'
           ))
  )
$$;
