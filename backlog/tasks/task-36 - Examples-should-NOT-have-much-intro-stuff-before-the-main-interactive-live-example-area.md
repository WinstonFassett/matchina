---
id: task-36
title: >-
  Examples should NOT have much intro stuff before the main interactive live
  example area
status: Done
assignee:
  - '@agent'
created_date: ''
updated_date: '2026-01-18 17:54'
labels:
  - slop
dependencies: []
priority: high
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Do not add slop content that pushes the example down the page. Just a brief enough intro ie 1-2 sentences to explain anything that is non obvious and of course they can read more BELOW the example on any given page.

**Problem:** Recent changes added excessive introductory content (Introduction + When to Use sections) that pushes the main interactive example far down the page. Users should see the working example immediately, with minimal context above it.

**Files to fix:**
- `docs/src/content/docs/examples/hsm-traffic-light.mdx`
- `docs/src/content/docs/examples/hsm-checkout.mdx` 
- `docs/src/content/docs/examples/hsm-combobox.mdx`
- `docs/src/content/docs/examples/rock-paper-scissors.mdx`
- `docs/src/content/docs/examples/traffic-light.mdx`
- `docs/src/content/docs/examples/traffic-light-extended.mdx`

**Principle:** Interactive example first, detailed explanation after.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Interactive example appears within first 15 lines of each example file
- [x] #2 Maximum 2-3 sentences of intro content before the example
- [x] #3 All "When to Use" and detailed explanations moved BELOW the interactive example
- [x] #4 Examples maintain their helpful context but prioritize immediate interaction
- [x] #5 Consistent structure across all example files: Brief intro → Interactive example → Detailed explanation
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fixed all 6 example files to prioritize interactive examples. Moved verbose Introduction sections and moved 'When to Use' content BELOW the interactive examples. Now each example has: 1-2 sentence intro → Interactive example → Detailed explanation. Interactive examples now appear within first 15 lines of each file.
<!-- SECTION:NOTES:END -->
