const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log("Debugging Mermaid toggle rendering...");
    await page.goto("http://localhost:4321/matchina/examples/toggle");
    await page.waitForSelector(".machine-visualizer", { timeout: 5000 });
    
    const picker = await page.$("[data-testid=visualizer-picker]");
    if (picker) {
      await picker.selectOption("mermaid-statechart");
      await page.waitForTimeout(3000);
    }
    
    // Check what is actually rendered
    const vizContainer = await page.$(".viz-container");
    if (vizContainer) {
      const bbox = await vizContainer.boundingBox();
      console.log("Viz container bbox:", bbox);
      
      // Try screenshot of container instead of SVG
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filepath = "/Users/winston/dev/personal/matchina/review/screenshots/mermaid-toggle-container-" + timestamp + ".png";
      
      await vizContainer.screenshot({ path: filepath });
      console.log("✅ Mermaid container saved: " + filepath);
      
      const fs = require("fs");
      const stats = fs.statSync(filepath);
      console.log("File size:", stats.size, "bytes");
    }
    
  } catch (error) {
    console.error("Failed:", error.message);
  } finally {
    await browser.close();
  }
})();
