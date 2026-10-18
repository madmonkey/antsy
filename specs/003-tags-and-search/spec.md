# Feature Specification: Article Tags and Search

**Feature Branch**: `003-tags-and-search`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "Readers can search for articles by tag and by text, alone or combined. Administrators can add multiple tags to an article. Articles display chips showing the tags they carry."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tag articles and show tag chips (Priority: P1)

An administrator adds any number of tags to an article while editing it. Readers see each tag as a small chip on the article and on article previews. Selecting a chip shows all articles with that tag.

**Why this priority**: Tags are the data that search by tag depends on, and chips are the most visible reader benefit.

**Independent Test**: Add three tags to an article, then confirm three chips appear on its page and previews, and that selecting one lists every article carrying it.

**Acceptance Scenarios**:

1. **Given** the article editor, **When** an administrator types a tag and confirms it, **Then** it is added to the article, and any number of tags can be added or removed.
2. **Given** an article with tags, **When** a reader views the article or its card or list entry, **Then** each tag is shown as a chip.
3. **Given** a chip, **When** the reader selects it, **Then** they see the articles that carry that tag.
4. **Given** the editor, **When** the administrator starts typing, **Then** existing tags are suggested so near-duplicates are avoided.
5. **Given** tags differing only by capitalisation or surrounding spaces, **When** they are saved, **Then** they are treated as the same tag.
6. **Given** an inactive or unpublished article, **When** a reader browses tags, **Then** its tags and counts do not reveal it.

---

### User Story 2 - Search articles by text, tags, or both (Priority: P1)

A reader enters words into a search box, picks one or more tags, or does both, and sees the matching articles. Results show title, excerpt, topic and tag chips.

**Why this priority**: Finding content is the second half of the request, and it is how readers reach older articles.

**Independent Test**: With a handful of tagged articles, search by a word in the body, by one tag, and by both, and confirm each returns the expected set.

**Acceptance Scenarios**:

1. **Given** a search term, **When** the reader searches, **Then** active, readable articles whose title, body or tags contain the words are returned, with title matches first.
2. **Given** one or more selected tags, **When** the reader searches, **Then** only articles carrying all selected tags are returned.
3. **Given** both text and tags, **When** the reader searches, **Then** results satisfy both.
4. **Given** no matches, **When** the reader searches, **Then** a friendly "no results" message appears with a way to clear the search.
5. **Given** a search, **When** the address is shared or reloaded, **Then** the same search and results appear.
6. **Given** the search box is empty and no tags are selected, **When** the reader opens search, **Then** it shows the available tags and does not list everything.
7. **Given** an article the reader should not see, **When** they search, **Then** it never appears in results.

---

### Edge Cases

- A tag is longer than a sensible length or empty: it is rejected with a clear message.
- An administrator adds the same tag twice to one article: it is stored once.
- A tag no longer has any articles: it stops appearing as a choice for readers.
- A search term contains punctuation, very long text or markup characters: it is treated as plain text and never breaks the page or the search.
- Words with different endings (for example "comment" and "comments") should match.
- An article has many tags: the chips wrap to additional lines without breaking card layout.
- The search service is unreachable: the site still reads normally and search shows a brief unavailable message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: An article MUST be able to carry any number of tags, including none. Tags are separate from topics. An article still belongs to exactly one topic.
- **FR-002**: Administrators MUST be able to add and remove tags in the article editor, with suggestions from existing tags.
- **FR-003**: Tags MUST be matched case-insensitively with surrounding spaces ignored, are unique, and have a maximum length.
- **FR-004**: Every article page and article preview MUST show its tags as chips. Each chip MUST lead to the articles with that tag.
- **FR-005**: Readers MUST be able to search by text, by tags, or by both, without signing in.
- **FR-006**: Text search MUST cover article title, body and tags, and rank title matches first.
- **FR-007**: Selecting several tags MUST return only articles with all of them.
- **FR-008**: Search results MUST include only articles a reader is already allowed to see, and tag choices and counts MUST not reveal hidden articles.
- **FR-009**: The current search MUST be reflected in the page address, so it can be shared, bookmarked and reloaded.
- **FR-010**: Search MUST be reachable from the header on every page, and MUST show a clear empty-result state.
- **FR-011**: Search input MUST be treated as plain text only.
- **FR-012**: A failure of search MUST NOT prevent the rest of the site from working.

### Key Entities

- **Tag**: A short label, unique ignoring case, that can be attached to many articles.
- **Article tagging**: The link between one article and one tag.
- **Search query**: Free text plus zero or more selected tags.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reader can find a specific article by a word from its title or body within 3 interactions from any page.
- **SC-002**: Search results appear within 1 second for a site of up to 1,000 articles.
- **SC-003**: 100% of search results and tag counts exclude articles that are not publicly readable.
- **SC-004**: An administrator can add three tags to an article in under 30 seconds.
- **SC-005**: Every article page and preview displays its tags as chips, with none missing and none duplicated.
- **SC-006**: A shared search address shows the same results to another reader.

## Assumptions

- This is separate from topics, which stay the primary one-per-article grouping.
- Search is a single search page reached from the header search box, not live results on every page.
- Search covers articles only. Comments are not searched.
- No typo tolerance, synonyms or highlighted match snippets in this version.
- No tag management screen (rename or merge) in this version. Administrators fix a mistaken tag by editing the article.
- Existing articles start with no tags.
- Search must keep working on the static site, using the existing hosted backend rather than a new service.
