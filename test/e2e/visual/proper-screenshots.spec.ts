import { test } from "@playwright/test";
import { EXAMPLES } from "../utils/test-helpers";

test.describe("Proper Visualizer Screenshots", () => {
  const visualizerExamples = [
    "hsm-combobox", "traffic-light", "toggle", "counter", "checkout", 
    "auth-flow", "rock-paper-scissors", "async-calculator", "fetcher-advanced",
    "hsm-checkout", "hsm-traffic-light", "promise-machine-fetcher", 
    "traffic-light-extended", "stopwatch-using-data-and-hooks", 
    "stopwatch-using-data-and-transition-functions", "stopwatch-using-external-react-state-and-state-effects",
    "stopwatch-using-react-state-and-effects", "stopwatch-using-react-state-using-lifecycle-instead-of-useeffect",
    "stopwatch-using-transition-hooks-instead-of-useeffect"
  ] as const;

  test("proper visualizer screenshots", async ({ page }) => {
    console.log(`Starting proper screenshot capture for ${visualizerExamples.length} examples...`);
    
    // Set dark theme once
    await page.emulateMedia({ colorScheme: "dark" });
    
    for (const exampleName of visualizerExamples) {
      console.log(`Capturing ${exampleName}...`);
      
      try {
        // Navigate directly
        const config = EXAMPLES[exampleName];
        await page.goto(config.url, { waitUntil: 'domcontentloaded' });
        
        // Wait for page to settle
        await page.waitForTimeout(500);
        
        // Target the FULL visualizer area, not just tiny SVG elements
        let visualizerFound = false;
        const selectors = [
          '[data-testid="machine-visualizer"]',  // Full machine visualizer container
          '.machine-visualizer',                  // Fallback class
          '.react-flow',                          // Full ReactFlow container
          '.viz-container',                       // Visualizer container
          'main',                                // Main content area
          '.VPContent'                           // VitePress content area
        ];
        
        for (const selector of selectors) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 3000 })) {
              console.log(`✓ Found visualizer area for ${exampleName}: ${selector}`);
              await element.screenshot({
                path: `test-results/screenshots/${exampleName}-dark.png`
              });
              visualizerFound = true;
              break;
            }
          } catch (e) {
            // Continue trying
          }
        }
        
        if (!visualizerFound) {
          console.log(`✗ No visualizer area found for ${exampleName}`);
        }
      } catch (error) {
        console.log(`✗ Error capturing ${exampleName}: ${error.message}`);
      }
    }
    
    console.log(`Screenshot capture complete!`);
  });
});
