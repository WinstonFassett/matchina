import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('check actual mermaid container ID', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    const mermaidContainer = document.querySelector('[id^="mermaid-"]');
    return {
      id: mermaidContainer?.id || 'no-mermaid-container',
      tagName: mermaidContainer?.tagName || 'no-element'
    };
  });

  console.log('MERMAID ID:', JSON.stringify(result, null, 2));
});
