alter table public.content_items
  drop constraint content_items_topic_id_fkey;

alter table public.content_items
  add constraint content_items_topic_id_fkey
  foreign key (topic_id)
  references public.topics (id)
  on delete cascade;

grant delete on table public.topics to authenticated;
grant delete on table public.content_items to authenticated;

create policy "Administrators can delete topics"
on public.topics
for delete
to authenticated
using ((select public.is_administrator()));

create policy "Administrators can delete content"
on public.content_items
for delete
to authenticated
using ((select public.is_administrator()));
