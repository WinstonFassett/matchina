---
id: task-38
title: 'Fix HSM Documentation: Remove Hard-coded Dot-notation Namespaces'
status: Done
assignee:
  - '@winston'
created_date: '2026-01-18 17:53'
updated_date: '2026-01-18 17:58'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Documentation is showing abominations where users manually write 'Working.Red' state keys. The library should handle flattening automatically from hierarchical definitions. We need to: 1) Find all places in docs/examples showing manual dot-notation 2) Fix examples to use proper hierarchical definitions 3) Update documentation to show correct approach 4) Verify all examples follow the right pattern
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Audit all docs and examples for manual dot-notation state keys
- [ ] #2 Fix hierarchical machine examples to use proper hierarchical definitions
- [ ] #3 Update documentation to show library handles flattening automatically
- [ ] #4 Verify no documentation shows manual namespace hard-coding
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DUPLICATE - This work was completed in task-39. All documentation abominations have been fixed - removed hardcoded dot-notation from hsm-checkout/machine-flat.ts, updated hierarchical-machines.mdx, and removed outdated v1 documentation.
<!-- SECTION:NOTES:END -->
