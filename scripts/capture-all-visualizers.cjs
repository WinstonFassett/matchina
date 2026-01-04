const { chromium } = require("playwright");

const SCREENSHOT_DIR = "/Users/winston/dev/personal/matchina/review/screenshots";

async function captureVisualizer(visualizer, filename) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("Capturing " + visualizer + "...");
    await page.goto("http://localhost:4321/matchina/examples/toggle");
    await page.waitForSelector(".machine-visualizer", { timeout: 5000 });
    
    const picker = await page.$("[data-testid=visualizer-picker]");
    if (picker) {
      await picker.selectOption(visualizer);
      await page.waitForTimeout(1000);
    }
    
    if (visualizer === "reactflow") {
      await page.waitForSelector(".react-flow__node", { timeout: 3000 });
    } else if (visualizer === "forcegraph") {
      await page.waitForSelector("canvas", { timeout: 3000 });
    } else if (visualizer === "mermaid-statechart") {
      await page.waitForSelector("svg", { timeout: 3000 });
    }
    
    console.log(visualizer + " loaded");
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filepath = SCREENSHOT_DIR + "/" + filename + "-" + timestamp + ".png";
    
    if (visualizer === "reactflow") {
      const reactFlowPane = await page.$(".react-flow__pane");
      if (reactFlowPane) {
        await reactFlowPane.screenshot({ path: filepath });
        console.log("Screenshot saved: " + filename);
      }
    } else if (visualizer === "forcegraph") {
      const canvas = await page.$("canvas");
      if (canvas) {
        await canvas.screenshot({ path: filepath });
        console.log("Screenshot saved: " + filename);
      }
    } else if (visualizer === "mermaid-statechart") {
      const svg = await page.$("svg");
      if (svg) {
        await svg.screenshot({ path: filepath });
        console.log("Screenshot saved: " + filename);
      }
    }
    
    return filepath;
  } catch (error) {
    console.error(visualizer + " failed:", error.message);
    return null;
  } finally {
    await browser.close();
  }
}

(async () => {
  console.log("Capturing all visualizers for comparison...");
  
  const visualizers = ["reactflow", "forcegraph", "mermaid-statechart"];
  const filenames = ["reactflow-parallel", "forcegraph-parallel", "mermaid-parallel"];
  
  for (let i = 0; i < visualizers.length; i++) {
    const path = await captureVisualizer(visualizers[i], filenames[i]);
    if (path) {
      console.log(visualizers[i] + ": " + path);
    }
  }
  
  console.log("All visualizers captured!");
})();
