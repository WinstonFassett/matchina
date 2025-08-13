import { setup } from "../src/ext/setup";
import { resolveExit as hookResolveExit } from "../src/state-machine-hooks";
import { isMachine } from "../src/is-machine";
import { enhanceMethod } from "../src/ext/methodware/enhance-method";

// Minimal duck-typed machine shape
type AnyMachine = { getState(): any; send?: Function; dispatch?: Function };

function getChildFromParentState(state: any): AnyMachine | undefined {
  const m = state?.data?.machine;
  return isMachine(m) ? (m as AnyMachine) : undefined;
}

function trySend(m: AnyMachine, type: string, ...params: any[]) {
  if (typeof m.send === "function") return (m.send as any)(type, ...params);
  if (typeof m.dispatch === "function") return (m.dispatch as any)(type, ...params);
}

function snapshot(m: AnyMachine) {
  return m.getState();
}

function statesEqual(a: any, b: any) {
  // Reference equality is sufficient for our immutable-first semantics
  return Object.is(a, b);
}

// Setup function to enable child-first hierarchical routing on a machine.
// Usage: setup(machine)(propagateSubmachines(machine))
export function propagateSubmachines<M extends AnyMachine>(machine: M) {
  // 1) Enhance resolveExit to pre-handle via child when possible
  const enhanceResolve = hookResolveExit((ev: any, next: (ev: any) => any) => {
    const parentState = machine.getState();
    const child = getChildFromParentState(parentState);
    if (!child) return next(ev);

    if (typeof (child as any).resolveExit === "function") {
      const probe = (child as any).resolveExit({ type: ev.type, params: ev.params, from: child.getState() });
      if (probe) {
        trySend(child, ev.type, ...(ev.params ?? []));
        return undefined;
      }
      return next(ev);
    }

    const before = snapshot(child);
    trySend(child, ev.type, ...(ev.params ?? []));
    const after = snapshot(child);
    return !statesEqual(before, after) ? undefined : next(ev);
  });

  // 2) Additionally, enhance send/dispatch using the library enhancer utilities
  return (target: M) => {
    const disposeResolve = enhanceResolve(target as any);

    const childFirst = (type: string, ...params: any[]): boolean => {
      const parentState = machine.getState();
      const child = getChildFromParentState(parentState);
      if (child) {
        if (typeof (child as any).resolveExit === "function") {
          const probe = (child as any).resolveExit({ type, params, from: child.getState() });
          if (probe) {
            trySend(child, type, ...params);
            return true; // handled by child
          }
        } else {
          const before = snapshot(child);
          trySend(child, type, ...params);
          if (!statesEqual(before, snapshot(child))) return true; // handled
        }
      }
      // Not handled by child
      return false;
    };

    const unSend = typeof (target as any).send === "function"
      ? enhanceMethod(target as any, "send", (next) => (type: string, ...params: any[]) => {
          const handled = childFirst(type, ...params);
          if (handled) return; // child handled
          return (next as any)(type, ...params);
        })
      : () => {};

    const unDispatch = typeof (target as any).dispatch === "function"
      ? enhanceMethod(target as any, "dispatch", (next) => (type: string, ...params: any[]) => {
          const handled = childFirst(type, ...params);
          if (handled) return; // child handled
          return (next as any)(type, ...params);
        })
      : () => {};

    return () => {
      disposeResolve();
      unSend();
      unDispatch();
    };
  };
}
