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

  const Routes: React.FC<{
    children?: React.ReactNode;
    viewer?: React.FC<_ViewerProps>;
    keep?: number;
    classNameBase?: string;
  }> = ({ children, viewer, keep, classNameBase }) => {
    const { to, defs, path, change } = useRouterContext();
    const prevToRef = React.useRef<RouteMatch<RouteName, any> | null>(null);

    // Track previous successful match for composing fromNode reliably.
    React.useLayoutEffect(() => {
      prevToRef.current = to;
    }, [path, to]);

    if (!to) return null;
    // Build name->node index and simple parent map from declared JSX
    type Node = React.ReactElement<RouteProps> & { props: RouteProps };
    const childArray = React.Children.toArray(children).filter(React.isValidElement) as Node[];
    const index = new Map<RouteName, Node>();
    const childSets = new Map<RouteName, Node[]>();
    const parentOf = new Map<RouteName, RouteName | undefined>();
    const walk = (nodes: Node[], parentName?: RouteName) => {
      for (const n of nodes) {
        const name = n.props.name as RouteName;
        index.set(name, n);
        parentOf.set(name, parentName);
        if (parentName) {
          const arr = childSets.get(parentName) ?? [];
          arr.push(n); childSets.set(parentName, arr);
        }
        const kids = React.Children.toArray(n.props.children || []).filter(React.isValidElement) as Node[];
        if (kids.length) walk(kids, name);
      }
    };
    walk(childArray);

    // Helper: shallow equal params
    const shallowEqual = (a: any, b: any) => {
      if (a === b) return true;
      if (!a || !b) return false;
      const ak = Object.keys(a), bk = Object.keys(b);
      if (ak.length !== bk.length) return false;
      for (const k of ak) if (String(a[k]) !== String((b as any)[k])) return false;
      return true;
    };

    // Chain helpers (prefer defs.matchAllPaths if provided)
    type ChainEntry = { name: RouteName; params: any };
    const getChain = (pathStr: string | undefined | null): ChainEntry[] => {
      if (!pathStr) return [];
      const mAll = (defs as any).matchAllPaths?.(pathStr) as Array<{ name: string; params: any }> | undefined;
      if (Array.isArray(mAll) && mAll.length) {
        // Map present names → params
        const present = new Map<RouteName, any>();
        for (const e of mAll as any as ChainEntry[]) present.set(e.name, e.params);
        // Pick deepest present name (no present descendants)
        const hasPresentDesc = (nm: RouteName): boolean => {
          const kids = childSets.get(nm) ?? [];
          for (const k of kids) {
            const kn = k.props.name as RouteName;
            if (present.has(kn)) return true;
            if (hasPresentDesc(kn)) return true;
          }
          return false;
        };
        let leaf: RouteName | null = null;
        for (const nm of present.keys()) {
          if (!hasPresentDesc(nm as RouteName)) { leaf = nm as RouteName; break; }
        }
        if (!leaf) {
          // Fallback: choose any present name deterministically
          for (const nm of present.keys()) { leaf = nm as RouteName; break; }
        }
        if (!leaf) return [];
        // Use leaf params for ancestors unless they have their own
        const chain: ChainEntry[] = [];
        let cur: RouteName | undefined = leaf;
        while (cur) {
          const params = present.get(cur) ?? present.get(leaf);
          chain.unshift({ name: cur, params });
          const p = parentOf.get(cur);
          if (!p) break;
          cur = p as RouteName;
        }
        return chain;
      }
      const m = defs.matchPath(pathStr) as RouteMatch<RouteName, any> | null;
      if (!m) return [];
      // Fallback: synthesize a chain by walking JSX-declared parents from the leaf
      const chain: ChainEntry[] = [];
      let nm = m.name as RouteName;
      while (true) {
        if (index.has(nm)) chain.unshift({ name: nm, params: m.params });
        const p = parentOf.get(nm);
        if (!p) break;
        nm = p as RouteName;
      }
      return chain;
    };
    const fromPath: string | undefined = (change?.from?.path ?? undefined) as any;
    const toPath: string = path;
    const fromChain = getChain(fromPath);
    const toChain = getChain(toPath);
    const toMap = new Map<RouteName, ChainEntry>(toChain.map(e => [e.name, e]));
    const fromMap = new Map<RouteName, ChainEntry>(fromChain.map(e => [e.name, e]));

    // Render a subtree for a given root using the specified chain/map (from or to)
    const renderSubtree = (rootName: RouteName, useFrom: boolean): React.ReactNode => {
      const m = (useFrom ? fromMap : toMap).get(rootName);
      // If this branch is not present in the chosen context, do not render it
      if (!m) return null;
      const n = index.get(rootName);
      if (!n) return null;
      const p: any = n.props;
      const V = p.view as React.ComponentType<any> | undefined;
      const childrenOf = childSets.get(rootName) ?? [];
      let childOut: React.ReactNode | undefined;
      // follow next child that exists in the chosen map
      for (const cn of childrenOf) {
        const cnName = cn.props.name as RouteName;
        if ((useFrom ? fromMap : toMap).has(cnName)) {
          childOut = renderSubtree(cnName, useFrom);
          break;
        }
        // support index route
        if ((cn.props as any)?.index === true && !childOut) {
          childOut = renderSubtree(cnName, useFrom);
          break;
        }
      }
      if (V) return <V {...((m?.params) || {})}>{childOut}</V>;
      if (p.element) return p.element;
      return childOut ?? null;
    };

    // Route render with optional viewer at pivot
    const renderRoute = (name: RouteName): React.ReactNode => {
      const n = index.get(name);
      if (!n) return null;
      const p: any = n.props;
      const childrenOf = childSets.get(name) ?? [];
      // Helper: does any descendant of 'name' exist in the toMap?
      const hasToDescendant = (root: RouteName): boolean => {
        const kids = childSets.get(root) ?? [];
        for (const k of kids) {
          const kName = k.props.name as RouteName;
          if (toMap.has(kName)) return true;
          if (hasToDescendant(kName)) return true;
        }
        return false;
      };
      // Determine pivot at this level
      const f = fromMap.get(name) || null;
      const t = toMap.get(name) || null;
      const enteringOrExiting = (!!f) !== (!!t);
      const paramsChanged = !!f && !!t && !shallowEqual(f.params, t.params);
      if (p.viewer) {
        const Viewer = p.viewer as React.FC<_ViewerProps>;
        const V = p.view as React.ComponentType<any> | undefined;
        const buildPath = (nm: RouteName, params: any) => ((defs as any).toPath ? (defs as any).toPath(nm, params) : (defs as any).buildPath(nm, params));
        const toInfo = t ? ({ key: `${String(t.name)}:${JSON.stringify(t.params ?? {})}`, name: String(t.name), params: t.params, path: buildPath(t.name, t.params) }) : null;
        const fromInfo = f ? ({ key: `${String(f.name)}:${JSON.stringify(f.params ?? {})}`, name: String(f.name), params: f.params, path: buildPath(f.name, f.params) }) : null;
        const direction: _Direction = mapDirection(change?.type);
        const fromNode = renderSubtree(name, true);
        const toNode = renderSubtree(name, false);
        return (
          <Viewer
            change={change}
            from={fromInfo}
            to={toInfo}
            fromNode={fromNode}
            toNode={toNode}
            direction={direction}
            keep={p.keep ?? keep}
            classNameBase={p.classNameBase ?? classNameBase}
          />
        );
      }
      // Not pivot: render single subtree using "to"
      const V = p.view as React.ComponentType<any> | undefined;
      // choose a child that exists in toMap or index
      let childOut: React.ReactNode | undefined;
      for (const cn of childrenOf) {
        const cnName = cn.props.name as RouteName;
        if (toMap.has(cnName) || hasToDescendant(cnName) || (cn.props as any)?.index === true) {
          childOut = renderRoute(cnName);
          break;
        }
      }
      if (V) return <V {...((toMap.get(name)?.params) || {})}>{childOut}</V>;
      if (p.element) return p.element;
      return childOut ?? null;
    };

    // Find the root-most declared Route present in the toChain and render from there
    let rootName: RouteName | null = null;
    for (const e of toChain) { if (index.has(e.name)) { rootName = e.name; break; } }
    if (!rootName) return null;
    // Walk up parents to the top declared ancestor
    while (true) {
      const parent = parentOf.get(rootName as RouteName);
      if (!parent) break;
      rootName = parent as RouteName;
    }
    return renderRoute(rootName as RouteName) as React.ReactElement;
    
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

  return { RouterProvider, useNavigation, useRoute, useRouter, Link, Routes, Route, Outlet, routes: defs, defs, store, history };
}
