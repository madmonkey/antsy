# Supabase

Own isolated project; schema is Astro's baseline plus additive feature migrations.

- `migrations/*_astro_baseline_000{1,2,3}.sql`: copied verbatim from https://github.com/madmonkey/astro at commit `b8f35e3f306faeff980bf8d5f31ae148de7d2246` (`supabase/migrations/0001`-`0003`). Never edit.
- `migrations/*_feature_*.sql`: required additions. `*_optional_*.sql`: behavior-changing additions.
- `adoption/`: how to apply the features to Astro's database, and rollback.
- `tests/`: pgTAP (`supabase test db`). `seed.sql`: local only, never applied to the hosted project.
