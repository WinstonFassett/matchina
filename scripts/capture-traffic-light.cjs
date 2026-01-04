const { chromium } = require("playwright");

const SCREENSHOT_DIR = "/Users/winston/dev/personal/matchina/review/screenshots";

async function captureTrafficLightVisualizers() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("Capturing traffic-light example with complex preset...");
    await page.goto("http://localhost:4321/matchina/examples/traffic-light");
    await page.waitForSelector(".machine-visualizer", { timeout: 5000 });
    
    const visualizers = ["reactflow", "forcegraph", "mermaid-statechart"];
    const filenames = ["traffic-light-reactflow-parallel", "traffic-light-forcegraph-parallel", "traffic-light-mermaid-parallel"];
    
    for (let i = 0; i < visualizers.length; i++) {
      const visualizer = visualizers[i];
      const filename = filenames[i];
      
      console.log("Switching to " + visualizer + "...");
      
      const picker = await page.$("[data-testid=visualizer-picker]");
      if (picker) {
        await picker.selectOption(visualizer);
        await page.waitForTimeout(1000);
        
        let loaded = false;
        if (visualizer === "reactflow") {
          await page.waitForSelector(".react-flow__node", { timeout: 3000 });
          loaded = true;
        } else if (visualizer === "forcegraph") {
          await page.waitForSelector("canvas", { timeout: 3000 });
          loaded = true;
        } else if (visualizer === "mermaid-statechart") {
          await page.waitForSelector("svg", { timeout: 3000 });
          loaded = true;
        }
        
        if (loaded) {
          console.log(visualizer + " loaded successfully");
          
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const filepath = SCREENSHOT_DIR + "/" + filename + "-" + timestamp + ".png";
          
          if (visualizer === "reactflow") {
            const reactFlowPane = await page.$(".react-flow__pane");
            if (reactFlowPane) {
              await reactFlowPane.screenshot({ path: filepath });
              console.log("✅ " + filename + " screenshot saved");
            }
          } else if (visualizer === "forcegraph") {
            const canvas = await page.$("canvas");
            if (canvas) {
              await canvas.screenshot({ path: filepath });
              console.log("✅ " + filename + " screenshot saved");
            }
          } else if (visualizer === "mermaid-statechart") {
            const svg = await page.$("svg");
            if (svg) {
              await svg.screenshot({ path: filepath });
              console.log("✅ " + filename + " screenshot saved");
            }
          }
        } else {
          console.log("❌ " + visualizer + " failed to load");
        }
      }
    }
    
  } catch (error) {
    console.error("💥 Capture failed:", error.message);
  } finally {
    await browser.close();
  }
}

captureTrafficLightVisualizers();
