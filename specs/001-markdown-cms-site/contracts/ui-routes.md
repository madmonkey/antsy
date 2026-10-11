# Contract: UI Routes and Toolbar

All routes live under the configured base path (`/` on the custom domain). Pages declare `lang="en-US"`.

| Route | Access | Content |
|-------|--------|---------|
| `/` | public | Header toolbar, recent-articles preview (<= 3) with previewable-topic filter and clear control, active topic list |
| `/topics/<slug>` | public | Topic name/description and its active articles (newest first); not-found if inactive/missing |
| `/articles/<slug>` | public | Rendered article; not-found if inactive, in inactive topic, or missing |
| `/admin/login` | public | Email/password form, throttle message |
| `/admin` | administrator | Dashboard: topic and article lists (inactive included) |
| `/admin/topics` | administrator | Create/edit/activate/previewable toggle/delete (confirm) |
| `/admin/articles/<id>` (`new` for create) | administrator | Markdown editor, formatting helpers, image embed, alt text, sanitized live preview, activate toggle |
| any other | public | Friendly not-found with link home |

Unauthenticated or non-allow-listed visits to `/admin*` redirect to `/admin/login`.

## Header toolbar (every page)

| Control | Behavior | Accessibility |
|---------|----------|---------------|
| Site name/home link | Navigates to `/` | text |
| Day/night toggle | Switches whole site; first visit follows device; choice persisted | `aria-label` "Switch to night mode" / "Switch to day mode" |
| Social icons | From `app.config.ts`; `target="_blank" rel="noopener noreferrer"`; omitted if list empty | `aria-label` = platform label; keyboard focusable |

Mobile: controls wrap/collapse without hiding any control.

## Landing preview behavior

1. Load previewable topics and the unfiltered newest 3 in parallel.
2. Selecting a topic re-queries with that topic; clearing restores unfiltered.
3. States: loading skeleton, empty message, error with Retry.
