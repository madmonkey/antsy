# Feature Specification: Markdown CMS Website

**Feature Branch**: `001-markdown-cms-site`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "I am looking to build a cms website, similar to the principals used in the astro project. (Latest Nuxt, markdown, content) I would like to leverage the same resources available for that site with this one (supabase db), hosted in it's own static github pages. I do currently however have a domain name that could be mapped." Reference project: https://github.com/madmonkey/astro

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitors browse and read published content (Priority: P1)

A visitor opens the site without signing in, browses topics, opens an article, and reads well-formatted content on desktop or mobile.

**Why this priority**: Public reading is the purpose of the site and works without any authoring features.

**Independent Test**: With a few active topics and articles present, a first-time visitor reaches a specific article from the home page in three clicks or fewer and reads it comfortably on a phone.

**Acceptance Scenarios**:

1. **Given** active topics with active articles, **When** a visitor opens the home page, **Then** active topics are listed and each leads to its articles.
2. **Given** an article body written in Markdown, **When** it is displayed, **Then** headings, lists, quotes, code blocks, tables, footnotes, links, and images render with consistent, responsive styling.
3. **Given** a topic or article is inactive, **When** a visitor requests it by address, **Then** it is not shown and the visitor sees the not-found page, with no trace of its content in any listing.
4. **Given** a visitor requests an address that does not exist, **When** the page loads, **Then** a friendly not-found page with a way back to the home page is shown.
5. **Given** more than three active articles exist, **When** a visitor opens the landing page, **Then** a "Recent articles" preview shows the three most recently published active articles, newest first, each with title, topic, date, and a short excerpt linking to the full article.
6. **Given** the recent-articles preview, **When** a visitor selects a topic filter, **Then** the preview shows only the three most recent active articles in that topic, and clearing the filter restores the unfiltered preview. The filter offers only topics designated as previewable.
7. **Given** fewer than three matching active articles, **When** the preview is shown, **Then** only those articles appear; **Given** none match, **Then** a friendly empty message is shown.
8. **Given** an article or its topic is inactive, **When** the preview is shown, **Then** that article never appears in it, and the topic filter only offers active topics.
9. **Given** a topic is not designated as previewable (e.g., "Politics" while "Tech" and "Projects" are), **When** the landing page is shown, **Then** that topic is absent from the filter and none of its articles appear in the preview, though they remain readable on the topic's own pages.

---

### User Story 2 - Administrator signs in securely (Priority: P1)

An approved administrator signs in to a private area. People who are not on the approved list cannot enter or change anything, even if they hold an account.

**Why this priority**: Every authoring capability depends on trustworthy access control.

**Independent Test**: An approved administrator reaches the management area; a signed-in non-approved user and an anonymous visitor are both refused and can change nothing.

**Acceptance Scenarios**:

1. **Given** an approved administrator, **When** they sign in with valid credentials, **Then** they reach the management area.
2. **Given** a signed-in user who is not approved, **When** they try to open the management area or change content, **Then** access is denied.
3. **Given** three failed sign-in attempts in a browser, **When** a fourth is tried within 15 minutes, **Then** the form blocks further attempts and says when they may retry.
4. **Given** an anonymous visitor, **When** they request any management address, **Then** they are directed to sign in.

---

### User Story 3 - Administrator creates and manages topics and articles (Priority: P1)

A signed-in administrator creates, edits, activates/deactivates, and deletes topics, and writes articles in Markdown with formatting helpers and a live preview that matches what visitors will see.

**Why this priority**: This is the CMS itself and replaces editing files or databases by hand.

**Independent Test**: An administrator creates a topic, adds an article with a table and an image, previews it, activates both, and sees it on the public site; deactivating hides it again.

**Acceptance Scenarios**:

1. **Given** the management area, **When** the administrator saves a new topic with a name and description, **Then** it appears in their topic list.
2. **Given** an article being edited, **When** the administrator types Markdown, **Then** a preview shows the safe rendered result as they type.
3. **Given** an article with raw HTML or an unsafe image address, **When** it is previewed or published, **Then** the HTML is discarded and the unsafe image is not rendered.
4. **Given** an article being edited, **When** the administrator pastes, drops, or selects an image file, **Then** the image is embedded directly within the article itself, appears in the live preview, and needs no separate file, folder, or link to manage.
5. **Given** an article with an embedded image, **When** a visitor reads it, **Then** the image displays correctly with no extra setup, and it travels with the article if the article is copied or exported.
6. **Given** a file that is not an allowed image type, or an image over the size limit, **When** the administrator tries to embed it, **Then** it is rejected with a message stating the allowed types and limits, and the article is unchanged.
7. **Given** an embedded image, **When** the administrator edits the article, **Then** they can add alternative text, replace the image, or remove it.
8. **Given** a topic with articles, **When** the administrator deletes it, **Then** they are warned that all its articles will be permanently deleted and must confirm.
9. **Given** an active article, **When** the administrator deactivates it, **Then** it disappears from the public site on next load.
10. **Given** a save fails (network or validation), **When** the administrator submits, **Then** a clear message appears and their typed work is preserved.
11. **Given** a topic being created or edited, **When** the administrator toggles "previewable", **Then** the landing-page preview and filter include or exclude that topic's articles accordingly on next load.
12. **Given** a new article or topic, **When** the administrator saves it, **Then** a web address is generated from its title or name, and they may adjust it before publishing.
13. **Given** a published item, **When** the administrator tries to change its web address, **Then** the change is refused with an explanation that published addresses are permanent.
14. **Given** a web address already in use, **When** the administrator saves, **Then** a clear message appears and a free alternative (for example with a numeric suffix) is suggested.

---

### User Story 4 - Site is served from the owner's own domain (Priority: P2)

The owner serves the site from their existing domain over a secure connection, with sign-in working correctly on that domain.

**Why this priority**: Required for a professional launch but not for building and validating the site.

**Independent Test**: Open the custom domain; the public site loads securely and an administrator can sign in and out without errors.

**Acceptance Scenarios**:

1. **Given** the domain is mapped, **When** a visitor opens it, **Then** the site loads securely with no certificate warning.
2. **Given** the site is on the custom domain, **When** an administrator signs in, **Then** they are returned to the management area on that domain.
3. **Given** the owner follows the documentation, **When** they map the domain, **Then** they complete setup using only hosting and DNS provider settings.

---

### User Story 5 - Astro can adopt this site's database and features later (Priority: P2)

This site runs on its own, isolated database project. Its database structure is a strict superset of the Astro site's, so the Astro site and database can later adopt the new features (previewable topics, publish dates, excerpts, slug locking, embedded images) by applying a small additive migration, with no data move and no change to Astro's existing behavior.

**Why this priority**: The owner wants to build safely in isolation but not lose the option of converging later.

**Independent Test**: On a copy of Astro's schema containing sample data, apply the documented adoption migrations: Astro's existing data and tests are unaffected, the new columns and rules exist, and the documented rollback restores the original state.

**Acceptance Scenarios**:

1. **Given** this site's isolated database, **When** its structure is compared with Astro's, **Then** every Astro table, column, constraint and access rule exists unchanged and everything new is additive.
2. **Given** a copy of Astro's database, **When** the adoption migrations are applied, **Then** existing rows and Astro's existing tests are unaffected.
3. **Given** the adoption migrations were applied, **When** the documented rollback is run, **Then** the copy matches its pre-adoption state.
4. **Given** the published site files are inspected, **When** credentials are searched for, **Then** only the public database address and public key are present.

---

---

### User Story 6 - Header toolbar with day/night mode and social links (Priority: P2)

Every public page has a header toolbar where visitors switch between day (light) and night (dark) appearance and follow the owner's other accounts (for example GitHub and Bluesky) through icon links.

**Why this priority**: Improves comfort and connects the site to the owner's wider presence, but the site works without it.

**Independent Test**: On any page, toggle day/night and see the whole site change; reload and see the choice remembered; click a social icon and reach the correct external profile.

**Acceptance Scenarios**:

1. **Given** a visitor on any public page, **When** they use the day/night control, **Then** the entire site, including article content, switches appearance immediately and text remains readable.
2. **Given** a visitor has chosen day or night, **When** they return or reload, **Then** their choice is remembered on that browser.
3. **Given** a visitor who has not chosen, **When** they first arrive, **Then** the site follows their device's light/dark preference.
4. **Given** the toolbar shows social icons, **When** a visitor selects one, **Then** the matching external profile opens in a new tab without exposing the site to the destination.
5. **Given** a visitor using a keyboard or screen reader, **When** they reach the toolbar, **Then** every control is focusable and has a descriptive text label (for example "Switch to night mode", "GitHub").
6. **Given** a narrow mobile screen, **When** the toolbar is shown, **Then** all controls remain reachable and usable.
7. **Given** no social accounts are configured, **When** the toolbar is shown, **Then** it shows only the day/night control with no empty space or broken icons.

---

### Edge Cases

- The database is unreachable: visitors see a clear, non-technical error with a retry option; the site shell still loads.
- An article has no active topic: it is not publicly visible.
- Article body is very large or contains many images: preview and public page remain usable; embedded images count toward the per-article limit.
- An image file is renamed or disguised (for example a script saved with an image extension): it is rejected based on its actual content, not its name.
- Two administrators edit the same article at once: out of scope; the last save wins (owner confirmed this does not happen in practice).
- Direct links to articles (shared or bookmarked) work on a fresh page load, not only via in-site navigation.
- Domain not yet mapped or DNS still propagating: the site remains reachable at the default hosting address.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST let anonymous visitors browse active topics and read active articles without an account.
- **FR-001a**: The landing page MUST show a recent-articles preview of no more than three active articles, newest first, drawn only from active topics designated as previewable, which visitors can filter by a single previewable topic.
- **FR-001b**: Administrators MUST be able to designate each topic as previewable or not; the designation affects only the landing-page preview and filter, not the topic's own pages or its articles' readability.
- **FR-002**: System MUST enforce visibility of inactive topics and articles at the data-access level, not only in the user interface.
- **FR-003**: System MUST render article bodies from Markdown with consistent responsive styling for headings, lists, quotes, code blocks, tables, and footnotes.
- **FR-004**: System MUST discard authored raw HTML and sanitize rendered output; images MUST be limited to safe web addresses or administrator-embedded images of allowed types. Any other image source MUST NOT render.
- **FR-004a**: Administrators MUST be able to embed images directly within an article's content (by paste, drop, or file selection), with no separate file storage or link management required.
- **FR-004b**: Embedded images MUST be limited to common safe raster image types (PNG, JPEG, GIF, WebP; vector or scriptable formats are not allowed), with a per-image size limit (default 1 MB) and a per-article total limit (default 5 MB), both measured on the original image files before encoding, enforced with clear messages. The stored article text MUST be capped slightly above the encoded size of 5 MB so text still fits; the final figures are confirmed against the hosted database's request limits by the size spike.
- **FR-004c**: Embedded images MUST support alternative text, and MUST remain subject to the same sanitization as all other content.
- **FR-005**: System MUST provide administrator sign-in restricted to an approved list; access control MUST be enforced at the data-access level.
- **FR-006**: System MUST limit repeated failed sign-ins in a browser (three failures, 15-minute block) and document the need for server-side abuse protection.
- **FR-007**: System MUST let administrators create, edit, activate/deactivate, and delete topics and articles.
- **FR-008**: System MUST provide a Markdown editor with formatting helpers and a sanitized live preview matching public rendering.
- **FR-009**: System MUST require explicit confirmation before deleting a topic and state that its articles are deleted with it.
- **FR-010**: System MUST be delivered as a static site with no application server of its own, hosted separately from the existing Astro site.
- **FR-011**: System MUST support a custom domain over a secure connection, with sign-in redirects working on that domain.
- **FR-012**: System MUST use its own isolated hosted database project with its own approved-administrator list; no data, accounts or credentials are shared with the Astro site's project.
- **FR-013**: System MUST expose only public connection values to visitors; privileged credentials MUST NOT appear in the repository, deployment settings, or delivered files.
- **FR-014**: System MUST show friendly not-found, error, and loading states, and preserve unsaved administrator input on failed saves.
- **FR-015**: System MUST be usable on current desktop and mobile browsers and meet baseline accessibility expectations (keyboard navigation, readable contrast, semantic headings, image alternative text where provided).
- **FR-016**: System MUST include automated tests covering visibility rules, administrator access control, and Markdown sanitization.
- **FR-017**: System MUST document setup, local development, database preparation, deployment, and custom-domain mapping.
- **FR-018**: Every public page MUST include a header toolbar with a day/night appearance control that applies to the whole site, follows the device preference on first visit, and remembers the visitor's choice.
- **FR-019**: The header toolbar MUST show icon links to the owner's configured social accounts (such as GitHub and Bluesky), opening in a new tab safely; accounts are configurable without code changes to page content, and the set may be empty.
- **FR-020**: All toolbar controls MUST be keyboard accessible with descriptive text labels, and both appearances MUST meet readable-contrast expectations.
- **FR-021**: Every public page MUST declare its content language (US-English for v1) so a future translation feature can build on it.
- **FR-022**: Embedded-image behavior (allowed types, size limits, sanitization rules, editor interaction) MUST be documented as a reusable adoption guide, so the Astro project can later adopt the same capability. Delivering this feature MUST NOT change or break the Astro site.
- **FR-023**: Each site build MUST read the current active topics and articles first, then pre-render the public pages (home, active topics, active articles) as real pages with titles and descriptions, and MUST fail the build rather than publish an empty or partial snapshot if the data cannot be read.
- **FR-024**: The site MUST be rebuilt automatically on a schedule and on demand, and visitors MUST see current content after the page loads regardless of snapshot age.
- **FR-025**: Every topic and article MUST have a unique, human-readable web address derived automatically from its name or title when first saved. The administrator MAY edit it until the item has been published (first activated); after that it MUST NOT change, so shared and bookmarked links keep working. A duplicate address MUST be rejected with a clear message offering an alternative.

- **FR-026**: This site's database structure MUST be a strict, additive superset of the Astro site's (same tables, columns, constraints and access rules, plus new items only). The new items MUST be delivered as separate adoption migrations that are additive and re-runnable, with any change that alters existing Astro behavior (for example locking published addresses, or capping article size) kept in its own optional migration. A documented adoption guide and rollback MUST let the Astro database adopt them without moving data or changing existing rows' meaning.

### Key Entities

- **Storage names**: Topics and articles are stored as `topics` and `content_items` (Astro's names).
- **Topic**: A named grouping of articles; has name, description, active/inactive state, and a previewable designation. Deleting it deletes its articles.
- **Article**: Markdown content belonging to one topic; has title, body, and active/inactive state.
- **Administrator**: An account on this site's own approved list and may manage topics and articles.
- **Site Configuration**: Public connection settings, site address/base path, custom domain, and the list of social accounts (platform, label, profile address).
- **Appearance Preference**: A visitor's day/night choice, kept on their own browser only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can reach any active article from the home page in three clicks or fewer.
- **SC-001a**: The landing-page preview never shows more than 3 articles, 0 inactive items, and 0 articles from non-previewable topics; applying or clearing a topic filter updates it in under 1 second.
- **SC-002**: An administrator can create a topic and publish a first article in under 5 minutes.
- **SC-003**: 100% of inactive topics and articles are inaccessible to anonymous visitors and non-approved users in verification tests.
- **SC-004**: 100% of tested malicious Markdown samples (raw HTML, scripts, unsafe image addresses, disguised or vector image files) render without executing or showing unsafe content.
- **SC-004a**: An administrator can add an image to an article in under 30 seconds with no step outside the editor, and 100% of embedded images display for visitors without additional setup.
- **SC-012**: The adoption guide lets a maintainer enable embedded images and the new features there without reverse-engineering this site.
- **SC-013**: 100% of active articles present at build time load as real pages (not an error status) on a direct visit, and a new article is indexable no later than one scheduled rebuild after activation.
- **SC-005**: 95% of public pages show content within 2 seconds on a typical mobile connection.
- **SC-006**: 100% of public pages are reachable securely at the custom domain.
- **SC-007**: 0 privileged credentials are present in the repository or published files.
- **SC-014**: After the adoption migrations are applied to a copy of Astro's schema with sample data, 100% of Astro's existing rows are unchanged and its existing tests still pass, and the rollback leaves the copy identical to its pre-adoption state.
- **SC-008**: This site's database project holds 0 rows, accounts or credentials belonging to the Astro project.
- **SC-009**: The owner completes custom domain setup by following the documentation in under 1 hour of active effort, excluding DNS propagation.
- **SC-010**: 100% of public pages are usable and readable in both day and night appearance, and a visitor's choice persists across 100% of reloads on the same browser.
- **SC-011**: 100% of toolbar controls are operable by keyboard alone and have descriptive labels.

## Assumptions

- The reference is https://github.com/madmonkey/astro: content (topics, articles) is stored in the hosted database and edited through an in-browser administrator area, not committed as files. This site follows the same principles.
- This site is a new, separate static site with its own repository, hosting and its own new database project; the Astro site and its database are unchanged. (Owner decision, replacing the earlier plan to share the Astro database project.)
- The database structure keeps Astro's table and column names and rules as its baseline and adds the new features on top, so Astro can later adopt them with an additive migration. Administrators for this site are set up separately in its own project. Because the two projects are separate, topic names and addresses may repeat across sites.
- The site has no fixed subject matter; it is defined entirely by the topics administrators create. (Confirmed by the owner.)
- "Recent" means most recently published or created active articles; the exact ordering date follows the Astro reference unless planning finds a reason to differ.
- Topics are not previewable by default until an administrator designates them; this applies to the unfiltered preview too, not only the filter.
- Social account links are maintained by the owner as site configuration, not through the administrator editor, in v1; GitHub and Bluesky are the initial examples and others can be added the same way.
- "Day/night filter" means a visitor-facing light/dark appearance switch, not a content filter.
- The administrator area also honors the day/night choice.
- Visitor registration, comments, and search are out of scope for v1.
- Embedded images live inside the article's own content, so limits are needed to keep pages fast; assumed defaults are 1 MB per image and 5 MB total per article, adjustable during planning. Images hosted elsewhere via web address remain supported.
- Embedded images are not shared or reused across articles in v1; each article carries its own copy.
- Once embedded images are delivered here, the Astro project (https://github.com/madmonkey/astro) should be informed and able to adopt the same capability. Changing Astro is outside this feature's scope and is tracked as a follow-up; this feature provides the adoption guide (FR-022), the adoption migrations (FR-026) and a ready-to-file issue for Astro. Because Astro currently excludes embedded images, the adoption migrations must stay compatible with Astro's existing behavior until it adopts them.
- Multi-language support with automatic translation is a planned future feature and is out of scope for v1. Content and the interface are US-English only. Pages must declare their language, and user-facing text should not be hard-wired in ways that would make later translation impractical, but no translation behavior is delivered now.
- Public pages are pre-rendered from the database during each site build and then refresh themselves from the database in the browser. Search engines and link previews see the build-time snapshot; changes are visible to visitors immediately but to crawlers only after the next build (daily by default, or on demand).
- A deactivated article remains in the pre-rendered snapshot until the next build; the owner triggers a rebuild after removing sensitive content.
- The owner controls the domain's DNS and has administrative access to the hosted database project.
- Traffic is modest; no special scaling needs.
- Owner-specified technology (latest Nuxt, Markdown, Supabase, GitHub Pages) is a constraint for the planning phase, not part of this specification.
