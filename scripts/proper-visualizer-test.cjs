#!/usr/bin/env node

/**
 * Proper Visualizer Test - Uses CORRECT shared infrastructure
 * 
 * Uses the RIGHT selectors from test-helpers.ts:
 * - '.viz-container' for just the visualizer
 * - '.machine-visualizer > div:last-child' for visualizer + app
 */

const { spawn } = require('child_process');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../review/screenshots');

// Playwright script using CORRECT selectors
const PROPER_SCRIPT = `
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testing PROPER visualizer capture...');
    
    // Navigate to toggle example
    await page.goto('http://localhost:4321/matchina/examples/toggle');
    await page.waitForSelector('.machine-visualizer', { timeout: 5000 });
    
    // Get current visualizer selection
    const picker = await page.$('[data-testid="visualizer-picker"]');
    const currentSelection = await picker.getAttribute('value');
    console.log('📋 Current visualizer:', currentSelection);
    
    // Test 1: Capture JUST the visualizer (CORRECT approach)
    console.log('🎯 Testing .viz-container (visualizer only)...');
    try {
      const visualizerOnly = await page.$('.viz-container');
      if (visualizerOnly) {
        await visualizerOnly.screenshot({ path: '${SCREENSHOT_DIR}/test-visualizer-only.png' });
        console.log('✅ Visualizer-only screenshot saved');
      }
    } catch (error) {
      console.log('❌ .viz-container not found:', error.message);
    }
    
    // Test 2: Capture visualizer + app (what I was doing wrong)
    console.log('🎯 Testing .machine-visualizer > div:last-child (visualizer + app)...');
    try {
      const contentArea = await page.$('.machine-visualizer > div:last-child');
      if (contentArea) {
        await contentArea.screenshot({ path: '${SCREENSHOT_DIR}/test-visualizer-plus-app.png' });
        console.log('✅ Visualizer+app screenshot saved');
      }
    } catch (error) {
      console.log('❌ Content area not found:', error.message);
    }
    
    // Test 3: Try ReactFlow with CORRECT selector
    console.log('🔄 Testing ReactFlow with proper selectors...');
    await picker.selectOption('reactflow');
    await page.waitForTimeout(500);
    
    try {
      await page.waitForSelector('.react-flow__node', { timeout: 3000 });
      console.log('✅ ReactFlow loaded');
      
      // Capture just ReactFlow visualizer
      const reactflowViz = await page.$('.viz-container');
      if (reactflowViz) {
        await reactflowViz.screenshot({ path: '${SCREENSHOT_DIR}/test-reactflow-proper.png' });
        console.log('✅ ReactFlow visualizer-only screenshot saved');
      }
    } catch (error) {
      console.log('❌ ReactFlow test failed:', error.message);
    }
    
    // Test 4: Try ForceGraph with CORRECT selector
    console.log('🔄 Testing ForceGraph with proper selectors...');
    await picker.selectOption('forcegraph');
    await page.waitForTimeout(500);
    
    try {
      await page.waitForSelector('canvas', { timeout: 3000 });
      console.log('✅ ForceGraph loaded');
      
      // Capture just ForceGraph visualizer
      const forcegraphViz = await page.$('.viz-container');
      if (forcegraphViz) {
        await forcegraphViz.screenshot({ path: '${SCREENSHOT_DIR}/test-forcegraph-proper.png' });
        console.log('✅ ForceGraph visualizer-only screenshot saved');
      }
    } catch (error) {
      console.log('❌ ForceGraph test failed:', error.message);
    }
    
    console.log('🎯 Proper visualizer test completed');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
`;

// Run the proper test
async function runProperTest() {
  console.log('🔍 Running PROPER visualizer test...');
  
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['-e', PROPER_SCRIPT], {
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
        reject(new Error(`Test failed with code ${code}`));
      }
    });
  });
}

// Run if called directly
if (require.main === module) {
  runProperTest().catch(console.error);
}

module.exports = { runProperTest };
