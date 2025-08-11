import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createBrowserRouter } from "@lib/src/router-history";
import { defineRouteBoxes, type RouteBox } from "./defineRouteBoxes";

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

export function createReactRouter<const Patterns extends Record<string, string>>(patterns: Patterns) {
  const { routes, match, defs } = defineRouteBoxes(patterns);
  const { store, history } = createBrowserRouter({
    match: async (path) => {
      const inst = match(path);
      return inst ? (inst.params as Record<string, unknown>) : null;
    },
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
    const [snap, setSnap] = useState(() => store.getState());
    useEffect(() => {
      const id = setInterval(() => setSnap(store.getState()), 100);
      history.start();
      return () => clearInterval(id);
    }, []);

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

    function navigate<N extends RouteName>(name: N, params: MaybeParams<N>): void;
    function navigate<N extends RouteName>(name: N): HasNoParams<N> extends true ? void : never;
    function navigate<N extends RouteName>(name: N, params?: MaybeParams<N>) {
      const url = defs[name].to(((params ?? {}) as unknown) as any);
      history.push(url);
    }

    function replace<N extends RouteName>(name: N, params: MaybeParams<N>): void;
    function replace<N extends RouteName>(name: N): HasNoParams<N> extends true ? void : never;
    function replace<N extends RouteName>(name: N, params?: MaybeParams<N>) {
      const url = defs[name].to(((params ?? {}) as unknown) as any);
      history.replace(url);
    }

    function redirect<N extends RouteName>(name: N, params: MaybeParams<N>): void;
    function redirect<N extends RouteName>(name: N): HasNoParams<N> extends true ? void : never;
    function redirect<N extends RouteName>(name: N, params?: MaybeParams<N>) {
      const url = defs[name].to(((params ?? {}) as unknown) as any);
      history.redirect(url);
    }

    function goto<N extends RouteName>(name: N, params: MaybeParams<N>): () => void;
    function goto<N extends RouteName>(name: N): HasNoParams<N> extends true ? () => void : never;
    function goto<N extends RouteName>(name: N, params?: MaybeParams<N>) {
      return () => navigate(name, params as any);
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
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>;

  function Link<N extends RouteName>({ name, params, replace, children, onClick, ...rest }: LinkProps<N>) {
    const { defs, history } = useRouterContext();
    const href = defs[name].to(((params ?? {}) as unknown) as any);
    return (
      <a
        href={href}
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

  return { RouterProvider, useNavigation, useRoute, Link, Routes, Route, Outlet, routes, defs };
}
