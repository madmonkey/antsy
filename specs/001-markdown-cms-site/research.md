# Research: Markdown CMS Website

Sources: spec.md, constitution, and the reference project `madmonkey/astro` (README, `nuxt.config.ts`, `package.json`, migrations `0001` to `0003`, deploy workflow).

## D1. Stack mirrors the reference
- **Decision**: Nuxt 4 + Nuxt UI 4 + Tailwind 4 + supabase-js + marked/marked-footnote + sanitize-html; Vitest + Playwright + pgTAP.
- **Rationale**: Owner asked for "latest Nuxt, markdown" modeled on the reference; proven combination, enables a 1:1 Astro adoption guide.
- **Alternatives**: Nuxt Content (file-based; conflicts with DB-backed CMS); a different editor library (extra dependency for no gain).

## D2. Static hosting: pre-rendered snapshot plus live client data
- **Decision**: `nitro.preset = github_pages`. The deploy workflow first runs a small script (`scripts/prerender-routes.mjs`) that queries active topics and articles with only the publishable key (anonymous, RLS-limited reads) and writes the route list used by `nitro.prerender.routes`; `nuxt generate` then pre-renders the home page, each active topic and each active article from the live database. The script is the last data-gathering step before generation; a read failure or empty result fails the build. Pages hydrate in the browser and re-fetch current data on load, so visitors always end up with fresh content. Anything not pre-rendered (for example an article published after the last build) still works through a client-rendered fallback page.
- **Rebuild triggers**: push to `main`, manual `workflow_dispatch`, and a scheduled run (default daily). There is no in-app "publish" button because that would need a GitHub token in the browser.
- **Rationale**: GitHub Pages serves its fallback page with HTTP 404, so un-pre-rendered deep links are not indexable and often show no link preview. Pre-rendering gives real pages (status 200) with real titles, descriptions, and text for search engines and link previews.
- **Known trade-offs (must be documented in the quickstart)**:
  - New articles are reachable immediately but are indexable only after the next build.
  - **A deactivated article stays in the static HTML until the next build**, even though the live site stops showing it after the browser re-fetches. The database enforces access (RLS), but the pre-rendered copy is public. After deactivating or deleting sensitive content, trigger a manual rebuild.
  - Embedded images make pre-rendered article pages large (up to 5 MB each); acceptable at blog scale.
- **Alternatives**: Client-only SPA (immediate edits, but no indexing or previews); SSR (needs a server).
- **Verify at scaffold**: that Nuxt emits `404.html` for the fallback and that prerendering works with the route list from the script; if the database is unreachable at build time, fail the build (do not publish an empty site).

## D3. Isolated database, Astro-compatible structure
- **Decision**: This site gets its own new Supabase project. Its schema keeps Astro's names and rules as the **baseline** (`public.administrator_profiles`, `public.topics`, `public.content_items`, `public.is_administrator()`, `public.set_updated_at()`, and Astro's RLS policies and grants) and adds the new features on top as separate additive migrations. Astro's three migrations (`0001_initial_schema`, `0002_access_policies`, `0003_administrator_deletion`) are copied verbatim as the baseline.
- **Rationale**: Building in isolation removes any risk to Astro's live data and Auth settings, while a superset schema means Astro can adopt the features later by applying only the feature migrations: no data move, no renames. Topic and article slugs and names may repeat across sites because the projects are separate.
- **Alternatives**: Same project with `cms_` tables (earlier design; shared quotas and Auth settings, and no path to share tables); same tables with a `project` column (needs changes to Astro's live policies and constraints); separate schema in the shared project (extra dashboard changes).
- **Migration layout** (`supabase/migrations/`, timestamp-versioned):
  1. `*_astro_baseline_0001/0002/0003.sql`: verbatim copies; never edited; **not** part of adoption.
  2. `*_feature_columns.sql` (required for adoption, additive): `topics.description text not null default ''`, `topics.is_previewable boolean not null default false`, `topics.published_at timestamptz`, `content_items.excerpt text not null default ''` with `char_length <= 280`, `content_items.published_at timestamptz`, indexes, and a backfill that sets `published_at = created_at` for rows already active.
  3. `*_feature_published_at.sql` (required, additive): trigger on insert and update that stamps `published_at` once when a row first becomes active.
  4. `*_optional_slug_lock.sql` (optional, **changes Astro behavior**): rejects slug changes once `published_at` is set.
  5. `*_optional_body_cap.sql` (optional, **changes Astro behavior**): `content_items.body` `char_length <= 7,000,000`.
  Astro's existing policies and table-level grants already cover the new columns, so no policy changes are needed.
- **Adoption path (FR-026, SC-014)**: `supabase/adoption/` holds an adoption README and a rollback script that removes only items 2-5. Rehearsal: load Astro's baseline into a local stack with sample data, apply 2-3 (then 4-5), run this repo's pgTAP tests, confirm rows unchanged, run rollback, confirm the schema equals the baseline. Migrations are re-runnable (`if not exists`, `create or replace`, drop-then-create for triggers and constraints).
- **D3 rehearsal result (local, Supabase CLI 2.120.0, Postgres 17)**: all migrations apply; `supabase test db` passes (26 tests, incl. adoption checks); `adoption/rollback.sql` restores exactly the baseline columns, indexes, triggers and functions. Astro's own test suite was deliberately not run; this repo's pgTAP suites (`feature_rls`, `astro_adoption`) are the tests for this environment.
- **Migration application**: Apply manually in order via the SQL editor, or `supabase db push` against this site's own project (safe because it is isolated).
- **Local development**: Local Supabase stack applies the same migrations; no guarded prerequisites are needed because the baseline creates the administrator objects.
- **Administrator bootstrap**: Create the administrator's Auth user in the new project, then insert their `user_id` into `administrator_profiles` once through the SQL editor.

## D4. Recent-articles preview and previewable topics
- **Decision**: `topics.is_previewable boolean not null default false`. Preview = one query: active articles joined (inner) to active, previewable topics, ordered by `published_at desc`, limit 3, optional topic-slug filter; columns exclude `body`. Filter options = active previewable topics.
- **Rationale**: Matches spec (default not previewable, applies to unfiltered preview too); single round trip; never downloads bodies.
- **Alternatives**: Client-side filtering of all articles (downloads bodies; leaks nothing but slow).

## D5. Published date and excerpt
- **Decision**: `published_at` set by a trigger on **insert and update** the first time an article is active (`new.is_active and new.published_at is null`); kept on later edits. A pgTAP test covers create-active, activate-later, and deactivate/reactivate. `excerpt` column (<= 280 chars) generated client-side from rendered text on save (images and markup stripped), DB check enforces length.
- **Rationale**: "Recent" needs a stable date that does not change on typo fixes; excerpts must not include base64 image data, and SQL-side stripping is fragile.
- **Alternatives**: Order by `created_at` (drafts written long ago appear old); SQL generated column (cannot reliably strip Markdown).

## D6. Embedded images
- **Decision**: Images are embedded as `data:image/<png|jpeg|gif|webp>;base64,...` inside the article body. Validation in the editor: type allow-list, size <= 1 MB per image, total embedded <= 5 MB per article, and **magic-byte sniffing** (content, not name/extension). SVG rejected. The editor shows short tokens (e.g. `![alt](embedded:1)`) while editing and expands them to full data URIs on save (collapses on load) so the text area stays readable. DB backstop: `char_length(body) <= 7,000,000`. Limits are measured on **raw image bytes**; base64 inflates by 4/3, so 5 MB of images is about 6.7 MB of text, leaving about 0.3 MB for prose under the 7,000,000 cap. Tighten or confirm the cap with the spike result.
- **Rendering/sanitizing**: marked output through sanitize-html; `img` allows `http`, `https`, and `data` only when `src` matches `^data:image/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$`; everything else dropped; raw HTML discarded.
- **Rationale**: Meets "no folders/links to manage", travels with the article, no extra storage service or bucket policies.
- **Live preview performance**: The preview renders from the short `embedded:n` tokens, sanitizes that small text, and only afterwards substitutes the data URIs from the editor's own validated image list (never from user-typed text). Preview updates are debounced by 300 ms. A test types into an article carrying 5 MB of images and asserts the preview stays responsive; if it does not, fall back to object URLs for preview images.
- **Alternatives**: Supabase Storage bucket (extra policies, links to manage, contradicts request); keeping raw base64 in the textarea (unusable).
- **Risk**: Payload size of a ~7 MB insert via the REST API and page weight for image-heavy articles. Lists never fetch bodies.
- **Research result (inconclusive)**: Checked the Supabase docs (API security, Edge Function limits, performance). They publish no request-body limit for the Data API (PostgREST); the Edge Function limits do not apply because this site calls the Data API directly. Do not assume 7 MB works.
- **Decision**: The spike (T015, first task after the database exists) : save a 5 MB article (and a 7 MB one) to the hosted project with `supabase-js`. If either fails, lower the per-article limit (spec assumptions allow this) to the largest size that passes, with margin, and update FR-004a/SC-004a, the `body` check constraint and the editor message. Record the measured limit here.
- **Spike procedure** (`scripts/size-spike.mjs`, task T015, before the editor is built): sign in as an administrator, insert one `content_items` row each with a 1 MB, 5 MB and 7 MB body in an inactive test topic, read each back and compare length, then delete the rows. The script runs only after the migrations exist on this site's hosted project, writes only to its own database, and reports the largest passing size and any error status (for example 413) plus insert time. Also record the time `marked` + `sanitize-html` take on the 5 MB body. Outcome sets the final limits in FR-004b, the `body` check, and the editor message.
- **Spike result (hosted project, 2026-10-11)**: 1 MB insert 760 ms, 5 MB 2263 ms, 7 MB 2538 ms; all read back with identical length. No 413 or other error up to 7,000,000 characters, so the 7,000,000 cap stands. `marked` + `sanitize-html` took 3708 ms on ~5 MB of plain text (one-off, Node): acceptable at build time, but the live preview must stay on short `embedded:n` tokens as designed, never the expanded body.
- **Difference from reference**: Astro excludes data URLs; this site permits only the strict image pattern above, for admin-authored content. Captured in the adoption guide (FR-022).

## D7. Day/night mode
- **Decision**: Enable Nuxt UI's color mode (reference disables it) with `preference: 'system'`; toggle button persists choice in localStorage via the module; article styles use theme tokens so both modes keep contrast.
- **Alternatives**: Custom CSS/JS toggle (re-implements what the module does).

## D8. Social links
- **Decision**: `app/app.config.ts` list `{ platform, label, url, icon }` rendered as icon links (`target="_blank" rel="noopener noreferrer"`, `aria-label`). Icons via `i-simple-icons-github` / `i-simple-icons-bluesky` (bundled locally with `@iconify-json/simple-icons` so no runtime icon requests).
- **Rationale**: Spec assumption: owner-maintained config, not admin UI; empty list renders nothing.

## D9. Authentication and throttle
- **Decision**: Supabase email/password sign-in; admin pages check session + `administrator_profiles` row (UI convenience only; RLS decides). Client throttle: 3 failures -> 15-minute lockout in localStorage, with documented note that server-side Auth rate limits/CAPTCHA are the real control.
- **Alternatives**: Magic links/OAuth (more redirect configuration).
- **Auth setup**: this site has its own project, so set its Auth **Site URL** to the site address and add local and custom-domain URLs to the Redirect URLs allow-list. Nothing here touches Astro's project.

## D10. Concurrent edits
- **Decision**: No locking; last save wins. The owner confirmed administrators do not edit the same site at the same time.
- **Upgrade path**: shortcut: last-write-wins, add an `updated_at` match on update (send back the server's exact timestamp text) if more than one person edits the same site.

## D11. Custom domain and base path
- **Decision**: Default `NUXT_APP_BASE_URL='/'` (root custom domain). Add `public/CNAME` with the exact hostname only once chosen; enable HTTPS in Pages settings after DNS verifies; redirect from the default `*.github.io` address is handled by GitHub Pages once a custom domain is set.
- **Alternatives**: Keep `/<repo>/` path (supported by the same variable).

## D12. Language readiness
- **Decision**: `app.head.htmlAttrs.lang = 'en-US'`; visible strings kept in components/templates (no hard-wired concatenation); no i18n runtime now.

## D13. Delete behavior
- **Decision**: `content_items.topic_id` references topics with `on delete cascade`; delete grants and admin-only delete policies on both tables (all inherited from Astro's `0003_administrator_deletion`); UI requires explicit confirmation.
- **Note**: An earlier note here said Astro restricts deletes; that was wrong. Astro's `0003` migration switches the foreign key to cascade and adds delete grants and policies, so this site's behavior matches Astro's.

## D14. Legacy ButterCMS content (checked 2026-10-11, task T059)
- **Result**: Not recoverable from public sources. The ButterCMS account data has been purged (owner confirmed). The Wayback Machine lists 7 snapshots under `antsytek.com/blog/*` (all 2024-08-11), but the old site was a client-rendered Vue app: each snapshot is an empty app shell with no post text, dates or images. No `api.buttercms.com` responses were archived, so the content never reached the archive.
- **Titles seen in the URLs (slugs only)**: common-myths-of-remote-work, moving-git-repositories-with-history, python-impressions-from-a-net-guy, serverless-musings, the-system-is-broken, vuejs-typescript-netcore, what-bruce-lee-taught-me-about-programming.
- **Decision**: No importer and no spec change. If the owner has the posts elsewhere (local copies, an export, a repository), they can be re-entered through the admin editor, or an importer can be scoped then. The slugs above can be reused so old links keep working.

## Deferred (named, not built)
Search, comments, visitor accounts, image reuse across articles, i18n/auto-translate runtime, admin UI for social links, Content-Security-Policy (static host cannot set headers; a meta-tag CSP can be evaluated later).

