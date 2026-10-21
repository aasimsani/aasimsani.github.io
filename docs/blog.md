# Blog guide

This guide covers how a post on `/blog/` is built, styled and written. The
first post, `src/pages/blog/inattentional-blindness.astro`, is the reference
for every rule here.

## Shipping a post

1. Run `npm run new-post -- <slug> "Title" "Description"`. The script creates
   `src/pages/blog/<slug>.astro` from `scripts/templates/post.astro.tpl` and
   adds an entry to `src/data/posts.ts`.
2. Write the post, using the components below.
3. Make the social card (see [Social card](#social-card)).
4. Set `readingTime` in `src/data/posts.ts` once the draft settles.
5. Run `npm run build`, then check the page in Serious and After hours, light
   and dark, and at phone width.

## Page anatomy

`src/data/posts.ts` holds one entry per post. The `/blog/` index, the page
title, the canonical URL and the social tags all read from it.

| Field | What it does |
|---|---|
| `slug` | Sets the URL (`/blog/<slug>/`) and must match the page's file name |
| `title` | Fills the index card, `<title>`, `og:title` and the default headline |
| `description` | Fills the index card, `meta description` and `og:description` |
| `published` | ISO date that sorts the index and sets `article:published_time` |
| `displayDate` | Human date shown in the byline |
| `readingTime` | Byline text, such as `23 min read` |
| `ogImage` | Root-relative path of the social card; bump `?v=N` when the image changes |

`PostLayout` (`src/layouts/PostLayout.astro`) draws the frame: the pinned nav
with its reading-progress bar, the header, the share row, the footer and the
Serious / After hours switch. A post passes these props:

| Prop | What it does |
|---|---|
| `slug` | Looks up the entry in `posts.ts`, and the build fails if none exists |
| `kicker` | Short line above the headline, in pixel type, such as `Inattentional blindness · root-caused` |
| `headline` | On-page `<h1>`, which can differ from `title` in casing or punctuation |
| `dek` | One or two sentences under the headline |
| `shareText` | Text an X share carries, which defaults to `title` |

The default slot holds the sections. The `sources` slot holds `<Sources>`.

## Components

All post components live in `src/components/post/`. Their shared styles live
in `src/styles/post.css`.

| Component | Use it for |
|---|---|
| `PostSection` | One numbered section. Pass `id`, `no` (`"01"`), `label` and `title`. Leave out `no`, `label` and `title` for the opening section, which has no heading. |
| `Reveal` | A question the reader answers before opening the explanation. `summary` is the question. |
| `CaseFile` | One incident. Wrap a run of them in `<div class="case-grid">`. The props `staring`, `invisible` and `seenBy` fill the facts list, `catcher` opens the verdict in bold, and the `verdict` slot finishes it. |
| `Checklist` | Practices the reader can tick and copy as Markdown. Give each post its own `storageKey`, versioned like `<slug>-checklist.v1`, and bump the version when the items change. |
| `Sources` | The numbered source list. Each `<li>` gets `id="src-N"`. Practitioner links go in the `further` slot. |
| `ShareRow`, `BlogNav`, `BlogAdventureSwitch` | `PostLayout` and the blog index place these, so a post never uses them directly. |

These classes from `post.css` cover the remaining markup:

| Class | Use it for |
|---|---|
| `lede` | The first paragraph of a section, set larger |
| `aside` | A boxed remark beside the main argument |
| `cta` | The closing invitation to reply |
| `post-panel` | Any boxed block, such as a figure, so it picks up both modes' borders |
| `chart-title` | The `<figcaption>` of a figure |
| `post-btn` | Any button inside a post |

When a figure belongs to one post only, its styles go in a `<style>` block at
the bottom of that post's page. Styles that a second post would reuse move to
`post.css`, and markup that a second post would reuse becomes a component.

## Visual style

The blog uses the site's night ember theme, so colors always come from the
tokens in `src/styles/global.css`, such as `var(--color-accent)` and
`var(--color-text-soft)`. Hard-coded hex values break the light (dawn) theme.
Inline SVG figures follow the same rule, through `fill="var(--color-text)"`
and similar attributes.

| Element | Typeface |
|---|---|
| Body and headings | Geist (`--font-display`, `--font-body`) |
| Kicker, section labels, nav links, buttons | Silkscreen (`--font-ui`) |
| Code and diffs | Geist Mono (`--font-mono`) |

The visitor's clock picks the mode, and the switch lets them change it.

- **Serious** is the plain reading page.
- **After hours** keeps every word and adds the game markers: a night sky,
  stepped corners on panels, a lantern per section that lights once the reader
  passes it, and a dashed road between sections. It never adds a character or
  a boss. Elements that exist only in this mode carry `afterhours-only`.

Every figure carries an `aria-label`. A chart or diagram also carries
`role="img"`, and its label states the data or the flow in full, so a screen
reader gets the same argument as the picture.

## Writing style

- **Write in plain, direct sentences.** One claim per sentence, contractions
  welcome, and no marketing words such as "robust" or "game-changing".
- **Never use an em dash** in headlines, decks, descriptions, share text,
  social cards or body copy. A comma, period, colon or parentheses does the
  job. A quotation keeps the punctuation its author used.
- **Use typographic punctuation.** Curly apostrophes and quotes (`&rsquo;`,
  `&ldquo;`, `&rdquo;`), `&middot;` between kicker parts, and `&ndash;` in
  number ranges.
- **Name people by their role**, such as "a peer" or "a teammate", unless they
  agreed to be named. Use "they" when the person's pronouns are unknown.
- **Back every factual claim with a source.** Cite in text with
  `<sup><a href="#src-N">N</a></sup>`. A source entry follows APA style: author,
  year, linked title (DOI when one exists), and the venue in italics.
- **Make the reader take part** where it helps the argument, such as a diff to
  review before a `Reveal`, or a checklist to copy.

## Social card

Each post gets a 1200×630 PNG at `public/images/blog/<slug>-og.png`. Every card
matches the night ember theme, so link previews look like the site:

- The sky is a vertical gradient from `#0b0f24` through `#1a1438` to
  `#2b1740`, with a few square `#cfd8ff` stars.
- A Silkscreen kicker sits at the top in `#ff9a3c`.
- The headline is Geist 800 in `#ece4d4`, with one key word in `#ff9a3c`.
- The subtitle is Geist in `#bdb4cc` and has no em dash.
- A figure on the right echoes the post, such as the code lines, magnifier
  and gorilla on the first card.
- The road band runs along the bottom in `#5e4033` with a `#9a7050` top edge.
  It carries `AASIM SANI · AASIMSANI.NET` in Silkscreen.

`scripts/templates/og-card.html` is the first post's card. To make a new one,
copy it, change the text and the right-hand figure, and render it with
headless Chrome:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 \
  --virtual-time-budget=5000 --screenshot=public/images/blog/<slug>-og.png \
  "file://$PWD/<card>.html"
```

When a card changes after publishing, bump the `?v=N` suffix on `ogImage` in
`posts.ts`. LinkedIn, X and Slack cache cards by URL, so they keep showing the
old image until the URL changes.
