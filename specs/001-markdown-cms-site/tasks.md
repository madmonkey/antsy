---

description: "Task list for Markdown CMS Website"
---

# Tasks: Markdown CMS Website

**Input**: Design documents from `/specs/001-markdown-cms-site/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. FR-016 requires automated tests for visibility, admin access control and sanitization; plan.md lists Vitest, Playwright and pgTAP.

**Organization**: Grouped by user story (US1-US6 from spec.md). Paths follow plan.md (Nuxt 4 `app/` at repo root).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Different files, no dependency on an unfinished task
- **[Story]**: US1-US6; none for Setup, Foundational, Polish

---

## Phase 1: Setup

- [X] T001 Scaffold Nuxt 4 project at the repo root per plan.md: `package.json` (Node >=22.19.0), `nuxt.config.ts` (`ssr: true` with `nitro.preset = github_pages`, `app.baseURL` from `NUXT_APP_BASE_URL` default `/`, `@nuxt/ui` with color mode enabled and `preference: 'system'`, `<html lang="en-US">`), `app/app.vue`, `app/assets/css/main.css`; confirm package versions with `npm view` and pin via lockfile
- [X] T002 [P] Add dependencies (`@supabase/supabase-js`, `marked`, `marked-footnote`, `sanitize-html`, `@iconify-json/simple-icons`) and dev dependencies (Vitest + jsdom, Playwright, TypeScript) in `package.json`; add scripts `test:unit` (unit + component), `test:integration`, `test:e2e`, `typecheck`, `lint`
- [X] T003 [P] Create `.env.example` with `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NUXT_APP_BASE_URL` (publishable key only; no service-role key anywhere) and `.gitignore` entries for `.env`
- [X] T004 [P] Configure Vitest in `vitest.config.ts` and Playwright in `playwright.config.ts` with the `tests/unit`, `tests/component`, `tests/integration`, `tests/e2e` folders from plan.md

---

## Phase 2: Foundational (blocks all user stories)

**CRITICAL**: No story starts until this phase is done. Schema rules (FR-026, data-model.md): the Astro baseline migrations are copied verbatim and never edited; every feature migration is additive and re-runnable; behavior-changing rules live in their own optional migrations.

### Database

- [X] T005a Copy Astro's `0001_initial_schema.sql`, `0002_access_policies.sql` and `0003_administrator_deletion.sql` verbatim from https://github.com/madmonkey/astro (commit b8f35e3f306faeff980bf8d5f31ae148de7d2246) into `supabase/migrations/` as `<timestamp>_astro_baseline_000{1,2,3}.sql`, noting the source commit in `supabase/README.md`; never edit them afterwards
- [X] T005 [P] Create `supabase/fixtures/astro_sample_data.sql`: a few Astro-style topics and content_items (active and inactive, no feature columns) used to prove adoption leaves existing rows unchanged
- [X] T006 Create `supabase/migrations/<timestamp>_feature_columns.sql` (additive, re-runnable with `add column if not exists`; per data-model.md). `topics`: `description text not null default ''`; `is_previewable boolean not null default false`; `published_at timestamptz` "null until first activation". `content_items`: `excerpt text not null default ''` with `char_length <= 280`; `published_at timestamptz` "null until first activation". Backfill `published_at = created_at` for rows already active. Indexes: `content_items (topic_id)`, `content_items (published_at desc) where is_active`. Astro's RLS policies and grants already cover the new columns; add no policies
- [X] T007 Create `supabase/migrations/<timestamp>_feature_published_at.sql`: a trigger function and triggers on both tables that run on **insert and update**, set `published_at` once when `is_active` first becomes true (so an article created already active is stamped) and never clear it
- [X] T008 Create the optional behavior-changing migrations, each labelled in a header comment as changing Astro's behavior: `<timestamp>_optional_slug_lock.sql` (reject slug changes once `published_at` is set, message "published addresses are permanent", spec FR-025) and `<timestamp>_optional_body_cap.sql` (`content_items.body` "not blank, `char_length <= 7,000,000`" as a check constraint; final value from T015)
- [X] T009 [P] Create `supabase/adoption/README.md` and `supabase/adoption/rollback.sql`: README lists the required migrations (T006, T007) and optional ones (T008) to apply to Astro's database in order, what changes for Astro, and how to verify; rollback drops only the columns, indexes, triggers, functions and constraints added by T006-T008 (FR-026). Never run automatically
- [X] T010 [P] Create `supabase/seed.sql` (local only): one administrator, two topics (one previewable), a few articles; include the pgTAP-friendly active/inactive combinations
- [X] T011 [P] Write pgTAP tests in `supabase/tests/feature_rls.test.sql` (the body-limit case uses the final value from T008, revisited after T015): anon sees only active topics and articles in active topics; non-administrator cannot write; administrator can; an article created already active gets `published_at`; `published_at` is never cleared; slug change after publish is rejected; topic delete cascades articles; over-280 excerpt and over-limit body are rejected
- [X] T012 Write the adoption test (depends on T009 for the rollback script) in `supabase/tests/astro_adoption.test.sql` using the baseline migrations and T005 sample data: after applying only T006-T007 (then T008), the baseline tables, policies and rows are unchanged apart from the added columns and their defaults; Astro-style inserts without the new columns still succeed; after `supabase/adoption/rollback.sql` the schema equals the baseline (SC-014)
- [X] T013 Rehearse locally per quickstart.md section 6: apply baseline + sample data to a local stack, apply T006-T007 then T008, run `supabase test db`, run the rollback and confirm the schema equals the baseline. Record the outcome in `specs/001-markdown-cms-site/research.md`

### Hosted gate

- [X] T014 Create a **new** Supabase project for this site, apply all migrations in order (SQL editor or `supabase db push`; do not apply `seed.sql`), create the administrator's Auth user and insert their `user_id` into `public.administrator_profiles`, set the Auth Site URL and Redirect URLs for local and custom-domain addresses. Depends on T013
- [X] T015 Create `scripts/size-spike.mjs` per research.md D6 and run it against the new project: sign in as an administrator, insert 1 MB, 5 MB and 7 MB bodies into an inactive test topic, read each back and compare length, delete them, report the largest passing size, any error status (e.g. 413) and the time `marked` + `sanitize-html` take on the 5 MB body. Record results in `research.md` D6; if 7 MB fails, lower the body cap in T008, FR-004b and the editor message. Depends on T014. **Gate for US3**

### Application base

- [X] T016 [P] Implement `app/composables/useSupabase.ts` (client from public runtime config; throws a clear error if URL/key missing)
- [X] T017 [P] Implement `app/utils/markdown.ts`: `marked` + `marked-footnote` then `sanitize-html`; raw HTML discarded; links limited to http/https/mailto; images limited to http/https or `data:image/(png|jpeg|gif|webp);base64,...`; external links get `rel="noopener noreferrer"`
- [X] T018 [P] Write unit tests in `tests/unit/markdown.test.ts` for malicious samples (raw HTML, script, `javascript:` links, `data:image/svg+xml`, `data:text/html`, unsafe image URLs) and for correct rendering of headings, lists, quotes, code, tables and footnotes (SC-004, FR-016)
- [X] T019 [P] Create shared types in `app/types/index.ts` (Topic, Article, PreviewArticle) matching data-model.md
- [X] T020 Create `app/layouts/default.vue` and a loading / error state component `app/components/StateMessage.vue` (loading skeleton, friendly error with Retry; FR-014) and the not-found page `app/pages/[...slug].vue` with a link home

**Checkpoint**: Database matches Astro's baseline plus additive features, adoption is rehearsed, size limits are known, base app and sanitizer are ready.

---

## Phase 3: User Story 1 - Visitors browse and read published content (P1) MVP

**Goal**: Anonymous visitors browse active topics, read articles, and see the recent-articles preview.

**Independent Test**: With seeded active topics/articles, reach an article from home in <= 3 clicks; inactive items never appear; preview shows <= 3 articles from previewable topics only, filterable.

### Tests

- [X] T021 [P] [US1] Component test for the preview in `tests/component/RecentArticles.test.ts`: never more than 3; filter options only previewable topics; empty, loading and error states; non-previewable topic articles absent from the unfiltered list (spec scenarios 5-9, SC-001a)
- [X] T022 [P] [US1] Playwright test in `tests/e2e/reading.spec.ts`: home -> topic -> article within 3 clicks; inactive topic/article URL shows not-found; direct load of an article URL works; body is never requested by list queries

### Implementation

- [X] T023 [P] [US1] Implement `app/composables/useTopics.ts`: topic list (id, name, slug, description; order name), preview filter options (`is_previewable = true`, order name)
- [X] T024 [P] [US1] Implement `app/composables/useArticles.ts`: topic-page list (id, title, slug, excerpt, published_at; order published_at desc), article by slug (with body and topic name/slug), landing preview (inner join `topics`, topic `is_previewable = true`, `published_at is not null`, optional topic slug, order published_at desc, **limit 3**, never `body`) per contracts/data-access.md
- [X] T025 [P] [US1] Create `app/components/ArticleBody.vue` rendering sanitized HTML via `app/utils/markdown.ts` with theme-token typography (headings, lists, quotes, code, tables, footnotes, images) readable in both appearances
- [X] T026 [US1] Create `app/components/RecentArticles.vue`: parallel load of filter options and newest 3, topic filter with clear control, title/topic/date/excerpt links, loading/empty/error states (contracts/ui-routes.md "Landing preview behavior"). Depends on T023, T024
- [X] T027 [US1] Create `app/pages/index.vue` (preview + active topic list), `app/pages/topics/[slug].vue` and `app/pages/articles/[slug].vue`; inactive, in-inactive-topic or missing -> not-found; set `<title>` and meta description per page (FR-023); data re-fetched in the browser after load (FR-024). Depends on T025, T026

**Checkpoint**: Public reading works; MVP.

---

## Phase 4: User Story 2 - Administrator signs in securely (P1)

**Goal**: Only allow-listed administrators reach `/admin`.

**Independent Test**: Admin reaches the area; a signed-in non-approved user and an anonymous visitor are refused.

- [X] T028 [P] [US2] Unit test `tests/unit/throttle.test.ts`: 3 failures then block for 15 minutes with a "retry at" time; reset on success; survives reload (localStorage)
- [X] T029 [P] [US2] Implement `app/utils/throttle.ts` (client-side only, documented as such per FR-006)
- [X] T030 [US2] Implement `app/composables/useAdminSession.ts`: `signInWithPassword`, `signOut`, check own row in `administrator_profiles` (UI gating only; RLS is the real boundary)
- [X] T031 [US2] Create `app/pages/admin/login.vue` (email/password form, throttle message) and route middleware `app/middleware/admin.ts` redirecting anonymous and non-allow-listed users from `/admin*` to `/admin/login`, with a "session ended" message on expiry
- [X] T032 [P] [US2] Create `app/layouts/admin.vue` and a minimal `app/pages/admin/index.vue` dashboard shell (lists come in US3)
- [X] T033 [P] [US2] Playwright test `tests/e2e/admin-auth.spec.ts`: admin signs in; non-approved user is refused and a direct write attempt is denied by RLS; anonymous `/admin` redirects; fourth attempt within 15 minutes is blocked

---

## Phase 5: User Story 3 - Administrator creates and manages topics and articles (P1)

**Goal**: Full CMS with sanitized live preview, embedded images and slug rules.

**Independent Test**: Create a topic, add an article with a table and an embedded image, preview, activate both, see them publicly; deactivate hides them.

**Depends on**: US2 and the T015 spike result.

### Tests

- [ ] T034 [P] [US3] Unit tests in `tests/unit/embed-image.test.ts`: accepts png/jpeg/gif/webp by magic bytes; rejects SVG and a script renamed `.png`; rejects > 1 MB per image and > 5 MB per article, measured on raw bytes before base64 (or the limits recorded by T015); correct messages
- [ ] T035 [P] [US3] Unit tests in `tests/unit/slug-excerpt.test.ts`: slug generation from title/name, numeric-suffix suggestion on duplicates, excerpt <= 280 chars from Markdown without tokens
- [ ] T036 [P] [US3] Component test `tests/component/MarkdownEditor.test.ts`: preview updates debounced by 300 ms; `embedded:n` tokens are replaced with data URIs only after sanitizing; a 5 MB article stays responsive (object-URL fallback if not, per research.md D6)
- [ ] T037 [P] [US3] Playwright test `tests/e2e/admin-content.spec.ts`: create/edit/activate/deactivate topic and article, previewable toggle, delete topic with confirmation, failed save preserves the draft, slug refused after publish, duplicate slug suggestion

### Implementation

- [ ] T038 [P] [US3] Implement `app/utils/embed-image.ts`: magic-byte sniffing, size limits, `embedded:n` token map, expansion to data URIs on save, alt text handling
- [ ] T039 [P] [US3] Implement `app/utils/excerpt.ts` (generated client-side, <= 280 chars) and slug helpers (`^[a-z0-9]+(?:-[a-z0-9]+)*$`, suffix suggestion)
- [ ] T040 [US3] Create `app/components/MarkdownEditor.vue`: formatting helpers, paste/drop/select image embedding, alt-text edit, replace/remove, debounced (300 ms) sanitized preview using the same renderer as public pages. Depends on T038
- [ ] T041 [US3] Create `app/pages/admin/topics.vue`: create/edit/activate, previewable toggle, delete with the confirmation "all its articles will be permanently deleted"; slug editable until published; field-level error messages from the error contract
- [ ] T042 [US3] Create `app/pages/admin/articles/[id].vue` (`new` for create): topic select, title, slug, editor, activate toggle, save with last-write-wins (leave a `shortcut: last write wins, add a version check if concurrent admins appear` comment); failed saves keep the draft; expired session redirects with draft preserved. Depends on T039, T040
- [ ] T043 [US3] Complete `app/pages/admin/index.vue`: topic and article lists including inactive, bodies omitted

**Checkpoint**: Authoring works end to end.

---

## Phase 6: User Story 4 - Site is served from the owner's own domain (P2)

**Goal**: Secure custom domain with working sign-in.

**Independent Test**: Domain loads over HTTPS; admin signs in and out there.

- [X] T044 [P] [US4] Create `.github/workflows/deploy-pages.yml`: triggers on push, `workflow_dispatch` and a daily schedule; install, run unit and component tests (e2e runs locally, not in CI), run `scripts/prerender-routes.mjs`, then `nuxt generate` with repository variables `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; deploy to Pages only if every step succeeded. **Before first publish:** run `npm ci` and a full `nuxt generate` with the real env to confirm the clean install and build (lockfile changed after the vitest 5 upgrade); recheck `npm audit` (remaining findings are Nuxt dev tooling only)
- [X] T045 [P] [US4] Create `scripts/prerender-routes.mjs`: with the publishable key read active topic and article slugs (no bodies, one list query per table; keep the request count small to stay within free-tier limits) and write the route list consumed by `nitro.prerender.routes` in `nuxt.config.ts`; exit non-zero on any read error, rate-limit response or empty snapshot so the previous site stays published (FR-023); also ensure a `404.html` fallback is emitted
- [X] T046 [US4] Integration test `tests/integration/build-output.test.ts`: built files contain no secrets, correct base path, `lang="en-US"`, per-page titles and descriptions, `404.html` present (SC-007, FR-021); also run the route script against an unreachable URL and assert a non-zero exit (quickstart scenario 17)
- [X] T047 [US4] Document in `quickstart.md`/`README.md` the Pages setup, repository variables, custom domain steps (DNS record, `public/CNAME` added only once the domain is chosen, HTTPS, Redirect URL for the custom domain) and server-side abuse protection note (FR-006, FR-011, FR-017)

---

## Phase 7: User Story 5 - Astro can adopt this site's database and features later (P2)

**Goal**: Prove the schema is an additive superset of Astro's and document the adoption path.

**Independent Test**: On a copy of Astro's schema with sample data, apply the adoption migrations: existing rows are unaffected; rollback restores the baseline.

- [ ] T048 [US5] Run the quickstart section 6 rehearsal end to end (it reuses T012/T013) and confirm the new project holds no Astro rows, accounts or credentials; inspect the published files for credentials (SC-008, SC-007, SC-014)
- [ ] T049 [P] [US5] Document the new-project bootstrap, the adoption path and the rollback in `supabase/README.md` (FR-026), pointing to `supabase/adoption/README.md` from T009 and noting that baseline migrations are verbatim copies and never edited

---

## Phase 8: User Story 6 - Header toolbar with day/night mode and social links (P2)

**Goal**: Toolbar on every page.

**Independent Test**: Toggle day/night, reload and see it remembered; social icon opens the right profile in a new tab.

- [ ] T050 [P] [US6] Component tests `tests/component/SiteHeader.test.ts`: toggle labels "Switch to night mode" / "Switch to day mode"; first visit follows device preference; choice persisted; social links have `target="_blank" rel="noopener noreferrer"` and `aria-label`; empty list renders only the toggle; keyboard operable
- [ ] T051 [P] [US6] Create `app/app.config.ts` with site name and social links (GitHub, Bluesky; platform, label, URL)
- [ ] T052 [P] [US6] Create `app/components/ThemeToggle.vue` and `app/components/SocialLinks.vue` (icons from `@iconify-json/simple-icons`)
- [ ] T053 [US6] Create `app/components/SiteHeader.vue` (home link, toggle, social icons; wraps on narrow screens without hiding controls) and include it in `app/layouts/default.vue` and `app/layouts/admin.vue`; verify contrast of theme tokens in both modes including article content (FR-018, FR-020)

---

## Phase 9: Polish and cross-cutting

- [ ] T054 [P] Accessibility pass: keyboard navigation, semantic headings, contrast in both modes, image alt text (FR-015, SC-010, SC-011)
- [ ] T055 [P] Write the embedded-image adoption guide `docs/embedded-images-adoption.md` and a ready-to-file issue `docs/astro-issue-embedded-images.md` (allowed types, limits, sanitizer rules, editor interaction, the adoption migrations to apply (link `supabase/adoption/README.md`), the deliberate difference from Astro); the owner files the issue manually (FR-022)
- [ ] T056 [P] Performance check: public pages < 2 s on throttled mobile, lists never fetch `body` (SC-005), filter < 1 s (SC-001a)
- [ ] T057 Run all quickstart.md validation scenarios (1-17) and fix gaps; confirm Astro's existing tests still pass against the adoption rehearsal database (SC-012, SC-014); time two manual checks: a first-time administrator creates a topic and publishes an article in under 5 minutes (SC-002) and adds an image in under 30 seconds (SC-004a); also time following the custom-domain documentation, under 1 hour of active effort excluding DNS propagation (SC-009)
- [x] T059 [P] Optional, low expectation: check the Wayback Machine for archived posts at `antsytek.com/blog` (CDX listing at `web.archive.org/cdx/search/cdx?url=antsytek.com/blog*&output=json&collapse=urlkey`, then open the snapshots). Record in `research.md` what survives (post count, titles, dates, whether images were archived). If nothing useful is found, close the task. If posts are found, ask the owner before building an importer: it would be a local one-off script that converts the archived HTML to Markdown, keeps the original dates in `created_at` and `published_at`, and skips already-imported slugs. No spec requirement is added unless content is found
- [X] T058 Remove the Sync Impact Report comment from `.specify/memory/constitution.md` before the first commit and review `README.md` for completeness (FR-017)

---

## Dependencies and Execution Order

- Phase 1 -> Phase 2 -> stories. T005a is a prerequisite for T005-T008, T012 and T013. T013 -> T014 -> T015 is strictly sequential (rehearse, create hosted project, spike).
- US1 needs only T016-T020 (the seeded local database). US2 needs T016, T020. US3 needs US2 plus T015. US4 can start after T016 and uses US1 pages for the build. US5 needs T014. US6 can run any time after T020 and is independent of US1-US5 (US1 pages work without the toolbar).
- Within a story: tests first (they should fail), then utils/composables, then components, then pages.

### Parallel examples

- Phase 2: T009, T010, T011 together once T008 is done (T012 follows T009); T016-T019 together.
- US1: T021, T022, T023, T024, T025 together.
- US3: T034-T037 and T038, T039 together.

## Implementation Strategy

1. MVP: Phases 1-2 (T001-T013, T016-T020 are enough for local work) then US1; validate against the local seeded database.
2. Add US2 and US3 for authoring; do not start US3 until the T015 spike has set the final size limits.
3. Add US6, US4, US5 in any order; run Polish last.
4. Create the hosted project only after T013 passes.

## Notes

- Commit after each task or logical group.
- Marker semantics: `astro-safety.md` checklist is reviewer-owned; do not tick its items from here.

