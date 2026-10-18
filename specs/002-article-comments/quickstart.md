# Quickstart: Article Comments

## Prerequisites

- Hosted Supabase project and the migration `20260201000002_article_comments.sql` applied in the SQL editor.
- Site-only accounts: in Supabase, Authentication, enable Email with "Confirm email" on, and set up a custom SMTP sender (default Brevo; the default mailer only emails team members) and Turnstile captcha.
- GitHub OAuth set up (once): GitHub, Settings, Developer settings, OAuth Apps, New. Homepage is the site address, callback is `https://<project>.supabase.co/auth/v1/callback`. In Supabase, Authentication, Providers, enable GitHub with the client id and secret.
- Google OAuth set up (once):
  1. Google Cloud Console, create or choose a project, configure the consent screen, create an OAuth client of type Web.
  2. Add the Supabase callback `https://<project>.supabase.co/auth/v1/callback` as an authorised redirect URI.
  3. In Supabase, Authentication, Providers, enable Google and paste the client id and secret. Allow new sign-ups.
  4. In Supabase, URL Configuration, set the Site URL and add redirect URLs for the Pages address and the custom domain, each ending in `/**`.
- An active article.

## Checks (live)

1. Signed out, open an article. Expect "Comments (0)" and no sign-in prompt, and no comment request until opened.
2. Choose "Add a comment". Expect "Continue with Google" and "Continue with GitHub", then return to the same article after either. Repeat step 4 with the other provider. Then register a site-only account: expect a confirmation email, and no commenting until it is confirmed.
3. First time: a display-name step. Expect the name to be remembered on the next visit.
4. Submit a comment. Expect the "awaiting approval" message, and the comment visible to you as pending, not to a private window.
5. In `/admin/comments`, approve it. Expect it to appear for everyone within seconds, and the count to update.
6. Reject another. Expect it never to appear.
7. Turn "Allow comments" off for the article. Expect the form to vanish and existing comments to stay, read-only. Try the old page: submission is refused. Turn it on again.
8. Post 6 comments quickly. Expect the sixth to be refused with the rate message.
9. Block the commenter. Expect their next attempt to be refused.
10. Create an email-and-password account in a private session using the API, then try to insert a comment. Expect refusal. Try to read `administrator_profiles` and `/admin`. Expect nothing.
11. Post a comment containing `<script>alert(1)</script>` and a long URL. Expect it displayed as plain text.
12. Delete your own comment. Expect it to disappear for everyone.

## Rollback

Drop the `comments` and `commenter_profiles` tables and the `comments_enabled` column, disable the Google and GitHub providers. Articles are otherwise unaffected.

## Automated

```text
npx nuxt prepare
npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json
npm run lint
npx vitest run tests/unit tests/component
```
