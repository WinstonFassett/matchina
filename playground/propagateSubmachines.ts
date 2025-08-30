import { FactoryMachine } from "../src";
import { enhanceMethod } from "../src/ext/methodware/enhance-method";
import { buildSetup } from "../src/ext/setup";
import { isMachine } from "../src/is-machine";
import { resolveExit as hookResolveExit, hookSetup } from "../src/state-machine-hooks";

// Minimal duck-typed machine shape
type AnyMachine = { getState(): any; send?: (...args: any[]) => void; dispatch?: (...args: any[]) => void };

function getChildFromParentState(state: any): AnyMachine | undefined {
  const m = (state?.machine ?? state?.data?.machine ?? state?.data?.data?.machine) as any;
  if (!m) return undefined;
  if (isMachine(m)) return m as AnyMachine;
  
  // STRICT VALIDATION: A real machine MUST have getState AND either send or dispatch
  // Otherwise it's not a valid state machine at all and should be rejected
  const isValidMachine = typeof m?.getState === "function" && (typeof m?.send === "function" || typeof m?.dispatch === "function");
  return isValidMachine ? (m as AnyMachine) : undefined;
}

function trySend(m: AnyMachine, type: string, ...params: any[]) {
  // Ensure m exists and is an object
  if (!m) {
    throw new Error('Cannot send to undefined machine');
  }
  
  // A valid machine MUST have either send or dispatch
  if (typeof m.send !== "function" && typeof m.dispatch !== "function") {
    throw new Error('Invalid state machine: neither send nor dispatch method exists');
  }
  
  // Prefer send for branded machines, dispatch for duck-typed children
  if (isMachine(m)) {
    if (typeof m.send === "function") return (m.send as any)(type, ...params);
    if (typeof m.dispatch === "function") return (m.dispatch as any)(type, ...params);
  } else {
    // Duck-typed children may use either method
    if (typeof m.dispatch === "function") return (m.dispatch as any)(type, ...params);
    if (typeof m.send === "function") return (m.send as any)(type, ...params);
  }
}

function snapshot(m: AnyMachine) {
  // If m is not a valid machine, it should never have gotten here in the first place
  // But just in case, add a defensive check
  if (!m || typeof m.getState !== 'function') {
    throw new Error('Invalid state machine: getState is not a function');
  }
  const state = m.getState();
  if (state === undefined) {
    throw new Error('Invalid state: getState() returned undefined');
  }
  return state;
}

const hookSend = hookSetup("send")

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

      const [addSetup, disposeAll] = buildSetup(child)
      
      // addSetup(child => enhanceMethod(child as any, "send", (next) => (type: string, ...params: any[]) => {
      // }))
      addSetup(hookSend((send) => (type, ...params) => {
        const before = snapshot(child);
        const grandBefore = getChildFromParentState(before);
        const grandBeforeSnap = grandBefore ? snapshot(grandBefore) : undefined;
        const res = send(type, ...params);
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
          // Check if child machine was lost (existed before but not after)
          const hadMachine = before?.data?.machine || before?.machine;
          const hasMachine = after?.data?.machine || after?.machine;
          const machineLost = hadMachine && !hasMachine;
          
          // Check if this is a data state with no child machine (exit state pattern)
          const hasData = after?.data !== undefined && after?.data !== null;
          const noMachine = !hasMachine;
          const dataStateExit = hasData && noMachine && !duck;
          
          const looksExit = duck
            ? !!after?.data?.final
            : (!!after?.data?.final || machineLost || grandFinal || dataStateExit);
          if (looksExit) {
            const id = parentState?.data?.id ?? parentState?.id;
            const beforeParent = machine.getState();
            const ev = (machine as any).resolveExit?.({ type: "child.exit", params: [{ id, state: after?.key, data: after?.data }], from: beforeParent });
            if (ev) {
              machine.transition?.(ev);
            }
          }
        }
        return res;          
      }) as any)

      // Only enhance dispatch if the child originally has one
      const hasDispatch = typeof child.dispatch === 'function';
      if (hasDispatch) {
        addSetup(child => enhanceMethod(child as any, "dispatch", (next) => (type: string, ...params: any[]) => {
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
          // Check if child machine was lost (existed before but not after)
          const hadMachine = before?.data?.machine || before?.machine;
          const hasMachine = after?.data?.machine || after?.machine;
          const machineLost = hadMachine && !hasMachine;
          
          // Check if this is a data state with no child machine (exit state pattern)
          const hasData = after?.data !== undefined && after?.data !== null;
          const noMachine = !hasMachine;
          const dataStateExit = hasData && noMachine;
          
          const looksExit = !!after?.data?.final || machineLost || grandFinal || dataStateExit;
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
      }))
      }
      return disposeAll;
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
        // For duck-typed children (not branded machines), treat a successful dispatch/send
        // as handled even if the child's state shape did not change. This allows routing to
        // "dispatch-only" children that record side-effects without mutating state.
        const duckChild = !isMachine(child as any);
        const handled = !threw && (handledByState || duckChild);
        if (handled) {
          const grandFinal = !!grandAfterSnap?.data?.final;
          // Check if child machine was lost (existed before but not after)
          const hadMachine = before?.data?.machine || before?.machine;
          const hasMachine = after?.data?.machine || after?.machine;
          const machineLost = hadMachine && !hasMachine;
          
          // Check if this is a data state with no child machine (exit state pattern)
          const hasData = after?.data !== undefined && after?.data !== null;
          const noMachine = !hasMachine;
          const dataStateExit = hasData && noMachine && !duckChild;
          
          const looksExit = duckChild
            ? !!after?.data?.final
            : (!!after?.data?.final || machineLost || grandFinal || dataStateExit);
          
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

    const dispatchware = (send: any) => (type: string, ...params: any[]) => {
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
    }

    addSetup(
      m => enhanceMethod(m as any, "send", dispatchware),
      m => enhanceMethod(m as any, "dispatch", dispatchware)
    )

    return disposeAll;
  };
}
