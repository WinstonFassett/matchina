import { test, expect } from "@playwright/test";
import {
  gotoExample,
  setMode,
  typeInCombobox,
  waitForSuggestions,
  selectFirstSuggestion,
  EXAMPLES,
} from "../utils/test-helpers";

test.describe("Combobox Comparison - Flat vs Nested", () => {
  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on("console", (msg) => {
      console.log("Browser console:", msg.text());
    });

    await gotoExample(page, "hsm-combobox");
  });

  test("nested combobox shows suggestions correctly", async ({ page }) => {
    // Switch to nested mode
    await setMode(page, "nested");

    // Focus the combobox
    await page.click('input[placeholder="Type to add tags..."]');

    // Type something that should trigger suggestions
    await typeInCombobox(page, "typ");

    // Wait for suggestions to appear
    await waitForSuggestions(page);

    // Verify suggestions are visible
    const typescriptSuggestion = page
      .locator("button")
      .filter({ hasText: "typescript" });
    await expect(typescriptSuggestion).toBeVisible();

    // Verify suggestions count
    const suggestions = page.locator(".absolute.top-full button");
    const suggestionCount = await suggestions.count();
    expect(suggestionCount).toBeGreaterThan(0);

    // Log state for debugging
    const stateDisplay = page.locator(".state-display");
    const stateText = await stateDisplay.textContent();
    console.log("Nested mode state:", stateText);

    // Log suggestions for debugging
    console.log(
      "Nested dropdown visible:",
      await typescriptSuggestion.isVisible()
    );
    console.log("Nested suggestions count:", suggestionCount);
  });

  test("flat combobox shows suggestions correctly", async ({ page }) => {
    // Switch to flat mode
    await setMode(page, "flat");

    // Focus the combobox
    await page.click('input[placeholder="Type to add tags..."]');

    // Type something that should trigger suggestions
    await typeInCombobox(page, "typ");

    // Wait for suggestions to appear
    await waitForSuggestions(page);

    // Verify suggestions are visible
    const typescriptSuggestion = page
      .locator("button")
      .filter({ hasText: "typescript" });
    await expect(typescriptSuggestion).toBeVisible();

    // Verify suggestions count
    const suggestions = page.locator(".absolute.top-full button");
    const suggestionCount = await suggestions.count();
    expect(suggestionCount).toBeGreaterThan(0);

    // Log state for debugging
    const stateDisplay = page.locator(".state-display");
    const stateText = await stateDisplay.textContent();
    console.log("Flat mode state:", stateText);

    // Log suggestions for debugging
    console.log(
      "Flat dropdown visible:",
      await typescriptSuggestion.isVisible()
    );
    console.log("Flat suggestions count:", suggestionCount);
  });

  test("debug flat mode data thoroughly", async ({ page }) => {
    // Switch to flat mode
    await setMode(page, "flat");

    // Focus the combobox
    await page.click('input[placeholder="Type to add tags..."]');

    // Type something that should trigger suggestions
    await typeInCombobox(page, "typ");

    // Wait for suggestions to appear
    await waitForSuggestions(page);

    // Get comprehensive state data
    const stateData = await page.evaluate(() => {
      const stateDisplay = document.querySelector(".state-display");
      const storeData = (window as any).__MATCHINA_STORE__?.getState?.();
      return {
        stateText: stateDisplay?.textContent,
        storeData: storeData,
      };
    });

    console.log("Flat mode state:", stateData.stateText);
    console.log("Flat mode store data:", stateData.storeData);

    // Verify suggestions are visible
    const typescriptSuggestion = page
      .locator("button")
      .filter({ hasText: "typescript" });
    await expect(typescriptSuggestion).toBeVisible();

    // Log suggestions for debugging
    console.log(
      "Flat dropdown visible:",
      await typescriptSuggestion.isVisible()
    );
  });
});
