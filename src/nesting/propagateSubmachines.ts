import type { FactoryMachine } from "../factory-machine";
import { resolveExit as hookResolveExit, send } from "../state-machine-hooks";
import { buildSetup } from "../ext/setup";
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

function isHandled(before: any, after: any, grandBefore?: any, grandAfter?: any): boolean {
  return before?.key !== after?.key || (grandBefore && grandAfter && grandBefore?.key !== grandAfter?.key);
}

function looksLikeExit(after: any, grandAfter: any, hadMachine: boolean, hasMachine: boolean, duck: boolean, includeDataStateExitForDuck: boolean): boolean {
  const grandFinal = !!grandAfter?.data?.final;
  const machineLost = hadMachine && !hasMachine;
  const hasData = after?.data !== undefined && after?.data !== null;
  const noMachine = !hasMachine;
  const dataStateExit = hasData && noMachine && (duck ? includeDataStateExitForDuck : true);
  return duck ? !!after?.data?.final : (!!after?.data?.final || machineLost || grandFinal || dataStateExit);
}

function triggerExit(machine: FactoryMachine<any>, parentState: any, after: any) {
  const id = parentState?.data?.id ?? parentState?.id;
  const currentParentState = machine.getState();
  const ev = (machine as any).resolveExit?.({
    type: "child.exit",
    params: [{ id, state: after?.key, data: after?.data }],
    from: currentParentState,
  });
  if (ev) {
    (machine as any).transition?.(ev);
  }
}

function trySend(m: AnyMachine, type: string, ...params: any[]) {
  if (!m) throw new Error("Cannot send to undefined machine");
  if (typeof m.send !== "function") {
    throw new Error('Invalid state machine: send method is required');
  }
  return (m.send as any)(type, ...params);
}

function enhanceSend(child: AnyMachine, machine: FactoryMachine<any>) {
  return (origSend: any) => (type: string, ...params: any[]) => {
    // If invoked from parent routing, allow child to handle directly
    if ((child as any).__fromParent) return origSend(type, ...params);
    // Otherwise route up to root if available
    const root = (machine as any).__rootMachine || machine;
    const handler = (root as any).__handleFromChild as undefined | ((t: string, ...p: any[]) => any);
    if (typeof handler === 'function') return handler(type, ...params);
    return (machine as any).send?.(type, ...params);
  };
}

export function propagateSubmachines<M extends FactoryMachine<any>>(
  machineIgnoreThis: M,
  _unusedStack?: any[], // no longer used
  _unusedDepth?: number,
  parentMachine?: FactoryMachine<any>
) {
  return (machine: M) => {
    const [addSetup, disposeAll] = buildSetup(machine);

    // Root/parent pointers, bubbling notifier
    (machine as any).__rootMachine = parentMachine ? ((parentMachine as any).__rootMachine || parentMachine) : machine;
    (machine as any).__parentNotify = parentMachine
      ? (ev: any) => {
          try {
            (parentMachine as any).notify?.(ev);
            (parentMachine as any).__parentNotify?.(ev);
          } catch {}
        }
      : undefined;

    const originalGetState = machine.getState;

    // Normalize resolveExit inputs (non-mutating)
    addSetup(hookResolveExit((ev: any, next: (ev: any) => any) => {
      const from = ev?.from ?? originalGetState.call(machine);
      const params = Array.isArray(ev?.params) ? ev.params : [];
      return next({ ...ev, from, params });
    }));

    // Eagerly wire child machine once if present
    try {
      const state = originalGetState.call(machine);
      const child = getChildFromParentState(state);
      if (child && !(child as any).__parentMachine) {
        try {
          (child as any).__parentMachine = machine;
          (child as any).__rootMachine = (machine as any).__rootMachine || machine;
        } catch {}
        propagateSubmachines(child as any, undefined, undefined, machine as any)(child as any);
        if (isFactoryMachine(child as any)) {
          const [addChildSetup] = buildSetup(child as any);
          addChildSetup(send(enhanceSend(child as any, machine as any)));
        }
      }
    } catch {}

    // Child-first routing and delegated handling
    const childFirst = (type: string, ...params: any[]): boolean => {
      const parentState = machine.getState();
      const child = getChildFromParentState(parentState);
      if (!child) return false;

      const before = snapshot(child);
      const grandBefore = getChildFromParentState(before);
      const grandBeforeSnap = grandBefore ? snapshot(grandBefore) : undefined;

      let threw = false;
      try {
        (child as any).__suppressChildNotify = true;
        (child as any).__fromParent = true;
        trySend(child, type, ...params);
      } catch {
        threw = true;
      } finally {
        try { delete (child as any).__suppressChildNotify; } catch {}
        try { delete (child as any).__fromParent; } catch {}
      }

      const after = snapshot(child);
      const grandAfter = getChildFromParentState(after);
      const grandAfterSnap = grandAfter ? snapshot(grandAfter) : undefined;

      const handledByState = isHandled(before, after, grandBeforeSnap, grandAfterSnap);
      const duckChild = !isFactoryMachine(child as any);
      const handled = !threw && (handledByState || duckChild);

      if (!handled) return false;

      const hadMachine = before?.data?.machine;
      const hasMachine = after?.data?.machine;
      const changedLocal = before?.key !== after?.key;

      if (looksLikeExit(after, grandAfterSnap, hadMachine, hasMachine, duckChild, true)) {
        triggerExit(machine, parentState, after);
      } else if (changedLocal) {
        try {
          const currentParentState = machine.getState();
          (machine as any).notify?.({
            type: "child.changed",
            from: currentParentState,
            to: currentParentState,
            params: [{ id: parentState?.data?.id ?? parentState?.id, child: after?.key }],
            machine,
          });
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
    };

    addSetup(
      send(innerSend => {
        try {
          (machine as any).__innerSend = innerSend;
          (machine as any).__handleFromChild = (type: string, ...params: any[]) => {
            // Try parent first
            const beforeParent = originalGetState.call(machine);
            const beforeChild = getChildFromParentState(beforeParent);
            const beforeChildSnap = beforeChild ? snapshot(beforeChild) : undefined;

            const resolved = (machine as any).resolveExit?.({ type, params, from: beforeParent } as any);
            if (!(resolved && resolved.to?.key === beforeParent.key && (!params || params.length === 0))) {
              innerSend(type, ...params);
            }

            const afterParent = originalGetState.call(machine);
            const afterChild = getChildFromParentState(afterParent);
            const afterChildSnap = afterChild ? snapshot(afterChild) : undefined;

            const parentHandled = beforeParent?.key !== afterParent?.key;
            if (parentHandled) return;

            // Delegate to child
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
          if (handled) return;

          const from = originalGetState.call(machine);
          const resolved = (machine as any).resolveExit?.({ type, params, from } as any);
          if (resolved && resolved.to?.key === from.key && (!params || params.length === 0)) {
            return; // parameterless self-transition is a no-op
          }

          const result = innerSend(type, ...params);

          // After parent handles, wire a newly active child
          try {
            const newState = originalGetState.call(machine);
            const child = getChildFromParentState(newState);
            if (child && !(child as any).__parentMachine) {
              try {
                (child as any).__parentMachine = machine;
                (child as any).__rootMachine = (machine as any).__rootMachine || machine;
              } catch {}
              propagateSubmachines(child as any, undefined, undefined, machine as any)(child as any);
              if (isFactoryMachine(child as any)) {
                const [addChildSetup] = buildSetup(child as any);
                addChildSetup(send(enhanceSend(child as any, machine as any)));
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

export type HierarchicalMachine<M> = M & {
  send: (type: HierarchicalEvents<M>, ...params: any[]) => void;
};

export type HierarchicalEvents<M> =
  | AllEventsOf<M>
  | string;

export function createHierarchicalMachine<M extends FactoryMachine<any>>(machine: M) {
  propagateSubmachines(machine)(machine);
  return machine as any as HierarchicalMachine<M>;
}
