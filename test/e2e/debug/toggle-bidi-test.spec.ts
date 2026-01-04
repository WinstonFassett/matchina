import { test, expect } from '@playwright/test';

test('Toggle example parallel transitions - bidi fix verification', async ({ page }) => {
  // Navigate to the toggle example
  await page.goto('http://localhost:4321/matchina/examples/toggle');

  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // CRITICAL: Select ReactFlow visualizer specifically
  const picker = page.locator('[data-testid="visualizer-picker"]');
  await expect(picker).toBeVisible({ timeout: 3000 });
  
  // Get current value to verify it's not ReactFlow
  const currentValue = await picker.inputValue();
  console.log(`Current visualizer: ${currentValue}`);
  
  // Select ReactFlow
  await picker.selectOption('reactflow');

  // Wait for ReactFlow to load
  await page.waitForSelector('.react-flow__viewport', { timeout: 5000 });

  // Wait for layout to stabilize
  await page.waitForTimeout(500);

  // Try to select Layered Horizontal layout via UI
  const layoutButton = page.locator('button:has-text("Layout")');
  if (await layoutButton.isVisible()) {
    await layoutButton.click();
    await page.waitForTimeout(300);

    // Find the algorithm select within the layout panel
    const layoutPanel = page.locator('.layout-panel, [class*="LayoutPanel"]').or(page.locator('text=Algorithm').locator('..'));
    const algoSelect = layoutPanel.locator('select').first();

    if (await algoSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await algoSelect.selectOption('layered');
      await page.waitForTimeout(300);

      // Find direction select
      const dirSelect = layoutPanel.locator('select').nth(1);
      if (await dirSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await dirSelect.selectOption('RIGHT');
        await page.waitForTimeout(500);
      }
    }

    // Close panel by clicking X or elsewhere
    const closeBtn = page.locator('button:has-text("×")').first();
    if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(300);
  }

  // Zoom to fit using controls
  const fitButton = page.locator('.react-flow__controls-fitview');
  if (await fitButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await fitButton.click();
    await page.waitForTimeout(300);
  }
  
  // Verify we're on ReactFlow, not mermaid
  const reactFlowViewport = page.locator('.react-flow__viewport');
  await expect(reactFlowViewport).toBeVisible();
  
  // Make sure mermaid is NOT visible
  const mermaidContainer = page.locator('.mermaid-container');
  if (await mermaidContainer.isVisible()) {
    console.log('ERROR: Mermaid is still visible - ReactFlow selection failed');
  } else {
    console.log('✓ ReactFlow visualizer loaded successfully');
  }
  
  // Take a screenshot to verify parallel edge behavior
  await page.screenshot({ path: 'toggle-bidi-fix.png', fullPage: false });
  
  // Check that we have the expected nodes (On, Off)
  const nodes = page.locator('.react-flow__node');
  await expect(nodes).toHaveCount(2);
  
  // Verify the nodes are On and Off
  const onNode = page.locator('.react-flow__node:has-text("On")');
  const offNode = page.locator('.react-flow__node:has-text("Off")');
  await expect(onNode).toBeVisible();
  await expect(offNode).toBeVisible();
  
  // Check that we have exactly 4 edges (2 in each direction: toggle+turnOn, toggle+turnOff)
  const edges = page.locator('.react-flow__edge');
  const edgeCount = await edges.count();
  expect(edgeCount).toBe(4);

  // Get edge paths for visual verification
  const paths = page.locator('.react-flow__edge path');
  const pathCount = await paths.count();
  console.log(`✓ Found ${edgeCount} edges with ${pathCount} paths between On and Off`);
  console.log('✓ Screenshot saved as toggle-bidi-fix.png');
});
