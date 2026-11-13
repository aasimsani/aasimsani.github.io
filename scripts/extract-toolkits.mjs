// Writes src/data/toolkits.ts from the markdown of the testing toolkit and the
// fv-toolkit, so the explorers in the process-as-a-plugin post show what those
// repos hold and the site's build never depends on them.
//
// Usage:  node scripts/extract-toolkits.mjs [testing-toolkit dir] [formal-verification-toolkit dir]
//         Both default to sibling folders of this repo.
// Then:   npm test, which pins the counts.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const plain = (s) => s.replace(/\*\*/g, "").replace(/`/g, "").replace(/\s+/g, " ").trim();
const cells = (line) => line.trim().replace(/^\||\|$/g, "").split("|").map(plain);

/** Reads every markdown table and keys each row's cells by the table's header. */
export function parseTables(md) {
  const tables = [];
  let heading = "";
  let table = null;
  for (const line of md.split("\n")) {
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) { heading = plain(h[1]); table = null; continue; }
    if (!line.trim().startsWith("|")) { table = null; continue; }
    if (/^\|\s*:?-{3,}/.test(line.trim())) continue;
    if (!table) { table = { heading, headers: cells(line), rows: [] }; tables.push(table); continue; }
    const row = cells(line);
    table.rows.push(Object.fromEntries(table.headers.map((key, i) => [key, row[i] ?? ""])));
  }
  return tables;
}

/** Reads the `key: value` lines of a file's frontmatter. */
function frontmatter(text) {
  const block = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const out = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^"(.*)"$/, "$1").replace(/\\"/g, '"');
  }
  return out;
}

const firstSentence = (s) => plain(s).match(/^.*?[.!?](?=\s|$)/)?.[0] ?? plain(s);
const dirs = (path) => readdirSync(path, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const field = (label, value) => ({ label, value });

function testing(root) {
  const plugin = join(root, "plugins/testing-toolkit");
  const groups = [
    { key: "changing", label: "Changing code" },
    { key: "building", label: "Building new things" },
    { key: "operating", label: "Operating systems" },
    { key: "skills", label: "The 18 skills" },
    { key: "evals", label: "Eval fixtures" },
  ];
  const cards = [];
  for (const t of parseTables(readFileSync(join(plugin, "references/scenario-playbooks.md"), "utf8"))) {
    const group = groups.find((g) => g.label === t.heading)?.key;
    for (const r of t.rows) {
      cards.push({ group, title: r.Scenario, summary: `Picked when: ${r.Signal}`, fields: [field("Playbook", r.Playbook), field("Done when", r["Done when"])] });
    }
  }
  for (const name of dirs(join(plugin, "skills"))) {
    const fm = frontmatter(readFileSync(join(plugin, "skills", name, "SKILL.md"), "utf8"));
    cards.push({ group: "skills", title: name, summary: firstSentence(fm.description), fields: [field("In full", plain(fm.description))] });
  }
  for (const t of parseTables(readFileSync(join(root, "README.md"), "utf8"))) {
    if (t.headers[0] !== "Case" || !t.headers.includes("Fixture")) continue;
    for (const r of t.rows) {
      const fields = [field("A proper result needs", r["What a proper result needs"])];
      if (r["Why it is hard"]) fields.unshift(field("Why it is hard", r["Why it is hard"]));
      cards.push({ group: "evals", title: r.Case, summary: r.Fixture, fields });
    }
  }
  return { groups, cards };
}

function fv(root) {
  const plugin = join(root, "plugins/fv-toolkit");
  const refs = join(plugin, "references");
  const groups = [{ key: "tools", label: "Tools" }];
  const cards = [];
  for (const t of parseTables(readFileSync(join(refs, "skills.md"), "utf8"))) {
    for (const r of t.rows) {
      cards.push({ group: "tools", title: r.Tool, summary: r["The question is"], fields: [field("Skill", r.Skill), field("Installed", t.heading === "Core tools" ? `Core. ${r.Install}` : `On demand. ${r.Install}`)] });
    }
  }
  for (const file of readdirSync(join(refs, "catalog")).filter((f) => /^[A-G]-/.test(f)).sort()) {
    const md = readFileSync(join(refs, "catalog", file), "utf8");
    const key = file[0];
    const title = plain(md.match(/^#\s+(.*)$/m)[1]).replace(/^Catalog [A-G]\s+\S\s+/, "");
    groups.push({ key, label: `${key}. ${title}` });
    for (const t of parseTables(md)) {
      if (t.headers[0] !== "Pattern") continue;
      for (const r of t.rows) {
        // One table lists examples and no model, so a card shows the columns its own table has.
        const fields = [["Examples", "Examples"], ["Tool", "Tool"], ["Model", "Model"], ["Properties", "Properties"], ["Link to code", "Code link"]]
          .filter(([, column]) => r[column])
          .map(([label, column]) => field(label, r[column]));
        if (!t.heading.startsWith("Catalog")) fields.unshift(field("Family", t.heading));
        cards.push({ group: key, title: r.Pattern, summary: `What breaks: ${r["What breaks"]}`, fields });
      }
    }
  }
  groups.push({ key: "evals", label: "Eval scenarios" });
  const kinds = { route: "Must route to the fitting tool", "no-trigger": "Must stay out", effect: "Must run the real checker" };
  for (const kind of dirs(join(plugin, "evals"))) {
    if (!kinds[kind]) continue;
    for (const name of dirs(join(plugin, "evals", kind))) {
      const file = join(plugin, "evals", kind, name, "prompt.md");
      if (!existsSync(file)) continue;
      const fm = frontmatter(readFileSync(file, "utf8"));
      const tags = (fm.tags ?? "").replace(/[\[\]]/g, "").split(",").map((s) => s.trim()).filter(Boolean);
      const fields = [field("Kind of case", kinds[kind])];
      if (tags[1]) fields.push(field("Tool", tags[1]));
      cards.push({ group: "evals", title: name.replace(/-/g, " "), summary: plain(fm.description ?? ""), fields });
    }
  }
  const claims = parseTables(readFileSync(join(refs, "claims.md"), "utf8")).find((t) => t.headers[0] === "Claim shape");
  const claimShapes = claims.rows.map((r) => ({ shape: r["Claim shape"], check: r.Check, why: r["Why a weaker check fails"], skill: r.Skill }));
  return { groups, cards, claimShapes };
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const [testingRoot = resolve(here, "../../testing-toolkit"), fvRoot = resolve(here, "../../formal-verification-toolkit")] = process.argv.slice(2);
  const t = testing(testingRoot);
  const f = fv(fvRoot);
  const json = (v) => JSON.stringify(v, null, 2);
  const out = `// Generated by scripts/extract-toolkits.mjs from the testing toolkit and the
// fv-toolkit. Edit those repos and run the script again. Don't edit this file.

export interface ExplorerGroup {
  key: string;
  label: string;
}

export interface ExplorerCard {
  group: string;
  title: string;
  summary: string;
  fields: { label: string; value: string }[];
}

export interface ClaimShape {
  shape: string;
  check: string;
  why: string;
  skill: string;
}

export const testingGroups: ExplorerGroup[] = ${json(t.groups)};

export const testingCards: ExplorerCard[] = ${json(t.cards)};

export const fvGroups: ExplorerGroup[] = ${json(f.groups)};

export const fvCards: ExplorerCard[] = ${json(f.cards)};

export const claimShapes: ClaimShape[] = ${json(f.claimShapes)};
`;
  writeFileSync(resolve(here, "../src/data/toolkits.ts"), out);
  console.log(`testing: ${t.cards.length} cards. fv: ${f.cards.length} cards, ${f.claimShapes.length} claim shapes.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
