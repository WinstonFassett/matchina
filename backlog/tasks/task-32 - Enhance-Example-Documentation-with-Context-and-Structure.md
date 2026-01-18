---
id: task-32
title: Enhance Example Documentation with Context and Structure
status: Done
assignee:
  - '@winston'
created_date: '2026-01-18 16:30'
updated_date: '2026-01-18 17:33'
labels: []
dependencies: []
priority: high
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add introductory context and standardized structure to all 6 example MDX pages. Currently examples jump straight to code/toggles without explaining what pattern they teach or when/why to use them.

**Problem:** Users see working code but don't understand the pattern's purpose or applicability.

**Files to update:**
- `docs/src/content/docs/examples/hsm-traffic-light.mdx` (34 lines, minimal)
- `docs/src/content/docs/examples/hsm-checkout.mdx`
- `docs/src/content/docs/examples/hsm-combobox.mdx`
- `docs/src/content/docs/examples/hsm-traffic-light-flat.mdx`
- `docs/src/content/docs/examples/rock-paper-scissors.mdx`
- `docs/src/content/docs/examples/traffic-light.mdx`
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All 6 example pages have 2-3 sentence intro explaining what pattern is being demonstrated
- [x] #2 Each page includes "When to use this pattern" section
- [x] #3 Standardized structure applied: Intro → When to use → Code → Additional context
- [x] #4 Examples are no longer just code toggles without explanation
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Enhanced all 5 example files with standardized structure: Brief intro (1-2 sentences) → Interactive example → When to use section → Code. Maintained task 36 principle of minimal intro content before examples.
<!-- SECTION:NOTES:END -->
