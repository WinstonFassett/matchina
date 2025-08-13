import { createStoreMachine, type StoreMachine } from "./store-machine";

// Minimal, dead-simple router state: just the current path
export type RouterState = { path: string };

export type RouterTransitions = {
  push: (path: string) => (change: { from: RouterState }) => RouterState;
  replace: (path: string) => (change: { from: RouterState }) => RouterState;
  redirect: (path: string) => (change: { from: RouterState }) => RouterState;
  pop: () => (change: { from: RouterState }) => RouterState;
};

export type RouterStore = StoreMachine<RouterState, RouterTransitions>;

export function createRouterStore(): RouterStore {
  return createStoreMachine<RouterState, RouterTransitions>({ path: "" }, {
    push: (path: string) => ({ from }) => (from.path === path ? from : { path }),
    replace: (path: string) => ({ from }) => (from.path === path ? from : { path }),
    redirect: (path: string) => ({ from }) => (from.path === path ? from : { path }),
    pop: () => ({ from }) => from,
  });
}
