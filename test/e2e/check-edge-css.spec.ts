import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('check edge label CSS rules', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    const edgeLabel = document.querySelector('.edgeLabel p');
    if (!edgeLabel) return { error: 'no edgeLabel p' };
    
    // Check what CSS rules apply to this edge label
    const matchingRules: any[] = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSStyleRule) {
            try {
              if (edgeLabel.matches(rule.selectorText || '')) {
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
      edgeText: edgeLabel.textContent?.trim(),
      edgeComputedColor: window.getComputedStyle(edgeLabel).color,
      edgeComputedFill: window.getComputedStyle(edgeLabel).fill,
      matchingRules: matchingRules.slice(0, 10)
    };
  });

  console.log('EDGE LABEL CSS:', JSON.stringify(result, null, 2));
});
