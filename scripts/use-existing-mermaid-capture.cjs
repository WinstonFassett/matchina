const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("Using existing Mermaid capture approach...");
    await page.goto("http://localhost:4321/matchina/examples/toggle");
    await page.waitForSelector(".machine-visualizer", { timeout: 5000 });
    
    // Select Mermaid State Chart visualizer using test ID
    await page.getByTestId("visualizer-controls").getByRole("combobox").selectOption("mermaid-statechart");
    await page.waitForTimeout(500);
    
    // Wait for mermaid container with test ID
    const mermaidContainer = page.getByTestId("mermaid-statechart-container");
    await mermaidContainer.waitFor({ state: "visible", timeout: 5000 });
    
    // Take screenshot of the actual Mermaid diagram
    const timestamp1 = new Date().toISOString().replace(/[:.]/g, "-");
    const filepath1 = "/Users/winston/dev/personal/matchina/review/screenshots/mermaid-statechart-toggle-real-" + timestamp1 + ".png";
    await mermaidContainer.screenshot({ path: filepath1 });
    console.log("✅ Real Mermaid statechart saved: " + filepath1);
    
    // Try flowchart too
    await page.getByTestId("visualizer-controls").getByRole("combobox").selectOption("mermaid-flowchart");
    await page.waitForTimeout(500);
    
    const flowchartContainer = page.getByTestId("mermaid-flowchart-container");
    await flowchartContainer.waitFor({ state: "visible", timeout: 5000 });
    
    const timestamp2 = new Date().toISOString().replace(/[:.]/g, "-");
    const filepath2 = "/Users/winston/dev/personal/matchina/review/screenshots/mermaid-flowchart-toggle-real-" + timestamp2 + ".png";
    await flowchartContainer.screenshot({ path: filepath2 });
    console.log("✅ Real Mermaid flowchart saved: " + filepath2);
    
  } catch (error) {
    console.error("Failed:", error.message);
  } finally {
    await browser.close();
  }
})();
