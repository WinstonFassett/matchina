import { defineRoutes, type RouteMatch } from "@lib/src/extras/routing/define-routes";
import { createStoreMachine } from "@lib/src/store-machine";
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
//#region from transition branch. externalize this
    // Start history once on mount (align store with URL)
    React.useEffect(() => {
      history.start();
    }, []);

    // const snap = store.getState();
    // const scrollRef = React.useRef<NavScroll | null>(null);
    // const getPrimaryContainer = () =>
    //   options?.scroll?.getContainer?.() ??
    //   (options?.scroll?.selector ? document.querySelector(options.scroll.selector) : null);
    // // Memory of scroll positions per-location for containers
    // const scrollMemory = React.useRef<Map<string, { top: number; left: number }>>(new Map());
    // const locationKey = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;
    // const containerKey = (id: string) => `${id}::${locationKey()}`;
    // const readPos = (el: Element | Window) => ({
    //   top: el instanceof Window ? el.scrollY : (el as HTMLElement).scrollTop,
    //   left: el instanceof Window ? el.scrollX : (el as HTMLElement).scrollLeft,
    // });
    // const applyScroll = (el: Element | Window, pos: { top?: number; left?: number }, behavior: ScrollBehavior) => {
    //   const top = pos.top ?? 0;
    //   const left = pos.left ?? 0;
    //   if (el instanceof Window) {
    //     window.scrollTo({ top, left, behavior });
    //   } else if ('scrollTo' in el) {
    //     (el as any).scrollTo({ top, left, behavior });
    //   }
    // };
    // const getExtraContainers = (): Array<{ id: string; el: Element | null; behavior?: ScrollBehavior; restore?: 'memory' | 'top' | 'preserve' }> => {
    //   return (options?.scroll?.containers ?? []).map(c => ({
    //     id: c.id,
    //     el: c.getContainer?.() ?? (c.selector ? document.querySelector(c.selector) : null),
    //     behavior: c.behavior,
    //     restore: c.restore,
    //   }));
    // };
    // // Capture current scroll positions for all managed containers keyed by current location
    // const snapshotCurrentScroll = () => {
    //   const key = locationKey();
    //   const primary = getPrimaryContainer();
    //   const primaryEl = primary ?? window;
    //   const primaryId = 'window';
    //   scrollMemory.current.set(`${primaryId}::${key}`, readPos(primaryEl));
    //   for (const c of getExtraContainers()) {
    //     if (c.el) scrollMemory.current.set(`${c.id}::${key}`, readPos(c.el));
    //   }
    // };
    // const prevLocRef = React.useRef<string | null>(null);
    // // Scroll + focus restoration when navigation settles
    // React.useEffect(() => {
    //   if (snap.status === "idle") {
    //     // Save previous location scroll positions for memory
    //     const prevKey = prevLocRef.current;
    //     if (prevKey) {
    //       const primary = getPrimaryContainer();
    //       const primaryId = 'window';
    //       const primaryEl = primary ?? window;
    //       scrollMemory.current.set(`${primaryId}::${prevKey}`, readPos(primaryEl));
    //       for (const c of getExtraContainers()) {
    //         if (c.el) scrollMemory.current.set(`${c.id}::${prevKey}`, readPos(c.el));
    //       }
    //     }

    //     const desired = scrollRef.current ?? (options?.scroll?.default === 'preserve' ? null : { kind: 'top' as const });
    //     scrollRef.current = null;
    //     const thisKey = locationKey();
    //     const behaviorDefault = options?.scroll?.behavior ?? 'auto';
    //     // Primary container
    //     const primary = getPrimaryContainer();
    //     const primaryEl = (primary ?? window);
    //     const primaryId = 'window';
    //     const primaryRestore = desired
    //       ? desired.kind === 'top'
    //         ? { top: 0, left: 0 }
    //         : { top: desired.top, left: desired.left }
    //       : undefined;
    //     if (primaryRestore) {
    //       const behaviorForPrimary: ScrollBehavior = desired && desired.kind === 'coords' && desired.behavior
    //         ? desired.behavior
    //         : behaviorDefault;
    //       applyScroll(primaryEl, primaryRestore, behaviorForPrimary);
    //     } else {
    //       // Try memory if any
    //       const mem = scrollMemory.current.get(`${primaryId}::${thisKey}`);
    //       if (mem) applyScroll(primaryEl, mem, behaviorDefault);
    //     }
    //     // Extra containers
    //     for (const c of getExtraContainers()) {
    //       if (!c.el) continue;
    //       const beh = c.behavior ?? behaviorDefault;
    //       const restore = c.restore ?? 'memory';
    //       if (desired && desired.kind === 'coords') {
    //         applyScroll(c.el, { top: desired.top, left: desired.left }, desired.behavior ?? beh);
    //       } else if (desired && desired.kind === 'top') {
    //         applyScroll(c.el, { top: 0, left: 0 }, beh);
    //       } else if (restore === 'top') {
    //         applyScroll(c.el, { top: 0, left: 0 }, beh);
    //       } else if (restore === 'memory') {
    //         const mem = scrollMemory.current.get(`${c.id}::${thisKey}`);
    //         if (mem) applyScroll(c.el, mem, beh);
    //       }
    //     }
    //     prevLocRef.current = thisKey;
    //     // focus main region
    //     window.requestAnimationFrame(() => {
    //       const focusEl = (document.querySelector('[data-router-focus], main, [role="main"]') as HTMLElement | null);
    //       focusEl?.focus?.();
    //     });
    //   }
    // }, [snap.status, snap.index]);

    // // Demo-layer parallel transitions: toggle classes based on store status
    // React.useEffect(() => {
    //   const el = (document.querySelector('[data-router-container]') || document.documentElement) as HTMLElement;
    //   if (snap.status !== 'idle') {
    //     el.classList.add('router-transitioning');
    //     el.classList.add('router-exiting');
    //     el.classList.add('router-entering');
    //   } else {
    //     // success path => toggle then clean up next frame
    //     el.classList.add('router-success');
    //     requestAnimationFrame(() => {
    //       el.classList.remove('router-transitioning');
    //       el.classList.remove('router-exiting');
    //       el.classList.remove('router-entering');
    //       el.classList.remove('router-success');
    //     });
    //   }
    // }, [snap.status]);
    // // Scroll + focus restoration when navigation settles
    // React.useEffect(() => {
    //   if (snap.status === "idle") {
    //     // scroll to top for new navigations
    //     window.requestAnimationFrame(() => {
    //       window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    //       const el = document.querySelector("[data-router-focus], main, [role='main']") as HTMLElement | null;
    //     // scroll + focus restoration when navigation settles
    //     window.requestAnimationFrame(() => {
    //       window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    //       const focusEl = document.querySelector("[data-router-focus], main, [role='main']") as HTMLElement | null;
    //       focusEl?.focus?.();
    //     });
    //   }
    // }, [snap.status, snap.index]);
    // const current = useMemo(() => {
    //   const path = getPathFromLocation();
    //   const current = match(path);
    //   console.debug('[router]', { path, current });

    //   return current as Ctx["current"];
    // }, [snap]);

    // const value = useMemo<Ctx>(() => ({
    //   routes: defs,
    //   defs,
    //   history,
    //   store,
    //   match,
    //   matchAll,
    //   current,
    //   _setScrollDesired: (s) => { scrollRef.current = s; },
    //   _snapshotScroll: snapshotCurrentScroll,
    // }), [current]);
//#endregion

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
    // Wrap a node with matching layouts for a route name (by specificity)
    const wrapWithLayouts = (lx: LayoutMap, name: RouteName, params: any, node: React.ReactNode, excludeKey?: RouteName | null): React.ReactNode => {
      const keys = Object.keys(lx) as RouteName[];
      const matches = keys
        .filter((k) => {
          if (excludeKey && k === excludeKey) return false;
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

    // Decide when a transition should occur by deriving a stable key for the route we care about.
    // Policy:
    // - Products: single key (list-internal changes don't animate)
    // - Product*: animate only when product id changes (tabs with same id don't animate)
    // - Default: animate on any route+params change
    const keyFor = (name: string, params: any) => {
      if (name === 'Products') return 'Products';
      if (name && name.startsWith('Product')) {
        const id = params?.id ?? null;
        return `Product:${JSON.stringify(id)}`;
      }
      return `${name}:${JSON.stringify(params || {})}`;
    };

    // Determine a common outer layout key to hoist outside transitions (e.g., Products)
    const commonOuterKey = (_fromName: string | null, toName: string): RouteName | null => {
      // Hoist `Products` whenever destination is in the Products domain (Products or Product*)
      const inProducts = (n: string | null | undefined) => !!n && (n === 'Products' || n.startsWith('Product'));
      if (inProducts(toName)) return 'Products' as RouteName;
      return null;
    };
    // Simplified single-mode transitions

    const renderWithLayouts = (name: RouteName, params: any, wrapSlide: boolean): React.ReactNode => {
      const body = renderFor(name, params);
      if (!body) return null;
      const node = wrapSlide ? <div className="transition-slide">{body}</div> : body;
      return wrapWithLayouts(layouts, name, params, node, outerKey);
    };

    // Detect Product tab-to-tab change for same product id
    const isProductTab = (n: string | null | undefined) => !!n && n !== 'Products' && n.startsWith('Product');
    const getProdId = (p: any) => (p?.id ?? p?.productId ?? null);
    const sameProductId = (a: any, b: any) => JSON.stringify(getProdId(a)) === JSON.stringify(getProdId(b));
    const isTabChange = !!from && isProductTab(from.name) && isProductTab(String(to.name)) && sameProductId(from.params, to.params);

    // Differ if the transition key changes OR if we're switching tabs within the same product
    const differ = !!from && ((keyFor(from.name, from.params) !== keyFor(to.name, to.params)) || isTabChange);

    // Single-mode: no special guards needed

    // Compute hoisted outer layout key for current transition scope
    const outerKey = commonOuterKey(from?.name ?? null, String(to.name));

    // Diagnostics: log route state and layout application decisions
    React.useEffect(() => {
      // eslint-disable-next-line no-console
      console.log('[Routes] change', {
        differ,
        outerKey,
        from,
        to,
        layouts: Object.keys(layouts || {}),
      });
    }, [differ, outerKey, from, to, layouts]);

    // Start a CSS transition when a new atomic change arrives that differs
    React.useEffect(() => {
      if (!differ || !from) return;
      // For Product tab changes: animate only the exiting content's inner slide out, leave entering static
      if (isTabChange) {
        // Ensure the exiting view stays mounted even if differ drops to false
        if (!exiting && from) setExiting(from);
        const fromEl = fromRef.current;
        if (!fromEl) return;
        // Prefer animating the inner slide; if absent, animate the shell
        const target = (fromEl.querySelector('.transition-slide') as HTMLElement | null) || fromEl;
        if (target === fromEl) {
          // eslint-disable-next-line no-console
          console.log('[Routes][tab-exit] animating shell (no .transition-slide)');
        }
        // Prepare and run a simple fade/slide out
        fromEl.style.display = '';
        fromEl.style.opacity = '1';
        target.style.willChange = 'transform, opacity';
        target.style.transition = 'transform 180ms ease, opacity 180ms ease';
        target.style.transform = 'translateX(0px)';
        target.style.opacity = '1';
        // Kick off on next frame
        const id = requestAnimationFrame(() => {
          target.style.transform = 'translateX(-12px)';
          target.style.opacity = '0';
        });
        let ended = false;
        const onEnd = () => {
          ended = true;
          target.style.willChange = '';
          target.style.transition = '';
          target.style.transform = '';
          target.style.opacity = '';
          setExiting(null);
        };
        const onEndLog = (e: Event) => {
          // eslint-disable-next-line no-console
          console.log('[Routes][tab-exit] transitionend', {
            target: (e.target as HTMLElement)?.className,
          });
          onEnd();
        };
        target.addEventListener('transitionend', onEndLog, { once: true });
        // Fallback: if transitionend doesn’t fire, clear after 250ms
        const fallback = window.setTimeout(() => {
          if (!ended) {
            // eslint-disable-next-line no-console
            console.log('[Routes][tab-exit] fallback timeout clearing exit');
            onEnd();
          }
        }, 250);
        return () => {
          cancelAnimationFrame(id);
          window.clearTimeout(fallback);
        };
      }
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
        // 1) Apply pre-state to NEXT only (keep FROM unmarked so it animates after transitions are enabled)
        toEl.classList.add('is-next-container');
        // For tab changes, animate only the inner content and freeze shells
        if (isTabChange) {
          fromEl.classList.add('no-shell-animate');
          toEl.classList.add('no-shell-animate');
        }
        // 2) Force a reflow to commit pre-positioning before enabling transitions
        void toEl.getBoundingClientRect();
        // 3) Enable transitions on container
        container.classList.add('is-changing');
        // 4) Next frame, kick off both enter and exit transitions
        requestAnimationFrame(() => {
          // Enter: remove pre-enter class so it slides in
          toEl.classList.remove('is-next-container');
          // Exit: now mark FROM as previous so it slides out
          fromEl.classList.add('is-previous-container');
        });

        // When both elements finish transitions/animations, clear exiting
        let doneCount = 0;
        const done = () => {
          doneCount += 1;
          if (doneCount >= 2) {
            container.classList.remove('is-changing');
            fromEl.classList.remove('is-previous-container');
            toEl.classList.remove('is-next-container');
            if (isTabChange) {
              fromEl.classList.remove('no-shell-animate');
              toEl.classList.remove('no-shell-animate');
            }
            setExiting(null);
          }
        };
        const endEvents: (keyof HTMLElementEventMap)[] = ['transitionend', 'animationend'];
        // Pick actual animated targets
        const fromTarget: HTMLElement = (isTabChange ? (fromEl.querySelector('.transition-slide') as HTMLElement | null) : null) || fromEl;
        const toTarget: HTMLElement = (isTabChange ? (toEl.querySelector('.transition-slide') as HTMLElement | null) : null) || toEl;
        endEvents.forEach((evt) => {
          fromTarget.addEventListener(evt, done, { once: true });
          toTarget.addEventListener(evt, done, { once: true });
        });

        // Diagnostics: log DOM state and children counts post-activation
        const countChildren = (el: HTMLElement | null) => (el ? el.childElementCount : 0);
        const countSlides = (el: HTMLElement | null) => (el ? el.querySelectorAll('.transition-slide').length : 0);
        // eslint-disable-next-line no-console
        console.log('[Routes] DOM', {
          outerKey,
          container: {
            changing: container.classList.contains('is-changing'),
            children: countChildren(container),
          },
          fromEl: {
            role: fromEl.getAttribute('data-role'),
            classes: fromEl.className,
            children: countChildren(fromEl),
            slides: countSlides(fromEl),
          },
          toEl: {
            role: toEl.getAttribute('data-role'),
            classes: toEl.className,
            children: countChildren(toEl),
            slides: countSlides(toEl),
          },
        });
      });
      return () => cancelAnimationFrame(frame);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [change?.to, differ]);

    const oldKey = (exiting || from) ? `${String((exiting || from)!.name)}:${JSON.stringify((exiting || from)!.params || {})}` : null;
    const newKey = `${String(to.name)}:${JSON.stringify(to.params || {})}`;

    // Render both views immediately when they differ; keep 'exiting' cached until CSS ends
    if (exiting || differ) {
      const content = (
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
            className={"view z-10 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10 " + (isTabChange ? "" : "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm")}
            style={isTabChange ? { background: '#ffd1dc' } : undefined}
            data-role="from"
            aria-hidden={isTabChange ? (undefined as any) : true}
          >
            {renderWithLayouts((exiting || from)!.name as RouteName, (exiting || from)!.params, isTabChange)}
          </div>
          <div
            ref={toRef}
            key={`new:${newKey}`}
            className={"view z-20 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10 " + (isTabChange ? "bg-white dark:bg-neutral-900" : "bg-white dark:bg-neutral-900")}
            data-role="to"
          >
            {renderWithLayouts(to.name as RouteName, to.params, isTabChange)}
          </div>
        </div>
      );
      // Hoist common outer layout around the whole transition shell if provided
      if (outerKey && (layouts as any)[outerKey]) {
        const L = (layouts as any)[outerKey] as React.ComponentType<LayoutComponentProps>;
        return <L route={{ name: to.name as RouteName, params: to.params }}>{content}</L>;
      }
      return content;
    }

    // No active transition; render single view
    const single = renderWithLayouts(to.name as RouteName, to.params, false);
    const singleView = single ? (
      <div className="view z-10 bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10">
        {single}
      </div>
    ) : null;
    if (!singleView) return null;
    if (outerKey && (layouts as any)[outerKey]) {
      const L = (layouts as any)[outerKey] as React.ComponentType<LayoutComponentProps>;
      return <L route={{ name: to.name as RouteName, params: to.params }}>{singleView}</L>;
    }
    return singleView;
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
