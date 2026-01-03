import { test, expect } from '@playwright/test';
import { setTheme, setMode, selectVisualizer, waitForVisualizer, gotoExample, EXAMPLES, SELECTORS } from '../utils/test-helpers';

test.describe('All Visualizers Complete Review', () => {
  const config = EXAMPLES['hsm-combobox'];
  const visualizers = ['sketch', 'reactflow']; // Only available visualizers
  const modes = ['flat', 'nested'];
  const themes = ['light', 'dark']; // Test both themes using color scheme

  themes.forEach(theme => {
    modes.forEach(mode => {
      visualizers.forEach(visualizer => {
        test(`${theme} - ${mode} - ${visualizer}`, async ({ page }) => {
          await gotoExample(page, 'hsm-combobox');
          
          await setTheme(page, theme as 'light' | 'dark');
          await setMode(page, mode as 'flat' | 'nested');
          
          await selectVisualizer(page, visualizer, config.preset);
          await waitForVisualizer(page, visualizer);
          
          // Visual regression - initial state (focused on interactive area)
          await expect(page.locator(SELECTORS.fullInteractiveArea).first()).toHaveScreenshot(`${visualizer}-${theme}-${mode}-1-inactive.png`);
          
          // Trigger interactions
          const input = page.locator('input[placeholder*="Type"]');
          await input.fill('type');
          await page.waitForTimeout(400);
          
          // Visual regression - typing state (focused)
          await expect(page.locator(SELECTORS.fullInteractiveArea).first()).toHaveScreenshot(`${visualizer}-${theme}-${mode}-2-typing.png`);
          
          // Select a suggestion
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(400);
          
          // Visual regression - selected state (focused)
          await expect(page.locator(SELECTORS.fullInteractiveArea).first()).toHaveScreenshot(`${visualizer}-${theme}-${mode}-3-selected.png`);
        });
      });
    });
  });
});
