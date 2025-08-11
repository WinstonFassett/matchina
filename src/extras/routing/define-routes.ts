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
  // use SOME stuff from our lib ok!
}
