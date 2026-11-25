-- Mokaloke / Supabase initial schema
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'مستخدم',
 username text unique,
 created_at timestamptz not null default now()
);
create table if not exists public.conversations (
 id uuid primary key default gen_random_uuid(),
 title text,
 kind text not null check (kind in ('direct','group')),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.conversation_members (
 conversation_id uuid not null references public.conversations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key(conversation_id,user_id)
);
create table if not exists public.messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.conversations(id) on delete cascade,
 sender_id uuid not null references auth.users(id),
 body text not null check (char_length(body) between 1 and 5000),
 created_at timestamptz not null default now()
);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id,created_at);
create table if not exists public.statuses (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 700),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '24 hours')
);
create or replace function public.is_conversation_member(cid uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.conversation_members where conversation_id=cid and user_id=auth.uid()); $$;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$ begin insert into public.profiles(id,display_name,username) values(new.id,coalesce(new.raw_user_meta_data->>'display_name','مستخدم'),nullif(new.raw_user_meta_data->>'username','')) on conflict(id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created_mokaloke on auth.users;
create trigger on_auth_user_created_mokaloke after insert on auth.users for each row execute procedure public.handle_new_user();
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.statuses enable row level security;
drop policy if exists "profiles visible to signed in" on public.profiles;
create policy "profiles visible to signed in" on public.profiles for select to authenticated using(true);
drop policy if exists "profile update own" on public.profiles;
create policy "profile update own" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
drop policy if exists "conversation members can view conversation" on public.conversations;
create policy "conversation members can view conversation" on public.conversations for select to authenticated using(public.is_conversation_member(id));
drop policy if exists "members can view membership" on public.conversation_members;
create policy "members can view membership" on public.conversation_members for select to authenticated using(public.is_conversation_member(conversation_id));
drop policy if exists "members read messages" on public.messages;
create policy "members read messages" on public.messages for select to authenticated using(public.is_conversation_member(conversation_id));
drop policy if exists "members send own messages" on public.messages;
create policy "members send own messages" on public.messages for insert to authenticated with check(sender_id=auth.uid() and public.is_conversation_member(conversation_id));
drop policy if exists "statuses visible signed in" on public.statuses;
create policy "statuses visible signed in" on public.statuses for select to authenticated using(expires_at>now());
drop policy if exists "create own status" on public.statuses;
create policy "create own status" on public.statuses for insert to authenticated with check(user_id=auth.uid());
drop policy if exists "delete own status" on public.statuses;
create policy "delete own status" on public.statuses for delete to authenticated using(user_id=auth.uid());
create or replace function public.create_direct_conversation(other_user uuid)
returns uuid language plpgsql security definer set search_path=public
as $$
declare cid uuid; existing uuid;
begin
 if auth.uid() is null or other_user=auth.uid() then raise exception 'Invalid user'; end if;
 select c.id into existing from conversations c
 join conversation_members a on a.conversation_id=c.id and a.user_id=auth.uid()
 join conversation_members b on b.conversation_id=c.id and b.user_id=other_user
 where c.kind='direct' limit 1;
 if existing is not null then return existing; end if;
 insert into conversations(kind,created_by) values('direct',auth.uid()) returning id into cid;
 insert into conversation_members(conversation_id,user_id) values(cid,auth.uid()),(cid,other_user);
 return cid;
end; $$;
create or replace function public.create_group_conversation(group_title text, member_ids uuid[] default '{}')
returns uuid language plpgsql security definer set search_path=public
as $$
declare cid uuid; mid uuid;
begin
 if auth.uid() is null then raise exception 'Not signed in'; end if;
 insert into conversations(title,kind,created_by) values(left(group_title,80),'group',auth.uid()) returning id into cid;
 insert into conversation_members(conversation_id,user_id) values(cid,auth.uid());
 foreach mid in array coalesce(member_ids,'{}'::uuid[]) loop
  if mid<>auth.uid() then insert into conversation_members(conversation_id,user_id) values(cid,mid) on conflict do nothing; end if;
 end loop;
 return cid;
end; $$;
grant execute on function public.create_direct_conversation(uuid) to authenticated;
grant execute on function public.create_group_conversation(text,uuid[]) to authenticated;
grant execute on function public.is_conversation_member(uuid) to authenticated;
-- Enable Realtime for message inserts (run once; ignore duplicate-publication error).
do $$ begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; when undefined_object then null; end $$;
