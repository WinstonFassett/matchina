# E2E Testing Guide

## 🚨 CRITICAL: Example Coverage Gap

**Current Coverage: 7% (2/27 examples)**

We have a **massive coverage gap** - only testing 2 examples out of 27 available examples.

## Coverage Strategy

### Level 1: Smoke Tests (Every PR) - **Priority: HIGH**
- ✅ Every example in dark mode
- ✅ Default visualizer auto-selection  
- ✅ Basic load verification

### Level 2: Basic Tests (Weekly) - **Priority: MEDIUM**
- ✅ State transitions for critical examples
- ✅ Light mode verification
- ✅ Core functionality

### Level 3: Full Tests (Release) - **Priority: LOW**
- ✅ All visualizers for critical examples
- ✅ All themes
- ✅ Deep interaction testing

## Current Coverage

### ✅ Tested Examples (2/27)
- `hsm-combobox` - Matrix testing (16 tests)
- `hsm-traffic-light` - Basic functionality

### ❌ Missing Examples (25/27)
**Critical Missing:**
- `checkout` - Complex HSM with payment flow
- `auth-flow` - Authentication state machine  
- `stopwatch` - Classic example with effects
- `rock-paper-scissors` - Game logic example

**Advanced Missing:**
- `hsm-checkout` - Hierarchical checkout
- `async-calculator` - Async state management
- `promise-machine-fetcher` - Promise integration

**Simple Missing:**
- `toggle`, `counter`, `traffic-light` - Basic examples
- All `fetcher-*` examples - Data fetching
- All `stopwatch-*` variations - Different patterns

## Automated Coverage Report

Generate current coverage analysis:
```bash
node scripts/e2e-coverage-report.js
```

View detailed report:
```bash
cat review/E2E_COVERAGE_REPORT.md
```

## Test Priority Matrix

| Priority | Examples | Visualizers | Themes | Depth | Frequency |
|----------|----------|------------|--------|-------|-----------|
| **1** | All 27 | Auto | Dark | Smoke | Every PR |
| **2** | Critical 6 | Auto | Light | Basic | Weekly |  
| **3** | Critical 6 | All 4 | Both | Full | Release |
| **4** | All 27 | All 4 | Both | Deep | Major |

**Critical 6 Examples:** checkout, auth-flow, stopwatch, rock-paper-scissors, hsm-combobox, hsm-traffic-light

## Quick Start

```bash
# Run all E2E tests (functional + visual)
npm run test:e2e

# SMOKE TESTS - Visual verification of all examples
npm run test:e2e:smoke

# Smoke tests with browser (see what renders)
npm run test:e2e:smoke:headed

# Debug with browser console
npm run test:e2e:ui
npm run test:e2e:debug

# Generate coverage report
node scripts/e2e-coverage-report.js
```

## Test Structure

```
test/e2e/
├── debug/          # Agent observation tools (excluded from CI)
├── functional/     # Real e2e functionality tests
└── visual/         # Screenshot & visual regression tests
```

## Available Scripts

### Core Commands
- `npm run test:e2e` - Run all e2e tests (parallel)
- `npm run test:e2e:smoke` - **🚨 SMOKE TESTS** - Visual verification of all examples
- `npm run test:e2e:smoke:headed` - Smoke tests with browser (see what renders)
- `npm run test:e2e:ui` - Run with Playwright UI
- `npm run test:e2e:debug` - Run with step debugger
- `npm run test:e2e:file` - Run single file

### Coverage Analysis
- `node scripts/e2e-coverage-report.js` - Generate coverage report

## Running Specific Tests

### By Coverage Level
```bash
# Smoke tests (all examples, dark mode)
npx playwright test --grep "dark mode"

# Basic tests (critical examples)
npx playwright test --grep "checkout|auth-flow|stopwatch"

# Full tests (all visualizers)
npx playwright test --grep "all-visualizers"
```

### By Example
```bash
# Specific example
npx playwright test --grep "checkout"

# HSM examples
npx playwright test --grep "hsm-"

# Simple examples  
npx playwright test --grep "toggle|counter|traffic-light"
```

## Writing Smoke Tests (Level 1)

### Template for New Examples
```typescript
import { test, expect } from '@playwright/test';

test.describe('ExampleName Smoke Tests', () => {
  test('loads in light mode', async ({ page }) => {
    await page.goto('/matchina/examples/example-name');
    await page.waitForSelector('.machine-visualizer');
    
    // Basic smoke check
    await expect(page.locator('.machine-visualizer')).toBeVisible();
  });

  test('loads in dark mode', async ({ page }) => {
    await page.goto('/matchina/examples/example-name');
    await page.waitForSelector('.machine-visualizer');
    
    // Switch to dark mode
    await page.click('button[aria-label="Toggle dark mode"]');
    await page.waitForTimeout(200);
    
    // Dark mode smoke check
    await expect(page.locator('.machine-visualizer')).toBeVisible();
  });
});
```

## Configuration

### Parallel Execution
- **Local**: 4 workers
- **CI**: 2 workers
- **Timeout**: 300ms (fast fail)

### Browser
- **Chromium** only (for CI consistency)
- **Headless** by default
- **Viewport**: 1280×900

## CI Integration

### GitHub Actions
```yaml
- name: Generate Coverage Report
  run: node scripts/e2e-coverage-report.js

- name: Run E2E Tests
  run: npm run test:e2e
```

### Smoke Tests in CI
```yaml
- name: Smoke Tests (All Examples)
  run: npx playwright test --grep "dark mode"
```

## Troubleshooting

### Coverage Gaps
1. Run coverage report: `node scripts/e2e-coverage-report.js`
2. Identify missing examples
3. Add smoke tests for critical examples first

### Tests Not Found
- Check dev server is running
- Verify example path in URL
- Check testMatch patterns

### Timeouts
- Increase timeout for complex examples
- Check for slow network requests
- Verify element selectors
