import { defineRoutes, type RouteMatch } from './define-routes';
import { MatchboxImpl } from '../../matchbox-factory';

export type GuardV1 = (fullPath: string) => true | string | Promise<true | string>;
export type GuardV2<N extends string = string, P extends string = string> = (ctx: {
  fullPath: string;
  path: string;
  params: Record<string, unknown> | null;
  route: RouteMatch<N, P> | null;
  chain?: RouteMatch<N, P>[];
}) => true | string | Promise<true | string>;

export type LoaderV1 = (path: string, params: Record<string, unknown> | null) => void | Record<string, unknown> | Promise<void | Record<string, unknown>>;
export type LoaderV2<N extends string = string, P extends string = string> = (ctx: {
  path: string;
  params: Record<string, unknown> | null;
  route: RouteMatch<N, P> | null;
  chain?: RouteMatch<N, P>[];
}) => void | Record<string, unknown> | Promise<void | Record<string, unknown>>;

export function createRouteMatchbox<const Patterns extends Record<string, string>>(patterns: Patterns, opts?: {
  base?: string;
  useHash?: boolean;
  guard?: GuardV1;
  loader?: LoaderV1;
  guardV2?: GuardV2<keyof Patterns & string, Patterns[keyof Patterns] & string>;
  loaderV2?: LoaderV2<keyof Patterns & string, Patterns[keyof Patterns] & string>;
}) {
  type Names = keyof Patterns & string;
  const routes = defineRoutes(patterns);
  const base = opts?.base ?? '';
  const useHash = opts?.useHash ?? false;

  const normalize = (p: string) => (p.startsWith('/') ? p : `/${p}`);
  const strip = (s: string) => {
    const q = s.indexOf('?');
    const h = s.indexOf('#');
    let end = s.length;
    if (q !== -1) end = Math.min(end, q);
    if (h !== -1) end = Math.min(end, h);
    const core = s.slice(0, end) || '/';
    return core;
  };
  const fromLocation = () => {
    if (typeof window === 'undefined') return '/';
    if (useHash) {
      const hash = window.location.hash || '#';
      const raw = hash.slice(1) || '/';
      return normalize(raw);
    }
    const raw = window.location.pathname + window.location.search + window.location.hash;
    return base && raw.startsWith(base) ? raw.slice(base.length) || '/' : raw;
  };

  async function resolve(fullPath: string) {
    const path = strip(fullPath);
    const inst = routes.match(path) as RouteMatch<Names, any> | null;
    const chain = (routes as any).matchAll(path) as RouteMatch<Names, any>[];

    if (opts?.guardV2 || opts?.guard) {
      const allow = opts?.guardV2
        ? await opts.guardV2({ fullPath: fullPath, path, params: inst?.params ?? null, route: inst, chain })
        : await opts!.guard!(fullPath);
      if (typeof allow === 'string') return new MatchboxImpl('redirect', { to: allow });
    }

    let params: Record<string, unknown> | null = inst?.params ?? null;
    if (opts?.loaderV2 || opts?.loader) {
      const extra = opts?.loaderV2
        ? await opts.loaderV2({ path, params, route: inst, chain })
        : await opts!.loader!(path, params);
      if (extra && typeof extra === 'object') params = { ...(params ?? {}), ...extra };
    }

    if (!inst) return new MatchboxImpl('unmatched', { reason: 'no-match' });
    return new MatchboxImpl('matched', { match: { ...inst, params }, chain });
  }

  return {
    patterns,
    routes,
    to: <N extends Names>(name: N, params?: any) => routes[name].to(params),
    match: (path: string) => routes.match(path) as RouteMatch<Names, any> | null,
    matchAll: (path: string) => (routes as any).matchAll(path) as RouteMatch<Names, any>[],
    resolve,
    fromLocation,
  } as const;
}
