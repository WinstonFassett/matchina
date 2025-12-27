# Unified Machine Structure Interface Design (REVISED)

## Core Insight

Shapes are **mostly static**, compiled at definition-time. Only nested machines can have dynamic shape changes when their hierarchy mutates (submachines are swapped/added).

This means:
- Don't compute shapes on-demand via getters
- Build shapes once, cache them
- For nested machines, listen for hierarchy changes and recompile
- Use existing subscription patterns (store machines) to notify visualization

## Goal

Design a unified way to expose machine structure as a **static shape store** that works for all machine types (simple, nested, flattened).

This is NOT about:
- Templates or definitions (we have those)
- Validation schemas (not what we need)
- Creation or instantiation
- Runtime introspection (compute on every query)

This IS about:
- **Static structure** compiled at definition time
- **Observable changes** (for nested machines only)
- **How to visualize** the machine
- **How to navigate** its structure
- **What the shape looks like** (manifest/sourcemap/parts-list)

**Scope**: Works for:
1. Simple machines (flat state structure, no shape needed)
2. Nested machines (shape can change when hierarchy mutates)
3. Flattened machines (static shape locked at creation)
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

## SECTION 6: Shape Store Pattern (Static Data + Observable Changes)

### The Shape Interface

```typescript
/**
 * MachineShape - Static description of machine structure
 * 
 * This is NOT a definition (you can't create machines with this).
 * This IS a parts-list/sourcemap/manifest of the machine's structure.
 * 
 * Computed once at definition-time and cached.
 * Visualization reads this to understand how to render the machine.
 */
interface MachineShape {
  // Static structural data (compiled at definition time)
  readonly states: ReadonlyMap<string, StateNode>;        // all states by fullKey
  readonly transitions: ReadonlyMap<string, ReadonlyMap<string, string>>;  // [from][event] = to
  readonly hierarchy: ReadonlyMap<string, string | undefined>;  // [state] = parent (or undefined)
  readonly initialKey: string;
  
  // Optional metadata about HSM representation (for debugging/tooling)
  readonly type?: 'nested' | 'flattened';
}

interface StateNode {
  readonly key: string;          // short name ("Authorized")
  readonly fullKey: string;      // full path ("Payment.Authorized")
  readonly isFinal: boolean;
  readonly isCompound: boolean;  // contains submachine
  readonly initial?: string;     // initial child state (if compound)
}
```

### The Shape Controller (Observable Store)

Machines expose an optional `shape` property that is a store machine:

```typescript
interface ShapeController {
  // Get current compiled shape
  getState(): MachineShape;
  
  // Listen for shape changes (nested machines only)
  subscribe(callback: (shape: MachineShape) => void): () => void;
  
  // Standard store machine API (notify, send, etc.)
}

// On FactoryMachine:
interface FactoryMachine<T> {
  // ... existing API ...
  
  // Optional: machines that have hierarchical structure expose a shape store
  readonly shape?: ShapeController;
}
```

### How Each Machine Type Uses This

**Simple Machine**:
- No `shape` property (flat machines don't need it)
- Visualization directly reads state keys from `machine.transitions`

**Nested Machine (with submachines)**:
- Has `machine.shape` = ShapeController
- Shape is built at initial `propagateSubmachines()` setup (all submachines discovered)
- On `child.change` event (hierarchy mutation), shape store transitions with new compiled shape
- Visualization subscribes to shape changes and recompiles tree

**Flattened Machine**:
- Has `machine.shape` = ShapeController
- Shape is static (built from `_originalDef` at creation, never changes)
- No dynamic transitions (shape is locked)
- Visualization subscribes but receives no updates

### Visualization Usage Pattern

```typescript
// Get shape if it exists
const shape = machine.shape?.getState();

// Subscribe to changes (nested machines will emit updates)
const unsubscribe = machine.shape?.subscribe((newShape) => {
  // Recompile visualization tree
  rebuildTree(newShape);
});

// For current state, use existing mechanism:
const currentState = machine.getState();
```

---

## SECTION 7: Implementation Approach

### Phase 1: Create Shape Builders
Build shape data structures once at definition-time, cache them.

```typescript
// Build shape from flattened machine (static, precomputed)
function buildFlattenedShape(
  machine: FactoryMachine<any>
): MachineShape {
  const originalDef = (machine as any)._originalDef;  // already has shape
  return {
    states: compileStatesToMap(machine.transitions, originalDef.hierarchy),
    transitions: compileTransitions(machine.transitions, originalDef.hierarchy),
    hierarchy: originalDef.hierarchy,  // pre-computed
    initialKey: machine.initialKey,
    type: 'flattened'
  };
}

// Build shape from nested machines (computed at propagation time)
function buildNestedShape(root: FactoryMachine<any>): MachineShape {
  const discovered = new Set<FactoryMachine<any>>();
  const states = new Map<string, StateNode>();
  const transitions = new Map<string, Map<string, string>>();
  const hierarchy = new Map<string, string | undefined>();
  
  function walk(machine: FactoryMachine<any>, parentKey?: string) {
    if (discovered.has(machine)) return;
    discovered.add(machine);
    
    // Process machine's states
    for (const [stateKey, stateTransitions] of Object.entries(machine.transitions)) {
      const fullKey = parentKey ? `${parentKey}.${stateKey}` : stateKey;
      states.set(fullKey, {
        key: stateKey,
        fullKey,
        isFinal: Object.keys(stateTransitions).length === 0,
        isCompound: false  // check if state.data.machine exists
      });
      hierarchy.set(fullKey, parentKey);
      transitions.set(fullKey, new Map(Object.entries(stateTransitions)));
    }
    
    // Discover submachines
    const currentState = machine.getState();
    if (currentState?.data?.machine) {
      const child = currentState.data.machine;
      walk(child, currentState.key);
    }
  }
  
  walk(root);
  
  return {
    states,
    transitions,
    hierarchy,
    initialKey: root.initialKey,
    type: 'nested'
  };
}
```

### Phase 2: Create Shape Store Machine
Machines expose a `shape` property that is a store machine:

```typescript
// Create shape store for flattened machines (static)
function createStaticShapeStore(
  machine: FactoryMachine<any>
): ShapeController {
  const shape = buildFlattenedShape(machine);
  return createStoreMachine(shape);  // standard store, never changes
}

// Create shape store for nested machines (dynamic)
function createDynamicShapeStore(
  root: FactoryMachine<any>
): ShapeController {
  const shapeStore = createStoreMachine(buildNestedShape(root));
  
  // Hook into child.change events to recompute shape
  const unsubscribe = (root as any).subscribe?.((event: any) => {
    if (event.type === 'child.change') {
      const newShape = buildNestedShape(root);
      shapeStore.transition?.(newShape);  // update store
    }
  });
  
  return shapeStore;
}
```

### Phase 3: Attach Shape to Machines
Modify machine creation to add optional `shape` property:

```typescript
// In createMachineFromFlat():
if (isHierarchical) {
  machine.shape = createStaticShapeStore(machine);
}

// In propagateSubmachines():
root.shape = createDynamicShapeStore(root);
```

### Phase 4: Update Visualization
Visualization subscribes to shape changes:

```typescript
export function useMachineShape(machine: FactoryMachine<any>) {
  const [shape, setShape] = useState(machine.shape?.getState());
  
  useEffect(() => {
    const unsubscribe = machine.shape?.subscribe(setShape);
    return unsubscribe;
  }, [machine]);
  
  return shape;
}

// In SketchInspector:
const shape = useMachineShape(machine);
if (shape) {
  // Render tree from shape.states and shape.hierarchy
}
```

---

## SECTION 8: Open Questions

1. **Should the shape property be strongly-typed as a specific store machine type?**
   - Option A: `shape: StoreMachine<MachineShape>`
   - Option B: `shape: ShapeController` (interface with minimal contract)
   - Option C: Generic `shape: StateMachine<MachineShape>` (any subscription-based store)

2. **For nested machines, when exactly do we recompute?**
   - On every `child.change`? (might be frequent)
   - Debounced? (might miss updates)
   - Only when shape-relevant changes occur?

3. **What about dynamic submachine changes at runtime?**
   - If you swap `state.data.machine` to a different machine, shape updates automatically
   - If you add a new submachine to a state, shape updates automatically
   - Current `propagateSubmachines` already tracks this via `hookCurrentChain`

4. **Should simple machines ever have a shape?**
   - Current: No shape property (not hierarchical)
   - Alternative: Optional shape with flat-list structure for consistency?
   - Downside: adds complexity for no benefit

5. **Could shape expose a tree structure directly?**
   - Current: Just maps + hierarchy info (visualization must reconstruct tree)
   - Alternative: Precompute StateNode tree at definition time?
   - Benefit: Faster visualization, cleaner rendering
   - Cost: More memory, more state to maintain

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
