# Custom domain setup: antsytek.com

Do these in order. Each step says where to click and what to check. Items marked **(code)** need a change from the assistant, and the rest are yours.

Current state: site at `https://madmonkey.github.io/antsy/` (repo `madmonkey/antsy`, branch `main`), Supabase project `crircoulonhatlhahgol`.
Target: `https://antsytek.com`.

---

## 0. Before you start

- [ ] Own `antsytek.com` and can edit its DNS records at your registrar.
- [ ] Decide whether the site lives at the root (`antsytek.com`) or `www.antsytek.com`. These steps assume the root, with `www` redirecting to it.
- [ ] Decide whether to pay for a Supabase custom domain (step 9). It is optional.

## 1. DNS for GitHub Pages

At your registrar's DNS panel:

- [ ] Add four `A` records on the root (`@`) pointing to GitHub Pages:
  `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- [ ] Optionally add four `AAAA` records on `@`:
  `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
- [ ] Add a `CNAME` record: host `www`, value `madmonkey.github.io`
- [ ] Remove any parking-page `A` or `CNAME` records on `@` and `www`.

Check GitHub's current addresses at *docs.github.com → Pages → Managing a custom domain*, since they can change.

## 2. GitHub Pages

Repo `madmonkey/antsy` → **Settings → Pages**:

- [ ] Confirm **Source** is **GitHub Actions**.
- [ ] Enter `antsytek.com` under **Custom domain** and save. GitHub checks the DNS, which can take minutes to hours.
- [ ] Tick **Enforce HTTPS** once it becomes available. The certificate can take up to about an hour.
- [ ] If you use a workflow-based deploy, the custom domain is set in Settings. You don't need a `CNAME` file.

## 3. Repo variables (build-time)

Repo → **Settings → Secrets and variables → Actions → Variables** (not secrets):

- [ ] `NUXT_PUBLIC_SITE_URL` = `https://antsytek.com`
- [ ] `NUXT_APP_BASE_URL` = `/`
- [ ] Leave the other `NUXT_PUBLIC_*` variables as they are.

These are read at build time, so the site must be rebuilt (step 11) for them to apply.

## 4. Supabase: URL configuration

Supabase dashboard → **Authentication → URL Configuration**:

- [ ] **Site URL** = `https://antsytek.com`
- [ ] Under **Redirect URLs**, add `https://antsytek.com/**`
- [ ] Keep the old `https://madmonkey.github.io/antsy/**` entry until the move is verified, then delete it.
- [ ] Keep `http://localhost:3000/**` if you run the site locally.

Confirmation emails and OAuth redirects use the Site URL.

## 5. Google sign-in

[Google Cloud Console](https://console.cloud.google.com) → your project:

- [ ] **APIs & Services → OAuth consent screen (Branding)**:
  - App name, for example "Antsy Tek", and a logo.
  - Home page `https://antsytek.com`, plus privacy and terms links (`https://antsytek.com/privacy`).
  - Add `antsytek.com` under **Authorized domains**.
  - Submit for verification if Google offers it. The scopes needed are only email and profile.
- [ ] **Credentials → your OAuth client → Authorised JavaScript origins**: add `https://antsytek.com`
- [ ] **Authorised redirect URIs**: keep the Supabase callback `https://crircoulonhatlhahgol.supabase.co/auth/v1/callback`. If you do step 9, add the custom-domain callback too.
- [ ] Publish the consent screen to **Production** so it isn't limited to test users.

## 6. GitHub sign-in

GitHub → **Settings → Developer settings → OAuth Apps → your app**:

- [ ] **Homepage URL** = `https://antsytek.com`
- [ ] **Application name** = what readers should see (for example "Antsy Tek").
- [ ] **Authorization callback URL** stays the Supabase callback. Change it only if you do step 9.

## 7. Cloudflare Turnstile (captcha)

[Cloudflare dashboard](https://dash.cloudflare.com) → **Turnstile → your widget**:

- [ ] Add `antsytek.com` (and `www.antsytek.com` if used) under **Hostnames**. Keep `madmonkey.github.io` until the move is verified.
- [ ] The site key is public and unchanged. The secret key stays in Supabase (**Authentication → Attack Protection**), so no change there.

## 8. Brevo (email)

[Brevo](https://app.brevo.com) → **Senders, Domains & Dedicated IPs → Domains**:

- [ ] Add `antsytek.com` and authenticate it. Brevo will give you DNS records to add at your registrar:
  - DKIM, as a TXT or CNAME record.
  - Brevo code, as a TXT record.
  - DMARC, as a TXT record on `_dmarc`. Start with `v=DMARC1; p=none; rua=mailto:you@antsytek.com`.
- [ ] If the domain already has an SPF record, **merge** Brevo into it, since you can only have one SPF record. For example `v=spf1 include:spf.brevo.com ~all`.
- [ ] Wait for Brevo to show the domain as authenticated.
- [ ] Confirm the sender `no-reply@antsytek.com` is verified. It already is, but re-check it after the domain change.
- [ ] Keep SMTP-key IP filtering **off**, or add Supabase's addresses.
- [ ] In Supabase (**Authentication → SMTP Settings**) nothing changes: host `smtp-relay.brevo.com`, port 587, same login and key.

## 9. Supabase custom domain (optional, paid)

This replaces `crircoulonhatlhahgol.supabase.co` on the Google and GitHub prompts. It is a paid add-on, roughly $10/month, so check the current price.

- [ ] Supabase → **Project Settings → Add-ons → Custom domain** → enable it.
- [ ] Choose a subdomain, for example `auth.antsytek.com`.
- [ ] Add the `CNAME` (`auth` → `crircoulonhatlhahgol.supabase.co`) and the verification `TXT` records at your registrar. Then verify and activate in Supabase.
- [ ] Add the new callback `https://auth.antsytek.com/auth/v1/callback` to the Google **Authorised redirect URIs** and the GitHub OAuth app. Keep the old URL during the switch.
- [ ] Set the repo variable `NUXT_PUBLIC_SUPABASE_URL` = `https://auth.antsytek.com`. **(code)** The assistant should check the storage URLs in `content_items` first. Stored cover images use the old host, so existing links may need an update.
- [ ] Rebuild (step 11).

Skip this step if the Google branding in step 5 is enough.

## 10. Rebuild trigger

The database trigger that rebuilds the site on content changes sends `repository_dispatch` to GitHub using a Vault secret.

- [ ] Nothing changes for a domain move.
- [ ] If the token expires (check its expiry date in GitHub → **Settings → Developer settings → Fine-grained tokens**), create a new one for `madmonkey/antsy` with **Contents: read/write**, then update the Vault secret `github_dispatch_token` in Supabase (**Project Settings → Vault**).

## 11. Rebuild and verify

- [ ] Repo → **Actions → Deploy to GitHub Pages → Run workflow**, or push any commit. The deploy takes about 3 minutes.
- [ ] Visit `https://antsytek.com` and check that CSS, images and links load (no `/antsy/` prefix).
- [ ] Open an article and view the page source. `og:url` and `og:image` should start with `https://antsytek.com`.
- [ ] Sign in as admin at `/admin/login`.
- [ ] Sign in as a reader with Google, with GitHub and with email, and check the email arrives and its link opens `antsytek.com`.
- [ ] Post a comment and approve it in admin.
- [ ] Edit an article and save, and confirm a rebuild starts in Actions.
- [ ] Paste an article link into Slack, Bluesky or Facebook. Their debuggers can force a refresh of cached previews.
- [ ] Open `https://www.antsytek.com` and `http://antsytek.com` and check both redirect to `https://antsytek.com`.

## 12. Clean up

- [ ] Remove the `madmonkey.github.io` entries from the Supabase redirect URLs, the Google origins and the Turnstile hostnames.
- [ ] Update the Umami analytics site to the new domain (**Settings → Websites**). Update `NUXT_PUBLIC_ANALYTICS_*` only if the website ID or host changed.
- [ ] Add `antsytek.com` to Google Search Console and submit the sitemap if you want search indexing.
- [ ] Tell the assistant when you're done, and it will update the stale spec and quickstart docs.

---

## Quick reference

| Service | Where | What changes |
|---|---|---|
| Registrar | DNS panel | A, AAAA, www CNAME, Brevo records, optional `auth` CNAME |
| GitHub Pages | Repo Settings → Pages | Custom domain, enforce HTTPS |
| GitHub Actions | Repo variables | `NUXT_PUBLIC_SITE_URL`, `NUXT_APP_BASE_URL` |
| Supabase | Auth → URL Configuration | Site URL and redirect URLs |
| Google Cloud | OAuth consent and client | Branding, authorised domain and origin |
| GitHub OAuth app | Developer settings | Homepage URL and name |
| Cloudflare Turnstile | Widget hostnames | Add the new domain |
| Brevo | Domains | Authenticate the domain, DKIM, SPF, DMARC |
| Umami | Website settings | Domain |
