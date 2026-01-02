import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('debug text color selectors', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(300);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    const activeG = document.querySelector('g.active');
    if (!activeG) return { error: 'no active g' };
    
    // Find ALL text elements in and around the active node
    const textElements = {
      svgText: activeG.querySelector('text'),
      foreignObject: activeG.querySelector('foreignObject'),
      p: activeG.querySelector('p'),
      span: activeG.querySelector('span'),
      nodeLabel: activeG.querySelector('.nodeLabel'),
      nodeLabelP: activeG.querySelector('.nodeLabel p'),
      parentText: activeG.parentElement?.querySelector('text'),
      parentP: activeG.parentElement?.querySelector('p'),
    };
    
    const colors: any = {};
    Object.entries(textElements).forEach(([key, el]) => {
      if (el) {
        colors[key] = {
          tag: el.tagName,
          computedColor: el.tagName === 'text' ? window.getComputedStyle(el).fill : window.getComputedStyle(el).color,
          classes: Array.from(el.classList)
        };
      }
    });
    
    return {
      activeGId: activeG.id,
      activeGClasses: Array.from(activeG.classList),
      textElements: colors
    };
  });

  console.log('TEXT DEBUG:', JSON.stringify(result, null, 2));
});
