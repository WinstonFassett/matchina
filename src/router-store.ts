import { createStoreMachine, type StoreMachine } from "./store-machine";

export type RouteEntry = {
  path: string;
  params?: Record<string, unknown>;
};

export type RouterStatus = "idle" | "navigating";
export type PendingMode = "push" | "replace" | "redirect";

export type RouterState = {
  status: RouterStatus;
  stack: RouteEntry[];
  index: number; // pointer into stack
  pending?: { path: string; mode: PendingMode };
  error?: string;
};

export type RouterTransitions = {
  // navigation intents
  push: (path: string) => (change: { from: RouterState }) => RouterState;
  replace: (path: string) => (change: { from: RouterState }) => RouterState;
  redirect: (path: string) => (change: { from: RouterState }) => RouterState;
  pop: () => (change: { from: RouterState }) => RouterState;

  // resolution
  complete: (params?: Record<string, unknown>) => (change: { from: RouterState }) => RouterState;
  fail: (error: string) => (change: { from: RouterState }) => RouterState;

  // utility
  reset: () => RouterState;
};

export type RouterStore = StoreMachine<RouterState, RouterTransitions>;

const initialState: RouterState = {
  status: "idle",
  stack: [],
  index: -1,
};

export function createRouterStore(): RouterStore {
  return createStoreMachine<RouterState, RouterTransitions>(initialState, {
    push: (path: string) => ({ from }) => {
      const entry: RouteEntry = { path };
      const base = from.stack.slice(0, from.index + 1);
      const stack = base.concat(entry);
      return {
        status: "navigating",
        stack,
        index: stack.length - 1,
        pending: { path, mode: "push" },
        error: undefined,
      };
    },
    replace: (path: string) => ({ from }) => {
      const entry: RouteEntry = { path };
      if (from.index < 0) {
        return {
          status: "navigating",
          stack: [entry],
          index: 0,
          pending: { path, mode: "replace" },
          error: undefined,
        };
      }
      const stack = from.stack.slice();
      stack[from.index] = entry;
      return {
        status: "navigating",
        stack,
        index: from.index,
        pending: { path, mode: "replace" },
        error: undefined,
      };
    },
    redirect: (path: string) => ({ from }) => {
      const entry: RouteEntry = { path };
      if (from.index < 0) {
        return {
          status: "navigating",
          stack: [entry],
          index: 0,
          pending: { path, mode: "redirect" },
          error: undefined,
        };
      }
      const stack = from.stack.slice();
      stack[from.index] = entry;
      return {
        status: "navigating",
        stack,
        index: from.index,
        pending: { path, mode: "redirect" },
        error: undefined,
      };
    },
    pop: () => ({ from }) => {
      if (from.index <= 0) {
        // nothing to pop
        return { ...from, status: "idle", pending: undefined, error: undefined };
      }
      return {
        ...from,
        status: "idle",
        pending: undefined,
        error: undefined,
        index: from.index - 1,
      };
    },
    complete: (params?: Record<string, unknown>) => ({ from }) => {
      const pending = from.pending;
      if (!pending) {
        return { ...from, status: "idle", error: undefined };
      }
      // Overwrite current entry with resolved params
      const stack = from.stack.slice();
      const entry: RouteEntry = { path: pending.path, params };
      const idx = from.index < 0 ? 0 : from.index;
      stack[idx] = entry;
      return {
        status: "idle",
        stack,
        index: idx,
        pending: undefined,
        error: undefined,
      };
    },
    fail: (error: string) => ({ from }) => ({
      ...from,
      status: "idle",
      error,
      pending: undefined,
    }),
    reset: () => initialState,
  });
}
