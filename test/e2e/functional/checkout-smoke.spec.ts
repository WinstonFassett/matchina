import { test, expect } from "@playwright/test";
import { runSmokeTest, EXAMPLES } from "../utils/test-helpers";

test.describe("Checkout Smoke Tests", () => {
  test("checkout example loads in both themes", async ({ page }) => {
    await runSmokeTest(page, "checkout");
  });
});

test.describe("Toggle Smoke Tests", () => {
  test("toggle example loads in both themes", async ({ page }) => {
    await runSmokeTest(page, "toggle");
  });
});

test.describe("Counter Smoke Tests", () => {
  test("counter example loads in both themes", async ({ page }) => {
    await runSmokeTest(page, "counter");
  });
});
