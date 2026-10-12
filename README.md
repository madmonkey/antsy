# Antsy Tek

Markdown CMS site: Nuxt 4, Supabase (own project), published as static pages on GitHub Pages. Design docs: `specs/001-markdown-cms-site/`.

## Develop

```
npm ci
cp .env.example .env      # fill in the Supabase URL and publishable key
npm run dev               # http://localhost:3000
npm run test:unit         # unit + component tests
```

Local database and end-to-end tests (Docker required):

```
npx supabase start
npx supabase db reset     # migrations + seed (admin@example.test / local-admin-password)
npx supabase test db      # pgTAP
$env:E2E_SUPABASE_KEY="<publishable key from `npx supabase status`>"
npm run test:e2e
npm run test:integration  # full static build against the local database (slow)
```

## Publish (GitHub Pages)

1. Repository **Settings > Pages > Source: GitHub Actions**.
2. **Settings > Secrets and variables > Actions > Variables**: `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Optional `NUXT_APP_BASE_URL`: defaults to `/<repo>/`; set it to `/` when using a custom domain.
3. Push to `main`. The workflow also runs daily and from **Actions > Run workflow**; run it manually after deactivating or deleting content so the public snapshot drops it.
4. The build fails (and the previous site stays up) if Supabase is unreachable, rate-limited, or has no active topics.

Add the published address to Supabase **Authentication > URL Configuration > Redirect URLs** (for example `https://madmonkey.github.io/antsy/**`).

### Custom domain

1. **Pages > Custom domain**: enter the hostname and add the DNS record GitHub asks for (CNAME for a subdomain, GitHub's apex records for a root domain). Do not point DNS at Supabase.
2. Add `public/CNAME` containing the exact hostname, set `NUXT_APP_BASE_URL` to `/`, and enable HTTPS once verified.
3. Add the custom-domain URL to the Supabase Redirect URLs.

### Abuse protection

The sign-in lockout is client-side only (it slows casual guessing, nothing more). Real limits come from Supabase Auth rate limits; keep public sign-ups off. Reading is public by design; there is no server-side rate limiting beyond what Supabase and GitHub Pages provide.

## Database

See `supabase/README.md` and `supabase/adoption/README.md`. The hosted project gets migrations only, never `seed.sql`.
