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
  type ParamsOf<N extends RouteName> = Parameters<ReturnType<typeof defineRoutes>[N]["to"]>[0] extends undefined
    ? {}
    : NonNullable<Parameters<ReturnType<typeof defineRoutes>[N]["to"]>[0]>;

  const defs = defineRoutes(patterns);

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
  type LayoutComponentProps = { children?: React.ReactNode; route: { name: RouteName; params: any } };
  type LayoutMap = { [K in RouteName]?: React.ComponentType<LayoutComponentProps> };
  const LayoutsContext = createContext<LayoutMap>({});

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

  type RoutePropsElement = { name: RouteName; element: React.ReactNode };
  type RoutePropsView<N extends RouteName = RouteName> = { name: N; view: React.ComponentType<{ params: ParamsOf<N> }> };
  type RouteProps = RoutePropsElement | RoutePropsView;

  const Route: React.FC<RouteProps> = () => null;
  const Outlet: React.FC = () => null;

  const Routes: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { to } = useRouterContext();
    const layouts = useContext(LayoutsContext);
    if (!to) return null;

    const list = React.Children.toArray(children) as React.ReactElement<RouteProps>[];

    const renderFor = (name: RouteName, params: any): React.ReactNode => {
      const found = list.find((c) => React.isValidElement(c) && c.props.name === name);
      if (!found) return null;
      const p = found.props as any;
      if (p.element) return p.element;
      if (p.view) {
        const V = p.view as React.ComponentType<any>;
        return <V params={params} />;
      }
      return null;
    };

    const wrapWithLayouts = (
      lx: LayoutMap,
      name: RouteName,
      params: any,
      node: React.ReactNode
    ): React.ReactNode => {
      const keys = Object.keys(lx) as RouteName[];
      const matches = keys
        .filter((k) => {
          if (name === k) return true;
          if (!name.startsWith(k)) return false;
          const next = name.charAt(k.length);
          return /[A-Z]/.test(next);
        })
        .sort((a, b) => a.length - b.length);
      if (matches.length === 0) return node;
      return matches.reduce((acc, k) => {
        const L = lx[k]! as React.ComponentType<LayoutComponentProps>;
        return React.createElement(L, { route: { name, params } }, acc);
      }, node);
    };

    const body = renderFor(to.name as RouteName, to.params);
    if (!body) return null;
    return wrapWithLayouts(layouts, to.name as RouteName, to.params, body);
  };

  const Link: React.FC<{ name: RouteName; params?: any; children?: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({ name, params, children, ...a }) => {
    const { defs, history } = useRouterContext();
    const path = (defs as any).toPath ? (defs as any).toPath(name, params) : (defs as any).buildPath(name, params);
    const href = useHash ? `${base}#${path}` : `${base}${path}`;
    return (
      <a
        {...a}
        href={href}
        onClick={(e) => {
          // Prevent native hash navigation and rely on our store/history
          e.preventDefault();
          e.stopPropagation();
          history.push(path);
        }}
      >
        {children ?? href}
      </a>
    );
  };

  // Debug helper: exposes raw store change/state and derived matches
  function useRoutingDebug() {
    const { store, defs } = useRouterContext();
    const change = (store as any).getChange?.();
    const state = store.getState();
    const entry = state.stack[state.index] ?? null;
    const to = entry ? defs.matchPath(entry.path) : null;
    const from = null;
    return { change, state, fromEntry: null, toEntry: null, from, to } as any;
  }

  // Layouts: provider-only. Merge into context so Routes can apply per-view.
  const RouteLayouts: React.FC<{ layouts: LayoutMap; children?: React.ReactNode }>
    = ({ layouts, children }) => {
      const parent = useContext(LayoutsContext);
      const merged = { ...parent, ...layouts } as LayoutMap;
      return <LayoutsContext.Provider value={merged}>{children}</LayoutsContext.Provider>;
    };

  return { RouterProvider, useNavigation, useRoute, useRouter, Link, Routes, Route, Outlet, RouteLayouts, useRoutingDebug, routes: defs, defs, store, history };
}
