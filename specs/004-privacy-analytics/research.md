# Research: Privacy-Friendly Analytics

## D1. Provider: GoatCounter or Umami, by configuration

- **Decision**: Support both through `NUXT_PUBLIC_ANALYTICS_PROVIDER` (`goatcounter` | `umami` | empty) plus `NUXT_PUBLIC_ANALYTICS_ID` (GoatCounter site code, or Umami website id) and, for Umami, `NUXT_PUBLIC_ANALYTICS_HOST` (defaults to Umami Cloud's script host). Empty provider means off. Working default: GoatCounter, pending the owner's licence and free-tier checks.
- **Rationale**: Both are cookieless and open source. The integration differs by about ten lines, so the choice need not block the build.
- **Alternatives**: Plausible, Fathom, Simple Analytics, Matomo (paid or self-host); Cloudflare Web Analytics (free but cannot be embedded); a self-built Supabase counter (rejected: spam inserts, bot filtering and reports all become our job).
- **Owner-verified items**: GoatCounter's non-commercial licence fits the site; Umami Cloud's monthly event cap suits the traffic; each provider's dashboard share link can be embedded.

## D2. Count route changes by hand

- **Decision**: Disable each provider's automatic tracking (`no_onload` for GoatCounter, `data-auto-track="false"` for Umami) and call the provider once from a `router.afterEach` hook after the script is ready, plus once for the first page.
- **Rationale**: One uniform path for both providers, exactly one count per view, and the only reliable way to skip `/admin` routes (spec FR-003, FR-004). Prerendered pages hydrate without a router event for the first page, so the first view is counted explicitly.

## D3. When not to send

- Not in development or preview (`import.meta.dev`), when the provider or id is empty, on any path starting `/admin`, and when `navigator.doNotTrack === '1'`.
- Honouring Do Not Track is cheap and consistent with the privacy goal. `shortcut:` counts are therefore slightly low.

## D4. Load after hydration

- **Decision**: Inject the script from a client plugin on `app:mounted` via `onNuxtReady`, with `async`.
- **Rationale**: No effect on first paint, and no analytics tag in the static HTML. A blocker or network failure only means that view is not counted (FR-005).

## D5. Admin dashboard: link first, embed when possible

- **Decision**: `TrafficCard` always shows a link to the provider's own dashboard (login-protected, nothing secret). If an administrator pastes a share URL into settings, the card also shows it in an iframe with a fallback link.
- **Rationale**: Share URLs are bearer secrets. Anything in `runtimeConfig.public` or the repo ships to every visitor, so the URL lives in an administrator-only table. Providers may refuse framing, so the link stays as the fallback and the embed is a bonus.
- **Alternatives**: Build reports from the provider's API (rejected: tokens cannot live in a static site, and it would need a server).

## D6. Privacy page

- A static page naming the provider, listing what is counted (page address, referrer, browser and screen type, country level location, no personal identifiers) and stating no cookies. Provider facts come from configuration so the page stays true if the provider changes.
- Wording is the owner's to review (spec assumption).

## D7. Deliberately skipped

Events and goals, per-article stats on pages, a custom report, consent banner, server-side tracking, proxying the script through our own domain (an upgrade if blockers cut counts too much).
