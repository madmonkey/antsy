-- Optional cover image per article, stored in a public bucket that only administrators can write to.
alter table public.content_items add column if not exists cover_image text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('article-images', 'article-images', true, 1000000, array['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists article_images_insert on storage.objects;
drop policy if exists article_images_delete on storage.objects;
create policy article_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'article-images' and public.is_administrator());
create policy article_images_delete on storage.objects for delete to authenticated
  using (bucket_id = 'article-images' and public.is_administrator());
