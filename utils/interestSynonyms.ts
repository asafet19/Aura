const SYNONYM_GROUPS: readonly string[][] = [
  ["cars", "car", "formula 1", "f1", "range rover", "motorsport", "supercars"],
  ["football", "soccer", "premier league", "champions league"],
  ["basketball", "nba", "hoops"],
  ["movies", "films", "cinema"],
  ["ai", "artificial intelligence", "machine learning", "ml"],
];

function normalizeInterest(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

const REVERSE_SYNONYM_LOOKUP = (() => {
  const map = new Map<string, Set<string>>();

  for (const group of SYNONYM_GROUPS) {
    const normalizedGroup = group.map(normalizeInterest);
    for (const item of normalizedGroup) {
      const existing = map.get(item) ?? new Set<string>();
      for (const synonym of normalizedGroup) {
        existing.add(synonym);
      }
      map.set(item, existing);
    }
  }

  return map;
})();

export function expandInterestTerms(input: string): string[] {
  const normalized = normalizeInterest(input);
  if (!normalized) return [];

  const expanded = new Set<string>([normalized]);
  const mapped = REVERSE_SYNONYM_LOOKUP.get(normalized);

  if (mapped) {
    for (const term of mapped) {
      expanded.add(term);
    }
  }

  return [...expanded];
}
