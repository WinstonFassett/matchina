# Layout Engine Goals

## Primary Goals
For all ReactFlow layouts to work nicely with:
- ✅ **Good defaults** that work out of the box
- ✅ **Good spacing** for nodes and edge labels (75-100% node width)
- ✅ **Good visibility** - no overlapping, clear readability
- ✅ **Good settings thresholds** - sensible min/max values
- ✅ **Easy experimentation** with ELK algorithms

## Secondary Goals
- ✅ **Configurable layout exposure** - choose which layouts to show users
- ✅ **Proper semantic naming** - radial vs circular distinction
- ✅ **Easy algorithm switching** - try other ELK layouts
- ✅ **Clear error handling** - graceful failures

## Current Issues to Resolve

### 1. Circular Layout is Broken
- **Problem**: Using `radial` (tree-only) for "circular" layouts
- **Error**: "The given graph is not a tree!" on traffic light
- **Solution**: Use `graphviz.circo` for true circular layouts

### 2. Radial Layout Misunderstood
- **Current**: Labeled as "circular" but actually radial tree
- **Reality**: Needs single root node at center, tree structure
- **Action**: Rename/clarify as "Radial Tree" or fix for non-tree graphs

### 3. Missing Algorithm Options
- **Available but unused**: Graphviz algorithms (circo, twopi, dot)
- **Goal**: Easy experimentation with ELK algorithms
- **Need**: Configurable algorithm selection

## Layout Strategy

### Keep Working Layouts
- ✅ **Sugiyama** (layered) - Perfect for hierarchy
- ✅ **Tree** (mrtree) - Tree-specific algorithm
- ✅ **Force** (force) - Force-directed layout
- ✅ **Organic** (stress) - Organic arrangement
- ✅ **Grid** (custom) - True grid arrangement

### Fix Broken Layouts
- 🔧 **Circular** → Use `graphviz.circo`
- 🔧 **Radial** → Clarify as tree-only or replace with `graphviz.twopi`

### Add New Options
- ➕ **Graphviz Circo** - True circular for state machines
- ➕ **Graphviz Twopi** - Radial tree alternative
- ➕ **Graphviz Dot** - Alternative hierarchical

## Implementation Priorities

### Phase 1: Fix What's Broken
1. **Fix Circular Layout** - Replace radial with graphviz.circo
2. **Clarify Radial Layout** - Tree-only, proper naming
3. **Test All Layouts** - Verify 6/6 working

### Phase 2: Add Options
1. **Add Graphviz Algorithms** - circo, twopi, dot to schema
2. **Configurable Exposure** - Choose which layouts to show
3. **Algorithm Switching** - Easy ELK experimentation

### Phase 3: Quality Improvements
1. **Fine-tune Defaults** - Optimize spacing/visibility
2. **Settings Validation** - Proper min/max thresholds
3. **Error Handling** - Graceful fallbacks

## Quality Standards

### Spacing Requirements
- **Edge labels**: 75-100% of node width spacing
- **Node spacing**: Minimum 1.1x node width
- **Container padding**: 20px around children
- **Layer spacing**: 2-4x node height for hierarchical

### Visibility Requirements
- **No overlapping nodes**
- **No overlapping edge labels**
- **Clear container boundaries**
- **Readable text at all zoom levels

### Usability Requirements
- **Good defaults** - Work without configuration
- **Intuitive settings** - Clear parameter meanings
- **Reasonable ranges** - Min/max that make sense
- **Fast switching** - Smooth layout transitions

## Success Criteria

### Functional Success
- ✅ All 6+ layouts work without errors
- ✅ Traffic light circular layout works
- ✅ Hierarchical layouts show proper containment
- ✅ Edge labels are readable and non-overlapping

### User Experience Success
- ✅ Layouts work out of the box with defaults
- ✅ Settings are intuitive and effective
- ✅ Easy to experiment with different algorithms
- ✅ Clear understanding of each layout's purpose

### Developer Experience Success
- ✅ Easy to add new ELK algorithms
- ✅ Configurable layout exposure
- ✅ Clear error messages and handling
- ✅ Well-documented algorithm capabilities
