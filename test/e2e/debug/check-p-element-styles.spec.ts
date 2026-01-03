import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('check p element styles in state-highlight', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(300);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    const stateHighlight = document.querySelector('.state-highlight');
    if (!stateHighlight) return { error: 'no state-highlight' };
    
    const p = stateHighlight.querySelector('p');
    if (!p) return { error: 'no p in state-highlight' };
    
    // Check what CSS rules apply to this p element
    const matchingRules: any[] = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSStyleRule) {
            try {
              if (p.matches(rule.selectorText || '')) {
                matchingRules.push({
                  selector: rule.selectorText,
                  color: rule.style.color,
                  fill: rule.style.fill
                });
              }
            } catch (e) {
              // Invalid selector
            }
          }
        }
      } catch (e) {
        // Cross-origin
      }
    }
    
    return {
      pText: p.textContent?.trim(),
      pComputedColor: window.getComputedStyle(p).color,
      matchingRules: matchingRules.slice(0, 5)
    };
  });

  console.log('P ELEMENT STYLES:', JSON.stringify(result, null, 2));
});
