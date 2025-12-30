import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-combobox';
const SCREENSHOT_DIR = 'review/screenshots/all-visualizers';

type Theme = 'light' | 'dark';
type MachineMode = 'flat' | 'nested';
type VisualizerTab = 'sketch' | 'mermaid' | 'reactflow';

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

async function selectMachineMode(page: Page, mode: MachineMode) {
  const buttonText = mode === 'flat' ? 'Flattened' : 'Nested (Hierarchical)';
  await page.locator('button', { hasText: buttonText }).click();
  await page.waitForTimeout(400);
}

async function selectVisualizer(page: Page, visualizer: VisualizerTab) {
  const buttonText = visualizer === 'sketch' ? 'Sketch Systems Style' : 
                   visualizer === 'mermaid' ? 'Mermaid Diagram' : 'React Flow';
  await page.locator('.visualizer-controls button', { hasText: buttonText }).click();
  await page.waitForTimeout(400);
}

// The entire example component: mode toggle + widget + visualizer
async function getExampleContainer(page: Page) {
  return page.locator('.space-y-6').first();
}

function screenshotName(parts: string[]): string {
  return `${SCREENSHOT_DIR}/${parts.join('-')}.png`;
}

test.describe('All Visualizers Review', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
  });

  // Test all visualizers in both themes and modes
  for (const theme of ['light', 'dark'] as Theme[]) {
    for (const mode of ['flat', 'nested'] as MachineMode[]) {
      for (const visualizer of ['sketch', 'mermaid', 'reactflow'] as VisualizerTab[]) {
        test(`${theme} - ${mode} - ${visualizer}`, async ({ page }) => {
          await setTheme(page, theme);
          await selectMachineMode(page, mode);
          await selectVisualizer(page, visualizer);
          
          const input = page.locator('input[type="text"]').first();
          const container = await getExampleContainer(page);
          
          // Wait for visualizer to load
          await page.waitForTimeout(1000);
          
          // 1. Inactive state
          await container.screenshot({ 
            path: screenshotName([visualizer, theme, mode, '1-inactive']) 
          });
          
          // 2. Active state
          await input.click();
          await page.waitForTimeout(400);
          await container.screenshot({ 
            path: screenshotName([visualizer, theme, mode, '2-active']) 
          });
          
          // 3. With content
          await input.fill('react');
          await page.waitForTimeout(400);
          await container.screenshot({ 
            path: screenshotName([visualizer, theme, mode, '3-content']) 
          });
          
          // 4. With tag
          await input.press('Enter');
          await page.waitForTimeout(400);
          await container.screenshot({ 
            path: screenshotName([visualizer, theme, mode, '4-tag']) 
          });
        });
      }
    }
  }
});
