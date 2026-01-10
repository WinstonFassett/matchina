import { test, expect } from '@playwright/test';

test.describe('Visual comparison between V1 and V2 ReactFlow', () => {
  test('measure node bounds and locations', async ({ page }) => {
    // Navigate to the auth flow example with V2
    await page.goto('http://localhost:4321/matchina/examples/auth-flow');
    
    // Wait for both visualizers to load
    await page.waitForSelector('[data-testid="reactflow-v1"]');
    await page.waitForSelector('[data-testid="reactflow-v2"]');
    
    // Get V1 measurements
    const v1Nodes = await page.evaluate(() => {
      const v1Container = document.querySelector('[data-testid="reactflow-v1"]');
      if (!v1Container) return [];
      
      const nodes = v1Container.querySelectorAll('.react-flow__node');
      return Array.from(nodes).map(node => {
        const rect = node.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(node);
        return {
          id: node.getAttribute('data-id') || 'unknown',
          textContent: node.textContent || '',
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
          background: computedStyle.background,
          border: computedStyle.border,
          color: computedStyle.color,
          padding: computedStyle.padding,
          fontSize: computedStyle.fontSize,
          fontWeight: computedStyle.fontWeight,
        };
      });
    });
    
    // Get V2 measurements
    const v2Nodes = await page.evaluate(() => {
      const v2Container = document.querySelector('[data-testid="reactflow-v2"]');
      if (!v2Container) return [];
      
      const nodes = v2Container.querySelectorAll('.react-flow__node');
      return Array.from(nodes).map(node => {
        const rect = node.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(node);
        return {
          id: node.getAttribute('data-id') || 'unknown',
          textContent: node.textContent || '',
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
          background: computedStyle.background,
          border: computedStyle.border,
          color: computedStyle.color,
          padding: computedStyle.padding,
          fontSize: computedStyle.fontSize,
          fontWeight: computedStyle.fontWeight,
        };
      });
    });
    
    console.log('V1 Nodes:', v1Nodes);
    console.log('V2 Nodes:', v2Nodes);
    
    // Find the Cart node specifically
    const v1Cart = v1Nodes.find(node => node.id.includes('Cart') || node.textContent?.includes('Cart'));
    const v2Cart = v2Nodes.find(node => node.id.includes('Cart') || node.textContent?.includes('Cart'));
    
    console.log('V1 Cart node:', v1Cart);
    console.log('V2 Cart node:', v2Cart);
    
    if (v1Cart && v2Cart) {
      console.log('Cart node comparison:');
      console.log('V1 dimensions:', { width: v1Cart.width, height: v1Cart.height });
      console.log('V2 dimensions:', { width: v2Cart.width, height: v2Cart.height });
      console.log('V1 position:', { x: v1Cart.x, y: v1Cart.y });
      console.log('V2 position:', { x: v2Cart.x, y: v2Cart.y });
      console.log('V1 background:', v1Cart.background);
      console.log('V2 background:', v2Cart.background);
      console.log('V1 border:', v1Cart.border);
      console.log('V2 border:', v2Cart.border);
      console.log('V1 padding:', v1Cart.padding);
      console.log('V2 padding:', v2Cart.padding);
      console.log('V1 fontSize:', v1Cart.fontSize);
      console.log('V2 fontSize:', v2Cart.fontSize);
      console.log('V1 fontWeight:', v1Cart.fontWeight);
      console.log('V2 fontWeight:', v2Cart.fontWeight);
      
      // Take screenshots for visual comparison
      const v1CartElement = await page.locator('[data-testid="reactflow-v1"] .react-flow__node:has-text("Cart")');
      const v2CartElement = await page.locator('[data-testid="reactflow-v2"] .react-flow__node:has-text("Cart")');
      
      if (await v1CartElement.isVisible()) {
        await v1CartElement.screenshot({ path: 'test-results/v1-cart-node.png' });
      }
      if (await v2CartElement.isVisible()) {
        await v2CartElement.screenshot({ path: 'test-results/v2-cart-node.png' });
      }
    }
    
    // Take full visualizer screenshots
    await page.locator('[data-testid="reactflow-v1"]').screenshot({ path: 'test-results/v1-full.png' });
    await page.locator('[data-testid="reactflow-v2"]').screenshot({ path: 'test-results/v2-full.png' });
  });
});
