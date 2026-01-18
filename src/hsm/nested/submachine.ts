/**
 * Wrap a machine factory for use as a child in a nested hierarchy.
 * 
 * Used with nestedHsmRoot() to create actual nested machine instances.
 * Embeds the child machine in state.data.machine for event propagation.
 * 
 * @param createChild - Factory function that creates the child machine
 * @param opts - Optional configuration
 * @param opts.id - Optional identifier for the child machine
 * @returns State factory that embeds the child machine
 */
export function submachine<F extends () => { definition: any }>(
  createChild: F
): () => { machine: ReturnType<F> };
export function submachine<F extends () => { definition: any }>(
  createChild: F,
  opts: { id?: string }
): () => { machine: ReturnType<F>; id?: string };
export function submachine<F extends () => any>(
  createChild: F
): () => { machine: ReturnType<F> };
export function submachine<F extends () => any>(
  createChild: F,
  opts: { id?: string }
): () => { machine: ReturnType<F>; id?: string };
export function submachine<F extends () => any>(
  createChild: F,
  opts?: { id?: string }
) {
  const factory = () => ({
    machine: createChild(),
    ...(opts?.id ? { id: opts.id } : {}),
  });

  // Attach factory for visualization discovery without calling it
  // Visualizers can inspect createChild.definition or createChild.machine.definition
  const factoryWithMachine = factory as { machineFactory?: typeof createChild };
  factoryWithMachine.machineFactory = createChild;

  return factory;
}

/**
 * Alternative syntax for creating submachine with options object.
 * 
 * @param opts - Configuration object
 * @param opts.create - Factory function that creates the child machine
 * @param opts.id - Optional identifier for the child machine
 * @returns State factory that embeds the child machine
 */
export function submachineOptions<F extends () => any>(opts: {
  create: F;
  id?: string;
}) {
  return () => ({
    machine: opts.create() as ReturnType<F>,
    ...(opts.id ? { id: opts.id } : {}),
  });
}
