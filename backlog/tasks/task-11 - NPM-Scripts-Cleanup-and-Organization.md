---
id: task-11
title: NPM Scripts Cleanup and Organization
type: maintenance
priority: high
status: Done
created_date: '2026-01-17'
assignee: agent
---

## Problem
Package.json contains deprecated, broken, and redundant NPM scripts that need cleanup and organization.

## Acceptance Criteria
- [x] Remove all deprecated one-time scripts (dry-run, review, dates, rename)
- [x] Fix or remove broken smoke test script references that reference deleted tests
- [x] Add `screenshots:dark` script for new proper-screenshots.spec.ts solution
- [x] Verify screenshot utility scripts still work with current test structure
- [x] Organize remaining scripts logically with clear grouping
- [x] Update documentation for script usage where needed

## Implementation Plan

### Phase 1: Remove Deprecated Scripts
Delete these one-time utility scripts from package.json:
- `dry-run`
- `review`
- `dates`
- `dates-dry`
- `rename`
- `rename-dry`

**Note:** `publish` script kept - needed for npm publishing

### Phase 2: Fix Broken References
Fix or remove these smoke test scripts that reference deleted `checkout-smoke.spec.ts`:
- `test:e2e:smoke`
- `test:e2e:smoke:headed`
- `test:smoke:headed`

### Phase 3: Add Missing Script
Add script for new screenshot solution:
```json
"screenshots:dark": "playwright test --headed test/e2e/visual/proper-screenshots.spec.ts"
```

### Phase 4: Verify Utilities
Test these utility scripts still work:
- `screenshots`
- `screenshots:gallery`
- `screenshots:html`
- `test:dashboard`
- `score:visualizers`
- `coverage:balance`

## Dependencies
- None - pure package.json cleanup

## Notes
The new E2E screenshot solution (`proper-screenshots.spec.ts`) provides single-browser dark mode screenshots for all 19 working visualizer examples and needs an NPM script for easy access.
