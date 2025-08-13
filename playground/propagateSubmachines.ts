import { setup } from "../src/ext/setup";
import { resolveExit as hookResolveExit } from "../src/state-machine-hooks";

// Minimal duck-typed machine shape
type AnyMachine = { getState(): any; send?: Function; dispatch?: Function };

function looksLikeMachine(x: any): x is AnyMachine {
  return (
    !!x && typeof x.getState === "function" &&
    (typeof (x as any).send === "function" || typeof (x as any).dispatch === "function")
  );
}

function getChildFromParentState(state: any): AnyMachine | undefined {
  const m = state?.data?.machine;
  return looksLikeMachine(m) ? m : undefined;
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

  // 2) Additionally, patch send/dispatch to guarantee child-first routing even when parent has no transitions
  return (target: M) => {
    const disposeEnhance = enhanceResolve(target as any);
    const origSend = typeof (target as any).send === "function" ? (target as any).send.bind(target) : undefined;
    const origDispatch = typeof (target as any).dispatch === "function" ? (target as any).dispatch.bind(target) : undefined;

    function childFirst(type: string, ...params: any[]) {
      const parentState = machine.getState();
      const child = getChildFromParentState(parentState);
      if (child) {
        if (typeof (child as any).resolveExit === "function") {
          const probe = (child as any).resolveExit({ type, params, from: child.getState() });
          if (probe) {
            trySend(child, type, ...params);
            return; // handled by child
          }
        } else {
          const before = snapshot(child);
          trySend(child, type, ...params);
          if (!statesEqual(before, snapshot(child))) return;
        }
      }
      // Not handled by child → call original
      if (origSend) return origSend(type, ...params);
      if (origDispatch) return origDispatch(type, ...params);
    }

    if (origSend) (target as any).send = childFirst;
    if (origDispatch) (target as any).dispatch = childFirst;

    return () => {
      disposeEnhance();
      if (origSend) (target as any).send = origSend;
      if (origDispatch) (target as any).dispatch = origDispatch;
    };
  };
}
