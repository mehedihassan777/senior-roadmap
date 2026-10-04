-- Senior Engineer Roadmap: Neon schema
-- Run once in: Neon Console -> your project -> SQL Editor -> paste -> Run
--
-- The roadmap content lives in the app (src/data/roadmap.json).
-- The database only stores YOUR state so it syncs between home and office.
-- `t` is the client-side last-write time in epoch milliseconds (newest write wins).

create table if not exists task_progress (
  task_id   text primary key,      -- e.g. 'd12-t2' (day 12, task index 2)
  day       int     not null,
  completed boolean not null default false,
  t         bigint  not null
);

create table if not exists day_notes (
  day  int primary key,
  note text   not null default '',
  t    bigint not null
);

create table if not exists settings (
  key   text primary key,          -- 'start_date'
  value text   not null,
  t     bigint not null
);
