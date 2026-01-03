# Playwright Dark Theme Testing Strategy

## 🚨 CRITICAL: Dark Theme Implementation

### The Problem
- **Manual theme toggles** are unreliable and slow
- **Inconsistent theme state** across tests
- **Selector complexity** for theme toggle buttons

### The Solution: `prefers-color-scheme`
```typescript
// BEFORE (unreliable)
await page.click(SELECTORS.themeToggle);
await page.waitForTimeout(200);

// AFTER (reliable)
await page.emulateMedia({ colorScheme: 'dark' });
await page.waitForTimeout(200);
```

## Implementation Details

### Theme Emulation Commands
```typescript
// Light mode
await page.emulateMedia({ colorScheme: 'light' });

// Dark mode  
await page.emulateMedia({ colorScheme: 'dark' });
```

### Why This Works
- **Direct browser API** - No DOM interaction needed
- **Instant change** - No animation delays
- **Consistent state** - Guaranteed dark/light mode
- **No selector dependency** - Works regardless of UI

## Test Pattern

### Standard Smoke Test
```typescript
export async function runSmokeTest(page: Page, exampleName: keyof typeof EXAMPLES) {
  const config = await gotoExample(page, exampleName);
  
  // Light mode
  await page.emulateMedia({ colorScheme: 'light' });
  await page.waitForTimeout(200);
  await expect(page.locator(SELECTORS.fullInteractiveArea).first()).toBeVisible();
  await expect(page.locator(SELECTORS.fullInteractiveArea).first())).toHaveScreenshot(`${exampleName}-light-initial.png`);
  
  // Dark mode
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForTimeout(200);
  await expect(page.locator(SELECTORS.fullInteractiveArea).first()).toBeVisible();
  await expect(page.locator(SELECTORS.fullInteractiveArea).first())).toHaveScreenshot(`${exampleName}-dark-initial.png`);
  
  return config;
}
```

## Coverage Verification

### Current Status
- **13 examples** with light mode screenshots
- **13 examples** with dark mode screenshots
- **26 total screenshots** covering both themes

### Verification Commands
```bash
# Check dark screenshots exist
ls test/e2e/visual/comprehensive-smoke.spec.ts-snapshots/ | grep "dark-initial" | wc -l

# Check light screenshots exist  
ls test/e2e/visual/comprehensive-smoke.spec.ts-snapshots/ | grep "light-initial" | wc -l

# View specific dark screenshot
npm run screenshots open <example-name>-dark-initial
```

## Theme Testing Best Practices

### 1. Always Use `emulateMedia`
```typescript
// ✅ CORRECT - Direct browser control
await page.emulateMedia({ colorScheme: 'dark' });

// ❌ WRONG - Unreliable DOM interaction
await page.click('[data-testid="theme-toggle"]');
```

### 2. Add Wait for Theme Application
```typescript
await page.emulateMedia({ colorScheme: 'dark' });
await page.waitForTimeout(200); // Allow CSS to apply
```

### 3. Test Both Themes Consistently
```typescript
// Always test light THEN dark (or vice versa)
// Never test only one theme
```

### 4. Use Same Selectors for Both Themes
```typescript
// Theme shouldn't affect element selection
const selector = SELECTORS.fullInteractiveArea;
await expect(page.locator(selector)).toBeVisible();
```

## Troubleshooting

### Dark Mode Not Applying
1. **Check CSS**: Ensure styles use `@media (prefers-color-scheme: dark)`
2. **Add wait**: Increase timeout from 200ms to 500ms
3. **Verify selector**: Make sure element exists in both themes

### Screenshots Not Different
1. **Check theme support**: Example might not have dark mode styles
2. **Verify CSS variables**: Dark theme might use same colors
3. **Manual verification**: Open screenshots to confirm difference

### Inconsistent Theme State
1. **Reset between tests**: Always set theme explicitly
2. **Avoid DOM toggles**: Don't click theme buttons
3. **Use emulateMedia**: Only reliable method

## File Locations

### Test Implementation
- `test/e2e/utils/test-helpers.ts` - Theme emulation logic
- `test/e2e/visual/comprehensive-smoke.spec.ts` - Coverage tests

### Screenshots
- `test/e2e/visual/comprehensive-smoke.spec.ts-snapshots/` - All theme screenshots
- Pattern: `<example>-<theme>-initial-chromium-darwin.png`

### Verification Tools
- `npm run screenshots` - View all screenshots
- `npm run screenshots open <name>` - Open specific screenshot

## Migration Guide

### Converting Old Theme Tests
```typescript
// OLD (remove this)
const themeToggle = page.locator(SELECTORS.themeToggle);
if (await themeToggle.isVisible()) {
  await setTheme(page, 'dark');
}

// NEW (use this)
await page.emulateMedia({ colorScheme: 'dark' });
await page.waitForTimeout(200);
```

### Updating Selectors
```typescript
// OLD (theme-dependent)
const themeToggle = 'button[aria-label="Toggle dark mode"]';

// NEW (theme-independent)  
const fullInteractiveArea = '.machine-visualizer';
```

## Summary

**Dark theme testing is SOLVED** using `page.emulateMedia({ colorScheme: 'dark' })`. 

- ✅ **Reliable** - Direct browser API
- ✅ **Fast** - No DOM interaction
- ✅ **Consistent** - Same behavior every time
- ✅ **Complete** - All 13 working examples have dark screenshots

**This is the definitive approach for dark theme testing in Playwright.**
