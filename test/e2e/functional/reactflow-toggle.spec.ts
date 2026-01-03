import { test, expect } from '@playwright/test';
import { gotoExample, waitForVisualizer } from '../utils/test-helpers';

test('ReactFlow renders toggle (flat machine) with nodes', async ({ page }) => {
  await gotoExample(page, 'toggle');

  // Switch to ReactFlow visualizer
  const picker = page.locator('[data-testid="visualizer-picker"]');
  if (await picker.isVisible()) {
    await picker.selectOption('reactflow');
    await waitForVisualizer(page, 'reactflow');
  }

  // Verify nodes exist
  const nodes = page.locator('.react-flow__node');
  await expect(nodes.first()).toBeVisible();
  
  // Check node count
  const nodeCount = await nodes.count();
  expect(nodeCount).toBeGreaterThan(0);
  
  // Verify container
  const container = page.locator('.react-flow__viewport');
  await expect(container).toBeVisible();
});

test('ReactFlow renders traffic-light (flat machine) with nodes', async ({ page }) => {
  await gotoExample(page, 'traffic-light');

  // Switch to ReactFlow visualizer
  const picker = page.locator('[data-testid="visualizer-picker"]');
  if (await picker.isVisible()) {
    await picker.selectOption('reactflow');
    await waitForVisualizer(page, 'reactflow');
  }

  // Verify nodes exist
  const nodes = page.locator('.react-flow__node');
  await expect(nodes.first()).toBeVisible();
  
  // Check node count
  const nodeCount = await nodes.count();
  expect(nodeCount).toBeGreaterThan(0);
  
  // Verify container
  const container = page.locator('.react-flow__viewport');
  await expect(container).toBeVisible();
});

test('ReactFlow renders counter (flat machine) with nodes', async ({ page }) => {
  await gotoExample(page, 'counter');

  // Switch to ReactFlow visualizer
  const picker = page.locator('[data-testid="visualizer-picker"]');
  if (await picker.isVisible()) {
    await picker.selectOption('reactflow');
    await waitForVisualizer(page, 'reactflow');
  }

  // Verify nodes exist
  const nodes = page.locator('.react-flow__node');
  await expect(nodes.first()).toBeVisible();
  
  // Check node count
  const nodeCount = await nodes.count();
  expect(nodeCount).toBeGreaterThan(0);
  
  // Verify container
  const container = page.locator('.react-flow__viewport');
  await expect(container).toBeVisible();
});
