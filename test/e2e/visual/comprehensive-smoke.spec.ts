import { test, expect } from "@playwright/test";
import { runSmokeTest, EXAMPLES } from "../utils/test-helpers";

test.describe("Comprehensive Smoke Tests - All Examples", () => {
  const examples = Object.keys(EXAMPLES) as Array<keyof typeof EXAMPLES>;

  examples.forEach((exampleName) => {
    test.describe(`${exampleName}`, () => {
      test(`smoke test - ${exampleName}`, async ({ page }) => {
        await runSmokeTest(page, exampleName);
      });
    });
  });
});
