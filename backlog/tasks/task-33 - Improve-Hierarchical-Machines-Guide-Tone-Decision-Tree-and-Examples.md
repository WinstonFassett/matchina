---
id: task-33
title: 'Improve Hierarchical Machines Guide: Tone, Decision Tree, and Examples'
status: To Do
assignee: []
created_date: '2026-01-18 16:30'
updated_date: '2026-01-18 16:32'
labels: []
dependencies: []
ordinal: 2000
---

## Description

Improve `docs/src/content/docs/guides/hierarchical-machines.mdx` by:
1. Softening negative tone ("HSMs Are Footguns" → "HSM Considerations")
2. Adding decision tree/flowchart: when to use HSM vs flat machines
3. Adding 2-3 real business examples of good/bad HSM usage
4. Clarifying type examples throughout

**Current issues:**
- Lines 73-76: "HSMs Are Footguns" language discourages legitimate usage
- No visual decision tree for "use HSM if..." vs "use flat if..."
- Type examples could be clearer
- Lacks real business context for design principles

## Acceptance Criteria

- [ ] "HSMs Are Footguns" section header changed to "HSM Considerations"
- [ ] Section includes pros/cons of HSM usage vs flat machines
- [ ] Added Mermaid flowchart or decision table: "When to use HSM vs flat machines"
- [ ] Added 2-3 real business examples (payment flows, checkout, form submission) showing good HSM design
- [ ] Type example parameter names clarified (added explanatory comments if needed)

## Implementation Notes

Decision tree should address:
- Is state temporarily delegating control to a subprocess? (→ HSM)
- Are states just describing what is true? (→ flat machine)
- Does the pattern need independent actor instances? (→ nested machines, not HSM flattening)
