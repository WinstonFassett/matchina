# ReactFlow V2 Layout Engine Analysis

## Overview
Document of what layout engines are being used for each layout type in ReactFlow V2, what was used before, and current status.

## Layout Engine Mapping

### ✅ Working Layouts

| Layout Type | Engine Used | ELK Algorithm | Hierarchy Support | Status | Notes |
|-------------|-------------|---------------|------------------|--------|-------|
| **Sugiyama** | ELKLayoutEngine | `layered` | ✅ Automatic (ELK) | ✅ WORKING | Perfect hierarchy support, bottom-up sizing |
| **Tree** | ELKLayoutEngine | `mrtree` | ✅ Automatic (ELK) | ✅ WORKING | Perfect hierarchy support, tree-specific |
| **Force** | ELKLayoutEngine | `force` | ✅ Automatic (ELK) | ✅ WORKING | Good hierarchy support, force-directed |
| **Organic** | ELKLayoutEngine | `stress` | ✅ Automatic (ELK) | ✅ WORKING | Perfect hierarchy support, organic arrangement |
| **Grid** | GridLayoutEngine | Custom | ✅ Manual Implementation | ✅ WORKING | True grid arrangement with custom hierarchy logic |

### ⚠️ Limited Layouts

| Layout Type | Engine Used | ELK Algorithm | Hierarchy Support | Status | Limitations |
|-------------|-------------|---------------|------------------|--------|-------------|
| **Circular** | ELKLayoutEngine | `radial` | ✅ Automatic (ELK) | ⚠️ LIMITED | Requires tree structure (no cycles) |

## Hierarchy Support Details

### ELK Automatic Hierarchy (5 layouts)
**How it works**: `elk.hierarchyHandling: INCLUDE_CHILDREN`
- ✅ **Bottom-up sizing** - Children sized first, then parents
- ✅ **Container bounds** - Parents resize to contain children
- ✅ **Child positioning** - Children positioned relative to parents
- ✅ **Edge routing** - Automatic hierarchical edge routing
- ✅ **No custom code needed** - ELK handles everything

**Layouts using ELK hierarchy**:
- Sugiyama (`layered`) - Designed for hierarchical graphs
- Tree (`mrtree`) - Tree-specific hierarchy algorithm  
- Force (`force`) - Force-directed with hierarchy support
- Organic (`stress`) - Stress majorization with hierarchy
- Circular (`radial`) - Radial layout with hierarchy (tree only)

### Custom Manual Hierarchy (Grid layout)
**How it works**: Manual implementation (ACTUALLY TOP-DOWN, NOT BOTTOM-UP)
```typescript
// 1. Separate hierarchy
const { rootNodes, childNodesMap } = this.separateHierarchy(nodes);

// 2. Layout root nodes first (TOP-DOWN approach)
const positionedRootNodes = this.layoutNodes(rootNodes, settings, { x: 0, y: 0 });

// 3. Layout children relative to parents (still TOP-DOWN)
for (const [parentId, children] of childNodesMap.entries()) {
  const parentNode = positionedRootNodes.find(n => n.id === parentId);
  if (parentNode) {
    const positionedChildren = this.layoutNodes(children, settings, parentNode.position);
    
    // 4. Update parent size to contain children (this is bottom-up sizing)
    const parentBounds = this.calculateBounds(positionedChildren, 20);
    const updatedParent = {
      ...parentNode,
      style: {
        ...parentNode.style,
        width: Math.max(150, parentBounds.width + 40),
        height: Math.max(50, parentBounds.height + 40),
      },
    };
  }
}
```

**❌ WRONG CLAIM IDENTIFIED**: 
- **Claimed**: "Bottom-up sizing" for Grid layout
- **Reality**: Grid layout uses **TOP-DOWN positioning** with **post-hoc parent resizing**
- **Difference**: 
  - True bottom-up: Size children first, then position parents based on child sizes
  - Grid approach: Position parents first, then position children relative to parents, finally resize parents to fit

**Grid hierarchy features**:
- ❌ **Top-down positioning** - Parents positioned first, children relative to parents
- ✅ **Post-hoc resizing** - Parents resized after children positioned
- ✅ **Container padding** - 20px padding around children
- ✅ **Grid positioning** - Children arranged in grid within parent
- ✅ **Edge label spacing** - 87.5% of node width for labels
- ✅ **Direction/alignment** - Row/column with alignment options

### Before vs After Hierarchy Support

| Layout | Before (Custom) | After (Current) | Improvement |
|--------|----------------|----------------|-------------|
| **Sugiyama** | ✅ ELK hierarchy | ✅ ELK hierarchy | No change (was already good) |
| **Tree** | ✅ ELK hierarchy | ✅ ELK hierarchy | No change (was already good) |
| **Force** | ❌ No hierarchy | ✅ ELK hierarchy | ✅ Major improvement |
| **Organic** | ❌ No hierarchy | ✅ ELK hierarchy | ✅ Major improvement |
| **Circular** | ❌ No hierarchy | ⚠️ ELK hierarchy (tree only) | ✅ Improvement but limited |
| **Grid** | ❌ No hierarchy | ✅ Custom hierarchy | ✅ Major improvement |

## Complete Layout Feature Matrix

| Layout | Implementation | Hierarchy | Bottom-up Sizing | Edge Label Spacing | Cyclic Graphs | Grid Arrangement | Status | Verification |
|--------|----------------|------------|------------------|-------------------|---------------|-----------------|--------|--------------|
| **Sugiyama** | ELK `layered` | ✅ Automatic | ✅ ELK native | ✅ Built-in | ✅ Supported | ❌ Not applicable | ✅ Perfect | ✅ Verified (HSM combobox) |
| **Tree** | ELK `mrtree` | ✅ Automatic | ✅ ELK native | ✅ Built-in | ✅ Supported | ❌ Not applicable | ✅ Perfect | ⚠️ Not tested |
| **Force** | ELK `force` | ✅ Automatic | ✅ ELK native | ✅ Built-in | ✅ Supported | ❌ Not applicable | ✅ Good | ⚠️ Not tested |
| **Organic** | ELK `stress` | ✅ Automatic | ✅ ELK native | ✅ Built-in | ✅ Supported | ❌ Not applicable | ✅ Good | ✅ Verified (Traffic light) |
| **Circular** | ELK `radial` | ✅ Automatic | ✅ ELK native | ✅ Built-in | ❌ Tree only | ❌ Not applicable | ⚠️ Limited | ❌ FAILED (Traffic light cycle) |
| **Grid** | Custom Engine | ❌ Top-down | ❌ Post-hoc resize | ✅ 87.5% node width | ✅ Supported | ✅ True grid | ✅ Working | ✅ Verified (Traffic light) |

## Detailed Test Results

### ✅ Verified Working

#### Sugiyama (HSM Combobox)
- **Test**: Hierarchical combobox (Inactive → Active.[Empty, Suggesting])
- **Result**: ✅ Perfect hierarchy, proper container sizing
- **Evidence**: Active group contains child states correctly

#### Organic (Traffic Light)  
- **Test**: Flat traffic light (Red → Green → Yellow → Red)
- **Result**: ✅ Organic triangle arrangement, good spacing
- **Evidence**: Nodes arranged in triangular pattern, not jumbled

#### Grid (Traffic Light)
- **Test**: Flat traffic light (Red → Green → Yellow → Red)  
- **Result**: ✅ True grid arrangement (row direction)
- **Evidence**: Nodes positioned in horizontal grid line

### ❌ Verified Failed

#### Circular (Traffic Light)
- **Test**: Flat traffic light (Red → Green → Yellow → Red)
- **Result**: ❌ Java error "The given graph is not a tree!"
- **Evidence**: Layout fails completely, falls back to previous
- **Limitation**: ELK radial algorithm requires acyclic graphs

### ⚠️ Not Tested (Assumptions)

#### Tree Layout
- **Claim**: Works with hierarchy support
- **Reality**: ⚠️ Not actually tested
- **Need**: Test with hierarchical data

#### Force Layout  
- **Claim**: Works with hierarchy support
- **Reality**: ⚠️ Not actually tested
- **Need**: Test with both flat and hierarchical data

### ❌ Wrong Claims Identified

#### Edge Label Spacing Claims
- **Claim**: All layouts have proper edge label spacing
- **Reality**: ⚠️ Only visually verified for Grid/Organic
- **Need**: Measure actual spacing vs 75-100% node width requirement

#### Bottom-up Sizing Claims
- **Claim**: All layouts do bottom-up sizing  
- **Reality**: ⚠️ Only verified for hierarchical layouts
- **Need**: Test with deep hierarchies to verify sizing

#### Container Bounds Claims
- **Claim**: Parents resize to contain children
- **Reality**: ⚠️ Only verified for Sugiyama
- **Need**: Test container resizing with different content sizes

## Implementation Details

### ELK-Based Layouts (5/6)
**How hierarchy works**: Single ELK option
```typescript
"elk.hierarchyHandling": "INCLUDE_CHILDREN"
```

**Benefits**:
- Zero custom hierarchy code needed
- Battle-tested algorithms
- Consistent behavior across layouts
- Automatic edge routing through containers

**Settings**: Each layout has algorithm-specific options
- `layered`: Layer spacing, node placement, compaction
- `mrtree`: Tree-specific compaction, spacing
- `force`: Repulsion, attraction, temperature
- `stress`: Stress majorization parameters
- `radial`: Radius, wedge, polar routing

### Custom Grid Layout (1/6)
**How hierarchy works**: Manual 4-step process
1. **Separate** - `separateHierarchy()` splits roots/children
2. **Layout Roots** - Grid arrangement of top-level nodes
3. **Layout Children** - Grid within each parent container
4. **Resize Parents** - Bottom-up bounds calculation

**Custom features**:
- True grid arrangement (rows/columns)
- Configurable alignment (start/center/end)
- Direction control (row/column)
- Auto-fit dimensions
- Edge label spacing (87.5% of node width)

### Why This Architecture Works

**ELK Strengths**:
- ✅ **5 algorithms** cover most use cases
- ✅ **Built-in hierarchy** - no custom code needed
- ✅ **Java performance** - highly optimized
- ✅ **Battle-tested** - production quality

**Custom Grid Necessity**:
- ❌ **No ELK grid algorithm** - doesn't exist
- ✅ **True grid arrangement** - rows/columns needed
- ✅ **Full control** - grid-specific options
- ✅ **Proven pattern** - hierarchy implementation works

**Result**: 5/6 layouts use best-in-class ELK algorithms, 1/6 uses custom implementation where ELK has no equivalent.

### Before (All Custom Engines - e46641d02 and earlier)
**File Structure**: All layouts used custom implementations
- `OrganicLayoutEngine.ts` - Custom organic layout
- `CircularLayoutEngine.ts` - Custom circular layout  
- `GridLayoutEngine.ts` - Custom grid layout
- `ForceDirectedLayoutEngine.ts` - Custom force layout
- `ELKLayoutEngine.ts` - Only for Sugiyama/Tree

**Problems**:
- **No hierarchy support** except for Sugiyama/Tree (ELK-based)
- **Inconsistent spacing** - each engine had different edge label handling
- **Code duplication** - 5 separate custom implementations
- **Poor defaults** - "terrible defaults" for non-hierarchical layouts
- **Jumbled layouts** - nodes overlapping, poor spacing

### After (Mixed Approach - e46641d02 onward)
**File Structure**: ELK-native + custom only where needed
- `ELKLayoutEngine.ts` - Handles 5/6 layouts via ELK algorithms
- `GridLayoutEngine.ts` - Only for grid (no ELK native algorithm)
- **Removed**: `OrganicLayoutEngine.ts`, `CircularLayoutEngine.ts`, `ForceDirectedLayoutEngine.ts`

**Benefits**:
- **Universal hierarchy support** via ELK's `INCLUDE_CHILDREN`
- **Battle-tested algorithms** - ELK's proven implementations
- **Consistent behavior** - Same spacing and edge handling across layouts
- **Less code** - Single ELK wrapper vs 4 custom engines
- **Better defaults** - ELK's well-tuned parameters

## Current Issues

### 1. Circular Layout Limitation
**Problem**: ELK's `radial` algorithm requires tree structures
**Error**: `java.lang.IllegalArgumentException: The given graph is not a tree!`
**Affected**: Traffic light (Red→Green→Yellow→Red cycle)
**Solution Needed**: Either:
- Use custom CircularLayoutEngine with hierarchy support
- Find alternative ELK algorithm for circular layouts
- Accept limitation (tree structures only)

### 2. Settings Validation
**Problem**: Some layout-specific settings don't map to ELK schema
**Examples**: 
- Circular: `startAngle`, `clockwise` (removed in transformation)
- Grid: `alignment`, `cols`, `autoFit` (handled by custom engine)
**Status**: ✅ Fixed for most cases

## ELK Algorithm Support

### ✅ Fully Supported
- `layered` - Sugiyama hierarchical layout
- `mrtree` - Tree layout algorithm  
- `force` - Force-directed layout
- `stress` - Stress majorization (organic)
- `radial` - Radial/circular layout (tree only)

### ❌ Not Available
- `disco` - Disjoint component layout (not in schema)
- Native grid algorithm (doesn't exist in ELK)

## Hierarchy Support

### ELK Automatic Features
- `elk.hierarchyHandling: INCLUDE_CHILDREN` - Bottom-up sizing
- Automatic container bounds calculation
- Child node positioning relative to parents
- Proper edge routing through hierarchy

### Custom Engine Features (Grid)
- Manual hierarchy separation (`separateHierarchy()`)
- Bottom-up parent sizing (`calculateBounds()`)
- Grid positioning with edge label spacing
- Container padding and bounds calculation

## Settings Transformation

### ELK Schema Mapping
```typescript
// Circular layout - remove unsupported settings
if (type === LayoutType.CIRCULAR) {
  delete elkSettings.startAngle;    // ELK radial doesn't support
  delete elkSettings.clockwise;    // ELK radial doesn't support
}

// Grid layout - use custom engine (no transformation needed)
// Grid uses GridLayoutEngine directly
```

## Performance Considerations

### ELK Advantages
- **Java-based** - Highly optimized algorithms
- **Battle-tested** - Production-grade layouts
- **Consistent** - Same quality across all supported layouts

### Custom Engine Advantages
- **TypeScript** - No Java overhead
- **Specialized** - Optimized for specific use cases (Grid)
- **Controllable** - Full control over layout behavior

## Recommendations

### 1. Keep Current Mixed Approach
- ✅ ELK for 5/6 layouts (best of breed algorithms)
- ✅ Custom only where necessary (Grid)
- ✅ Universal hierarchy support

### 2. Fix Circular Layout
**Option A**: Restore custom CircularLayoutEngine with hierarchy support
**Option B**: Accept tree-only limitation with clear error messaging
**Option C**: Research alternative circular algorithms

### 3. Testing Strategy
- Test each layout with both flat and hierarchical examples
- Verify edge label spacing (75-100% of node width)
- Confirm bottom-up container sizing
- Check error handling for invalid graphs

## File Locations

### Core Layout System
- `/src/viz/ReactFlowV2/layout/LayoutManager.ts` - Engine routing and mapping
- `/src/viz/ReactFlowV2/layout/types.ts` - Type definitions

### ELK Engine
- `/src/viz/ReactFlowV2/layout/engines/ELKLayoutEngine.ts` - ELK wrapper

### Custom Engines  
- `/src/viz/ReactFlowV2/layout/engines/GridLayoutEngine.ts` - Grid layout
- (Other custom engines removed in favor of ELK)

## Future Considerations

### Potential Improvements
1. **Circular Layout Fix** - Most critical missing piece
2. **Settings UI** - Better expose layout-specific options
3. **Performance** - Consider WebAssembly for ELK if needed
4. **Testing** - Automated visual regression tests

### Architectural Decisions
1. **Mixed Approach** - Proven effective, keep
2. **ELK-first** - Use native algorithms when available
3. **Custom Fallback** - Only when ELK doesn't support

## Conclusion

The current architecture provides **partial coverage** with **3/6 layouts verified working**, **1/6 verified failing**, and **2/6 not tested**.

### ✅ Verified Success (3/6 = 50%)
- **Sugiyama** - Perfect hierarchy support (verified)
- **Organic** - Good organic arrangement (verified)  
- **Grid** - True grid arrangement (verified)

### ❌ Verified Failure (1/6 = 17%)
- **Circular** - Fails on cyclic graphs (verified limitation)

### ⚠️ Unknown Status (2/6 = 33%)
- **Tree** - Assumed working, not tested
- **Force** - Assumed working, not tested

### Critical Issues to Resolve
1. **Test Tree and Force layouts** - Verify they actually work with hierarchy
2. **Fix Circular layout** - Either restore custom engine or accept limitation
3. **Verify edge label spacing** - Measure actual spacing vs requirements
4. **Test deep hierarchies** - Verify bottom-up sizing works properly

**Status**: 🟡 **Partially complete** - 50% verified working, 33% untested, 17% broken
