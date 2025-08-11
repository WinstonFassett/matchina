// Minimal matchbox-style typed routes helper
// Produces route instances with { type, path, params, match(cases) }

export type ExtractParams<Path extends string> =
  Path extends `${string}:${infer P}/${infer Rest}`
    ? { [K in P | keyof ExtractParams<`/${Rest}`>]: string }
    : Path extends `${string}:${infer P}`
      ? { [K in P]: string }
      : {};

export type MatchCases<T extends string, P> =
  Partial<Record<T, (params: P) => any>> & { _: () => any };

export type RouteBox<Name extends string, Path extends string> = {
  type: Name;
  path: string;
  params: ExtractParams<Path>;
  match<R>(cases: MatchCases<Name, ExtractParams<Path>>): R;
};

export type RouteDef<Name extends string, Path extends string> = {
  name: Name;
  template: Path;
  to: (params: ExtractParams<Path>) => string;
  make: (params: ExtractParams<Path>) => RouteBox<Name, Path>;
  re: RegExp;
  keys: string[];
};

export type AnyRouteMap = Record<string, RouteDef<any, any>>;

function compile(template: string): { re: RegExp; keys: string[] } {
  const keys: string[] = [];
  const re = new RegExp(
    '^' +
      // Replace dynamic segments like ":id" but preserve the preceding slash
      template.replace(/\/:([^/]+)/g, (_m, k) => {
        keys.push(k); // push the param name without ':'
        return '/([^/]+)';
      }) +
      '$'
  );
  return { re, keys };
}

export function defineRouteBoxes<const Patterns extends Record<string, string>>(
  patterns: Patterns
) {
  const defs = {} as {
    [K in keyof Patterns & string]: RouteDef<K, Patterns[K]>;
  };

  for (const name in patterns) {
    const template = patterns[name];
    const { re, keys } = compile(template);

    const to = ((params: Record<string, string>) =>
      template.replace(/:([^/]+)/g, (_m, k) => {
        const v = params[k];
        if (v == null) throw new Error(`Missing param ${k} for ${template}`);
        return encodeURIComponent(String(v));
      })) as RouteDef<typeof name, typeof template>['to'];

    const make = ((params: any) => {
      const path = to(params);
      return {
        type: name,
        path,
        params,
        match(cases: any) {
          const fn = cases[name] ?? cases._;
          return fn(params);
        },
      };
    }) as RouteDef<typeof name, typeof template>['make'];

    defs[name as any] = { name: name as any, template, to, make, re, keys } as any;
  }

  function match(path: string) {
    for (const name in defs) {
      const def = defs[name];
      const m = path.match(def.re);
      if (m) {
        const params = Object.fromEntries(def.keys.map((k, i) => [k, m[i + 1]])) as any;
        return def.make(params);
      }
    }
    return null;
  }

  // Determine if a template is a prefix of the given path (by segments),
  // and if so, extract param values from those matched segments.
  function matchTemplatePrefix(template: string, path: string): { ok: true; params: Record<string, string>; segCount: number } | { ok: false } {
    const tSegs = template.split('/').filter(Boolean);
    const pSegs = path.split('/').filter(Boolean);
    if (tSegs.length > pSegs.length) return { ok: false };
    const params: Record<string, string> = {};
    for (let i = 0; i < tSegs.length; i++) {
      const t = tSegs[i];
      const p = pSegs[i];
      if (t.startsWith(':')) {
        const key = t.slice(1);
        if (!p) return { ok: false };
        params[key] = decodeURIComponent(p);
      } else {
        if (t !== p) return { ok: false };
      }
    }
    return { ok: true, params, segCount: tSegs.length };
  }

  // Return parent→child chain for a path, if the leaf exists.
  function matchAll(path: string) {
    // Ensure we have a leaf match; otherwise return null for consistency with guard/loader usage.
    const leaf = match(path);
    if (!leaf) return null;
    // Collect all defs whose template is a prefix of the path.
    const items = Object.values(defs)
      .map((def) => {
        const m = matchTemplatePrefix(def.template, path);
        return m.ok ? { def, segCount: m.segCount, params: m.params } : null;
      })
      .filter((x): x is { def: RouteDef<any, any>; segCount: number; params: Record<string, string> } => !!x)
      // Order by segment count ascending to get parent→child
      .sort((a, b) => a.segCount - b.segCount);
    // Build boxes in order; only include those that are true prefixes culminating in the leaf type
    const chain = items.map(({ def, params }) => def.make(params));
    return chain as RouteBox<string, string>[];
  }

  const routes = Object.fromEntries(
    Object.entries(defs).map(([name, def]) => [
      name,
      (params: any) => def.make(params),
    ])
  ) as {
    [K in keyof Patterns & string]: (
      params: ExtractParams<Patterns[K]>
    ) => RouteBox<K, Patterns[K]>;
  };

  return { routes, match, matchAll, defs };
}

// Convenience helpers for navigation composition
export function goto(box: RouteBox<string, string>, push: (path: string) => void) {
  push(box.path);
}
export function replaceWith(box: RouteBox<string, string>, replace: (path: string) => void) {
  replace(box.path);
}
