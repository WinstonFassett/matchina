// Minimal helper to declare a nested child machine inside a state factory.
// FactoryMachine-only. This is syntactic sugar for: () => ({ machine: createChild() })
export function withSubstates<F extends () => any>(createChild: F) {
  return () => ({ machine: createChild() as ReturnType<F> });
}

// Overload with options (reserved for future retention/data policies)
export function withSubstatesOptions<F extends () => any>(opts: { create: F }) {
  return () => ({ machine: opts.create() as ReturnType<F> });
}
