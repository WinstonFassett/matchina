const { spawn } = require("child_process");
const path = require("path");

const SCREENSHOT_DIR = path.join(__dirname, "../review/screenshots");

// Quick test script
const TEST_SCRIPT = `
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("Testing ReactFlow parallel edges...");
    await page.goto("http://localhost:4321/matchina/examples/toggle");
    await page.waitForSelector(".machine-visualizer", { timeout: 5000 });
    
    const picker = await page.$("[data-testid=visualizer-picker]");
    if (picker) {
      await picker.selectOption("reactflow");
      await page.waitForTimeout(1000);
    }
    
    await page.waitForSelector(".react-flow__node", { timeout: 3000 });
    console.log("ReactFlow loaded");
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = "reactflow-parallel-test-" + timestamp + ".png";
    const filepath = " + SCREENSHOT_DIR + / + filename + ";
    
    const contentArea = await page.$(".machine-visualizer > div:last-child");
    if (contentArea) {
      await contentArea.screenshot({ path: filepath });
      console.log("Screenshot saved: " + filename);
      console.log("Path: " + filepath);
    }
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
`;

const child = spawn("node", ["-e", TEST_SCRIPT], {
  cwd: process.cwd(),
  stdio: ["pipe", "pipe", "pipe"]
});

child.stdout.on("data", (data) => {
  console.log(data.toString().trim());
});

child.stderr.on("data", (data) => {
  console.error("Error:", data.toString());
});

child.on("close", (code) => {
  if (code === 0) {
    console.log("Test completed");
  } else {
    console.error("Failed with code:", code);
    process.exit(1);
  }
});
