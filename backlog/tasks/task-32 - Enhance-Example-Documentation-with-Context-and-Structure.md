---
id: task-32
title: Enhance Example Documentation with Context and Structure
status: To Do
priority: high
assignee: []
created_date: '2026-01-18 16:30'
updated_date: '2026-01-18 16:32'
labels: []
dependencies: []
ordinal: 2000
---

## Description

Add introductory context and standardized structure to all 6 example MDX pages. Currently examples jump straight to code/toggles without explaining what pattern they teach or when/why to use them.

**Problem:** Users see working code but don't understand the pattern's purpose or applicability.

**Files to update:**
- `docs/src/content/docs/examples/hsm-traffic-light.mdx` (34 lines, minimal)
- `docs/src/content/docs/examples/hsm-checkout.mdx`
- `docs/src/content/docs/examples/hsm-combobox.mdx`
- `docs/src/content/docs/examples/hsm-traffic-light-flat.mdx`
- `docs/src/content/docs/examples/rock-paper-scissors.mdx`
- `docs/src/content/docs/examples/traffic-light.mdx`

## Acceptance Criteria

- [ ] All 6 example pages have 2-3 sentence intro explaining what pattern is being demonstrated
- [ ] Each page includes "When to use this pattern" section
- [ ] Standardized structure applied: Intro → When to use → Code → Additional context
- [ ] Examples are no longer just code toggles without explanation

## Implementation Notes

Standard structure template:
1. **Intro (2-3 sentences):** What is this pattern? Why does it matter?
2. **When to use:** Business/technical scenarios where this applies
3. **Code example:** (toggle/import existing code)
4. **Key points:** (comparison table if applicable, e.g., flat vs nested)
