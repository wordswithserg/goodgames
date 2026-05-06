create table if not exists review_edits (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  rating int not null,
  body text,
  edited_at timestamptz not null default now()
);

alter table review_edits enable row level security;

create policy "Anyone can read edit history" on review_edits
  for select using (true);

create policy "Authenticated users can insert edit history" on review_edits
  for insert to authenticated with check (true);

grant select on public.review_edits to anon, authenticated;
grant insert on public.review_edits to authenticated;

-- Migrate existing first-version data from the old original_rating/original_body columns.
insert into review_edits (review_id, rating, body, edited_at)
select id, original_rating, original_body, created_at
from reviews
where original_rating is not null;
