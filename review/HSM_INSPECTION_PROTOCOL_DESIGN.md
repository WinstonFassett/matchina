# Unified Machine Structure Interface Design

## Goal
Design a unified interface that describes the **shape/structure** of ANY state machine (simple, nested, flattened) for visualization and introspection.

This is NOT about:
- Templates or definitions (we have those)
- Validation schemas (not what we need)
- Creation or instantiation

This IS about:
- **How to visualize** the machine
- **How to navigate** its structure
- **How to understand** what's in it
- **What the shape looks like** (hence "manifest", "info", "map", "shape")

**Scope**: Works for:
1. Simple machines (flat state structure)
2. Nested machines (with submachines)
3. Flattened machines (lossy representation requiring external metadata)
4. Future machine types

---

## SECTION 1: Current State Analysis (Lines 1-50)

### Simple Machines
- **Structure**: Flat list of states, no nesting
- **Transitions**: Direct state-to-state mappings
- **Visualization**: Straightforward - list states, draw arrows
- **Example**: Toggle (off <-> on)

### Nested Machines (with submachines)
- **Structure**: States can contain other machines
  - Top-level machine has states
  - Some states contain submachines via `defineSubmachine`
  - Walking requires following `state.data.machine` references at runtime
- **Transitions**: Each level (parent/submachine) has own transition map
- **Hierarchy**: Implicit in object nesting (no separate metadata needed)
- **Parent Access**: Via natural event bubbling through the machine chain
- **Visualization**: Walk machines recursively to build tree

### Flattened Machines (special representation of nested)
- **Structure**: Single flat machine, states are dot-separated (`Payment.Authorized`)
- **Transitions**: Stored in flat map, parent and child keys separate
  - `transitions['Payment']` = parent transitions
  - `transitions['Payment.Authorized']` = child transitions
- **Hierarchy**: LOST in flattening, preserved in `_originalDef` shape metadata
- **Parent Access**: Via `withParentTransitionFallback` hook (runtime intercept)
- **Visualization**: Needs external shape metadata to reconstruct hierarchy

### Key Differences
| Aspect | Simple | Nested | Flattened |
|--------|--------|--------|-----------|
| Hierarchy | None (flat) | Object nesting | Lost (needs metadata) |
| Visualization data | From machine directly | Walk machines | Needs `_originalDef` |
| Transition lookup | Direct map access | Follow chain | Direct map + parent |
| Parent access | N/A | Event bubbles | Fallback hook |
| Metadata needed | None | None (factory has def) | Yes (original def) |

---

## SECTION 2: Minimal Examples Side-by-Side (Lines 51-100)

### The Same HSM in Both Models

**Nested Model:**
```typescript
const paymentMachineDef = defineSubmachine(
  defineStates({ MethodEntry: undefined, Authorized: () => ({ final: true }) }),
  {
    MethodEntry: { authorize: "Authorized" },
    Authorized: {},
  },
  "MethodEntry"
);

const checkoutDef = defineMachine(
  defineStates({ Payment: paymentMachineDef, Review: undefined }),
  {
    Payment: { "child.exit": "Review" },
    Review: {}
  },
  "Payment"
);
```

**Flattened Model:**
```typescript
// Same input structure, then:
const flatDef = flattenMachineDefinition(hierarchicalDef);
const machine = createMachineFromFlat(flatDef);

// Result: state keys are "Payment.MethodEntry", "Payment.Authorized"
// Transitions: separate keys for parent and child
```

### What's the Same?
- The **logical** state hierarchy is identical
- The **transition targets** are the same (Authorized -> Review via child.exit)
- The **semantics** of parent/child relationship are identical
- The **behavior** at runtime should be identical

### What's Different?
- **How** the hierarchy is represented (strings vs nesting)
- **Where** you look to find transitions (flat map vs submachine)
- **When** you resolve parent access (hook intercept vs event bubble)

---

## SECTION 3: What Needs to be Captured (Lines 101-150)

For visualization to work, we need to capture:

### Structural Information
1. **State Hierarchy**
   - The full list of states and their nesting
   - Which states are leaf vs containers
   - Initial state at each level

2. **Transitions**
   - For each state: what events can it respond to, where do they go
   - Including parent transitions accessible to children
   - For nested: which transitions are "internal" (stay in same machine)

3. **State Properties**
   - Which states are "final" (no outgoing transitions)
   - Which states are "compound" (contain submachines)
   - State metadata (if any)

### Behavioral Information
1. **Parent-Child Relationship**
   - What is the "parent" of each state
   - How do parent transitions propagate to children
   - What triggers child exit

2. **Entry/Exit Logic**
   - Is there any entry/exit behavior (future feature?)

### Type Information
1. **Model Type**
   - Is this flattened or nested (for debugging/reporting)
   - Can we detect it automatically?

---

## SECTION 4: Candidate Formats (Lines 151-200)

### Option A: Tree-Based Format
```typescript
interface HSMNode {
  key: string;
  fullKey: string;  // hierarchical path (Payment.Authorized)
  isLeaf: boolean;
  isFinal: boolean;
  isCompound: boolean;
  transitions: Record<string, TransitionTarget>;
  parentTransitions?: Record<string, TransitionTarget>;  // accessible to children
  children?: HSMNode[];
}
```

**Pros**: Hierarchical, intuitive for visualization
**Cons**: Requires tree walk on every query

### Option B: Flat Index Format
```typescript
interface HSMIndex {
  states: Record<string, StateInfo>;  // keyed by fullKey
  transitions: Record<string, Record<string, string>>;  // [from][event] = to
  parentAccess: Record<string, string[]>;  // which parent events are accessible
  hierarchy: Record<string, string>;  // state -> parent mapping
  initial: string;
  type: 'flat' | 'nested';
}
```

**Pros**: Fast lookup, minimal copying, reflects flattened reality
**Cons**: Less intuitive, multiple structures to understand

### Option C: Hybrid Format
```typescript
interface HSMDefinition {
  // Static structural info
  structure: {
    root: StateNode;  // tree
    lookup: Record<string, StateInfo>;  // flat index for fast access
  };
  
  // Behavioral info
  behavior: {
    initialKey: string;
    transitions: TransitionMap;
    parentBubbling: Record<string, string[]>;  // state -> accessible parent events
  };
  
  // Metadata
  meta: {
    type: 'flat' | 'nested';
    modelVersion: string;
  };
}
```

**Pros**: Best of both worlds
**Cons**: More complex

---

## SECTION 5: Tradeoff Analysis (Lines 201-250)

### Visualization Use Cases

1. **Render State Tree** (SketchInspector)
   - Needs: hierarchical structure, state properties
   - Option A: Tree walk directly
   - Option C: Use `structure.root`
   - Option B: Reconstruct tree from hierarchy map

2. **Show Active Path** (highlight current state)
   - Needs: Full path to current state (e.g., "Payment.Authorized")
   - All options work with current implementation

3. **List Available Transitions from State**
   - Needs: Transitions from this state + accessible parent transitions
   - Option B: Direct lookup
   - Option A: Walk to state, collect transitions
   - Option C: Lookup + parentBubbling index

4. **Interactive Click Transitions**
   - Needs: Know which transitions can be sent from current state
   - All options support this

### Performance Considerations

**Option A (Tree)**: 
- Visualization: Fast (structure already there)
- Transitions: Slow (must walk to find state)
- Memory: Higher (duplication across walks)

**Option B (Flat Index)**:
- Visualization: Slow (must reconstruct)
- Transitions: Fast (direct lookup)
- Memory: Minimal

**Option C (Hybrid)**:
- Visualization: Fast (tree already built)
- Transitions: Fast (index for lookup)
- Memory: Medium (both structures)

### Recommendation
Option C (Hybrid) seems best because:
- Fast for visualization (frequent)
- Fast for transition lookup (used in interactive mode)
- Metadata is clear
- Can be built once at definition time

---

## SECTION 6: The Machine Shape Interface (Lines 251-300)

What should every state machine expose so visualization can understand its shape?

```typescript
/**
 * MachineShape - Describes the structure of any state machine
 * 
 * This is NOT a template or definition (we have those).
 * This IS the shape/structure/map of the machine - how to visualize it and navigate it.
 * 
 * Visualization consumes this interface. Doesn't care about internal representation.
 */
interface MachineShape {
  // STRUCTURAL INFORMATION (for visualization)
  readonly structure: {
    readonly root: StateNode;  // state tree (may be flat or hierarchical)
    readonly lookup: ReadonlyMap<string, StateInfo>;  // fast lookup by full key
    readonly initialKey: string;  // full key of starting state
  };
  
  // TRANSITION INFORMATION (for understanding flow)
  readonly transitions: {
    // Get all transitions FROM a state (including any that apply via parent)
    from(stateKey: string): TransitionMap;
    
    // Check if state can receive event
    canReceive(stateKey: string, eventType: string): boolean;
    
    // Resolve where event goes (following this machine's rules)
    resolve(stateKey: string, eventType: string): string | undefined;
  };
  
  // HIERARCHY INFORMATION (for understanding relationships)
  readonly hierarchy: {
    parent(stateKey: string): string | undefined;
    isLeaf(stateKey: string): boolean;
    isFinal(stateKey: string): boolean;
    isCompound(stateKey: string): boolean;  // contains other machine(s)
    children(parentKey: string): string[];
  };
  
  // OPTIONAL: Type info for debugging/reporting (NOT required for visualization)
  // If this machine is a hierarchical state machine (nested or flattened), report which
  readonly hsmType?: 'nested' | 'flattened';
  
  // DYNAMIC (for keeping visualization in sync with runtime changes)
  readonly onStateChange?: (newState: string) => void;  // notify when machine changes
}

interface StateNode {
  readonly key: string;  // short name ("Authorized")
  readonly fullKey: string;  // full path ("Payment.Authorized")
  readonly isFinal: boolean;
  readonly isCompound: boolean;
  readonly initial?: string;  // for compound states
  readonly states?: ReadonlyMap<string, StateNode>;
}

interface StateInfo {
  readonly key: string;
  readonly fullKey: string;
  readonly parent?: string;
  readonly isFinal: boolean;
  readonly isCompound: boolean;
  readonly data?: any;  // custom state metadata
}

interface TransitionMap {
  readonly [event: string]: string | ((params: any) => string);
}
```

### How Each Machine Type Implements This

**Simple Machine**:
- `structure`: All states are leaves, no hierarchy
- `transitions.from()`: Direct lookup in state's transition map
- `transitions.resolve()`: Straightforward target resolution
- `hierarchy`: Parent is always undefined, no compound states
- `hsmType`: undefined (not a hierarchical state machine)
- `onStateChange`: Can be a direct hook

**Nested Machine (with submachines)**:
- `structure`: Built by recursively walking machines
- `transitions.from()`: Collect from current machine + check parent machine
- `transitions.resolve()`: Event bubbles up through machine chain
- `hierarchy`: Derive from machine nesting (submachines are compound)
- `hsmType`: "nested" (this IS an HSM, hierarchical variant)
- `onStateChange`: Walk chain of machines to notify

**Flattened Machine**:
- `structure`: Built from `_originalDef` + flattened state keys
- `transitions.from()`: Look up both the state AND its parent in flat map
- `transitions.resolve()`: Use fallback hook logic
- `hierarchy`: Pre-compute from state keys and original def
- `hsmType`: "flattened" (this IS an HSM, flattened variant)
- `onStateChange`: Direct hook to machine

**Key insight**: `hsmType` is optional because simple machines don't have it. Visualization doesn't need it (just describes what it sees). But if present, it tells you how the HSM is represented internally.

---

## SECTION 7: Implementation Approach (Lines 301-350)

### Phase 1: Extract Current Information
Create helpers to build `MachineShape` from each machine type without changing machines.

```typescript
// For simple machines (most of them):
export function getSimpleShape(
  machine: FactoryMachine<any>
): MachineShape {
  return {
    structure: {
      root: buildSimpleTree(machine),
      lookup: buildSimpleLookup(machine),
      initialKey: machine.initialKey
    },
    transitions: {
      from: (key) => machine.transitions[key] || {},
      canReceive: (key, event) => key in machine.transitions && event in machine.transitions[key],
      resolve: (key, event) => machine.transitions[key]?.[event]
    },
    hierarchy: { /* all return undefined for simple */ }
    // hsmType is undefined (simple machines aren't HSMs)
  };
}

// For nested machines (with submachines):
export function getNestedShape(
  machine: FactoryMachine<any>
): MachineShape {
  return {
    structure: buildStructureFromNested(machine),
    transitions: {
      from: (key) => /* walk machine chain */,
      canReceive: (key, event) => /* check current + parent */,
      resolve: (key, event) => /* follow bubbling */
    },
    hierarchy: { /* derive from nesting */ },
    hsmType: 'nested'
  };
}

// For flattened machines (special case):
export function getFlattenedShape(
  machine: FactoryMachine<any>
): MachineShape {
  const originalShape = (machine as any)._originalDef;  // shape metadata, not a definition
  return {
    structure: buildStructureFromFlattened(originalShape, machine.transitions),
    transitions: {
      from: (key) => /* flat + parent lookup */,
      canReceive: (key, event) => /* flat + fallback */,
      resolve: (key, event) => /* flat + fallback */
    },
    hierarchy: { /* pre-computed */ },
    hsmType: 'flattened'
  };
}
```

### Phase 2: Unify Visualization
Change visualization to:
1. Detect machine type
2. Get appropriate `MachineShape`
3. Use that interface (not the machine)
4. Build visualization from unified shape

```typescript
export function getXStateDefinition(machine: FactoryMachine<any>) {
  // Detect type and get shape
  const shape = detectMachineType(machine) === 'flattened'
    ? getFlattenedShape(machine)
    : detectMachineType(machine) === 'nested'
    ? getNestedShape(machine)
    : getSimpleShape(machine);
  
  // Build visualization from shape (NOT from machine)
  return buildVisualizationFromShape(shape);
}
```

### Phase 3: Consider Attaching to Machine
If we find this protocol useful, consider making it:
- A public method: `machine.getShape()` or `machine.getStructure()`
- A hook: machines can register to provide this
- Or both (method delegates to hook)

This would separate concerns: visualization code only talks to shape protocol, not machines directly.

Note: Could potentially replace `_originalDef` attachment with a `getShape()` method, making the intent clearer and the API more explicit.

### Phase 4: Improve Implementations
Once we see the unified protocol, it might suggest improvements:
- Could the flattening process be clearer?
- Could parent fallback be simpler?
- Could we eliminate the need for `_originalDef` attachment?

---

## SECTION 8: Open Questions

1. **Should inspection be a public API?**
   - Or internal implementation detail?
   - If public, does it get versioned?

2. **Should machines actively push state changes?**
   - Current: Visualization polls `machine.getState()`
   - Alternative: Machines notify inspection system
   - This would keep visualizers in sync automatically

3. **What about HSM features we don't yet have?**
   - Entry/exit actions
   - Guards/conditions
   - History states
   - Parallel regions
   
   Should protocol account for these?

4. **Could this inform flattening algorithm?**
   - Current: `flattenMachineDefinition()` produces flat def
   - Alternative: Could produce inspection info directly?
   - Would that be cleaner?

5. **What about visualization hooks?**
   - Could visualizers register interest in state changes via hook?
   - Would that be cleaner than polling?

---

## SECTION 9: Existing Definition Patterns (Insights)

### Pattern 1: `machineFactory.def` (Nested)
Submachines already store their definition in `machineFactory.def`:
```typescript
// In visualization code (line 95):
const machineFactory = (stateFactory as any)?.machineFactory;
const nestedDef = machineFactory.def;  // <-- Already there!
```

This is used to:
- Avoid instantiating the machine (just introspect the definition)
- Get the schema without creating runtime objects

**Insight**: Nested machines already have a form of inspection protocol via the factory pattern.

### Pattern 2: `_originalDef` (Flattened)
Flattened machines attach the original hierarchical shape:
```typescript
// In createMachineFromFlat (line 113-114):
if (def._originalDef) {
  (machine as any)._originalDef = def._originalDef;
}
```

This is used to:
- Preserve hierarchical shape for visualization
- Restore structure that flattening loses

**Insight**: Flattened machines need external shape metadata because flattening is lossy.

### Unifying These Patterns
Both patterns are solving the same problem: "give visualization the shape/structure it needs without requiring runtime introspection."

Could we:
1. Make both use the same pattern?
2. Have all machines expose a `.shape` or `.structure` property?
3. Use hooks so visualization never directly accesses machines?

---

## SECTION 10: Next Steps (If Approved)

1. Implement phase 1: Extract info builders
2. Create test that verifies both models produce equivalent inspection info
3. Measure impact on visualization code complexity
4. If successful, consider refactoring visualization to use protocol
5. Re-evaluate whether `_originalDef` attachment is still needed
6. **Exploration**: Could flattened machines use `machineFactory.def` pattern instead of `_originalDef`?
