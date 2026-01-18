---
id: task-15
title: >-
  Example Sprawl Analysis - Plan consolidation of multiple stopwatches and
  redundant examples
status: Done
assignee:
  - '@agent'
created_date: '2026-01-17 23:24'
updated_date: '2026-01-18 15:49'
labels: []
dependencies: []
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Analyze example sprawl and plan consolidation strategy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Inventory all stopwatch variations and redundancies
- [x] #2 Identify which examples serve unique purposes
- [x] #3 Plan consolidation strategy for multiple stopwatches
- [x] #4 Assess which examples are compelling vs noise
- [x] #5 Create consolidation plan (no execution)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
✓ Inventory stopwatch variations: 9 stopwatch examples total (basic + 8 variations). Three main approaches: internal machine state (3 examples), React state (2 examples), external state (2 examples). Plus lifecycle and transition hook variations.

✓ Identified unique purposes: 1) Basic foundational, 2) Data+hooks clean API, 3) Transition functions type safety, 4) React hooks native integration, 5) State effects specialized hooks, 6) External state pattern, 7) Lifecycle declarative API, 8) Transition hooks alternative, 9) Overview index. Overlap exists but each teaches different pattern.

✓ Consolidation strategy: Group by core pattern (3 core: internal state, React state, external state) with variants for effect handling. Reduce from 9 to 5-6 examples: Core pattern index, one per approach, showcase transition functions and lifecycle API as specialized variants within their approach.

✓ Compelling vs noise assessment: Overview.mdx already does this - identifies 4 'recommended' examples as core value set. Current setup is pedagogically sound: each example teaches specific pattern. Noise is minimal; redundancy is intentional for teaching purposes.

✓ Consolidation plan created at backlog/docs/stopwatch-consolidation-plan.md. Recommendation: Do NOT consolidate yet - current structure serves pedagogical goals well. If consolidation needed later, keep 4 core examples (Data+Hooks, State Effects, Lifecycle, Transition Functions) and consider deprecating Basic/React State+Effects variants.
<!-- SECTION:NOTES:END -->

## Notes
- Planning only, no execution
- Focus on reducing noise, keeping value
- Consider developer experience and learning progression
- Some examples may be good for different patterns
