---
id: task-47
title: Investigate shape system inconsistencies across visualizers
status: To Do
assignee: []
created_date: '2026-01-18 23:04'
updated_date: '2026-01-18 23:08'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The shape system is supposed to be the single source of truth for all visualizers, but there are inconsistencies causing confusion:

1. ReactFlow inspector has duplicate logic (treeToReactFlow) instead of using shape system properly
2. Different visualizers handle shapes differently 
3. Agents are confused about whether to use buildShapeTree, shapeToReactFlow, or direct shape access
4. Non-HSM machines should have shapes generated consistently across all visualizers

Need to audit all visualizers and ensure they use the shape system consistently.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Audit all visualizers (ReactFlow, Sketch, Mermaid) for shape handling
- [ ] #2 Identify duplicate/contradictory shape logic
- [ ] #3 Create unified approach for shape conversion
- [ ] #4 Document the single correct way to handle shapes
- [ ] #5 Fix inconsistencies to use one unified approach
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BUG IDENTIFIED - SIMPLE FIX:

createMachine() does NOT call enhanceWithShape()!

All FactoryMachines should have shapes automatically. The bug is in /src/factory-machine.ts - createMachine() doesn't enhance the machine with shape support.

FIX NEEDED:
- Import enhanceWithShape and createStaticShapeStore in factory-machine.ts
- Call enhanceWithShape(machine, createStaticShapeStore(machine)) before returning
- This will give ALL machines shape support automatically

No need for complex universal accessors or tree conversions. Just fix the bug where createMachine doesn't add shapes!

This explains why visualizers are confused - some machines have shapes (HSMs via nestedHsmRoot/createMachineFromFlat) but regular createMachine calls don't.
<!-- SECTION:NOTES:END -->
