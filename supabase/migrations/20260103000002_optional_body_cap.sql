-- OPTIONAL, CHANGES ASTRO'S BEHAVIOR: caps article body size (Markdown incl. embedded data: image URIs).
-- shortcut: 7,000,000 is the planned value, tighten or confirm after the T015 size spike (research D6).

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'content_items_body_max_length'
  ) then
    alter table public.content_items
      add constraint content_items_body_max_length check (char_length(body) <= 7000000);
  end if;
end
$$;
