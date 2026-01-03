import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('compare active state DOM between flowchart and statechart', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  // FLOWCHART first
  const flatButton = page.getByRole('button', { name: 'Flattened' });
  if (await flatButton.isVisible()) await flatButton.click();
  await page.waitForTimeout(300);

  const flowchartDOM = await page.evaluate(() => {
    const activeNode = document.querySelector('g.node.active, g[id^="flowchart-"].active, .active');
    if (!activeNode) return { error: 'No active node in flowchart' };
    
    const rect = activeNode.querySelector('rect');
    return {
      activeNodeId: (activeNode as Element).id,
      activeNodeTag: activeNode.tagName,
      activeNodeClasses: (activeNode as Element).className?.toString?.(),
      rectStyleFill: rect ? (rect as SVGElement).style.fill : 'no rect',
      rectComputedFill: rect ? window.getComputedStyle(rect).fill : 'no rect'
    };
  });
  console.log('FLOWCHART:', JSON.stringify(flowchartDOM, null, 2));

  // STATECHART
  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(300);

  const statechartDOM = await page.evaluate(() => {
    const activeNode = document.querySelector('g.node.active, g[id^="state-"].active, .active');
    if (!activeNode) return { error: 'No active node in statechart' };
    
    const path = activeNode.querySelector('path');
    const rect = activeNode.querySelector('rect');
    return {
      activeNodeId: (activeNode as Element).id,
      activeNodeTag: activeNode.tagName,
      activeNodeClasses: (activeNode as Element).className?.toString?.(),
      pathStyleFill: path ? (path as SVGElement).style.fill : 'no path',
      pathComputedFill: path ? window.getComputedStyle(path).fill : 'no path',
      rectStyleFill: rect ? (rect as SVGElement).style.fill : 'no rect',
      rectComputedFill: rect ? window.getComputedStyle(rect).fill : 'no rect'
    };
  });
  console.log('STATECHART:', JSON.stringify(statechartDOM, null, 2));
});
