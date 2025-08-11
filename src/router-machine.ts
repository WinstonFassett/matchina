import { matchina } from "./matchina";
import { defineStates } from "./define-states";

// Define generic router states that can be used by any routing implementation
export const ROUTER_STATES = defineStates({
  Idle: () => ({ path: "" }),
  Navigating: (path: string) => ({ path }),
  Active: (path: string, params?: Record<string, any>) => ({ path, params }),
  Error: (path: string, error: string) => ({ path, error }),
});

// Define standard routing transitions
export const ROUTER_TRANSITIONS = {
  Idle: {
    push: (path: string) => () => ROUTER_STATES.Active(path),
    replace: (path: string) => () => ROUTER_STATES.Active(path),
    redirect: (path: string) => () => ROUTER_STATES.Navigating(path),
  },
  Navigating: {
    complete: (path: string, params?: Record<string, any>) => 
      () => ROUTER_STATES.Active(path, params),
    fail: (path: string, error: string) => 
      () => ROUTER_STATES.Error(path, error),
  },
  Active: {
    push: (path: string) => () => ROUTER_STATES.Navigating(path),
    replace: (path: string) => () => ROUTER_STATES.Navigating(path),
    redirect: (path: string) => () => ROUTER_STATES.Navigating(path),
    back: () => "Idle",
    forward: () => "Idle",
  },
  Error: {
    retry: (path: string) => () => ROUTER_STATES.Navigating(path),
    reset: () => "Idle",
  },
} as const;

// Create a generic router machine
export const createRouterMachine = () => {
  return matchina(
    ROUTER_STATES,
    ROUTER_TRANSITIONS as any,
    ROUTER_STATES.Idle()
  );
};

export type RouterMachine = ReturnType<typeof createRouterMachine>;
