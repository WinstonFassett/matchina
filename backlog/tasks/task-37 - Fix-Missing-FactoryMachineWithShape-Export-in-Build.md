---
id: task-37
title: Fix Missing FactoryMachineWithShape Export in Build
status: Done
assignee:
  - '@cascade'
created_date: '2026-01-18 17:34'
updated_date: '2026-01-18 17:54'
labels:
  - bug
  - build
  - shape
dependencies: []
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The FactoryMachineWithShape interface is exported in TypeScript declarations but missing from the compiled JavaScript build, causing runtime import errors in browser/Astro environment.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Investigate why TypeScript interfaces are not properly exported in JavaScript build
- [x] #2 Determine if this is a build configuration issue or interface handling problem
- [x] #3 Implement fix to ensure FactoryMachineWithShape is available at runtime
- [x] #4 Test fix with hsm-traffic-light example to ensure error is resolved
- [x] #5 Verify no other similar export issues exist in shape module
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Analyze build configuration to understand interface export handling
2. Check if FactoryMachineWithShape should be a class instead of interface for runtime use
3. Examine other similar exports in shape module to identify pattern
4. Test different approaches: export as class, export as type + runtime value, or fix build config
5. Implement chosen solution
6. Rebuild and verify hsm-traffic-light example works
7. Run full test suite to ensure no regressions
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ISSUE DIAGNOSIS COMPLETE:
- Error: FactoryMachineWithShape interface missing from compiled JavaScript 
- TypeScript declarations (dist/shape/augmented.d.ts) correctly export interface
- JavaScript build (dist/shape/augmented.js) missing the export - only has functions
- dist/shape/index.js references missing export causing runtime import failure
- Introduced in commit ac601268a (Jan 17, 2026) during circular dependency fix
- Problem: Interfaces are type-only and may not survive TypeScript compilation to JavaScript
- Impact: hsm-traffic-light example fails in browser/Astro environment

ROOT CAUSE: Build process issue where TypeScript interfaces are not properly handled as runtime exports, or FactoryMachineWithShape should be a class/runtime construct rather than interface.
<!-- SECTION:NOTES:END -->
