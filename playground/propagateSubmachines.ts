import { buildSetup, createSetup, setup } from "../src/ext/setup";
import { resolveExit as hookResolveExit } from "../src/state-machine-hooks";
import { isMachine } from "../src/is-machine";
import { enhanceMethod } from "../src/ext/methodware/enhance-method";
import { createMethodEnhancer } from "../src/ext";
import { DisposeFunc } from "../src/function-types";
import { FactoryMachine } from "../src";

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

// Setup function to enable child-first hierarchical routing on a machine.
// Usage: setup(machine)(propagateSubmachines(machine))
export function propagateSubmachines<M extends FactoryMachine<any>>(machineIgnoreThis: M) {

  return (machine: M) => {
    const [addSetup, disposeAll] = buildSetup(machine)
    
    // 1) Enhance resolveExit to supply sane defaults for probes
    addSetup(hookResolveExit((ev: any, next: (ev: any) => any) => {
      const from = ev?.from ?? machine.getState();
      const params = Array.isArray(ev?.params) ? ev.params : [];
      return next({ ...ev, from, params });
    }))

    // 2) Enhance send/dispatch using the library enhancer utilities
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
              // Consider exit if:
              // - Duck child marks itself final
              // - Machine child marks itself final OR loses its nested machine
              // - Grandchild (nested machine) marks itself final (e.g., promise machine resolved with { final: true })
              const grandFinal = !!grandAfterSnap?.data?.final;
              const looksExit = duck
                ? !!after?.data?.final
                : (!!after?.data?.final || (!after?.data?.machine && !after?.machine) || grandFinal);
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
              const grandFinal = !!grandAfterSnap?.data?.final;
              const looksExit = !!after?.data?.final || (!after?.data?.machine && !after?.machine) || grandFinal;
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
          const grandFinal = !!grandAfterSnap?.data?.final;
          const looksExit = duckChild
            ? !!after?.data?.final
            : (!!after?.data?.final || (!after?.data?.machine && !after?.machine) || grandFinal);
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

    addSetup(m => () => { unwrapChild(); })

    addSetup(m => enhanceMethod(m as any, "send", (send) => (type: string, ...params: any[]) => {
      const handled = childFirst(type, ...params);
      if (handled) return; // child handled
      const from = machine.getState();
      // Pre-resolve to honor immutable self-transition semantics
      const resolved = (machine as any).resolveExit?.({ type, params, from });
      // Allow self-transitions when they carry parameters (e.g., data updates like typed(value))
      if (resolved && resolved.to?.key === from.key && (!params || params.length === 0)) {
        return; // no-op on parameterless self-transition to preserve identity
      }
      const resultMaybe = send(type, ...params);
      // child may have changed identity; re-wrap
      unwrapChild();
      unwrapChild = wrapChild();
      return resultMaybe;
    }))
    
    addSetup(target => enhanceMethod(target as any, "dispatch", (dispatch) => (type: string, ...params: any[]) => {
      const handled = childFirst(type, ...params);
      if (handled) return; // child handled
      const from = machine.getState();
      // Pre-resolve to honor immutable self-transition semantics
      const resolved = (machine as any).resolveExit?.({ type, params, from });
      // Allow self-transitions when they carry parameters (e.g., data updates like typed(value))
      if (resolved && resolved.to?.key === from.key && (!params || params.length === 0)) {
        return; // skip only parameterless self-transition
      }
      const resultMaybe = dispatch(type, ...params);
      unwrapChild();
      unwrapChild = wrapChild();
      return resultMaybe;
    }))

    return disposeAll;
  };
}
