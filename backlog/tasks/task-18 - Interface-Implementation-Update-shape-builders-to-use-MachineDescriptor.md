---
id: task-18
title: >-
  Interface Implementation - Update shape builders to use MachineDescriptor
status: Pending
assignee:
  - >-
    Implement Phase 2 - update static analysis to use new interfaces
created_date: '2026-01-17 23:33'
updated_date: '2026-01-17 23:33'
labels: []
dependencies: [task-15, task-17]
ordinal: 3400
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update shape builders to work with MachineDescriptor interface instead of direct FactoryMachine coupling.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Update buildMachineStructure() to accept MachineDescriptor
- [ ] #2 Remove direct FactoryMachine dependencies from shape builders
- [ ] #3 Update createStateDefinition() to work with interface
- [ ] #4 Update getMachineHierarchy() to use interface
- [ ] #5 Ensure all shape functions work with abstract interface
- [ ] #6 Update visualizers to pass MachineDescriptor to shape functions
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Phase 2: Separation of Concerns - Static Analysis**

**Current Problem:**
- Shape builders directly import and depend on FactoryMachine
- `buildHierarchicalShape()` requires runtime machine instantiation
- Static analysis is coupled to specific machine implementation

**Target Solution:**
- Shape builders work with `MachineDescriptor` interface
- Static analysis works with machine definitions, not instances
- Clean separation between structure analysis and runtime

**Implementation Steps:**

1. **Update MachineDescriptor interface (if needed):**
   - Ensure it has all properties needed for static analysis
   - Add any missing properties discovered during implementation

2. **Update shape/builders.ts:**
   ```typescript
   // Before:
   export function buildMachineStructure(machine: FactoryMachine): MachineStructure {
   
   // After:
   export function buildMachineStructure(descriptor: MachineDescriptor): MachineStructure {
   ```

3. **Update shape/definition.ts:**
   ```typescript
   // Before:
   export function createStateDefinition(machine: FactoryMachine): StateDefinition {
   
   // After:
   export function createStateDefinition(descriptor: MachineDescriptor): StateDefinition {
   ```

4. **Update shape/hierarchy.ts:**
   ```typescript
   // Before:
   export function getMachineHierarchy(machine: FactoryMachine): Map<string, string> {
   
   // After:
   export function getMachineHierarchy(descriptor: MachineDescriptor): Map<string, string> {
   ```

5. **Create adapter/conversion functions:**
   ```typescript
   // Helper to convert FactoryMachine to MachineDescriptor
   export function createDescriptorFromMachine(machine: FactoryMachine): MachineDescriptor {
     // Extract static structure from runtime instance
   }
   ```

6. **Update visualizers:**
   - Visualizers need to convert machines to descriptors before calling shape functions
   - Update ReactFlowInspector, MermaidInspector, ReactInspector
   - Use adapter functions where needed

**Key Changes Required:**
- Remove `import { FactoryMachine } from '../hsm/factory-machine'` from shape files
- Update function signatures to use MachineDescriptor
- Update internal logic to work with descriptor properties
- Add conversion utilities for backward compatibility

**Validation:**
- Shape builders work with MachineDescriptor interface
- No direct FactoryMachine imports in shape/ directory
- Visualizers can still get machine structure (via conversion)
- TypeScript compilation passes
- Tests pass with new interface usage

**Benefits Achieved:**
- Shape analysis is decoupled from runtime
- Can work with any machine type implementing MachineDescriptor
- Easier testing with mock descriptors
- Clear separation of static vs runtime concerns
<!-- SECTION:NOTES:END -->

## Notes
- This is a critical step in the decoupling strategy
- Focus on interface compliance, not functional changes
- May need to enhance MachineDescriptor based on implementation needs
- Keep adapter functions for backward compatibility during transition
