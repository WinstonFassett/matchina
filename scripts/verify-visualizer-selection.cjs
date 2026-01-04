const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Verifying visualizer selection for toggle example...');
    await page.goto('http://localhost:4321/matchina/examples/toggle');
    await page.waitForSelector('.machine-visualizer', { timeout: 5000 });
    
    // Check what visualizers are available
    const picker = await page.$('[data-testid="visualizer-picker"]');
    if (picker) {
      const options = await picker.$$eval('option', options => 
        options.map(option => ({ value: option.value, text: option.textContent }))
      );
      console.log('Available visualizers:', options);
      
      // Check current selection
      const currentValue = await picker.getAttribute('value');
      console.log('Current visualizer:', currentValue);
      
      // Try to select ReactFlow
      console.log('Trying to select ReactFlow...');
      await picker.selectOption('reactflow');
      await page.waitForTimeout(1000);
      
      const newValue = await picker.getAttribute('value');
      console.log('After ReactFlow selection:', newValue);
      
      // Try to select ForceGraph
      console.log('Trying to select ForceGraph...');
      await picker.selectOption('forcegraph');
      await page.waitForTimeout(1000);
      
      const forceGraphValue = await picker.getAttribute('value');
      console.log('After ForceGraph selection:', forceGraphValue);
      
    } else {
      console.log('❌ No visualizer picker found');
    }
    
  } catch (error) {
    console.error('💥 Verification failed:', error.message);
  } finally {
    await browser.close();
  }
})();
