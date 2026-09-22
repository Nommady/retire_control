-- Carteira 2040 — schema do Supabase
-- Rode isso no SQL Editor do projeto (Database → SQL Editor → New query).

create table if not exists public.carteiras (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  dados       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Sem isto, qualquer usuário autenticado lê a carteira de todo mundo.
alter table public.carteiras enable row level security;

create policy "le a propria carteira"
  on public.carteiras for select
  using (auth.uid() = user_id);

create policy "cria a propria carteira"
  on public.carteiras for insert
  with check (auth.uid() = user_id);

create policy "atualiza a propria carteira"
  on public.carteiras for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "apaga a propria carteira"
  on public.carteiras for delete
  using (auth.uid() = user_id);

-- carimba a data a cada gravação
create or replace function public.toca_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_carteiras_updated on public.carteiras;
create trigger trg_carteiras_updated
  before update on public.carteiras
  for each row execute function public.toca_updated_at();

-- Conferência rápida: deve listar as 4 policies e rowsecurity = true
-- select relrowsecurity from pg_class where relname = 'carteiras';
-- select policyname from pg_policies where tablename = 'carteiras';
