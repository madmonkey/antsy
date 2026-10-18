# Contract: Analytics

## Plugin behaviour (`analytics.client.ts`)

1. Do nothing when: running in dev, provider empty, id empty, or `navigator.doNotTrack === '1'`.
2. After the app is ready, append one `async` script:
   - GoatCounter: `https://<id>.goatcounter.com/count.js` with `data-goatcounter="https://<id>.goatcounter.com/count"` and `data-goatcounter-settings='{"no_onload":true}'`.
   - Umami: `<host>/script.js` (default Umami Cloud) with `data-website-id="<id>"` and `data-auto-track="false"`.
3. Count the current page once the script has loaded, then once per `router.afterEach`.
4. Never count a path that starts with `/admin`. A repeat of the same path is not counted twice.
5. Counted path = the route path without query or hash and without the site base path. For search pages the query string is dropped, so searched text never reaches the provider.
6. Script load errors and blocked calls are ignored. Nothing is logged for readers.

The decision logic lives in `app/utils/analytics.ts` (`shouldLoad`, `countPath`) so it can be unit tested without a browser.

## Cookies and storage

The site and the plugin MUST NOT write cookies, `localStorage` or `sessionStorage` for analytics. (The theme choice and sign-in throttle already use `localStorage` and are not analytics.)

## Admin dashboard (`TrafficCard`)

- Always: a link to `NUXT_PUBLIC_ANALYTICS_DASHBOARD` (`target="_blank" rel="noopener noreferrer"`).
- If `admin_settings.analytics_dashboard_url` exists and starts with `https://`: an iframe of it, titled for screen readers, with a "can't see it? open in a new tab" link.
- Administrators can edit that URL in the card and save it. An invalid URL is rejected with a visible message.
- Provider down, framing refused, or table missing: the card shows the plain link and an explanation. The rest of the dashboard is unaffected.
- Only rendered inside the admin pages, which are gated by the existing admin middleware and RLS.

## Privacy page and footer

- `SiteFooter` appears on public pages with a link to `/privacy`.
- `/privacy` states: provider name, what is counted, no cookies, no personal identifiers, no consent needed, and how to contact the owner. Provider name comes from configuration.
