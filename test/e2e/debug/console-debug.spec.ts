import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test.describe('Console Debug', () => {
  test('capture console output from nested mode', async ({ page }) => {
    // Capture all console output
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
      console.log('BROWSER CONSOLE:', msg.text());
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Switch to nested mode
    const nestedButton = page.getByRole('button', { name: 'Nested' });
    if (await nestedButton.isVisible()) {
      await nestedButton.click();
    }
    await page.waitForTimeout(2000);

    // Look for DEBUG messages and diagram generation
    const debugLogs = logs.filter(log => 
      log.includes('DEBUG:') || 
      log.includes('Generated Mermaid diagram:') ||
      log.includes('shape.states') ||
      log.includes('shape.hierarchy') ||
      log.includes('mode:') ||
      log.includes('defaultViz:') ||
      log.includes('stateDiagram') ||
      log.includes('graph LR')
    );

    console.log('=== DEBUG LOGS FOUND ===');
    debugLogs.forEach(log => console.log(log));
    console.log('=== END DEBUG LOGS ===');

    // Take screenshot
    await page.screenshot({ 
      path: 'review/screenshots/console-debug-nested.png',
      fullPage: true 
    });

    console.log('✅ Console debug captured');
  });
});
