/**
 * Hybrid theme API for matchina visualizers
 * 
 * Supports both CSS variables (for easy theming) and CSS classes (for full control)
 * CSS variables use --matchina-inspector-* prefix
 */

export interface InspectorTheme {
  /** CSS variable values for easy theming */
  values?: {
    colors?: Record<string, string>;
    spacing?: Record<string, string>;
    typography?: Record<string, string>;
    borders?: Record<string, string>;
  };
  /** CSS class names for full control */
  classes?: {
    container?: string;
    activeState?: string;
    inactiveState?: string;
    transitionButton?: string;
    nestedStates?: string;
    stateContent?: string;
    stateName?: string;
  };
}

/**
 * Default theme that matches the original SketchInspector styling
 */
export const defaultTheme: InspectorTheme = {
  values: {
    colors: {
      // Use Starlight theme variables to match original docs styling
      background: 'var(--sl-color-bg)',
      surface: 'var(--sl-color-bg)',
      border: 'var(--sl-color-gray-5)',
      text: 'var(--sl-color-text)',
      textSecondary: 'var(--sl-color-text-secondary)',
      primary: 'var(--sl-color-blue)',
      active: 'var(--sl-color-blue)',
      activeBackground: 'var(--sl-color-blue-low)',
      hover: 'var(--sl-color-gray-6)',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
    typography: {
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: '1.5',
    },
    borders: {
      radius: '0.375rem',
      width: '1px',
    },
  },
  classes: {
    container: 'matchina-inspector',
    activeState: 'matchina-inspector-state--active',
    inactiveState: 'matchina-inspector-state--inactive',
    transitionButton: 'matchina-inspector-transition',
    nestedStates: 'matchina-inspector-nested',
    stateContent: 'matchina-inspector-state-content',
    stateName: 'matchina-inspector-state-name',
  },
};

/**
 * Generate CSS variables string from theme values
 */
export function generateCSSVariables(theme: InspectorTheme['values'] = defaultTheme.values): string {
  if (!theme) return '';
  
  let css = '';
  
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      css += `  --matchina-inspector-color-${key}: ${value};\n`;
    });
  }
  
  if (theme.spacing) {
    Object.entries(theme.spacing).forEach(([key, value]) => {
      css += `  --matchina-inspector-spacing-${key}: ${value};\n`;
    });
  }
  
  if (theme.typography) {
    Object.entries(theme.typography).forEach(([key, value]) => {
      css += `  --matchina-inspector-typography-${key}: ${value};\n`;
    });
  }
  
  if (theme.borders) {
    Object.entries(theme.borders).forEach(([key, value]) => {
      css += `  --matchina-inspector-border-${key}: ${value};\n`;
    });
  }
  
  return css;
}

/**
 * Apply theme to element
 */
export function applyTheme(element: HTMLElement, theme: InspectorTheme): void {
  // Apply CSS variables
  if (theme.values) {
    const cssVars = generateCSSVariables(theme.values);
    element.style.cssText += cssVars;
  }
  
  // Apply CSS classes
  if (theme.classes) {
    Object.values(theme.classes).forEach(className => {
      if (className) {
        element.classList.add(className);
      }
    });
  }
}
