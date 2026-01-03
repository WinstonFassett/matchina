# E2E Testing Strategies & Playwright 2025 Capabilities

## Current Testing Strategies in Use

### ✅ **Visual Regression Testing**
```typescript
// Screenshot comparison (currently used)
await expect(page.locator('.machine-visualizer')).toHaveScreenshot('name.png');
```
**Status:** ✅ **IMPLEMENTED** in `all-visualizers-complete.spec.ts`
**Use:** Matrix testing (16 tests)
**Issues:** No baselines generated yet

### ✅ **Functional Assertions**
```typescript
// DOM visibility checks
await expect(canvas).toBeVisible();
await expect(typescriptSuggestion).toBeVisible();

// Text content verification
const stateText = await stateDisplay.textContent();
console.log('Nested mode state:', stateText);
```
**Status:** ✅ **HEAVILY USED** (293 occurrences)
**Use:** Core functionality verification

### ✅ **Console Log Capture**
```typescript
// Debugging console capture
page.on('console', msg => {
  console.log('Browser console:', msg.text());
});
```
**Status:** ✅ **USED** for debugging
**Use:** Agent observation tools

### ✅ **DOM Structure Inspection**
```typescript
// CSS specificity analysis (revolutionary technique!)
const rules = [];
for (const sheet of document.styleSheets) {
  for (const rule of sheet.cssRules) {
    if (path.matches(rule.selectorText || '')) {
      rules.push({
        selector: rule.selectorText,
        specificity: rule.selectorText.split(' ').length
      });
    }
  }
}
```
**Status:** ✅ **IMPLEMENTED** (CSS specificity breakthrough)
**Use:** Mermaid styling debugging

## 🚀 **Available Playwright 2025 Strategies (Not Used Yet)**

### **Snapshot Testing**
```typescript
// DOM snapshots
await expect(page.locator('.machine-visualizer')).toMatchSnapshot();

// Text snapshots
await expect(page.locator('.state-display')).toMatchSnapshot('state-text');

// Component snapshots (if using React)
await expect(page.locator('react-component')).toMatchSnapshot();
```
**Benefits:** Detects DOM structure changes, text content changes
**Use Case:** Verify state display, component structure

### **Visual Regression (Advanced)**
```typescript
// With tolerance for cross-platform differences
await expect(page.locator('.machine-visualizer')).toHaveScreenshot('name.png', {
  threshold: 0.2, // Allow 20% pixel difference
  animations: 'disabled' // Disable animations
});

// Full page comparison
await expect(page).toHaveScreenshot('full-page.png', { fullPage: true });
```
**Benefits:** Cross-platform compatible, configurable tolerance
**Use Case:** Visual design verification

### **Network Mocking**
```typescript
// Mock API calls
await page.route('**/api/**', route => {
  return route.fulfill({
    status: 200,
    body: JSON.stringify({ data: 'mocked' })
  });
});
```
**Benefits:** Eliminates external dependencies
**Use Case:** Test examples without network calls

### **API Response Testing**
```typescript
// Wait for API responses
const response = await page.waitForResponse('**/api/**');
expect(response.status()).toBe(200);
```
**Benefits:** Tests actual API integration
**Use Case:** Examples with data fetching

### **Accessibility Testing**
```typescript
// Accessibility audit
await page.waitForSelector('.machine-visualizer');
const accessibilityScan = await page.accessibility.snapshot();
expect(accessibilityScan.violations).toEqual([]);
```
**Benefits:** Ensures accessibility compliance
**Use Case:** All examples should be accessible

### **Performance Testing**
```typescript
// Performance metrics
const metrics = await page.evaluate(() => performance.getEntriesByType('navigation')[0]);
expect(metrics.loadEventEnd - metrics.fetchStart).toBeLessThan(2000);
```
**Benefits:** Performance regression detection
**Use Case:** Ensure fast loading

### **Device Testing**
```typescript
// Mobile viewport
await page.setViewportSize({ width: 375, height: 667 });
await expect(page.locator('.machine-visualizer')).toBeVisible();

// Dark mode verification
await page.emulateMedia({ colorScheme: 'dark' });
```
**Benefits:** Responsive design verification
**Use Case:** Mobile compatibility

## 📊 **Recommended Testing Strategy**

### **Level 1: Smoke Tests (Every PR)**
```typescript
test.describe('ExampleName Smoke Tests', () => {
  test('loads and renders', async ({ page }) => {
    await page.goto('/matchina/examples/example-name');
    await expect(page.locator('.machine-visualizer')).toBeVisible();
    await expect(page.locator('.machine-visualizer')).toMatchSnapshot('smoke');
  });

  test('dark mode compatibility', async ({ page }) => {
    await page.goto('/matchina/examples/example-name');
    await page.click('button[aria-label="Toggle dark mode"]');
    await expect(page.locator('.machine-visualizer')).toBeVisible();
    await expect(page.locator('.machine-visualizer')).toMatchSnapshot('dark-mode');
  });
});
```

### **Level 2: Functional Tests (Weekly)**
```typescript
test.describe('ExampleName Functional Tests', () => {
  test('state transitions work', async ({ page }) => {
    await page.goto('/matchina/examples/example-name');
    
    // Initial state
    await expect(page.locator('.state-display')).toContainText('Initial');
    
    // Trigger transition
    await page.click('button[data-action="next"]');
    await expect(page.locator('.state-display')).toContainText('Next');
    
    // Verify visual consistency
    await expect(page.locator('.machine-visualizer')).toHaveScreenshot('next-state.png');
  });

  test('accessibility compliance', async ({ page }) => {
    await page.goto('/matchina/examples/example-name');
    const accessibilityScan = await page.accessibility.snapshot();
    expect(accessibilityScan.violations).toEqual([]);
  });
});
```

### **Level 3: Visual Regression (Release)**
```typescript
test.describe('ExampleName Visual Tests', () => {
  ['light', 'dark'].forEach(theme => {
    ['sketch', 'mermaid', 'reactflow', 'forcegraph'].forEach(visualizer => {
      test(`${theme} - ${visualizer}`, async ({ page }) => {
        await page.goto('/matchina/examples/example-name');
        
        // Set theme
        if (theme === 'dark') {
          await page.click('button[aria-label="Toggle dark mode"]');
        }
        
        // Select visualizer
        await page.locator('[data-testid="visualizer-picker"]').selectOption(visualizer);
        
        // Visual regression
        await expect(page.locator('.machine-visualizer')).toHaveScreenshot(
          `${example}-${theme}-${visualizer}.png`,
          { threshold: 0.2 }
        );
      });
    });
  });
});
```

## 🎯 **Smart Organization Strategy**

### **Test Categories**
```
test/e2e/
├── smoke/           # Level 1: Load + Dark mode (27 tests)
├── functional/       # Level 2: State transitions (15 tests)  
├── visual/          # Level 3: Visual regression (48 tests)
└── integration/     # Level 4: API/Performance (optional)
```

### **Parallel Execution Strategy**
```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'smoke',
      testMatch: 'test/e2e/smoke/**/*.spec.ts',
      workers: 4,
      timeout: 5000 // Longer for smoke tests
    },
    {
      name: 'functional', 
      testMatch: 'test/e2e/functional/**/*.spec.ts',
      workers: 2,
      timeout: 10000
    },
    {
      name: 'visual',
      testMatch: 'test/e2e/visual/**/*.spec.ts',
      workers: 1, // Sequential for visual tests
      timeout: 30000
    }
  ]
});
```

### **Selective CI Execution**
```yaml
# GitHub Actions
- name: Smoke Tests (All Examples)
  run: npx playwright test --project=smoke

- name: Functional Tests (Critical Examples)
  run: npx playwright test --project=functional --grep "checkout|auth-flow|stopwatch"

- name: Visual Tests (Release Only)
  run: npx playwright test --project=visual
  if: github.event_name == 'release'
```

## 🔧 **Implementation Roadmap**

### **Phase 1: Baseline (Current Sprint)**
1. ✅ Generate smoke tests for all 27 examples
2. ✅ Set up visual regression baselines
3. ✅ Implement snapshot testing for state displays

### **Phase 2: Enhancement (Next Sprint)**
1. Add accessibility testing to all examples
2. Implement performance thresholds
3. Add mobile viewport testing

### **Phase 3: Advanced (Future)**
1. Network mocking for data-fetching examples
2. API response testing for async examples
3. Cross-browser testing matrix

## 📈 **Coverage Impact**

### **Current: 25 tests**
- Functional: 14 tests
- Visual: 11 tests (matrix testing)

### **Target: 90 tests**
- Smoke: 27 tests (all examples × 2 themes)
- Functional: 15 tests (critical examples × state transitions)
- Visual: 48 tests (6 examples × 4 visualizers × 2 themes)

### **Time Impact**
- **Smoke:** ~30 seconds (parallel)
- **Functional:** ~2 minutes (parallel)
- **Visual:** ~5 minutes (sequential)
- **Total:** ~7.5 minutes vs current ~2 minutes

## 🎯 **Recommendations**

### **Immediate Actions**
1. **Implement smoke tests** for all 27 examples
2. **Generate visual baselines** for current working state
3. **Add snapshot testing** for state displays

### **Smart Testing Philosophy**
- **Smoke tests** catch 80% of issues with 20% effort
- **Visual regression** catches design issues
- **Functional tests** catch logic issues
- **Integration tests** catch API/performance issues

### **Tooling Recommendations**
- **Playwright UI** for debugging
- **Visual regression** for design verification  
- **Snapshots** for DOM stability
- **Accessibility testing** for compliance
- **Performance metrics** for speed

This strategy balances **comprehensive coverage** with **efficient execution** and **smart prioritization**.
