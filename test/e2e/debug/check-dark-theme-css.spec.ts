import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('check dark theme CSS rules', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    // Find ALL CSS rules with dark theme
    const allRules: string[] = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSStyleRule) {
            if (rule.cssText.includes('data-theme="dark"') && rule.cssText.includes('edgeLabel')) {
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
      rules: allRules
    };
  });

  console.log('DARK THEME EDGE RULES:', JSON.stringify(result, null, 2));
});
