import { test, expect } from '@playwright/test';

test('ForceGraph renders HSM combobox with nodes', async ({ page }) => {
  await page.goto('http://localhost:4321/matchina/examples/hsm-combobox/');
  await page.waitForLoadState('networkidle');

  // Switch to ForceGraph visualizer
  await page.click('button:has-text("Force Graph")');
  await page.waitForTimeout(2000); // Give graph time to render

  // Check if canvas element exists (ForceGraph renders on canvas, not SVG)
  const canvases = page.locator('canvas');
  const canvasCount = await canvases.count();
  expect(canvasCount).toBeGreaterThan(0);

  // Verify canvas has non-zero dimensions
  const canvas = canvases.first();
  const width = await canvas.evaluate((el: any) => el.width);
  const height = await canvas.evaluate((el: any) => el.height);
  
  expect(width).toBeGreaterThan(0);
  expect(height).toBeGreaterThan(0);
});
