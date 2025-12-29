import { test, expect } from '@playwright/test';

test.describe('ReactFlow Basic Tests', () => {
  test('toggle example renders nodes correctly', async ({ page }) => {
    await page.goto('http://localhost:4321/matchina/examples/toggle/');
    await page.waitForLoadState('networkidle');

    // Check if the react-flow container is rendered
    const rfViewport = page.locator('.react-flow__viewport');
    await expect(rfViewport).toBeVisible();

    // Check if nodes are rendered
    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBe(2); // Toggle has 2 states

    // Verify nodes are visible
    for (let i = 0; i < nodeCount; i++) {
      await expect(nodes.nth(i)).toBeVisible();
    }
  });

  test('traffic-light example renders nodes correctly', async ({ page }) => {
    await page.goto('http://localhost:4321/matchina/examples/traffic-light/');
    await page.waitForLoadState('networkidle');

    const rfViewport = page.locator('.react-flow__viewport');
    await expect(rfViewport).toBeVisible();

    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBe(3); // Traffic light has 3 states
  });

  test('hsm-combobox example renders hierarchical states', async ({ page }) => {
    await page.goto('http://localhost:4321/matchina/examples/hsm-combobox/');
    await page.waitForLoadState('networkidle');

    // Click on "Nested (Hierarchical)" button to switch to HSM mode
    await page.click('button:has-text("Nested (Hierarchical)")');
    await page.waitForTimeout(500);

    // Switch to React Flow visualizer
    await page.click('button:has-text("React Flow")');
    await page.waitForTimeout(500);

    // Check if nodes are rendered
    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThan(0);
    expect(nodeCount).toBe(6); // HSM combobox has 6 states (Inactive + 5 nested states)
  });
});
