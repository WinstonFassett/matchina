import type { FactoryMachine } from "../factory-machine";
import { send as sendHook } from "../state-machine-hooks";
import { isFactoryMachine } from "../machine-brand";
import { AllEventsOf } from "./types";
import { FactoryMachineEventImpl } from "../factory-machine-event";

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
  send: (type: HierarchicalEvents<M>, ...params: any[]) => void;
};

export type HierarchicalEvents<M> =
  | AllEventsOf<M>
  | string;

// dead simple wrapper
export function createHierarchicalMachine<M extends FactoryMachine<any>>(machine: M) {
  propagateSubmachines(machine);
  return machine as any as HierarchicalMachine<M>;
}

// attach to a root machine to propagate events up and down
// synchronously enforcing proper flow
export function propagateSubmachines<M extends FactoryMachine<any>>(root: M): void {

  // maybe we track our bound machines somewhere so we can unhook them? 
  // it may be ok to track these non-globally, while func is in use, until disposed
  // surprised not to see more problems related to cleanup
  // but maybe propagate hook is prop there is helping, idk

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

  // UNUSED dspose function???
  function unhookMachine(m: AnyMachine) {
    if ((m as any).__propagateUnhook) {
      (m as any).__propagateUnhook();
      delete (m as any).__propagateUnhook;
    }
  }

  // Determine if a child's current state is final
  // if marked as such or has no transitions
  function isChildFinal(child: any, childState: any): boolean {
    if (childState?.data?.final) return true;
    const transitions = (child as any).transitions?.[childState?.key];
    return transitions && Object.keys(transitions).length === 0;
  }

  // Perform child-first resolution starting at root. Builds the chain during descent.
  // 🧑‍💻: this function is an absolute beast. needs explanation.
  // why so monolithic?
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
      if (ev) (root as any).transition?.(ev);
      // Stamp after handling, using the now-current active chain discovered by a shallow pass from root down
      // 🧑‍💻: um why after resolveExit? this can happen sooner, does not break things to do so, so far.
      stampUsingCurrentChain();
      return ev;
    }

    const result = descend(root as AnyMachine);
    // After deepest handling, bubble child.exit upward along the visited chain
    // 🧑‍💻: YES! bubble child.exit
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
    // Stamp using the post-change active chain to ensure new state objects are annotated
    // 🧑‍💻: weird to me that this takes no args
    stampUsingCurrentChain();
    
    // Notify root subscribers for non-exit child changes so parent observers see updates
    // 🧑‍💻: this is weird. i don't want to have to explicitly notify
    // we have more lifecycle than that. 
    if (result.handled && !String(type).startsWith('child.')) {
      // 🧑‍💻: NO. should be using full lifecycle. 
      (root as any).notify?.({ type: 'child.change', params: [{ target: result.handledBy, type, params }] });
      // 🧑‍💻: I would prefer to do somethign earlier like send(type, ...params) or transition(ev)
      // this should work assuming our interceptors know what to do with it
      // root.send('child.change', ...params);
    }
    return result.event ?? null;
  }

  // UNUSED??? TOTALLY UNUSED.
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
      // Hook every discovered descendant immediately (works for duck-typed children too)
      hookMachine(child); // 🧑‍💻: what about unhooking???
      // Continue traversal for any child that exposes getState (duck-typed or branded)
      current = (child as AnyMachine);
    }
    stamp(states);
  }

  // Root send hook
  // UNUSED disposer??? we never unhook? 
  // propagate is supposed to have cleanup, cleanup should clean stuff up off root etc. 
  const unhookRoot = sendHook((innerSend: any) => (type: string, ...params: any[]) => {
    // in this shitty unused hook, 
    // WHY would you NOT call innerSend??
    // maybe if this were wired up the send call i want to make would work
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
