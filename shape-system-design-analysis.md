# Shape System Design Analysis & White Paper

## Executive Summary
The current shape system has fundamental design inconsistencies that are causing confusion across the codebase. This paper analyzes the problems and proposes a unified approach.

**UPDATE**: All FactoryMachines should have shapes automatically. Anything not creating shapes is a BUG that needs fixing.

## Current State Analysis

### 1. What We Have
- **HSM machines**: Get shapes automatically via `enhanceWithShape` in `nestedHsmRoot` and `createMachineFromFlat`
- **Non-HSM machines**: Plain `FactoryMachine` instances with NO shape support
- **buildShapeTree**: Fallback function that converts machines to XState-style trees
- **Visualizers**: Expect `MachineShape` objects but have to handle non-HSM machines differently

### 2. The Core Problem
The shape system is not universal. It only applies to certain machine types, creating a two-tier system:
- Tier 1: Machines with shapes (HSMs)
- Tier 2: Machines without shapes (regular state machines)

### 3. Workarounds That Shouldn't Exist
- Sketch visualizer converts trees back to mock shapes
- ReactFlow has duplicate `treeToReactFlow` logic
- Each visualizer handles the shape/non-shape divide differently

## Design Questions to Answer

### Q1: Should ALL machines have shapes?
**Pros:**
- Unified interface for all visualizers
- Consistent behavior across machine types
- No special cases needed

**Cons:**
- Overhead for simple machines
- May require changes to existing machine creation patterns

### Q2: If not all machines have shapes, what's the universal interface?
- Should visualizers expect shapes OR trees?
- Should we have a universal "shape-like" interface?
- Should machines be enhanced on-demand?

### Q3: What is the relationship between shapes and trees?
- Are shapes the canonical representation?
- Are trees just a serialization format?
- Why do we need both?

### Q4: Where should shape enhancement happen?
- At machine creation time?
- In visualizers on-demand?
- In a universal wrapper?

## Proposed Solutions

### Option A: Universal Shapes (Recommended)
All machines get shape support, either:
- At creation via `enhanceWithShape`
- Through a universal wrapper function
- Shapes become the single source of truth

### Option B: Universal Tree Interface
Deprecate shapes for visualizers, use trees everywhere:
- `buildShapeTree` becomes the canonical conversion
- All visualizers work with trees
- Shapes become internal-only

### Option C: Dual Interface Standardization
Keep both but standardize the interface:
- Create a `getShapeOrTree(machine)` utility
- Visualizers use this universal accessor
- Clear documentation on when to use which

## Technical Debt Analysis

### Current Inconsistencies
1. **Data Structure Mismatch**: Shapes vs trees
2. **Enhancement Inconsistency**: Some machines enhanced, others not
3. **Visualizer Workarounds**: Each handles the divide differently
4. **Documentation Gaps**: No clear guidance on approach

### Impact
- Developer confusion (evident from agent struggles)
- Code duplication across visualizers
- Maintenance burden
- Potential bugs from inconsistent handling

## Recommendation

### Phase 1: Unify the Interface
Create a universal accessor that returns shape-like objects for ALL machines:
```typescript
function getVisualizationData(machine: FactoryMachine): VisualizationShape {
  if (hasShape(machine)) {
    return machine.shape.getState();
  }
  // Generate shape on-demand for non-HSM machines
  return generateShapeFromMachine(machine);
}
```

### Phase 2: Deprecate Workarounds
- Remove tree-to-shape conversions in visualizers
- Remove duplicate logic
- Standardize on the universal accessor

### Phase 3: Enhance All Machines
- Apply `enhanceWithShape` to all machines at creation
- Make shapes the default, not the exception
- Deprecate `buildShapeTree` for external use

## Conclusion
The shape system needs to be truly universal or replaced with a universal alternative. The current two-tier approach is causing more problems than it solves. We need ONE way to handle machine visualization data, not multiple workarounds.

## Next Steps
1. Get consensus on the preferred approach
2. Design the universal interface
3. Implement gradually to avoid breaking changes
4. Update all visualizers to use the unified approach
5. Deprecate old patterns
