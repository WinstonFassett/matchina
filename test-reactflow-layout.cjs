#!/usr/bin/env node

// Test script to verify ReactFlow layout button functionality
const { chromium } = require('playwright');

async function testReactFlowLayoutButton() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to an example with ReactFlow
    await page.goto('http://localhost:4321/matchina/examples/toggle');
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
    
    // Look for the layout button
    const layoutButton = page.locator('button').filter({ hasText: 'Layout' }).first();
    
    if (await layoutButton.isVisible()) {
      console.log('✅ Layout button is visible');
      
      // Try to click the button
      console.log('Attempting to click layout button...');
      await layoutButton.click();
      await page.waitForTimeout(500);
      
      // Check if layout dialog appears
      const layoutDialog = page.locator('.fixed.inset-0').filter({ hasText: 'Layout Options' }).first();
      
      if (await layoutDialog.isVisible()) {
        console.log('✅ Layout dialog opened successfully');
        
        // Try to close it
        const closeButton = page.locator('button').filter({ hasText: '✕' }).first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(300);
          console.log('✅ Layout dialog closed successfully');
        }
      } else {
        console.log('❌ Layout dialog did not appear after clicking button');
        
        // Check for any overlays or z-index issues
        const overlays = await page.locator('.fixed, .absolute').all();
        console.log(`Found ${overlays.length} positioned elements that might block clicks`);
      }
    } else {
      console.log('❌ Layout button not found or not visible');
      
      // Look for any button with layout-related content
      const allButtons = await page.locator('button').all();
      console.log(`Found ${allButtons.length} buttons total`);
      
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const button = allButtons[i];
        const text = await button.textContent();
        const isVisible = await button.isVisible();
        console.log(`Button ${i + 1}: "${text}" - visible: ${isVisible}`);
      }
    }
    
    // Take a screenshot for verification
    await page.screenshot({ 
      path: 'review/screenshots/reactflow-layout-button-test.png',
      fullPage: false 
    });
    console.log('Screenshot saved to review/screenshots/reactflow-layout-button-test.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testReactFlowLayoutButton();
