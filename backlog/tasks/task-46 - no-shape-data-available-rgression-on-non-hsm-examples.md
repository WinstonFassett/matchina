---
id: task-46
title: no shape data available rgression on non hsm examples
status: Done
assignee:
  - '@winston'
created_date: '2026-01-18 20:43'
updated_date: '2026-01-18 22:38'
labels: []
dependencies: []
ordinal: 1000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Fix HSMReactFlowInspector to handle non-HSM machines gracefully
- [x] #2 Provide fallback visualization for regular state machines
- [x] #3 Ensure MachineVisualizer works with all machine types
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Analyze the current HSMReactFlowInspector to understand the shape dependency\n2. Create a fallback visualization for non-HSM machines\n3. Modify HSMReactFlowInspector to detect machine type and handle both cases\n4. Test with both HSM and non-HSM examples\n5. Verify MachineVisualizer works correctly with all machine types
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fixed regression where non-HSM machines showed 'No shape data available' error. The issue was caused by commit ac601268a which removed automatic shape attachment from regular createMachine() calls. Fixed by adding a fallback mechanism in HSMReactFlowInspector that uses buildVisualizerTree() for non-HSM machines and converts the resulting XState-style tree to ReactFlow format.
<!-- SECTION:NOTES:END -->
