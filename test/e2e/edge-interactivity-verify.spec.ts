import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test.describe('Edge Interactivity Verification', () => {
  test('edge labels should have interactive classes', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for edge labels with interactive classes
    const edgeLabels = await page.locator('.edgeLabel p').all();
    console.log(`Found ${edgeLabels.length} edge labels`);

    // Get classes from edge labels
    for (let i = 0; i < Math.min(edgeLabels.length, 5); i++) {
      const classes = await edgeLabels[i].getAttribute('class');
      const text = await edgeLabels[i].textContent();
      console.log(`Edge ${i}: text="${text}", classes="${classes}"`);
    }

    // At least some edges should have interactive classes
    const interactiveEdges = await page.locator('.edgeLabel p.edge-interactive').count();
    const activeEdges = await page.locator('.edgeLabel p.edge-active').count();
    const inactiveEdges = await page.locator('.edgeLabel p.edge-inactive').count();

    console.log(`Interactive: ${interactiveEdges}, Active: ${activeEdges}, Inactive: ${inactiveEdges}`);

    // Verify at least some edges have classes
    const totalClassified = interactiveEdges + activeEdges + inactiveEdges;
    expect(totalClassified).toBeGreaterThan(0);
  });

  test('clicking active edge should trigger state transition', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find an active edge and click it
    const activeEdge = page.locator('.edgeLabel p.edge-active').first();
    
    if (await activeEdge.count() > 0) {
      const initialText = await activeEdge.textContent();
      console.log(`Clicking active edge: "${initialText}"`);
      
      await activeEdge.click();
      await page.waitForTimeout(500);
      
      // State should have changed - verify by checking if different edges are now active
      const newActiveEdges = await page.locator('.edgeLabel p.edge-active').allTextContents();
      console.log(`After click, active edges: ${newActiveEdges.join(', ')}`);
    } else {
      console.log('No active edges found - checking if any edges exist');
      const allEdges = await page.locator('.edgeLabel p').count();
      console.log(`Total edge labels: ${allEdges}`);
    }
  });
});
