/**
 * Shared E2E test utilities to eliminate duplication
 */

import type { Page, Test } from '@playwright/test';

// Common selectors
export const SELECTORS = {
  pageContainer: '.space-y-4',
  visualizerPicker: '[data-testid="visualizer-picker"]',
  themeToggle: 'button[aria-label="Toggle dark mode"]',
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
  }
} as const;

/**
 * Navigate to example and wait for load
 */
export async function gotoExample(page: Page, exampleName: keyof typeof EXAMPLES) {
  const config = EXAMPLES[exampleName];
  await page.goto(config.url);
  await page.waitForSelector(SELECTORS.pageContainer);
  return config;
}

/**
 * Set theme (light/dark)
 */
export async function setTheme(page: Page, theme: 'light' | 'dark') {
  if (theme === 'dark') {
    await page.click(SELECTORS.themeToggle);
    await page.waitForTimeout(200);
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

  const picker = page.locator(SELECTORS.visualizerPicker);
  if (await picker.isVisible()) {
    await picker.selectOption(visualizer);
    await page.waitForTimeout(400);
  } else {
    throw new Error(`Visualizer picker not found for preset "${preset}"`);
  }
}

/**
 * Wait for visualizer to be ready
 */
export async function waitForVisualizer(page: Page, visualizer: string) {
  switch (visualizer) {
    case 'forcegraph':
      await page.waitForSelector('canvas', { timeout: 3000 });
      break;
    case 'reactflow':
      await page.waitForSelector('.react-flow__node', { timeout: 3000 });
      break;
    case 'sketch':
    case 'mermaid-statechart':
    case 'mermaid-flowchart':
      await page.waitForSelector('svg', { timeout: 3000 });
      break;
    default:
      await page.waitForTimeout(1000); // Fallback
  }
}

/**
 * Combobox interaction helpers
 */
export async function typeInCombobox(page: Page, text: string) {
  const input = page.locator(SELECTORS.comboboxInput);
  await input.fill(text);
  await page.waitForTimeout(400);
}

export async function waitForSuggestions(page: Page) {
  await page.waitForSelector('.absolute.top-full button', { timeout: 2000 });
}

export async function selectFirstSuggestion(page: Page) {
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
 * Visual regression helper
 */
export async function takeScreenshot(page: Page, name: string, selector: string = SELECTORS.pageContainer) {
  await expect(page.locator(selector)).toHaveScreenshot(`${name}.png`);
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
  return async ({ page }: { page: Page }, use: (fixtures: any) => void, testInfo: Test) => {
    captureConsole(page);
    const config = await gotoExample(page, exampleName);
    use({ config, exampleName });
  };
}

/**
 * Smoke test template
 */
export async function runSmokeTest(page: Page, exampleName: keyof typeof EXAMPLES) {
  const config = await gotoExample(page, exampleName);
  
  // Test light mode
  await expect(page.locator(SELECTORS.pageContainer)).toBeVisible();
  
  // Test dark mode
  await setTheme(page, 'dark');
  await expect(page.locator(SELECTORS.pageContainer)).toBeVisible();
  
  // Test mode switching if available
  if (exampleName === 'hsm-combobox') {
    await setMode(page, 'flat');
    await expect(page.locator(SELECTORS.pageContainer)).toBeVisible();
    
    await setMode(page, 'nested');
    await expect(page.locator(SELECTORS.pageContainer)).toBeVisible();
  }
  
  return config;
}
