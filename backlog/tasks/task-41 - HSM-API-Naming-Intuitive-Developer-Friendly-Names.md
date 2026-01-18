---
id: task-41
title: HSM API Naming - Intuitive Developer-Friendly Names
status: Done
assignee:
  - '@cascade'
created_date: '2026-01-18 18:07'
updated_date: '2026-01-18 18:44'
labels: []
dependencies: []
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The current HSM API names are confusing and don't read like English. Need to rename createHSM, createFlatMachine, and makeHierarchical to be more intuitive for developers. The names should clearly communicate what each function does and when to use it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Analyze current naming problems - createHSM, createFlatMachine, makeHierarchical
- [ ] #2 Brainstorm intuitive names that read like English and clearly communicate purpose
- [ ] #3 Consider the two approaches: flattened vs nested/propagation
- [ ] #4 Propose new naming scheme that makes sense to developers
- [ ] #5 Document the naming rationale and recommendations
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
# API Naming Analysis - Current Problems

## The Two Functions Have Different Signatures:

## Naming Challenge:
- **createHSM** → needs name that says "create from definition"
- **makeHierarchical** → needs name that says "enhance existing machine"

## Better Ideas:

### For definition-based API (95% of cases):

### For machine-enhancement API (escape hatch):

## My Current Preference:

**Why:**
- "create" for building from scratch
- "make" for enhancing existing thing
- "Nested" clearly distinguishes from flattened approach
- Both follow verb-noun pattern
<!-- SECTION:NOTES:END -->
