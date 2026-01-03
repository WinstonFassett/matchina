import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('inspect statechart node structure', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Ensure nested (statechart) mode
  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) {
    await nestedButton.click();
  }
  await page.waitForTimeout(1000);

  // Get detailed structure of a state node
  const structure = await page.evaluate(() => {
    const stateNode = document.querySelector('#state-Red-7');
    if (!stateNode) return { error: 'state-Red-7 not found' };

    const getStructure = (el: Element, depth = 0): any => {
      if (depth > 3) return '...';
      return {
        tag: el.tagName,
        id: el.id || undefined,
        class: el.className?.toString?.() || el.getAttribute('class') || undefined,
        children: Array.from(el.children).map(c => getStructure(c, depth + 1))
      };
    };

    return getStructure(stateNode);
  });

  console.log('STATE NODE STRUCTURE:', JSON.stringify(structure, null, 2));

  // Check what elements have state-highlight class after highlighting
  const highlightedStructure = await page.evaluate(() => {
    const highlighted = document.querySelectorAll('.state-highlight, .mermaid-active-state');
    return Array.from(highlighted).map(el => ({
      tag: el.tagName,
      id: el.id,
      class: el.className?.toString?.() || el.getAttribute('class'),
      parent: el.parentElement ? {
        tag: el.parentElement.tagName,
        id: el.parentElement.id,
        class: el.parentElement.className?.toString?.() || el.parentElement.getAttribute('class')
      } : null
    }));
  });

  console.log('HIGHLIGHTED STRUCTURE:', JSON.stringify(highlightedStructure, null, 2));
});
