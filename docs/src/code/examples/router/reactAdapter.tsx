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
    pop: (path: string) => () => ({ path }),
  });

  let suppressHash = 0;
  let navDir: 'forward' | 'back' = 'forward';
  let seq = 0; // navigation sequence index stored in history.state.__rseq
  const history = {
    start() {
      // Sync from current location once (replace to align)
      const p = getPath();
      store.dispatch('replace', p);
      if (typeof window !== 'undefined') {
        // Initialize or read sequence from history.state
        const st: any = window.history.state || {};
        if (typeof st.__rseq === 'number') {
          seq = st.__rseq;
        } else {
          try { window.history.replaceState({ ...st, __rseq: seq }, '', window.location.href); } catch {}
        }
        const onPop = () => {
          const p = getPath();
          // Determine direction by comparing sequence
          const stNow: any = window.history.state || {};
          const nextSeq = typeof stNow.__rseq === 'number' ? stNow.__rseq : seq;
          navDir = nextSeq < seq ? 'back' : 'forward';
          seq = nextSeq;
          store.dispatch('pop', p);
        };
        window.addEventListener('popstate', onPop);
        if (useHash) window.addEventListener('hashchange', (e) => {
          if (suppressHash > 0) { suppressHash--; return; }
          onPop();
        });
      }
    },
    push(path: string) {
      if (typeof window !== 'undefined') {
        suppressHash++;
        const st: any = window.history.state || {};
        seq += 1;
        try { window.history.pushState({ ...st, __rseq: seq }, '', toUrl(path)); } catch { window.history.pushState(st, '', toUrl(path)); }
      }
      navDir = 'forward';
      store.dispatch('push', path);
    },
    replace(path: string) {
      if (typeof window !== 'undefined') {
        suppressHash++;
        const st: any = window.history.state || {};
        try { window.history.replaceState({ ...st, __rseq: seq }, '', toUrl(path)); } catch { window.history.replaceState(st, '', toUrl(path)); }
      }
      navDir = 'forward';
      store.dispatch('replace', path);
    },
    redirect(path: string) {
      if (typeof window !== 'undefined') {
        suppressHash++;
        const st: any = window.history.state || {};
        try { window.history.replaceState({ ...st, __rseq: seq }, '', toUrl(path)); } catch { window.history.replaceState(st, '', toUrl(path)); }
      }
      navDir = 'forward';
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
  type LayoutComponentProps = { children?: React.ReactNode; route: { name: RouteName; params: any } };
  type LayoutMap = { [K in RouteName]?: React.ComponentType<LayoutComponentProps> };
  const LayoutsContext = createContext<LayoutMap>({});

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
    const { from, to, change } = useRouterContext();
    const layouts = useContext(LayoutsContext);
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const fromRef = React.useRef<HTMLDivElement | null>(null);
    const toRef = React.useRef<HTMLDivElement | null>(null);
    const [exiting, setExiting] = React.useState<typeof from | null>(null);
    const [activeKey, setActiveKey] = React.useState<string | null>(null);
    const processedKey = React.useRef<string | null>(null);
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
    // Wrap a node with matching layouts for a route name (outer->inner by specificity)
    const wrapWithLayouts = (lx: LayoutMap, name: RouteName, params: any, node: React.ReactNode): React.ReactNode => {
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
    // Decide whether to animate only the tab body (inner) or the whole card (outer)
    const isProductTab = (n: string) => n !== 'Products' && n.startsWith('Product');
    const sameProductId = (a: any, b: any) => JSON.stringify(a?.id ?? null) === JSON.stringify(b?.id ?? null);
    const shouldInnerOnly = (
      fromName: string | null,
      toName: string,
      fromParams: any | null,
      toParams: any,
    ) => {
      if (!fromName) return false;
      // Inner-only when navigating between Product* tabs for the same id
      return isProductTab(fromName) && isProductTab(toName) && sameProductId(fromParams, toParams);
    };

    // Inner mode: rely on the layout (e.g., ProductDetailLayout) to wrap its tab body with .transition-slide
    const renderWithLayouts_inner = (name: RouteName, params: any): React.ReactNode => {
      const body = renderFor(name, params);
      if (!body) return null;
      return wrapWithLayouts(layouts, name, params, body);
    };

    const renderWithLayouts_outer = (name: RouteName, params: any): React.ReactNode => {
      const body = renderFor(name, params);
      if (!body) return null;
      const wrapped = wrapWithLayouts(layouts, name, params, body);
      return <div className="transition-slide">{wrapped}</div>;
    };

    const differ = !!from && (from.name !== to.name || JSON.stringify(from.params) !== JSON.stringify(to.params));
    const innerOnly = shouldInnerOnly(from?.name ?? null, String(to.name), from?.params ?? null, to.params);

    // Start a CSS transition when a new atomic change arrives that differs
    React.useEffect(() => {
      if (!differ || !from) return;
      const oldKey = `${String(from.name)}:${JSON.stringify(from.params || {})}`;
      const newKey = `${String(to.name)}:${JSON.stringify(to.params || {})}`;
      const transKey = `${oldKey}=>${newKey}:${change?.type ?? ''}`;
      if (processedKey.current === transKey) return; // avoid double-run (e.g., React StrictMode)
      processedKey.current = transKey;
      setExiting(from);
      setActiveKey(`${oldKey}=>${newKey}`);

      // After paint, toggle classes Swup-style
      const frame = requestAnimationFrame(() => {
        const container = containerRef.current;
        const fromEl = fromRef.current;
        const toEl = toRef.current;
        if (!container || !fromEl || !toEl) return;
        container.setAttribute('data-router-parallel', '');
        container.setAttribute('data-from-name', String(from.name));
        container.setAttribute('data-to-name', String(to.name));
        const ctype = String(change?.type || 'push');
        container.setAttribute('data-type', ctype);
        container.setAttribute('data-dir', navDir);

        // Swup-like semantics
        // 1) Apply pre-states FIRST (no transitions yet) so initial paint is off-screen/hidden
        fromEl.classList.add('is-previous-container');
        toEl.classList.add('is-next-container');
        // 2) Force a reflow to commit pre-positioning before enabling transitions
        void toEl.getBoundingClientRect();
        // 3) Enable transitions on container
        container.classList.add('is-changing');
        // 4) Next frame, remove pre-enter class from next to start the transition (also reveals via CSS)
        requestAnimationFrame(() => {
          toEl.classList.remove('is-next-container');
        });

        // When both elements finish transitions/animations, clear exiting
        let doneCount = 0;
        const done = () => {
          doneCount += 1;
          if (doneCount >= 2) {
            container.classList.remove('is-changing');
            fromEl.classList.remove('is-previous-container');
            toEl.classList.remove('is-next-container');
            setExiting(null);
          }
        };
        const endEvents: (keyof HTMLElementEventMap)[] = ['transitionend', 'animationend'];
        endEvents.forEach((evt) => {
          fromEl.addEventListener(evt, done, { once: true });
          toEl.addEventListener(evt, done, { once: true });
        });
      });
      return () => cancelAnimationFrame(frame);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [change?.to, differ]);

    const oldKey = (exiting || from) ? `${String((exiting || from)!.name)}:${JSON.stringify((exiting || from)!.params || {})}` : null;
    const newKey = `${String(to.name)}:${JSON.stringify(to.params || {})}`;

    // Render both views immediately when they differ; keep 'exiting' cached until CSS ends
    if (exiting || differ) {
      return (
        <div
          ref={containerRef}
          className="router-transition"
          data-router-parallel
          data-transition-key={activeKey || ''}
          data-from-name={String(exiting?.name || from!.name)}
          data-to-name={String(to.name)}
          data-dir={navDir}
          data-type={String(change?.type || 'push')}
        >
          <div
            ref={fromRef}
            key={`old:${oldKey}`}
            className="view z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
            data-role="from"
            
          >
            {(innerOnly ? renderWithLayouts_inner : renderWithLayouts_outer)((exiting || from)!.name as RouteName, (exiting || from)!.params)}
          </div>
          <div
            ref={toRef}
            key={`new:${newKey}`}
            className="view z-20 is-next-container bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
            data-role="to"
          >
            {(innerOnly ? renderWithLayouts_inner : renderWithLayouts_outer)(to.name as RouteName, to.params)}
          </div>
        </div>
      );
    }

    // No active transition; render single view
    const single = renderWithLayouts_outer(to.name as RouteName, to.params);
    return single ? (
      <div className="view z-10 bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10">
        {single}
      </div>
    ) : null;
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
    const fromEntry = change ? change.from.stack[change.from.index] ?? null : null;
    const toEntry = change ? change.to.stack[change.to.index] ?? null : null;
    const from = fromEntry ? defs.matchPath(fromEntry.path) : null;
    const to = toEntry ? defs.matchPath(toEntry.path) : null;
    return { change, state, fromEntry, toEntry, from, to };
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
