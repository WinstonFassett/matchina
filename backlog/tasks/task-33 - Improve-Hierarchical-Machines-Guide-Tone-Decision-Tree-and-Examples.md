---
id: task-33
title: 'Improve Hierarchical Machines Guide: Tone, Decision Tree, and Examples'
status: To Do
priority: high
assignee: []
created_date: '2026-01-18 16:30'
updated_date: '2026-01-18 16:32'
labels: []
dependencies: []
ordinal: 3000
---

## Description

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

## Acceptance Criteria

- [ ] "HSMs Are Footguns" section kept but adds 2-3 concrete examples of bad HSM patterns (why they're footguns)
- [ ] Added decision tree/flowchart: "When HSMs make sense" vs "When they're footguns"
- [ ] Real business examples show: good HSM (checkout payment flow) and bad HSM (overuse, semantic grouping)
- [ ] Section helps users decide whether to use HSM or avoid it based on their actual problem
- [ ] Type example parameter names clarified (added explanatory comments if needed)

## Implementation Notes

Decision tree should address:
- Is state temporarily delegating control to a subprocess? (→ HSM)
- Are states just describing what is true? (→ flat machine)
- Does the pattern need independent actor instances? (→ nested machines, not HSM flattening)
