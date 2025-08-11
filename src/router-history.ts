import { createRouterStore, type RouterStore } from "./router-store";

export type HistoryAdapterOptions = {
  base?: string; // e.g. "/app"
  useHash?: boolean; // if true, use location.hash for routing
  match: (path: string) => Promise<Record<string, unknown> | null> | (Record<string, unknown> | null);
  // Optional guard: return true to allow, or a string path to redirect
  guard?: (path: string) => Promise<true | string> | (true | string);
  // Optional loader: may return extra params to merge into route params
  loader?: (
    path: string,
    params: Record<string, unknown> | null
  ) => Promise<Record<string, unknown> | void> | (Record<string, unknown> | void);
  // Optional route-instance matcher (if available from higher layer)
  matchRoute?: (path: string) => any | null;
  matchRouteByPath?: (path: string) => any | null;
  // Optional: return parent→child chain of route instances for nesting
  matchAllRoutes?: (path: string) => any[] | null;
  // Preferred richer contexts (if provided, take precedence over guard/loader)
  guardV2?: (ctx: { fullPath: string; path: string; params: Record<string, unknown> | null; route: any | null; chain?: any[] }) => Promise<true | string> | (true | string);
  loaderV2?: (ctx: { path: string; params: Record<string, unknown> | null; route: any | null; chain?: any[] }) => Promise<Record<string, unknown> | void> | (Record<string, unknown> | void);
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
  const { base = "", useHash = false, match, guard, loader, matchRoute, matchRouteByPath, matchAllRoutes, guardV2, loaderV2 } = opts;

  async function resolve(pathFull: string) {
    console.debug('[history.resolve]', { pathFull, stripped: stripQueryHash(pathFull) });

    try {
      // guard first (use full URL path including search/hash)
      if (guardV2 || guard) {
        const rawPath = pathFull;
        const path = stripQueryHash(pathFull);
        const params = await match(path);
        const routeMatcher = matchRouteByPath ?? matchRoute;
        const route = routeMatcher ? routeMatcher(path) : null;
        const chain = matchAllRoutes ? (matchAllRoutes(path) || (route ? [route] : [])) : (route ? [route] : []);
        const allowOrRedirect = guardV2
          ? await guardV2({ fullPath: rawPath, path, params, route, chain })
          : await guard!(rawPath);
        if (typeof allowOrRedirect === "string") {
          // redirect and stop
          apply("redirect", normalize(allowOrRedirect, ""));
          return;
        }
      }

      const path = stripQueryHash(pathFull);
      let params = await match(path);
      if (loaderV2 || loader) {
        const routeMatcher = matchRouteByPath ?? matchRoute;
        const route = routeMatcher ? routeMatcher(path) : null;
        const chain = matchAllRoutes ? (matchAllRoutes(path) || (route ? [route] : [])) : (route ? [route] : []);
        const extra = loaderV2
          ? await loaderV2({ path, params, route, chain })
          : await loader!(path, params);
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
