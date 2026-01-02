import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test.describe('HSM Traffic Light Nested Mermaid Statechart', () => {
  test('verify statechart renders without errors', async ({ page }) => {
    // Capture console for debugging
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Mermaid Error') || msg.text().includes('Parse error')) {
        errors.push(msg.text());
        console.log('ERROR:', msg.text());
      }
      if (msg.text().includes('stateDiagram-v2')) {
        console.log('STATECHART:', msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(500);

    // Ensure we're on NESTED mode (default)
    const nestedButton = page.getByRole('button', { name: 'Nested' });
    if (await nestedButton.isVisible()) {
      await nestedButton.click();
    }
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ 
      path: 'review/screenshots/nested-statechart-final.png',
      fullPage: true 
    });

    // Check for Mermaid errors in the page
    const mermaidError = page.locator('text=Mermaid Error');
    const hasError = await mermaidError.count() > 0;
    
    if (hasError) {
      const errorText = await mermaidError.first().textContent();
      console.log('MERMAID ERROR ON PAGE:', errorText);
    }

    // Verify no errors were logged
    console.log('Errors found:', errors.length);
    errors.forEach(e => console.log('  -', e));

    // Check for Working compound state
    const workingState = page.locator('[id*="Working"], .cluster, .statediagram-cluster');
    const workingCount = await workingState.count();
    console.log('Working state elements found:', workingCount);

    console.log('✅ Nested statechart test complete');
    
    // Fail if there were errors
    expect(errors.length).toBe(0);
    expect(hasError).toBe(false);
  });
});
