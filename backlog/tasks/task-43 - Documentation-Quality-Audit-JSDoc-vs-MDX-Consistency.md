---
id: task-43
title: Documentation Quality Audit - JSDoc vs MDX Consistency
status: Done
assignee:
  - '@cascade'
created_date: '2026-01-18 18:49'
updated_date: '2026-01-18 18:51'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Comprehensive audit of documentation quality and consistency across inline JSDoc, README docs, MDX docs, and examples. Identify gaps, outdated API references, and ensure all documentation is aligned with current createHSM/nestedHsmRoot APIs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Audit inline JSDoc for outdated API references and experimental tags
- [ ] #2 Check MDX docs for consistency with current API names
- [ ] #3 Verify examples use correct createHSM/nestedHsmRoot APIs
- [ ] #4 Identify documentation gaps between JSDoc and user-facing docs
- [ ] #5 Ensure README, guides, and examples are all aligned
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
# Documentation Quality Audit - Focused Issues

## CONFIRMED: Keep experimental warning in MDX docs
HSMs are still experimental for production use, so MDX warning stays.

## REAL ISSUES TO FIX:

### 1. Outdated @experimental Tag in Code (CRITICAL)
**File:** src/hsm/nested/propagate-submachines.ts line 11

**Problems:**
- References non-existent `flattenMachineDefinition`
- Should say `createHSM`
- Nested approach is stable escape hatch, not experimental

### 2. JSDoc Creates API Confusion (HIGH)
**File:** src/hsm/flattened/declarative-flat.ts
- Line 10: "## Comparison with createFlatMachine" - should be "## Implementation Note"
- Line 197: "For type-safe code, use createFlatMachine()" - creates confusion with internal API
- Line 266: "Users requiring type safety should use createFlatMachine()" - same issue

### 3. Inconsistent Terminology (MEDIUM)
**File:** src/hsm/index.ts
- Comments still use inconsistent terminology despite recent updates

## Priority Fixes:
1. Fix @experimental tag and reference in propagate-submachines.ts
2. Update type safety comments to not reference internal createFlatMachine
3. Fix "Comparison with createFlatMachine" sections
4. Ensure terminology consistency throughout JSDoc

## Keep As-Is:
- MDX experimental warning (production use is still experimental)
- Examples (they're already using correct APIs)
- README (already aligned)
<!-- SECTION:NOTES:END -->
