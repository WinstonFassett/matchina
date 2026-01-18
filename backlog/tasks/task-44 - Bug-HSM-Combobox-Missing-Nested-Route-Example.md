---
id: task-44
title: 'Bug: HSM Combobox Missing Nested Route/Example'
status: Done
assignee:
  - '@cascade'
created_date: '2026-01-18 18:54'
updated_date: '2026-01-18 18:56'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The HSM combobox example is not using the nested HSM approach (nestedHsmRoot + submachine) like it should be. User expects to see nested HSM patterns in more places beyond just checkout and traffic light examples. The combobox should demonstrate both flattened (createHSM) and nested (nestedHsmRoot) approaches to show the full HSM capability.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Investigate current HSM combobox implementation - which approach is it using?
- [x] #2 Check if nested HSM route exists for combobox or if it's missing
- [x] #3 Verify what other examples should demonstrate nested HSM approach
- [x] #4 Create nested HSM combobox example if missing
- [x] #5 Ensure both flattened and nested approaches are documented for combobox
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Investigation complete: Current combobox uses createHSM (hierarchical states) not nestedHsmRoot + submachine (true nested machines). Only checkout and traffic-light examples demonstrate true nested approach.

Nested HSM route exists for combobox but uses wrong approach. All complex examples (combobox, checkout, traffic-light) should demonstrate nested HSM approach for consistency.

Created true nested HSM combobox example using nestedHsmRoot + submachine pattern. Updated documentation to show all three approaches: flattened, hierarchical, and true nested. Example now demonstrates the full HSM capability.
<!-- SECTION:NOTES:END -->
