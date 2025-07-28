import { NestableFilters, HasFilterValues } from "./match-filter-types";

export function matchFilters<
  T extends Record<string, any>,
  C extends NestableFilters<T>,
>(item: T, condition: C): item is T & HasFilterValues<T, C> {
  return Object.keys(condition).every((key) =>
    matchKey(condition[key as keyof C], item[key])
  );
}

export function asFilterMatch<
  T extends Record<string, any>,
  C extends NestableFilters<T>,
>(item: T, condition: C): T & HasFilterValues<T, C> {
  if (matchFilters(item, condition)) {
    return item;
  }
  throw new Error("not a match");
}

export function matchKey<T>(keyOrKeys: T | T[] | undefined, value: T) {
  if (keyOrKeys === undefined) {
    return true;
  }
  return Array.isArray(keyOrKeys)
    ? keyOrKeys.includes(value)
    : keyOrKeys === value;
}

type ChangeFilterTuple = [type?: string, from?: string, to?: string];
export function getFilter(
  parts:
    | ChangeFilterTuple
    | [filter: { type?: string; from?: string; to?: string }]
): [type?: string, from?: string, to?: string] {
  if (parts.length === 1 && typeof parts[0] === "object") {
    const filter = parts[0];
    return [filter.type, filter.from, filter.to];
  }
  return parts as any;
}
