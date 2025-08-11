import { compilePattern, type CompiledPattern, type ParamsOf, type RouteMatch } from './define-routes';
import { MatchboxImpl } from '../../matchbox-factory';

/**
 * RouteMatchbox: a matchbox-style instance tagged by route name that exposes
 * pattern metadata plus helpers to build and match paths.
 */
export type RouteMatchbox<Name extends string, Pattern extends string> = MatchboxImpl<
  Record<Name, { pattern: Pattern; compiled: CompiledPattern }>,
  Name
> & {
  to(params?: ParamsOf<Pattern>): string;
  /** true if path fully matches this pattern */
  testPath(path: string): boolean;
  /** match and extract params, or null */
  matchPath(path: string): RouteMatch<Name, Pattern> | null;
};

function buildPathFromPattern(pattern: string, params?: Record<string, string>) {
  if (!params) return pattern;
  return pattern.replace(/:([A-Za-z0-9_]+)/g, (_, k: string) => {
    const v = params[k];
    if (v == null) throw new Error(`Missing param :${k} for pattern ${pattern}`);
    return encodeURIComponent(String(v));
  });
}

/**
 * createRouteFactory: infer route Matchbox instances directly from a pattern map.
 * - Tag = route name (so you can .is('Product'))
 * - Data = { pattern, compiled }
 * - Methods: to(), test(), match()
 * - Aggregate helpers: to(name), match(path), matchAll(path), patterns
 */
export function createRouteFactory<const Patterns extends Record<string, string>>(patterns: Patterns) {
  type Names = keyof Patterns & string;

  const boxes = {} as { [K in Names]: RouteMatchbox<K, Patterns[K] & string> } & {
    to: <N extends Names>(name: N, params?: ParamsOf<Patterns[N] & string>) => string;
    match: (path: string) => RouteMatch<Names, Patterns[Names] & string> | null;
    matchAll: (path: string) => RouteMatch<Names, Patterns[Names] & string>[];
    patterns: Patterns;
  };

  const compiled = new Map<Names, CompiledPattern>();
  (Object.keys(patterns) as Names[]).forEach((name) => {
    const pattern = patterns[name] as string;
    const cp = compilePattern(pattern);
    compiled.set(name, cp);
    // Create a matchbox-tagged instance for this route
    const inst = new MatchboxImpl(name, { pattern, compiled: cp }) as RouteMatchbox<any, any>;
    // Attach helpers
    Object.assign(inst, {
      to: (params?: Record<string, string>) => buildPathFromPattern(pattern, params),
      test: (path: string) => !!cp.regex.exec(path),
      matchPath: (path: string) => {
        const m = cp.regex.exec(path);
        if (!m) return null;
        const params: Record<string, string> = {};
        cp.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
        return { name, path, params } as any;
      },
    } satisfies RouteMatchbox<any, any>);

    (boxes as any)[name] = inst;
  });

  function specificityScore(pattern: string): number {
    const segments = pattern.split('/').filter(Boolean);
    let staticCount = 0;
    let paramCount = 0;
    for (const s of segments) {
      if (s.startsWith(':')) paramCount++; else staticCount++;
    }
    return staticCount * 1000 - paramCount * 10 + pattern.length;
  }

  (boxes as any).to = (name: Names, params?: any) => (boxes as any)[name].to(params);

  (boxes as any).matchAll = (path: string) => {
    const entries = (Object.keys(patterns) as Names[])
      .map((n) => ({ n, cp: compiled.get(n)! }))
      .sort((a, b) => specificityScore(a.cp.pattern) - specificityScore(b.cp.pattern))
      .reverse();
    const matches: RouteMatch<Names, any>[] = [];
    for (const e of entries) {
      const m = e.cp.regex.exec(path);
      if (!m) continue;
      const params: Record<string, string> = {};
      e.cp.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      matches.push({ name: e.n, path, params } as any);
    }
    return matches;
  };

  (boxes as any).match = (path: string) => {
    const all = (boxes as any).matchAll(path) as RouteMatch<Names, any>[];
    return all[0] ?? null;
  };

  (boxes as any).patterns = patterns;

  return boxes;
}

// Alias for ergonomics: the "routeFactory" name mirrors user's mental model
export const routeFactory = createRouteFactory;
