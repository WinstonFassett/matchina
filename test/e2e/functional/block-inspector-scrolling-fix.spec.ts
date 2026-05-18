import { test, expect } from "@playwright/test";
import { gotoExample, waitForVisualizer } from "../utils/test-helpers";

test("BlockInspector scrolling fix - minimal test", async ({ page }) => {
  await gotoExample(page, "hsm-checkout");
  
  const picker = page.locator('[data-testid="visualizer-picker"]');
  if (await picker.isVisible()) {
    await picker.selectOption("sketch");
    await waitForVisualizer(page, "sketch");
  }

  const blockInspector = page.locator('.block-inspector');
  await expect(blockInspector).toBeVisible();

  // Test the specific bug: scroll to Payment.MethodEntry
  console.log('Testing scroll to Payment.MethodEntry...');
  
  // Reset scroll to top
  await blockInspector.evaluate((el: HTMLElement) => el.scrollTo(0, 0));
  const scrollBefore = await blockInspector.evaluate((el: HTMLElement) => el.scrollTop);
  expect(scrollBefore).toBe(0);

  // Navigate to payment (Cart → Shipping → Payment.MethodEntry)
  const proceedButton = page.locator('button:has-text("proceed")').first();
  await proceedButton.click();
  await page.waitForTimeout(500);
  await proceedButton.click();
  await page.waitForTimeout(500);

  // Check if scroll happened
  const scrollAfter = await blockInspector.evaluate((el: HTMLElement) => el.scrollTop);
  console.log(`Scroll: ${scrollBefore} → ${scrollAfter}`);
  
  // Verify we scrolled to the active state
  expect(scrollAfter).toBeGreaterThan(0);
  
  // Check if the active state is visible
  const activeElement = await blockInspector.evaluate((el: HTMLElement) => {
    const active = el.querySelector('.state-item.active');
    const container = el.getBoundingClientRect();
    if (active) {
      const activeRect = active.getBoundingClientRect();
      return {
        top: activeRect.top - container.top,
        bottom: activeRect.bottom - container.top,
        key: active.getAttribute('data-state-key')
      };
    }
    return null;
  });
  
  console.log(`Active element: top=${activeElement?.top}, bottom=${activeElement?.bottom}, key=${activeElement?.key}`);
  
  // The active element should be visible in the viewport
  expect(activeElement).toBeTruthy();
  expect(activeElement!.top).toBeGreaterThanOrEqual(0);
  expect(activeElement!.bottom).toBeLessThanOrEqual(400); // container height
  
  console.log('✅ Scrolling fix works!');
});
