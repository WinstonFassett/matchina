import { test, expect } from '@playwright/test';

test('ReactFlow renders HSM combobox with nodes', async ({ page }) => {
  await page.goto('http://localhost:4321/matchina/examples/hsm-combobox/');
  await page.waitForLoadState('networkidle');

  // Switch to ReactFlow visualizer
  await page.click('button:has-text("React Flow")');
  await page.waitForTimeout(1000);

  // Check if nodes are rendered
  const nodes = page.locator('.react-flow__node');
  const nodeCount = await nodes.count();
  
  expect(nodeCount).toBeGreaterThan(0);
  expect(nodeCount).toBe(6); // HSM combobox has 6 states
});
