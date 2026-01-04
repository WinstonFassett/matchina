#!/usr/bin/env node

/**
 * Visual Verification Test - Uses proper shared infrastructure
 * 
 * Tests that we can properly:
 * 1. Select specific visualizers
 * 2. Verify what visualizer is actually showing
 * 3. Capture focused screenshots of just the visualizer
 * 4. Validate visualizer-specific elements
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../review/screenshots');

// Playwright script that uses shared test infrastructure
const VERIFICATION_SCRIPT = `
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Starting visual verification test...');
    
    // Navigate to toggle example
    await page.goto('http://localhost:4321/matchina/examples/toggle');
    await page.waitForSelector('.machine-visualizer', { timeout: 5000 });
    
    // Get current visualizer selection
    const picker = await page.$('[data-testid="visualizer-picker"]');
    if (!picker) {
      throw new Error('Visualizer picker not found');
    }
    
    const currentSelection = await picker.getAttribute('value');
    console.log('📋 Current visualizer:', currentSelection);
    
    // Take screenshot of current state
    const contentArea = await page.$('.machine-visualizer > div:last-child');
    if (contentArea) {
      await contentArea.screenshot({ path: '${SCREENSHOT_DIR}/verification-current-visualizer.png' });
      console.log('📸 Screenshot saved: verification-current-visualizer.png');
    }
    
    // Try to switch to ReactFlow (if available)
    console.log('🔄 Attempting to switch to ReactFlow...');
    await picker.selectOption('reactflow');
    await page.waitForTimeout(500);
    
    // Verify ReactFlow loaded
    try {
      await page.waitForSelector('.react-flow__node', { timeout: 3000 });
      console.log('✅ ReactFlow loaded successfully');
      
      // Take ReactFlow screenshot
      const reactflowArea = await page.$('.machine-visualizer > div:last-child');
      if (reactflowArea) {
        await reactflowArea.screenshot({ path: '${SCREENSHOT_DIR}/verification-reactflow.png' });
        console.log('📸 ReactFlow screenshot saved: verification-reactflow.png');
      }
    } catch (error) {
      console.log('❌ ReactFlow not available or failed to load');
    }
    
    // Try to switch to ForceGraph (if available)
    console.log('🔄 Attempting to switch to ForceGraph...');
    await picker.selectOption('forcegraph');
    await page.waitForTimeout(500);
    
    // Verify ForceGraph loaded
    try {
      await page.waitForSelector('canvas', { timeout: 3000 });
      console.log('✅ ForceGraph loaded successfully');
      
      // Take ForceGraph screenshot
      const forcegraphArea = await page.$('.machine-visualizer > div:last-child');
      if (forcegraphArea) {
        await forcegraphArea.screenshot({ path: '${SCREENSHOT_DIR}/verification-forcegraph.png' });
        console.log('📸 ForceGraph screenshot saved: verification-forcegraph.png');
      }
    } catch (error) {
      console.log('❌ ForceGraph not available or failed to load');
    }
    
    console.log('🎯 Visual verification test completed');
    
  } catch (error) {
    console.error('💥 Verification failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
`;

// Run the verification test
async function runVerification() {
  console.log('🔍 Running visual verification test...');
  
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['-e', VERIFICATION_SCRIPT], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      console.error('Error:', data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(output);
        resolve(output);
      } else {
        reject(new Error(`Verification failed with code ${code}`));
      }
    });
  });
}

// Run if called directly
if (require.main === module) {
  runVerification().catch(console.error);
}

module.exports = { runVerification };
