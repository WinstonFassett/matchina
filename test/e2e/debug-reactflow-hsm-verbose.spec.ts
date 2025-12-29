import { test, expect } from '@playwright/test';

test('debug ReactFlow HSM - verbose', async ({ page }) => {
  // Capture ALL console logs and errors
  const consoleLogs: Array<{ type: string; text: string }> = [];
  const pageErrors: string[] = [];
  
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });
  
  page.on('pageerror', error => {
    pageErrors.push(error.toString());
  });

  await page.goto('http://localhost:4321/matchina/examples/hsm-combobox/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check if page has any errors so far
  console.log('=== PAGE ERRORS BEFORE INTERACTION ===');
  pageErrors.forEach(err => console.log(err));
  console.log('=== PAGE ERRORS END ===');
  
  // Log all console messages so far
  console.log('=== CONSOLE LOGS BEFORE REACTFLOW CLICK ===');
  consoleLogs.forEach(log => console.log(`[${log.type}] ${log.text}`));
  console.log('=== CONSOLE LOGS END ===');
  
  // Clear logs for next phase
  consoleLogs.length = 0;
  
  // Switch to ReactFlow visualizer
  const reactFlowButton = page.locator('button:has-text("React Flow")');
  console.log('ReactFlow button found:', await reactFlowButton.count() > 0);
  
  await reactFlowButton.click();
  
  // Wait for ReactFlow to potentially render
  await page.waitForTimeout(3000);
  
  // Log all console messages after click
  console.log('=== CONSOLE LOGS AFTER REACTFLOW CLICK ===');
  consoleLogs.forEach(log => console.log(`[${log.type}] ${log.text}`));
  console.log('=== CONSOLE LOGS END ===');
  
  // Check page errors
  console.log('=== PAGE ERRORS AFTER REACTFLOW CLICK ===');
  pageErrors.forEach(err => console.log(err));
  console.log('=== PAGE ERRORS END ===');
  
  // Check if ReactFlow container exists
  const reactFlowContainer = page.locator('.react-flow');
  const containerExists = await reactFlowContainer.count() > 0;
  console.log('ReactFlow container exists:', containerExists);
  
  // Try to find nodes
  const nodes = page.locator('.react-flow__node');
  const nodeCount = await nodes.count();
  console.log('Node count:', nodeCount);
  
  // Try to find edges
  const edges = page.locator('.react-flow__edge');
  const edgeCount = await edges.count();
  console.log('Edge count:', edgeCount);
  
  // Try to find custom elements too
  const customNodes = page.locator('[data-reactflow-node-id]');
  const customNodeCount = await customNodes.count();
  console.log('Custom node elements count:', customNodeCount);
  
  // Inspect the ReactFlow container
  if (containerExists) {
    const html = await reactFlowContainer.innerHTML();
    console.log('ReactFlow container HTML length:', html.length);
    console.log('First 500 chars:', html.substring(0, 500));
  }
  
  // Take screenshot
  await page.screenshot({ path: 'debug-reactflow-hsm-verbose.png', fullPage: true });
  
  // Final assertion
  expect(nodeCount + customNodeCount).toBeGreaterThan(0);
});
