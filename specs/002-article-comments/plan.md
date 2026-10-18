# Implementation Plan: Article Comments

**Branch**: `002-article-comments` | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-article-comments/spec.md`

## Summary

Add moderated, sign-in-only comments on the existing Supabase backend. Readers register or sign in with Google, GitHub or a site-only email and password account through Supabase Auth (email confirmed), choose a display name, and post comments that stay `pending` until an administrator approves them. Row-level security is the real boundary: only email-verified, non-blocked users can insert, only on articles with comments enabled, and the public sees only approved comments. A collapsed, lazy-loaded comments section sits under each article, an admin queue handles moderation, and a per-article checkbox switches commenting off and on. No new service, dependency or paid product.

## Technical Context

**Language/Version**: TypeScript 6, Node >= 22.19.0, PostgreSQL (Supabase), as in [feature 001](../001-markdown-cms-site/plan.md).

**Primary Dependencies**: Existing only (Nuxt 4, `@nuxt/ui` 4, `@supabase/supabase-js` with `signInWithOAuth`). No new package.

**Storage**: Two new tables, `commenter_profiles` and `comments`, plus `content_items.comments_enabled`. See [data-model.md](data-model.md).

**Testing**: Vitest unit and component tests only (no local Supabase, per the testing policy). Policies are verified live through the quickstart, with a pgTAP file written for later. No new e2e.

**Target Platform**: Static GitHub Pages site. All comment traffic is browser to Supabase after load, so approvals show without a rebuild.

**Project Type**: Web application (static frontend + BaaS).

**Performance Goals**: Opening comments < 1 s. Approved comment public within 10 s of approval (SC-004). No comment request until the reader opens the section (SC-001), except one small count request after load.

**Constraints**: No secrets in the repo. The Google OAuth client secret lives only in the Supabase dashboard. Public sign-ups must be enabled in Supabase, so every policy must key on a verified email (`is_verified_reader()`) and the administrator role, not merely "authenticated". Comment text is always rendered as text.

**Scale/Scope**: Blog scale. 2 tables, 1 migration, 1 composable, ~3 components, 1 admin page, 2 edited pages.

## Constitution Check

*GATE: passes before research; re-checked after design (still passes).*

| Principle | Assessment |
|-----------|------------|
| I. Small, purposeful changes | Pass. Builds on the existing database and auth. No threads, edits, notifications, captcha or new service. Third-party products were evaluated and rejected in research. |
| II. Correctness is verified | Pass. Unit tests for validation and view logic; component tests for the section states; live policy checks in the quickstart. |
| III. Explicit contracts and failures | Pass. [contracts/comments.md](contracts/comments.md) defines data access, errors and states. Refusals show a specific message. |
| IV. Secure defaults | Pass with a recorded risk. Enabling sign-ups widens who can authenticate. Mitigated by role-based admin checks (already in place), verified-email insert policy, block flag, rate-limit trigger and plain-text rendering. See [research.md](research.md) D2. |
| V. Maintainable, observable delivery | Pass. Provider setup, redirect URLs and rollback documented in [quickstart.md](quickstart.md). |
| VI. Ponytail | Pass. Smallest design that meets the spec. Skipped extras are named in research. |

No violations; Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/002-article-comments/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── comments.md
└── tasks.md             # created later by /speckit-tasks
```

### Source Code (repository root)

```text
supabase/migrations/
└── 20260201000002_article_comments.sql   # tables, policies, triggers

app/
├── components/
│   ├── CommentsSection.vue    # new: collapsed link, list, form, sign-in
│   └── ArticleView.vue        # edit: render the section (public page only)
├── composables/
│   ├── useComments.ts         # new: read, post, delete, count, profile, sign-in/out
│   └── useAdminContent.ts     # edit: comments_enabled; moderation queries
├── pages/
│   ├── admin/comments.vue     # new: moderation queue
│   ├── admin/index.vue        # edit: link and pending count
│   └── admin/articles/[id].vue# edit: comments-enabled switch
├── utils/comments.ts          # new: validation (length, name) and status labels
└── types/index.ts             # edit: Comment, CommenterProfile, comments_enabled

tests/
├── unit/comments.test.ts
└── component/CommentsSection.test.ts
```

**Structure Decision**: Keep the single Nuxt app. The reader session shares the existing Supabase client. Admin gating still depends on `administrator_profiles`, so a reader session cannot open `/admin`.

## Complexity Tracking

None.
