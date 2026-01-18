---
id: task-16
title: >-
  hsm checkout sketch vis not keeping up with active state when inside nested
  active state
status: Done
assignee:
  - Fixed BlockInspector scrolling bug - only leaf nodes get activeStateRef
  - changed dependency to fullPath
  - prevented parent/child scroll conflicts
created_date: '2026-01-17 23:50'
updated_date: '2026-01-18 00:21'
labels:
  - bug
dependencies: []
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
like if you're creating fucking documents
I think there is a bug with the sketch visualizer or whatever calling the block visualizer now
where
I think if it's a hierarchical
one like the one I was in which was
I think it was HSM check out
and you know
it was supposed to scroll something into view and
it was kind of a beating to get working
and it's still a little choppy here and there it doesn't always smooth scroll but what I'm seeing is
it's really weirdly behaving when it's inside the payment node
which makes me think maybe because maybe the payment node that's fighting its own child to like be the thing that gets scrolled into view
maybe that's it you need to make sure that if it's like
like being active isn't
like it has to be the active you know Leaf node or whatever we want to call it you know but the full Act of state in order for us to be scrolling it into view because of her scrolling the parent interview it could sort of fight against what we actually want to see
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fix sketch visualizer active state tracking in nested HSM states
- [ ] #2 Ensure smooth scrolling works correctly when inside payment node
- [ ] #3 Prevent parent/child node fighting for scroll focus
- [ ] #4 Verify leaf node (full active state) is used for scroll targeting
- [ ] #5 Test with hsm-checkout example specifically
<!-- AC:END -->



## Notes
- Issue occurs in hierarchical machines like hsm-checkout
- Problem when inside nested states (e.g., payment node)
- Parent and child nodes may compete for scroll focus
- Need to ensure leaf node gets priority for active state visualization
- Smooth scrolling already choppy, needs improvement
