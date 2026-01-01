import { test, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-combobox';
const SCREENSHOT_DIR = 'review/screenshots/mermaid-comparison';

type Theme = 'light' | 'dark';
type DiagramType = 'statechart' | 'flowchart';
type VisualizerTab = 'mermaid';

async function setTheme(page: Page, theme: Theme) {
  await page.evaluate((t: Theme) => {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, theme);
  await page.waitForTimeout(200);
}

async function selectVisualizer(page: Page, type: DiagramType) {
  // Use the test ID we added to VizPicker
  try {
    const dropdown = page.locator('[data-testid="visualizer-picker"]');
    await dropdown.waitFor({ state: 'visible', timeout: 1000 });
    
    // Select the appropriate option using the correct value from VISUALIZERS
    const optionValue = type === 'statechart' ? 'mermaid-statechart' : 'mermaid-flowchart';
    await dropdown.selectOption(optionValue);
  } catch (error) {
    console.error('Failed to select visualizer:', error);
    throw error;
  }
}

async function selectDiagramType(page: Page, type: DiagramType) {
  // In the new UI, diagram type is selected in the main dropdown, not a separate combobox
  // This function is no longer needed but kept for compatibility
  await page.waitForTimeout(100);
}

async function getMermaidContainer(page: Page) {
  // Try different possible selectors for Mermaid container
  try {
    return page.locator('#mermaid-1');
  } catch {
    // Try alternative selectors
    return page.locator('.mermaid').first();
  }
}

async function getExampleContainer(page: Page) {
  return page.locator('.space-y-6').first();
}

function screenshotName(theme: Theme, type: DiagramType): string {
  return `${SCREENSHOT_DIR}/${type}-${theme}.png`;
}

test.describe('Mermaid Diagram Type Styling Comparison', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await page.goto(BASE_URL);
      await page.waitForLoadState('domcontentloaded', { timeout: 2000 });
      await page.waitForTimeout(200);
      
      await selectVisualizer(page, 'statechart'); // Default to statechart
    } catch (error) {
      console.error('Test setup failed:', error);
      throw error;
    }
  });

  for (const theme of ['light', 'dark'] as Theme[]) {
    test.describe(`${theme} mode`, () => {
      test.beforeEach(async ({ page }) => {
        await setTheme(page, theme);
      });

      test(`statechart - ${theme}`, async ({ page }) => {
        await selectVisualizer(page, 'statechart');
        await page.waitForTimeout(500); // Wait for Mermaid to render
        const mermaid = await getMermaidContainer(page);
        await mermaid.waitFor({ state: 'visible', timeout: 2000 });
        await mermaid.screenshot({
          path: screenshotName(theme, 'statechart')
        });
      });

      test(`flowchart - ${theme}`, async ({ page }) => {
        await selectVisualizer(page, 'flowchart');
        await page.waitForTimeout(500); // Wait for Mermaid to render
        const mermaid = await getMermaidContainer(page);
        await mermaid.waitFor({ state: 'visible', timeout: 2000 });
        await mermaid.screenshot({
          path: screenshotName(theme, 'flowchart')
        });
      });
    });
  }

  // Comparison test - captures all 4 combinations in one run
  test('capture all combinations', async ({ page }) => {
    for (const theme of ['light', 'dark'] as Theme[]) {
      await setTheme(page, theme);

      for (const type of ['statechart', 'flowchart'] as DiagramType[]) {
        await selectVisualizer(page, type);
        const mermaid = await getMermaidContainer(page);
        await mermaid.waitFor({ state: 'visible', timeout: 2000 });
        await mermaid.screenshot({
          path: screenshotName(theme, type)
        });
      }
    }
  });
});
