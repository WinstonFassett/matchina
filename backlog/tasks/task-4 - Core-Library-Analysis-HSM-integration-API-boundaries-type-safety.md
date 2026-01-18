---
id: task-4
title: 'Core Library Analysis - HSM integration, API boundaries, type safety'
status: Done
assignee: []
created_date: '2026-01-17 18:40'
updated_date: '2026-01-17 19:14'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Analyze core library HSM integration approach, API boundaries, and type safety. Provide recommendations for shapes integration and HSM addon design.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Review current HSM implementation in core
- [x] #2 Analyze shapes integration approach
- [x] #3 Evaluate API boundary definitions
- [x] #4 Assess type safety guarantees
- [x] #5 Recommend core vs addon separation
- [x] #6 Evaluate extensibility patterns
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Analysis complete. See backlog/docs/doc-2 (HSM Branch Analysis). Key findings: HSM stable, type safety strong with createFlatMachine, recommend ./hsm subpath for smaller bundles.
<!-- SECTION:NOTES:END -->

## Notes
- Focus on keeping core simple and nano-sized
- Shapes should accommodate hierarchy cleanly
- HSM complexity should be isolated as addon
- Type inference is critical value proposition
- No code changes required, analysis and recommendations only
