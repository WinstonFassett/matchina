// Minimal helper to declare a nested child machine inside a state factory.
// FactoryMachine-only. This is syntactic sugar for embedding `{ machine }` in state data.
export function submachine<F extends () => { definition: any }>(createChild: F): () => { machine: ReturnType<F> };
export function submachine<F extends () => { definition: any }>(createChild: F, opts: { id?: string }): () => { machine: ReturnType<F>; id?: string };
export function submachine<F extends () => { definition: any }>(createChild: F, opts?: { id?: string }) {
  const factory = () => ({ machine: createChild(), ...(opts?.id ? { id: opts.id } : {}) });

  // Attach factory for visualization discovery without calling it
  // Visualizers can inspect createChild.definition or createChild.machine.definition
  const factoryWithMachine = factory as { machineFactory?: typeof createChild };
  factoryWithMachine.machineFactory = createChild;

  return factory;
}

export function submachineOptions<F extends () => any>(opts: { create: F; id?: string }) {
  return () => ({ machine: opts.create() as ReturnType<F>, ...(opts.id ? { id: opts.id } : {}) });
}
