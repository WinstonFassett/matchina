const { chromium } = require('playwright');

/**
 * Visual Coding Agent - Dark Theme Capture Script
 * Captures visualizers in dark theme for consistent visual analysis
 */

const SCREENSHOT_DIR = '/Users/winston/dev/personal/matchina/review/screenshots';

async function captureVisualizerDark(visualizer, example, focused = true) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log(`🌙 Capturing ${visualizer} in dark theme...`);
    
    // Navigate to example
    await page.goto(`http://localhost:4321/matchina/examples/${example}`);
    await page.waitForSelector('.machine-visualizer', { timeout: 5000 });
    
    // Dark theme is now global default in playwright.config.ts
    // No manual setup needed - tests start in dark mode automatically
    
    // Select visualizer
    const picker = await page.$('[data-testid="visualizer-picker"]');
    if (picker) {
      await picker.selectOption(visualizer);
      await page.waitForTimeout(1000);
    }
    
    // Wait for visualizer-specific elements
    let waitSelector;
    if (visualizer === 'reactflow') {
      waitSelector = '.react-flow__node';
    } else if (visualizer === 'forcegraph') {
      waitSelector = 'canvas';
    } else if (visualizer === 'mermaid-statechart') {
      waitSelector = '[data-testid="mermaid-statechart-container"]';
    } else if (visualizer === 'mermaid-flowchart') {
      waitSelector = '[data-testid="mermaid-flowchart-container"]';
    }
    
    if (waitSelector) {
      await page.waitForSelector(waitSelector, { timeout: 3000 });
    }
    
    console.log(`✅ ${visualizer} loaded in dark theme`);
    
    // Capture screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${example}-${visualizer}-dark-${focused ? 'focused' : 'full'}-${timestamp}.png`;
    const filepath = SCREENSHOT_DIR + '/' + filename;
    
    let selector;
    if (visualizer === 'reactflow') {
      selector = focused ? '.react-flow__pane' : '.machine-visualizer > div:last-child';
    } else if (visualizer === 'forcegraph') {
      selector = focused ? 'canvas' : '.machine-visualizer > div:last-child';
    } else if (visualizer.includes('mermaid')) {
      selector = focused ? `[data-testid="${visualizer}-container"]` : '.machine-visualizer > div:last-child';
    }
    
    const element = await page.$(selector);
    if (element) {
      await element.screenshot({ path: filepath });
      console.log(`✅ Dark theme screenshot saved: ${filename}`);
      
      // Check file size for validation
      const fs = require('fs');
      const stats = fs.statSync(filepath);
      console.log(`📊 File size: ${stats.size} bytes`);
      
      if (stats.size < 1000) {
        console.log(`⚠️ Warning: Small file size - possible capture issue`);
      }
    } else {
      console.log(`❌ Element not found: ${selector}`);
    }
    
    return filepath;
  } catch (error) {
    console.error(`💥 Capture failed for ${visualizer}:`, error.message);
    return null;
  } finally {
    await browser.close();
  }
}

// Main execution
(async () => {
  console.log('🌙 Visual Coding Agent - Dark Theme Capture');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const visualizer = args[0];
  const example = args[1];
  const focused = args.includes('--focused') || visualizer.includes('mermaid'); // Force focused for Mermaid

  if (!visualizer || !example) {
    console.log('Usage: node capture-visualizer-dark.cjs <visualizer> <example> [focused]');
    console.log('Example: node capture-visualizer-dark.cjs reactflow toggle');
    console.log('Example: node capture-visualizer-dark.cjs forcegraph toggle false');
    process.exit(1);
  }
  
  const result = await captureVisualizerDark(visualizer, example, focused);
  
  if (result) {
    console.log('🎉 Dark theme capture completed successfully');
  } else {
    console.log('❌ Dark theme capture failed');
    process.exit(1);
  }
})();

module.exports = { captureVisualizerDark };
