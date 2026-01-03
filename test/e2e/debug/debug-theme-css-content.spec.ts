import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('debug themeCSS content', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const result = await page.evaluate(() => {
    // Find ALL CSS rules with state-highlight
    const allRules: string[] = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSStyleRule) {
            if (rule.cssText.includes('state-highlight')) {
              allRules.push(rule.cssText);
            }
          }
        }
      } catch (e) {
        // Cross-origin
      }
    }
    
    return {
      totalRules: allRules.length,
      rules: allRules.slice(0, 5)
    };
  });

  console.log('STATE-HIGHLIGHT RULES:', JSON.stringify(result, null, 2));
});
