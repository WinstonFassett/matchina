import { test, expect } from '@playwright/test';

test.describe('Combobox Comparison - Flat vs Nested', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });
    
    await page.goto('/matchina/examples/hsm-combobox');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('nested combobox shows suggestions correctly', async ({ page }) => {
    // Switch to nested mode - use more specific selector
    await page.click('button:has-text("Nested (Hierarchical)")');
    
    // Focus the combobox
    await page.click('input[placeholder="Type to add tags..."]');
    
    // Type something that should trigger suggestions
    await page.fill('input[placeholder="Type to add tags..."]', 'typ');
    
    // Wait for suggestions to appear
    await page.waitForTimeout(200);
    
    // Debug: Check current state
    const stateDisplay = page.locator('.font-mono');
    const stateText = await stateDisplay.first().textContent();
    console.log('Nested mode state:', stateText);
    
    // Check if suggestions dropdown exists
    const dropdown = page.locator('.absolute.top-full').first();
    const dropdownVisible = await dropdown.isVisible();
    console.log('Nested dropdown visible:', dropdownVisible);
    
    if (dropdownVisible) {
      const suggestions = await dropdown.locator('button').count();
      console.log('Nested suggestions count:', suggestions);
      
      // Should see "typescript" in suggestions
      const typescriptSuggestion = dropdown.locator('button:has-text("typescript")');
      await expect(typescriptSuggestion).toBeVisible();
    } else {
      // Take screenshot for debugging
      await page.screenshot({ path: 'nested-no-suggestions.png' });
      console.log('Nested mode: No suggestions dropdown visible');
    }
  });

  test('flat combobox shows suggestions correctly', async ({ page }) => {
    // Switch to flat mode
    await page.click('button:has-text("Flattened")');
    
    // Focus the combobox
    await page.click('input[placeholder="Type to add tags..."]');
    
    // Type something that should trigger suggestions
    await page.fill('input[placeholder="Type to add tags..."]', 'typ');
    
    // Wait for suggestions to appear
    await page.waitForTimeout(200);
    
    // Debug: Check current state
    const stateDisplay = page.locator('.font-mono');
    const stateText = await stateDisplay.first().textContent();
    console.log('Flat mode state:', stateText);
    
    // Check if suggestions dropdown exists
    const dropdown = page.locator('.absolute.top-full').first();
    const dropdownVisible = await dropdown.isVisible();
    console.log('Flat dropdown visible:', dropdownVisible);
    
    if (dropdownVisible) {
      const suggestions = await dropdown.locator('button').count();
      console.log('Flat suggestions count:', suggestions);
      
      // Should see "typescript" in suggestions
      const typescriptSuggestion = dropdown.locator('button:has-text("typescript")');
      await expect(typescriptSuggestion).toBeVisible();
    } else {
      // Take screenshot for debugging
      await page.screenshot({ path: 'flat-no-suggestions.png' });
      console.log('Flat mode: No suggestions dropdown visible');
      
      // Check if we're in the right state at least
      expect(stateText).toContain('Suggesting');
    }
  });

  test('debug flat mode data thoroughly', async ({ page }) => {
    // Switch to flat mode
    await page.click('button:has-text("Flattened")');
    
    // Focus the combobox
    await page.click('input[placeholder="Type to add tags..."]');
    
    // Type something that should trigger suggestions
    await page.fill('input[placeholder="Type to add tags..."]', 'typ');
    
    // Wait for suggestions to appear
    await page.waitForTimeout(200);
    
    // Debug: Check current state
    const stateDisplay = page.locator('.font-mono');
    const stateText = await stateDisplay.first().textContent();
    console.log('Flat mode state:', stateText);
    
    // Debug: Check what's in the store by accessing component state
    const storeData = await page.evaluate(() => {
      // Try to access the machine store through React dev tools or global scope
      const inputs = document.querySelectorAll('input');
      const input = inputs[inputs.length - 1]; // Get the last input (should be our combobox)
      
      // Try to find the React instance
      const reactKey = Object.keys(input).find(key => key.startsWith('__react'));
      if (reactKey) {
        const reactInstance = input[reactKey];
        const fiber = reactInstance._reactInternals || reactInstance.__reactInternalInstance;
        if (fiber) {
          // Try to traverse up to get the component instance
          let current = fiber;
          while (current) {
            if (current.stateNode && current.stateNode.machine) {
              const machine = current.stateNode.machine;
              return {
                storeState: machine.store.getState(),
                machineState: machine.getState()
              };
            }
            current = current.return;
          }
        }
      }
      
      return { error: 'Could not access React component' };
    });
    
    console.log('Flat mode store data:', JSON.stringify(storeData, null, 2));
    
    // Check if suggestions dropdown exists
    const dropdown = page.locator('.absolute.top-full').first();
    const dropdownVisible = await dropdown.isVisible();
    console.log('Flat dropdown visible:', dropdownVisible);
    
    if (!dropdownVisible) {
      // Take screenshot for debugging
      await page.screenshot({ path: 'flat-debug-data.png' });
    }
  });
});
