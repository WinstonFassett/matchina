import type { FactoryMachine } from "../factory-machine";
import { send as sendHook } from "../state-machine-hooks";
import { isFactoryMachine } from "../machine-brand";
import { AllEventsOf } from "./types";

// Minimal duck-typed machine shape
type AnyMachine = { getState(): any; send?: (...args: any[]) => void };

function getChildFromParentState(state: any): AnyMachine | undefined {
  const m = state?.data?.machine as any;
  if (!m) return undefined;
  if (isFactoryMachine(m)) return m as AnyMachine;
  const isValid = typeof m?.getState === "function" && typeof m?.send === "function";
  return isValid ? (m as AnyMachine) : undefined;
}

function childWentFinal(beforeState: any, afterState: any): boolean {
  const beforeChild = getChildFromParentState(beforeState);
  const afterChild = getChildFromParentState(afterState);
  
  if (!beforeChild || !afterChild) return false;
  
  const beforeChildState = beforeChild.getState();
  const afterChildState = afterChild.getState();
  
  // Child reached final state
  if (afterChildState?.data?.final) return true;
  
  // Child lost its machine
  if (beforeChildState?.data?.machine && !afterChildState?.data?.machine) return true;
  
  return false;
}

function synthesizeChildExit(machine: FactoryMachine<any>, childState: any) {
  const parentState = machine.getState();
  const id = parentState?.data?.id ?? parentState?.id;
  const ev = (machine as any).resolveExit?.({
    type: "child.exit",
    params: [{ id, state: childState?.key, data: childState?.data }],
    from: parentState,
  });
  if (ev) {
    (machine as any).transition?.(ev);
  }
}

export function propagateSubmachines<M extends FactoryMachine<any>>(machine: M): void {
  // Hook machines discovered in the active chain
  function hookMachine(m: AnyMachine, root: FactoryMachine<any>) {
    if ((m as any).__propagateUnhook) return; // Already hooked
    
    
    // Install send hook on child machine to intercept sends
    const unhook = sendHook((innerSend: any) => (type: string, ...params: any[]) => {
      
      // Route child sends to root for child-first resolution
      return (root as any).send('child.change', { target: m, type, params });
    })(m as any);
    
    (m as any).__propagateUnhook = unhook;
  }

  function unhookMachine(m: AnyMachine) {
    if ((m as any).__propagateUnhook) {
      (m as any).__propagateUnhook();
      delete (m as any).__propagateUnhook;
    }
  }

  function handleAtRoot(type: string, params: any[]) {
    // Handle child.exit events directly at root level without child-first routing
    if (type === 'child.exit') {
      const ev = (machine as any).resolveExit?.({ type, params, from: machine.getState() });
      if (ev) {
        (machine as any).transition?.(ev);
        stampHierarchy();
        hookNewMachines();
      }
      return ev;
    }
    
    // Try child-first resolution for other events
    const result = tryChildFirst(machine, type, params);
    if (result) {
      // Root must notify its subscribers without changing state
      (machine as any).notify?.({ type: 'child.change', params: [{ target: result.machine, type, params }] });
      
      // After transition, stamp all active states with depth and nested
      stampHierarchy();
      
      // Hook any newly discovered machines
      hookNewMachines();
      
      // child.exit is now handled in tryChildFirst
      
      return result.event;
    }
    
    // Try at root level
    const ev = (machine as any).resolveExit?.({ type, params, from: machine.getState() });
    
    if (ev) {
      (machine as any).transition?.(ev);
      
      // After transition, stamp all active states with depth and nested
      stampHierarchy();
      
      // Hook any newly discovered machines
      hookNewMachines();
      
      // child.exit is now handled in tryChildFirst
    }
    
    return ev;
  }

  function tryChildFirst(m: any, type: string, params: any[]): { machine: any, event: any } | null {
    const state = m.getState();
    const child = getChildFromParentState(state);
    
    if (child) {
      
      // Try child's children first (recursive)
      const deepResult = tryChildFirst(child, type, params);
      if (deepResult) {
        return deepResult;
      }
      
      // Try this child
      const childEv = (child as any).resolveExit?.({ type, params, from: child.getState() });
      if (childEv) {
        (child as any).transition?.(childEv);
        
        // Check if child reached final state and synthesize child.exit
        const childState = child.getState();
        if (isChildFinal(child, childState)) {
          // Synthesize child.exit event for the parent
          const exitEv = (m as any).resolveExit?.({ 
            type: 'child.exit', 
            params: [{
              id: state.data?.id || 'unknown',
              state: childState.key,
              data: childState.data
            }], 
            from: state 
          });
          if (exitEv) {
            (m as any).transition?.(exitEv);
            return { machine: m, event: exitEv };
          }
        }
        
        return { machine: child, event: childEv };
      }
    }
    
    return null;
  }

  function isChildFinal(child: any, childState: any): boolean {
    // Check if state has explicit final flag
    if (childState?.data?.final) {
      return true;
    }
    
    // Check if state has no transitions (empty transitions object)
    const transitions = (child as any).transitions?.[childState.key];
    return transitions && Object.keys(transitions).length === 0;
  }

  function stampHierarchy() {
    const chain: any[] = [];
    let current: any = machine;
    
    // Build the chain of active states
    while (true) {
      const state = current.getState();
      if (state) {
        chain.push(state);
      }
      
      const child = getChildFromParentState(state);
      if (!child) break;
      current = child;
    }
    
    // Create shared nested object for all states in hierarchy
    const fullHierarchyKeys = chain.map(s => s.key);
    const sharedNested = Object.freeze({
      fullKey: fullHierarchyKeys.join('.'),
      stack: chain.slice(),
      machine: machine
    });
    
    // Stamp each state with its own hierarchical context
    chain.forEach((state, i) => {
      const pathToState = chain.slice(0, i + 1);
      const pathKeys = pathToState.map(s => s.key);
      (state as any).depth = i;
      (state as any).fullKey = pathKeys.join('.');
      (state as any).stack = pathToState.slice();
      (state as any).nested = sharedNested; // All states share same nested object
    });
  }

  function hookNewMachines() {
    let current: any = machine;
    while (true) {
      const state = current.getState();
      const child = getChildFromParentState(state);
      if (!child) break;
      
      hookMachine(child, machine);
      current = child;
    }
  }

  // Install send hook on root
  const unhookRoot = sendHook((innerSend: any) => (type: string, ...params: any[]) => {
    
    if (type === 'child.change') {
      // Handle child.change event
      const { target, type: childType, params: childParams } = params[0];
      
      // Always delegate to handleAtRoot which does child-first resolution
      return handleAtRoot(childType, childParams);
    }
    
    if (type.startsWith('child.')) {
      // Handle child.* at this level
      const ev = (machine as any).resolveExit?.({ type, params, from: machine.getState() });
      if (ev) (machine as any).transition?.(ev);
      return;
    }
    
    // Normal event - handle at root
    return handleAtRoot(type, params);
  })(machine);

  // Initial stamping and hooking
  stampHierarchy();
  hookNewMachines();
  
  // Test if send hook is working
  (machine as any).send("test-hook");

  return machine as any;
}

export type HierarchicalMachine<M> = M & {
  send: (type: HierarchicalEvents<M>, ...params: any[]) => void;
};

export type HierarchicalEvents<M> =
  | AllEventsOf<M>
  | string;

export function createHierarchicalMachine<M extends FactoryMachine<any>>(machine: M) {
  propagateSubmachines(machine);
  return machine as any as HierarchicalMachine<M>;
}
