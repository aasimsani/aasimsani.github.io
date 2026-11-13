// Run with: npm run test
// The explorers in the process-as-a-plugin post read src/data/toolkits.ts, which
// scripts/extract-toolkits.mjs writes from the toolkits' own markdown.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTables } from "./extract-toolkits.mjs";
import { testingGroups, testingCards, fvGroups, fvCards, claimShapes } from "../src/data/toolkits.ts";

const count = (cards, group) => cards.filter((c) => c.group === group).length;

test("parseTables puts each table under its nearest heading and drops the separator row", () => {
  const md = ["# Catalog", "", "### A1. First", "", "| Pattern | What breaks |", "| --- | --- |", "| **Cache** | Stale `read` |", "", "### A2. Second", "", "| Pattern | What breaks |", "|---|---|", "| Queue | Lost item |", "| Lock | Deadlock |"].join("\n");
  const tables = parseTables(md);
  assert.deepEqual(tables.map((t) => [t.heading, t.rows.length]), [["A1. First", 1], ["A2. Second", 2]]);
  assert.deepEqual(tables[0].rows[0], { Pattern: "Cache", "What breaks": "Stale read" }, "cells are keyed by header, with bold marks and backticks removed");
});

test("the testing explorer holds every scenario, skill and eval fixture the toolkit has", () => {
  assert.equal(count(testingCards, "changing") + count(testingCards, "building") + count(testingCards, "operating"), 19, "scenario playbooks");
  assert.equal(count(testingCards, "skills"), 18, "skills");
  assert.equal(count(testingCards, "evals"), 16, "eval fixtures");
});

test("the formal-checks explorer holds every tool, pattern and eval scenario the toolkit has", () => {
  assert.equal(claimShapes.length, 7, "claim shapes");
  assert.equal(count(fvCards, "tools"), 17, "tool rows");
  const perCatalog = Object.fromEntries("ABCDEFG".split("").map((k) => [k, count(fvCards, k)]));
  assert.deepEqual(perCatalog, { A: 25, B: 40, C: 34, D: 12, E: 12, F: 33, G: 10 }, "patterns per catalog, 166 in all");
  assert.equal(count(fvCards, "evals"), 38, "eval scenarios");
});

test("every card belongs to a listed group and reads as plain text", () => {
  for (const [groups, cards] of [[testingGroups, testingCards], [fvGroups, fvCards]]) {
    const keys = new Set(groups.map((g) => g.key));
    for (const c of cards) {
      assert.ok(keys.has(c.group), `"${c.title}" is in the unlisted group "${c.group}"`);
      assert.ok(c.title && c.summary, `"${c.title}" needs a title and a summary`);
      for (const text of [c.title, c.summary, ...c.fields.map((f) => f.value)]) {
        assert.ok(!/\*\*|`/.test(text), `"${c.title}" still carries markdown marks: ${text.slice(0, 60)}`);
      }
    }
  }
});
