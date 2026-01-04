const { chromium } = require('playwright');

async function checkReactFlowCurvature() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Checking ReactFlow curvature application...');
    
    // Navigate to toggle example
    await page.goto('http://localhost:4321/matchina/examples/toggle');
    
    // Wait for page to load and check what's available
    await page.waitForTimeout(2000);
    
    // Try different selectors
    const selectors = ['.react-flow__node', '.react-flow', '[data-testid="reactflow-container"]'];
    let foundSelector = null;
    
    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        foundSelector = selector;
        console.log(`✅ Found element with selector: ${selector}`);
        break;
      }
    }
    
    if (!foundSelector) {
      console.log('❌ No ReactFlow elements found, checking page content...');
      const content = await page.content();
      console.log('Page title:', await page.title());
      // Take screenshot to see what's actually on the page
      await page.screenshot({ path: '/Users/winston/dev/personal/matchina/review/screenshots/debug-page.png' });
      console.log('📸 Debug screenshot saved');
      return;
    }
    
    // Listen for console logs
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
      if (msg.text().includes('ReactFlow Edge Curvature')) {
        console.log('✅ Found curvature log:', msg.text());
      }
    });
    
    // Wait a bit for any console logs
    await page.waitForTimeout(2000);
    
    // Check if we found the curvature log
    const curvatureLogs = consoleMessages.filter(msg => msg.includes('ReactFlow Edge Curvature'));
    
    if (curvatureLogs.length > 0) {
      console.log('✅ Curvature is being applied:');
      curvatureLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('❌ No curvature logs found - change may not be applied');
      console.log('📋 All console messages:');
      consoleMessages.forEach(msg => console.log(`  ${msg}`));
    }
    
    // Take a screenshot to verify visual state
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `curvature-check-${timestamp}.png`;
    await page.screenshot({ path: `/Users/winston/dev/personal/matchina/review/screenshots/${filename}` });
    console.log(`📸 Screenshot saved: ${filename}`);
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    await browser.close();
  }
}

checkReactFlowCurvature();
