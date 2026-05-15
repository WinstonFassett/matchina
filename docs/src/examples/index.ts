import type { ExampleMeta, ExampleFilter } from "./types";

const modules = import.meta.glob<{ default: ExampleMeta }>("./*.example.ts", { eager: true });

const ALL: ExampleMeta[] = Object.values(modules).map((m) => m.default);

const BY_ID = new Map(ALL.map((e) => [e.id, e]));

if (BY_ID.size !== ALL.length) {
  const seen = new Set<string>();
  const dupes = ALL.map((e) => e.id).filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
  throw new Error(`Duplicate example ids: ${dupes.join(", ")}`);
}

export function getExamples(filter: ExampleFilter = {}): ExampleMeta[] {
  return ALL.filter((e) => {
    if (filter.category && e.category !== filter.category) return false;
    if (filter.featured !== undefined && (e.featured ?? false) !== filter.featured) return false;
    if (filter.indexable !== undefined && (e.indexable ?? true) !== filter.indexable) return false;
    return true;
  }).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export function getExample(id: string): ExampleMeta | undefined {
  return BY_ID.get(id);
}

export type { ExampleMeta, ExampleFilter, ExampleCategory } from "./types";
