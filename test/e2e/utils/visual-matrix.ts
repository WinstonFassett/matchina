/**
 * Visual matrix testing utilities
 */

import { test, expect } from '@playwright/test';
import { generateTestMatrix, setTheme, setMode, selectVisualizer, waitForVisualizer, takeScreenshot, EXAMPLES, VISUALIZERS } from './test-helpers';

/**
 * Creates visual regression tests for all combinations
 */
export function createVisualMatrixTests(exampleName: keyof typeof EXAMPLES) {
  const themes = ['light', 'dark'] as const;
  const modes = ['flat', 'nested'] as const;
  const config = EXAMPLES[exampleName];
  
  // Generate all combinations
  const combinations = generateTestMatrix(themes, modes, VISUALIZERS[config.preset]);
  
  test.describe(`${exampleName} Visual Matrix`, () => {
    combinations.forEach(([theme, mode, visualizer]: [string, string, string]) => {
      test(`${theme} - ${mode} - ${visualizer}`, async ({ page }) => {
        // Navigate and setup
        await page.goto(config.url);
        await page.waitForSelector('.space-y-4');
        
        // Set theme
        await setTheme(page, theme);
        
        // Set mode (if example supports it)
        if (exampleName === 'hsm-combobox') {
          await setMode(page, mode);
        }
        
        // Select visualizer
        await selectVisualizer(page, visualizer, config.preset);
        await waitForVisualizer(page, visualizer);
        
        // Visual regression - initial state
        await takeScreenshot(page, `${exampleName}-${theme}-${mode}-${visualizer}-1-initial`);
        
        // Test interactions if combobox
        if (exampleName === 'hsm-combobox') {
          const input = page.locator('input[placeholder*="Type"]');
          await input.fill('type');
          await page.waitForTimeout(400);
          
          await takeScreenshot(page, `${exampleName}-${theme}-${mode}-${visualizer}-2-typing`);
          
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(400);
          
          await takeScreenshot(page, `${exampleName}-${theme}-${mode}-${visualizer}-3-selected`);
        }
      });
    });
  });
}
