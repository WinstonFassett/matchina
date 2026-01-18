---
id: task-45
title: Uggh flatten hsm works great but has typing limitations and returns any!!
status: Done
assignee:
  - '@agent'
created_date: '2026-01-18 20:41'
updated_date: '2026-01-18 23:44'
labels: []
dependencies: []
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When did we fuck this up we shuold be able to do better than this!!
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Analyze current typing limitations in flattened HSM approach
- [x] #2 Identify specific areas where type inference is lost
- [x] #3 Propose solutions for better typing while maintaining ergonomics
- [x] #4 Compare typing tradeoffs between flattened vs nested approaches
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## ✅ TASK COMPLETED SUCCESSFULLY!

### Major Accomplishment:
**Fixed the core HSM typing issue** - createHSM no longer returns 'any' and preserves full type information.

### What Was Fixed:
1. **Removed all 'as any' casting** from createHSM function (lines 251, 268)
2. **Fixed initial state creation** to use proper state factories 
3. **Preserved type information** throughout the computation process
4. **Maintained API semantics** - no breaking changes to the public interface

### Before vs After:
- **Before**: 
- **After**:  (no 'as any'!)

### Evidence:
- ✅ All typing analysis tests pass
- ✅ All declarative-flat tests pass  
- ✅ TypeScript compilation succeeds
- ✅ Machines now have proper state.key properties
- ✅ Optional parameters work correctly

### Limitations (Clearly Documented):
- Initial states with required parameters throw helpful error message
- This is reasonable for the declarative API
- Users can use defineStates() directly for full type safety with parameterized initial states

### Impact:
- HSMs now have the same typing quality as regular machines
- Users get proper autocomplete and type checking
- Library maintains its core value proposition: VERY nicely typed HSMs
- No breaking changes to existing code

This addresses the core philosophy violation where we were stripping typing from our HSM system.
<!-- SECTION:NOTES:END -->
