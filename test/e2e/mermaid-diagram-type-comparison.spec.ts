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

async function selectVisualizer(page: Page, visualizer: VisualizerTab) {
  const buttonText = 'Mermaid Diagram';
  await page.locator('.visualizer-controls button', { hasText: buttonText }).click();
  await page.waitForTimeout(400);
}

async function selectDiagramType(page: Page, type: DiagramType) {
  // Select diagram type from the "Type:" dropdown in mermaid view
  const optionText = type === 'statechart' ? 'State Chart' : 'Flowchart';
  await page.getByRole('combobox').filter({ hasText: /State Chart|Flowchart/ }).selectOption(optionText);
  await page.waitForTimeout(800); // Give mermaid time to render
}

async function getMermaidContainer(page: Page) {
  return page.locator('#mermaid-1');
}

async function getExampleContainer(page: Page) {
  return page.locator('.space-y-6').first();
}

function screenshotName(theme: Theme, type: DiagramType): string {
  return `${SCREENSHOT_DIR}/${type}-${theme}.png`;
}

test.describe('Mermaid Diagram Type Styling Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await selectVisualizer(page, 'mermaid');
  });

  for (const theme of ['light', 'dark'] as Theme[]) {
    test.describe(`${theme} mode`, () => {
      test.beforeEach(async ({ page }) => {
        await setTheme(page, theme);
      });

      test(`statechart - ${theme}`, async ({ page }) => {
        await selectDiagramType(page, 'statechart');
        const mermaid = await getMermaidContainer(page);
        await mermaid.screenshot({
          path: screenshotName(theme, 'statechart')
        });
      });

      test(`flowchart - ${theme}`, async ({ page }) => {
        await selectDiagramType(page, 'flowchart');
        const mermaid = await getMermaidContainer(page);
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
        await selectDiagramType(page, type);
        const mermaid = await getMermaidContainer(page);
        await mermaid.screenshot({
          path: screenshotName(theme, type)
        });
      }
    }
  });
});
