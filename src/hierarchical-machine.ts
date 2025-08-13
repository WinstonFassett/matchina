// Minimal hierarchical state machine (stacked chain) for matchina
// Works with both FactoryMachine and StoreMachine via a common probe + execute interface

export type AnyMachine = {
  getState(): any;
  // FactoryMachine surface
  resolveExit?(ev: any): any | undefined;
  send?(type: string, ...params: any[]): void;
  // StoreMachine surface
  dispatch?(type: string, ...params: any[]): void;
};

export type HierMachineNode<M extends AnyMachine = AnyMachine> = {
  scope: string;
  machine: M;
  snapshot?: unknown;
};

export type HierSnapshot = {
  chain: Array<{ scope: string; state: any }>;
  meta?: any;
};

export type RetainPolicy =
  | { keep: number }
  | { predicate: (scope: string, idx: number) => boolean };

export interface HierMachine {
  getSnapshot(): HierSnapshot;
  getChain(): HierMachineNode[];
  ensureChain(scopes: string[]): void;
  dispatch(type: string, ...params: any[]): { handled: boolean };
  unmountBeyond(depth: number): void;
}

export function createHierMachine(
  registry: Record<string, () => AnyMachine>,
  options?: { retain?: RetainPolicy; onResolveChild?: (scope: string, type: string, params: any[]) => boolean }
): HierMachine {
  const nodes: HierMachineNode[] = [];

  const hsm: HierMachine = {
    getSnapshot() {
      return {
        chain: nodes.map(({ scope, machine }) => ({ scope, state: machine.getState() })),
      };
    },
    getChain() {
      return nodes.slice();
    },
    ensureChain(scopes: string[]) {
      // Align existing prefix
      let i = 0;
      for (; i < scopes.length; i++) {
        const scope = scopes[i];
        const exists = nodes[i];
        if (exists && exists.scope === scope) {
          continue;
        }
        // Replace from i with new nodes based on scopes
        nodes.splice(i);
        for (let j = i; j < scopes.length; j++) {
          const s = scopes[j];
          const factory = registry[s];
          if (!factory) {
            throw new Error(`No machine factory registered for scope: ${s}`);
          }
          nodes.push({ scope: s, machine: factory() });
        }
        break;
      }
      // If we had more nodes than scopes, apply retention policy
      if (nodes.length > scopes.length) {
        applyRetention(nodes, scopes.length, options?.retain);
      }
    },
    dispatch(type: string, ...params: any[]) {
      // deepest-first bubbling
      for (let i = nodes.length - 1; i >= 0; i--) {
        const { scope, machine } = nodes[i];
        if (options?.onResolveChild && options.onResolveChild(scope, type, params) === false) {
          continue;
        }
        const from = safeGetState(machine);
        const pending = probe(machine, { type, params, from });
        if (pending) {
          execute(machine, type, params);
          return { handled: true };
        }
      }
      return { handled: false };
    },
    unmountBeyond(depth: number) {
      applyRetention(nodes, depth, options?.retain);
    },
  };

  return hsm;
}

function safeGetState(m: AnyMachine) {
  try {
    return m.getState();
  } catch {
    return undefined;
  }
}

function probe(m: AnyMachine, ev: { type: string; params: any[]; from: any }) {
  if (typeof m.resolveExit === "function") {
    // FactoryMachine or StoreMachine with probe
    return m.resolveExit({ type: ev.type, params: ev.params, from: ev.from } as any);
  }
  return undefined;
}

function execute(m: AnyMachine, type: string, params: any[]) {
  if (typeof m.send === "function") {
    m.send(type, ...params);
    return;
  }
  if (typeof m.dispatch === "function") {
    m.dispatch(type, ...params);
    return;
  }
}

function applyRetention(nodes: HierMachineNode[], activeDepth: number, retain?: RetainPolicy) {
  if (!retain) {
    nodes.splice(activeDepth);
    return;
  }
  if ("keep" in retain) {
    const end = Math.min(nodes.length, activeDepth + retain.keep);
    nodes.splice(end);
    return;
  }
  if ("predicate" in retain) {
    // Keep nodes that satisfy predicate; otherwise remove beyond active depth
    for (let i = nodes.length - 1; i >= activeDepth; i--) {
      const n = nodes[i];
      if (!retain.predicate(n.scope, i)) {
        nodes.splice(i, 1);
      }
    }
  } else {
    nodes.splice(activeDepth);
  }
}
