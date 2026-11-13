/**
 * Says whether an explorer card shows. With no query, a card shows under its
 * own group. A query searches every group, and every word of it must be in the
 * card's text, which the caller has already lower-cased.
 */
export function matches(card: { group: string; text: string }, group: string, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return card.group === group;
  return words.every((word) => card.text.includes(word));
}
