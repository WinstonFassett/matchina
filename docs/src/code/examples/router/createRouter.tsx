import { defineRoutes, type RouteMatch } from "@lib/src/extras/routing/define-routes";
import { createRouterStore } from "@lib/src/router-store";
import { createBrowserHistoryAdapter } from "@lib/src/router-history";
import { useMachine } from "matchina/react";
import React, { createContext, useContext } from "react";

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
      | ({ name: K } & { element: React.ReactNode; children?: React.ReactNode })
      | ({ name: K } & { view: React.ComponentType<ParamsOf<K>>; children?: React.ReactNode })
  }[RouteName];

  const RouterProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    useMachine(store);
    React.useEffect(() => { history.start(); }, []);

    // Derive current route from router-store stack/index
    const change = store.getChange?.() ?? null;
    const state = store.getState();
    const entry = state.stack[state.index] ?? null;
    const path = entry?.path ?? "";
    const to = entry ? (defs.matchPath(path) as RouteMatch<RouteName, any> | null) : null;
    const from = null; // no transition logic in the simplified adapter

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

  const Routes: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { to, defs, path } = useRouterContext();
    if (!to) return null;

    // Build a name->node map preserving nesting structure
    type Node = React.ReactElement<RouteProps> & { props: RouteProps };
    const childArray = React.Children.toArray(children).filter(React.isValidElement) as Node[];

    const index = new Map<RouteName, Node>();
    const childSets = new Map<RouteName, Node[]>();
    const parentOf = new Map<RouteName, RouteName | undefined>();

    const walk = (nodes: Node[], parentName?: RouteName) => {
      for (const n of nodes) {
        const name = n.props.name as RouteName;
        index.set(name, n);
        if (parentName) {
          const arr = childSets.get(parentName) ?? [];
          arr.push(n);
          childSets.set(parentName, arr);
        }
        // record parent chain for fallback composition
        parentOf.set(name, parentName);
        const kids = React.Children.toArray(n.props.children || []).filter(React.isValidElement) as Node[];
        if (kids.length) walk(kids, name);
      }
    };
    walk(childArray);

    const renderView = (node: Node, params: any, children?: React.ReactNode): React.ReactNode => {
      const p: any = node.props;
      if (p.view) {
        const V = p.view as React.ComponentType<any>;
        return <V {...(params || {})}>{children}</V>;
      }
      if (p.element) {
        // element nesting can't inject children safely; return as-is
        return p.element;
      }
      return null;
    };

    // If defs can provide a chain, compose nested views from leaf -> root
    const matches = (defs as any).matchAllPaths ? (defs as any).matchAllPaths(path) as RouteMatch<RouteName, any>[] : null;
    if (matches && matches.length) {
      // Compose from leaf upwards, only including levels declared in JSX
      let rendered: React.ReactNode = null;
      let topComposedName: RouteName | undefined = undefined;
      for (let i = matches.length - 1; i >= 0; i--) {
        const m = matches[i];
        const node = index.get(m.name as RouteName);
        if (!node) continue; // skip levels not declared in JSX
        rendered = renderView(node, m.params, rendered ?? undefined);
        if (topComposedName === undefined) topComposedName = m.name as RouteName;
      }
      // If chain didn't include parents (or JSX has extra layout parents), wrap those via parentOf
      if (topComposedName) {
        let currentName = topComposedName;
        while (true) {
          const parentName = parentOf.get(currentName);
          if (!parentName) break;
          const parentNode = index.get(parentName);
          if (!parentNode) break;
          rendered = renderView(parentNode, to.params, rendered);
          currentName = parentName;
        }
      }
      if (rendered != null) return rendered;
      // fallback continues below
    }

    // Fallback: compose via JSX-declared parent chain
    let currentName = to.name as RouteName;
    let currentNode = index.get(currentName);
    if (!currentNode) return null;
    let rendered: React.ReactNode = renderView(currentNode, to.params);
    // climb parents declared in JSX and wrap
    while (true) {
      const parentName = parentOf.get(currentName);
      if (!parentName) break;
      const parentNode = index.get(parentName);
      if (!parentNode) break;
      rendered = renderView(parentNode, to.params, rendered);
      currentName = parentName;
    }
    return rendered as React.ReactElement;
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
