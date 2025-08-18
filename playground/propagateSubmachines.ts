import { setup } from "../src/ext/setup";
import { resolveExit as hookResolveExit } from "../src/state-machine-hooks";
import { isMachine } from "../src/is-machine";
import { enhanceMethod } from "../src/ext/methodware/enhance-method";

// Minimal duck-typed machine shape
type AnyMachine = { getState(): any; send?: Function; dispatch?: Function };

function getChildFromParentState(state: any): AnyMachine | undefined {
  const m = (state?.machine ?? state?.data?.machine ?? state?.data?.data?.machine) as any;
  if (!m) return undefined;
  if (isMachine(m)) return m as AnyMachine;
  const duck = typeof m?.getState === "function" && (typeof m?.send === "function" || typeof m?.dispatch === "function");
  return duck ? (m as AnyMachine) : undefined;
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
  // 1) Enhance resolveExit to supply sane defaults for probes
  const enhanceResolve = hookResolveExit((ev: any, next: (ev: any) => any) => {
    const from = ev?.from ?? machine.getState();
    const params = Array.isArray(ev?.params) ? ev.params : [];
    return next({ ...ev, from, params });
  });

  // 2) Additionally, enhance send/dispatch using the library enhancer utilities
  return (target: M) => {
    const disposeResolve = enhanceResolve(target as any);
    const wrapped = new WeakSet<object>();
    let lastDuckInvoked = false;

    const wrapChild = () => {
      const parentState = machine.getState();
      const child = getChildFromParentState(parentState);
      if (!child || wrapped.has(child as any)) return () => {};
      wrapped.add(child as any);
      const duck = !isMachine(child as any);
      const unSendChild = typeof (child as any).send === "function"
        ? enhanceMethod(child as any, "send", (next) => (type: string, ...params: any[]) => {
            const before = snapshot(child);
            const grandBefore = getChildFromParentState(before);
            const grandBeforeSnap = grandBefore ? snapshot(grandBefore) : undefined;
            const res = (next as any)(type, ...params);
            const after = snapshot(child);
            const grandAfter = getChildFromParentState(after);
            const grandAfterSnap = grandAfter ? snapshot(grandAfter) : undefined;
            const handled = before?.key !== after?.key || (grandBefore && grandAfter && grandBeforeSnap?.key !== grandAfterSnap?.key);
            if (handled) {
              const looksExit = duck
                ? !!after?.data?.final
                : (!!after?.data?.final || (!after?.data?.machine && !after?.machine));
              console.log('looksExit', looksExit);
              if (looksExit) {
                const id = parentState?.data?.id ?? parentState?.id;
                const beforeParent = machine.getState();
                const ev = (machine as any).resolveExit?.({ type: "child.exit", params: [{ id, state: after?.key, data: after?.data }], from: beforeParent });
                if (ev) {
                  (machine as any).transition?.(ev);
                }
              }
            }
            return res;
          })
        : () => {};
      const unDispatchChild = typeof (child as any).dispatch === "function"
        ? enhanceMethod(child as any, "dispatch", (next) => (type: string, ...params: any[]) => {
            const before = snapshot(child);
            const grandBefore = getChildFromParentState(before);
            const grandBeforeSnap = grandBefore ? snapshot(grandBefore) : undefined;
            const res = (next as any)(type, ...params);
            const after = snapshot(child);
            const grandAfter = getChildFromParentState(after);
            const grandAfterSnap = grandAfter ? snapshot(grandAfter) : undefined;
            const handled = before?.key !== after?.key || (grandBefore && grandAfter && grandBeforeSnap?.key !== grandAfterSnap?.key);
            if (handled) {
              const looksExit = !!after?.data?.final || (!after?.data?.machine && !after?.machine);
              console.log('looksExit', looksExit);
              if (looksExit) {
                const id = parentState?.data?.id ?? parentState?.id;
                const beforeParent = machine.getState();
                const ev = (machine as any).resolveExit?.({ type: "child.exit", params: [{ id, state: after?.key, data: after?.data }], from: beforeParent });
                if (ev) {
                  (machine as any).transition?.(ev);
                }
              }
            }
            return res;
          })
        : () => {};
      return () => {
        unSendChild();
        unDispatchChild();
      };
    };
    let unwrapChild = wrapChild();

    const childFirst = (type: string, ...params: any[]): boolean => {
      const parentState = machine.getState();
      const child = getChildFromParentState(parentState);
      if (child) {
        lastDuckInvoked = false;
        const before = snapshot(child);
        const grandBefore = getChildFromParentState(before);
        const grandBeforeSnap = grandBefore ? snapshot(grandBefore) : undefined;
        let threw = false;
        try {
          trySend(child, type, ...params);
        } catch {
          threw = true;
        }
        const after = snapshot(child);
        const grandAfter = getChildFromParentState(after);
        const grandAfterSnap = grandAfter ? snapshot(grandAfter) : undefined;
        const handledByState = before?.key !== after?.key || (grandBefore && grandAfter && grandBeforeSnap?.key !== grandAfterSnap?.key);
        const handled = !threw && handledByState;
        if (handled) {
          const duckChild = !isMachine(child as any);
          const looksExit = duckChild
            ? !!after?.data?.final
            : (!!after?.data?.final || (!after?.data?.machine && !after?.machine));
          console.log('looksExit', looksExit);
          if (looksExit) {
            const id = parentState?.data?.id ?? parentState?.id;
            const beforeParent = machine.getState();
            const ev = (machine as any).resolveExit?.({ type: "child.exit", params: [{ id, state: after?.key, data: after?.data }], from: beforeParent });
            if (ev) {
              (machine as any).transition?.(ev);
            }
          }
          return true;
        }
      }
      // Not handled by child
      return false;
    };

    const unSend = typeof (target as any).send === "function"
      ? enhanceMethod(target as any, "send", (next) => (type: string, ...params: any[]) => {
          const handled = childFirst(type, ...params);
          if (handled) return; // child handled
          // Pre-resolve to honor immutable self-transition semantics
          const before = machine.getState();
          const resolved = (machine as any).resolveExit?.({ type, params, from: before });
          if (resolved && resolved.to?.key === before.key) {
            return; // no-op on self-transition to preserve identity
          }
          const res = (next as any)(type, ...params);
          // child may have changed identity; re-wrap
          unwrapChild();
          unwrapChild = wrapChild();
          return res;
        })
      : () => {};

    const unDispatch = typeof (target as any).dispatch === "function"
      ? enhanceMethod(target as any, "dispatch", (next) => (type: string, ...params: any[]) => {
          const handled = childFirst(type, ...params);
          if (handled) return; // child handled
          const before = machine.getState();
          const resolved = (machine as any).resolveExit?.({ type, params, from: before });
          if (resolved && resolved.to?.key === before.key) {
            return;
          }
          const res = (next as any)(type, ...params);
          unwrapChild();
          unwrapChild = wrapChild();
          return res;
        })
      : () => {};

    return () => {
      disposeResolve();
      unwrapChild();
      unSend();
      unDispatch();
    };
  };
}
