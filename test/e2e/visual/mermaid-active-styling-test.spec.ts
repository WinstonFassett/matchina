import { test, Page, expect } from '@playwright/test';

const BASE_URL = '/matchina/examples/hsm-traffic-light';

test.describe('Mermaid Active Styling Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Capture console logs to see what diagram is generated
    page.on('console', msg => {
      if (msg.text().includes('Generated Mermaid diagram:')) {
        console.log('BROWSER:', msg.text());
      }
    });
  });

  test('test active grouping styling - nested mode', async ({ page }) => {
    // Switch to dark mode for better visibility
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

    // Look for interactive edges to trigger state change
    const interactiveEdges = page.locator('.edge-interactive, .edge-active, .edge-ancestor, .edge-inactive');
    const edgeCount = await interactiveEdges.count();
    console.log('Interactive edges found:', edgeCount);

    if (edgeCount > 0) {
      // Click the first interactive edge to trigger state change
      await interactiveEdges.first().click();
      await page.waitForTimeout(1000);

      // Check if Working group is now active
      const activeWorkingGroup = page.locator('[id*="Working"].active, .statediagram-cluster.active[id*="Working"]');
      const isActive = await activeWorkingGroup.count() > 0;
      console.log('Working group is active:', isActive);

      if (isActive) {
        // Check the title area styling
        const titleLabel = activeWorkingGroup.locator('.cluster-label');
        const titleBg = await titleLabel.evaluate(el => {
          return window.getComputedStyle(el).fill || window.getComputedStyle(el).backgroundColor;
        });
        console.log('Active title background:', titleBg);

        const titleText = titleLabel.locator('text, .nodeLabel');
        const textColor = await titleText.evaluate(el => {
          return window.getComputedStyle(el).fill || window.getComputedStyle(el).color;
        });
        console.log('Active title text color:', textColor);
      }
    }

    // Take screenshot for verification
    await page.screenshot({ 
      path: 'review/screenshots/active-nested-dark.png',
      fullPage: true 
    });

    console.log('✅ Active nested mode test captured');
  });

  test('test hover styling - nested mode', async ({ page }) => {
    // Switch to dark mode for better visibility
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

    // Look for interactive edges to test hover
    const interactiveEdges = page.locator('.edge-interactive, .edge-active, .edge-ancestor, .edge-inactive');
    const edgeCount = await interactiveEdges.count();
    console.log('Interactive edges found:', edgeCount);

    if (edgeCount > 0) {
      // Hover over the first interactive edge
      const firstEdge = interactiveEdges.first();
      
      // Debug: check what elements are inside the edge
      const edgeContent = await firstEdge.innerHTML();
      console.log('Edge HTML content:', edgeContent);
      
      // Try different selectors for the label
      const edgeLabel = firstEdge.locator('p, text, span, foreignObject');
      const labelCount = await edgeLabel.count();
      console.log('Label elements found:', labelCount);
      
      if (labelCount > 0) {
        await firstEdge.hover();
        await page.waitForTimeout(500);

        // Check hover styling
        const hoverBg = await edgeLabel.first().evaluate(el => {
          return window.getComputedStyle(el).backgroundColor;
        });
        console.log('Hover background:', hoverBg);

        const hoverColor = await edgeLabel.first().evaluate(el => {
          return window.getComputedStyle(el).color;
        });
        console.log('Hover text color:', hoverColor);
      } else {
        console.log('No label elements found, checking edge styling directly');
        await firstEdge.hover();
        await page.waitForTimeout(500);
        
        const edgeBg = await firstEdge.evaluate(el => {
          return window.getComputedStyle(el).backgroundColor;
        });
        console.log('Edge hover background:', edgeBg);
        
        const edgeColor = await firstEdge.evaluate(el => {
          return window.getComputedStyle(el).color;
        });
        console.log('Edge hover color:', edgeColor);
      }
    }

    // Take screenshot for verification
    await page.screenshot({ 
      path: 'review/screenshots/hover-nested-dark.png',
      fullPage: true 
    });

    console.log('✅ Hover nested mode test captured');
  });
});
