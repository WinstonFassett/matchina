#!/usr/bin/env node

// Test script to verify ReactFlow height fix
const { chromium } = require('playwright');

async function testReactFlowHeight() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to counter example (which had height issues)
    await page.goto('http://localhost:4321/matchina/examples/counter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Switch to ReactFlow visualizer
    const vizPicker = page.locator('select').filter({ hasText: /ReactFlow|Sketch|ForceGraph/ }).first();
    const options = await vizPicker.locator('option').allTextContents();
    console.log('Available visualizer options:', options);
    
    if (options.includes('ReactFlow')) {
      await vizPicker.selectOption('ReactFlow');
      await page.waitForTimeout(800);
    }
    
    // Check ReactFlow container height
    const reactFlowContainer = page.locator('.react-flow').first();
    const boundingBox = await reactFlowContainer.boundingBox();
    
    if (boundingBox) {
      console.log(`ReactFlow container dimensions: ${boundingBox.width}x${boundingBox.height}`);
      
      if (boundingBox.height >= 300) {
        console.log('✅ ReactFlow has sufficient height');
      } else {
        console.log('❌ ReactFlow height is insufficient:', boundingBox.height);
      }
    } else {
      console.log('❌ Could not find ReactFlow container');
    }
    
    // Check if nodes are visible
    const nodes = await page.locator('.react-flow__node').all();
    console.log(`Found ${nodes.length} nodes`);
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const isVisible = await node.isVisible();
      const text = await node.textContent();
      console.log(`Node ${i + 1}: "${text}" - visible: ${isVisible}`);
    }
    
    // Take a screenshot for verification
    await page.screenshot({ 
      path: 'review/screenshots/reactflow-height-test.png',
      fullPage: false 
    });
    console.log('Screenshot saved to review/screenshots/reactflow-height-test.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testReactFlowHeight();
