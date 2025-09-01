import type { FactoryMachine } from "../factory-machine";
import { resolveExit as hookResolveExit, send } from "../state-machine-hooks";
import { enhanceMethod } from "../ext/methodware/enhance-method";
import { buildSetup } from "../ext/setup";
import { isFactoryMachine } from "../machine-brand";
import { AllEventsOf } from "./types";

// Shared stack that all machines reference
let globalHierarchyStack: any[] = [];

// Export function to reset the global stack (useful for testing)
export function resetGlobalHierarchyStack() {
  globalHierarchyStack.length = 0;
}

// Type definition for enhanced states with context
interface StateWithContext {
  stack: any[];
  depth: number;
  fullkey: string;
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

// Build context for a state using the shared stack
function buildStateContext(state: any, sharedStack: any[], myDepth: number): StateWithContext {
  const fullkey = sharedStack.slice(0, myDepth + 1).map(s => s.key).join('.');
  
  return { 
    stack: sharedStack, 
    depth: myDepth, 
    fullkey 
  };
}

// Enhance a state with context information  
function enhanceStateWithContext(state: any, context: StateWithContext): any {
  return Object.assign(state, {
    stack: context.stack,
    depth: context.depth,
    fullkey: context.fullkey
  });
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
 * Setup function to enable child-first hierarchical routing with shared stack context.
 * 
 * Each machine automatically determines its depth by looking at the current shared stack.
 * 
 * @param machineIgnoreThis - The machine parameter (unused, for type inference)
 * @returns Setup function to be used with `setup(machine)(propagateSubmachines(machine))`
 */
export function propagateSubmachines<M extends FactoryMachine<any>>(machineIgnoreThis: M) {
  return (machine: M) => {
    const [addSetup, disposeAll] = buildSetup(machine);
    
    // Auto-determine my depth from current shared stack
    const myDepth = globalHierarchyStack.length;
    
    // Enhance getState to add context using shared stack
    const originalGetState = machine.getState;
    const childEnhanced = new WeakSet<object>();
    
    machine.getState = () => {
      const state = originalGetState.call(machine);
      
      // Update the shared stack at my position
      globalHierarchyStack[myDepth] = state;
      
      // Auto-enhance any child machines when parent state is accessed
      const child = getChildFromParentState(state);
      if (child && !childEnhanced.has(child as any)) {
        childEnhanced.add(child as any);
        const childDepth = myDepth + 1;
        const originalChildGetState = (child as any).getState;
        (child as any).getState = () => {
          const childState = originalChildGetState.call(child);
          globalHierarchyStack[childDepth] = childState;
          
          // Also enhance any grandchildren (one level deep only)
          const grandChild = getChildFromParentState(childState);
          if (grandChild && !childEnhanced.has(grandChild as any)) {
            childEnhanced.add(grandChild as any);
            const grandChildDepth = childDepth + 1;
            const originalGrandChildGetState = (grandChild as any).getState;
            (grandChild as any).getState = () => {
              const grandChildState = originalGrandChildGetState.call(grandChild);
              globalHierarchyStack[grandChildDepth] = grandChildState;
              const grandChildContext = buildStateContext(grandChildState, globalHierarchyStack, grandChildDepth);
              return enhanceStateWithContext(grandChildState, grandChildContext);
            };
          }
          
          const context = buildStateContext(childState, globalHierarchyStack, childDepth);
          return enhanceStateWithContext(childState, context);
        };
      }
      
      // Build context using shared stack
      const context = buildStateContext(state, globalHierarchyStack, myDepth);
      return enhanceStateWithContext(state, context);
    };
    
    // Enhance resolveExit to supply sane defaults for probes
    addSetup(hookResolveExit((ev: any, next: (ev: any) => any) => {
      const from = ev?.from ?? machine.getState();
      const params = Array.isArray(ev?.params) ? ev.params : [];
      return next({ ...ev, from, params });
    }));

    // Child-first event routing
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
        
        return innerSend(type, ...params);
      })
    );

    return disposeAll;
  };
}

// Enhanced machine type with hierarchical event support
export type HierarchicalMachine<M> = M & {
  send: (type: HierarchicalEvents<M>, ...params: any[]) => void;
  getState: () => (M extends { getState(): infer S } ? S : any) & StateWithContext;
};

// Type that represents all possible events in a hierarchical machine
export type HierarchicalEvents<M> = 
  | AllEventsOf<M>  // Parent events
  | string; // Allow any string for propagated child events

/**
 * Create a hierarchical machine wrapper with enhanced event routing and shared stack context.
 * 
 * @param machine - The factory machine to wrap with hierarchical features
 * @returns Enhanced machine with hierarchical capabilities, typed event routing, and context
 */
export function createHierarchicalMachine<M extends FactoryMachine<any>>(machine: M): HierarchicalMachine<M> {
  // Initialize machine with auto-determined depth
  propagateSubmachines(machine)(machine);
  
  // Return with enhanced type
  return machine as HierarchicalMachine<M>;
}