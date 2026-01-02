import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('final verification - text color and edge labels', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(300);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    // Check active state text color
    const stateHighlight = document.querySelector('.state-highlight');
    const textInActive = stateHighlight?.querySelector('text');
    const pInActive = stateHighlight?.querySelector('p') || stateHighlight?.querySelector('span.nodeLabel p');
    
    // Check edge label colors
    const edgeLabels = Array.from(document.querySelectorAll('.edgeLabel p')).slice(0, 3);
    const edgeInfo = edgeLabels.map(el => ({
      text: el.textContent?.trim(),
      computedColor: window.getComputedStyle(el).color,
      classes: Array.from(el.classList)
    }));

    return {
      activeNodeText: {
        textColor: textInActive ? window.getComputedStyle(textInActive).fill : null,
        pColor: pInActive ? window.getComputedStyle(pInActive).color : null
      },
      edgeLabels: edgeInfo
    };
  });

  console.log('FINAL VERIFICATION:', JSON.stringify(result, null, 2));

  await page.screenshot({ 
    path: 'review/screenshots/final-verification.png',
    clip: { x: 200, y: 200, width: 800, height: 600 }
  });
});
