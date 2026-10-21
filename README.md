# aasimsani.net

Personal site — Astro 5 + Tailwind 4, deployed to GitHub Pages on push to `master`.

```bash
npm run dev       # local dev server
npm run build     # production build into dist/
```

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
index, OG tags, and dates). The page uses `PostLayout` and the components in
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
