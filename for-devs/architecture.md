# Architecture Overview

## Core Module System

The library is built on **layered primitives** that compose together:

### Foundation Layer
- **matchbox-factory.ts** - Tagged unions with type-safe pattern matching
- **defineStates.ts** - State definition utilities
- **transitionHooks.ts** - Lifecycle and transition hooks

### Machine Layer
- **factory-machine.ts** - Full-featured state machines
- **store-machine.ts** - Simple state containers
- **promise-machine.ts** - Async operation management

### Extension Layer
- **ext/** - Extension system (setup, funcware, methodware)
- **extras/** - Optional utilities (emitter, effects, etc.)
- **integrations/** - Library bridges (react, zod, valibot)

## Module Dependencies

```
┌─────────────────┐
│   Integrations   │  ←  React, Zod, Valibot
├─────────────────┤
│     Extras      │  ←  Emitter, Effects
├─────────────────┤
│      Ext        │  ←  Setup, Funcware
├─────────────────┤
│     Machines    │  ←  Factory, Store, Promise
├─────────────────┤
│    Foundation   │  ←  Matchbox, States, Hooks
└─────────────────┘
```

## Design Patterns

### Factory Pattern
All machines use factory functions:
```typescript
// ✅ CORRECT
export const createToggleMachine = () => createMachine(states, transitions, "Off");

// ❌ WRONG - Global instances
export const toggleMachine = createMachine(states, transitions, "Off");
```

### Type Inference
The library relies on TypeScript's type inference:
- No explicit types for transitions
- States inferred from definitions
- Events typed by machine definition

### Composition
Primitives compose together:
```typescript
import { matchboxFactory } from 'matchina';
import { createMachine } from 'matchina/factory-machine';
import { createStoreMachine } from 'matchina/store-machine';
```

## Integration Points

### React Integration
```typescript
import { useMachine } from 'matchina/react';
```

### Visualization
```typescript
import { ReactFlowInspector } from 'matchina/viz-reactflow';
```

### Validation
```typescript
import { zodIntegration } from 'matchina/zod';
```

## Performance Characteristics

- **Lazy loading** - Only load modules you use
- **Tree-shaking** - Dead code eliminated
- **No runtime overhead** - Compile-time type checking
- **Memory efficient** - Minimal object allocation
