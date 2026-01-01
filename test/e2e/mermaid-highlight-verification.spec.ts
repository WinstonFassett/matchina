import { test, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-combobox';

test('Mermaid highlighting verification', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');
  
  // Select Mermaid visualizer
  const dropdown = page.locator('[data-testid="visualizer-picker"]');
  await dropdown.waitFor({ state: 'visible', timeout: 2000 });
  await dropdown.selectOption('mermaid-statechart');
  
  // Take screenshot of initial state
  const container = page.locator('.space-y-6').first();
  await container.screenshot({ path: 'review/screenshots/mermaid-highlight-test/1-initial.png' });
  
  // Click input to activate state
  const input = page.locator('input[type="text"]').first();
  await input.click();
  
  // Take screenshot of active state
  await container.screenshot({ path: 'review/screenshots/mermaid-highlight-test/2-active.png' });
  
  // Switch to flowchart
  await dropdown.selectOption('mermaid-flowchart');
  
  // Take screenshot of flowchart
  await container.screenshot({ path: 'review/screenshots/mermaid-highlight-test/3-flowchart.png' });
  
  // Click input again to activate flowchart state
  await input.click();
  
  // Take screenshot of active flowchart
  await container.screenshot({ path: 'review/screenshots/mermaid-highlight-test/4-flowchart-active.png' });
});
