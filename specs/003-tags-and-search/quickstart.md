# Quickstart: Article Tags and Search

## Prerequisites

- The hosted Supabase project, with the migration applied (see below).
- At least a few active articles in an active topic.

## Apply

Apply `supabase/migrations/20260201000001_article_tags_search.sql` in the Supabase SQL editor (the project policy is no local Supabase). It is additive and re-runnable.

Rollback: drop the two functions, the trigger, the two indexes and the two columns. Articles are otherwise unaffected.

## Checks (live)

1. Edit an article, add three tags (one in mixed case, one duplicated). Save. Expect two or three lowercase unique chips on the article page and on its card.
2. Select a chip. Expect `/search?tag=<tag>` listing every article with it.
3. Search a word that appears only in a body. Expect that article. Search its plural or singular form. Expect the same article.
4. Search text plus a tag. Expect only articles satisfying both.
5. Search `"` or `'; drop table` or very long text. Expect no error and a normal result or empty message.
6. Make an article inactive. Expect it to vanish from results and from the tag list for a signed-out visitor.
7. Save an article containing a large embedded image. Expect the save to succeed.
8. Reload a search URL and open it in a private window. Expect identical results.

## Automated

```text
npx nuxt prepare
npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json
npm run lint
npx vitest run tests/unit tests/component
```
