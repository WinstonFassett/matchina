---
id: doc-5
title: NPM Scripts Analysis and Cleanup
type: maintenance
created_date: '2026-01-17'
---

## Problem Analysis
The package.json contains a mix of useful, outdated, and redundant NPM scripts. Some scripts reference deleted tests, others are one-time utilities, and some may be broken.

## Script Categories

### ✅ **KEEP - Core Development Scripts**
```json
"build": "npm run build:lib",
"build:lib": "unbuild && size-limit", 
"test": "vitest run --coverage",
"test:types": "tsc --noEmit --skipLibCheck",
"test:e2e": "playwright test",
"lint": "eslint --cache --ext .ts,.js,.mjs,.cjs . && prettier -c src test docs",
"lint:fix": "eslint --cache --ext .ts,.js,.mjs,.cjs . --fix && prettier -c src test docs -w"
```

### ❌ **DELETE - One-time/Deprecated Scripts**
```json
"dry-run": "npm run build && npm test && npx changelogen --dry-run && npm publish --dry-run",
"publish": "npm publish --access public",
"review": "vitepress dev",
"dates": "node scripts/update-frontmatter-dates.js review",
"dates-dry": "node scripts/update-frontmatter-dates.js --dry-run review", 
"rename": "node scripts/rename-files.js review",
"rename-dry": "node scripts/rename-files.js --dry-run review"
```

### ⚠️ **REVIEW - Potentially Broken Scripts**
```json
"test:e2e:smoke": "playwright test test/e2e/functional/*smoke*.spec.ts",
"test:e2e:smoke:headed": "playwright test --headed test/e2e/functional/*smoke*.spec.ts", 
"test:smoke:headed": "playwright test --headed test/e2e/functional/*smoke*.spec.ts"
```
**Issue:** These reference deleted smoke tests (`checkout-smoke.spec.ts` was deleted)

### 🤔 **REVIEW - Screenshot/Utility Scripts**
```json
"screenshots": "node scripts/screenshot-viewer.js",
"screenshots:gallery": "node scripts/screenshot-gallery.js", 
"screenshots:html": "node scripts/html-report.js",
"screenshots:html:open": "node scripts/html-report.js && open docs/playwright-report/index.html",
"test:dashboard": "node scripts/test-dashboard.js && open docs/test-dashboard.html",
"score:visualizers": "node scripts/score-visualizers.cjs && open docs/visualizer-scoring-report.md",
"coverage:balance": "node scripts/coverage-balance-report.js"
```

### 🔄 **ADD - Missing Script for New Screenshots**
```json
"screenshots:dark": "playwright test --headed test/e2e/visual/proper-screenshots.spec.ts"
```

## Cleanup Plan

### Phase 1: Remove Deprecated Scripts
- Delete one-time publish/release scripts
- Remove document management scripts (dates, rename)
- Remove duplicate smoke test scripts

### Phase 2: Fix Broken References  
- Update smoke test paths or remove if obsolete
- Verify screenshot utility scripts still work
- Test dashboard and scoring scripts

### Phase 3: Add Missing Scripts
- Add script for new dark mode screenshots
- Add script for visualizer matrix testing if needed

### Phase 4: Organize and Document
- Group scripts by category (build, test, utility)
- Add comments describing purpose
- Update documentation

## Acceptance Criteria
- [ ] Remove all deprecated one-time scripts
- [ ] Fix or remove broken smoke test references  
- [ ] Add `screenshots:dark` script for new solution
- [ ] Verify screenshot utility scripts work
- [ ] Organize remaining scripts logically
- [ ] Update documentation for script usage

## Dependencies
- None - pure package.json cleanup

## Notes
The current E2E screenshot solution (`proper-screenshots.spec.ts`) needs an NPM script for easy access. Screenshot utilities may need updates to work with new test structure.
