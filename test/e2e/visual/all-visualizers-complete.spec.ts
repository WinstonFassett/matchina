import { test, expect } from '@playwright/test';

test.describe('All Visualizers Complete Review', () => {
  const themes = ['light', 'dark'] as const;
  const modes = ['flat', 'nested'] as const;
  const visualizers = ['sketch', 'mermaid', 'reactflow'] as const;

  visualizers.forEach(visualizer => {
    themes.forEach(theme => {
      modes.forEach(mode => {
        test(`${theme} - ${mode} - ${visualizer}`, async ({ page }) => {
          await page.goto('/matchina/examples/hsm-combobox');
          
          // Wait for page to load
          await page.waitForSelector('.space-y-4');
          
          // Set theme
          if (theme === 'dark') {
            await page.click('button[aria-label="Toggle dark mode"]');
            await page.waitForTimeout(200);
          }
          
          // Set mode (flat/nested)
          const modeButton = mode === 'flat' ? 'Flattened' : 'Nested (Hierarchical)';
          await page.click(`button:has-text("${modeButton}")`);
          await page.waitForTimeout(400);
          
          // Select visualizer
          const visualizerValue = visualizer === 'sketch' ? 'sketch' :
                             visualizer === 'mermaid' ? 'mermaid-statechart' :
                             'reactflow';
          
          await page.locator('[data-testid="visualizer-picker"]').selectOption(visualizerValue);
          await page.waitForTimeout(400);
          
          // Visual regression test - initial state
          await expect(page.locator('.space-y-4')).toHaveScreenshot(`${visualizer}-${theme}-${mode}-1-inactive.png`);
          
          // Trigger some interactions
          const input = page.locator('input[placeholder*="Type"]');
          await input.fill('type');
          await page.waitForTimeout(400);
          
          // Visual regression test - typing state
          await expect(page.locator('.space-y-4')).toHaveScreenshot(`${visualizer}-${theme}-${mode}-2-typing.png`);
          
          // Select a suggestion
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(400);
          
          // Visual regression test - selected state
          await expect(page.locator('.space-y-4')).toHaveScreenshot(`${visualizer}-${theme}-${mode}-3-selected.png`);
        });
      });
    });
  });
});
