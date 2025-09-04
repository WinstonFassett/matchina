import type { FactoryMachine } from "../factory-machine";
import { isFactoryMachine } from "../machine-brand";
import { send as sendHook } from "../state-machine-hooks";
import { AllEventsOf } from "./types";

/**
 * Hierarchical propagation core
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
 * - Stamping: after handling, active states along the chain are stamped with
 *   `depth`, `nested.fullKey`, and `stack` for observability and debugging.
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

// Minimal duck-typed machine shape
type AnyMachine = { getState(): any; send?: (...args: any[]) => void };

// Probe for and return state submachine
function getChildFromParentState(state: any): AnyMachine | undefined {
  const m = state?.data?.machine as any;
  if (!m) return undefined;
  if (isFactoryMachine(m)) return m as AnyMachine;
  const isValid = typeof m?.getState === "function" && typeof m?.send === "function";
  return isValid ? (m as AnyMachine) : undefined;
}


export type HierarchicalMachine<M> = M & {
  /** Root `send` extended to accept `child.*` events and routed child changes */
  send: (type: HierarchicalEvents<M>, ...params: any[]) => void;
};

export type HierarchicalEvents<M> =
  | AllEventsOf<M>
  | string;

/**
 * Wrap a machine with hierarchical propagation semantics.
 *
 * Call this helper on a root machine to install propagation hooks and return a
 * typed facade.
 */
export function createHierarchicalMachine<M extends FactoryMachine<any>>(machine: M) {
  propagateSubmachines(machine);
  return machine as any as HierarchicalMachine<M>;
}

/**
 * Attach hierarchical propagation to a root machine.
 *
 * Returns a disposer that unhooks the root and any hooked descendants and
 * clears internal tracking structures.
 */
export function propagateSubmachines<M extends FactoryMachine<any>>(root: M): () => void {

  const hookedMachines = new Set<AnyMachine>();

  // Install a send hook on any discovered machine to re-route non-root sends to root
  function hookMachine(m: AnyMachine) {
    if ((m as any).__propagateUnhook) return;
    hookedMachines.add(m);
    const unhook = sendHook((innerSend: any) => (type: string, ...params: any[]) => {
      // First, let the machine handle its own event
      const result = innerSend(type, ...params);
      
      // Check if the machine has reached a final state after handling the event
      const state = m.getState?.();
      if (state && isChildFinal(m, state)) {
        let current = root;
        let parent = null;
        while (current) {
          const currentState = current.getState?.();
          if (!currentState) break;
          const child = getChildFromParentState(currentState);
          if (child === m) {
            parent = current;
            break;
          }
          if (!child) break;
          current = child as any;
        }
        if (parent) {
          (parent as any).send('child.exit');
          stampUsingCurrentChain(true); // Notify on child.exit
        }
      } else if (state && !type.startsWith('child.')) {
        // For non-final states and non-child events, update the hierarchy
        // This ensures direct child sends update the parent's nested fullKey
        stampUsingCurrentChain(true); // Notify on direct child sends
      }
      
      // Reserved child.* events are handled at the machine's own level
      if (type.startsWith('child.')) return result;
      
      // After handling, send a child.change event to the root to notify of state changes
      // This routes through the root's event loop to preserve ordering and visibility
      // Use _internal flag to avoid infinite recursion but ensure notification happens
      // Only send if the event was actually handled to avoid excessive notifications
      if (result) {
        (root as any).send('child.change', { target: m, type, params, _internal: true });
      }
      
      return result;
    })(m as any);
    (m as any).__propagateUnhook = unhook;
    (m as any).hierarchical = true;
  }

  // Disconnects a machine from the propagation system.
  // 🧑‍💻: WARNING: NOT USED
  // function unhookMachine(m: AnyMachine) {
  //   if ((m as any).__propagateUnhook) {
  //     (m as any).__propagateUnhook();
  //     delete (m as any).__propagateUnhook;
  //   }
  // }

  // Determine if a child's current state is final
  // if marked as such or has no transitions
  function isChildFinal(child: any, childState: any): boolean {
    if (childState?.data?.final) return true;
    const transitions = (child as any).transitions?.[childState?.key];
    return transitions && Object.keys(transitions).length === 0;
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
   * Handle an event against the current active chain starting at the root.
   * - Descend to deepest active child and attempt handling there first.
   * - After a transition, bubble potential `child.exit` to each ancestor.
   * - Stamp the active chain for introspection.
   * - Emit `child.change` via root.send so subscribers are notified in-order.
   */
  function handleAtRoot(type: string, params: any[]): any {
    const machinesChain: AnyMachine[] = [];
    const statesChain: any[] = [];

    function descend(m: AnyMachine): { handled: boolean; event?: any; handledBy?: AnyMachine } {
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
              return { handled: true, event: parentEv, handledBy: m };
            }
          }
          return { handled: true, event: childEv, handledBy: child as AnyMachine };
        }
      } else if (child && (child as any).send) {
        // Duck-typed child: delegate event and treat as handled if no error
        try {
          (child as any).send(type, ...params);
          return { handled: true, handledBy: child as AnyMachine };
        } catch {
          // ignore and try at current level
        }
      }

      // Try current machine
      const ev = (m as any).resolveExit?.({ type, params, from: state });
      if (ev) {
        (m as any).transition?.(ev);
        return { handled: true, event: ev, handledBy: m };
      }

      return { handled: false };
    }

    // Reserved child.* events: handle at immediate parent (root here) without descent
    if (type.startsWith('child.')) {
      const from = (root as any).getState();
      if (type === 'child.change') {
        const { target, type: innerType, params: innerParams, _internal } = params[0];
        if (target !== root) {
          // This is a notification from a child machine
          // If it's an internal notification, we need to stamp and notify subscribers
          if (_internal) {
            stampUsingCurrentChain(false); // Don't notify again to avoid double notifications
            return;
          }
          // Otherwise, don't handle
          return;
        }
      }
      stampUsingCurrentChain(false); // Don't notify on reserved events
      const ev = (root as any).resolveExit?.({ type, params, from });
      if (ev) (root as any).transition?.(ev);
      return ev;
    }

    const result = descend(root as AnyMachine);
    // After deepest handling, bubble child.exit upward along the visited chain
    if (result.handled) {
      for (let i = machinesChain.length - 2; i >= 0; i--) {
        const parent = machinesChain[i] as any;
        const parentState = parent.getState?.();
        if (!parentState) continue;
        const child = getChildFromParentState(parentState) as any;
        if (!child) continue;
        const childState = child.getState?.();
        if (!childState || isChildFinal(child, childState)) {
          const exitEv = parent.resolveExit?.({
            type: 'child.exit',
            params: [{ id: parentState?.data?.id ?? parentState?.id, state: childState?.key, data: childState?.data }],
            from: parentState,
          });
          if (exitEv) parent.transition?.(exitEv);
        }
      }
    }
    // Stamp the hierarchy with updated contextual information (e.g., `nested.fullKey`, `depth`).
    // This is done without arguments because it dynamically discovers the current active chain
    // from the root each time, ensuring the stamps are always based on the latest state.
    stampUsingCurrentChain();
    
    // Emit a routed child change via root.send so observers can react through the normal loop.
    // Use an internal flag to avoid re-entering handleAtRoot and causing recursion.
    if (result.handled && !String(type).startsWith('child.')) {
      (root as any).send?.('child.change', { target: result.handledBy, type, params, _internal: true });
    }
    return result.event ?? null;
  }

  // This function is not currently used, but can aid debugging or explicit wiring
  // of machines discovered through means other than active-chain traversal.
  // function hookDiscovered(machines: AnyMachine[]) {
  //   for (const m of machines) {
  //     const s = m.getState();
  //     const child = getChildFromParentState(s);
  //     if (child) hookMachine(child);
  //   }
  // }

  /** Stamp the active states with depth, nested info, and stack snapshot */
  function stamp(statesChain: any[]) {
    if (statesChain.length === 0) return;
    const keys = statesChain.map((s) => s.key);
    const fullKey = keys.join('.');
    
    // Create a nested object with the full hierarchical path
    const nested = Object.freeze({ fullKey, stack: statesChain.slice(), machine: root });
    
    // Apply to each state in the chain
    for (let i = 0; i < statesChain.length; i++) {
      const st = statesChain[i];
      try {
        // Each state gets the same nested info but its own depth
        (st as any).depth = i;
        (st as any).nested = nested;
        (st as any).stack = statesChain.slice(0, i + 1);
      } catch {
        // ignore frozen objects
      }
    }
  }

  /**
   * Discover the current active chain by following child pointers starting at root,
   * hooking along the way, and then stamp the chain.
   * 
   * This is called after any event handling to ensure the hierarchy is properly updated
   * with the latest state information, including fullKey and depth.
   * 
   * @param {boolean} notify - Whether to force a notification after stamping (default: false)
   */
  function stampUsingCurrentChain(notify = false) {
    const states: any[] = [];
    let current: AnyMachine | undefined = root;
    
    // Single pass following active chain to build states for stamping and hook along the way
    while (current) {
      const s = current.getState?.();
      if (!s) break;
      states.push(s);
      const child = getChildFromParentState(s);
      if (!child) break;
      
      // Hook every discovered descendant immediately (works for duck-typed children too)
      hookMachine(child);
      
      // Continue traversal for any child that exposes getState (duck-typed or branded)
      current = (child as AnyMachine);
    }
    
    // Apply stamps to the entire chain to ensure consistent state
    stamp(states);
    
    // Only notify if explicitly requested to avoid excessive notifications
    if (notify && states.length > 0) {
      (root as any).notify?.({ type: 'child.change', params: [{ _internal: true }] });
    }
  }

  /** Install a send hook on the root to intercept and route child.change events */
  const unhookRoot = sendHook((innerSend: any) => (type: string, ...params: any[]) => {
    if (type === 'child.change') {
      const payload = params[0] || {};
      // Internal child-change: notify subscribers only; do not reprocess.
      if (payload && payload._internal) {
        (root as any).notify?.({ type: 'child.change', params: [payload] });
        return;
      }
      const { type: childType, params: childParams } = payload;
      return handleAtRoot(childType, childParams ?? []);
    }
    if (type.startsWith('child.')) {
      return handleAtRoot(type, params);
    }
    return handleAtRoot(type, params);
  })(root as any);

  // Initial wiring: stamp and hook current chain once
  stampUsingCurrentChain(true); // Notify on initial wiring

  return () => {
    unhookRoot();
    hookedMachines.forEach((m: any) => {
      if (m.__propagateUnhook) {
        m.__propagateUnhook();
        delete m.__propagateUnhook;
      }
    });
    hookedMachines.clear();
  };
}
