const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/Users/winston/dev/personal/matchina/review/screenshots';

async function captureMermaidSVG(example, type) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log(`🎯 Capturing Mermaid ${type} SVG for ${example}...`);
    
    // Navigate to the example
    await page.goto(`http://localhost:4321/matchina/examples/${example}`);
    
    // Wait for the Mermaid container
    const containerSelector = `[data-testid="mermaid-${type}-container"]`;
    await page.waitForSelector(containerSelector, { timeout: 5000 });
    
    // Get the SVG element directly
    const svgElement = await page.$(`${containerSelector} svg`);
    if (!svgElement) {
      throw new Error(`No SVG found in ${containerSelector}`);
    }
    
    // Capture just the SVG
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${example}-mermaid-${type}-svg-${timestamp}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    
    await svgElement.screenshot({ path: filepath });
    
    console.log(`✅ Mermaid ${type} SVG captured: ${filename}`);
    
    // Check file size
    const stats = fs.statSync(filepath);
    console.log(`📊 File size: ${(stats.size / 1024).toFixed(1)}KB`);
    
    return filename;
    
  } catch (error) {
    console.error(`💥 Capture failed: ${error.message}`);
    return null;
  } finally {
    await browser.close();
  }
}

// Main execution
if (require.main === module) {
  const example = process.argv[2];
  const type = process.argv[3]; // 'statechart' or 'flowchart'
  
  if (!example || !type) {
    console.log('Usage: node capture-mermaid-svg.cjs <example> <type>');
    console.log('Example: node capture-mermaid-svg.cjs toggle statechart');
    process.exit(1);
  }
  
  captureMermaidSVG(example, type).then(result => {
    if (result) {
      console.log('🎉 SVG capture completed successfully');
      process.exit(0);
    } else {
      console.log('❌ SVG capture failed');
      process.exit(1);
    }
  });
}

module.exports = { captureMermaidSVG };
