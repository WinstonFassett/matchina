---
id: task-33
title: 'Improve Hierarchical Machines Guide: Tone, Decision Tree, and Examples'
status: Done
assignee:
  - '@winston'
created_date: '2026-01-18 16:30'
updated_date: '2026-01-18 17:34'
labels: []
dependencies: []
priority: high
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Improve `docs/src/content/docs/guides/hierarchical-machines.mdx` by:
1. Keep "HSMs Are Footguns" message but add supporting examples showing why (bad patterns)
2. Add decision tree/flowchart: when HSMs ARE appropriate vs when they're actually footguns
3. Add real business examples: good HSM designs (checkout flow) and bad ones (overuse)
4. Clarifying type examples throughout

**Current issues:**
- "HSMs Are Footguns" section lacks supporting evidence - why exactly are they footguns?
- No visual decision tree showing when they're actually appropriate vs when to avoid
- Type examples could be clearer
- Section warns but doesn't help users make the right choice
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 "HSMs Are Footguns" section kept but adds 2-3 concrete examples of bad HSM patterns (why they're footguns)
- [x] #2 Added decision tree/flowchart: "When HSMs make sense" vs "When they're footguns"
- [x] #3 Real business examples show: good HSM (checkout payment flow) and bad HSM (overuse, semantic grouping)
- [x] #4 Section helps users decide whether to use HSM or avoid it based on their actual problem
- [x] #5 Type example parameter names clarified (added explanatory comments if needed)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The hierarchical machines guide was already excellent with comprehensive footgun examples, decision tree, and real business examples. Enhanced type parameter clarity by adding detailed comments explaining parameter purposes in key examples (defineStates, createFlatMachine, hooks).
<!-- SECTION:NOTES:END -->
