# aasimsani.net

Personal site — Astro 5 + Tailwind 4, deployed to GitHub Pages on push to `master`.

```bash
npm run dev       # local dev server
npm run build     # production build into dist/
npm run check     # type-check the Astro project
npm test          # unit tests for the site scripts
```

`.github/workflows/ci.yml` runs the type check and the tests, including the
narration script's Python tests, on every pull request and on `master`.

## What a build ships

- **Fonts.** Geist, Geist Mono and Silkscreen come from the Fontsource packages
  and are served from the site, so no page waits on a third-party font host.
  `src/styles/fonts.css` declares them, along with resized system-font stand-ins
  that hold the layout until each font arrives.
- **Styles.** Each page's CSS is inlined into its HTML (`astro.config.mjs`).
- **Feed and search.** `/rss.xml` lists the blog posts, `/sitemap-index.xml`
  lists the pages, and `public/robots.txt` points crawlers at the sitemap. Each
  page carries schema.org data built by `src/data/schema.ts`.

## PR previews

`.github/workflows/preview.yml` builds every pull request, uploads it to the
`aasimsani-net` Cloudflare Worker (`wrangler.jsonc`) under the alias
`pr-<number>`, and comments the preview URL on the PR. The production site
still deploys to GitHub Pages from `master`.

- The Worker has `workers.dev` turned off, so it has no public production copy.
- Every preview sends `X-Robots-Tag: noindex, nofollow`, so search engines skip it.
- When the PR closes, the workflow replaces its preview with a "preview closed"
  page, because Cloudflare can't delete a preview alias.

The workflow needs two repository secrets: `CLOUDFLARE_API_TOKEN`, from the
"Edit Cloudflare Workers" token template, and `CLOUDFLARE_ACCOUNT_ID`.

## Content tooling

Two ways to put a document on the site:

### Listed blog post

```bash
npm run new-post -- <slug> "Title" ["One-line description"]
```

Scaffolds `src/pages/blog/<slug>.astro` from `scripts/templates/post.astro.tpl`
and inserts a metadata entry into `src/data/posts.ts` (which drives the `/blog/`
index, the RSS feed, OG tags, and dates). The page uses `PostLayout` and the components in
`src/components/post/`, and shared post styles live in `src/styles/post.css`.
Then: write the post, add an OG card at
`public/images/blog/<slug>-og.png` (1200×630), and set `readingTime`.
[`docs/blog.md`](docs/blog.md) covers the components, visual style, writing
style and social-card spec. Around 3+ posts, consider migrating to Astro
content collections.

### Public standalone page (unlisted by default)

```bash
npm run publish -- <input.html> <slug> [--indexable]
```

Wraps an HTML fragment into a full page at `public/p/<slug>.html` →
`aasimsani.net/p/<slug>.html`. Default is unlisted: public to anyone with the
link, `noindex/nofollow`, in no listing or sitemap. `--indexable` opens it to
search engines.

**Input contract** for `publish`: an HTML *fragment* — `<title>` +
`<style>` blocks + body markup + optionally ONE trailing `<script>`. Keep
working sources in `drafts/`, which is gitignored.
