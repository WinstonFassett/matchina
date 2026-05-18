#!/usr/bin/env node

import { chromium } from 'playwright';

const EXAMPLES = {
  "hsm-combobox": {
    preset: "hierarchical",
    defaultViz: "sketch",
    url: "http://localhost:4321/matchina/examples/hsm-combobox",
  },
  "traffic-light": {
    preset: "complex",
    defaultViz: "reactflow",
    url: "http://localhost:4321/matchina/examples/traffic-light",
  },
  "toggle": {
    preset: "simple",
    defaultViz: "mermaid-statechart",
    url: "http://localhost:4321/matchina/examples/toggle",
  },
  "counter": {
    preset: "simple",
    defaultViz: "mermaid-statechart",
    url: "http://localhost:4321/matchina/examples/counter",
  },
  "checkout": {
    preset: "complex",
    defaultViz: "reactflow",
    url: "http://localhost:4321/matchina/examples/checkout",
  },
  "auth-flow": {
    preset: "complex",
    defaultViz: "reactflow",
    url: "http://localhost:4321/matchina/examples/auth-flow",
  },
  "rock-paper-scissors": {
    preset: "simple",
    defaultViz: "reactflow",
    url: "http://localhost:4321/matchina/examples/rock-paper-scissors",
  },
  "async-calculator": {
    preset: "complex",
    defaultViz: "reactflow",
    url: "http://localhost:4321/matchina/examples/async-calculator",
  },
  "fetcher-advanced": {
    preset: "complex",
    defaultViz: "reactflow",
    url: "http://localhost:4321/matchina/examples/fetcher-advanced",
  },
  "hsm-checkout": {
    preset: "hierarchical",
    defaultViz: "sketch",
    url: "http://localhost:4321/matchina/examples/hsm-checkout",
  },
  "hsm-traffic-light": {
    preset: "hierarchical",
    defaultViz: "sketch",
    url: "http://localhost:4321/matchina/examples/hsm-traffic-light",
  },
  "promise-machine-fetcher": {
    preset: "complex",
    defaultViz: "reactflow",
    url: "http://localhost:4321/matchina/examples/promise-machine-fetcher",
  },
  "traffic-light-extended": {
    preset: "complex",
    defaultViz: "reactflow",
    url: "http://localhost:4321/matchina/examples/traffic-light-extended",
  },
  "stopwatch-using-data-and-hooks": {
    preset: "simple",
    defaultViz: "mermaid-statechart",
    url: "http://localhost:4321/matchina/examples/stopwatch-using-data-and-hooks",
  },
  "stopwatch-using-data-and-transition-functions": {
    preset: "simple",
    defaultViz: "mermaid-statechart",
    url: "http://localhost:4321/matchina/examples/stopwatch-using-data-and-transition-functions",
  },
  "stopwatch-using-external-react-state-and-state-effects": {
    preset: "simple",
    defaultViz: "mermaid-statechart",
    url: "http://localhost:4321/matchina/examples/stopwatch-using-external-react-state-and-state-effects",
  },
  "stopwatch-using-react-state-and-effects": {
    preset: "simple",
    defaultViz: "mermaid-statechart",
    url: "http://localhost:4321/matchina/examples/stopwatch-using-react-state-and-effects",
  },
  "stopwatch-using-react-state-using-lifecycle-instead-of-useeffect": {
    preset: "simple",
    defaultViz: "mermaid-statechart",
    url: "http://localhost:4321/matchina/examples/stopwatch-using-react-state-using-lifecycle-instead-of-useeffect",
  },
  "stopwatch-using-transition-hooks-instead-of-useeffect": {
    preset: "simple",
    defaultViz: "mermaid-statechart",
    url: "http://localhost:4321/matchina/examples/stopwatch-using-transition-hooks-instead-of-useeffect",
  },
} as const;

async function captureDarkScreenshots() {
  console.log('Starting dark mode screenshot capture...');
  
  const visualizerExamples = [
    "hsm-combobox", "traffic-light", "toggle", "counter", "checkout", 
    "auth-flow", "rock-paper-scissors", "async-calculator", "fetcher-advanced",
    "hsm-checkout", "hsm-traffic-light", "promise-machine-fetcher", 
    "traffic-light-extended", "stopwatch-using-data-and-hooks", 
    "stopwatch-using-data-and-transition-functions", "stopwatch-using-external-react-state-and-state-effects",
    "stopwatch-using-react-state-and-effects", "stopwatch-using-react-state-using-lifecycle-instead-of-useeffect",
    "stopwatch-using-transition-hooks-instead-of-useeffect"
  ] as const;

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set dark theme once
  await page.emulateMedia({ colorScheme: 'dark' });

  console.log(`Capturing ${visualizerExamples.length} examples...`);

  for (const exampleName of visualizerExamples) {
    try {
      console.log(`Capturing ${exampleName}...`);
      const config = EXAMPLES[exampleName];
      console.log(`  Navigating to: ${config.url}`);
      
      await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      const title = await page.title();
      if (title.includes('404') || title.includes('Not Found') || title.includes('Page not found')) {
        console.log(`✗ 404 page detected for ${exampleName}, skipping...`);
        continue;
      }
      
      await page.waitForTimeout(1000);
    
      let visualizerFound = false;
      const selectors = [
        '[data-testid="machine-visualizer"]',
        '.machine-visualizer',
        '.react-flow',
        '.viz-container',
        'main',
        '.VPContent'
      ];
      
      for (const selector of selectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 5000 })) {
            console.log(`✓ Found visualizer for ${exampleName}: ${selector}`);
            await element.screenshot({
              path: `test-results/screenshots/${exampleName}-dark.png`
            });
            visualizerFound = true;
            break;
          }
        } catch (e) {
        }
      }
      
      if (!visualizerFound) {
        console.log(`✗ No visualizer found for ${exampleName}`);
      }
    } catch (error) {
      console.log(`✗ Error capturing ${exampleName}: ${error.message}`);
    }
  }

  await browser.close();
  console.log('Screenshot capture complete!');
}

captureDarkScreenshots().catch(console.error);
