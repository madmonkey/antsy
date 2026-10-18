# Feature Specification: Article Comments

**Feature Branch**: `002-article-comments`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "Readers can give feedback on articles through comments. No anonymous commenting (bot and quality concerns). Sign in must use a third-party provider such as Google, so we don't manage credentials, and must not require a GitHub account (Google is the default, and GitHub is offered as a second choice). Every comment is approved before it shows. Commenters pick a display name. Comments apply to all articles, and an administrator can disable and re-enable commenting per article. It must be unobtrusive to readers. Prefer an existing product over building our own, but anonymous plus moderated plus no-GitHub rules out the off-the-shelf options; build on the existing backend."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read comments without being bothered (Priority: P1)

A reader finishes an article and sees a quiet "Comments (N)" link under it. Opening it reveals the approved comments, oldest first. Readers who never open it see and load nothing extra, and never have to sign in.

**Why this priority**: Most visitors only read. Comments must not slow or clutter their experience, and approved comments are the value the feature delivers.

**Independent Test**: Publish an article with approved comments. Verify the link shows the right count, nothing is loaded until it is opened, and an article with no comments shows a plain invitation to comment.

**Acceptance Scenarios**:

1. **Given** an article with 3 approved comments, **When** a signed-out reader views it, **Then** a "Comments (3)" link appears below the body and no comment text is shown yet.
2. **Given** the reader opens the link, **When** the comments appear, **Then** each shows the display name, date and text as plain text, oldest first.
3. **Given** an article has only pending or rejected comments, **When** any reader views it, **Then** those comments are not visible and not counted.
4. **Given** an article with commenting disabled and approved comments, **When** a reader opens the comments, **Then** the existing comments are shown read-only with a note that commenting is closed.
5. **Given** the home and topic pages, **When** they load, **Then** no comment content or sign-in prompt appears.

---

### User Story 2 - Sign in with a third-party account and comment (Priority: P1)

A reader who wants to comment chooses "Add a comment", signs in with Google or GitHub (their choice, neither is required to have both), picks a display name the first time, and submits a comment. It is held for approval, and the reader is told clearly that it will show once approved.

**Why this priority**: The core interaction. Anonymous posting is excluded, so sign-in is required.

**Independent Test**: As a new reader, sign in with a third-party account, choose a display name, submit a comment, and confirm it is not public but is acknowledged to the author.

**Acceptance Scenarios**:

1. **Given** a signed-out reader on an article that allows comments, **When** they choose "Add a comment", **Then** they are asked to sign in or register (Google, GitHub, or email and password) and are returned to the same article afterwards.
2. **Given** a first-time commenter, **When** sign-in completes, **Then** they are asked once for a display name, which is then remembered.
3. **Given** a signed-in commenter, **When** they submit a valid comment, **Then** it is saved as pending, shown to them as "awaiting approval", and not shown to others.
4. **Given** a reader who browses and reads without commenting, **When** they use the site, **Then** they are never asked to sign in.
5. **Given** an empty or over-length comment, **When** it is submitted, **Then** it is rejected with a clear message and nothing is saved.
6. **Given** a commenter submitting repeatedly in a short time, **When** the limit is exceeded, **Then** further submissions are refused with a "try again shortly" message.

---

### User Story 3 - Moderate comments (Priority: P1)

An administrator opens a moderation queue listing pending comments with the article, display name and text. They approve or reject each one, and can later delete an approved comment or block a commenter.

**Why this priority**: Approve-before-publish is a hard requirement. Without moderation nothing ever appears.

**Independent Test**: Submit a comment, find it in the queue, approve it and confirm it appears publicly. Repeat with reject and confirm it never appears.

**Acceptance Scenarios**:

1. **Given** pending comments exist, **When** an administrator opens the queue, **Then** they are listed oldest first with the article title and a link to it.
2. **Given** a pending comment, **When** the administrator approves it, **Then** it appears on the article without a site rebuild.
3. **Given** a pending comment, **When** the administrator rejects it, **Then** it never appears publicly.
4. **Given** an approved comment, **When** the administrator deletes it, **Then** it is removed from the article and the count.
5. **Given** a blocked commenter, **When** they try to comment, **Then** the attempt is refused and none of their existing approved comments are removed unless the administrator also deletes them.
6. **Given** a signed-in commenter who is not an administrator, **When** they try to reach the queue or moderate anything, **Then** access is denied.

---

### User Story 4 - Turn commenting off and on per article (Priority: P2)

While editing an article an administrator can switch commenting off or back on. Commenting is on by default for new articles.

**Why this priority**: Needed to shut down a problem thread, but the feature is still useful without it.

**Independent Test**: Disable commenting on one article, confirm the add-comment option disappears there but remains on others, then re-enable it and confirm it returns.

**Acceptance Scenarios**:

1. **Given** a new article, **When** it is published, **Then** commenting is enabled.
2. **Given** commenting is disabled, **When** a reader views the article, **Then** no add-comment option appears and a submission attempt is refused.
3. **Given** commenting is disabled while comments were already pending, **When** the administrator views the queue, **Then** pending comments can still be approved or rejected.
4. **Given** commenting is re-enabled, **When** a reader views the article, **Then** the add-comment option returns with all prior approved comments intact.

---

### User Story 5 - Manage my own comments and sign-in (Priority: P3)

A signed-in commenter can sign out and can delete their own comments, whether pending or approved.

**Why this priority**: A basic privacy expectation, but not needed for launch.

**Independent Test**: Post, then delete one's own comment, and confirm it disappears for everyone.

**Acceptance Scenarios**:

1. **Given** a commenter with a pending or approved comment, **When** they delete it, **Then** it is removed for everyone.
2. **Given** a signed-in reader, **When** they sign out, **Then** the site returns to its signed-out state.

---

### Edge Cases

- A reader signs in but the provider does not return an email or name: the display name is still collected and the email is never shown.
- Two commenters choose the same display name: allowed, since identity is the account, not the name.
- A display name is offensive or impersonates the author: the administrator can reject its comments or block the account.
- A comment contains HTML, script or links: it is shown as plain text only. Links are not made clickable.
- An article is deleted or made inactive: its comments are no longer shown and are removed with it.
- A comment is submitted while the article is being disabled: the final state decides, and a refused comment tells the reader why.
- The reader's session expires mid-write: they are asked to sign in again and the draft is kept in the page when possible.
- The comment service is unreachable: the article still reads normally and the comments area shows a brief unavailable message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every article MUST have a Comments area below the body, collapsed by default and showing the count of approved comments. Comment content MUST NOT be fetched until a reader opens it.
- **FR-002**: Reading comments MUST NOT require signing in. The home and topic pages MUST show no comment content or sign-in prompt.
- **FR-003**: Posting a comment MUST require sign-in. Anonymous posting MUST NOT be possible.
- **FR-004**: Readers MUST be able to register and sign in with Google, GitHub, or a site-only account (email and password). Google MUST always be available so no reader needs a GitHub account. Site-only accounts MUST confirm their email before they can comment, and password handling stays with the backend auth service (the site never stores passwords itself). Anonymous sessions MUST NOT be able to comment. Registration is a reader account that can later carry other features such as a newsletter signup.
- **FR-005**: A commenter MUST choose a display name on first use. It is shown with their comments, is length-limited, and the reader's email MUST never be shown publicly.
- **FR-006**: Every new comment MUST be saved as pending and MUST NOT be visible to other readers until an administrator approves it.
- **FR-007**: The submitting reader MUST be told that their comment is awaiting approval, and MUST be able to see their own pending comments.
- **FR-008**: Comment text MUST be limited in length, MUST NOT be empty, and MUST always be displayed as plain text.
- **FR-009**: The system MUST limit how often one account can submit comments.
- **FR-010**: Approved comments MUST show without rebuilding or republishing the site.
- **FR-011**: Administrators MUST have a moderation queue to approve, reject and delete comments, and to block and unblock commenters.
- **FR-012**: Only administrators MUST be able to moderate. Comment sign-in MUST NOT grant any administrator access.
- **FR-013**: Administrators MUST be able to enable or disable commenting per article while editing it. New articles default to enabled.
- **FR-014**: When commenting is disabled, the system MUST refuse new comments, hide the add-comment option, and keep approved comments visible as read-only.
- **FR-015**: A commenter MUST be able to delete their own comments and sign out.
- **FR-016**: Comments MUST be removed when their article is removed.
- **FR-017**: A failure of the comment service MUST NOT prevent an article from being read.

### Key Entities

- **Comment**: A reader's message on one article. Has text, author (account and display name), created time and a status of pending, approved or rejected.
- **Commenter**: A reader with a verified account (Google, GitHub, or site-only), with a chosen display name and a blocked flag. Distinct from an administrator.
- **Article comment setting**: A per-article flag for whether new comments are accepted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A signed-out reader viewing any article loads no comment content and sees no sign-in prompt until they open the Comments area.
- **SC-002**: A new reader can sign in, choose a display name and submit a comment in under 90 seconds.
- **SC-003**: 100% of new comments are invisible to other readers until approved.
- **SC-004**: An administrator can review and approve or reject a comment in under 30 seconds, and an approved comment is public within 10 seconds.
- **SC-005**: Disabling comments on an article stops new submissions on that article immediately, while other articles are unaffected.
- **SC-006**: No reader sign-in ever grants access to administration, and no reader email address is visible to the public.
- **SC-007**: Comment-service failures never block reading an article.

## Assumptions

- The project's existing hosted backend and administrator accounts are reused. An off-the-shelf comment product was considered, but none offers third-party sign-in without GitHub, administrator approval, and no new server or ads.
- Readers can register three ways: Google, GitHub, or a site-only account (email and password, email confirmation required). All three give the same reader account type, and any can comment. Verification means a confirmed email, which every route provides. Later features (for example a newsletter signup) attach to the reader account regardless of how it was created, so the account is not tied to commenting. Newsletter itself is out of scope here.
- No threaded replies, reactions, edits to submitted comments, or email notifications in this version. Moderators check the queue themselves.
- A blocked commenter's existing comments stay unless the administrator deletes them.
- Comment text is plain text only, with no Markdown, links or images.
- Comments are not part of the published static snapshot, so they appear without a rebuild.
- Spam defence is the sign-in requirement, approval before publishing, length and rate limits. A captcha is out of scope unless the queue becomes unmanageable.
- Existing administrator permissions are role-based, so enabling reader sign-in does not give readers admin rights.
