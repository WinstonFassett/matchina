import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('check what CSS rules apply to statechart path', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(300);

  // Check if g.active path selector would match
  const result = await page.evaluate(() => {
    const activeG = document.querySelector('g.active');
    if (!activeG) return { error: 'no g.active' };
    
    const pathInActive = activeG.querySelector('path');
    if (!pathInActive) return { error: 'no path in g.active' };
    
    // Check if CSS variable is available
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--sl-color-text-accent');
    
    // Check all stylesheets for rules matching g.active path
    const matchingRules: string[] = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSStyleRule) {
            if (rule.selectorText?.includes('active') && rule.selectorText?.includes('path')) {
              matchingRules.push(`${rule.selectorText}: fill=${rule.style.fill}`);
            }
          }
        }
      } catch (e) {
        // Cross-origin stylesheet
      }
    }
    
    return {
      accentColor,
      pathComputedFill: window.getComputedStyle(pathInActive).fill,
      matchingRulesCount: matchingRules.length,
      sampleRules: matchingRules.slice(0, 5)
    };
  });

  console.log('CSS ANALYSIS:', JSON.stringify(result, null, 2));
});
