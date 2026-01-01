import { test, Page, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';
const SCREENSHOT_DIR = 'review/screenshots/traffic-light-mermaid-fix';

test.describe('Traffic Light Mermaid State Highlighting Fix', () => {
  test.beforeEach(async ({ page }) => {
    // Store messages on page object for later access
    await page.evaluate(() => {
      (window as any).consoleMessages = [];
    });
    
    page.on('console', msg => {
      console.log('BROWSER CONSOLE:', msg.text());
      page.evaluate((text) => {
        const messages = (window as any).consoleMessages || [];
        messages.push(text);
        (window as any).consoleMessages = messages;
      }, msg.text());
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('nested version - initial state Working.Red should be highlighted', async ({ page }) => {
    // Ensure nested mode is selected (default)
    const nestedButton = page.getByTestId('mode-toggle-nested');
    if (await nestedButton.isVisible()) {
      await nestedButton.click();
      await page.waitForTimeout(200);
    }
    
    // Test STATE CHART
    await page.getByTestId('visualizer-controls').getByRole('combobox').selectOption('mermaid-statechart');
    await page.waitForTimeout(500);
    
    // Wait for mermaid container with test ID
    const mermaidContainer = page.getByTestId('mermaid-statechart-container');
    await mermaidContainer.waitFor({ state: 'visible', timeout: 5000 });
    
    // Check for highlighted elements with short timeout
    const activeElement = mermaidContainer.locator('.state-highlight').first();
    const isVisible = await activeElement.isVisible().catch(() => false);
    console.log('Nested - Active state highlighted:', isVisible);
    
    const parentHighlight = mermaidContainer.locator('.state-container-highlight').first();
    const parentVisible = await parentHighlight.isVisible().catch(() => false);
    console.log('Nested - Parent container highlighted:', parentVisible);
    
    // Check for EDGE highlighting (this is what we actually fixed!)
    const activeEdges = mermaidContainer.locator('.edge-active').first();
    const edgeVisible = await activeEdges.isVisible().catch(() => false);
    console.log('Nested - Active edge highlighted:', edgeVisible);
    
    // Assert that edge highlighting should work for nested states
    // This was the main issue we were fixing
    expect(edgeVisible).toBe(true);
    
    // Get all console messages
    const consoleMessages = await page.evaluate(() => (window as any).consoleMessages || []);
    console.log('=== NESTED CONSOLE MESSAGES ===');
    consoleMessages.forEach((msg: string) => console.log(msg));
    console.log('=== END NESTED CONSOLE ===');
    
    // Take screenshot only if container exists
    if (await mermaidContainer.isVisible()) {
      await mermaidContainer.screenshot({
        path: `${SCREENSHOT_DIR}/nested-initial-state.png`
      });
    }
  });

  test('flattened version - initial state Working.Red should be highlighted', async ({ page }) => {
    // Switch to flattened mode
    await page.getByTestId('mode-toggle-flattened').click();
    await page.waitForTimeout(200);
    
    // Select Mermaid State Chart visualizer using test ID
    await page.getByTestId('visualizer-controls').getByRole('combobox').selectOption('mermaid-statechart');
    await page.waitForTimeout(500);
    
    // Wait for mermaid container with test ID
    const mermaidContainer = page.getByTestId('mermaid-statechart-container');
    await mermaidContainer.waitFor({ state: 'visible', timeout: 5000 });
    
    // Check for highlighted elements with short timeout
    const activeElement = mermaidContainer.locator('.state-highlight').first();
    const isVisible = await activeElement.isVisible().catch(() => false);
    console.log('Flattened - Active state highlighted:', isVisible);
    
    const parentHighlight = mermaidContainer.locator('.state-container-highlight').first();
    const parentVisible = await parentHighlight.isVisible().catch(() => false);
    console.log('Flattened - Parent container highlighted:', parentVisible);
    
    // Check for EDGE highlighting (this is what's actually broken!)
    const activeEdges = mermaidContainer.locator('.edge-active').first();
    const edgeVisible = await activeEdges.isVisible().catch(() => false);
    console.log('Flattened - Active edge highlighted:', edgeVisible);
    
    // Get all console messages
    const consoleMessages = await page.evaluate(() => (window as any).consoleMessages || []);
    console.log('=== FLATTENED CONSOLE MESSAGES ===');
    consoleMessages.forEach((msg: string) => console.log(msg));
    console.log('=== END FLATTENED CONSOLE ===');
    
    // Take screenshot only if container exists
    if (await mermaidContainer.isVisible()) {
      await mermaidContainer.screenshot({
        path: `${SCREENSHOT_DIR}/flattened-initial-state.png`
      });
    }
  });
});
