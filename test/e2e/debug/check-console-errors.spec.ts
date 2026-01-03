import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('check for CSS import errors', async ({ page }) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });

  page.on('pageerror', error => errors.push(error.message));

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('CONSOLE ERRORS:', errors);
  console.log('CONSOLE WARNINGS:', warnings);
  
  // Check if CSS is actually loaded
  const cssCheck = await page.evaluate(() => {
    const styles = Array.from(document.styleSheets);
    const themeCSS = styles.find(sheet => sheet.href?.includes('MermaidInspector'));
    return {
      totalStylesheets: styles.length,
      hasThemeCSS: !!themeCSS,
      themeCSSTitle: themeCSS?.title,
      themeCSSText: themeCSS ? Array.from(themeCSS.cssRules).slice(0, 3).map(r => r.cssText) : []
    };
  });

  console.log('CSS CHECK:', JSON.stringify(cssCheck, null, 2));
});
