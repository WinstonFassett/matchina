import { test, expect } from '@playwright/test';

test.describe('Self-loop arrow positioning', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/matchina/examples/counter');
    // Wait for the ReactFlow component to load
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    // Wait a bit more for the layout to stabilize
    await page.waitForTimeout(2000);
  });

  test('self-loop arrows should connect properly to node terminals', async ({ page }) => {
    // Get the ReactFlow canvas
    const canvas = page.locator('.react-flow__pane').first();
    await expect(canvas).toBeVisible();

    // Find all self-loop edges by checking for edges with isSelfTransition data
    const allEdges = await page.locator('.react-flow__edge path').all();
    
    // Filter for self-loop edges (those that start and end at same point)
    const selfLoopEdges = [];
    for (const edge of allEdges) {
      const pathData = await edge.getAttribute('d');
      if (pathData) {
        // Clean up the path data (remove newlines and extra spaces)
        const cleanPath = pathData.replace(/\s+/g, ' ').trim();
        
        // Check if path starts and ends at same point (self-loop)
        const startMatch = cleanPath.match(/M\s+([\d.-]+)\s+([\d.-]+)/);
        const endMatch = cleanPath.match(/([\d.-]+)\s+([\d.-]+)$/);
        
        if (startMatch && endMatch) {
          const startX = parseFloat(startMatch[1]);
          const startY = parseFloat(startMatch[2]);
          const endX = parseFloat(endMatch[1]);
          const endY = parseFloat(endMatch[2]);
          
          // If start and end points are very close, it's a self-loop
          if (Math.abs(startX - endX) < 2 && Math.abs(startY - endY) < 2) {
            selfLoopEdges.push(edge);
          }
        }
      }
    }
    
    // There should be 3 self-loop edges (increment, decrement, reset)
    expect(selfLoopEdges.length).toBe(3);

    // Get the Active node position and dimensions in SVG coordinate space
    const activeNode = page.locator('.react-flow__node').filter({ hasText: 'Active' }).first();
    await expect(activeNode).toBeVisible();
    
    // Get the node's transform and position in SVG coordinates
    const nodeTransform = await activeNode.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const svg = node.closest('svg');
      if (!svg) return null;
      
      const svgRect = svg.getBoundingClientRect();
      return {
        x: rect.left - svgRect.left,
        y: rect.top - svgRect.top,
        width: rect.width,
        height: rect.height
      };
    });
    
    expect(nodeTransform).toBeTruthy();
    if (!nodeTransform) return;

    const nodeCenterX = nodeTransform.x + nodeTransform.width / 2;
    const nodeCenterY = nodeTransform.y + nodeTransform.height / 2;
    const halfWidth = nodeTransform.width / 2;
    const halfHeight = nodeTransform.height / 2;

    // Expected terminal positions for self-loops
    const expectedTerminals = [
      { x: nodeCenterX, y: nodeCenterY - halfHeight }, // Top
      { x: nodeCenterX + halfWidth, y: nodeCenterY }, // Right  
      { x: nodeCenterX, y: nodeCenterY + halfHeight }, // Bottom
    ];

    // Check each self-loop edge
    for (let i = 0; i < selfLoopEdges.length; i++) {
      const edge = selfLoopEdges[i];
      
      // Get the path data to analyze the curve
      const pathData = await edge.getAttribute('d');
      expect(pathData).toBeTruthy();

      if (!pathData) continue;

      // Clean up the path data
      const cleanPath = pathData.replace(/\s+/g, ' ').trim();

      // Parse the SVG path to get the start point
      const pathMatch = cleanPath.match(/M\s+([\d.-]+)\s+([\d.-]+)/);
      expect(pathMatch).toBeTruthy();
      
      if (!pathMatch) continue;

      const startX = parseFloat(pathMatch[1]);
      const startY = parseFloat(pathMatch[2]);

      // Verify the start point is at or very close to an expected terminal position
      const expectedTerminal = expectedTerminals[i % expectedTerminals.length];
      const distanceFromExpected = Math.sqrt(
        Math.pow(startX - expectedTerminal.x, 2) + Math.pow(startY - expectedTerminal.y, 2)
      );

      // Should be very close to the expected terminal (within 10px tolerance)
      expect(distanceFromExpected).toBeLessThan(10);

      console.log(`Self-loop ${i}: Start point (${startX}, ${startY}), Expected terminal (${expectedTerminal.x}, ${expectedTerminal.y}), Distance: ${distanceFromExpected}px`);
    }

    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: 'test-results/self-loop-arrow-positioning.png',
      fullPage: false 
    });
  });

  test('self-loop arrows should have proper circular curves', async ({ page }) => {
    // Get the self-loop edges
    const allEdges = await page.locator('.react-flow__edge path').all();
    
    // Filter for self-loop edges
    const selfLoopEdges = [];
    for (const edge of allEdges) {
      const pathData = await edge.getAttribute('d');
      if (pathData) {
        // Clean up the path data
        const cleanPath = pathData.replace(/\s+/g, ' ').trim();
        
        const startMatch = cleanPath.match(/M\s+([\d.-]+)\s+([\d.-]+)/);
        const endMatch = cleanPath.match(/([\d.-]+)\s+([\d.-]+)$/);
        
        if (startMatch && endMatch) {
          const startX = parseFloat(startMatch[1]);
          const startY = parseFloat(startMatch[2]);
          const endX = parseFloat(endMatch[1]);
          const endY = parseFloat(endMatch[2]);
          
          if (Math.abs(startX - endX) < 2 && Math.abs(startY - endY) < 2) {
            selfLoopEdges.push(edge);
          }
        }
      }
    }
    
    expect(selfLoopEdges.length).toBe(3);

    for (let i = 0; i < selfLoopEdges.length; i++) {
      const edge = selfLoopEdges[i];
      const pathData = await edge.getAttribute('d');
      expect(pathData).toBeTruthy();

      if (!pathData) continue;

      // Clean up the path data
      const cleanPath = pathData.replace(/\s+/g, ' ').trim();

      // Verify it's a cubic Bezier curve (C command) that returns to the same point
      expect(cleanPath).toContain('M'); // Move to start point
      expect(cleanPath).toContain('C'); // Cubic Bezier curve
      
      // Parse the path to verify it starts and ends at the same point
      const moves = cleanPath.match(/M\s+([\d.-]+)\s+([\d.-]+)/g);
      const lastPoint = cleanPath.match(/([\d.-]+)\s+([\d.-]+)$/);
      
      expect(moves).toBeTruthy();
      expect(lastPoint).toBeTruthy();
      
      if (moves && lastPoint) {
        const startPoint = moves[0].match(/M\s+([\d.-]+)\s+([\d.-]+)/);
        if (startPoint) {
          const startX = parseFloat(startPoint[1]);
          const startY = parseFloat(startPoint[2]);
          const endX = parseFloat(lastPoint[1]);
          const endY = parseFloat(lastPoint[2]);
          
          // Start and end points should be very close (same terminal)
          expect(Math.abs(startX - endX)).toBeLessThan(1);
          expect(Math.abs(startY - endY)).toBeLessThan(1);
        }
      }
    }
  });

  test('self-loop labels should be positioned outside the loops', async ({ page }) => {
    // Find the edge labels for self-loops using the correct selector
    const edgeLabelRenderer = page.locator('.react-flow__edgelabel-renderer').first();
    await expect(edgeLabelRenderer).toBeVisible();
    
    // Get all label divs within the renderer
    const labelDivs = edgeLabelRenderer.locator('div').filter({ hasText: /^(increment|decrement|reset)$/ });
    await expect(labelDivs).toHaveCount(3);

    // Get the Active node position
    const activeNode = page.locator('.react-flow__node').filter({ hasText: 'Active' }).first();
    const nodeBoundingBox = await activeNode.boundingBox();
    expect(nodeBoundingBox).toBeTruthy();

    if (!nodeBoundingBox) return;

    // Check that labels are positioned outside the node bounds
    for (let i = 0; i < await labelDivs.count(); i++) {
      const label = labelDivs.nth(i);
      const labelBoundingBox = await label.boundingBox();
      expect(labelBoundingBox).toBeTruthy();

      if (!labelBoundingBox) continue;

      // Label should not overlap with the node
      const labelCenterX = labelBoundingBox.x + labelBoundingBox.width / 2;
      const labelCenterY = labelBoundingBox.y + labelBoundingBox.height / 2;
      const nodeCenterX = nodeBoundingBox.x + nodeBoundingBox.width / 2;
      const nodeCenterY = nodeBoundingBox.y + nodeBoundingBox.height / 2;

      // Distance between label and node centers should be significant
      const distance = Math.sqrt(
        Math.pow(labelCenterX - nodeCenterX, 2) + Math.pow(labelCenterY - nodeCenterY, 2)
      );

      expect(distance).toBeGreaterThan(30); // Labels should be well outside the node

      console.log(`Label ${i}: Distance from node center: ${distance}px`);
    }
  });
});
