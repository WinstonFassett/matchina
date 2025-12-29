import { test, expect } from '@playwright/test';

test('debug ReactFlow HSM combobox', async ({ page }) => {
  // Capture console logs
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(msg.text());
  });

  await page.goto('http://localhost:4321/matchina/examples/hsm-combobox/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Switch to ReactFlow visualizer
  await page.click('button:has-text("React Flow")');
  
  // Wait a moment for ReactFlow to render
  await page.waitForTimeout(2000);
  
  // Check if ReactFlow container exists
  const reactFlowContainer = page.locator('.react-flow');
  console.log('ReactFlow container exists:', await reactFlowContainer.count() > 0);
  
  // Check for nodes
  const nodes = page.locator('.react-flow__node');
  const nodeCount = await nodes.count();
  console.log('Node count:', nodeCount);
  
  // Check for edges
  const edges = page.locator('.react-flow__edge');
  const edgeCount = await edges.count();
  console.log('Edge count:', edgeCount);
  
  // Print debug logs from ReactFlow
  console.log('=== ReactFlow Console Logs ===');
  const reactFlowLogs = consoleLogs.filter(log => log.includes('ReactFlow DEBUG'));
  reactFlowLogs.forEach(log => console.log(log));
  console.log('=== End Console Logs ===');
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'debug-reactflow-hsm.png', fullPage: true });
  
  // Check if there are any error messages
  const errors = page.locator('[data-testid="error"], .error, .error-message');
  const errorCount = await errors.count();
  console.log('Error count:', errorCount);
  
  if (errorCount > 0) {
    for (let i = 0; i < errorCount; i++) {
      const errorText = await errors.nth(i).textContent();
      console.log(`Error ${i}:`, errorText);
    }
  }
  
  // Expect at least some nodes to be present
  expect(nodeCount).toBeGreaterThan(0);
});
