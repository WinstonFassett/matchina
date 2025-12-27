# Unified HSM Inspection Protocol Design

## Goal
Design a unified, implementation-agnostic inspection mechanism that works for both flattened and nested HSMs. This will:
1. Allow visualization to work mostly independently of implementation model
2. Create a canonical way to describe any HSM
3. Inform and possibly improve the underlying implementations
4. Support both static and dynamic inspection

---

## SECTION 1: Current State Analysis (Lines 1-50)

### Flattened HSMs
- **Structure**: State keys are dot-separated (`Payment.Authorized`)
- **Transitions**: Stored in flat map where parent and child keys are separate
  - `transitions['Payment']` = parent transitions
  - `transitions['Payment.Authorized']` = child transitions (empty for final states)
- **Hierarchy**: Preserved in `_originalDef` (static definition)
- **Parent Access**: Via `withParentTransitionFallback` hook (runtime intercept)
- **Child Exit**: Via `withFlattenedChildExit` hook (auto-trigger when final)

### Nested HSMs
- **Structure**: State hierarchy is object-based
  - Machine contains top-level states
  - Some states contain submachines
  - Walking requires following `state.data.machine` references
- **Transitions**: Each level (parent/child machine) has own transition map
- **Hierarchy**: Implicit in object structure (no separate definition needed)
- **Parent Access**: Via natural event bubbling through the machine chain
- **Child Exit**: Via `propagateSubmachines` hook (bubbles exits automatically)

### Key Differences
| Aspect | Flattened | Nested |
|--------|-----------|--------|
| Hierarchy representation | String keys with dots | Object nesting + machine refs |
| Visualization data | Needs `_originalDef` attachment | Derives from runtime walking |
| Transition lookup | Direct map access | Follow submachine chain |
| Parent access | Explicit fallback hook | Implicit event bubbling |
| Initial state of child | Explicit in flattening | Via submachine.initialKey |

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

## SECTION 6: The Protocol / Interface (Lines 251-300)

What should every HSM (flat or nested) expose for inspection?

```typescript
/**
 * HSMInspectionInfo - Unified protocol for inspecting any HSM
 * Both flattened and nested machines implement this
 */
interface HSMInspectionInfo {
  // IDENTITY
  readonly type: 'flat' | 'nested';
  readonly version: string;  // for future compatibility
  
  // STATIC STRUCTURE (buildable at definition time)
  readonly structure: {
    readonly root: StateNode;  // tree for hierarchical visualization
    readonly lookup: ReadonlyMap<string, StateInfo>;  // fast state lookup by fullKey
    readonly initialKey: string;  // full key of initial state
  };
  
  // TRANSITIONS (how to get from state to state)
  readonly transitions: {
    // Get all transitions FROM a state (including parent fallthrough)
    from(stateKey: string): TransitionMap;
    
    // Check if state can receive event
    canReceive(stateKey: string, eventType: string): boolean;
    
    // Resolve where event goes (following rules of the model)
    resolve(stateKey: string, eventType: string): string | undefined;
  };
  
  // HIERARCHY (relationships)
  readonly hierarchy: {
    parent(stateKey: string): string | undefined;
    isLeaf(stateKey: string): boolean;
    isFinal(stateKey: string): boolean;
    isCompound(stateKey: string): boolean;
    children(parentKey: string): string[];
  };
  
  // DYNAMIC (for runtime-aware visualization)
  onStateChange?: (newState: string) => void;  // hook for viz to stay in sync
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

### How Both Models Implement This

**Flattened**:
- `type`: "flat"
- `structure`: Built from `_originalDef` + flattened state keys
- `transitions.from()`: Look up both the state AND its parent in flat map
- `transitions.resolve()`: Use fallback hook logic
- `hierarchy`: Pre-compute from state keys and original def

**Nested**:
- `type`: "nested"
- `structure`: Built by tree walking machines
- `transitions.from()`: Collect from current machine + parent chain
- `transitions.resolve()`: Use natural bubbling
- `hierarchy`: Derive from nested structure

---

## SECTION 7: Implementation Approach (Lines 301-350)

### Phase 1: Extract Current Information
Create helpers to build `HSMInspectionInfo` from both models without changing machines.

```typescript
// For flattened:
export function getFlattenedInspectionInfo(
  machine: FactoryMachine<any>
): HSMInspectionInfo {
  const originalDef = (machine as any)._originalDef;
  return {
    type: 'flat',
    structure: buildStructureFromFlattened(originalDef, machine.transitions),
    transitions: {
      from: (key) => /* flat lookup logic */,
      canReceive: (key, event) => /* ... */,
      resolve: (key, event) => /* ... */
    },
    hierarchy: { /* ... */ }
  };
}

// For nested:
export function getNestedInspectionInfo(
  machine: FactoryMachine<any>
): HSMInspectionInfo {
  return {
    type: 'nested',
    structure: buildStructureFromNested(machine),
    transitions: {
      from: (key) => /* nested walking logic */,
      // ...
    },
    hierarchy: { /* ... */ }
  };
}
```

### Phase 2: Unify Visualization
Change `getXStateDefinition` to:
1. Detect machine type
2. Get appropriate `HSMInspectionInfo`
3. Use that (not the machine directly)
4. Build visualization from unified protocol

```typescript
export function getXStateDefinition(machine: FactoryMachine<any>) {
  const info = machine.type === 'flat' 
    ? getFlattenedInspectionInfo(machine)
    : getNestedInspectionInfo(machine);
  
  return buildVisualizationFromInfo(info);
}
```

### Phase 3: Consider Attaching to Machine
If we find this protocol useful, consider making it:
- A public method: `machine.getInspectionInfo()`
- A hook: machines can register to provide this
- Or both (method delegates to hook)

This would separate concerns: visualization code only talks to inspection protocol, not machines directly.

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
Flattened machines attach the original hierarchical definition:
```typescript
// In createMachineFromFlat (line 113-114):
if (def._originalDef) {
  (machine as any)._originalDef = def._originalDef;
}
```

This is used to:
- Preserve hierarchy for visualization
- Provide structure that flattening loses

**Insight**: Flattened machines need external metadata because flattening is lossy.

### Unifying These Patterns
Both patterns are trying to solve the same problem: "give visualization the schema without requiring runtime introspection."

Could we:
1. Make both use the same pattern?
2. Have all machines expose a `.definition` or `.schema` property?
3. Use hooks so visualization never directly accesses machines?

---

## SECTION 10: Next Steps (If Approved)

1. Implement phase 1: Extract info builders
2. Create test that verifies both models produce equivalent inspection info
3. Measure impact on visualization code complexity
4. If successful, consider refactoring visualization to use protocol
5. Re-evaluate whether `_originalDef` attachment is still needed
6. **Exploration**: Could flattened machines use `machineFactory.def` pattern instead of `_originalDef`?
