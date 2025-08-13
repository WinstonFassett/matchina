import { defineRoutes, type RouteMatch } from "@lib/src/extras/routing/define-routes";
import { createRouterStore } from "@lib/src/router-store";
import { createBrowserHistoryAdapter } from "@lib/src/router-history";
import { useMachine } from "matchina/react";
import React, { createContext, useContext } from "react";
import type { ViewerProps as _ViewerProps, Direction as _Direction, RouteMatchInfo as _RouteMatchInfo, RouterChange as _RouterChange } from "./viewers";

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
      | ({ name: K } & { element: React.ReactNode; children?: React.ReactNode; index?: boolean })
      | ({ name: K } & { view: React.ComponentType<ParamsOf<K>>; children?: React.ReactNode; index?: boolean })
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

  const Routes: React.FC<{
    children?: React.ReactNode;
    viewer?: React.FC<_ViewerProps>;
    keep?: number;
    classNameBase?: string;
  }> = ({ children, viewer, keep, classNameBase }) => {
    const { to, defs, path, change } = useRouterContext();
    const prevToRef = React.useRef<RouteMatch<RouteName, any> | null>(null);
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
        // If no children provided, auto-render index child if present
        let content = children;
        if (content == null) {
          const maybeChildren = childSets.get(p.name as RouteName) ?? [];
          const indexChild = maybeChildren.find((c) => (c.props as any)?.index === true);
          if (indexChild) {
            content = renderView(indexChild as Node, params, undefined);
          }
        }
        return <V {...(params || {})}>{content}</V>;
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
      if (rendered != null) {
        // Top-level viewer support: also compute from-node and wrap when viewer provided
        if (viewer) {
          const toNode = rendered;
          const fromNode = renderFromViaChange();
          return renderWithViewer(fromNode, toNode);
        }
        return rendered;
      }
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
    if (viewer) {
      const toNode = rendered as React.ReactNode;
      const fromNode = renderFromViaChange();
      return renderWithViewer(fromNode, toNode) as React.ReactElement;
    }
    return rendered as React.ReactElement;

    // helper: compose a "from" node using change.from path and JSX-declared chain
    function renderFromViaChange(): React.ReactNode | null {
      const prev = getMatchFromState(change?.from ?? null) ?? prevToRef.current;
      if (!prev) return null;
      let nm = prev.name as RouteName;
      let node = index.get(nm);
      if (!node) return null;
      let out: React.ReactNode = renderView(node, prev.params);
      while (true) {
        const p = parentOf.get(nm);
        if (!p) break;
        const pn = index.get(p);
        if (!pn) break;
        out = renderView(pn, prev.params, out);
        nm = p;
      }
      return out;
    }

    function renderWithViewer(fromNode: React.ReactNode | null, toNode: React.ReactNode | null): React.ReactNode {
      const toInfo = to ? toInfoOf(to) : null;
      const fromMatch = getMatchFromState(change?.from ?? null) ?? prevToRef.current;
      const fromInfo = fromMatch ? toInfoOf(fromMatch) : null;
      const direction: _Direction = mapDirection(change?.type);
      const Viewer = viewer!;
      return (
        <Viewer
          change={{ type: change?.type ?? "replace", from: fromInfo, to: toInfo } as _RouterChange}
          from={fromInfo}
          to={toInfo}
          fromNode={fromNode}
          toNode={toNode}
          direction={direction}
          keep={keep}
          classNameBase={classNameBase}
        />
      );
    }

    // derive match from a RouterState-like snapshot
    function getMatchFromState(state: any): RouteMatch<RouteName, any> | null {
      if (!state) return null;
      // Simple shape: { path }
      let path: string | undefined = state.path as string | undefined;
      // Complex shape: { index, stack[] }
      if (!path && typeof state.index === "number" && Array.isArray(state.stack)) {
        const idx = state.index as number;
        path = idx >= 0 ? state.stack?.[idx]?.path : undefined;
      }
      if (!path) return null;
      return defs.matchPath(path) as RouteMatch<RouteName, any> | null;
    }
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
  
  // Helper: convert RouteMatch to RouteMatchInfo used by viewers
  function toInfoOf(m: RouteMatch<RouteName, any>): _RouteMatchInfo {
    const paramKey = JSON.stringify(m.params ?? {});
    const path = (defs as any).toPath ? (defs as any).toPath(m.name, m.params) : (defs as any).buildPath(m.name, m.params);
    return { key: `${String(m.name)}:${paramKey}`, name: String(m.name), params: m.params, path } as _RouteMatchInfo;
  }

  // Helper: map store change type to direction hint
  function mapDirection(t?: string): _Direction {
    if (t === "pop") return "back";
    if (t === "replace") return "replace";
    return "forward";
  }

  return { RouterProvider, useNavigation, useRoute, useRouter, Link, Routes, Route, Outlet, routes: defs, defs, store, history };
}
