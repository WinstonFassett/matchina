import { createRouterStore, type RouterStore } from "./router-store";

export type HistoryAdapterOptions = {
  base?: string; // e.g. "/app"
  useHash?: boolean; // if true, use location.hash for routing
  match: (path: string) => Promise<Record<string, unknown> | null> | (Record<string, unknown> | null);
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

export function createBrowserHistoryAdapter(store: RouterStore, opts: HistoryAdapterOptions) {
  const { base = "", useHash = false, match } = opts;

  async function resolve(path: string) {
    try {
      const params = await match(path);
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
