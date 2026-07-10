# aasimsani.net

Personal site — Astro 5 + Tailwind 4, deployed to GitHub Pages on push to `master`.

```bash
npm run dev       # local dev server
npm run build     # production build into dist/
```

## Content tooling

Three ways to put a document on the site, from most to least public:

### Listed blog post

```bash
npm run new-post -- <slug> "Title" ["One-line description"]
```

Scaffolds `src/pages/blog/<slug>.astro` from `scripts/templates/post.astro.tpl`
and inserts a metadata entry into `src/data/posts.ts` (which drives the `/blog/`
index, OG tags, and dates). Then: write the post, add an OG card at
`public/images/blog/<slug>-og.png` (1200×630), and set `readingTime`.
Around 3+ posts, consider migrating to Astro content collections.

### Public standalone page (unlisted by default)

```bash
npm run publish -- <input.html> <slug> [--indexable]
```

Wraps an HTML fragment into a full page at `public/p/<slug>.html` →
`aasimsani.net/p/<slug>.html`. Default is unlisted: public to anyone with the
link, `noindex/nofollow`, in no listing or sitemap. `--indexable` opens it to
search engines.

### Encrypted vault page

```bash
npm run encrypt -- <input.html> <slug> "<password>"
```

Encrypts the fragment (AES-256-GCM, PBKDF2-310k) into `public/vault/<slug>.html`
→ `aasimsani.net/vault/<slug>.html`. The committed file is pure ciphertext —
safe in this public repo; readers need the link **and** the password.
`/vault/` is a landing page that lists nothing.

**Input contract** for `publish`/`encrypt`: an HTML *fragment* — `<title>` +
`<style>` blocks + body markup + optionally ONE trailing `<script>`. Keep
plaintext sources in `private-src/` — it is gitignored, as is `drafts/`.
Never commit either.
