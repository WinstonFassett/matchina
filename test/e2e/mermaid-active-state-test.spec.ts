import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test.describe('Mermaid Active State Test', () => {
  test('try different transitions to trigger active state', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(500);

    // Ensure nested mode
    const nestedButton = page.getByRole('button', { name: 'Nested' });
    if (await nestedButton.isVisible()) {
      await nestedButton.click();
    }
    await page.waitForTimeout(500);

    // Get all interactive edges
    const interactiveEdges = page.locator('.edge-interactive, .edge-active, .edge-ancestor, .edge-inactive');
    const edgeCount = await interactiveEdges.count();
    console.log('Interactive edges found:', edgeCount);

    // Try clicking each edge to see if any triggers active state
    for (let i = 0; i < Math.min(edgeCount, 5); i++) {
      const edge = interactiveEdges.nth(i);
      const edgeText = await edge.textContent();
      console.log(`Trying edge ${i}: "${edgeText}"`);

      // Click the edge
      await edge.click();
      await page.waitForTimeout(1000);

      // Check if any grouping node became active
      const activeGroups = page.locator('.statediagram-cluster.active, .cluster.active');
      const activeCount = await activeGroups.count();
      console.log(`Active groups after clicking "${edgeText}":`, activeCount);

      if (activeCount > 0) {
        console.log('SUCCESS: Found active grouping node!');
        
        // Check the active styling
        const activeGroup = activeGroups.first();
        const groupRect = activeGroup.locator('rect');
        const groupFill = await groupRect.first().evaluate(el => {
          return window.getComputedStyle(el).fill;
        });
        console.log('Active group fill:', groupFill);

        // Check title area styling
        const titleLabel = activeGroup.locator('.cluster-label');
        if (await titleLabel.count() > 0) {
          const titleBg = await titleLabel.evaluate(el => {
            return window.getComputedStyle(el).fill || window.getComputedStyle(el).backgroundColor;
          });
          console.log('Active title background:', titleBg);

          const titleText = titleLabel.locator('text, .nodeLabel');
          if (await titleText.count() > 0) {
            const textColor = await titleText.evaluate(el => {
              return window.getComputedStyle(el).fill || window.getComputedStyle(el).color;
            });
            console.log('Active title text color:', textColor);
          }
        }

        // Take screenshot of active state
        await page.screenshot({ 
          path: 'review/screenshots/active-state-success.png',
          fullPage: true 
        });

        break;
      }

      // Wait a bit before trying next edge
      await page.waitForTimeout(500);
    }

    console.log('✅ Active state test completed');
  });
});
