import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test.describe('Diagram Structure Debug', () => {
  test('capture nested mode diagram structure', async ({ page }) => {
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
    await page.waitForTimeout(1000);

    // Capture console logs to see what diagram is generated
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Generated Mermaid diagram:') || 
          msg.text().includes('mode:') || 
          msg.text().includes('defaultViz:') ||
          msg.text().includes('shape') ||
          msg.text().includes('hierarchy') ||
          msg.text().includes('states')) {
        logs.push(msg.text());
        console.log('CONSOLE:', msg.text());
      }
    });

    // Count all nodes
    const allNodes = page.locator('.node');
    const nodeCount = await allNodes.count();
    console.log('Total nodes found:', nodeCount);

    // List all node IDs
    for (let i = 0; i < nodeCount; i++) {
      const node = allNodes.nth(i);
      const nodeId = await node.getAttribute('id');
      try {
        const nodeText = await node.locator('text').textContent({ timeout: 1000 });
        console.log(`Node ${i}: id="${nodeId}", text="${nodeText}"`);
      } catch {
        console.log(`Node ${i}: id="${nodeId}", text="[timeout]"`);
      }
    }

    // Count all edges
    const allEdges = page.locator('.edgePath, g.edge');
    const edgeCount = await allEdges.count();
    console.log('Total edges found:', edgeCount);

    // List all edge IDs
    for (let i = 0; i < edgeCount; i++) {
      const edge = allEdges.nth(i);
      const edgeId = await edge.getAttribute('id');
      const edgeText = await edge.locator('text, p').textContent();
      console.log(`Edge ${i}: id="${edgeId}", text="${edgeText}"`);
    }

    // Check for Working group structure
    const workingGroup = page.locator('[id*="Working"]');
    const workingCount = await workingGroup.count();
    console.log('Working-related elements found:', workingCount);

    for (let i = 0; i < workingCount; i++) {
      const element = workingGroup.nth(i);
      const elementId = await element.getAttribute('id');
      const elementClass = await element.getAttribute('class');
      console.log(`Working element ${i}: id="${elementId}", class="${elementClass}"`);
    }

    // Take screenshot
    await page.screenshot({ 
      path: 'review/screenshots/nested-diagram-structure.png',
      fullPage: true 
    });

    console.log('Console logs captured:', logs.length);
    console.log('✅ Nested diagram structure captured');
  });
});
