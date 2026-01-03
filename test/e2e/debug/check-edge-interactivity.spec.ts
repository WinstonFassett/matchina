import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('check edge interactivity classes', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    const edgeLabels = Array.from(document.querySelectorAll('.edgeLabel p'));
    
    return edgeLabels.map(el => ({
      text: el.textContent?.trim(),
      classes: Array.from(el.classList),
      hasEdgeClasses: el.classList.contains('edge-active') || 
                     el.classList.contains('edge-ancestor') || 
                     el.classList.contains('edge-inactive') ||
                     el.classList.contains('edge-interactive'),
      hasMetadata: (el as any)._edge
    }));
  });

  console.log('EDGE INTERACTIVITY:', JSON.stringify(result, null, 2));
});
