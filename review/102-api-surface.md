# Matchina: Public API Surface

## Exported Symbols by Category

### Core Machine Creation

| Export | Responsibility | Source |
|--------|---------------|--------|
| `createMachine(states, transitions, init)` | Create a FactoryMachine with typed transitions | `factory-machine.ts` |
| `matchina(states, transitions, init)` | Create FactoryMachine + event API methods | `matchina.ts` |
| `createStoreMachine(initial, transitions)` | Create simple value store with dispatch | `store-machine.ts` |
| `createPromiseMachine(makePromise?)` | Create async state machine (Idle/Pending/Resolved/Rejected) | `promise-machine.ts` |

### State Definition

| Export | Responsibility | Source |
|--------|---------------|--------|
| `defineStates(config)` | Create state factory from config object | `define-states.ts` |
| `matchboxFactory(config, tagProp?)` | Create tagged union factory (foundation) | `matchbox-factory.ts` |
| `matchbox(tag, data, tagProp?)` | Create single matchbox instance | `matchbox-factory.ts` |

### Hierarchical Machines (Experimental)

| Export | Responsibility | Source |
|--------|---------------|--------|
| `defineMachine(states, transitions, initial)` | Create machine definition object | `definitions.ts` |
| `defineSubmachine(states, transitions, initial)` | Mark state as containing submachine | `definitions.ts` |
| `createMachineFrom(def)` | Instantiate from definition | `definitions.ts` |
| `createMachineFromFlat(def)` | Instantiate from flattened definition | `definitions.ts` |
| `flattenMachineDefinition(def, opts?)` | Flatten hierarchy to dot-separated keys | `definitions.ts` |
| `propagateSubmachines(root)` | Install runtime event propagation | `nesting/propagateSubmachines.ts` |
| `createHierarchicalMachine(machine)` | Wrap machine with propagation | `nesting/propagateSubmachines.ts` |

### Lifecycle Hooks

| Export | Responsibility | Source |
|--------|---------------|--------|
| `setup(target)` | Apply setup functions to a target | `ext/setup.ts` |
| `createSetup(...setups)` | Compose multiple setups | `ext/setup.ts` |
| `createDisposer(fns)` | Aggregate cleanup functions | `ext/setup.ts` |
| `guard(fn)` | Hook: prevent transitions | `state-machine-hooks.ts` |
| `enter(fn)` | Hook: react to entering state | `state-machine-hooks.ts` |
| `leave(fn)` | Hook: react to leaving state | `state-machine-hooks.ts` |
| `effect(fn)` | Hook: run side effects | `state-machine-hooks.ts` |
| `before(fn)` | Hook: pre-transition | `state-machine-hooks.ts` |
| `after(fn)` | Hook: post-transition | `state-machine-hooks.ts` |
| `handle(fn)` | Hook: transform event | `state-machine-hooks.ts` |
| `update(fn)` | Hook: apply state change | `state-machine-hooks.ts` |
| `notify(fn)` | Hook: subscriber notification | `state-machine-hooks.ts` |
| `transition(fn)` | Hook: full transition middleware | `state-machine-hooks.ts` |
| `resolveExit(fn)` | Hook: resolve target state | `state-machine-hooks.ts` |
| `send(fn)` | Hook: intercept send calls | `state-machine-hooks.ts` |

### Declarative Lifecycle

| Export | Responsibility | Source |
|--------|---------------|--------|
| `onLifecycle(machine, config)` | State-keyed lifecycle configuration | `factory-machine-lifecycle.ts` |
| `transitionHook(config)` | Single transition hook config | `factory-machine-hooks.ts` |
| `transitionHooks(...configs)` | Multiple transition hooks | `factory-machine-hooks.ts` |
| `whenState(key, fn)` | Filter by `to.key` | `factory-machine-hooks.ts` |
| `whenFromState(key, fn)` | Filter by `from.key` | `factory-machine-hooks.ts` |
| `whenEventType(type, fn)` | Filter by event type | `factory-machine-hooks.ts` |

### Pattern Matching

| Export | Responsibility | Source |
|--------|---------------|--------|
| `match(exhaustive, cases, key, ...params)` | Standalone pattern match | `match-case.ts` |
| `matchChange(event, filter)` | Test event against filter | `match-change.ts` |
| `matchFilters(item, condition)` | Generic filter matching | `match-filters.ts` |
| `matchKey(keyOrKeys, value)` | Match single/array key | `match-filters.ts` |
| `asFilterMatch(item, condition)` | Assert filter match or throw | `match-filters.ts` |
| `getFilter(parts)` | Normalize filter input | `match-filters.ts` |

### Effects

| Export | Responsibility | Source |
|--------|---------------|--------|
| `defineEffects(config)` | Create effect matchbox factory | `extras/effects.ts` |
| `handleEffects(effects, matchers, exhaustive?)` | Execute effect handlers | `extras/effects.ts` |
| `bindEffects(machine, getEffects, matchers, exhaustive?)` | Bind effect handlers to machine | `extras/bind-effects.ts` |

### Machine Enhancers

| Export | Responsibility | Source |
|--------|---------------|--------|
| `withSubscribe(target)` | Add `.subscribe()` method | `extras/with-subscribe.ts` |
| `withReset(machine, state)` | Add `.reset()` method | `extras/with-reset.ts` |
| `resetMachine(machine, state, type?)` | Reset machine to state | `extras/with-reset.ts` |
| `createReset(machine, state)` | Create reset function | `extras/with-reset.ts` |

### Utilities

| Export | Responsibility | Source |
|--------|---------------|--------|
| `when(predicate, fn)` | Conditional execution | `extras/when.ts` |
| `delay(ms)` | Promise-based delay | `extras/delay.ts` |
| `emitter()` | Create pub/sub pair | `extras/emitter.ts` |
| `assignEventApi(machine)` | Add transition methods to machine | `extras/zen.ts` |

### Extension Utilities

| Export | Responsibility | Source |
|--------|---------------|--------|
| `enhanceMethod(target, key, fn)` | Wrap object method | `ext/methodware/enhance-method.ts` |
| `enhanceFunction(fn, wrapper)` | Wrap function | `ext/methodware/enhance-function.ts` |
| `createMethodEnhancer(key)` | Create method enhancer factory | `ext/methodware/method-enhancer.ts` |
| `tap(fn)` | Side-effect wrapper | `ext/funcware/tap.ts` |
| `iff(predicate, fn)` | Conditional wrapper | `ext/funcware/iff.ts` |
| `abortable(fn)` | Abortable wrapper | `ext/funcware/abortable.ts` |
| `fromMiddleware(middleware)` | Convert middleware to funcware | `ext/funcware/from-middleware.ts` |

### Integrations

| Export | Responsibility | Source |
|--------|---------------|--------|
| `useMachine(machine)` | React hook (strict) | `integrations/react.ts` |
| `useMachineMaybe(machine?)` | React hook (optional machine) | `integrations/react.ts` |

### Type Exports

| Export | Source |
|--------|--------|
| `FactoryMachine`, `FactoryMachineTransitions` | `factory-machine-types.ts` |
| `StoreMachine`, `StoreChange`, `StoreTransitionRecord` | `store-machine.ts` |
| `StateMatchbox`, `StateMatchboxFactory` | `state-types.ts` |
| `HasMethod`, `MethodOf` | `ext/methodware/method-utility-types.ts` |
| `HierarchicalMachine`, `HierarchicalEvents` | `nesting/propagateSubmachines.ts` |

---

## Findings

### Redundant APIs

| Finding | Severity | Details |
|---------|----------|---------|
| **Multiple machine creation paths** | Medium | `createMachine`, `matchina`, `createMachineFrom`, `createMachineFromFlat` all create FactoryMachines with different ergonomics |
| **Duplicate state definition** | Low | `defineStates` vs `matchboxFactory` — `defineStates` is just `matchboxFactory(config, "key")` |
| **Hook registration overlap** | Medium | `setup(m)(guard(...))` vs `transitionHook({guard})` vs `onLifecycle(m, {State: {on: {event: {guard}}}})` — three ways to register same hook |

### Ambiguous APIs

| Finding | Severity | Details |
|---------|----------|---------|
| **`matchina` vs `createMachine`** | Medium | Unclear when to use which; `matchina` adds event API but documentation doesn't clarify trade-offs |
| **`propagateSubmachines` vs `flattenMachineDefinition`** | High | Two hierarchy approaches with no clear guidance on selection criteria |
| **`effect` vs `bindEffects`** | Low | `effect` is a hook; `bindEffects` is a setup helper—naming doesn't clarify relationship |

### Unsafe APIs

| Finding | Severity | Details |
|---------|----------|---------|
| **`matchbox` data typing** | Medium | `data: any` parameter loses type safety; relies on factory wrapper for inference |
| **`resetMachine` type coercion** | Low | Uses `as any` for transition event, bypassing type checks |
| **`propagateSubmachines` convention** | High | Relies on `state.data.machine` convention; no compile-time enforcement |
| **`isChildFinal` heuristics** | Medium | Empty transitions object treated as final—fragile implicit behavior |

### Missing APIs

| Finding | Severity | Details |
|---------|----------|---------|
| **No `isStoreMachine` guard** | Low | `isFactoryMachine` exists but no equivalent for StoreMachine |
| **No hierarchy visualization** | Medium | No built-in way to inspect/visualize nested machine structure |
| **No transition history** | Low | No built-in way to access transition history |

### Naming Inconsistencies

| Finding | Severity | Details |
|---------|----------|---------|
| **`send` vs `dispatch`** | Low | FactoryMachine uses `send`, StoreMachine uses `dispatch` |
| **`getState` vs `getChange`** | Low | Both exist; `getState()` returns `getChange().to` |
| **`key` vs `tag`** | Low | States use `key`, matchbox uses `tag` (configurable via `tagProp`) |
