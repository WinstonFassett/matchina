import React from "react";
import type { InspectorTheme } from "matchina/viz";
import { defaultTheme, generateCSSVariables } from "matchina/viz";

/**
 * React-specific theme utilities
 */
export function useTheme(theme?: InspectorTheme): InspectorTheme {
  return React.useMemo(() => theme || defaultTheme, [theme]);
}

export function useThemeVariables(theme?: InspectorTheme): React.CSSProperties {
  const resolvedTheme = useTheme(theme);
  return React.useMemo(() => {
    const cssText = generateCSSVariables(resolvedTheme.values);
    const styles: React.CSSProperties = {};
    
    // Parse CSS variables into React styles
    cssText.split('\n').forEach(line => {
      const match = line.match(/^\s*--([^:]+):\s*(.+);$/);
      if (match) {
        const [, prop, value] = match;
        (styles as any)[`--${prop}`] = value;
      }
    });
    
    return styles;
  }, [resolvedTheme]);
}

export { defaultTheme, generateCSSVariables };
export type { InspectorTheme } from "matchina/viz";
