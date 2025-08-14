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
  // Maintain a stable session index similar to React Router's history
  function ensureStateIndex() {
    const st: any = window.history.state || {};
    if (typeof st.__vtIdx !== 'number') {
      try { window.history.replaceState({ ...st, __vtIdx: 0 }, "", window.location.href); } catch {}
      return 0;
    }
    return st.__vtIdx as number;
  }

  async function maybeGuardAndLoad(pathFull: string) {
    // Optional: run guard/loader for side-effects or prefetching; store state is just path
    try {
      if (guard) {
        const rawPath = pathFull;
        const path = stripQueryHash(pathFull);
        const params = await matchParams(path);
        const routeMatcher = matchRouteByPath ?? matchRoute;
        const route = routeMatcher ? routeMatcher(path) : null;
        const chain = (matchChain(path) || (route ? [route] : []));
        const allowOrRedirect = await guard({ fullPath: rawPath, path, params, route, chain });
        if (typeof allowOrRedirect === "string") {
          apply("redirect", normalize(allowOrRedirect, ""));
          return false;
        }
      }
      if (loader) {
        const path = stripQueryHash(pathFull);
        const routeMatcher = matchRouteByPath ?? matchRoute;
        const route = routeMatcher ? routeMatcher(path) : null;
        const chain = (matchChain(path) || (route ? [route] : []));
        await loader({ path, params: await matchParams(path), route, chain });
      }
    } catch {
      // ignore loader/guard errors for minimal store
    }
    return true;
  }

  function generateKey() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2);
  }

  function apply(mode: "push" | "replace" | "redirect", path: string) {
    const url = toUrl(path, { base, useHash });
    const st: any = window.history.state || {};
    const curr = typeof st.__vtIdx === 'number' ? st.__vtIdx : ensureStateIndex();
    const nextIdx = mode === "push" ? curr + 1 : curr;
    const state = { ...st, key: generateKey(), __vtIdx: nextIdx };
    if (mode === "push") {
      try { window.history.pushState(state, "", url); } catch {}
    } else {
      try { window.history.replaceState(state, "", url); } catch {}
    }
    store.dispatch(mode, path);
    void maybeGuardAndLoad(path);
  }

  function start() {
    // Initialize from current location
    const initialPath = getPathFromLocation({ base, useHash });
    // Seed an index into history.state if missing
    ensureStateIndex();
    store.dispatch("replace", initialPath);
    void maybeGuardAndLoad(initialPath);

    window.addEventListener("popstate", () => {
      const path = getPathFromLocation({ base, useHash });
      // Browser back/forward: emit POP so downstream can infer direction via state index
      store.dispatch("pop", path);
      void maybeGuardAndLoad(path);
    });
    if (useHash) {
      window.addEventListener("hashchange", () => {
        const path = getPathFromLocation({ base, useHash });
        // Hash back/forward also treated as POP
        store.dispatch("pop", path);
        void maybeGuardAndLoad(path);
      });
    }
  }

  return {
    start,
    push: (path: string) => apply("push", path),
    replace: (path: string) => apply("replace", path),
    redirect: (path: string) => apply("redirect", path),
    back: () => window.history.back(),
    current: () => ({ path: store.getState().path }),
  };
}

// Convenience factory for quick demos
export function createBrowserRouter(opts: HistoryAdapterOptions) {
  const store = createRouterStore();
  const history = createBrowserHistoryAdapter(store, opts);
  return { store, history };
}
