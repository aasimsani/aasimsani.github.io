// Public standalone page publisher — the vault's un-gated sibling.
//
// Usage:   npm run publish -- <input.html> <slug> [--indexable]
// Output:  public/p/<slug>.html  →  https://aasimsani.net/p/<slug>.html after deploy
//
// Default is UNLISTED: the page is public to anyone with the link, but carries
// noindex/nofollow and appears in no listing or sitemap. Pass --indexable to
// let search engines index it.
//
// Input contract matches encrypt-page.mjs: an HTML *fragment* — <title> +
// <style> blocks + body markup + optional <script>. The fragment is wrapped
// in a full document verbatim (no encryption, no gate).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const indexable = args.includes("--indexable");
const [inPath, slug] = args.filter((a) => a !== "--indexable");
if (!inPath || !slug) {
  console.error("usage: npm run publish -- <input.html> <slug> [--indexable]");
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error("slug must be lowercase letters, digits, and hyphens only");
  process.exit(1);
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(inPath, "utf8");

const titleMatch = src.match(/<title>[\s\S]*?<\/title>/);
const title = titleMatch ? titleMatch[0] : `<title>${slug}</title>`;
const body = titleMatch ? src.replace(title, "") : src;

const robots = indexable ? "" : '<meta name="robots" content="noindex, nofollow" />\n';
const out = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${robots}${title}
</head>
<body>
${body}
</body>
</html>
`;

const outPath = resolve(repoRoot, "public/p", `${slug}.html`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, out);
console.log(`public page written: public/p/${slug}.html (${Math.round(out.length / 1024)} KB, ${indexable ? "indexable" : "unlisted/noindex"})`);
console.log(`live at: https://aasimsani.net/p/${slug}.html after deploy`);
