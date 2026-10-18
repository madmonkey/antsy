# Tasks: Article Comments

**Input**: Design documents in `/specs/002-article-comments/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/comments.md](contracts/comments.md)

**Tests**: Unit and component tests only (constitution Principle II, project testing policy: no local Supabase, no Playwright). Database policies are verified live via [quickstart.md](quickstart.md), with a pgTAP file written for later.

**Ponytail**: Follow `.github/skills/ponytail/SKILL.md`. Mark each deliberate shortcut with `shortcut: <limit>, <when to upgrade>`.

## Format: `- [ ] [ID] [P?] [Story] Description with file path`

---

## Phase 1: Setup

- [ ] T001 **User action**: create the Google Cloud OAuth client (type Web), add the Supabase callback `https://<project>.supabase.co/auth/v1/callback`, create a GitHub OAuth App with the same callback, enable the Google and GitHub providers in Supabase with their client ids and secrets, allow new sign-ups, enable the Email provider with "Confirm email" on (site-only accounts) and configure a free custom SMTP service under Authentication, SMTP (default Brevo, 300 per day free; the built-in mailer only reaches team members, 2 per hour; the sender address and SPF/DKIM stay on our own domain so the provider can be swapped by changing settings only), enable Cloudflare Turnstile captcha under Authentication, Attack Protection (secret only in Supabase, public site key in a repo variable `NUXT_PUBLIC_TURNSTILE_SITE_KEY`), and add redirect URLs (Pages address and later the custom domain, each ending `/**`). Never share the secret with the agent or commit it

---

## Phase 2: Foundational (blocks all stories)

- [ ] T002 Write `supabase/migrations/20260201000002_article_comments.sql`, additive and re-runnable: `content_items.comments_enabled boolean not null default true`; `is_verified_reader()` as `security definer`, `set search_path = ''`, returning `exists (select 1 from auth.users where id = auth.uid() and email_confirmed_at is not null)`; table `commenter_profiles (user_id uuid primary key references auth.users on delete cascade, display_name text not null, is_blocked boolean not null default false, created_at, updated_at)` with display_name trimmed and 2-40 characters; table `comments (id uuid primary key default gen_random_uuid(), content_item_id uuid not null references content_items on delete cascade, user_id uuid not null references auth.users on delete cascade, author_name text not null, body text not null, status text not null default 'pending' check (status in ('pending','approved','rejected')), created_at, updated_at)` with body trimmed and 1-2000 characters; `set_updated_at()` triggers; indexes `comments (content_item_id, status, created_at)` and a partial index on pending `(status, created_at)`; RLS on both tables with the policies in [data-model.md](data-model.md) (profiles: select own or administrator, insert own when `is_verified_reader()`, update own display name or administrator; comments: public select approved on readable articles, author select own, administrator select all, insert only `user_id = auth.uid()`, `status = 'pending'`, `is_verified_reader()`, a profile that is not blocked, and a readable article with `comments_enabled`; administrator update; author and administrator delete); before-insert trigger setting `author_name` from the profile, trimming body, and rate limiting (5 comments in 10 minutes, 20 pending) with readable exception messages; before-update trigger rejecting changes to `status`, `body`, `user_id`, `content_item_id` (comments) and `is_blocked` (profiles) by non-administrators; `shortcut:` comment noting a captcha as the upgrade
- [ ] T003 [P] Add a pgTAP file `supabase/tests/comments.sql` (written for later) covering: anonymous cannot insert, unconfirmed-email user cannot insert, anonymous-session user cannot insert, blocked user cannot insert, disabled article refuses, pending hidden from others, status change by a non-administrator refused, rate limit, cascade on article delete
- [ ] T004 [P] Add `comments_enabled` to `Article`, and new `Comment` (`id, author_name, body, created_at, status`) and `CommenterProfile` (`user_id, display_name, is_blocked`) types in `app/types/index.ts`
- [ ] T005 [P] Create `app/utils/comments.ts`: `validateComment(text)` (trimmed, 1-2000 characters), `validateDisplayName(name)` (trimmed, 2-40 characters), and `refusalMessage(error)` mapping database errors to the messages in the contract (closed, blocked, rate limit, empty or too long)
- [ ] T006 [P] Unit tests `tests/unit/comments.test.ts` for T005: boundaries at 1, 2000 and 2001, name 1, 2, 40 and 41 characters, whitespace-only, every refusal mapping
- [ ] T007 **User action**: apply the T002 migration in the Supabase SQL editor

**Checkpoint**: Database, types and validation ready.

---

## Phase 3: User Story 1 - Read comments without being bothered (P1)

**Goal**: A collapsed comments link that loads nothing until opened.

**Independent Test**: An article with approved comments shows "Comments (N)". Nothing but the count is fetched until it is opened. Pending and rejected comments are invisible and uncounted.

- [ ] T008 [US1] Create `app/composables/useComments.ts` with `countApproved(articleId)` (explicit `status = approved` filter, returns `null` on failure) and `listApproved(articleId)` (oldest first, throws on failure; includes the signed-in reader's own pending comments, flagged)
- [ ] T009 [US1] Create `app/components/CommentsSection.vue` with collapsed, loading, open, empty, error and closed states from the contract; a real button with `aria-expanded`; comment text rendered as plain text with line breaks preserved; fetch the count after `onNuxtReady` and the list only on open; show the closed note when the article's `comments_enabled` is false
- [ ] T010 [P] [US1] Component test `tests/component/CommentsSection.test.ts`: collapsed shows the count and fetches no list, opening fetches once, empty and error states, markup in a comment is shown as text, closed state hides the form
- [ ] T011 [US1] Render `CommentsSection` in `app/components/ArticleView.vue` for the public page only (not the admin preview), passing the article id and `comments_enabled`; include `comments_enabled` in the article select in `app/composables/useArticles.ts`

**Checkpoint**: Readers can read approved comments unobtrusively.

---

## Phase 4: User Story 2 - Register or sign in (Google, GitHub or email) and comment (P1)

**Goal**: A reader signs in with a third-party account, chooses a name once and submits a pending comment.

**Independent Test**: As a new reader sign in with Google (and again with GitHub), set a display name, submit a comment. It is acknowledged to you and hidden from others.

- [ ] T012 [US2] Extend `app/composables/useComments.ts` with `signInWith(provider, returnUrl)` for `'google' | 'github'` (`signInWithOAuth` with `redirectTo`), `getProfile()`, `saveDisplayName(name)`, `postComment(articleId, body)` (validate with `validateComment`, map errors with `refusalMessage`), `deleteOwn(id)`, `registerWithEmail`, `signInWithEmail` (both pass a Turnstile `captchaToken`; load the Turnstile script only when the email form opens), `signOut()`, and a reactive state of signed-out, unconfirmed or verified (unconfirmed and anonymous sessions cannot post)
- [ ] T013 [US2] Extend `CommentsSection.vue`: "Add a comment" visible only when enabled; "Continue with Google" and "Continue with GitHub" buttons plus a small "Use email instead" register and sign-in form for signed-out readers, and a "Confirm your email to comment" notice for unconfirmed ones; a one-time display-name step after first sign-in; a labelled form with character count; the success message "Thanks. Your comment will appear after it has been approved."; own pending comments shown with an "awaiting approval" tag; visible errors with `aria-live`; keep the draft in the page across the sign-in redirect where possible (`sessionStorage` is acceptable here, it is not analytics)
- [ ] T014 [P] [US2] Component tests added to `tests/component/CommentsSection.test.ts`: signed-out shows both provider buttons and no form, name step appears when no profile, submit success message, each refusal message, over-length input blocked
- [ ] T015 [US2] Verify live (quickstart checks 1-4, 8, 10, 11): sign-in returns to the same article on both the Pages address and the custom domain, an unconfirmed email account cannot post and a confirmed one can, markup shows as text, rate limit holds

---

## Phase 5: User Story 3 - Moderate comments (P1)

**Goal**: An administrator approves, rejects, deletes and blocks.

**Independent Test**: Submit a comment, approve it in the queue and see it public; reject another and confirm it never appears.

- [ ] T016 [US3] Add to `app/composables/useAdminContent.ts`: `listCommentsForModeration(status)` (joined with article title and slug, oldest first), `setCommentStatus(id, status)`, `deleteComment(id)`, `setCommenterBlocked(userId, blocked)`, `countPendingComments()`
- [ ] T017 [US3] Create `app/pages/admin/comments.vue` with the existing admin layout and middleware: tabs for pending, approved and rejected; each row shows article link, author, date and text with Approve, Reject, Delete and Block/Unblock; loading, empty and error states; confirmation before delete and block
- [ ] T018 [US3] Add a "Comments" link with the pending count to `app/pages/admin/index.vue` and the admin navigation in `app/layouts/admin.vue`
- [ ] T019 [US3] Verify live (quickstart checks 5, 6, 9, 10): approval is public within 10 seconds without a rebuild, a non-administrator cannot reach the queue or change status

---

## Phase 6: User Story 4 - Turn comments off and on per article (P2)

**Goal**: A per-article switch.

**Independent Test**: Disable on one article. The form disappears there only. Re-enable restores it with all approved comments intact.

- [ ] T020 [US4] Include `comments_enabled` in article reads and saves in `app/composables/useAdminContent.ts`
- [ ] T021 [US4] Add an "Allow comments" switch (default on for new articles) to `app/pages/admin/articles/[id].vue`
- [ ] T022 [US4] Verify live (quickstart check 7): a stale page's submission is refused with the "closed" message, pending comments can still be moderated while disabled

---

## Phase 7: User Story 5 - Manage my own comments (P3)

**Goal**: A commenter can delete their own comments and sign out.

**Independent Test**: Post, then delete your own comment. It disappears for everyone.

- [ ] T023 [US5] Add a Delete action on the signed-in reader's own comments and a "Sign out" link in `app/components/CommentsSection.vue`, using `deleteOwn` and `signOut`
- [ ] T024 [P] [US5] Component test: delete shown only on own comments, sign out returns to the signed-out state

---

## Phase 8: Polish and Cross-Cutting

- [ ] T025 Run `npx nuxt prepare`, `npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json`, `npm run lint`, `npx vitest run tests/unit tests/component`; fix findings
- [ ] T026 Update `specs/001-markdown-cms-site/spec.md` Assumptions (comments are now covered by feature 002) and any stale "comments out of scope" wording
- [ ] T027 Commit and push, wait for the deploy, run every check in [quickstart.md](quickstart.md) on the live site, and fix and re-push
- [ ] T028 Tick completed tasks and close with what was skipped (threads, edits, notifications, captcha) and the security risk (sign-ups enabled)

---

## Dependencies and order

- T001 and T002 first. T007 blocks live checks, not coding.
- US1 before US2 (same component). US3 can start after T002 and T004, in parallel with US1 and US2. US4 and US5 follow US2.
- T008 before T009, T012 before T013, T016 before T017.

## Parallel example

After T002: T003, T004, T005, T006 together. US3's T016 and US1's T008 can run together.

## Strategy

- **MVP**: Phases 1-5 (read, sign in and comment, moderate). US4 and US5 follow. Ship nothing public until moderation (US3) works, since pending comments are otherwise invisible forever.
