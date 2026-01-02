import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('check what currentKey value is used in edge logic', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', msg => {
    if (msg.text().includes('currentKey') || msg.text().includes('fromState')) {
      logs.push(msg.text());
    }
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(500);

  console.log('CONSOLE LOGS:', logs);

  // Let's also check what the visualizer thinks the current state is
  const result = await page.evaluate(() => {
    // Find any React component that might have the current state
    const reactRoot = document.querySelector('#root');
    return {
      hasReactRoot: !!reactRoot,
      bodyDataState: document.body.getAttribute('data-state')
    };
  });

  console.log('STATE INFO:', JSON.stringify(result, null, 2));
});
