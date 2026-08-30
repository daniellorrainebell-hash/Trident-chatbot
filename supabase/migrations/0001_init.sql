-- =============================================================================
-- Nexus IQ LinkedIn Content Engine
-- Initial schema. Spec section 45.
--
-- Design notes:
--   Full post version history is preserved (non-negotiable rule 15). post_versions
--   is append-only; posts.final_text is a pointer to the accepted version, not the
--   only copy of the text.
--
--   feedback_events is the learning loop's substrate. It stores what changed and
--   the observable editorial preference behind it, never chain-of-thought.
-- =============================================================================

create extension if not exists "vector";
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Users and identity
-- -----------------------------------------------------------------------------

create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  name        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id) on delete cascade,
  bio                text,
  expertise          text,
  target_audience    text,
  positioning        text,
  offers             text,
  goals              text,
  -- Structured voice preferences. Spec section 29 forbids a prose blob here.
  voice_profile_json jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id)
);

-- -----------------------------------------------------------------------------
-- Offers
-- Stored structurally so guarantees, scarcity and urgency can be gated on
-- approval and verification rather than on model judgement.
-- -----------------------------------------------------------------------------

create table if not exists offers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete cascade,
  offer_name          text not null,
  avatar              text,
  problem             text,
  dream_outcome       text,
  core_deliverables   jsonb not null default '[]'::jsonb,
  delivery_mode       text check (delivery_mode in ('DIY', 'DWY', 'DFY', 'mixed')),
  time_to_first_value text,
  client_effort       text,
  proof               jsonb not null default '[]'::jsonb,
  bonuses             jsonb not null default '[]'::jsonb,
  -- {type, terms, approved}. Only approved guarantees may appear in copy.
  guarantee_json      jsonb,
  -- {active, type, quantity, reason, verified_at}
  scarcity_json       jsonb,
  -- {active, deadline, reason, verified_at}
  urgency_json        jsonb,
  price               text,
  cta                 text,
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists offers_user_idx on offers (user_id) where active;

-- -----------------------------------------------------------------------------
-- Ideas and posts
-- -----------------------------------------------------------------------------

create table if not exists ideas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  raw_idea      text not null,
  topic         text,
  status        text not null default 'captured',
  analysis_json jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists ideas_user_created_idx on ideas (user_id, created_at desc);

create type post_status as enum (
  'idea_captured',
  'analysed',
  'research_pending',
  'researched',
  'hooks_generated',
  'hook_selected',
  'outlined',
  'drafted',
  'critiqued',
  'ready_for_review',
  'user_edited',
  'approved',
  'published',
  'performance_recorded'
);

create table if not exists posts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references users(id) on delete cascade,
  idea_id           uuid references ideas(id) on delete set null,
  title_internal    text,
  topic             text,
  content_pillar    text,
  framework_id      text,
  psychology_json   jsonb not null default '{}'::jsonb,
  hook_family       text,
  selected_hook     text,
  -- Retained so the hook screen can show what was not chosen.
  hook_candidates_json jsonb not null default '[]'::jsonb,
  outline_json      jsonb,
  draft_text        text,
  final_text        text,
  status            post_status not null default 'idea_captured',
  research_required boolean not null default false,
  research_json     jsonb,
  critic_json       jsonb,
  lint_json         jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  published_at      timestamptz
);

create index if not exists posts_user_created_idx on posts (user_id, created_at desc);
create index if not exists posts_user_status_idx on posts (user_id, status);
create index if not exists posts_framework_idx on posts (user_id, framework_id);
create index if not exists posts_hook_family_idx on posts (user_id, hook_family);

-- Append-only version history. Non-negotiable rule 15.
create type post_version_source as enum (
  'ai_draft',
  'ai_revision',
  'user_edit',
  'final'
);

create table if not exists post_versions (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid not null references posts(id) on delete cascade,
  version_number integer not null,
  text           text not null,
  source         post_version_source not null,
  created_at     timestamptz not null default now(),
  unique (post_id, version_number)
);

create index if not exists post_versions_post_idx on post_versions (post_id, version_number desc);

-- -----------------------------------------------------------------------------
-- Feedback memory
-- -----------------------------------------------------------------------------

create table if not exists feedback_events (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  post_id          uuid references posts(id) on delete cascade,
  version_id       uuid references post_versions(id) on delete set null,
  feedback_type    text not null,
  original_text    text,
  replacement_text text,
  -- One sentence. Observable editorial preference only, never reasoning traces.
  reason_summary   text not null,
  tags_json        jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists feedback_user_created_idx on feedback_events (user_id, created_at desc);
create index if not exists feedback_tags_idx on feedback_events using gin (tags_json);

-- -----------------------------------------------------------------------------
-- Framework library
-- Seeded from src/frameworks. The table lets a user edit a framework without a
-- deploy; code definitions are the defaults, not the only source.
-- -----------------------------------------------------------------------------

create table if not exists framework_definitions (
  id            text primary key,
  name          text not null,
  source        text not null,
  source_family text,
  category      text not null,
  description   text,
  rules_json    jsonb not null default '{}'::jsonb,
  examples_json jsonb not null default '[]'::jsonb,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Knowledge base
-- -----------------------------------------------------------------------------

create table if not exists knowledge_documents (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  title          text not null,
  source         text,
  -- Namespaces from spec section 32.
  knowledge_type text not null check (
    knowledge_type in ('identity', 'writing', 'knowledge', 'performance')
  ),
  raw_text       text not null,
  metadata_json  jsonb not null default '{}'::jsonb,
  embedding      vector(1536),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists knowledge_user_type_idx on knowledge_documents (user_id, knowledge_type);
create index if not exists knowledge_embedding_idx
  on knowledge_documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table if not exists user_post_embeddings (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references posts(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  embedding     vector(1536),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  unique (post_id)
);

create index if not exists post_embedding_idx
  on user_post_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- -----------------------------------------------------------------------------
-- Performance
-- Only metrics actually available. Spec section 45: do not infer unavailable
-- metrics, and store sample sizes before drawing conclusions.
-- -----------------------------------------------------------------------------

create table if not exists performance_metrics (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references posts(id) on delete cascade,
  impressions   integer,
  reactions     integer,
  comments      integer,
  reposts       integer,
  profile_views integer,
  leads         integer,
  notes         text,
  captured_at   timestamptz not null default now()
);

create index if not exists performance_post_idx on performance_metrics (post_id, captured_at desc);

-- -----------------------------------------------------------------------------
-- Retrieval functions
-- -----------------------------------------------------------------------------

create or replace function match_user_posts (
  query_embedding vector(1536),
  match_user_id   uuid,
  match_count     integer default 5
)
returns table (
  post_id      uuid,
  topic        text,
  text         text,
  framework_id text,
  hook_family  text,
  similarity   float
)
language sql stable
as $$
  select
    p.id,
    p.topic,
    coalesce(p.final_text, p.draft_text),
    p.framework_id,
    p.hook_family,
    1 - (e.embedding <=> query_embedding) as similarity
  from user_post_embeddings e
  join posts p on p.id = e.post_id
  where e.user_id = match_user_id
    and p.status in ('approved', 'published', 'performance_recorded')
  order by e.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function match_knowledge_documents (
  query_embedding      vector(1536),
  match_user_id        uuid,
  match_count          integer default 8,
  filter_namespaces    text[] default array['identity', 'knowledge'],
  filter_topic         text default null,
  filter_approved_only boolean default false
)
returns table (
  id             uuid,
  title          text,
  knowledge_type text,
  raw_text       text,
  metadata_json  jsonb,
  similarity     float
)
language sql stable
as $$
  select
    d.id,
    d.title,
    d.knowledge_type,
    d.raw_text,
    d.metadata_json,
    1 - (d.embedding <=> query_embedding) as similarity
  from knowledge_documents d
  where d.user_id = match_user_id
    and d.knowledge_type = any (filter_namespaces)
    and (filter_topic is null or d.metadata_json ->> 'topic' = filter_topic)
    and (not filter_approved_only or coalesce((d.metadata_json ->> 'approved')::boolean, false))
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

-- -----------------------------------------------------------------------------
-- Row level security
-- Every user-scoped table is owner-only. The service role bypasses these and is
-- server-side only.
-- -----------------------------------------------------------------------------

alter table profiles             enable row level security;
alter table offers               enable row level security;
alter table ideas                enable row level security;
alter table posts                enable row level security;
alter table post_versions        enable row level security;
alter table feedback_events      enable row level security;
alter table knowledge_documents  enable row level security;
alter table user_post_embeddings enable row level security;
alter table performance_metrics  enable row level security;

create policy profiles_owner on profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy offers_owner on offers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy ideas_owner on ideas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy posts_owner on posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy post_versions_owner on post_versions
  for all using (
    exists (select 1 from posts p where p.id = post_versions.post_id and p.user_id = auth.uid())
  );

create policy feedback_owner on feedback_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy knowledge_owner on knowledge_documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy post_embeddings_owner on user_post_embeddings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy performance_owner on performance_metrics
  for all using (
    exists (select 1 from posts p where p.id = performance_metrics.post_id and p.user_id = auth.uid())
  );

-- The framework library is readable by any authenticated user; edits go through
-- the service role.
alter table framework_definitions enable row level security;
create policy frameworks_read on framework_definitions for select using (true);
