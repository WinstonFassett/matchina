# Flattened Machine Issues Analysis

## Current Problems

### 1. Input Disappears After One Character
**Symptom**: Flattened combobox accepts one character then gets stuck, input disappears
**Root Cause**: Conflicting approaches in state handling

### 2. Visualization Shows Wrong Transitions  
**Symptom**: All substates show same transitions instead of their specific ones
**Root Cause**: Using original hierarchical definition instead of flattened transitions

## Technical Analysis

### State Structure Inconsistency

Flattened machines have inconsistent state structures:

```typescript
// Initial: Inactive
// After focus: Active.Empty (nested MatchboxImpl)
// After typing: TextEntry (raw data) ← PROBLEM
```

The issue is that flattened transitions change the state structure:
- Parent states: `Active.Empty` (nested MatchboxImpl)  
- Child states: `TextEntry` (raw data)

### React Component Conflicts

I made conflicting changes to handle this:

1. **InputSection**: Added check for `['Empty', 'TextEntry', 'Suggesting', 'Selecting']`
2. **ActiveInput**: Added dual handling for state objects vs raw data
3. **SuggestionsList**: Added dual handling for state objects vs raw data
4. **SelectedTagsDisplay**: Added dual handling for state objects vs raw data

These changes conflict with each other and create the "one character then stuck" behavior.

### Visualization Approach Conflicts

I tried three different approaches for visualization:

1. **Original**: Use `_originalDef` (shows wrong transitions)
2. **Runtime only**: Remove `_originalDef` check (shows no nesting)  
3. **Hybrid**: Use `_originalDef` structure + flattened transitions (complex, buggy)

## Root Cause

The fundamental issue is that **flattened machines change their state structure during execution**, but the React components expect consistent structure.

When a flattened machine transitions:
- From `Active.Empty` → `TextEntry`
- The state structure changes from nested to flat
- Components get confused about which structure to expect

## Proposed Solutions

### Option 1: Fix Flattened Machine State Structure
 .machine.data
-mask
Make flattened machinesikan machines maintain .data consistently structured:
- Always use nested MatchboxImpl structure
- Never return raw data

### Option 2: Separate Component Paths  
Create separate React components for flattened vs nested:
- `FlattenedComboboxView` 
- `NestedComboboxView`
- Each expects consistent structure

### Option 3: State Structure Adapter
Create an adapter that normalizes state structure:
- Always return consistent shape to components
- Hide flattening complexity from UI

## Recommendation

**Option 1** is the cleanest: fix the flattened machine implementation to maintain consistent state structure throughout execution.

The flattened machine should never return raw data - it should always return the same nested structure as the hierarchical machine, just with flattened transitions.

## Next Steps

1. Revert all React component changes
2. Fix flattened machine state structure consistency
3. Test with original React components
4. Then fix visualization separately
