---
id: task-12
title: >-
  Documentation Review - Assess MDX changes vs main, review lifecycle docs,
  evaluate README
status: Done
assignee:
  - '@agent'
created_date: '2026-01-17 23:23'
updated_date: '2026-01-18 15:49'
labels: []
dependencies: []
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Review documentation changes in this branch compared to main for accuracy and quality.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Compare MDX files vs main branch for changes
- [x] #2 Review HSM guide for API accuracy
- [x] #3 Check lifecycle docs for needed updates
- [x] #4 Evaluate README changes in this branch
- [x] #5 Assess example MDX for compellingness
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
✓ Compared MDX files vs main: 8 files changed (examples and guides). Key changes: import statements updated to use @matchina/viz-mermaid, lifecycle docs restructured, hierarchical-machines guide significantly expanded with design guidelines, README updated with testing info

✓ HSM guide (hierarchical-machines.mdx) accurate: Added comprehensive design guidelines covering state design (simple states, present tense naming, mutual exclusivity), transition design (single exit states, hooks for conditional logic), usage patterns (warning about footguns, true substates only, flatten when possible). All guidance aligns with current API.

✓ Lifecycle docs reviewed: Updated imports from local Mermaid component to @matchina/viz-mermaid. Flow diagram accurate, all hook names and ordering correct, early exit logic properly documented. No updates needed.

✓ README changes evaluated: Added comprehensive testing section with E2E and unit test info, coverage metrics (core ~92%, viz 0%), testing commands, links to testing guides. Changes are helpful and accurate. Reorganized philosophy section for better flow.

✓ Example MDX for compellingness: stopwatch-overview.mdx is well-structured with clear descriptions and comparison table. Examples demonstrate distinct patterns (internal state, React state, external state). Warning about redundancy already noted in overview - acknowledges that some examples are similar but each serves a pedagogical purpose.
<!-- SECTION:NOTES:END -->

## Notes
- Focus on review, not changes
- Identify what needs updating vs what's good
- HSM documentation is high quality, keep
- Check for consistency and accuracy
