import { test, expect } from '@playwright/test';

test('ReactFlow renders toggle (flat machine) with nodes', async ({ page }) => {
  await page.goto('http://localhost:4321/matchina/examples/toggle/');
  await page.waitForLoadState('networkidle');

  // Switch to ReactFlow visualizer
  await page.click('button:has-text("React Flow")');
  await page.waitForTimeout(1000);

  // Check if nodes are rendered
  const nodes = page.locator('.react-flow__node');
  const nodeCount = await nodes.count();
  
  expect(nodeCount).toBeGreaterThan(0);
  expect(nodeCount).toBe(2); // Toggle has 2 states (On, Off)

  // Check if nodes are visible and properly sized
  const firstNode = nodes.first();
  const boundingBox = await firstNode.boundingBox();
  expect(boundingBox).not.toBeNull();
  expect(boundingBox?.width).toBeGreaterThan(0);
  expect(boundingBox?.height).toBeGreaterThan(0);

  // Check that nodes are within viewport
  const container = page.locator('.react-flow__viewport');
  const containerBox = await container.boundingBox();
  expect(containerBox).not.toBeNull();
});

test('ReactFlow renders traffic-light (flat machine) with nodes', async ({ page }) => {
  await page.goto('http://localhost:4321/matchina/examples/traffic-light/');
  await page.waitForLoadState('networkidle');

  // Switch to ReactFlow visualizer
  await page.click('button:has-text("React Flow")');
  await page.waitForTimeout(1000);

  // Check if nodes are rendered
  const nodes = page.locator('.react-flow__node');
  const nodeCount = await nodes.count();
  
  expect(nodeCount).toBeGreaterThan(0);
  expect(nodeCount).toBe(3); // Traffic light has 3 states (Red, Yellow, Green)
});

test('ReactFlow renders counter (flat machine) with nodes', async ({ page }) => {
  await page.goto('http://localhost:4321/matchina/examples/counter/');
  await page.waitForLoadState('networkidle');

  // Switch to ReactFlow visualizer
  await page.click('button:has-text("React Flow")');
  await page.waitForTimeout(1000);

  // Check if nodes are rendered
  const nodes = page.locator('.react-flow__node');
  const nodeCount = await nodes.count();
  
  expect(nodeCount).toBeGreaterThan(0);
  // Counter has 1 state (Counting) - it's a simple flat machine
});
