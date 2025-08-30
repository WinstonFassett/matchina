import type { FactoryMachine } from "../src";
import { resolveExit as hookResolveExit, send } from "../src";
import { enhanceMethod } from "../src/ext/methodware/enhance-method";
import { buildSetup, setup } from "../src/ext/setup";
import { isMachine } from "../src/is-machine";
import type { AllEventsOf } from "./types";

// Minimal duck-typed machine shape 
type AnyMachine = { getState(): any; send?: (...args: any[]) => void };

function getChildFromParentState(state: any): AnyMachine | undefined {
  const m = (state?.machine ?? state?.data?.machine ?? state?.data?.data?.machine) as any;
  if (!m) return undefined;
  if (isMachine(m)) return m as AnyMachine;
  
  // STRICT VALIDATION: A real machine MUST have getState AND send
  const isValidMachine = typeof m?.getState === "function" && typeof m?.send === "function";
  return isValidMachine ? (m as AnyMachine) : undefined;
}

function trySend(m: AnyMachine, type: string, ...params: any[]) {
  if (!m) throw new Error("Cannot send to undefined machine");
  if (typeof m.send !== "function") {
    throw new Error('Invalid state machine: send method is required');
  }
  return (m.send as any)(type, ...params);
}

function snapshot(m: AnyMachine) {
  if (!m || typeof m.getState !== 'function') {
    throw new Error('Invalid state machine: getState is not a function');
  }
  const state = m.getState();
  if (state === undefined) {
    throw new Error('Invalid state: getState() returned undefined');
  }
  return state;
}

function isHandled(before: any, after: any, grandBeforeSnap?: any, grandAfterSnap?: any): boolean {
  return before?.key !== after?.key || 
         (grandBeforeSnap && grandAfterSnap && grandBeforeSnap?.key !== grandAfterSnap?.key);
}

function looksLikeExit(after: any, grandAfterSnap: any, hadMachine: boolean, hasMachine: boolean, duck: boolean, includeDataStateExitForDuck: boolean): boolean {
  const grandFinal = !!grandAfterSnap?.data?.final;
  const machineLost = hadMachine && !hasMachine;
  const hasData = after?.data !== undefined && after?.data !== null;
  const noMachine = !hasMachine;
  const dataStateExit = hasData && noMachine && (duck ? includeDataStateExitForDuck : true);
  
  return duck
    ? !!after?.data?.final
    : (!!after?.data?.final || machineLost || grandFinal || dataStateExit);
}

function triggerExit(machine: FactoryMachine<any>, parentState: any, after: any) {
  const id = parentState?.data?.id ?? parentState?.id;
  const beforeParent = machine.getState();
  const ev = (machine as any).resolveExit?.({ 
    type: "child.exit", 
    params: [{ id, state: after?.key, data: after?.data }], 
    from: beforeParent 
  });
  if (ev) {
    machine.transition?.(ev);
  }
}

function enhanceSend(child: AnyMachine, machine: FactoryMachine<any>, parentState: any, duck: boolean, includeDataStateExitForDuck: boolean) {
  return (send: any) => (type: string, ...params: any[]) => {
    const before = snapshot(child);
    const grandBefore = getChildFromParentState(before);
    const grandBeforeSnap = grandBefore ? snapshot(grandBefore) : undefined;
    const res = send(type, ...params);
    const after = snapshot(child);
    const grandAfter = getChildFromParentState(after);
    const grandAfterSnap = grandAfter ? snapshot(grandAfter) : undefined;
    
    if (isHandled(before, after, grandBeforeSnap, grandAfterSnap)) {
      const hadMachine = before?.data?.machine || before?.machine;
      const hasMachine = after?.data?.machine || after?.machine;
      
      if (looksLikeExit(after, grandAfterSnap, hadMachine, hasMachine, duck, includeDataStateExitForDuck)) {
        triggerExit(machine, parentState, after);
      }
    }
    return res;
  };
}

// Setup function to enable child-first hierarchical routing on a machine.
// Usage: setup(machine)(propagateSubmachines(machine))
export function propagateSubmachines<M extends FactoryMachine<any>>(machineIgnoreThis: M) {
  return (machine: M) => {
    const [addSetup, disposeAll] = buildSetup(machine);
    
    // 1) Enhance resolveExit to supply sane defaults for probes
    addSetup(hookResolveExit((ev: any, next: (ev: any) => any) => {
      const from = ev?.from ?? machine.getState();
      const params = Array.isArray(ev?.params) ? ev.params : [];
      return next({ ...ev, from, params });
    }));

    // 2) Enhance send using the library enhancer utilities
    const wrapped = new WeakSet<object>();
    
    const wrapChild = () => {
      const parentState = machine.getState();
      const child = getChildFromParentState(parentState);
      if (!child || wrapped.has(child as any)) return () => {};
      wrapped.add(child as any);
      const duck = !isMachine(child as any);

      const [addSetup, disposeAll] = buildSetup(child);
      
      // Enhance send if it exists
      if (typeof child.send === 'function') {
        addSetup(child => enhanceMethod(child as any, "send", enhanceSend(child, machine, parentState, duck, false)));
      }
      
      return disposeAll;
    };
    
    let unwrapChild = wrapChild();

    const childFirst = (type: string, ...params: any[]): boolean => {
      const parentState = machine.getState();
      const child = getChildFromParentState(parentState);
      if (!child) return false;
      
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
      
      const handledByState = isHandled(before, after, grandBeforeSnap, grandAfterSnap);
      const duckChild = !isMachine(child as any);
      const handled = !threw && (handledByState || duckChild);
      
      if (handled) {
        const hadMachine = before?.data?.machine || before?.machine;
        const hasMachine = after?.data?.machine || after?.machine;
        
        if (looksLikeExit(after, grandAfterSnap, hadMachine, hasMachine, duckChild, true)) {
          triggerExit(machine, parentState, after);
        }
        return true;
      }
      return false;
    };

    addSetup(() => () => { unwrapChild(); });

    addSetup(
      send(innerSend => (type, ...params) => {
        const handled = childFirst(type, ...params);
        if (handled) return; // child handled
        
        const from = machine.getState();
        const resolved = (machine).resolveExit?.({ type, params, from } as any);
        
        // Allow self-transitions when they carry parameters
        if (resolved && resolved.to?.key === from.key && (!params || params.length === 0)) {
          return; // no-op on parameterless self-transition
        }
        
        const resultMaybe = innerSend(type, ...params);
        // child may have changed identity; re-wrap
        unwrapChild();
        unwrapChild = wrapChild();
        return resultMaybe;        
      })
    );

    return disposeAll;
  };
}

// Type that represents all possible events in a hierarchical machine
export type HierarchicalEvents<M> = 
  | AllEventsOf<M>  // Parent events
  | string; // Allow any string for propagated child events

// Enhanced machine type with hierarchical event support
export type HierarchicalMachine<M> = M & {
  send: (type: HierarchicalEvents<M>, ...params: any[]) => void;
};

// Create a typed hierarchical machine facade
export function createHierarchicalMachine<M extends FactoryMachine<any>>(machine: M): HierarchicalMachine<M> {
  // Apply runtime enhancement
  setup(machine)(propagateSubmachines(machine));
  
  // Return with enhanced type
  return machine as HierarchicalMachine<M>;
}
