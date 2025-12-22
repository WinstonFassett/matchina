// Minimal helper to declare a nested child machine inside a state factory.
// FactoryMachine-only. This is syntactic sugar for embedding `{ machine }` in state data.
export function submachine<F extends () => any>(createChild: F): () => { machine: ReturnType<F> };
export function submachine<F extends () => any>(createChild: F, opts: { id?: string }): () => { machine: ReturnType<F>; id?: string };
export function submachine<F extends () => any>(createChild: F, opts?: { id?: string }) {
  const factory = () => ({ machine: createChild() as ReturnType<F>, ...(opts?.id ? { id: opts.id } : {}) });

  // Attach factory for visualization discovery without calling it
  // Visualizers can inspect createChild.definition or createChild.machine.definition
  (factory as any).machineFactory = createChild;

  return factory;
}

// Legacy options form retained for compatibility; supports id as well.
export function submachineOptions<F extends () => any>(opts: { create: F; id?: string }) {
  return () => ({ machine: opts.create() as ReturnType<F>, ...(opts.id ? { id: opts.id } : {}) });
}
