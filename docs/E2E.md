# E2E Testing Guide

## Quick Start

```bash
# Run all e2e tests (functional + visual)
npm run test:e2e

# Run with UI for debugging
npm run test:e2e:ui

# Debug specific test
npm run test:e2e:debug
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
- `npm run test:e2e:ui` - Run with Playwright UI
- `npm run test:e2e:debug` - Run with step debugger

### Legacy Scripts (Deprecated)
- `test:e2e:visual` - **Broken** (files deleted)
- `test:e2e:mermaid` - **Broken** (files deleted)  
- `test:e2e:reactflow` - **Broken** (files deleted)
- `test:e2e:forcegraph` - **Broken** (files deleted)
- `test:e2e:file` - Run single file

## Current Test Coverage

### Functional Tests (14 files)
- `combobox-comparison.spec.ts` - Flat vs nested behavior
- `reactflow-toggle.spec.ts` - ReactFlow node rendering
- `forcegraph-basic.spec.ts` - ForceGraph canvas rendering
- `edge-interactivity-*.spec.ts` - Edge interactions
- `hsm-traffic-light-*.spec.ts` - Traffic light examples

### Visual Tests (11 files)
- `all-visualizers-complete.spec.ts` - Matrix testing (16 tests)
- Other visual tests for specific scenarios

## Running Specific Tests

### By Category
```bash
# Functional only
npx playwright test test/e2e/functional/

# Visual only  
npx playwright test test/e2e/visual/

# Single test file
npx playwright test test/e2e/functional/combobox-comparison.spec.ts
```

### By Example
```bash
# Combobox tests
npx playwright test --grep "combobox"

# Traffic light tests
npx playwright test --grep "traffic-light"

# ReactFlow tests
npx playwright test --grep "reactflow"
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

## Writing Tests

### Test Structure
```typescript
import { test, expect } from '@playwright/test';

test('descriptive test name', async ({ page }) => {
  await page.goto('/matchina/examples/example-name');
  
  // Wait for component
  await page.waitForSelector('.machine-visualizer');
  
  // Test functionality
  await expect(page.locator('button')).toBeVisible();
});
```

### Best Practices
1. **Use relative URLs** - `/matchina/examples/...`
2. **Wait for selectors** - Not arbitrary timeouts
3. **Use data-testid** - Not CSS classes
4. **Test outcomes** - Not implementation details
5. **Keep tests fast** - 300ms timeout

## Debugging

### UI Mode
```bash
npm run test:e2e:ui
```
- Interactive test runner
- Click to run specific tests
- See live browser

### Debug Mode  
```bash
npm run test:e2e:debug
```
- Step through test execution
- Inspect page state
- Console debugging

### Headed Mode
```bash
npx playwright test --headed
```
- See browser actions
- Access DevTools
- Screenshot debugging

## CI Integration

### GitHub Actions
```yaml
- name: Run E2E Tests
  run: npm run test:e2e
```

### Local Testing
```bash
# Start dev server first
npm run dev:docs

# Then run tests
npm run test:e2e
```

## Troubleshooting

### Tests Not Found
- Check dev server is running
- Verify baseURL in playwright.config.ts
- Check testMatch patterns

### Timeouts
- Increase timeout in playwright.config.ts
- Check for slow network requests
- Verify element selectors

### Flaky Tests
- Use proper waits instead of timeouts
- Add retry logic
- Check for race conditions
