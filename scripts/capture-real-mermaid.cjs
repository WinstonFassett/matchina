const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log("Capturing REAL Mermaid toggle...");
    await page.goto("http://localhost:4321/matchina/examples/toggle");
    await page.waitForSelector(".machine-visualizer", { timeout: 5000 });
    
    const picker = await page.$("[data-testid=visualizer-picker]");
    if (picker) {
      await picker.selectOption("mermaid-statechart");
      await page.waitForTimeout(2000);
    }
    
    await page.waitForSelector("svg", { timeout: 5000 });
    console.log("Mermaid loaded");
    
    // Try different selectors for Mermaid
    const svg = await page.$("svg");
    if (svg) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filepath = "/Users/winston/dev/personal/matchina/review/screenshots/mermaid-toggle-real-" + timestamp + ".png";
      
      // Wait a bit more for rendering
      await page.waitForTimeout(1000);
      
      await svg.screenshot({ path: filepath });
      console.log("✅ REAL Mermaid toggle saved: " + filepath);
      
      // Check file size
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
