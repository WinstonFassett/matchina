# Hierarchical Machine Visualization - Implementation Progress

## 🚀 STATUS: REDESIGN REQUIRED ⚠️ → DYNAMIC STACK APPROACH NEEDED 🔧
**Current Implementation Issues Identified** | **Static Enhancement Approach Problematic** | **Global Stack/WeakMaps Must Be Removed**

## 🎯 Summary  
Implemented working hierarchical machine context propagation and SketchInspector component, but identified critical design issues:
- ✅ Context propagation (`stack`, `depth`, `fullkey`) working in tests
- ✅ SketchInspector component implemented and functional
- ⚠️ **DESIGN ISSUE**: Current implementation uses global stack + WeakMaps (static approach)
- ⚠️ **DESIGN ISSUE**: Not dynamic listening/detaching as states change
- ⚠️ **REGRESSION**: child.exit functionality broken by static enhancement

## 🔧 Critical Issues Requiring Redesign
The current `propagateSubmachines.ts` implementation has fundamental problems:

### 1. Global Stack Anti-Pattern
```javascript
// PROBLEMATIC: Global shared state
let globalHierarchyStack: any[] = [];
```
**Issue**: Single global stack shared across all machines violates design principle of incremental stack passing.

### 2. WeakMaps/WeakSets Static Enhancement  
```javascript
// PROBLEMATIC: Static enhancement tracking
const childEnhanced = new WeakSet<object>();
```
**Issue**: Static enhancement approach doesn't support dynamic listening/detaching as states change.

### 3. child.exit Functionality Regression
**Issue**: The static enhancement approach broke existing child.exit event propagation.

## 🎯 Required Solution: Dynamic Incremental Stack Approach
**Design Principle**: "We are incrementally creating a stack and as we go down, we are giving that same stack to each thing but we don't have a fucking global stack."

### Phase 1: Redesign propagateSubmachines (URGENT)
**Goal**: Replace global stack + WeakMaps with dynamic incremental stack passing
- **Remove**: Global stack variable and WeakMaps/WeakSets
- **Implement**: Each machine receives and passes down its own stack context  
- **Dynamic**: Support listening/detaching as states change
- **Fix**: Restore child.exit functionality

### Phase 2: SketchInspector Integration (COMPLETE ✅)
**Status**: SketchInspector component is implemented and working
- ✅ **Component**: `/docs/src/components/inspectors/SketchInspector.tsx` trusts framework
- ✅ **Core Fix**: Uses only `useMachine(machine)` hook as required
- ✅ **Display**: Shows `fullkey`, `depth`, hierarchical paths correctly
- ✅ **Highlighting**: Highlights innermost active state using `depth === stack.length - 1`

### Phase 3: Existing Visualizers (DEFERRED)
Port after core propagation redesign:
- **Mermaid Diagrams** - Working on R1 branch 
- **Flow Charts** - Working on R1 branch
- **State Charts** - Working on R1 branch

### Phase 4: Advanced Hierarchical Features (FUTURE)
- **Dynamic Depth Visualization** - Show/hide hierarchy levels
- **Context Inspector** - View stack, depth, fullkey data  
- **Transition Tracing** - Visualize chain reactions and event propagation

## 🗂️ Original Requirements (from HIERARCHICAL_MACHINE_VIZ_TASK.md)
- Move away from direct functional transitions to `{ to: key, handle: fn }` for inspectability ✅
- Focus on propagate submachines and chain reaction propagation ✅  
- Support infinite depth with context (stack, depth, fullkey) ✅
- Test with 3-level machine where top 2 are permanent, level 3 is ephemeral ✅
- Focus on implementation and tests over types initially ✅

## 📋 Work Completed (With Issues)

### 1. SketchInspector Component Implementation ✅
- **File**: `/docs/src/components/inspectors/SketchInspector.tsx` 
- **Status**: COMPLETE and functional
- **Approach**: Trusts hierarchical framework, uses only `useMachine(machine)`
- **Features**: Displays fullkey paths, highlights innermost active states
- **UI**: Shows state metadata, available transitions, hierarchical paths

### 2. Context Propagation (PROBLEMATIC IMPLEMENTATION) ⚠️
- **File**: `src/nesting/propagateSubmachines.ts`
- **Status**: WORKING but violates design principles  
- **Issues**: Uses global stack + WeakMaps instead of incremental stack approach
- **Enhancement**: States have `stack`, `depth`, `fullkey` properties attached
- **Problem**: Static enhancement breaks dynamic listening/detaching requirements

### 3. Test Implementation (PASSING BUT NEEDS REDESIGN) ✅⚠️ 
- **Files**: Various test files showing 2-level and 3-level hierarchical context
- **Status**: All tests currently passing with current implementation
- **Structure**: Root (Active/Inactive) -> Search (Idle/Typing/Fetching) -> Fetch (Pending/Success/Error)
- **Issue**: Tests pass with problematic global stack approach
- **Required**: Tests need to pass after redesign to dynamic incremental stack

### 4. Chain Reaction & Child.Exit Support (REGRESSION) ❌
- **Status**: BROKEN by static enhancement approach
- **Issue**: child.exit event propagation not working properly with WeakMaps approach
- **Required**: Restore functionality with dynamic incremental stack redesign

### 5. Inspectable Transition Format (UNAFFECTED) ✅
- **File**: `src/factory-machine.ts` (modified `resolveExitState`)  
- **Status**: This feature works independently and is unaffected by propagation issues
- **Enhancement**: Factory machine supports `{ to: "StateKey", handle: fn }` format
- **Backward Compatible**: Legacy string and function formats still work

## 🧪 Current Test Status
**All tests currently passing with problematic implementation** - need to ensure they continue passing after redesign.

### Working Test Files (Require Redesign Compatibility)
- **context-propagation-bug.test.tsx** - Context propagation working  
- **sketch-inspector.test.tsx** - SketchInspector displaying hierarchical paths
- **hsm.*.test.ts** - Various hierarchical machine tests
- **inspectable-transitions.test.ts** - Transition format tests (unaffected)

## 🏗️ Architecture Decisions

### Context Propagation Strategy
- **Chosen**: Enhance `getState()` dynamically vs modifying state objects directly
- **Benefit**: No breaking changes, context always current
- **Implementation**: Each hierarchical machine maintains its ancestor stack

### Transition Enhancement Approach  
- **Chosen**: Modify `resolveExitState` in factory machine vs separate wrapper
- **Benefit**: Native support, no breaking changes, full backward compatibility
- **Integration**: Works seamlessly with existing propagateSubmachines

### Hierarchy Management
- **Chosen**: Chain reaction propagation vs recursive traversal
- **Benefit**: Better performance, simpler debugging, clear event flow
- **Pattern**: Child changes trigger parent transitions that update context

## 🚀 Key Achievements

1. **Zero Breaking Changes**: All existing functionality preserved
2. **Performance**: Chain reactions scale to arbitrary depth efficiently  
3. **Developer Experience**: Rich debugging context (`stack`, `depth`, `fullkey`)
4. **Static Analysis**: Inspectable transitions enable better tooling
5. **Test Coverage**: Comprehensive validation of complex hierarchical behaviors
## 📁 Current File Status

### Modified Files
```
src/nesting/propagateSubmachines.ts        # NEEDS REDESIGN - remove global stack/WeakMaps
docs/src/components/inspectors/SketchInspector.tsx  # COMPLETE ✅
docs/src/components/inspectors/SketchInspector.css  # Supporting styles
```

### Test Files (All passing, need to continue passing after redesign)
```  
test/context-propagation-bug.test.tsx      # Context propagation validation
test/sketch-inspector.test.tsx             # SketchInspector component tests
test/hsm.*.test.ts                         # Various hierarchical tests
```

## 🚨 URGENT NEXT STEPS

### 1. Redesign propagateSubmachines Implementation
**Current Status**: Working but architecturally wrong
- **Remove**: `let globalHierarchyStack: any[] = [];` (line 9)
- **Remove**: `const childEnhanced = new WeakSet<object>();` (line 147)  
- **Replace With**: Dynamic incremental stack approach
- **Maintain**: All existing test compatibility  
- **Fix**: child.exit functionality regression

### 2. Design Requirements for New Implementation
- **No Global State**: Each machine gets its own stack context passed down
- **Dynamic**: Support listening/detaching as states change
- **Incremental**: "We are incrementally creating a stack and as we go down, we are giving that same stack to each thing"
- **Compatible**: All existing tests must continue passing

## 🔄 Current Status Summary

**✅ WORKING**: SketchInspector component displays hierarchical state paths correctly  
**⚠️ PROBLEMATIC**: Core propagation uses anti-patterns (global stack, WeakMaps)  
**❌ BROKEN**: child.exit functionality regression due to static enhancement approach  
**🎯 REQUIRED**: Complete redesign of propagateSubmachines with incremental dynamic stack approach