# Quickstart: Privacy-Friendly Analytics

## Prerequisites

- An account with the chosen provider (GoatCounter site or Umami website) and its id.
- Repository variables `NUXT_PUBLIC_ANALYTICS_PROVIDER`, `NUXT_PUBLIC_ANALYTICS_ID`, optionally `NUXT_PUBLIC_ANALYTICS_HOST` and `NUXT_PUBLIC_ANALYTICS_DASHBOARD`.
- The `admin_settings` migration applied in the Supabase SQL editor (only needed for the embed).

## Checks (live)

1. Open the site in a private window with DevTools open (Application tab). Expect no cookies and nothing new in local or session storage from analytics, and no banner.
2. Click through three pages without reloading. Expect three views in the provider dashboard (allow a minute).
3. Open `/search?q=secret`. Expect the view counted as `/search` with no `q` value in the provider.
4. Browse `/admin`. Expect nothing counted.
5. Block the analytics host in DevTools and reload. Expect the site to work and no errors shown.
6. Turn on "Do Not Track". Expect nothing counted.
7. As an administrator open the dashboard. Expect the traffic card with a working link. Paste a share URL and save. Expect an embed, or the fallback message if the provider refuses framing.
8. As a signed-out visitor view the page source and the built JavaScript. Expect the share URL to be absent.
9. Follow the footer privacy link. Expect the page to match the list of what is collected.
10. Empty `NUXT_PUBLIC_ANALYTICS_PROVIDER`, rebuild. Expect no analytics script at all.

## Rollback

Clear the provider variable and rebuild. Drop `admin_settings` if no longer wanted.

## Automated

```text
npx nuxt prepare
npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json
npm run lint
npx vitest run tests/unit tests/component
```
