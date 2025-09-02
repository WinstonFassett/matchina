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
    
    // Recursive child-first resolution: try deepest child first, then work up
    const result = tryChildFirst(machine, type, params);
    if (result) {
      // Root must notify its subscribers without changing state
      (machine as any).notify?.({ type: 'child.change', params: [{ target: result.machine, type, params }] });
      
      // After transition, stamp all active states with depth and nested
      stampHierarchy();
      
      // Hook any newly discovered machines
      hookNewMachines();
      
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
      
      // Child exit is handled in tryChildFirst, no need to check here
    }
    
    return ev;
  }

  function tryChildFirst(m: any, type: string, params: any[]): { machine: any, event: any } | null {
    const state = m.getState();
    const child = getChildFromParentState(state);
    
    if (child && isFactoryMachine(child)) {
      
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
        checkForChildExit(m);
        
        return { machine: child, event: childEv };
      }
    }
    
    return null;
  }

  function checkForChildExit(parentMachine: any) {
    if (!parentMachine?.getState) return;
    
    const state = parentMachine.getState();
    const child = getChildFromParentState(state);
    
    if (child && isFactoryMachine(child)) {
      const childState = child.getState();
      if (childState?.data?.final) {
        // Synthesize child.exit event directly on parent machine to avoid double processing
        const ev = (parentMachine as any).resolveExit?.({ 
          type: 'child.exit', 
          params: [{
            id: state.data?.id || 'unknown',
            state: childState.key,
            data: childState.data
          }], 
          from: state 
        });
        if (ev) {
          (parentMachine as any).transition?.(ev);
        }
      }
    }
  }

  function stampHierarchy() {
    const chain: any[] = [];
    let current: any = machine;
    
    // Build the chain of active states
    while (true) {
      const state = current.getState();
      if (!state || !state.key) {
      } else {
        chain.push(state);
      }
      
      const child = getChildFromParentState(state);
      if (!child || !isFactoryMachine(child)) break;
      current = child;
    }
    
    
    // Create shared nested object
    const nested = Object.freeze({
      fullKey: chain.map(s => s.key).join('.'),
      stack: chain.slice(),
      machine: machine
    });
    
    // Stamp all states in the chain
    chain.forEach((state, i) => {
      (state as any).depth = i;
      (state as any).nested = nested;
    });
  }

  function hookNewMachines() {
    let current: any = machine;
    while (true) {
      const state = current.getState();
      const child = getChildFromParentState(state);
      if (!child || !isFactoryMachine(child)) break;
      
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
