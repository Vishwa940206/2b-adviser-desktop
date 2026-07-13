-- Notifications: run this once in the Supabase SQL editor.

create type notification_type as enum (
  'new_application',
  'application_status',
  'document_uploaded',
  'rate_change'
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  adviser_id uuid not null references profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_adviser_id_created_at_idx
  on notifications (adviser_id, created_at desc);

alter table notifications enable row level security;

create policy "Advisers can view their own notifications"
  on notifications for select
  using (adviser_id = auth.uid());

create policy "Advisers can create their own notifications"
  on notifications for insert
  with check (adviser_id = auth.uid());

create policy "Advisers can mark their own notifications read"
  on notifications for update
  using (adviser_id = auth.uid())
  with check (adviser_id = auth.uid());

-- Server routes using the service role key bypass RLS entirely, so they can
-- insert notifications on behalf of any adviser (new applications, uploads, rate changes).

alter publication supabase_realtime add table notifications;

-- Singleton row tracking the last-seen BoE base rate, so /api/rates can tell
-- when it changes and broadcast a notification to every adviser.

create table rate_state (
  id smallint primary key default 1,
  base_rate numeric,
  updated_at timestamptz not null default now(),
  constraint rate_state_singleton check (id = 1)
);

insert into rate_state (id, base_rate) values (1, null);

alter table rate_state enable row level security;
-- No policies: only the service role (which bypasses RLS) touches this table.
