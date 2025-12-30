import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-combobox';
const SCREENSHOT_DIR = 'review/screenshots/hsm-combobox';

type Theme = 'light' | 'dark';
type MachineMode = 'flat' | 'nested';
type VisualizerTab = 'sketch' | 'mermaid';

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
  const buttonText = visualizer === 'sketch' ? 'Sketch Systems Style' : 'Mermaid Diagram';
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

test.describe('HSM Combobox Visual Review', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
  });

  // Full state walkthrough with UI + Visualizer interplay
  test.describe('State Walkthrough - Sketch Visualizer', () => {
    for (const theme of ['light', 'dark'] as Theme[]) {
      for (const mode of ['flat', 'nested'] as MachineMode[]) {
        test(`${theme} - ${mode}`, async ({ page }) => {
          await setTheme(page, theme);
          await selectMachineMode(page, mode);
          await selectVisualizer(page, 'sketch');
          
          const input = page.locator('input[type="text"]').first();
          const container = await getExampleContainer(page);
          
          // 1. Inactive - verify visualizer shows Inactive highlighted, nested states visible
          await container.screenshot({ 
            path: screenshotName(['sketch', theme, mode, '1-inactive']) 
          });
          
          // 2. Click to activate -> Active.Empty
          await input.click();
          await page.waitForTimeout(400);
          await container.screenshot({ 
            path: screenshotName(['sketch', theme, mode, '2-active-empty']) 
          });
          
          // 3. Type non-matching text -> Active.TextEntry
          await input.fill('xyz');
          await page.waitForTimeout(400);
          await container.screenshot({ 
            path: screenshotName(['sketch', theme, mode, '3-text-entry']) 
          });
          
          // 4. Type matching text -> Active.Suggesting (shows suggestions dropdown)
          await input.fill('react');
          await page.waitForTimeout(400);
          await container.screenshot({ 
            path: screenshotName(['sketch', theme, mode, '4-suggesting']) 
          });
          
          // 5. Arrow down to navigate suggestions
          await input.press('ArrowDown');
          await page.waitForTimeout(300);
          await container.screenshot({ 
            path: screenshotName(['sketch', theme, mode, '5-nav-highlight']) 
          });
          
          // 6. Enter to select -> Active.Empty with tag added
          await input.press('Enter');
          await page.waitForTimeout(400);
          await container.screenshot({ 
            path: screenshotName(['sketch', theme, mode, '6-tag-selected']) 
          });
          
          // 7. Add second tag
          await input.fill('node');
          await page.waitForTimeout(400);
          await input.press('Enter');
          await page.waitForTimeout(400);
          await container.screenshot({ 
            path: screenshotName(['sketch', theme, mode, '7-two-tags']) 
          });
          
          // 8. Escape/blur to deactivate -> Inactive with tags persisted
          await input.press('Escape');
          await page.waitForTimeout(400);
          await container.screenshot({ 
            path: screenshotName(['sketch', theme, mode, '8-deactivated']) 
          });
        });
      }
    }
  });

  // Mermaid visualizer walkthrough (may show errors)
  test.describe('State Walkthrough - Mermaid Visualizer', () => {
    for (const theme of ['light', 'dark'] as Theme[]) {
      for (const mode of ['flat', 'nested'] as MachineMode[]) {
        test(`${theme} - ${mode}`, async ({ page }) => {
          await setTheme(page, theme);
          await selectMachineMode(page, mode);
          await selectVisualizer(page, 'mermaid');
          await page.waitForTimeout(1000);
          
          const input = page.locator('input[type="text"]').first();
          const container = await getExampleContainer(page);
          
          // 1. Inactive
          await container.screenshot({ 
            path: screenshotName(['mermaid', theme, mode, '1-inactive']) 
          });
          
          // 2. Active.Suggesting
          await input.click();
          await input.fill('type');
          await page.waitForTimeout(600);
          await container.screenshot({ 
            path: screenshotName(['mermaid', theme, mode, '2-suggesting']) 
          });
          
          // 3. With tag
          await input.press('Enter');
          await page.waitForTimeout(400);
          await container.screenshot({ 
            path: screenshotName(['mermaid', theme, mode, '3-with-tag']) 
          });
        });
      }
    }
  });
});
