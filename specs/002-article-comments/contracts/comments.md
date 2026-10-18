# Contract: Comments

## Data access (`useComments`)

| Function | Does | Failure behaviour |
|----------|------|-------------------|
| `countApproved(articleId)` | Count of `status = approved` comments for the article. | Returns `null`; the link shows "Comments" without a number. |
| `listApproved(articleId)` | Approved comments (`id, author_name, body, created_at`), oldest first. For a signed-in reader also their own pending ones, flagged. | Throws; the section shows "Comments are unavailable right now." and a retry. |
| `signInWith(provider, returnUrl)` | Starts OAuth for `'google'` or `'github'` with `redirectTo = returnUrl`. | Shows "Sign-in failed. Try again." |
| `registerWithEmail(email, password, returnUrl, captchaToken)` / `signInWithEmail(email, password, captchaToken)` | Site-only account via `signUp` (with `emailRedirectTo = returnUrl` and `options.captchaToken`) and `signInWithPassword`. The form shows a Turnstile widget (loaded only when the email form is opened, so unobtrusive for everyone else). | "Check your email to confirm your account." / "Email or password is wrong." |
| `getProfile()` / `saveDisplayName(name)` | Reads and saves the reader's profile (2-40 characters). | Validation message beside the field. |
| `postComment(articleId, body)` | Inserts a pending comment. | Maps refusals to messages (below). |
| `deleteOwn(id)` | Deletes the reader's own comment. | Visible error, comment stays. |
| `signOut()` | Ends the reader session. | None. |

Refusal messages, mapped from database errors: commenting is closed on this article; you are blocked from commenting; too many comments, try again shortly; the comment is empty or too long.

## Admin data access (`useAdminContent`)

- `listCommentsForModeration(status)`: comments with article title and slug, author name, oldest first.
- `setCommentStatus(id, 'approved' | 'rejected')`, `deleteComment(id)`.
- `setCommenterBlocked(userId, blocked)`.
- `setCommentsEnabled(articleId, enabled)` through the normal article save.
- `countPendingComments()` for the dashboard badge.

## UI contract

### CommentsSection (public article page only)

States: **collapsed** (link "Comments (N)"), **loading**, **open with comments**, **open empty** ("No comments yet."), **error**, **closed** (note "Commenting is closed", no form, existing comments visible).

- Opening the section triggers `listApproved`. Nothing is fetched earlier except the count.
- "Add a comment" appears only when commenting is enabled. If signed out it shows "Continue with Google" and "Continue with GitHub" buttons plus a small "Use email instead" form (register or sign in). Unconfirmed accounts see "Confirm your email to comment."
- After first sign-in a one-time display-name step appears before the form.
- A successful submit clears the form and shows: "Thanks. Your comment will appear after it has been approved."
- Text is rendered as text. Line breaks preserved. Accessible: the toggle is a real button with `aria-expanded`, the form fields are labelled, status messages use `aria-live`.
- The component is not rendered in the admin preview popup.

### Admin

- `/admin/comments`: tabs for pending, approved and rejected. Each row shows article, author, date, text, and actions Approve, Reject, Delete, Block/Unblock. Non-administrators are redirected by the existing admin middleware.
- Article editor: a "Allow comments" switch, default on.
- Admin dashboard: link to the queue with a pending count.

## External setup contract

Google Cloud OAuth client (web) and a GitHub OAuth App, each with the authorised redirect URI set to the Supabase project's `/auth/v1/callback`. Supabase: Google and GitHub providers enabled with their client ids and secrets, sign-ups allowed, redirect URLs include the site origin with `/**` (current Pages address and later the custom domain).
