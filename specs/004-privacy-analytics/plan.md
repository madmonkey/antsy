# Implementation Plan: Privacy-Friendly Analytics

**Branch**: `004-privacy-analytics` | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-privacy-analytics/spec.md`

## Summary

Load a cookieless hosted analytics script (GoatCounter or Umami, chosen by configuration) from a small client plugin that counts public page views by hand on every route change, skips admin pages and non-production builds, and fails silently. Add a footer with a privacy page, and an admin dashboard card that links to, and optionally embeds, the provider dashboard. One tiny admin-only settings table keeps the optional dashboard share link out of the public bundle.

## Technical Context

**Language/Version**: TypeScript 6, Node >= 22.19.0, PostgreSQL (Supabase), as in [feature 001](../001-markdown-cms-site/plan.md).

**Primary Dependencies**: None new. The provider script is loaded at runtime from the provider's host.

**Storage**: Provider holds all analytics data. One tiny table `admin_settings (key, value)` with administrator-only RLS holds the optional dashboard share URL. See [data-model.md](data-model.md).

**Testing**: Vitest unit tests for the plugin's decision logic (when to load, when to count, path normalisation). The cookie-free promise and the privacy page are checked on the live site, per the project testing policy.

**Target Platform**: Static GitHub Pages site, browser-only plugin.

**Project Type**: Web application.

**Performance Goals**: Zero impact on first render. The script loads after `onNuxtReady`, `async`, and never blocks.

**Constraints**: No cookies and no persistent storage. Nothing secret in the public bundle (provider id and script host are public by nature; the dashboard share link is not, so it goes in the settings table). GitHub Pages cannot set headers, so there is no content security policy to extend.

**Scale/Scope**: 1 plugin, 1 page, 1 layout edit, 1 dashboard card, 1 migration, 3 workflow variables.

## Constitution Check

*GATE: passes before research; re-checked after design (still passes).*

| Principle | Assessment |
|-----------|------------|
| I. Small, purposeful changes | Pass. No analytics code of our own, no new dependency, no event system. Embedding is the only extra and is optional with a link fallback. |
| II. Correctness is verified | Pass. Unit tests for the decision logic. Live checks for cookies and storage. |
| III. Explicit contracts and failures | Pass. [contracts/analytics.md](contracts/analytics.md) defines configuration and behaviour. A script failure is swallowed deliberately and documented as a shortcut, because analytics must never break reading. |
| IV. Secure defaults | Pass. No personal data, no cookies, share link kept admin-only, iframe limited to https. |
| V. Maintainable, observable delivery | Pass. Variables documented. Switching or turning off a provider is configuration only. |
| VI. Ponytail | Pass. Reuses the provider's dashboards instead of building reports. |

No violations; Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/004-privacy-analytics/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── analytics.md
└── tasks.md             # created later by /speckit-tasks
```

### Source Code (repository root)

```text
supabase/migrations/
└── 20260201000003_admin_settings.sql

app/
├── plugins/analytics.client.ts      # new: load script, count route changes
├── utils/analytics.ts               # new: pure decision logic (testable)
├── components/
│   ├── SiteFooter.vue               # new: privacy link
│   └── TrafficCard.vue              # new: admin dashboard card
├── layouts/default.vue              # edit: add footer
├── pages/
│   ├── privacy.vue                  # new
│   └── admin/index.vue              # edit: add TrafficCard
└── composables/useAdminContent.ts   # edit: get/save the dashboard URL

nuxt.config.ts                       # edit: runtimeConfig.public.analytics*
.github/workflows/deploy-pages.yml   # edit: pass analytics variables
tests/unit/analytics.test.ts
```

**Structure Decision**: Keep it in the existing app. The provider is chosen by configuration, so only one plugin and one pure helper exist.

## Complexity Tracking

None.
