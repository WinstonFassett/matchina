# Philosophy & Inspiration

Matchina is built around type-safe state management with powerful pattern matching and async handling.

## Core Principles

### Type-Safe State Factories

- Create discriminated union types with `matchboxFactory()` for powerful pattern matching
- Build factory machines with complete type inference for states and transitions
- Enjoy automatic type narrowing with `.is()` and `.as()` type guards

### Smart Transitions

- Define transitions with TypeScript inferring parameter types from destination states
- Trigger transitions with fully typed parameters based on target state requirements
- Handle complex transition logic with guards and side effects

### Async Handling

- `createPromiseMachine` for type-safe async state management
- Lifecycle hooks for promises with appropriate typing
- Safe error handling for rejected promises

### React Integration

- React hooks for consuming state machines
- Type-safe component rendering based on state

### Hierarchical State Machines

- Build complex nested state machines with `submachine()` composition
- Dual-mode support: flattened definitions or nested hierarchies
- Shape-based visualization with automatic transition discovery
- Event propagation between parent and child machines

### Visualization Tools

- Multiple inspector types: ReactFlow, Mermaid, Sketch, ForceGraph
- Dark/light theme support with unified styling
- Real-time state highlighting and interactive exploration
- Export visualizations for documentation and debugging
