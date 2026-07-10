// Blog post scaffolder — creates a listed post from the template.
//
// Usage:  npm run new-post -- <slug> "Title" ["One-line description"]
// Does:   1. creates src/pages/blog/<slug>.astro from scripts/templates/post.astro.tpl
//         2. inserts a metadata entry into src/data/posts.ts (drives /blog/ listing + OG tags)
// Then:   write the post, add an OG card at public/images/blog/<slug>-og.png (1200x630),
//         and update readingTime in posts.ts when the draft settles.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const [, , slug, title, description = "One-line description — shows on the blog index and social cards."] = process.argv;
if (!slug || !title) {
  console.error('usage: npm run new-post -- <slug> "Title" ["Description"]');
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error("slug must be lowercase letters, digits, and hyphens only");
  process.exit(1);
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pagePath = resolve(repoRoot, "src/pages/blog", `${slug}.astro`);
const postsPath = resolve(repoRoot, "src/data/posts.ts");

if (existsSync(pagePath)) {
  console.error(`refusing to overwrite existing post: src/pages/blog/${slug}.astro`);
  process.exit(1);
}

// 1. page from template
const tpl = readFileSync(resolve(repoRoot, "scripts/templates/post.astro.tpl"), "utf8");
const page = tpl
  .replaceAll("{{SLUG}}", slug)
  .replaceAll("{{TITLE}}", title)
  .replaceAll("{{DESCRIPTION}}", description)
  .replaceAll("{{KICKER}}", "Kicker · replace me");
writeFileSync(pagePath, page);

// 2. metadata entry (inserted at the scaffold marker, newest first)
const now = new Date();
const published = now.toISOString().slice(0, 10);
const displayDate = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const entry = `  {
    slug: "${slug}",
    title: ${JSON.stringify(title)},
    description: ${JSON.stringify(description)},
    published: "${published}",
    displayDate: "${displayDate}",
    readingTime: "X min read",
    ogImage: "/images/blog/${slug}-og.png",
  },
`;

const MARKER = "// new-post:insert";
const posts = readFileSync(postsPath, "utf8");
if (!posts.includes(MARKER)) {
  console.error(`marker "${MARKER}" not found in src/data/posts.ts — add it as the first line inside the posts array`);
  process.exit(1);
}
writeFileSync(postsPath, posts.replace(MARKER, `${MARKER}\n${entry.trimEnd()}`));

console.log(`created  src/pages/blog/${slug}.astro`);
console.log(`updated  src/data/posts.ts (published: ${published})`);
console.log(`next:    add OG card at public/images/blog/${slug}-og.png (1200x630),`);
console.log(`         write the post, set readingTime, then npm run build to verify.`);
