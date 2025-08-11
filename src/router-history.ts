import { createRouterStore, type RouterStore } from "./router-store";

export type HistoryAdapterOptions = {
  base?: string; // e.g. "/app"
  useHash?: boolean; // if true, use location.hash for routing
  // Prefer path-specific helpers; legacy names kept for compatibility
  matchPath?: (path: string) => Promise<Record<string, unknown> | null> | (Record<string, unknown> | null);
  matchAllPaths?: (path: string) => any[] | null;
  match?: (path: string) => Promise<Record<string, unknown> | null> | (Record<string, unknown> | null);
  // Guard: return true to allow, or a string path to redirect (receives rich ctx)
  guard?: (ctx: { fullPath: string; path: string; params: Record<string, unknown> | null; route: any | null; chain?: any[] }) => Promise<true | string> | (true | string);
  // Loader: may return extra params to merge into route params (receives rich ctx)
  loader?: (ctx: { path: string; params: Record<string, unknown> | null; route: any | null; chain?: any[] }) => Promise<Record<string, unknown> | void> | (Record<string, unknown> | void);
  matchRoute?: (path: string) => any | null;
  matchRouteByPath?: (path: string) => any | null;
  // Optional: return parent→child chain of route instances for nesting
  matchAllRoutes?: (path: string) => any[] | null;
};

function normalize(path: string, base = "") {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) return p;
  return p.startsWith(base) ? p.slice(base.length) || "/" : p;
}

function toUrl(path: string, { base = "", useHash = false }: { base?: string; useHash?: boolean }) {
  if (useHash) return `${base || ""}#${path}`;
  return `${base || ""}${path}`;
}

function getPathFromLocation({ base = "", useHash = false }: { base?: string; useHash?: boolean }) {
  if (useHash) {
    const hash = window.location.hash || "#";
    const raw = hash.slice(1) || "/";
    return normalize(raw, "");
  }
  const raw = window.location.pathname + window.location.search + window.location.hash;
  return normalize(raw, base);
}

function stripQueryHash(path: string) {
  const idxQ = path.indexOf("?");
  const idxH = path.indexOf("#");
  let end = path.length;
  if (idxQ !== -1) end = Math.min(end, idxQ);
  if (idxH !== -1) end = Math.min(end, idxH);
  return path.slice(0, end) || "/";
}

export function createBrowserHistoryAdapter(store: RouterStore, opts: HistoryAdapterOptions) {
  const { base = "", useHash = false, guard, loader, matchRoute, matchRouteByPath, matchAllRoutes } = opts;
  const matchParams = (path: string) => (opts.matchPath ? opts.matchPath(path) : opts.match!(path));
  const matchChain = (path: string) => (opts.matchAllPaths ? opts.matchAllPaths(path) : (matchAllRoutes ? matchAllRoutes(path) : null));

  async function resolve(pathFull: string) {
    console.debug('[history.resolve]', { pathFull, stripped: stripQueryHash(pathFull) });

    try {
      // guard first (use full URL path including search/hash)
      if (guard) {
        const rawPath = pathFull;
        const path = stripQueryHash(pathFull);
        const params = await matchParams(path);
        const routeMatcher = matchRouteByPath ?? matchRoute;
        const route = routeMatcher ? routeMatcher(path) : null;
        const chain = (matchChain(path) || (route ? [route] : []));
        const allowOrRedirect = await guard({ fullPath: rawPath, path, params, route, chain });
        if (typeof allowOrRedirect === "string") {
          // redirect and stop
          apply("redirect", normalize(allowOrRedirect, ""));
          return;
        }
      }

      const path = stripQueryHash(pathFull);
      let params = await matchParams(path);
      if (loader) {
        const routeMatcher = matchRouteByPath ?? matchRoute;
        const route = routeMatcher ? routeMatcher(path) : null;
        const chain = (matchChain(path) || (route ? [route] : []));
        const extra = await loader({ path, params, route, chain });
        if (extra && typeof extra === "object") {
          params = { ...(params ?? {}), ...extra } as Record<string, unknown>;
        }
      }
      if (params) {
        store.dispatch("complete", params as Record<string, unknown>);
      } else {
        store.dispatch("fail", "No match");
      }
    } catch (e: any) {
      store.dispatch("fail", e?.message || "Navigation failed");
    }
  }

  function apply(mode: "push" | "replace" | "redirect", path: string) {
    const url = toUrl(path, { base, useHash });
    const state = { key: crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) };
    if (mode === "push") {
      window.history.pushState(state, "", url);
    } else {
      window.history.replaceState(state, "", url);
    }
    store.dispatch(mode, path);
    void resolve(path);
  }

  function start() {
    // Initialize from current location
    const initialPath = getPathFromLocation({ base, useHash });
    // Replace current entry to align store with URL
    store.dispatch("replace", initialPath);
    void resolve(initialPath);

    window.addEventListener("popstate", () => {
      const path = getPathFromLocation({ base, useHash });
      // Treat as replace of current entry
      store.dispatch("replace", path);
      void resolve(path);
    });
    if (useHash) {
      window.addEventListener("hashchange", () => {
        const path = getPathFromLocation({ base, useHash });
        store.dispatch("replace", path);
        void resolve(path);
      });
    }
  }

  return {
    start,
    push: (path: string) => apply("push", path),
    replace: (path: string) => apply("replace", path),
    redirect: (path: string) => apply("redirect", path),
    back: () => window.history.back(),
    current: () => store.getState().stack[store.getState().index] ?? null,
  };
}

// Convenience factory for quick demos
export function createBrowserRouter(opts: HistoryAdapterOptions) {
  const store = createRouterStore();
  const history = createBrowserHistoryAdapter(store, opts);
  return { store, history };
}
