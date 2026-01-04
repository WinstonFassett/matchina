const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("Testing BOTH Mermaid diagrams for toggle...");
    await page.goto("http://localhost:4321/matchina/examples/toggle");
    await page.waitForSelector(".machine-visualizer", { timeout: 5000 });
    
    const picker = await page.$("[data-testid=visualizer-picker]");
    if (picker) {
      // Test statechart
      console.log("Testing mermaid-statechart...");
      await picker.selectOption("mermaid-statechart");
      await page.waitForTimeout(2000);
      
      const statechartContainer = await page.$(".viz-container");
      if (statechartContainer) {
        const timestamp1 = new Date().toISOString().replace(/[:.]/g, "-");
        const filepath1 = "/Users/winston/dev/personal/matchina/review/screenshots/mermaid-statechart-toggle-" + timestamp1 + ".png";
        await statechartContainer.screenshot({ path: filepath1 });
        console.log("✅ Statechart saved: " + filepath1);
        
        const fs1 = require("fs");
        const stats1 = fs1.statSync(filepath1);
        console.log("Statechart size:", stats1.size, "bytes");
      }
      
      // Test flowchart
      console.log("Testing mermaid-flowchart...");
      await picker.selectOption("mermaid-flowchart");
      await page.waitForTimeout(2000);
      
      const flowchartContainer = await page.$(".viz-container");
      if (flowchartContainer) {
        const timestamp2 = new Date().toISOString().replace(/[:.]/g, "-");
        const filepath2 = "/Users/winston/dev/personal/matchina/review/screenshots/mermaid-flowchart-toggle-" + timestamp2 + ".png";
        await flowchartContainer.screenshot({ path: filepath2 });
        console.log("✅ Flowchart saved: " + filepath2);
        
        const fs2 = require("fs");
        const stats2 = fs2.statSync(filepath2);
        console.log("Flowchart size:", stats2.size, "bytes");
      }
    }
    
  } catch (error) {
    console.error("Failed:", error.message);
  } finally {
    await browser.close();
  }
})();
