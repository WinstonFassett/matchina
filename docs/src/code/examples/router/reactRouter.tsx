import { defineRoutes, type RouteMatch } from "@lib/src/extras/routing/define-routes";
import { createRouterStore } from "@lib/src/router-store";
import { createBrowserHistoryAdapter } from "@lib/src/router-history";
import { useMachine } from "matchina/react";
import React, { createContext, useContext } from "react";

export function createReactRouter<const Patterns extends Record<string, string>>(
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
  };

  const RouterContext = createContext<Ctx | null>(null);
  // Discriminated union per route name so TS narrows `view` props based on `name`
  type RouteProps = {
    [K in RouteName]:
      | ({ name: K } & { element: React.ReactNode })
      | ({ name: K } & { view: React.ComponentType<ParamsOf<K>> })
  }[RouteName];

  const RouterProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    useMachine(store);
    React.useEffect(() => { history.start(); }, []);

    // Derive current route from router-store stack/index
    const change = store.getChange?.() ?? null;
    const state = store.getState();
    const entry = state.stack[state.index] ?? null;
    const to = entry ? (defs.matchPath(entry.path) as RouteMatch<RouteName, any> | null) : null;
    const from = null; // no transition logic in the simplified adapter

    const value: Ctx = { defs, history, store, from, to, base, useHash, change };
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

  const Routes: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { to } = useRouterContext();
    if (!to) return null;

    const list = React.Children.toArray(children) as React.ReactElement<RouteProps>[];

    const renderFor = (name: RouteName, params: any): React.ReactNode => {
      const found = list.find((c) => React.isValidElement(c) && c.props.name === name);
      if (!found) return null;
      const p = found.props as any;
      if (p.element) return p.element;
      if (p.view) {
        const V = p.view as React.ComponentType<any>;
        return <V {...(params || {})} />;
      }
      return null;
    };

    const body = renderFor(to.name as RouteName, to.params);
    if (!body) return null;
    return body;
  };

  type LinkProps = ({ [K in RouteName]: { name: K; params?: ParamsOf<K> } }[RouteName]) &
    { children?: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>;
  const Link: React.FC<LinkProps> = ({ name, params, children, ...a }) => {
    const { defs, history } = useRouterContext();
    const path = (defs as any).toPath ? (defs as any).toPath(name, params) : (defs as any).buildPath(name, params);
    const href = useHash ? `${base}#${path}` : `${base}${path}`;
    return (
      <a
        {...a}
        href={href}
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
          history.push(path);
        }}
      >
        {children ?? href}
      </a>
    );
  };
  
  return { RouterProvider, useNavigation, useRoute, useRouter, Link, Routes, Route, Outlet, routes: defs, defs, store, history };
}
