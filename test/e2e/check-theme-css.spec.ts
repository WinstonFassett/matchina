import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('check if themeCSS contains our rules', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const result = await page.evaluate(() => {
    // Check if our CSS rules are in any stylesheet
    const allRules: string[] = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSStyleRule) {
            if (rule.selectorText?.includes('div[id^="mermaid-"]') && rule.selectorText?.includes('g.active')) {
              allRules.push(rule.cssText);
            }
          }
        }
      } catch (e) {
        // Cross-origin
      }
    }
    
    return {
      foundRules: allRules.length,
      sampleRules: allRules.slice(0, 3)
    };
  });

  console.log('THEME CSS RULES:', JSON.stringify(result, null, 2));
});
