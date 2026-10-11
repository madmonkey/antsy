# Quickstart: Validation Guide

Prerequisites: Node.js >= 22.19.0, Docker (local Supabase), a GitHub repository with Pages set to **GitHub Actions**, access to Supabase and DNS for the owner's domain (this site uses its **own new** Supabase project, not Astro's). Data and policies: [data-model.md](data-model.md); calls: [contracts/data-access.md](contracts/data-access.md).

## 1. Local run

```powershell
npm ci
Copy-Item .env.example .env
npx supabase start
npx supabase db reset --local
npm run dev
```

Set the local public values from `npx supabase status` in `.env`:
`NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Open `http://localhost:3000/`. Create a local Auth user and add its id to `public.administrator_profiles`.

## 2. Automated checks

```powershell
npm run lint; npm run typecheck; npm run test:unit
npx supabase test db
npm run test:e2e
npm run build; npm run test:integration
```

Expected: all pass; build output contains no service-role key, only the public URL and publishable key.

## 3. Manual scenarios

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Create topic (inactive), article (inactive) | Not visible to anonymous visitors anywhere |
| 2 | Activate both | Visible on topic page and article page |
| 3 | With 4+ active articles in previewable topics | Landing shows exactly 3, newest first |
| 4 | Toggle topic previewable off | Its articles vanish from preview and filter; topic page still works |
| 5 | Select filter, then clear | Preview narrows to topic, then restores |
| 6 | Paste PNG into editor | Image shows in preview; saved; visible to visitors |
| 7 | Try SVG, oversize file, renamed script | Rejected with message; article unchanged |
| 8 | Article with `<script>` and `javascript:` link | Discarded in preview and public view |
| 9 | Toggle day/night, reload | Choice persists; first visit follows device |
| 10 | Keyboard through toolbar | All controls reachable, labelled |
| 11 | Wrong password 3 times | Locked 15 minutes with message |
| 12 | Non-allow-listed Auth user opens `/admin` | Denied; writes rejected by database |
| 13 | Stop network / break key | Clear error + Retry; shell renders |
| 14 | Compare this schema with Astro's baseline; run the adoption rehearsal (section 6) | Baseline objects unchanged; feature migrations additive; Astro tests and rows unaffected; rollback restores the baseline |
| 15 | Publish an article, wait for/run the workflow, open its URL directly | Real page, HTTP 200, correct title and description |
| 16 | Deactivate an article, reload its URL | Live page shows not-found; static copy persists until the next rebuild (expected) |
| 17 | Make the database unreachable during a build | Build fails; the previous site stays published |

## 4. Hosted bootstrap

1. Create a **new** Supabase project for this site (not Astro's). Apply this repo's `supabase/migrations` **in order** (SQL editor or `supabase db push`). Do not apply `seed.sql`.
2. Create the administrator: add the Auth user, then insert their `user_id` into `public.administrator_profiles` once in the SQL editor.
2a. **Size spike** (needs the administrator from step 2): run `node scripts/size-spike.mjs`. It saves 1, 5 and 7 MB test articles, then deletes them. Record the result in `research.md` D6 and adjust limits if 7 MB fails.
3. In Supabase **Authentication > URL Configuration**, set the **Site URL** to this site's address and add local and custom-domain URLs to the Redirect URLs allow-list.
4. Repository variables: `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; optional `NUXT_APP_BASE_URL` (default `/`).
5. Push `main`; confirm the Pages workflow succeeds, including the route-script and pre-render steps. The workflow also runs daily and can be started manually (Actions > Run workflow). After deactivating or deleting sensitive content, run it manually so the public snapshot drops it.

## 5. Custom domain

1. Pages > Custom domain: enter hostname; add the DNS record GitHub requests (CNAME for subdomain, GitHub apex records for root). Do not point DNS at Supabase.
2. Add `public/CNAME` with the exact hostname; enable HTTPS after verification.
3. Add the custom-domain URL to Supabase Redirect URLs; push; verify public pages over HTTPS, the default `github.io` address redirects, and admin sign-in returns to the custom domain.

## 6. Astro adoption (after the features ship)

**Rehearsal (local, repeatable):** apply Astro's baseline (the verbatim `*_astro_baseline_*` migrations) plus the sample rows in `supabase/fixtures/astro_sample_data.sql` to a local stack; apply the required feature migrations (`*_feature_*`), then the optional ones (`*_optional_*`); run `supabase test db`; confirm existing rows are unchanged; run `supabase/adoption/rollback.sql`; confirm the schema equals the baseline.

**Hand-off:** produce the adoption guide (FR-022, `supabase/adoption/README.md` plus `docs/embedded-images-adoption.md`) and a ready-to-file issue for `madmonkey/astro`: which migrations to apply and in what order, allowed image types, limits, sanitizer pattern, editor token approach, and the data-URL policy difference. Filing is manual, and nothing is applied to Astro's database by this repo.
