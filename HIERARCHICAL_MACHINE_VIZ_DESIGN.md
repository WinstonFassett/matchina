# Hierarchical Machine Visualization - Technical Design

## Overview
Building hierarchical machine inspection and visualization with focus on `propagateSubmachines` core functionality. Moving away from functional transitions to `{ to: key, handle: fn }` format for better inspectability.

## Core Goals
1. **Propagate Submachines** - Chain reaction propagation supporting infinite depth
2. **Runtime Inspection** - Full context (stack, depth, fullKey) for debugging
3. **Test-Driven Development** - Focus on ONE TEST THAT MATTERS first
4. **Inspectable Transitions** - Move from functional to structured format

## Key Test Case: 3-Level Search Bar Machine
- **Level 1 (Root)**: Permanent - `idle`, `active`  
- **Level 2 (Search)**: Permanent - `pending`, `fetching`, `done`
- **Level 3 (Fetch)**: Ephemeral - created by level 2 `fetching` state

This tests:
- Permanent vs ephemeral submachines
- Chain reaction propagation 
- Full context propagation (stack, depth, fullKey)

## Technical Architecture

### State Context Enhancement
Each state gets enhanced with:
```javascript
state = {
  // existing state properties
  stack: [state1, state2, state3], // full ancestor chain
  depth: 2, // position in hierarchy
  fullKey: "active.fetching.pending" // dot-separated path
}
```

### Propagation Strategy
**Chain Reaction (not recursive traversal)**:
1. Child machine changes trigger parent listeners
2. Parent does self-transition to update context
3. Chain reaction cascades up to root
4. All machines maintain full context

### Transition Format Change
**From**: `transitions: { update: () => "newState" }`
**To**: `transitions: { update: { to: "newState", handle: () => {...} } }`

Benefits:
- Inspectable target states
- Separates intent from logic
- Better debugging/visualization

## Implementation Plan

### Phase 1: Core Infrastructure
1. **propagateSubmachines enhancer**
   - Wraps existing machine
   - Adds context propagation
   - Chain reaction listeners

2. **State context helpers**
   - buildStack() - constructs ancestor chain
   - calculateDepth() - determines hierarchy level  
   - buildFullkey() - creates dot-separated path

### Phase 2: Test Implementation
1. **Search bar 3-level test**
   - Root machine (idle/active)
   - Search submachine (pending/fetching/done)
   - Ephemeral fetch submachine
   - Test full context propagation

2. **Infinite depth test**
   - Recursive nesting validation
   - Chain reaction verification

### Phase 3: Transition Format
1. **Structured transitions**
   - { to, handle } format
   - Backward compatibility
   - Type safety improvements

## Decision Points / Blockers

### 1. Dev Folder Structure
**Question**: Use dev folder with permissive tsconfig for implementation?
**Options**:
- Create `/dev` folder with loose typing
- Work directly in existing structure
- Hybrid approach

### 2. Chain Reaction vs Full Traversal
**Current Plan**: Chain reaction (seems better from notes)
**Validation Needed**: Performance implications, debugging complexity

### 3. Event Interception Strategy
**Question**: Where to intercept sends for propagation?
**Options**:
- Wrap send() method
- Lifecycle hook enhancement
- Custom propagation events

## File Structure (Proposed)
```
src/
  hierarchical/
    propagate-submachines.js    # Core enhancer
    context-helpers.js          # Stack/depth/fullKey utils
    transition-utils.js         # { to, handle } format support
  tests/
    hierarchical/
      search-bar-test.js        # 3-level test case
      infinite-depth-test.js    # Recursive validation
```

## Questions for Winston
1. Dev folder with permissive tsconfig approach?
2. Any preferences on event interception strategy?
3. Should we maintain backward compatibility during transition format change?
4. Any specific visualization requirements beyond core functionality?

## Next Steps
1. Create search bar test case first (TDD approach)
2. Implement minimal propagateSubmachines to make test pass
3. Add context enhancement (stack, depth, fullKey)
4. Iterate on chain reaction propagation
5. Add structured transition format support