import type { FactoryMachine } from "../factory-machine";
import { resolveExit as hookResolveExit, send } from "../state-machine-hooks";
import { enhanceMethod } from "../ext/methodware/enhance-method";
import { buildSetup } from "../ext/setup";
import { isFactoryMachine } from "../machine-brand";
import { AllEventsOf } from "./types";

// Export function to reset the global stack (useful for testing)
export function resetGlobalHierarchyStack() {
  // No-op: global stack removed, keeping for backward compatibility
}

// Type definition for enhanced states with context
interface StateWithContext {
  stack: any[];
  depth: number;
  fullKey: string;
}

// Minimal duck-typed machine shape 
type AnyMachine = { getState(): any; send?: (...args: any[]) => void };

function getChildFromParentState(state: any): AnyMachine | undefined {
  const m = state?.data?.machine as any;
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

// Build context for a state using incremental stack - add self to stack, reuse same stack
function buildStateContext(state: any, parentStack: any[], myDepth: number): StateWithContext {
  // DON'T modify the stack here - it should be set before calling this
  
  // Build fullKey up to this state's depth (inclusive)
  const fullKey = parentStack
    .slice(0, myDepth + 1)
    .filter(s => s)
    .map(s => s.key)
    .join('.');
  
  return { 
    stack: parentStack, // Shared stack reference
    depth: myDepth, 
    fullKey
  };
}

// Enhance a state with context information  
function enhanceStateWithContext(state: any, context: StateWithContext): any {
  const fullKey = context.stack
    .slice(0, context.depth + 1)
    .filter(s => s)
    .map(s => s.key)
    .join('.');
  // Return a new object preserving prototype so identity changes without losing methods
  const clone = Object.assign(Object.create(Object.getPrototypeOf(state)), state);
  return Object.assign(clone, {
    stack: context.stack,
    depth: context.depth,
    fullKey: fullKey
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

function enhanceSend(child: AnyMachine, machine: FactoryMachine<any>) {
  return (origSend: any) => (type: string, ...params: any[]) => {
    // If this invocation is part of parent-driven child-first routing, let the child handle it directly
    if ((child as any).__fromParent) {
      return origSend(type, ...params);
    }
    // Otherwise, route child-originating events to the root machine for handling.
    const root = (machine as any).__rootMachine || machine;
    const handler = (root as any).__handleFromChild as undefined | ((t: string, ...p: any[]) => any);
    if (typeof handler === 'function') {
      return handler(type, ...params);
    }
    // Fallback: if no special handler, send to parent (may still work with existing routing)
    return (machine as any).send?.(type, ...params);
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
export function propagateSubmachines<M extends FactoryMachine<any>>(
  machineIgnoreThis: M, 
  parentStack?: any[], 
  myDepth?: number,
  parentMachine?: FactoryMachine<any>
) {
  return (machine: M) => {
    const [addSetup, disposeAll] = buildSetup(machine);
    
    // If no parent stack provided, create root stack; otherwise use parent stack and increment depth
    const hierarchyStack = parentStack || [];
    const depth = myDepth !== undefined ? myDepth : 0;
    
    // Set a stable initialKey once per machine (duck-typed field for inspectors)
    try {
      const anyMachine = machine as any;
      if (anyMachine.initialKey === undefined) {
        // Use current key at setup time, which on creation equals the declared initial
        anyMachine.initialKey = machine.getState()?.key;
      }
    } catch {}

    // Enhance getState to add context using incremental stack
    const originalGetState = machine.getState;
    const childEnhanced = new WeakSet<object>();

    // Provide root pointer and bubbling notifier to ancestors
    (machine as any).__rootMachine = parentMachine ? ((parentMachine as any).__rootMachine || parentMachine) : machine;
    (machine as any).__parentNotify = parentMachine
      ? (ev: any) => {
          try {
            (parentMachine as any).notify?.(ev);
            (parentMachine as any).__parentNotify?.(ev);
          } catch {}
        }
      : undefined;

    // Identity cache to preserve reference when nothing changed
    let lastDerived: { base: any; result: any } | undefined;

    // Wrap getState so every read carries up-to-date context and child setup
    (machine as any).getState = () => {
      const state = originalGetState.call(machine);

      // Record this machine's current state at my depth
      hierarchyStack[depth] = state;

      // Auto-setup child machine (if present) for hierarchical routing (no traversal)
      const child = getChildFromParentState(state);
      if (child && !childEnhanced.has(child as any)) {
        childEnhanced.add(child as any);
        // Attach parent and root pointers before propagating
        try {
          (child as any).__parentMachine = machine;
          (child as any).__rootMachine = (machine as any).__rootMachine || machine;
        } catch {}
        propagateSubmachines(child as any, hierarchyStack, depth + 1, machine as any)(child as any);
        if (isFactoryMachine(child as any)) {
          const childMachine = child as FactoryMachine<any>;
          const [addChildSetup] = buildSetup(childMachine);
          addChildSetup(send(enhanceSend(childMachine, machine as any)));
        }
      }

      // Build shallow key and working stack slice for current depth only
      const stackSlice = hierarchyStack.slice(0, depth + 1);
      const shallowKey = stackSlice
        .filter(s => s)
        .map(s => s.key)
        .join('.');

      // If base state reference is unchanged, preserve identity
      if (lastDerived && lastDerived.base === state) {
        try {
          // Update contextual fields on the same object
          const updated = stackSlice.slice();
          updated[depth] = lastDerived.result;
          (lastDerived.result as any).stack = updated;
          (lastDerived.result as any).depth = depth;
          (lastDerived.result as any).fullKey = shallowKey;
          // Write back to shared stack so descendants see enhanced reference
          hierarchyStack[depth] = lastDerived.result;
        } catch {}
        return lastDerived.result;
      }
      const enhanced = enhanceStateWithContext(state, {
        stack: stackSlice,
        depth: depth,
        fullKey: shallowKey
      });
      // Ensure the stack references the enhanced instance at this depth
      try {
        const updated = stackSlice.slice();
        updated[depth] = enhanced;
        (enhanced as any).stack = updated;
      } catch {}
      // Write back to shared stack so descendants see enhanced reference
      try { hierarchyStack[depth] = enhanced; } catch {}
      lastDerived = { base: state, result: enhanced };
      return enhanced;
    };
    
    // Auto-enhance any child machines when parent state is accessed through resolveExit
    const originalResolveExit = (machine as any).resolveExit;
    (machine as any).resolveExit = (ev: any) => {
      // Do not enhance or mutate the returned 'to' state here; keep identity intact.
      return originalResolveExit ? originalResolveExit(ev) : ev;
    };
    
    // Enhance resolveExit to supply sane defaults for probes (non-mutating)
    addSetup(hookResolveExit((ev: any, next: (ev: any) => any) => {
      // Use originalGetState to avoid mutating the shared stack during probes
      const from = ev?.from ?? originalGetState.call(machine);
      const params = Array.isArray(ev?.params) ? ev.params : [];
      return next({ ...ev, from, params });
    }));

    // Eagerly set up child enhancement so direct child sends still route via root
    // This covers cases where UIs hold a reference to the child machine and send events
    // before any code has called parent getState() (which otherwise performs the setup).
    try {
      const state = originalGetState.call(machine);
      const child = getChildFromParentState(state);
      if (child && !childEnhanced.has(child as any)) {
        childEnhanced.add(child as any);
        try {
          (child as any).__parentMachine = machine;
          (child as any).__rootMachine = (machine as any).__rootMachine || machine;
        } catch {}
        propagateSubmachines(child as any, hierarchyStack, depth + 1, machine as any)(child as any);
        if (isFactoryMachine(child as any)) {
          const childMachine = child as FactoryMachine<any>;
          const [addChildSetup] = buildSetup(childMachine);
          addChildSetup(send(enhanceSend(childMachine, machine as any)));
        }
      }
    } catch {}

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
        // Suppress child's own notify and mark call as coming from parent to allow local handling
        try {
          (child as any).__suppressChildNotify = true;
          (child as any).__fromParent = true;
          trySend(child, type, ...params);
        } finally {
          try { delete (child as any).__suppressChildNotify; } catch {}
          try { delete (child as any).__fromParent; } catch {}
        }
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
        const hadMachine = before?.data?.machine;
        const hasMachine = after?.data?.machine;
        const changedLocal = before?.key !== after?.key;
        
        if (looksLikeExit(after, grandAfterSnap, hadMachine, hasMachine, duckChild, true)) {
          triggerExit(machine, parentState, after);
        } else if (changedLocal) {
          // Non-exit child transition: notify parent subscribers
          try {
            const currentParentState = machine.getState();
            (machine as any).notify?.({
              type: "child.changed",
              from: currentParentState,
              to: currentParentState,
              params: [{ id: parentState?.data?.id ?? parentState?.id, child: after?.key }],
              machine,
            });
            // bubble
            (machine as any).__parentNotify?.({
              type: "child.changed",
              from: currentParentState,
              to: currentParentState,
              params: [{ id: parentState?.data?.id ?? parentState?.id, child: after?.key }],
              machine,
            });
          } catch {}
        }
        return true;
      }
      return false;
    };

    addSetup(
      send(innerSend => {
        // Expose a direct handler for child-originating events that should be processed here
        try {
          (machine as any).__innerSend = innerSend;
          (machine as any).__handleFromChild = (type: string, ...params: any[]) => {
            // Attempt to handle at parent first
            const beforeParent = originalGetState.call(machine);
            const beforeChild = getChildFromParentState(beforeParent);
            const beforeChildSnap = beforeChild ? snapshot(beforeChild) : undefined;

            const resolved = (machine as any).resolveExit?.({ type, params, from: beforeParent } as any);
            if (resolved && resolved.to?.key === beforeParent.key && (!params || params.length === 0)) {
              // parent considered this a parameterless self-transition (no-op)
            } else {
              innerSend(type, ...params);
            }

            const afterParent = originalGetState.call(machine);
            const afterChild = getChildFromParentState(afterParent);
            const afterChildSnap = afterChild ? snapshot(afterChild) : undefined;

            // If parent changed or bubbled an exit, we're done
            const parentHandled = beforeParent?.key !== afterParent?.key;
            if (parentHandled) { return; }

            // Otherwise, delegate to child under a transient from-parent flag
            if (afterChild) {
              const before = afterChildSnap;
              const grandBefore = before ? getChildFromParentState(before) : undefined;
              const grandBeforeSnap = grandBefore ? snapshot(grandBefore) : undefined;
              try {
                (afterChild as any).__suppressChildNotify = true;
                (afterChild as any).__fromParent = true;
                trySend(afterChild, type, ...params);
              } finally {
                try { delete (afterChild as any).__suppressChildNotify; } catch {}
                try { delete (afterChild as any).__fromParent; } catch {}
              }

              const after = snapshot(afterChild);
              const grandAfter = getChildFromParentState(after);
              const grandAfterSnap = grandAfter ? snapshot(grandAfter) : undefined;

              const handledByState = isHandled(before, after, grandBeforeSnap, grandAfterSnap);
              const duckChild = !isFactoryMachine(afterChild as any);
              const handled = handledByState || duckChild;
              if (handled) {
                const hadMachine = (before as any)?.data?.machine;
                const hasMachine = (after as any)?.data?.machine;
                const changedLocal = (before as any)?.key !== (after as any)?.key;
                if (looksLikeExit(after, grandAfterSnap, hadMachine, hasMachine, duckChild, true)) {
                  triggerExit(machine, beforeParent, after);
                } else if (changedLocal) {
                  try {
                    const currentParentState = machine.getState();
                    (machine as any).notify?.({
                      type: "child.changed",
                      from: currentParentState,
                      to: currentParentState,
                      params: [{ id: beforeParent?.data?.id ?? beforeParent?.id, child: (after as any)?.key }],
                      machine,
                    });
                    (machine as any).__parentNotify?.({
                      type: "child.changed",
                      from: currentParentState,
                      to: currentParentState,
                      params: [{ id: beforeParent?.data?.id ?? beforeParent?.id, child: (after as any)?.key }],
                      machine,
                    });
                  } catch {}
                }
                
              }
            }
          };
        } catch {}
        
        return (type, ...params) => {
          const handled = childFirst(type, ...params);
          if (handled) return; // child handled
          
          const from = originalGetState.call(machine);
          const resolved = (machine).resolveExit?.({ type, params, from } as any);
          
          // Allow self-transitions when they carry parameters
          if (resolved && resolved.to?.key === from.key && (!params || params.length === 0)) {
            return; // no-op on parameterless self-transition
          }
          
          const result = innerSend(type, ...params);
          // After parent handles an event, eagerly enhance a newly active child (if any)
          try {
            const newState = originalGetState.call(machine);
            const child = getChildFromParentState(newState);
            if (child && !childEnhanced.has(child as any)) {
              childEnhanced.add(child as any);
              try {
                (child as any).__parentMachine = machine;
                (child as any).__rootMachine = (machine as any).__rootMachine || machine;
              } catch {}
              propagateSubmachines(child as any, hierarchyStack, depth + 1, machine as any)(child as any);
              if (isFactoryMachine(child as any)) {
                const childMachine = child as FactoryMachine<any>;
                const [addChildSetup] = buildSetup(childMachine);
                addChildSetup(send(enhanceSend(childMachine, machine as any)));
              }
            }
          } catch {}
          return result;
        };
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
 * Create a hierarchical machine wrapper with enhanced event routing and incremental stack context.
 * 
 * @param machine - The factory machine to wrap with hierarchical features
 * @returns Enhanced machine with hierarchical capabilities, typed event routing, and context
 */
export function createHierarchicalMachine<M extends FactoryMachine<any>>(machine: M): HierarchicalMachine<M> {
  // Initialize machine as root (no parent stack or depth)
  propagateSubmachines(machine)(machine);
  
  // Return with enhanced type
  return machine as HierarchicalMachine<M>;
}