import { test, expect } from '@playwright/test';
import { setTheme, setMode, selectVisualizer, waitForVisualizer, gotoExample, EXAMPLES } from '../utils/test-helpers';

test.describe('All Visualizers Complete Review', () => {
  const themes = ['light', 'dark'] as const;
  const modes = ['flat', 'nested'] as const;
  const visualizers = ['sketch', 'mermaid', 'reactflow'] as const;
  const config = EXAMPLES['hsm-combobox'];

  visualizers.forEach(visualizer => {
    themes.forEach(theme => {
      modes.forEach(mode => {
        test(`${theme} - ${mode} - ${visualizer}`, async ({ page }) => {
          await gotoExample(page, 'hsm-combobox');
          
          await setTheme(page, theme);
          await setMode(page, mode);
          
          await selectVisualizer(page, visualizer, config.preset);
          await waitForVisualizer(page, visualizer);
          
          // Visual regression - initial state
          await expect(page.locator('.space-y-4').first()).toHaveScreenshot(`${visualizer}-${theme}-${mode}-1-inactive.png`);
          
          // Trigger interactions
          const input = page.locator('input[placeholder*="Type"]');
          await input.fill('type');
          await page.waitForTimeout(400);
          
          // Visual regression - typing state
          await expect(page.locator('.space-y-4').first()).toHaveScreenshot(`${visualizer}-${theme}-${mode}-2-typing.png`);
          
          // Select a suggestion
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(400);
          
          // Visual regression - selected state
          await expect(page.locator('.space-y-4').first()).toHaveScreenshot(`${visualizer}-${theme}-${mode}-3-selected.png`);
        });
      });
    });
  });
});
