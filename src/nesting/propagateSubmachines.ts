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
      // Reserved child.* events are handled at the machine's own level
      if (type.startsWith('child.')) return innerSend(type, ...params);
      // Block non-root direct sends and re-send via root as child.change
      // This routes through the root's event loop to preserve ordering and visibility.
      return (root as any).send('child.change', { target: m, type, params });
    })(m as any);
    (m as any).__propagateUnhook = unhook;
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
      const ev = (root as any).resolveExit?.({ type, params, from });
      // Stamping can happen before the transition, as it's based on the current state chain.
      stampUsingCurrentChain();
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

  /**
   * Discover the current active chain by following child pointers starting at root,
   * hooking along the way, and then stamp the chain.
   */
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
      // Hook every discovered descendant immediately (works for duck-typed children too)
      hookMachine(child);
      // Continue traversal for any child that exposes getState (duck-typed or branded)
      current = (child as AnyMachine);
    }
    stamp(states);
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
  stampUsingCurrentChain();

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
