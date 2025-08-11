/*
  Core, framework-agnostic routing utilities for Matchina extras.
  - defineRoutes(): create typed route boxes from pattern map
  - buildPath(): build URL from route name + params
  - match(): match a single route by name against a path
  - matchAll(): resolve all matching routes against a path (ordered by pattern specificity)

  Notes
  - Patterns support dynamic segments like /products/:id
  - No wildcard/glob support yet; keep it simple and predictable
  - Param values are strings; adapters can coerce further
*/

// Extract param names from a pattern like "/products/:id/specs/:tab"
export type ParamName<S extends string> =
  S extends `${string}:${infer P}/${infer Rest}`
    ? P | ParamName<`/${Rest}`>
    : S extends `${string}:${infer P}`
      ? P
      : never;

export type ParamsOf<S extends string> = ParamName<S> extends never
  ? {}
  : Record<Extract<ParamName<S>, string>, string>;

export type RouteMatch<Name extends string, Pattern extends string> = {
  name: Name;
  path: string;
  params: ParamsOf<Pattern>;
};

export type CompiledPattern = {
  pattern: string;
  keys: string[];
  regex: RegExp;
};

function escapeRegex(lit: string): string {
  return lit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Compile a route pattern to a regex and capture keys
export function compilePattern(pattern: string): CompiledPattern {
  const keys: string[] = [];
  // Special-case root
  if (pattern === "/") {
    return { pattern, keys, regex: /^\/$/ };
  }
  const parts = pattern.split("/").filter(Boolean);
  const compiled = parts
    .map((segment) => {
      if (segment.startsWith(":")) {
        const key = segment.slice(1);
        keys.push(key);
        return "([^/]+)"; // capture until next slash
      }
      return escapeRegex(segment);
    })
    .join("/");

  // Ensure full match from start to end
  const source = compiled ? `^/${compiled}$` : `^\/$`;
  const regex = new RegExp(source);
  return { pattern, keys, regex };
}

// A single typed route definition
export type RouteBox<Name extends string, Pattern extends string> = {
  name: Name;
  pattern: Pattern;
  compiled: CompiledPattern;
  to: (params?: ParamsOf<Pattern>) => string;
  match: (path: string) => RouteMatch<Name, Pattern> | null;
};

function buildPathFromPattern(pattern: string, params: Record<string, string> | undefined): string {
  if (!params) return pattern;
  return pattern.replace(/:([A-Za-z0-9_]+)/g, (_, k: string) => {
    const v = params[k];
    if (v == null) throw new Error(`Missing param :${k} for pattern ${pattern}`);
    return encodeURIComponent(String(v));
  });
}

export function buildPath<Patterns extends Record<string, string>, const N extends keyof Patterns & string>(
  name: N,
  patterns: Patterns,
  params?: ParamsOf<Patterns[N] & string>
): string {
  const pattern = patterns[name];
  if (!pattern) throw new Error(`Unknown route name: ${String(name)}`);
  return buildPathFromPattern(pattern, params as any);
}

// Utility to score specificity: more static segments wins, fewer params wins, longer pattern wins
function specificityScore(pattern: string): number {
  const segments = pattern.split("/").filter(Boolean);
  let staticCount = 0;
  let paramCount = 0;
  for (const s of segments) {
    if (s.startsWith(":")) paramCount++; else staticCount++;
  }
  return staticCount * 1000 - paramCount * 10 + pattern.length;
}

export function defineRoutes<const Patterns extends Record<string, string>>(patterns: Patterns) {
  type Names = keyof Patterns & string;

  const compiledMap = new Map<Names, CompiledPattern>();
  const boxes = {} as { [K in Names]: RouteBox<K, Patterns[K] & string> } & {
    toPath: <N extends Names>(name: N, params?: ParamsOf<Patterns[N] & string>) => string;
    matchPath: (path: string) => RouteMatch<Names, Patterns[Names] & string> | null;
    matchAllPaths: (path: string) => RouteMatch<Names, Patterns[Names] & string>[];
    // Legacy aliases (kept defined to avoid breaking existing imports)
    to: <N extends Names>(name: N, params?: ParamsOf<Patterns[N] & string>) => string;
    match: (path: string) => RouteMatch<Names, Patterns[Names] & string> | null;
    matchAll: (path: string) => RouteMatch<Names, Patterns[Names] & string>[];
    patterns: Patterns;
  };

  // Build boxes per route name
  (Object.keys(patterns) as Names[]).forEach((name) => {
    const pattern = patterns[name] as string;
    const compiled = compilePattern(pattern);
    compiledMap.set(name, compiled);

    const box: RouteBox<any, any> = {
      name,
      pattern: pattern as any,
      compiled,
      to: (params?: Record<string, string>) => buildPathFromPattern(pattern, params),
      match: (path: string) => {
        const m = compiled.regex.exec(path);
        if (!m) return null;
        const params: Record<string, string> = {};
        compiled.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
        return { name, path, params } as any;
      },
    };

    (boxes as any)[name] = box;
  });

  // Helper: build path by route name
  (boxes as any).toPath = (name: Names, params?: any) => buildPath(name, patterns, params as any);
  // Legacy alias
  (boxes as any).to = (name: Names, params?: any) => (boxes as any).toPath(name, params);

  // Helper: match all by decreasing specificity
  (boxes as any).matchAllPaths = (path: string) => {
    const entries = (Object.keys(patterns) as Names[])
      .map((name) => ({ name, compiled: compiledMap.get(name)! }))
      .sort((a, b) => specificityScore(a.compiled.pattern) - specificityScore(b.compiled.pattern))
      .reverse();

    const matches: RouteMatch<Names, any>[] = [];
    for (const e of entries) {
      const m = e.compiled.regex.exec(path);
      if (!m) continue;
      const params: Record<string, string> = {};
      e.compiled.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      matches.push({ name: e.name, path, params } as any);
    }
    return matches;
  };

  // Helper: best single match (most specific first)
  (boxes as any).matchPath = (path: string) => {
    const all = (boxes as any).matchAllPaths(path) as RouteMatch<Names, any>[];
    return all[0] ?? null;
  };
  // Legacy aliases
  (boxes as any).matchAll = (path: string) => (boxes as any).matchAllPaths(path);
  (boxes as any).match = (path: string) => (boxes as any).matchPath(path);

  (boxes as any).patterns = patterns;

  return boxes;
}

// Alias to avoid multiple concepts in the public API; prefer defineRoutes
export const createRouteBoxes = defineRoutes;
