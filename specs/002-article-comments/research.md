# Research: Article Comments

## D1. Build on Supabase rather than adopt a product

- **Decision**: Build a small moderated comments feature on the existing Supabase project.
- **Rationale**: The requirements (no GitHub account, no anonymous posting, approve before publish, per-article switch, no cost, no server) rule out Giscus/Utterances (GitHub accounts), Disqus (ads, tracking), Commento/Remark42/Cusdis (self-hosted server or paid), and Common Ninja (ads). The existing database, auth and admin area already cover storage, identity and moderation.
- **Alternatives**: Hosted widgets (rejected above). Email magic-link sign-in (rejected by the owner: they prefer a third party so no credentials are managed).

## D2. Google and GitHub sign-in and the risk of enabling sign-ups

- **Decision**: Use Supabase's Google and GitHub providers (`signInWithOAuth`). Create a Google Cloud OAuth client (web) and a GitHub OAuth App, put each client id and secret in Supabase, add the Supabase callback to each provider's authorised redirects, and add the site address to Supabase's redirect URLs. Google is always offered so no reader needs a GitHub account; GitHub is a convenience for developers.
- **Account linking**: Supabase links identities that share a verified email. `app_metadata.provider` stays the first provider used, and is `google` or `github` for either, so one policy check covers both.
- **Risk**: Sign-ups are currently disabled. Turning them on lets anyone create an account. Admin access is already role-based (`is_administrator()` on `administrator_profiles`), so new users gain nothing there. The remaining exposure is spam accounts commenting.
- **Site-only registration (added)**: Supabase email and password sign-up is also offered, with email confirmation required. This is the same account type as the OAuth routes, so later features (newsletter and so on) can attach to it.
- **Email delivery limit (checked against Supabase docs)**: Confirmation works on the free plan, but the built-in mail server only sends to your own team's addresses, at about 2 messages per hour. It is not usable for real readers. A free custom SMTP service is required. Supabase then caps at 30 messages per hour until raised on the Rate Limits page. Google and GitHub sign-in need no email at all, so they work without SMTP.
- **SMTP provider choice (limits read from vendor pages, Oct 2026)**: Brevo free is 300 emails per day with no time limit, with transactional overflow queued (1,000). Resend free is 3,000 per month and 100 per day. ZeptoMail is credit-based pay as you go (its free allowance is not confirmed). SendGrid's free allowance could not be confirmed and it may no longer have a permanent free plan. **Decided: Brevo** (owner choice), since it has the highest free daily volume. Whether Brevo's "Sent with Brevo" sticker appears on transactional emails is unverified.
- **Switching providers**: Supabase takes SMTP as host, port, user, password and sender, entered in the dashboard. No site code depends on the provider, so switching is a settings change plus DNS records (SPF and DKIM) for the sending domain. Keep the sender address on our own domain (for example `no-reply@antsytek.com`) so it stays the same across providers.
- **Captcha (decided)**: Enable Supabase Auth captcha with Cloudflare Turnstile (free) on sign-up and sign-in. The site key is public and goes in a repo variable; the secret goes only into Supabase. Turnstile also protects the SMTP sender from sign-up abuse.
- **Mitigation**: The insert policies require `is_verified_reader()` (confirmed email, so no anonymous sessions and no unconfirmed sign-ups), plus the block flag, rate-limit trigger and administrator approval. Bots can still create confirmed email accounts, so moderation and the rate limit carry the weight; a captcha (Supabase supports Turnstile or hCaptcha on sign-up) is the named upgrade if spam appears. Admin sign-in stays email and password for existing admins and is gated by `administrator_profiles`.
- **Checks**: Verify in the live project that an unconfirmed email account and an anonymous session cannot insert a comment, and that no reader can read the admin tables. Account linking (an existing admin email signing in with Google) only adds an identity to the same user and keeps the admin role.

## D3. Display name copied onto the comment

- **Decision**: `comments.author_name` is set by a trigger from the commenter's profile at insert time.
- **Rationale**: Anonymous readers can then read comments without any access to profile rows, so no email, user id link or block status is ever exposed. A later name change does not rewrite old comments, which is acceptable for v1.
- **Alternatives**: Public read on profiles (rejected: exposes more than needed); a join view (rejected: more policy surface).

## D4. Approve-first is enforced in the database

- **Decision**: The insert policy only allows `status = 'pending'`. A trigger blocks changes to `status`, `body` and `user_id` by non-administrators. Administrators change status via their own update policy.
- **Rationale**: A browser client can send anything, so the client cannot be trusted to set status.

## D5. Rate limiting and block

- **Decision**: A before-insert trigger rejects a comment if the user has 5 or more comments created in the last 10 minutes, or 20 or more pending. The insert policy requires the profile not to be blocked.
- **Rationale**: Cheap and enough alongside approval. A captcha is the named upgrade (`shortcut:` comment in the migration).

## D6. Per-article switch

- **Decision**: `content_items.comments_enabled boolean not null default true`. The insert policy checks it. Existing approved comments stay visible when it is off.
- **Rationale**: Enforced in the database so a stale page or a modified client cannot bypass it (FR-014, SC-005).

## D7. Count and lazy loading

- **Decision**: After the article shows, one request fetches only the approved count. Opening the section fetches the comment list. Sign-in is not requested until "Add a comment" is chosen.
- **Rationale**: Meets SC-001 and keeps readers who never open comments unaffected. The count request explicitly filters `status = approved`, so a signed-in author's own pending comment is never counted.
- **Note**: Comments are never prerendered, so approvals show without a rebuild (FR-010).

## D8. Sign-in return and sessions

- **Decision**: `redirectTo` is the current article address. The Supabase client reads the returned session from the URL as it does today. The Supabase redirect list must allow the site origin with a wildcard path.
- **Check**: Confirm that the repository base path (`/antsy/`) and the later custom domain both work, and that the admin session logic (`useAdminSession`) ignores reader sessions, which it does by checking `administrator_profiles`.

## D9. Rendering and abuse

- Comment text is rendered with normal Vue text interpolation, preserving line breaks with CSS. Never as HTML or Markdown. Links are plain text (spec assumption).
- Limits: body 1-2000 characters, display name 2-40 characters, enforced by database constraints and mirrored in the form.

## D10. Deliberately skipped

Threaded replies, edits, reactions, email notifications, captcha, a Facebook or Apple provider, and a public profile page. Each is named in code or tasks as an upgrade where relevant.
