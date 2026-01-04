const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("Capturing proper Mermaid toggle...");
    await page.goto("http://localhost:4321/matchina/examples/toggle");
    await page.waitForSelector(".machine-visualizer", { timeout: 5000 });
    
    const picker = await page.$("[data-testid=visualizer-picker]");
    if (picker) {
      await picker.selectOption("mermaid-statechart");
      await page.waitForTimeout(1000);
    }
    
    await page.waitForSelector("svg", { timeout: 3000 });
    console.log("Mermaid loaded");
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filepath = "/Users/winston/dev/personal/matchina/review/screenshots/mermaid-toggle-proper-" + timestamp + ".png";
    
    const svg = await page.$("svg");
    if (svg) {
      await svg.screenshot({ path: filepath });
      console.log("✅ Proper Mermaid toggle saved: " + filepath);
    }
  } catch (error) {
    console.error("Failed:", error.message);
  } finally {
    await browser.close();
  }
})();
