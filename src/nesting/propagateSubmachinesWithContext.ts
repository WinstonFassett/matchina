import type { FactoryMachine } from "../factory-machine";
import { resolveExit as hookResolveExit, send } from "../state-machine-hooks";
import { enhanceMethod } from "../ext/methodware/enhance-method";
import { buildSetup } from "../ext/setup";
import { isFactoryMachine } from "../machine-brand";
import { AllEventsOf } from "./types";

// Type definition for enhanced states with context
interface StateWithContext {
  stack?: any[];
  depth?: number;
  fullkey?: string;
}

// Minimal duck-typed machine shape 
type AnyMachine = { getState(): any; send?: (...args: any[]) => void };

function getChildFromParentState(state: any): AnyMachine | undefined {
  const m = (state?.machine ?? state?.data?.machine ?? state?.data?.data?.machine) as any;
  if (!m) return undefined;
  // Prefer brand-based detection for our FactoryMachine instances
  if (isFactoryMachine(m)) return m as AnyMachine;

  // STRICT VALIDATION fallback: require getState AND send
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

// Build context information for a state
function buildStateContext(currentState: any, ancestorStack: any[] = []): StateWithContext {
  const stack = [...ancestorStack, currentState];
  const depth = stack.length - 1;
  const fullkey = stack.map(s => s.key).join('.');
  
  return { stack, depth, fullkey };
}

// Enhance a state with context information  
function enhanceStateWithContext(state: any, context: StateWithContext) {
  Object.assign(state, {
    stack: context.stack,
    depth: context.depth,
    fullkey: context.fullkey
  });
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
  // Read parent state fresh when triggering exit to avoid stale capture
  const currentParentState = machine.getState();
  const ev = (machine as any).resolveExit?.({
    type: "child.exit",
    params: [{ id, state: after?.key, data: after?.data }],
    from: currentParentState,
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
        // Use up-to-date parent state when signaling exit
        triggerExit(machine, machine.getState(), after);
      }
    }
    return res;
  };
}

/**
 * Enhanced setup function to enable child-first hierarchical routing with context propagation.
 * 
 * This enhanced version adds stack, depth, and fullkey properties directly to states for
 * better debugging and visualization support.
 * 
 * @param machineIgnoreThis - The machine parameter (unused, for type inference)
 * @returns Setup function to be used with `setup(machine)(propagateSubmachinesWithContext(machine))`
 * 
 * @experimental This API is experimental and may change
 */
export function propagateSubmachinesWithContext<M extends FactoryMachine<any>>(machineIgnoreThis: M, ancestorStack: any[] = []) {
  return (machine: M) => {
    const [addSetup, disposeAll] = buildSetup(machine);
    
    // 1) Enhance getState to add context dynamically
    const originalGetState = machine.getState;
    machine.getState = () => {
      const state = originalGetState.call(machine);
      const context = buildStateContext(state, ancestorStack);
      return enhanceStateWithContext(state, context);
    };
    
    // 2) Enhance resolveExit to supply sane defaults for probes
    addSetup(hookResolveExit((ev: any, next: (ev: any) => any) => {
      const from = ev?.from ?? machine.getState();
      const params = Array.isArray(ev?.params) ? ev.params : [];
      return next({ ...ev, from, params });
    }));

    // 3) Enhance send using the library enhancer utilities
    const wrapped = new WeakSet<object>();
    
    const wrapChild = () => {
      const parentState = originalGetState.call(machine); // Use original to avoid infinite recursion
      const child = getChildFromParentState(parentState);
      if (!child || wrapped.has(child as any)) return () => {};
      wrapped.add(child as any);
      const duck = !isFactoryMachine(child as any);

      const [addSetup, disposeAll] = buildSetup(child);
      
      // Recursively enhance child machines with their own context
      const currentState = originalGetState.call(machine);
      const childStack = [...ancestorStack, currentState];
      if (!duck) {
        propagateSubmachinesWithContext(child as any, childStack)(child as any);
      }
      
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
      
      // Enhance child state with context after transition
      const childContext = buildStateContext(machine, ancestorStack);
      enhanceStateWithContext(after, childContext);
      
      const handledByState = isHandled(before, after, grandBeforeSnap, grandAfterSnap);
      const duckChild = !isFactoryMachine(child as any);
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
        
        // Enhance the resulting state with context
        const newState = machine.getState();
        const context = buildStateContext(machine, ancestorStack);
        enhanceStateWithContext(newState, context);
        
        // child may have changed identity; re-wrap
        unwrapChild();
        unwrapChild = wrapChild();
        return resultMaybe;        
      })
    );

    return disposeAll;
  };
}

// Enhanced machine type with hierarchical event support
export type HierarchicalMachineWithContext<M> = M & {
  send: (type: HierarchicalEvents<M>, ...params: any[]) => void;
  getState: () => ReturnType<M['getState']> & StateWithContext;
};

// Type that represents all possible events in a hierarchical machine
export type HierarchicalEvents<M> = 
  | AllEventsOf<M>  // Parent events
  | string; // Allow any string for propagated child events

/**
 * Create a hierarchical machine wrapper with enhanced event routing and context propagation.
 * 
 * @param machine - The factory machine to wrap with hierarchical features
 * @returns Enhanced machine with hierarchical capabilities, typed event routing, and context
 * 
 * @experimental This API is experimental and may change
 */
export function createHierarchicalMachineWithContext<M extends FactoryMachine<any>>(machine: M): HierarchicalMachineWithContext<M> {
  // Initialize context enhancement with empty ancestor stack (root level)
  propagateSubmachinesWithContext(machine, [])(machine);
  
  // Return with enhanced type
  return machine as HierarchicalMachineWithContext<M>;
}