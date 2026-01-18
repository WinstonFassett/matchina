---
id: task-22
title: >-
  Cleanup - Remove old coupling code and update exports
status: Pending
assignee:
  - >-
    Complete Phase 3 - remove old code and finalize module structure
created_date: '2026-01-17 23:37'
updated_date: '2026-01-17 23:37'
labels: []
dependencies: [task-21]
ordinal: 3800
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Remove old coupling code, clean up module exports, and finalize the new architecture.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Remove old shape-builders.ts and inspect.ts files
- [ ] #2 Clean up src/inspect/index.ts re-exports
- [ ] #3 Update all module index.ts files
- [ ] #4 Remove any remaining direct FactoryMachine dependencies
- [ ] #5 Update package exports and documentation
- [ ] #6 Verify clean module boundaries and no circular dependencies
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Phase 3: Migration Path - Final Cleanup**

**Files to Remove:**
- `src/hsm/shape-builders.ts` - functionality moved to shape/
- `src/hsm/inspect.ts` - functionality moved to inspect/
- `src/hsm/shape-types.ts` - moved to shape/definition.ts

**Files to Clean Up:**
- `src/inspect/index.ts` - remove shape re-exports, keep only runtime
- `src/hsm/index.ts` - update exports for new structure
- `src/index.ts` - main package exports

**Cleanup Steps:**

1. **Remove old files:**
   ```bash
   # After confirming no remaining imports
   rm src/hsm/shape-builders.ts
   rm src/hsm/inspect.ts  
   rm src/hsm/shape-types.ts
   ```

2. **Clean up src/inspect/index.ts:**
   ```typescript
   // Before (mixed responsibilities):
   export { getActiveChain, getStack } from './inspect';
   export { buildHierarchicalShape, describeHSM } from './shape-builders';
   export type { ShapeTypes } from './shape-types';
   
   // After (runtime only):
   export { getActiveStatePath, getStateStack, getMachineInstance } from './state';
   export { getActiveStatePath, getStateStack, getMachineInstance } from './stack';
   export { getActiveStatePath, getStateStack, getMachineInstance } from './instance';
   ```

3. **Update src/shape/index.ts (new):**
   ```typescript
   export { buildMachineStructure } from './builders';
   export { createStateDefinition } from './definition';
   export { getMachineHierarchy } from './hierarchy';
   export type { MachineDescriptor, StateDefinition, TransitionDefinition } from './interfaces';
   ```

4. **Update src/hsm/index.ts:**
   ```typescript
   export { FactoryMachine } from './factory-machine';
   export type { MachineDescriptor, MachineInstance } from './factory-machine';
   // Remove old shape/inspect exports
   ```

5. **Update main src/index.ts:**
   ```typescript
   // Core HSM functionality
   export { FactoryMachine, defineStates, createMachine } from './hsm';
   
   // Static analysis
   export { buildMachineStructure, createStateDefinition } from './shape';
   export type { MachineDescriptor } from './shape';
   
   // Runtime inspection
   export { getActiveStatePath, getStateStack } from './inspect';
   export type { MachineInstance } from './inspect';
   ```

6. **Update package.json exports:**
   ```json
   {
     "exports": {
       ".": "./src/index.ts",
       "./shape": "./src/shape/index.ts",
       "./inspect": "./src/inspect/index.ts",
       "./hsm": "./src/hsm/index.ts"
     }
   }
   ```

7. **Search for remaining old imports:**
   ```bash
   # Find any remaining references to old modules
   grep -r "shape-builders" src/
   grep -r "buildHierarchicalShape" src/
   grep -r "getActiveChain" src/
   grep -r "describeHSM" src/
   ```

8. **Update documentation:**
   - Update README.md with new module structure
   - Update API documentation
   - Update examples to use new imports
   - Update TypeScript types documentation

9. **Final validation:**
   - No remaining imports of old modules
   - Clean module boundaries (shape vs inspect vs hsm)
   - No circular dependencies
   - All TypeScript compilation passes
   - All tests pass
   - Package builds successfully

**Module Structure Final:**
```
src/
├── shape/           # Static analysis only
│   ├── index.ts     # Clean exports
│   ├── builders.ts  # buildMachineStructure()
│   ├── hierarchy.ts # getMachineHierarchy()
│   └── definition.ts # createStateDefinition()
├── inspect/         # Runtime only  
│   ├── index.ts     # Clean exports
│   ├── state.ts     # getActiveStatePath()
│   ├── stack.ts     # getStateStack()
│   └── instance.ts  # getMachineInstance()
├── hsm/             # Machine creation/management
│   ├── index.ts     # Core HSM exports
│   └── factory-machine.ts # Implements both interfaces
└── index.ts         # Main package exports
```

**Benefits Achieved:**
- Clean separation of concerns
- No module confusion or overlap
- Clear interfaces for static vs runtime
- Easy to understand and maintain
- Foundation for future enhancements
<!-- SECTION:NOTES:END -->

## Notes
- This is the final cleanup step - be thorough
- Verify no remaining dependencies before deleting files
- Update all documentation and examples
- Run full test suite to ensure no regressions
- This completes the 3-phase architectural refactoring
