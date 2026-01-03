import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('check computed styles on active state', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Nested (statechart)
  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) {
    await nestedButton.click();
  }
  await page.waitForTimeout(1000);

  const statechartStyles = await page.evaluate(() => {
    const stateNode = document.querySelector('#state-Red-7');
    if (!stateNode) return { error: 'state-Red-7 not found' };

    const path = stateNode.querySelector('path');
    const rect = stateNode.querySelector('rect');
    const basic = stateNode.querySelector('.basic');

    const getStyles = (el: Element | null) => {
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return {
        fill: computed.fill,
        stroke: computed.stroke,
        backgroundColor: computed.backgroundColor
      };
    };

    return {
      path: getStyles(path),
      rect: getStyles(rect),
      basic: getStyles(basic),
      basicClasses: basic?.className?.toString?.() || basic?.getAttribute('class')
    };
  });

  console.log('STATECHART STYLES:', JSON.stringify(statechartStyles, null, 2));

  // Flat (flowchart)
  const flatButton = page.getByRole('button', { name: 'Flattened' });
  if (await flatButton.isVisible()) {
    await flatButton.click();
  }
  await page.waitForTimeout(1000);

  const flowchartStyles = await page.evaluate(() => {
    const node = document.querySelector('#flowchart-Red-1');
    if (!node) return { error: 'flowchart-Red-1 not found' };

    const rect = node.querySelector('rect');

    const getStyles = (el: Element | null) => {
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return {
        fill: computed.fill,
        stroke: computed.stroke,
        backgroundColor: computed.backgroundColor
      };
    };

    return {
      rect: getStyles(rect),
      nodeClasses: node.className?.toString?.() || node.getAttribute('class')
    };
  });

  console.log('FLOWCHART STYLES:', JSON.stringify(flowchartStyles, null, 2));
});
