/**
 * Smoke test utilities for all examples
 */

import { test, expect } from "@playwright/test";
import { runSmokeTest, EXAMPLES } from "./test-helpers";

/**
 * Creates smoke tests for an example
 */
export function createSmokeTests(exampleName: keyof typeof EXAMPLES) {
  test.describe(`${exampleName} Smoke Tests`, () => {
    test("loads in light mode", async ({ page }) => {
      await runSmokeTest(page, exampleName);
    });

    test("loads in dark mode", async ({ page }) => {
      const config = await runSmokeTest(page, exampleName);

      // Additional dark mode specific checks
      await expect(page.locator(".space-y-4")).toBeVisible();
    });
  });
}

/**
 * Creates smoke tests for all examples
 */
export function createAllSmokeTests() {
  Object.keys(EXAMPLES).forEach((exampleName) => {
    createSmokeTests(exampleName as keyof typeof EXAMPLES);
  });
}
