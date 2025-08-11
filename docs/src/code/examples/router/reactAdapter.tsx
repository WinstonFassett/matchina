import React, { createContext, useContext, useMemo } from "react";
import { createBrowserRouter } from "@lib/src/router-history";
import { defineRouteBoxes, type RouteBox } from "./defineRouteBoxes";
import { useMachine } from "@lib/src/integrations/react";

// Create an idiomatic React adapter around route boxes + browser history
// Usage:
// const { RouterProvider, useNavigation, useRoute, Link } = createReactRouter({
//   Home: "/", Product: "/products/:id"
// } as const)
//
// <RouterProvider>
//   const nav = useNavigation();
//   <button onClick={nav.goto("Product", { id: "42" })} />
//   <Link name="Product" params={{ id: "42"}}>Open</Link>
// </RouterProvider>

export function createReactRouter<const Patterns extends Record<string, string>>(
  patterns: Patterns,
  options?: {
    base?: string;
    useHash?: boolean;
    guard?: (fullPath: string) => true | string | Promise<true | string>;
    loader?: (
      path: string,
      params: Record<string, unknown> | null
    ) => void | Record<string, unknown> | Promise<void | Record<string, unknown>>;
  }
) {
  const { routes, match, defs } = defineRouteBoxes(patterns);
  const { store, history } = createBrowserRouter({
    base: options?.base,
    useHash: options?.useHash,
    match: async (path) => {
      const inst = match(path);
      return inst ? (inst.params as Record<string, unknown>) : null;
    },
    guard: options?.guard,
    loader: options?.loader,
  });

  type RouteName = keyof typeof defs & string;
  type ParamsOf<N extends RouteName> = Parameters<(typeof routes)[N]>[0];
  // If the params type is an empty object (no required keys), allow omitting it
  type HasNoParams<N extends RouteName> = keyof ParamsOf<N> extends never ? true : false;
  type MaybeParams<N extends RouteName> = HasNoParams<N> extends true ? Partial<ParamsOf<N>> | undefined : ParamsOf<N>;

  type Ctx = {
    routes: typeof routes;
    defs: typeof defs;
    history: typeof history;
    store: typeof store;
    match: typeof match;
    current: RouteBox<RouteName, string> | null;
  };

  const RouterContext = createContext<Ctx | null>(null);

  const RouterProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    // Subscribe to machine changes; triggers re-render on notify
    useMachine(store);
    // Start history once on mount (align store with URL)
    React.useEffect(() => {
      history.start();
    }, []);

    const snap = store.getState();
    // Scroll + focus restoration when navigation settles
    React.useEffect(() => {
      if (snap.status === "idle") {
        // scroll to top for new navigations
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
          const el = document.querySelector("[data-router-focus], main, [role='main']") as HTMLElement | null;
          el?.focus?.();
        });
      }
    }, [snap.status, snap.index]);
    const current = useMemo(() => {
      const cur = snap.stack[snap.index];
      const path = cur?.path ?? "/";
      return match(path) as Ctx["current"];
    }, [snap]);

    const value = useMemo<Ctx>(() => ({ routes, defs, history, store, match, current }), [current]);
    return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
  };

  function useRouterContext(): Ctx {
    const ctx = useContext(RouterContext);
    if (!ctx) throw new Error("useRouter must be used within RouterProvider");
    return ctx;
  }

  function useNavigation() {
    const { defs, history } = useRouterContext();

    type NavOpts = {
      search?: string | Record<string, string | number | boolean | null | undefined>;
      hash?: string; // with or without leading '#'
      replace?: boolean;
    };

    const toSearch = (s?: NavOpts["search"]) => {
      if (!s) return "";
      if (typeof s === "string") return s.startsWith("?") ? s : `?${s}`;
      const usp = new URLSearchParams();
      for (const [k, v] of Object.entries(s)) {
        if (v === undefined || v === null) continue;
        usp.set(k, String(v));
      }
      const q = usp.toString();
      return q ? `?${q}` : "";
    };

    const withUrl = <N extends RouteName>(name: N, params?: MaybeParams<N>, opts?: NavOpts) => {
      const basePath = defs[name].to(((params ?? {}) as unknown) as any);
      const search = toSearch(opts?.search);
      const hash = opts?.hash ? (opts.hash.startsWith("#") ? opts.hash : `#${opts.hash}`) : "";
      return `${basePath}${search}${hash}`;
    };

    function navigate<N extends RouteName>(name: N, params: MaybeParams<N>, opts?: NavOpts): void;
    function navigate<N extends RouteName>(name: N, opts?: NavOpts): HasNoParams<N> extends true ? void : never;
    function navigate<N extends RouteName>(name: N, a?: MaybeParams<N> | NavOpts, b?: NavOpts) {
      const hasParams = a && typeof a === "object" && !("search" in (a as any)) && !("hash" in (a as any));
      const params = (hasParams ? (a as MaybeParams<N>) : undefined) as MaybeParams<N> | undefined;
      const opts = (hasParams ? b : (a as NavOpts | undefined)) as NavOpts | undefined;
      const url = withUrl(name, params, opts);
      (opts?.replace ? history.replace : history.push)(url);
    }

    function replace<N extends RouteName>(name: N, params: MaybeParams<N>, opts?: Omit<NavOpts, "replace">): void;
    function replace<N extends RouteName>(name: N, opts?: Omit<NavOpts, "replace">): HasNoParams<N> extends true ? void : never;
    function replace<N extends RouteName>(name: N, a?: MaybeParams<N> | Omit<NavOpts, "replace">, b?: Omit<NavOpts, "replace">) {
      const hasParams = a && typeof a === "object" && !("search" in (a as any)) && !("hash" in (a as any));
      const params = (hasParams ? (a as MaybeParams<N>) : undefined) as MaybeParams<N> | undefined;
      const opts = (hasParams ? b : (a as Omit<NavOpts, "replace"> | undefined)) as Omit<NavOpts, "replace"> | undefined;
      const url = withUrl(name, params, opts as NavOpts);
      history.replace(url);
    }

    function redirect<N extends RouteName>(name: N, params: MaybeParams<N>, opts?: Omit<NavOpts, "replace">): void;
    function redirect<N extends RouteName>(name: N, opts?: Omit<NavOpts, "replace">): HasNoParams<N> extends true ? void : never;
    function redirect<N extends RouteName>(name: N, a?: MaybeParams<N> | Omit<NavOpts, "replace">, b?: Omit<NavOpts, "replace">) {
      const hasParams = a && typeof a === "object" && !("search" in (a as any)) && !("hash" in (a as any));
      const params = (hasParams ? (a as MaybeParams<N>) : undefined) as MaybeParams<N> | undefined;
      const opts = (hasParams ? b : (a as Omit<NavOpts, "replace"> | undefined)) as Omit<NavOpts, "replace"> | undefined;
      const url = withUrl(name, params, opts as NavOpts);
      history.redirect(url);
    }

    function goto<N extends RouteName>(name: N, params: MaybeParams<N>, opts?: NavOpts): () => void;
    function goto<N extends RouteName>(name: N, opts?: NavOpts): HasNoParams<N> extends true ? () => void : never;
    function goto<N extends RouteName>(name: N, a?: MaybeParams<N> | NavOpts, b?: NavOpts) {
      return () => navigate(name as any, a as any, b as any);
    }

    return { navigate, replace, redirect, goto, back: history.back };
  }

  function useRoute() {
    const { current } = useRouterContext();
    return current;
  }

  type LinkProps<N extends RouteName> = {
    name: N;
    params?: MaybeParams<N>;
    replace?: boolean;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    // extras
    search?: string | Record<string, string | number | boolean | null | undefined>;
    hash?: string;
    activeClassName?: string;
    activeStyle?: React.CSSProperties;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>;

  function Link<N extends RouteName>({ name, params, replace, children, onClick, className, style, search, hash, activeClassName, activeStyle, ...rest }: LinkProps<N>) {
    const { defs, history } = useRouterContext();
    const base = defs[name].to(((params ?? {}) as unknown) as any);
    const toSearch = (s?: LinkProps<N>["search"]) => {
      if (!s) return "";
      if (typeof s === "string") return s.startsWith("?") ? s : `?${s}`;
      const usp = new URLSearchParams();
      for (const [k, v] of Object.entries(s)) {
        if (v === undefined || v === null) continue;
        usp.set(k, String(v));
      }
      const q = usp.toString();
      return q ? `?${q}` : "";
    };
    const href = `${base}${toSearch(search)}${hash ? (hash.startsWith("#") ? hash : `#${hash}`) : ""}`;
    const isActive = useIsActive(name, params as any);
    const finalClass = [className, isActive ? activeClassName : undefined].filter(Boolean).join(" ");
    const finalStyle = isActive && activeStyle ? { ...(style || {}), ...activeStyle } : style;
    return (
      <a
        href={href}
        className={finalClass || undefined}
        style={finalStyle}
        onClick={(e) => {
          e.preventDefault();
          replace ? history.replace(href) : history.push(href);
          onClick?.(e);
        }}
        {...rest}
      >
        {children}
      </a>
    );
  }

  // Location helper (reads current window location; RouterProvider re-renders on nav)
  function useLocation() {
    return {
      pathname: typeof window !== "undefined" ? window.location.pathname : "/",
      search: typeof window !== "undefined" ? window.location.search : "",
      hash: typeof window !== "undefined" ? window.location.hash : "",
    };
  }

  // Active-state helper
  function useIsActive<N extends RouteName>(name: N, params?: MaybeParams<N>) {
    const current = useRoute();
    if (!current) return false;
    if (current.type !== name) return false;
    const want = (params ?? {}) as any;
    const got = (current.params ?? {}) as any;
    for (const k of Object.keys(want)) {
      if (String(got[k]) !== String((want as any)[k])) return false;
    }
    return true;
  }

  // --- Minimal view primitives (flat matching) ---
  type RouteProps = {
    name: RouteName;
    element: React.ReactNode;
    children?: React.ReactNode; // reserved for future nested support
  };

  const Route: React.FC<RouteProps> = () => null; // marker component, not rendered directly

  const Outlet: React.FC = () => null; // placeholder for future nested layouts

  const Routes: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const current = useRoute();
    const list = React.Children.toArray(children) as React.ReactElement<RouteProps>[];
    const matchEl = list.find((child) => React.isValidElement(child) && child.props.name === current?.type);
    return matchEl ? <>{matchEl.props.element}</> : null;
  };

  // Typed mapping-based renderer with exhaustiveness and prop typing
  type ViewMap = { [K in RouteName]: React.ComponentType<ParamsOf<K>> };
  const RouteViews: React.FC<{ views: ViewMap }> = ({ views }) => {
    const current = useRoute();
    if (!current) return null;
    const View = views[current.type as RouteName] as React.ComponentType<any>;
    // current.params is string record; cast to the mapped props type for current route
    return <View {...(current.params as any)} />;
  };

  return { RouterProvider, useNavigation, useRoute, useIsActive, useLocation, Link, Routes, Route, Outlet, RouteViews, routes, defs };
}
