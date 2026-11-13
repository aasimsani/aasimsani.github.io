// Run with: npm run test
import { test } from "node:test";
import assert from "node:assert/strict";
import { matches } from "./explorer.ts";

test("with no query a card shows only under its own group, and a query searches every group", () => {
  const card = { group: "B", text: "transactional outbox what breaks: lost events tla+" };
  assert.ok(matches(card, "B", ""), "its own group shows it");
  assert.ok(!matches(card, "C", ""), "another group hides it");
  assert.ok(matches(card, "C", "  Outbox TLA+ "), "a query finds it from any group, whatever the case or spacing");
  assert.ok(!matches(card, "B", "outbox alloy"), "one word that is missing hides it, even in its own group");
});
