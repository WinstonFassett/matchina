import { defineRoutes, type RouteMatch } from "@lib/src/extras/routing/define-routes";
import { createRouterStore } from "@lib/src/router-store";
import { createBrowserHistoryAdapter } from "@lib/src/router-history";
import { useMachine } from "matchina/react";
import React, { createContext, useContext } from "react";
import type { ViewerProps as _ViewerProps, Direction as _Direction } from "./viewers";

export function createRouter<const Patterns extends Record<string, string>>(
  patterns: Patterns,
  options?: {
    base?: string;
    useHash?: boolean;
    // guards/loaders intentionally omitted in demo single-commit mode
  }
) {
  type RouteName = keyof Patterns & string;
  const defs = defineRoutes(patterns);
  type Defs = typeof defs;
  // ParamsOf is derived from the concrete defs, so it preserves each route's exact param shape
  type ParamsOf<N extends RouteName> = Parameters<Defs[N]["to"]>[0] extends undefined
    ? {}
    : NonNullable<Parameters<Defs[N]["to"]>[0]>;

  // Auto base for hash mode if not provided
  const autoBase = () => (typeof window !== "undefined" ? (window.location.pathname || "").replace(/\/$/, "") : "");
  const useHash = options?.useHash ?? true;
  const base = options?.base ?? (useHash ? autoBase() : "");

  // Use library router store and browser history adapter
  const store = createRouterStore();
  const history = createBrowserHistoryAdapter(store, {
    base,
    useHash,
    matchPath: (path: string) => {
      const m = defs.matchPath(path) as RouteMatch<RouteName, any> | null;
      return (m ? (m.params as Record<string, unknown>) : null);
    },
    // Optional: provide a route chain if you later need loaders/guards per level
    // matchAllRoutes: (path: string) => defs.matchAllPaths?.(path) ?? null,
  });

  type Ctx = {
    defs: typeof defs;
    history: typeof history;
    store: typeof store;
    from: RouteMatch<RouteName, any> | null;
    to: RouteMatch<RouteName, any> | null;
    base: string;
    useHash: boolean;
    change: any | null;
    path: string; // current path from store entry

  };

  const RouterContext = createContext<Ctx | null>(null);
  // Discriminated union per route name so TS narrows `view` props based on `name`
  type RouteProps = {
    [K in RouteName]:
      | ({ name: K } & { element: React.ReactNode; children?: React.ReactNode; index?: boolean; viewer?: React.FC<_ViewerProps>; keep?: number; classNameBase?: string })
      | ({ name: K } & { view: React.ComponentType<ParamsOf<K>>; children?: React.ReactNode; index?: boolean; viewer?: React.FC<_ViewerProps>; keep?: number; classNameBase?: string })
  }[RouteName];

  const RouterProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    useMachine(store);
    React.useEffect(() => { history.start(); }, []);

    // Derive current route from router-store stack/index
    const change = store.getChange?.() ?? null;
    // change.to.error
    const state = store.getState();
    const path = (state as any).path ?? "";
    const to = path ? (defs.matchPath(path) as RouteMatch<RouteName, any> | null) : null;
    const from = null; // from is provided to viewers via change.from below

    const value: Ctx = { defs, history, store, from, to, base, useHash, change, path };
    return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
  };

  function useRouterContext() {
    const ctx = useContext(RouterContext);
    if (!ctx) throw new Error("Router components must be used inside <RouterProvider>");
    return ctx;
  }

  function useNavigation() {
    const { history, defs } = useRouterContext();
    const toPath = <N extends RouteName>(name: N, params?: ParamsOf<N>) => (defs as any).toPath(name, params);
    const goto = <N extends RouteName>(name: N, params?: ParamsOf<N>) => () => history.push(toPath(name, params));
    const replace = <N extends RouteName>(name: N, params?: ParamsOf<N>) => () => history.replace(toPath(name, params));
    return { goto, replace, back: history.back };
  }

  // Expose full router context for power users (includes raw change and from/to)
  function useRouter() {
    return useRouterContext();
  }

  function useRoute() {
    const { to } = useRouterContext();
    return to;
  }

  const Route: React.FC<RouteProps> = () => null;
  const Outlet: React.FC = () => null;

  // Minimal data-only Routes: a tiny adapter you can nest anywhere.
  // - No child traversal. No chain resolution. Viewers own DOM.
  const Routes: React.FC<{
    children?: React.ReactNode;
    viewer?: React.FC<_ViewerProps>; // optional top-level viewer
    keep?: number;
    classNameBase?: string;
    views?: Record<string, React.ComponentType<any>>; // optional app-level view map
  }> = ({ children, viewer, keep, classNameBase, views }) => {
    const { change, to } = useRouterContext();
    if (!viewer) return null;
    const direction: _Direction = mapDirection(change?.type);
    const TopV = viewer as React.FC<_ViewerProps>;

    // Determine if current match is within this level's scope
    const inScope = Boolean(to && views && (views as any)[to.name as any]);
    // Build the auto child only when in-scope
    const autoChild = inScope && to && views
      ? React.createElement(views[to.name as any] as React.ComponentType<any>, { ...(to as any).params })
      : null;

    // Track previous stable scope key to detect local changes.
    // Key = effective view component identity only (ignore params).
    // Outer levels (e.g., site shell) won't render exits when only params change beneath them.
    const prevScopeKeyRef = React.useRef<string | null>(null);
    const currScopeKey = React.useMemo(() => {
      if (!inScope || !to || !views) return null;
      const view = views[to.name as any] as React.ComponentType<any> | undefined;
      if (!view) return null;
      const viewId = (view as any).displayName || (view as any).name || 'AnonymousView';
      return viewId as string;
    }, [inScope, to, views]);
    const scopeChanged = React.useMemo(() => {
      const prev = prevScopeKeyRef.current;
      return Boolean(currScopeKey && prev && currScopeKey !== prev);
    }, [currScopeKey]);
    React.useEffect(() => {
      if (currScopeKey) prevScopeKeyRef.current = currScopeKey;
    }, [currScopeKey]);

    // If keep is not provided by caller, auto-derive it from scope change
    const effectiveKeep = keep ?? (scopeChanged ? 1 : 0);

    const content = (
      <>
        {autoChild}
        {children}
      </>
    );
    return (
      <TopV change={change} direction={direction} keep={effectiveKeep} classNameBase={classNameBase} match={to as any}>
        {content}
      </TopV>
    );
  };


  type LinkProps = ({ [K in RouteName]: { name: K; params?: ParamsOf<K> } }[RouteName]) &
    { children?: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>;
  const Link: React.FC<LinkProps> = ({ name, params, children, ...a }) => {
    const { defs, history } = useRouterContext();
    let path: string | null = null;
    try {
      path = (defs as any).toPath ? (defs as any).toPath(name, params) : (defs as any).buildPath(name, params);
    } catch (e) {
      path = null;
    }
    const href = path ? (useHash ? `${base}#${path}` : `${base}${path}`) : '#';
    return (
      <a
        {...a}
        href={href}
        data-invalid-link={path ? undefined : 'missing-params'}
        onClick={(e) => {
          // Allow default for modified/middle/right clicks or non-self targets
          if (
            e.defaultPrevented ||
            e.button !== 0 ||
            (a.target && a.target !== "_self") ||
            e.metaKey || e.altKey || e.ctrlKey || e.shiftKey
          ) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          if (path) history.push(path);
        }}
      >
        {children ?? href}
      </a>
    );
  };


  // Helper: map store change type to direction hint
  function mapDirection(t?: string): _Direction {
    if (t === "pop") return "back";
    if (t === "replace") return "replace";
    return "forward";
  }

  // Expose a readability alias for Routes when used as a view-owned level
  return { RouterProvider, useNavigation, useRoute, useRouter, Link, Routes, RouteLevel: Routes, Route, Outlet, routes: defs, defs, store, history };
}
