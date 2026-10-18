# Tasks: Privacy-Friendly Analytics

**Input**: Design documents in `/specs/004-privacy-analytics/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/analytics.md](contracts/analytics.md)

**Tests**: Unit tests for the plugin's decision logic only (constitution Principle II, project testing policy). Cookie and storage checks are done live per [quickstart.md](quickstart.md).

**Ponytail**: Follow `.github/skills/ponytail/SKILL.md`. Mark each deliberate shortcut with `shortcut: <limit>, <when to upgrade>`.

## Format: `- [ ] [ID] [P?] [Story] Description with file path`

---

## Phase 1: Setup

- [ ] T001 **User action**: choose GoatCounter or Umami (check licence, free tier and dashboard embedding), create the site, note its id, and set repository variables `NUXT_PUBLIC_ANALYTICS_PROVIDER`, `NUXT_PUBLIC_ANALYTICS_ID`, and optionally `NUXT_PUBLIC_ANALYTICS_HOST` and `NUXT_PUBLIC_ANALYTICS_DASHBOARD`
- [ ] T002 Add `analyticsProvider`, `analyticsId`, `analyticsHost` and `analyticsDashboard` (all empty strings) to `runtimeConfig.public` in `nuxt.config.ts`, and pass the four variables as env to the build step in `.github/workflows/deploy-pages.yml`

---

## Phase 2: User Story 1 - Count visits without tracking readers (P1)

**Goal**: Cookieless, per-view counting that skips admin and dev, and never breaks the site.

**Independent Test**: In a clean private window, browse several pages. No cookies or analytics storage appear, no banner shows, and the views appear in the provider dashboard.

- [ ] T003 [P] [US1] Create `app/utils/analytics.ts` with pure helpers: `shouldLoad({dev, provider, id, doNotTrack})` (false in dev, with empty provider or id, or with Do Not Track `'1'`), `countPath(fullPath, base)` (drops query and hash and the base path, keeps a leading `/`), and `shouldCount(path, lastPath)` (false for paths starting `/admin` and for a repeat of the last path)
- [ ] T004 [P] [US1] Unit tests in `tests/unit/analytics.test.ts`: dev, empty id, Do Not Track, `/antsy/search?q=x` becomes `/search`, `/admin` and `/admin/articles/1` not counted, repeats not counted
- [ ] T005 [US1] Create `app/plugins/analytics.client.ts`: after `onNuxtReady`, append one `async` script (GoatCounter: `https://<id>.goatcounter.com/count.js` with `data-goatcounter` and `data-goatcounter-settings='{"no_onload":true}'`; Umami: `<host or Umami Cloud>/script.js` with `data-website-id` and `data-auto-track="false"`); on script load count the current page, then count on every `router.afterEach`; call `window.goatcounter.count({ path })` or `window.umami.track(props => ({ ...props, url: path }))`; ignore load errors and blocked calls silently (`shortcut: failures are swallowed on purpose so analytics can never break reading`); write no cookies or storage
- [ ] T006 [US1] Verify live (quickstart checks 1-6, 10): no cookies or storage, views counted once per navigation, search text absent from the counted path, nothing counted on `/admin`, blocking the host leaves the site working, Do Not Track respected, empty provider loads no script

**Checkpoint**: Analytics collects data. This is the MVP.

---

## Phase 3: User Story 2 - Review traffic from the admin dashboard (P1)

**Goal**: Administrators see traffic from the admin dashboard, with an optional embed.

**Independent Test**: Sign in as administrator and open the dashboard. The traffic card shows a working link and, when a share URL is saved, an embed or a clear fallback.

- [ ] T007 [US2] Write `supabase/migrations/20260201000003_admin_settings.sql`, additive and re-runnable: table `public.admin_settings (key text primary key, value text not null, updated_at timestamptz not null default now())` with check `char_length(value) <= 500` and, for key `analytics_dashboard_url`, `value ~ '^https://'`; `set_updated_at()` trigger; RLS enabled; select, insert, update and delete policies each `using / with check (public.is_administrator())`; `revoke all` from `anon`; grant `select, insert, update, delete` to `authenticated`
- [ ] T008 [P] [US2] Add `getAdminSetting(key)` and `saveAdminSetting(key, value)` to `app/composables/useAdminContent.ts`, returning `null` when the table is missing or the row is absent
- [ ] T009 [US2] Create `app/components/TrafficCard.vue`: link to `analyticsDashboard` (`target="_blank" rel="noopener noreferrer"`); if the saved share URL starts with `https://` show it in an `iframe` with a title for screen readers and an "open in a new tab" link; an input and Save button to set it, rejecting non-https values with a visible message; on any failure show the plain link and an explanation and leave the rest of the dashboard unaffected
- [ ] T010 [US2] Add `TrafficCard` to `app/pages/admin/index.vue`
- [ ] T011 **User action**: apply the T007 migration in the Supabase SQL editor
- [ ] T012 [US2] Verify live (quickstart checks 7 and 8): a non-administrator cannot read or write `admin_settings`, the share URL is absent from the public build, and the embed or its fallback works

**Checkpoint**: US1 and US2 deliver the full request.

---

## Phase 4: User Story 3 - Tell readers what is collected (P2)

**Goal**: A footer link to an accurate privacy page.

**Independent Test**: Follow the footer link from any page. The page matches what is actually collected.

- [ ] T013 [P] [US3] Create `app/components/SiteFooter.vue` with a link to `/privacy` and the site name
- [ ] T014 [US3] Render `SiteFooter` in `app/layouts/default.vue` below `<main>` (not in the admin layout)
- [ ] T015 [US3] Create `app/pages/privacy.vue` with an `h1`, the provider name from runtime config, what is counted (page address, referrer, browser and screen type, country-level location), that no cookies, persistent storage or personal identifiers are used, that no consent is needed, and a contact line from `app.config.ts` social links; add `/privacy` to `scripts/prerender-routes.mjs` if the route list is explicit
- [ ] T016 [US3] Update `tests/component/SiteHeader.test.ts` or add a small footer component test so the privacy link is covered

---

## Phase 5: Polish and Cross-Cutting

- [ ] T017 Run `npx nuxt prepare`, `npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json`, `npm run lint`, `npx vitest run tests/unit tests/component`; fix findings
- [ ] T018 Document the four variables and provider switching in the repository `README.md` or `specs/004-privacy-analytics/quickstart.md`
- [ ] T019 Commit and push, wait for the deploy, then run every check in [quickstart.md](quickstart.md) live; fix and re-push
- [ ] T020 Tick completed tasks and note the skipped items (events, custom reports, script proxying) in the closing note

---

## Dependencies and order

- T001 and T002 first. T003 before T005. T007 before T008 and T011. T008 before T009. T009 before T010.
- US2 does not need US1 data to build, but needs it to show anything useful.
- US3 is independent of the others.

## Parallel example

T003 and T004 together. T008 and T013 together.

## Strategy

- **MVP**: Phase 1 and US1, then US2 for the dashboard, then US3 for the privacy page. Ship the privacy page with, or immediately after, the first deploy that collects data.
