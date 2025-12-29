import type { FactoryMachine } from "../factory-machine";
import { FactoryMachineEventImpl } from "../factory-machine-event";
import { isFactoryMachine } from "../machine-brand";
import { send as sendHook } from "../state-machine-hooks";
import { createLazyShapeStore } from "./shape-store";
import { AllEventsOf } from "./types";

// Enhanced machine interfaces for better type safety
export interface HierarchicalMachine<M extends FactoryMachine<any> = FactoryMachine<any>> {
  shape: ReturnType<typeof createLazyShapeStore>;
  send: (type: string, ...params: any[]) => void;
  transition?: (event: any) => void;
  notify?: (event: any) => void;
  resolveExit?: (event: any) => any;
  getState(): any;
  transitions?: Record<string, Record<string, any>>;
}

// Type representing all events in a hierarchical machine (including child.* events)
export type HierarchicalEvents<M extends FactoryMachine<any>> = 
  AllEventsOf<M> | 
  'child.change' | 
  'child.exit' | 
  `child.${string}`;

interface DuckTypedMachine {
  getState(): any;
  send(type: string, ...params: any[]): any;
}

interface OptionalDuckTypedMachine {
  getState(): any;
  send?(type: string, ...params: any[]): any;
}

interface PropagatedMachine extends DuckTypedMachine {
  __propagateUnhook?: () => void;
  hierarchical?: boolean;
  transitions?: Record<string, Record<string, any>>;
  resolveExit?: (event: any) => any;
  transition?: (event: any) => void;
}

interface ChildChangePayload {
  target?: any;
  type: string;
  params?: any[];
  _internal?: boolean;
}

interface InternalChildChangePayload extends ChildChangePayload {
  _internal: true;
}

// Enhanced root machine interface  
interface RootMachine {
  send: (type: string, ...params: any[]) => void;
  transition?: (event: any) => void;
  notify?: (event: any) => void;
  resolveExit?: (event: any) => any;
  getState(): any;
}

/**
 * Hierarchical propagation core
 *
 * @experimental This API is experimental. Prefer flattening (`flattenMachineDefinition`) 
 * for most use cases. Propagation is provided as an escape hatch for scenarios requiring
 * loose composition of independent machine instances.
 *
 * This file wires a root FactoryMachine so that events flow through a
 * child-first traversal, with explicit bubbling of child exits, and uniform
 * notification of parent observers when any descendant changes.
 *
 * Key concepts
 * - Child-first traversal: `handleAtRoot()` descends to the deepest active child
 *   and attempts handling there before walking back up.
 * - Explicit `child.exit` bubbling: after a transition, parents may receive
 *   synthesized `child.exit` based on a child's finality or absence.
 * - `child.*` event namespace: reserved events handled at the immediate parent
 *   level without re-descent (e.g., `child.exit`, `child.change`).
 * - Hooking: discovered descendants are hooked so any non-root `send` is routed
 *   back to the root as `child.change`, preserving the single event loop.
 *
 * Internal routing contract
 * - Non-root sends are redirected to root via `root.send('child.change', payload)`
 * - When that payload contains `{ _internal: true }`, the root short-circuits to
 *   subscriber notification via `root.notify(...)` and does not re-enter
 *   `handleAtRoot`, avoiding recursion.
 * - External callers may also `send('child.change', { type, params })`; in that
 *   case (no `_internal`), the root treats it as a routed event and processes it
 *   through `handleAtRoot(type, params)`.
 */

// Probe for and return state submachine with better typing
function getChildFromParentState(state: any): DuckTypedMachine | undefined {
  const m = state?.data?.machine;
  if (!m) return undefined;
  if (isFactoryMachine(m)) return m as DuckTypedMachine;
  const isValid = typeof m?.getState === "function" && typeof m?.send === "function";
  return isValid ? (m as DuckTypedMachine) : undefined;
}



/**
 * Wrap a machine with hierarchical propagation semantics and attach shape metadata.
 *
 * @experimental This API is experimental. Prefer flattening (`flattenMachineDefinition`) 
 * for most use cases. Propagation is provided as an escape hatch for scenarios requiring
 * loose composition of independent machine instances.
 *
 * Call this helper on a root machine to install propagation hooks, attach shape metadata
 * for visualization, and return a typed facade.
 */
export function makeHierarchical<M extends FactoryMachine<any>>(machine: M) {
  propagateSubmachines(machine);
  
  // Attach lazy shape store for visualization
  // Shape is computed on first access and cached
  (machine as any).shape = createLazyShapeStore(machine);
  
  return machine as any as HierarchicalMachine<M>;
}

/**
 * Attach hierarchical propagation to a root machine.
 *
 * @experimental This API is experimental. Prefer flattening (`flattenMachineDefinition`) 
 * for most use cases. Propagation is provided as an escape hatch for scenarios requiring
 * loose composition of independent machine instances.
 *
 * Returns a disposer that unhooks the root and any hooked descendants and
 * clears internal tracking structures.
 */
export function propagateSubmachines<M extends FactoryMachine<any>>(root: M): () => void {
  const hookedMachines = new Set<PropagatedMachine>();

  // Attach lazy shape store for visualization
  // Shape is computed on first access and cached
  (root as HierarchicalMachine<M>).shape = createLazyShapeStore(root);
  
  const rootMachine = root as unknown as RootMachine;

  // Install a send hook on any discovered machine to re-route non-root sends to root
  function hookMachine(m: OptionalDuckTypedMachine): void {
    const propagatedMachine = m as PropagatedMachine;
    if (propagatedMachine.__propagateUnhook) return;
    hookedMachines.add(propagatedMachine);
    const unhook = sendHook((innerSend: any) => (type: string, ...params: any[]) => {
      // First, let the machine handle its own event
      const result = innerSend(type, ...params);
      
      // Check if the machine has reached a final state after handling the event
      const state = m.getState?.();
      if (state && isChildFinal(m as DuckTypedMachine, state)) {
        let current: DuckTypedMachine | null = rootMachine;
        while (current) {
          const currentState = current.getState?.();
          if (!currentState) break;
          const child = getChildFromParentState(currentState);
          if (!child) break;
          current = child;
        }
        if (current) {
          current.send?.('child.exit');
          hookCurrentChain(true); // Notify on child.exit
        }
      } else if (state && !type.startsWith('child.')) {
        // Use _internal flag to avoid infinite recursion but ensure notification happens
        // Only send if the event was actually handled to avoid excessive notifications
        if (result) {
          rootMachine.send('child.change', { target: m, type, params, _internal: true });
        }
      }
      
      return result;
    })(m as DuckTypedMachine);
    propagatedMachine.__propagateUnhook = unhook;
    propagatedMachine.hierarchical = true;
  }

  // Determine if a child's current state is final
  // if marked as such or has no transitions
  function isChildFinal(child: DuckTypedMachine, childState: any): boolean {
    if (childState?.data?.final) return true;
    const propagatedChild = child as PropagatedMachine;
    const transitions = propagatedChild.transitions?.[childState?.key];
    return Boolean(transitions && Object.keys(transitions).length === 0);
  }

  /**
   * This is the core propagation logic. It handles an event by traversing the machine hierarchy
   * from the root down to the deepest child. This "child-first" or "inside-out" event handling
   * is crucial for hierarchical state machines.
   *
   * The function is monolithic because it needs to maintain the context of the traversal (the `machinesChain`)
   * to correctly bubble up `child.exit` events after a state change occurs deep in the hierarchy.
   *
   * How it works:
   * 1. It recursively calls `descend` to travel to the deepest active child machine.
   * 2. It attempts to handle the event at that deepest level.
   * 3. If not handled, it tries the parent, and so on, moving back up the chain.
   * 4. If a child transitions to a final state, it triggers a `child.exit` event in its parent.
   * 5. This `child.exit` can cause a chain reaction, bubbling up the hierarchy and causing
   *    each parent to transition in response.
   * 6. After any event is handled, the entire hierarchy's state is "stamped" with updated
   *    context (like depth and the full state key).
   */
  /**
   * Descend to the deepest active child machine in the hierarchy.
   * Returns the chain of machines and states visited.
   */
  function descendToDeepestActive(root: DuckTypedMachine): { machinesChain: DuckTypedMachine[]; statesChain: any[] } {
    const machinesChain: DuckTypedMachine[] = [];
    const statesChain: any[] = [];

    function descend(m: DuckTypedMachine): void {
      machinesChain.push(m);
      const state = m.getState?.();
      if (state) statesChain.push(state);

      const child = getChildFromParentState(state);
      if (child && isFactoryMachine(child)) {
        descend(child);
      }
    }

    descend(root);
    return { machinesChain, statesChain };
  }

  /**
   * Attempt to handle an event at a specific machine level.
   * Returns whether the event was handled and by which machine.
   */
  function attemptTransitionAtLevel(
   m: DuckTypedMachine, 
   type: string, 
   params: any[], 
   state: any
  ): { handled: boolean; event?: any; handledBy?: DuckTypedMachine } {
   // Try current machine
   const propagatedMachine = m as PropagatedMachine;
   const ev = propagatedMachine.resolveExit?.({ type, params, from: state });
   if (ev) {
     propagatedMachine.transition?.(ev);
     return { handled: true, event: ev, handledBy: m };
   }

   return { handled: false };
  }

  /**
   * Handle duck-typed child machines (those with .send method).
   */
  function handleDuckTypedChild(child: DuckTypedMachine, type: string, params: any[]): boolean {
    try {
      const before = child.getState?.();
      const beforeKey = before?.key;
      const beforeDataRef = before?.data;
      const sendResult = child.send?.(type, ...params);
      const after = child.getState?.();
      const changed = after !== before || after?.key !== beforeKey || after?.data !== beforeDataRef;
      return changed || !!sendResult;
    } catch {
      return false;
    }
  }

  /**
   * Bubble child.exit events up the hierarchy after transitions.
   */
  function bubbleChildExitEvents(machinesChain: DuckTypedMachine[]): void {
    for (let i = machinesChain.length - 2; i >= 0; i--) {
      const parent = machinesChain[i] as PropagatedMachine;
      const parentState = parent.getState?.();
      if (!parentState) continue;
      
      const child = getChildFromParentState(parentState);
      if (!child) continue;
      
      const childState = child.getState?.();
      if (!childState || isChildFinal(child, childState)) {
        const exitEv = parent.resolveExit?.({
          type: 'child.exit',
          params: [{ child, from: childState }],
          from: parentState,
        });
        if (exitEv) parent.transition?.(exitEv);
      }
    }
  }

  /**
   * Notify hierarchy of changes and hook newly discovered machines.
   */
  function notifyHierarchyOfChange(result: { handled: boolean; handledBy?: DuckTypedMachine }, type: string, params: any[]): void {
    // Hook any newly discovered machines in the hierarchy
    hookCurrentChain();
    
    // Emit a routed child change via root.send so observers can react through the normal loop.
    // Use an internal flag to avoid re-entering handleAtRoot and causing recursion.
    if (result.handled && !String(type).startsWith('child.')) {
      rootMachine.send?.('child.change', { target: result.handledBy, type, params, _internal: true });
    }
  }

  /**
    * Handle reserved child.* events at the immediate parent.
    * Child.change events are routed through here - if target !== root, they're internal notifications.
    */
  function handleReservedEvents(type: string, params: any[]): any {
    // Handle child.change events - only process if targeting root
    if (type === 'child.change') {
      const { target, _internal } = params[0];
      if (target !== root) {
        // Internal notification from a child - hook chain but don't re-enter event loop
        if (_internal) {
          hookCurrentChain(false);
        }
        // Don't handle non-root target child.change events
        return;
      }
    }
    
    // For all other reserved events and root-targeted child.change, try to handle at root
    hookCurrentChain(false);
    const from = rootMachine.getState();
    const ev = rootMachine.resolveExit?.({ type, params, from });
    if (ev) rootMachine.transition?.(ev);
    return ev;
  }

  /**
   * Main event handling logic with child-first routing.
   * Descends to deepest active child and attempts handling there first.
   */
  function handleAtRoot(type: string, params: any[]): any {
    // Reserved child.* events: handle at immediate parent (root here) without descent
    if (type.startsWith('child.')) {
      return handleReservedEvents(type, params);
    }

    const { machinesChain, statesChain } = descendToDeepestActive(root as DuckTypedMachine);

    // Try handling at each level from deepest to shallowest
    for (let i = machinesChain.length - 1; i >= 0; i--) {
      const machine = machinesChain[i];
      const state = statesChain[i];
      
      // Try child machine handling first
      if (i < machinesChain.length - 1) {
        const child = getChildFromParentState(state);
        if (child) {
          const duckHandled = handleDuckTypedChild(child, type, params);
          if (duckHandled) {
            bubbleChildExitEvents(machinesChain);
            notifyHierarchyOfChange({ handled: true, handledBy: child }, type, params);
            return;
          }
        }
      }
      
      // Try current machine level
      const result = attemptTransitionAtLevel(machine, type, params, state);
      if (result.handled) {
        bubbleChildExitEvents(machinesChain);
        notifyHierarchyOfChange(result, type, params);
        return result.event ?? null;
      }
    }

    return null;
  }

  /**
   * Discover the current active chain by following child pointers starting at root,
   * and hook any newly discovered machines.
   *
   * This is called after event handling to ensure all machines in the hierarchy are hooked.
   *
   * @param {boolean} notify - Whether to force a notification after hooking (default: false)
   */
  function hookCurrentChain(notify = false) {
    let current: DuckTypedMachine | undefined = root;

    // Single pass following active chain to hook discovered machines
    while (current) {
      const s = current.getState?.();
      if (!s) break;
      const child = getChildFromParentState(s);
      if (!child) break;

      // Hook every discovered descendant immediately (works for duck-typed children too)
      hookMachine(child);

      // Continue traversal for any child that exposes getState (duck-typed or branded)
      current = (child as DuckTypedMachine);
    }

    // Only notify if explicitly requested to avoid excessive notifications
    if (notify) {
      rootMachine.notify?.({ type: 'child.change', params: [{ _internal: true }] });
    }
  }

  /** Install a send hook on the root to intercept and route child.change events */
  const unhookRoot = sendHook((innerSend: any) => (type: string, ...params: any[]) => {
    if (type === 'child.change') {
      const payload = params[0] || {};
      // Internal child-change: create a new change event to update lastChange for React
      if (payload && payload._internal) {
        // Get the current state
        const currentState = rootMachine.getState?.();
        if (currentState) {
          // Create a new change event representing a self-transition
          // This updates the machine's lastChange so React's useSyncExternalStore detects the change
          const newChangeEvent = new FactoryMachineEventImpl(
            'child.change' as 'child.change',
            currentState,
            currentState,
            [payload],
            root as any
          );
          // Call transition to update lastChange and notify subscribers
          // Note: transition() will call notify() through the lifecycle, so we don't call it separately
          rootMachine.transition?.(newChangeEvent);
        }
        return;
      }
      const { type: childType, params: childParams } = payload;
      return handleAtRoot(childType, childParams ?? []);
    }
    if (type.startsWith('child.')) {
      return handleAtRoot(type, params);
    }
    return handleAtRoot(type, params);
  })(root);

  // Initial wiring: hook current chain once
  hookCurrentChain(true); // Notify on initial wiring

  // Return disposer function
  return () => {
    // Unhook root machine
    unhookRoot();
    
    // Unhook all discovered machines
    hookedMachines.forEach(machine => {
      if (machine.__propagateUnhook) {
        machine.__propagateUnhook();
      }
    });
    
    // Clear tracking
    hookedMachines.clear();
  };
}
