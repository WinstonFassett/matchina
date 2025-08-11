import React, { createContext, useContext } from "react";
import { defineRoutes, type RouteMatch } from "@lib/src/extras/routing/define-routes";
import { createStoreMachine } from "@lib/src/store-machine";
import { useMachine } from "@lib/src/integrations/react";

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

  // Helper to read/write URL
  const toUrl = (path: string) => (useHash ? `${base}#${path}` : `${base}${path}`);
  const getPath = () => {
    if (useHash) {
      const raw = (typeof window !== 'undefined' ? window.location.hash : '') || '#/';
      return raw.slice(1) || '/';
    }
    if (typeof window !== 'undefined') {
      const raw = window.location.pathname + window.location.search + window.location.hash;
      // base already included in pathname; normalize by stripping base
      return raw.startsWith(base) ? raw.slice(base.length) || '/' : raw || '/';
    }
    return '/';
  };

  // Always use store-machine single-commit router for the demo
  const store = createStoreMachine({ path: getPath() }, {
    push: (path: string) => () => ({ path }),
    replace: (path: string) => () => ({ path }),
    redirect: (path: string) => () => ({ path }),
  });

  const history = {
    start() {
      // Sync from current location once (replace to align)
      const p = getPath();
      store.dispatch('replace', p);
      if (typeof window !== 'undefined') {
        const onPop = () => {
          const p = getPath();
          store.dispatch('replace', p);
        };
        window.addEventListener('popstate', onPop);
        if (useHash) window.addEventListener('hashchange', onPop);
      }
    },
    push(path: string) {
      if (typeof window !== 'undefined') window.history.pushState({}, '', toUrl(path));
      store.dispatch('push', path);
    },
    replace(path: string) {
      if (typeof window !== 'undefined') window.history.replaceState({}, '', toUrl(path));
      store.dispatch('replace', path);
    },
    redirect(path: string) {
      if (typeof window !== 'undefined') window.history.replaceState({}, '', toUrl(path));
      store.dispatch('redirect', path);
    },
    back() { if (typeof window !== 'undefined') window.history.back(); },
    current() { return { path: store.getState().path } as any; },
  } as const;

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

  const RouterProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    useMachine(store);
    React.useEffect(() => { history.start(); }, []);

    // Derive from/to from last change (atomic). Fallback to current state for initial paint.
    const change = store.getChange?.() ?? null;
    const state = store.getState();
    // Derive strictly from the store's atomic change snapshots (single-state: { path })
    const from = change?.from?.path ? (defs.matchPath(change.from.path) as RouteMatch<RouteName, any> | null) : null;
    const to = (change?.to?.path ? defs.matchPath(change.to.path) : defs.matchPath(state.path)) as RouteMatch<RouteName, any> | null;

    if (change) {
      // eslint-disable-next-line no-console
      console.debug("[router.change]", { type: change.type, from: change.from, to: change.to });
    }
    // eslint-disable-next-line no-console
    console.debug("[router.state]", state);

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
    const { from, to } = useRouterContext();
    if (!to) return null;
    const list = React.Children.toArray(children) as React.ReactElement<RouteProps>[];

    const renderFor = (name: RouteName, params: any): React.ReactNode => {
      const found = list.find((c) => React.isValidElement(c) && c.props.name === name);
      if (!found) return null;
      const p = found.props as any;
      if (p.element) return p.element;
      if (p.view) { const V = p.view as React.ComponentType<any>; return <V params={params} />; }
      return null;
    };

    const differ = !!from && (from.name !== to.name || JSON.stringify(from.params) !== JSON.stringify(to.params));
    if (differ) {
      const oldKey = `${String(from!.name)}:${JSON.stringify(from!.params || {})}`;
      const newKey = `${String(to.name)}:${JSON.stringify(to.params || {})}`;
      return (
        <div data-router-parallel>
          <div key={`old:${oldKey}`} className="view" aria-hidden>
            {renderFor(from!.name as RouteName, from!.params)}
          </div>
          <div key={`new:${newKey}`} className="view">
            {renderFor(to.name as RouteName, to.params)}
          </div>
        </div>
      );
    }

    const single = renderFor(to.name as RouteName, to.params);
    return single ? <>{single}</> : null;
  };

  const Link: React.FC<{ name: RouteName; params?: any; children?: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({ name, params, children, ...a }) => {
    const { defs, base, useHash } = useRouterContext();
    const path = (defs as any).toPath(name, params);
    const href = useHash ? `${base}#${path}` : `${base}${path}`;
    const nav = useNavigation();
    const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      nav.goto(name as any, params as any)();
    };
    return <a href={href} onClick={onClick} {...a}>{children}</a>;
  };

  // Debug helper: exposes raw store change/state and derived matches
  function useRoutingDebug() {
    const { store, defs } = useRouterContext();
    const change = (store as any).getChange?.();
    const state = store.getState();
    const fromEntry = change ? change.from.stack[change.from.index] ?? null : null;
    const toEntry = change ? change.to.stack[change.to.index] ?? null : null;
    const from = fromEntry ? defs.matchPath(fromEntry.path) : null;
    const to = toEntry ? defs.matchPath(toEntry.path) : null;
    return { change, state, fromEntry, toEntry, from, to };
  }

  // Layouts: no-op passthrough for now (kept for API parity)
  const RouteLayouts: React.FC<{ layouts: { [K in RouteName]?: React.ComponentType<any> }; children?: React.ReactNode }> = ({ children }) => <>{children}</>;

  return { RouterProvider, useNavigation, useRoute, useRouter, Link, Routes, Route, Outlet, RouteLayouts, useRoutingDebug, routes: defs, defs, store, history };
}
