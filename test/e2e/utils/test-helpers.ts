/**
 * Shared E2E test utilities to eliminate duplication
 */

import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Common selectors
export const SELECTORS = {
  pageContainer: '.space-y-4',
  machineVisualizer: '.machine-visualizer',
  visualizerControls: '[data-testid="visualizer-controls"]',
  visualizerPicker: '[data-testid="visualizer-picker"]',
  visualizerContainer: '.viz-container',
  appContainer: '.app-container',
  mainContent: '.machine-visualizer > div:last-child', // The main content area (visualizer + app)
  fullInteractiveArea: '.machine-visualizer', // Full interactive area including tabs for HSM examples
  themeToggle: '#theme-toggle-wrapper .theme-toggle-checkbox',
  comboboxInput: 'input[placeholder*="Type"]',
  modeButtons: {
    flat: 'Flattened',
    nested: 'Nested (Hierarchical)'
  }
} as const;

// Visualizer mappings by preset
export const VISUALIZERS = {
  hierarchical: ['sketch', 'reactflow', 'mermaid-statechart', 'mermaid-flowchart'],
  complex: ['reactflow', 'forcegraph', 'mermaid-statechart', 'mermaid-flowchart', 'sketch'],
  simple: ['mermaid-statechart', 'mermaid-flowchart', 'sketch'],
  minimal: ['reactflow', 'forcegraph', 'mermaid-statechart', 'mermaid-flowchart', 'sketch']
} as const;

// Example configurations
export const EXAMPLES = {
  'hsm-combobox': {
    preset: 'hierarchical' as const,
    defaultViz: 'sketch' as const,
    url: '/matchina/examples/hsm-combobox'
  },
  'traffic-light': {
    preset: 'complex' as const,
    defaultViz: 'reactflow' as const,
    url: '/matchina/examples/traffic-light'
  },
  'toggle': {
    preset: 'simple' as const,
    defaultViz: 'mermaid-statechart' as const,
    url: '/matchina/examples/toggle'
  },
  'counter': {
    preset: 'simple' as const,
    defaultViz: 'mermaid-statechart' as const,
    url: '/matchina/examples/counter'
  },
  'checkout': {
    preset: 'complex' as const,
    defaultViz: 'reactflow' as const,
    url: '/matchina/examples/checkout'
  },
  'auth-flow': {
    preset: 'complex' as const,
    defaultViz: 'reactflow' as const,
    url: '/matchina/examples/auth-flow'
  },
  'stopwatch': {
    preset: 'simple' as const,
    defaultViz: 'mermaid-statechart' as const,
    url: '/matchina/examples/stopwatch'
  },
  'rock-paper-scissors': {
    preset: 'simple' as const,
    defaultViz: 'mermaid-statechart' as const,
    url: '/matchina/examples/rock-paper-scissors'
  }
} as const;

/**
 * Fast-fail selector validation to prevent wasted time
 */
export async function validateSelector(page: Page, selector: string, timeout: number = 1000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    // Fast fail - don't waste time on bad selectors
    throw new Error(`Selector "${selector}" not found within ${timeout}ms. Check if element exists or selector is correct.`);
  }
}

/**
 * Navigate to example and wait for load with fast validation
 */
export async function gotoExample(page: Page, exampleName: keyof typeof EXAMPLES) {
  const config = EXAMPLES[exampleName];
  
  // Navigate first
  await page.goto(config.url);
  
  // Fast validation - fail immediately if page structure is wrong
  await validateSelector(page, SELECTORS.pageContainer, 2000);
  
  return config;
}

/**
 * Set theme (light/dark)
 */
export async function setTheme(page: Page, theme: 'light' | 'dark') {
  if (theme === 'dark') {
    // Use prefers-color-scheme: dark instead of clicking toggle
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(200);
    console.log('Set color scheme to dark');
  } else {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(200);
    console.log('Set color scheme to light');
  }
}

/**
 * Set machine mode (flat/nested)
 */
export async function setMode(page: Page, mode: 'flat' | 'nested') {
  const buttonText = mode === 'flat' ? SELECTORS.modeButtons.flat : SELECTORS.modeButtons.nested;
  await page.click(`button:has-text("${buttonText}")`);
  await page.waitForTimeout(400);
}

/**
 * Select visualizer with validation
 */
export async function selectVisualizer(page: Page, visualizer: string, preset: keyof typeof VISUALIZERS) {
  const availableViz = VISUALIZERS[preset];
  
  if (!availableViz.includes(visualizer as any)) {
    throw new Error(`Visualizer "${visualizer}" not available for preset "${preset}". Available: ${availableViz.join(', ')}`);
  }

  // Fast validation - check if picker exists first
  await validateSelector(page, SELECTORS.visualizerPicker, 1000);

  const picker = page.locator(SELECTORS.visualizerPicker);
  await picker.selectOption(visualizer);
  await page.waitForTimeout(400);
}

/**
 * Wait for visualizer to be ready with fast validation
 */
export async function waitForVisualizer(page: Page, visualizer: string) {
  // Fast timeout for visualizer detection
  const visualizerTimeout = 2000;
  
  switch (visualizer) {
    case 'forcegraph':
      await validateSelector(page, 'canvas', visualizerTimeout);
      break;
    case 'reactflow':
      await validateSelector(page, '.react-flow__node', visualizerTimeout);
      break;
    case 'sketch':
    case 'mermaid-statechart':
    case 'mermaid-flowchart':
      await validateSelector(page, 'svg', visualizerTimeout);
      break;
  }
}

/**
 * Wait for visualizer to be fully loaded and ready
 */
export async function waitForVisualizerLoaded(page: Page, timeout = 5000) {
  // Wait for machine visualizer container
  await expect(page.locator(SELECTORS.machineVisualizer)).toBeVisible({ timeout });
  
  // Wait for visualizer content to load (either viz-container or app-container)
  await expect(page.locator(`${SELECTORS.visualizerContainer}, ${SELECTORS.appContainer}`)).toBeVisible({ timeout });
  
  // Additional wait for async visualizers like Mermaid
  await page.waitForTimeout(1000);
}

/**
 * Type in combobox input
 */
export async function typeInCombobox(page: Page, text: string) {
  const input = page.locator(SELECTORS.comboboxInput);
  await input.fill(text);
  await page.waitForTimeout(200);
}

/**
 * Wait for suggestions with fast validation
 */
export async function waitForSuggestions(page: Page) {
  await validateSelector(page, '.absolute.top-full button', 2000);
}

/**
 * Select first suggestion with validation
 */
export async function selectFirstSuggestion(page: Page) {
  // Validate dropdown exists first
  await validateSelector(page, '.absolute.top-full button', 1000);
  
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
}

/**
 * Test data generator for matrix testing
 */
export function generateTestMatrix<T extends string[]>(...arrays: T[]) {
  if (arrays.length === 0) return [];
  
  const [first, ...rest] = arrays;
  if (rest.length === 0) return first.map(item => [item]);
  
  const subMatrix = generateTestMatrix(...rest);
  return first.flatMap(item => 
    subMatrix.map(subItem => [item, ...subItem])
  );
}

/**
 * Focused screenshot - captures only the interactive example area
 * Excludes documentation chrome, sidebar, header, footer, code tabs
 */
export async function takeFocusedScreenshot(page: Page, name: string) {
  // Focus on the main content area (visualizer + app controls)
  const contentArea = page.locator(SELECTORS.mainContent);
  
  // Wait for content to be visible and stable
  await expect(contentArea.first()).toBeVisible();
  
  // Take screenshot of just the interactive area
  await expect(contentArea.first()).toHaveScreenshot(`${name}.png`);
}

/**
 * Visual regression helper - uses focused screenshots
 */
export async function takeScreenshot(page: Page, name: string, selector: string = SELECTORS.mainContent) {
  // Note: expect() should be called in test files, not utilities
  page.locator(selector).screenshot({ path: `review/screenshots/${name}.png` });
}

/**
 * Console capture for debugging
 */
export function captureConsole(page: Page) {
  page.on('console', msg => {
    console.log('Browser console:', msg.text());
  });
}

/**
 * Test fixture setup
 */
export function setupTest(exampleName: keyof typeof EXAMPLES) {
  return async ({ page }: { page: Page }, use: (fixtures: any) => void) => {
    captureConsole(page);
    const config = await gotoExample(page, exampleName);
    use({ config, exampleName });
  };
}

/**
 * REAL Smoke test template - tests visual rendering with focused screenshots
 */
export async function runSmokeTest(page: Page, exampleName: keyof typeof EXAMPLES) {
  const config = await gotoExample(page, exampleName);
  
  // Test light mode - VISUAL verification (focused on interactive area)
  await expect(page.locator(SELECTORS.mainContent).first()).toBeVisible();
  // Take focused screenshot of just the interactive example area
  await expect(page.locator(SELECTORS.mainContent).first()).toHaveScreenshot(`${exampleName}-light-initial.png`);
  
  // Test dark mode - VISUAL verification (if theme toggle exists)
  const themeToggle = page.locator(SELECTORS.themeToggle);
  if (await themeToggle.isVisible()) {
    await setTheme(page, 'dark');
    await expect(page.locator(SELECTORS.mainContent).first()).toBeVisible();
    // Take focused screenshot of dark mode
    await expect(page.locator(SELECTORS.mainContent).first()).toHaveScreenshot(`${exampleName}-dark-initial.png`);
  } else {
    console.log(`Theme toggle not found for ${exampleName}, skipping dark mode test`);
  }
  
  // Test mode switching if available - VISUAL verification
  if (exampleName === 'hsm-combobox') {
    await setMode(page, 'flat');
    await expect(page.locator(SELECTORS.mainContent).first()).toBeVisible();
    await expect(page.locator(SELECTORS.mainContent).first()).toHaveScreenshot(`${exampleName}-flat-initial.png`);
    
    await setMode(page, 'nested');
    await expect(page.locator(SELECTORS.mainContent).first()).toBeVisible();
    await expect(page.locator(SELECTORS.mainContent).first()).toHaveScreenshot(`${exampleName}-nested-initial.png`);
  }
  
  return config;
}
