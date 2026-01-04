const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("Checking what visualizers actually work for toggle...");
    await page.goto("http://localhost:4321/matchina/examples/toggle");
    await page.waitForSelector(".machine-visualizer", { timeout: 5000 });
    
    const picker = await page.$("[data-testid=visualizer-picker]");
    if (picker) {
      const options = await picker.$$eval("option", opts => 
        opts.map(opt => ({ value: opt.value, text: opt.textContent }))
      );
      console.log("Available options:", options);
      
      // Try each one
      for (const option of options) {
        console.log("Trying:", option.value);
        await picker.selectOption(option.value);
        await page.waitForTimeout(1000);
        
        if (option.value === "reactflow") {
          const nodes = await page.$$(".react-flow__node");
          console.log("ReactFlow nodes found:", nodes.length);
        } else if (option.value === "forcegraph") {
          const canvas = await page.$("canvas");
          console.log("ForceGraph canvas found:", !!canvas);
        } else if (option.value.includes("mermaid")) {
          const svg = await page.$("svg");
          console.log("Mermaid SVG found:", !!svg);
          if (svg) {
            const bbox = await svg.boundingBox();
            console.log("SVG bbox:", bbox);
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed:", error.message);
  } finally {
    await browser.close();
  }
})();
