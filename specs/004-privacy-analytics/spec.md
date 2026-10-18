# Feature Specification: Privacy-Friendly Analytics

**Feature Branch**: `004-privacy-analytics`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "Add analytics that is fully compliant: no cookies and no tracking of individuals. Cost is the deciding factor and it should be free. The administrator wants something on the admin dashboard to review. Two candidate providers are being evaluated, both cookieless: GoatCounter (free for non-commercial use) and Umami (free hosted tier or self-hosted). The owner will choose one during planning, and the choice must be changeable by configuration."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Count visits without tracking readers (Priority: P1)

Readers browse the site as usual. Page views are counted in aggregate without cookies, without identifying anyone, and without following people across sites or visits. Readers see no consent banner, because none is needed.

**Why this priority**: Without collection there is nothing to review, and the privacy promise is the main constraint.

**Independent Test**: Browse several pages in a clean browser, then verify that no cookie or persistent browser storage is set, no consent banner appears, and the visits show in the analytics.

**Acceptance Scenarios**:

1. **Given** a first-time reader, **When** they open any page, **Then** no cookie or persistent browser storage is created for analytics and no banner or prompt appears.
2. **Given** a reader navigating between pages without reloading, **When** they move through the site, **Then** each page view is counted once.
3. **Given** a reader with "Do Not Track" or a blocker enabled, **When** they browse, **Then** the site works fully and nothing breaks.
4. **Given** the admin area, **When** an administrator uses it, **Then** their own page views are not counted.
5. **Given** the analytics service is unreachable, **When** a reader browses, **Then** pages load and behave normally with no visible error.
6. **Given** the site is viewed during local development or preview, **When** pages are opened, **Then** no data is sent.

---

### User Story 2 - Review traffic from the admin dashboard (Priority: P1)

An administrator opens the admin dashboard and sees traffic at a glance: views over time, the most-read articles, top referrers and, if available, countries and device types, with no personal data.

**Why this priority**: Review in the admin area is the stated reason for collecting data.

**Independent Test**: Sign in as an administrator, open the dashboard, and confirm recent traffic is visible without leaving the admin area or logging in again elsewhere.

**Acceptance Scenarios**:

1. **Given** an administrator on the dashboard, **When** it loads, **Then** a traffic summary for a selectable period is shown or linked.
2. **Given** a signed-in non-administrator or a signed-out visitor, **When** they try to reach the dashboard traffic view, **Then** access is denied.
3. **Given** the analytics provider is down or not set up, **When** the administrator opens the dashboard, **Then** the rest of the dashboard works and the traffic area explains what is wrong.
4. **Given** the provider's own dashboard, **When** the administrator wants more detail, **Then** a link opens it.

---

### User Story 3 - Tell readers what is and isn't collected (Priority: P2)

A short privacy note, linked from the footer, states what the site measures, that no cookies or personal data are used, and who provides the analytics.

**Why this priority**: Being transparent supports the compliance goal, but the feature works without it.

**Independent Test**: Follow the footer link and confirm the note is accurate against what is actually collected.

**Acceptance Scenarios**:

1. **Given** any page, **When** a reader looks at the footer, **Then** a privacy link is present.
2. **Given** the privacy page, **When** it is read, **Then** it names the provider, lists what is counted and states that no cookies or personal identifiers are used.

---

### Edge Cases

- A reader's browser blocks the analytics script: nothing is counted and nothing is shown to the reader.
- Page transitions or prerendered pages could double-count or miss views: each view is counted once.
- Bots and crawlers inflate counts: provider-side bot filtering is relied on, and counts are understood to be approximate.
- The administrator changes the site address (for example moving to a custom domain): the analytics site setting is updated so counts continue.
- The provider changes its terms or no longer qualifies the site as non-commercial: the provider can be swapped by changing configuration, not articles.
- Comments sign-in is added later: signed-in readers are still not tracked individually by analytics.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Analytics MUST NOT set cookies or use persistent browser storage, and MUST NOT collect personal data or identifiers that follow a person across visits or sites.
- **FR-002**: The site MUST NOT show a consent banner for analytics.
- **FR-003**: Page views MUST be counted for public pages, once per view, including navigation within the site.
- **FR-004**: Administrator pages and non-production environments MUST NOT send analytics.
- **FR-005**: Analytics MUST load without blocking page rendering, and a failure or blocker MUST NOT affect the site.
- **FR-006**: The provider and its site identifier MUST be configurable without code changes to articles, and the supported providers are GoatCounter and Umami, with the choice recorded in configuration. Turning analytics off MUST be possible by clearing the configuration.
- **FR-007**: The admin dashboard MUST give administrators access to traffic review, showing or linking to views over time, top pages, and referrers.
- **FR-008**: Traffic review MUST be available only to administrators. Any access token or share link MUST NOT be exposed to the public.
- **FR-009**: A failure or missing configuration of the traffic view MUST NOT affect the rest of the dashboard.
- **FR-010**: The site MUST have a privacy page, linked from the footer, that accurately describes what is and is not collected.
- **FR-011**: The solution MUST be free to operate at the site's expected traffic.

### Key Entities

- **Analytics setting**: The configured provider and site identifier, empty when analytics is off.
- **Traffic summary**: Aggregate figures, such as views, top pages and referrers, with no individual-level data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visit sets 0 cookies and writes nothing to persistent browser storage for analytics.
- **SC-002**: No consent banner or analytics prompt appears for any reader.
- **SC-003**: An administrator can see yesterday's traffic from the admin dashboard within 2 clicks.
- **SC-004**: With analytics blocked or the provider down, pages load as fast and as correctly as with it working.
- **SC-005**: Recurring cost of analytics is zero at the site's expected traffic.
- **SC-006**: The privacy page matches the data actually collected in 100% of items listed.

## Assumptions

- The owner is comparing GoatCounter and Umami. Selection criteria: free at expected traffic, licence allows this site (GoatCounter is non-commercial only), the dashboard can be embedded or linked from the admin area, and no cookies. Until the owner decides, planning proceeds with GoatCounter as the working default.
- Both providers use a small script and a site identifier, so switching between them changes configuration only, not articles or pages.
- Umami's free hosted tier has a monthly event limit. If traffic exceeds it, counting pauses or the owner moves to self-hosting or another provider.
- Counts are approximate: blockers hide some readers and some bots slip through.
- The admin dashboard links to or embeds the provider's own dashboard rather than reimplementing reports. Provider limits on embedding may mean a link is used.
- No per-reader, per-article or comment-author analytics, and no event or conversion tracking in this version.
- No legal review is included. The owner checks the privacy page wording for their jurisdiction.
- Local data is not stored by the site. All counts live with the provider.
