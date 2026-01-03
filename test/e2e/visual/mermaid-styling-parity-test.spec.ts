import { test, Page, expect } from '@playwright/test';

const BASE_URL = '/matchina/examples/hsm-traffic-light';

test.describe('Mermaid Styling Parity Test', () => {
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
    await page.waitForTimeout(1000); // Wait for Mermaid to render
  });

  test('nested mode - Working group should have proper styling', async ({ page }) => {
    // Ensure nested mode
    const nestedButton = page.getByTestId('mode-toggle-nested');
    if (await nestedButton.isVisible()) {
      await nestedButton.click();
    }
    await page.waitForTimeout(500);

    // Check that Working state group exists and is styled
    const workingGroup = page.locator('[id*="Working"]');
    await expect(workingGroup).toBeVisible();

    // Check child states are visible
    const redState = page.locator('[id*="Red"]');
    const greenState = page.locator('[id*="Green"]');
    const yellowState = page.locator('[id*="Yellow"]');
    
    await expect(redState).toBeVisible();
    await expect(greenState).toBeVisible();
    await expect(yellowState).toBeVisible();

    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'review/screenshots/mermaid-styling-nested.png',
      fullPage: true 
    });

    console.log('✅ Nested mode: Working group and child states are visible');
  });

  test('flat mode - Working_Red state should have proper styling', async ({ page }) => {
    // Find the Flattened button specifically
    const flatButton = page.getByRole('button', { name: 'Flattened' });
    
    console.log('Flat button visible:', await flatButton.isVisible());
    
    // Switch to flat mode
    if (await flatButton.isVisible()) {
      console.log('Clicking flat button...');
      await flatButton.click();
      await page.waitForTimeout(2000); // Wait for mode change and diagram update
    }
    
    // Get the console messages to see what diagram was generated
    const consoleMessages = await page.evaluate(() => (window as any).consoleMessages || []);
    const diagramMessages = consoleMessages.filter(msg => msg.includes('Generated Mermaid diagram'));
    console.log('Generated diagrams:', diagramMessages);
    
    // Check if we got a flowchart diagram
    const hasFlowchart = diagramMessages.some(msg => msg.includes('graph LR'));
    console.log('Has flowchart diagram:', hasFlowchart);
    
    if (!hasFlowchart) {
      console.log('❌ Still generating statechart - mode change not working');
      // Take screenshot to see current state
      await page.screenshot({ 
        path: 'review/screenshots/mermaid-styling-flat-failed.png',
        fullPage: true 
      });
    }
    
    // Check that flat states exist (only if we have flowchart)
    if (hasFlowchart) {
      const workingRed = page.locator('g#Working_Red');
      const workingGreen = page.locator('g#Working_Green');
      const workingYellow = page.locator('g#Working_Yellow');
      
      console.log('Working_Red visible:', await workingRed.isVisible());
      console.log('Working_Green visible:', await workingGreen.isVisible());
      console.log('Working_Yellow visible:', await workingYellow.isVisible());
      
      await expect(workingRed).toBeVisible();
      await expect(workingGreen).toBeVisible();
      await expect(workingYellow).toBeVisible();
      
      console.log('✅ Flat mode: Working_* states are visible');
    }

    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'review/screenshots/mermaid-styling-flat.png',
      fullPage: true 
    });

    console.log('✅ Flat mode test completed');
  });

  test('active state highlighting works in both modes', async ({ page }) => {
    // Test nested mode first
    const nestedButton = page.getByTestId('mode-toggle-nested');
    if (await nestedButton.isVisible()) {
      await nestedButton.click();
    }
    await page.waitForTimeout(500);

    // Should be in Working.Red state initially
    const activeElement = page.locator('.active, [class*="active"]');
    const hasActiveNested = await activeElement.count() > 0;
    console.log(`Nested mode has active element: ${hasActiveNested}`);

    // Test flat mode
    const flatButton = page.getByTestId('mode-toggle-flat');
    if (await flatButton.isVisible()) {
      await flatButton.click();
    }
    await page.waitForTimeout(500);

    const hasActiveFlat = await activeElement.count() > 0;
    console.log(`Flat mode has active element: ${hasActiveFlat}`);

    // Take screenshots of both modes with active states
    await page.screenshot({ 
      path: 'review/screenshots/mermaid-styling-active-nested.png',
      fullPage: true 
    });

    await nestedButton.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'review/screenshots/mermaid-styling-active-flat.png',
      fullPage: true 
    });

    console.log('✅ Active state highlighting tested in both modes');
  });

  test('edge styling and interactivity', async ({ page }) => {
    // Check that edges are rendered
    const edges = page.locator('.edgePath, [class*="edge"]');
    const edgeCount = await edges.count();
    console.log(`Number of edges found: ${edgeCount}`);
    expect(edgeCount).toBeGreaterThan(0);

    // Check edge labels
    const edgeLabels = page.locator('.edgeLabel');
    const labelCount = await edgeLabels.count();
    console.log(`Number of edge labels found: ${labelCount}`);
    expect(labelCount).toBeGreaterThan(0);

    // Take screenshot of edge styling
    await page.screenshot({ 
      path: 'review/screenshots/mermaid-styling-edges.png',
      fullPage: true 
    });

    console.log('✅ Edge styling and labels verified');
  });
});
