import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('check CSS specificity issues', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    // Find the path in the active state
    const activeG = document.querySelector('g.active');
    if (!activeG) return { error: 'no g.active' };
    
    const path = activeG.querySelector('path');
    if (!path) return { error: 'no path in g.active' };
    
    // Get ALL CSS rules that apply to this path
    const rules: any[] = [];
    try {
      for (const sheet of document.styleSheets) {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSStyleRule) {
            try {
              if (path.matches(rule.selectorText || '')) {
                rules.push({
                  selector: rule.selectorText,
                  fill: rule.style.fill,
                  stroke: rule.style.stroke,
                  specificity: rule.selectorText ? rule.selectorText.split(' ').length : 0
                });
              }
            } catch (e) {
              // Invalid selector
            }
          }
        }
      }
    } catch (e) {
      // Cross-origin or other error
    }
    
    return {
      pathComputedFill: window.getComputedStyle(path).fill,
      pathComputedStroke: window.getComputedStyle(path).stroke,
      matchingRules: rules.sort((a, b) => b.specificity - a.specificity).slice(0, 10)
    };
  });

  console.log('SPECIFICITY ANALYSIS:', JSON.stringify(result, null, 2));
});
