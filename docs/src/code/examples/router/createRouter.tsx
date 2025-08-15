import { defineRoutes, type RouteMatch } from "@lib/src/extras/routing/define-routes";
import { createRouterStore } from "@lib/src/router-store";
import { createBrowserHistoryAdapter } from "@lib/src/router-history";
import { useMachine } from "matchina/react";
import React, { createContext, useContext } from "react";
import type { Direction as _Direction } from "./viewers";

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
    fromPath: string; // previous path from last change
    navDir: _Direction; // computed per navigation, stable for this render
  };

  const RouterContext = createContext<Ctx | null>(null);
  // Discriminated union per route name so TS narrows `view` props based on `name`
  type RouteProps = {
    [K in RouteName]:
      | ({ name: K } & { element: React.ReactNode; children?: React.ReactNode; index?: boolean; viewer?: React.FC<any>; keep?: number; classNameBase?: string })
      | ({ name: K } & { view: React.ComponentType<ParamsOf<K>>; children?: React.ReactNode; index?: boolean; viewer?: React.FC<any>; keep?: number; classNameBase?: string })
  }[RouteName];

  const RouterProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    useMachine(store);
    React.useEffect(() => { history.start(); }, []);

    // Derive current and previous routes synchronously in the same render
    const change = store.getChange?.() ?? null;
    const state = store.getState();
    const path = (state as any).path ?? "";
    const prevPathRef = React.useRef<string>("");
    const prevIdxRef = React.useRef<number>(-1);
    const prevPath = prevPathRef.current;
    if (path && prevPathRef.current !== path) {
      // Update ref immediately so next render reflects this path as previous
      prevPathRef.current = path;
    }
    const to = path ? (defs.matchPath(path) as RouteMatch<RouteName, any> | null) : null;
    // Prefer previous path from the store change (handles rapid multi-push correctly)
    const changePrevPath = (change as any)?.fromPath || (change as any)?.from?.path || (change as any)?.prevPath || (change as any)?.previousPath || "";
    const effectivePrevPath = changePrevPath || prevPath;
    const from = effectivePrevPath ? (defs.matchPath(effectivePrevPath) as RouteMatch<RouteName, any> | null) : null;

    // Compute navigation direction using history.state.__vtIdx for POP
    const currIdx = (() => {
      const st: any = (typeof window !== 'undefined' ? window.history.state : null) || {};
      return typeof st.__vtIdx === 'number' ? (st.__vtIdx as number) : prevIdxRef.current;
    })();
    if (prevIdxRef.current === -1) {
      prevIdxRef.current = currIdx;
    }
    let navDir: _Direction;
    if (change?.type === 'pop') {
      navDir = currIdx < prevIdxRef.current ? 'back' : (currIdx > prevIdxRef.current ? 'forward' : 'replace');
    } else if (change?.type === 'replace') {
      navDir = 'replace';
    } else {
      navDir = 'forward';
    }
    // Update index ref after computing direction
    prevIdxRef.current = currIdx;

    const value: Ctx = { defs, history, store, from, to, base, useHash, change, path, fromPath: effectivePrevPath, navDir };
    // Debug: trace path and route resolution
    React.useEffect(() => {
      // eslint-disable-next-line no-console
      console.log('[RouterProvider]', { path, changeType: change?.type, navDir, to: to ? { name: (to as any).name, params: (to as any).params } : null });
    }, [path, change?.type, to?.name, navDir]);
    // No extra index/session maintenance needed; history adapter handles state
    return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
  };

  // Snapshot provider: lets callers render a subtree with a frozen router context value
  const RouterSnapshotProvider: React.FC<{ value: Ctx; children?: React.ReactNode }> = ({ value, children }) => {
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
    viewer?: React.FC<any>; // optional top-level viewer (lean viewer API)
    keep?: number;
    classNameBase?: string;
    views?: Record<string, React.ComponentType<any>>; // optional app-level view map
  }> = ({ children, viewer, keep, classNameBase, views }) => {
    const ctxAll = useRouterContext();
    const { change, to, from, fromPath, path, navDir } = ctxAll as any;
    if (!viewer) return null;
    const direction: _Direction = navDir;
    const TopV = viewer as React.FC<any>;

    // Determine if current match is within this level's scope
    const inScope = Boolean(to && views && (views as any)[to.name as any]);
    const prevInScope = Boolean(from && views && (views as any)[from.name as any]);
    // Build the auto child only when in-scope
    const autoChild = inScope && to && views
      ? React.createElement(views[to.name as any] as React.ComponentType<any>, { ...(to as any).params })
      : null;
    const prevAutoChild = prevInScope && from && views
      ? React.createElement(views[from.name as any] as React.ComponentType<any>, { ...(from as any).params })
      : null;

    // Compute current view identity at this level (component id)
    const currScopeKey = React.useMemo(() => {
      // Only derive when this level is in scope and a route exists
      if (!inScope || !to || !views) return null;
      const view = views[to.name as any] as React.ComponentType<any> | undefined;
      if (!view) return null;
      // IMPORTANT: Scope key is the resolved view identity only, so mapping multiple route names
      // to the same view does NOT trigger parent-level transitions on tab/param changes.
      const viewId = (view as any).displayName || (view as any).name || 'AnonymousView';
      // Include params.id in view key only when the resolved view is Product
      try {
        const id = (to as any)?.params?.id;
        if (viewId === 'Product' && (id ?? '') !== '') return `${viewId}:id=${String(id)}` as string;
      } catch { /* ignore */ }
      return viewId as string;
    }, [inScope, to, views]);
    // Compute previous view identity at this level synchronously from `from` route
    const prevScopeKeyFromRoute = React.useMemo(() => {
      if (!from || !views) return null;
      const view = views[from.name as any] as React.ComponentType<any> | undefined;
      if (!view) return null;
      const viewId = (view as any).displayName || (view as any).name || 'AnonymousView';
      try {
        const id = (from as any)?.params?.id;
        if (viewId === 'Product' && (id ?? '') !== '') return `${viewId}:id=${String(id)}` as string;
      } catch { /* ignore */ }
      return viewId as string;
    }, [from, views]);
    const scopeChanged = React.useMemo(() => {
      return Boolean(currScopeKey && prevScopeKeyFromRoute && currScopeKey !== prevScopeKeyFromRoute);
    }, [currScopeKey, prevScopeKeyFromRoute]);

    // If keep is not provided by caller, auto-derive it from scope change
    const effectiveKeep = keep ?? (scopeChanged ? 1 : 0);

    // Debug: log per-level routing/view resolution
    // eslint-disable-next-line no-console
    // console.log('[Routes]', {
    //   to: to ? { name: (to as any).name, params: (to as any).params } : null,
    //   viewKeys: views ? Object.keys(views) : [],
    //   inScope,
    //   currScopeKey,
    //   prevScopeKey: prevScopeKeyRef.current,
    //   scopeChanged,
    //   effectiveKeep,
    // });

    // Legacy viewer support (unused by RTGViewer): remove prevChildren/prevCtx

    // Let the viewer control rendering via a render function
    const renderView = React.useCallback(() => (
      <>
        {autoChild}
        {children}
      </>
    ), [autoChild, children]);

    return (
      <TopV
        direction={direction}
        keep={effectiveKeep}
        classNameBase={classNameBase}
        viewKey={currScopeKey ?? undefined}
        renderView={renderView as any}
      />
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
          if (!path) return;
          e.preventDefault();
          e.stopPropagation();
          history.push(path);
        }}
      >
        {children ?? href}
      </a>
    );
  };


  // Helper: map store change type to direction hint
  function mapDirection(t?: string): _Direction {
    if (t === "pop") return "back";
    if (t === "push") return "forward";
    return "replace";
  }

  // Expose a readability alias for Routes when used as a view-owned level
  return { RouterProvider, RouterSnapshotProvider, useNavigation, useRoute, useRouter, Link, Routes, RouteLevel: Routes, Route, Outlet, routes: defs, defs, store, history };
}
