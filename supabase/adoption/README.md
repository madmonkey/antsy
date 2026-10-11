# Adopting these features in Astro's database

Apply in order with `supabase db push` or the SQL editor. Take a backup first.

**Required**
1. `migrations/20260102000001_feature_columns.sql`: adds `topics.description`, `is_previewable`, `published_at`; `content_items.excerpt`, `published_at`; backfills `published_at`; adds two indexes.
2. `migrations/20260102000002_feature_published_at.sql`: stamps `published_at` on first activation.

**Optional (changes Astro's behavior)**
3. `migrations/20260103000001_optional_slug_lock.sql`: published slugs can no longer change.
4. `migrations/20260103000002_optional_body_cap.sql`: article body limited to 7,000,000 characters.

**What changes for Astro:** only added columns, indexes, triggers and constraints. Existing rows, policies and grants are untouched. Code that selects `*` into strictly typed shapes will see extra fields.

**Verify:** Astro's own tests pass; `supabase test db` (`supabase/tests/astro_adoption.test.sql`) covers the schema.

**Rollback:** `rollback.sql` removes only the additions above (and the data in the added columns). Never run automatically.
