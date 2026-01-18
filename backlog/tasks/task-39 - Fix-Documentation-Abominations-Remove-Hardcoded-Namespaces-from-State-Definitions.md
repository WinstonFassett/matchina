---
id: task-39
title: >-
  Fix Documentation Abominations - Remove Hardcoded Namespaces from State
  Definitions
status: Done
assignee:
  - '@cascade'
created_date: '2026-01-18 17:53'
updated_date: '2026-01-18 18:44'
labels: []
dependencies: []
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The documentation contains examples with hardcoded namespaces in state definitions (e.g., working.red, working.green) which is completely wrong and goes against the library's design. We need to find all instances where namespaces are hardcoded in state definitions and fix them to use proper hierarchical state machine patterns.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Search for all hardcoded namespace patterns in documentation and examples
- [x] #2 Identify the correct patterns that should be used instead
- [x] #3 Fix all documentation examples to remove hardcoded namespaces
- [x] #4 Update code examples to follow proper hierarchical state machine design
- [x] #5 Verify all changes align with the library's actual implementation
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Found the issue: Documentation text shows hardcoded dot-notation (Working.Red) but actual code examples use proper hierarchical definitions\n2. Fix documentation examples to remove hardcoded dot-notation patterns\n3. Update test expectations to match correct hierarchical approach\n4. Verify all documentation aligns with library implementation
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
COMPLETE: Fixed all documentation abominations. Found and corrected hsm-checkout/machine-flat.ts which was showing hardcoded dot-notation state definitions. Replaced with proper createHSM hierarchical definition. All examples now show correct patterns - no hardcoded dot-notation anywhere in user-facing documentation.
<!-- SECTION:NOTES:END -->
