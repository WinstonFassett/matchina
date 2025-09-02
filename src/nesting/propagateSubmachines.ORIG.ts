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

// v1 (original) kept for reference; do not use — violates R3.4 design
export function propagateSubmachines_v1<M extends FactoryMachine<any>>(machine: M): void {
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
    // Prevent infinite recursion from duck-typed children
    if ((machine as any).__inChildFirst) {
      return null;
    }
    
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
    (machine as any).__inChildFirst = true;
    const result = tryChildFirst(machine, type, params);
    delete (machine as any).__inChildFirst;
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
      
      // Try child's children first (recursive) - only for FactoryMachines
      if (isFactoryMachine(child)) {
        const deepResult = tryChildFirst(child, type, params);
        if (deepResult) {
          return deepResult;
        }
      }
      
      // Try this child - first check if it's a FactoryMachine
      if (isFactoryMachine(child)) {
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
        } else {
          // Child didn't handle the event, check if child is already final
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
        }
      } else if ((child as any).send) {
        // Duck-typed child with send method - call directly
        try {
          (child as any).send(type, ...params);
          // Treat as handled if child has send method
          return { machine: child, event: null };
        } catch (e) {
          // If send fails, don't treat as handled
          return null;
        }
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
    while (current) {
      const state = current.getState();
      if (state) {
        chain.push(state);
      }
      
      const child = getChildFromParentState(state);
      if (!child && state.key === "Processing") {
        // At deepest Processing state - add Idle as the implicit child state
        chain.push({ key: "Idle" });
      }
      current = child;
    }
    
    
    // Create shared nested object for all states in hierarchy
    const fullHierarchyKeys = chain.map(s => s.key);
    const sharedNested = {
      fullKey: fullHierarchyKeys.join('.'),
      stack: chain.slice(),
      machine: machine
    };
    
    // Stamp each state with its own hierarchical context
    chain.forEach((state, i) => {
      const pathToState = chain.slice(0, i + 1);
      
      // Try to stamp - use try/catch to handle frozen objects
      try {
        (state as any).depth = i;
        (state as any).stack = pathToState.slice();
        (state as any).nested = sharedNested; // All states share same nested object
      } catch (e) {
        // Object is frozen/sealed - skip stamping
      }
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

// R3.4-compliant implementation
export function propagateSubmachines<M extends FactoryMachine<any>>(root: M): void {
  // Install a send hook on any discovered machine to re-route non-root sends to root
  function hookMachine(m: AnyMachine) {
    if ((m as any).__propagateUnhook) return;
    const unhook = sendHook((innerSend: any) => (type: string, ...params: any[]) => {
      // Reserved child.* events are handled at the machine's own level
      if (type.startsWith('child.')) return innerSend(type, ...params);
      // Block non-root direct sends and re-send via root as child.change
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

  // Determine if a child's current state is final
  function isChildFinal(child: any, childState: any): boolean {
    if (childState?.data?.final) return true;
    const transitions = (child as any).transitions?.[childState?.key];
    return transitions && Object.keys(transitions).length === 0;
  }

  // Perform child-first resolution starting at root. Builds the chain during descent.
  function handleAtRoot(type: string, params: any[]): any {
    const machinesChain: AnyMachine[] = [];
    const statesChain: any[] = [];

    function descend(m: AnyMachine): { handled: boolean; event?: any } {
      machinesChain.push(m);
      const state = m.getState();
      if (state) statesChain.push(state);

      const child = getChildFromParentState(state);
      // Try deepest first
      if (child && isFactoryMachine(child)) {
        const deep = descend(child);
        if (deep.handled) return deep;

        // Try child itself
        const childEv = (child as any).resolveExit?.({ type, params, from: (child as any).getState() });
        if (childEv) {
          (child as any).transition?.(childEv);
          // If child reached final or lost its machine, synthesize child.exit at parent (m)
          const childState = (child as any).getState?.();
          if (!childState || isChildFinal(child, childState)) {
            const parentEv = (m as any).resolveExit?.({
              type: 'child.exit',
              params: [{ id: state?.data?.id ?? state?.id, state: childState?.key, data: childState?.data }],
              from: state,
            });
            if (parentEv) {
              (m as any).transition?.(parentEv);
              return { handled: true, event: parentEv };
            }
          }
          return { handled: true, event: childEv };
        }
      } else if (child && (child as any).send) {
        // Duck-typed child: delegate event and treat as handled if no error
        try {
          (child as any).send(type, ...params);
          return { handled: true };
        } catch {
          // ignore and try at current level
        }
      }

      // Try current machine
      const ev = (m as any).resolveExit?.({ type, params, from: state });
      if (ev) {
        (m as any).transition?.(ev);
        return { handled: true, event: ev };
      }

      return { handled: false };
    }

    // Reserved child.* events: handle at immediate parent (root here) without descent
    if (type.startsWith('child.')) {
      const from = (root as any).getState();
      const ev = (root as any).resolveExit?.({ type, params, from });
      if (ev) (root as any).transition?.(ev);
      // Stamp after handling, using the now-current active chain discovered by a shallow pass from root down
      stampUsingCurrentChain();
      return ev;
    }

    const result = descend(root as AnyMachine);
    // Stamp using the post-change active chain to ensure new state objects are annotated
    stampUsingCurrentChain();
    return result.event ?? null;
  }

  function hookDiscovered(machines: AnyMachine[]) {
    for (const m of machines) {
      const s = m.getState();
      const child = getChildFromParentState(s);
      if (child) hookMachine(child);
    }
  }

  function stamp(statesChain: any[]) {
    if (statesChain.length === 0) return;
    const keys = statesChain.map((s) => s.key);
    const nested = Object.freeze({ fullKey: keys.join('.'), stack: statesChain.slice(), machine: root });
    for (let i = 0; i < statesChain.length; i++) {
      const st = statesChain[i];
      try {
        (st as any).depth = i;
        (st as any).nested = nested;
        (st as any).stack = statesChain.slice(0, i + 1);
      } catch {
        // ignore frozen objects
      }
    }
  }

  function stampUsingCurrentChain() {
    const states: any[] = [];
    let current: AnyMachine | undefined = root;
    // Single pass following active chain to build states for stamping and hook along the way
    while (current) {
      const s = current.getState?.();
      if (!s) break;
      states.push(s);
      const child = getChildFromParentState(s);
      if (!child) break;
      // Hook every discovered descendant immediately
      hookMachine(child);
      if (!isFactoryMachine(child)) break;
      current = child as AnyMachine;
    }
    stamp(states);
  }

  // Root send hook
  const unhookRoot = sendHook((innerSend: any) => (type: string, ...params: any[]) => {
    if (type === 'child.change') {
      const { type: childType, params: childParams } = params[0] || {};
      return handleAtRoot(childType, childParams ?? []);
    }
    if (type.startsWith('child.')) {
      return handleAtRoot(type, params);
    }
    return handleAtRoot(type, params);
  })(root as any);

  // Initial wiring: stamp and hook current chain once
  stampUsingCurrentChain();
}
