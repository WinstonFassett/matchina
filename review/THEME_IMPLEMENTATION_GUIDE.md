# Matchina Theme Implementation Guide

## Overview
Implementation guide for Catppuccin-inspired dark/light theme system for Matchina visualizers.

## Architecture

### Theme Structure
```
src/themes/
├── catppuccin/
│   ├── mocha.css      # Dark theme
│   ├── latte.css      # Light theme
│   ├── frappe.css     # Alternative dark
│   └── macchiato.css  # Alternative dark
├── base.css           # Base theme variables
└── components/        # Component-specific overrides
    ├── reactflow.css
    ├── mermaid.css
    └── sketch.css
```

### CSS Custom Properties Strategy

#### Base Variables (base.css)
```css
:root {
  /* Theme Switching */
  --matchina-theme: 'mocha'; /* mocha | latte | frappe | macchiato */
  
  /* Semantic Mappings */
  --matchina-bg-primary: var(--matchina-base);
  --matchina-bg-secondary: var(--matchina-mantle);
  --matchina-bg-tertiary: var(--matchina-crust);
  
  --matchina-text-primary: var(--matchina-text);
  --matchina-text-secondary: var(--matchina-subtext1);
  --matchina-text-muted: var(--matchina-subtext0);
  
  /* State Machine Specific */
  --matchina-state-active: var(--matchina-blue);
  --matchina-state-ancestor: var(--matchina-blue-transparent);
  --matchina-state-initial: var(--matchina-green);
  --matchina-state-final: var(--matchina-red);
  --matchina-state-border: var(--matchina-surface0);
  
  /* Interactive Elements */
  --matchina-transition-available: var(--matchina-blue);
  --matchina-transition-hover: var(--matchina-sky);
  --matchina-transition-recent: var(--matchina-yellow);
  --matchina-transition-unavailable: var(--matchina-overlay0);
  
  /* Status Colors */
  --matchina-success: var(--matchina-green);
  --matchina-warning: var(--matchina-peach);
  --matchina-error: var(--matchina-red);
  --matchina-info: var(--matchina-teal);
  
  /* Visual Hierarchy */
  --matchina-shadow-light: rgba(0, 0, 0, 0.1);
  --matchina-shadow-medium: rgba(0, 0, 0, 0.2);
  --matchina-shadow-heavy: rgba(0, 0, 0, 0.3);
  
  /* Animations */
  --matchina-transition-fast: 150ms ease;
  --matchina-transition-normal: 250ms ease;
  --matchina-transition-slow: 350ms ease;
}
```

#### Mocha Theme (catppuccin/mocha.css)
```css
:root[data-theme="mocha"] {
  /* Core Colors */
  --matchina-base: #1e1e2e;
  --matchina-mantle: #181825;
  --matchina-crust: #11111b;
  
  --matchina-text: #cdd6f4;
  --matchina-subtext1: #bac2de;
  --matchina-subtext0: #a6adc8;
  --matchina-overlay2: #9399b2;
  --matchina-overlay1: #7f849c;
  --matchina-overlay0: #6c7086;
  --matchina-surface2: #585b70;
  --matchina-surface1: #45475a;
  --matchina-surface0: #313244;
  
  /* Rainbow Colors */
  --matchina-rosewater: #f5e0dc;
  --matchina-flamingo: #f2cdcd;
  --matchina-pink: #f5c2e7;
  --matchina-mauve: #cba6f7;
  --matchina-red: #f38ba8;
  --matchina-maroon: #eba0ac;
  --matchina-peach: #fab387;
  --matchina-yellow: #f9e2af;
  --matchina-green: #a6e3a1;
  --matchina-teal: #94e2d5;
  --matchina-sky: #89dceb;
  --matchina-sapphire: #74c7ec;
  --matchina-blue: #89b4fa;
  --matchina-lavender: #b4befe;
  
  /* Transparent Variants */
  --matchina-blue-transparent: rgba(137, 180, 250, 0.2);
  --matchina-green-transparent: rgba(166, 227, 161, 0.2);
  --matchina-red-transparent: rgba(243, 139, 168, 0.2);
  --matchina-yellow-transparent: rgba(249, 226, 175, 0.2);
}
```

#### Latte Theme (catppuccin/latte.css)
```css
:root[data-theme="latte"] {
  /* Core Colors */
  --matchina-base: #eff1f5;
  --matchina-mantle: #e6e9ef;
  --matchina-crust: #dce0e8;
  
  --matchina-text: #4c4f69;
  --matchina-subtext1: #5c5f77;
  --matchina-subtext0: #6c6f85;
  --matchina-overlay2: #7c7f93;
  --matchina-overlay1: #8c8fa1;
  --matchina-overlay0: #9ca0b0;
  --matchina-surface2: #acb0be;
  --matchina-surface1: #bcc0cc;
  --matchina-surface0: #ccd0da;
  
  /* Rainbow Colors */
  --matchina-rosewater: #dc8a78;
  --matchina-flamingo: #dd7878;
  --matchina-pink: #ea76cb;
  --matchina-mauve: #8839ef;
  --matchina-red: #d20f39;
  --matchina-maroon: #e64553;
  --matchina-peach: #fe640b;
  --matchina-yellow: #df8e1d;
  --matchina-green: #40a02b;
  --matchina-teal: #179299;
  --matchina-sky: #04a5e5;
  --matchina-sapphire: #209fb5;
  --matchina-blue: #1e66f5;
  --matchina-lavender: #7287fd;
  
  /* Transparent Variants */
  --matchina-blue-transparent: rgba(30, 102, 245, 0.15);
  --matchina-green-transparent: rgba(64, 160, 43, 0.15);
  --matchina-red-transparent: rgba(210, 15, 57, 0.15);
  --matchina-yellow-transparent: rgba(223, 142, 29, 0.15);
}
```

## Component Implementation

### ReactFlow Inspector Updates

#### Node Styling (components/reactflow.css)
```css
/* Default State Nodes */
.react-flow__node-default {
  background: var(--matchina-bg-primary);
  border: 2px solid var(--matchina-state-border);
  border-radius: 8px;
  color: var(--matchina-text-primary);
  transition: all var(--matchina-transition-normal);
}

.react-flow__node-default:hover {
  border-color: var(--matchina-state-active);
  box-shadow: 0 2px 8px var(--matchina-shadow-medium);
}

/* Active State */
.react-flow__node-default.selected,
.react-flow__node-default.state-active {
  background: var(--matchina-state-active);
  border-color: var(--matchina-state-active);
  color: var(--matchina-bg-primary);
  box-shadow: 0 4px 12px var(--matchina-shadow-heavy);
}

/* Ancestor States */
.react-flow__node-default.state-ancestor {
  background: var(--matchina-state-ancestor);
  border-color: var(--matchina-state-active);
  border-width: 2px;
}

/* Group Nodes (Hierarchical States) */
.react-flow__node-group {
  background: var(--matchina-bg-secondary);
  border: 2px solid var(--matchina-surface1);
  border-radius: 12px;
  color: var(--matchina-text-primary);
}

.react-flow__node-group.selected {
  border-color: var(--matchina-state-active);
  background: var(--matchina-state-ancestor);
}

/* Node Text */
.react-flow__node-default .react-flow__node-text,
.react-flow__node-group .react-flow__node-text {
  color: inherit;
  font-weight: 500;
  font-size: 14px;
}

/* Initial State Indicator */
.react-flow__node-default::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  background: var(--matchina-state-initial);
  border-radius: 50%;
  border: 2px solid var(--matchina-bg-primary);
}

/* Final State Double Border */
.react-flow__node-default.state-final {
  border: 4px solid var(--matchina-state-final);
}
```

#### Edge Styling
```css
/* Default Edges */
.react-flow__edge-path {
  stroke: var(--matchina-text-muted);
  stroke-width: 2;
  transition: stroke var(--matchina-transition-fast);
}

/* Available Transitions */
.react-flow__edge-path.transition-available {
  stroke: var(--matchina-transition-available);
  stroke-width: 2;
  cursor: pointer;
}

.react-flow__edge-path.transition-available:hover {
  stroke: var(--matchina-transition-hover);
  stroke-width: 3;
}

/* Recent Transitions */
.react-flow__edge-path.transition-recent {
  stroke: var(--matchina-transition-recent);
  stroke-width: 3;
  animation: pulse 2s ease-in-out;
}

/* Unavailable Transitions */
.react-flow__edge-path.transition-unavailable {
  stroke: var(--matchina-transition-unavailable);
  stroke-dasharray: 5, 5;
  opacity: 0.5;
}

/* Edge Labels */
.react-flow__edge-text {
  fill: var(--matchina-text-secondary);
  font-size: 12px;
  font-family: 'SF Mono', Monaco, monospace;
}

.react-flow__edge-textbg {
  fill: var(--matchina-bg-primary);
  stroke: var(--matchina-surface1);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

### Mermaid Inspector Updates

#### Theme Injection (components/mermaid.css)
```css
/* Mermaid Container */
.mermaid-container {
  background: var(--matchina-bg-primary);
  color: var(--matchina-text-primary);
  border-radius: 8px;
  padding: 16px;
}

/* State Nodes */
.mermaid .stateGroup {
  fill: var(--matchina-bg-primary);
  stroke: var(--matchina-state-border);
  stroke-width: 2px;
}

.mermaid .stateGroup.active {
  fill: var(--matchina-state-active);
  stroke: var(--matchina-state-active);
}

.mermaid .stateGroup.active text {
  fill: var(--matchina-bg-primary);
}

/* State Text */
.mermaid .stateGroup text {
  fill: var(--matchina-text-primary);
}

/* Start/End States */
.mermaid .state-start {
  fill: var(--matchina-state-initial);
}

.mermaid .state-end {
  fill: var(--matchina-state-final);
}

/* Transitions */
.mermaid .edgeLabel text {
  fill: var(--matchina-text-secondary);
}

.mermaid .edgeLabel rect {
  fill: var(--matchina-bg-secondary);
  stroke: var(--matchina-surface1);
}

/* Interactive Elements */
.mermaid .edgePath {
  stroke: var(--matchina-text-muted);
  stroke-width: 2px;
}

.mermaid .edgePath.available {
  stroke: var(--matchina-transition-available);
  cursor: pointer;
}

.mermaid .edgePath.available:hover {
  stroke: var(--matchina-transition-hover);
  stroke-width: 3px;
}
```

### Sketch Inspector Updates

#### State Item Styling (components/sketch.css)
```css
/* State Container */
.sketch-inspector {
  background: var(--matchina-bg-primary);
  color: var(--matchina-text-primary);
  font-family: system-ui, -apple-system, sans-serif;
}

/* State Items */
.state-item {
  background: var(--matchina-bg-primary);
  border: 1px solid var(--matchina-surface1);
  border-radius: 6px;
  padding: 12px;
  color: var(--matchina-text-primary);
  transition: all var(--matchina-transition-normal);
}

.state-item:hover {
  background: var(--matchina-bg-secondary);
  border-color: var(--matchina-surface2);
}

/* Active State */
.state-item.active {
  background: var(--matchina-state-active);
  border-color: var(--matchina-state-active);
  color: var(--matchina-bg-primary);
  box-shadow: 0 2px 8px var(--matchina-shadow-medium);
}

/* Active Ancestor */
.state-item.active-ancestor {
  background: var(--matchina-state-ancestor);
  border-color: var(--matchina-state-active);
  border-width: 2px;
}

/* Nested States */
.state-item.active-ancestor .state-item:not(.active) {
  background: transparent;
  border-color: var(--matchina-surface0);
}

.state-item.active-ancestor .state-item.active {
  background: var(--matchina-state-active);
  border-color: var(--matchina-state-active);
  color: var(--matchina-bg-primary);
}

/* State Names */
.state-name {
  color: var(--matchina-text-primary);
  font-weight: 600;
}

.state-item.active .state-name {
  color: var(--matchina-bg-primary);
}

/* Transition Buttons */
.transition-button {
  background: transparent;
  border: 1px solid transparent;
  color: var(--matchina-text-muted);
  transition: all var(--matchina-transition-fast);
}

.transition-button.enabled {
  color: var(--matchina-transition-available);
  border-color: var(--matchina-transition-available);
  cursor: pointer;
}

.transition-button.enabled:hover {
  background: var(--matchina-transition-available);
  color: var(--matchina-bg-primary);
}

.state-item.active .transition-button.enabled {
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.5);
}

.state-item.active .transition-button.enabled:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* Metadata */
.state-metadata {
  color: var(--matchina-text-muted);
}

.state-metadata .query {
  background: var(--matchina-surface0);
  color: var(--matchina-text-secondary);
}
```

## Theme Switching Implementation

### JavaScript Theme Manager
```typescript
// src/themes/ThemeManager.ts
export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: 'mocha' | 'latte' | 'frappe' | 'macchiato' = 'mocha';
  
  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }
  
  setTheme(theme: typeof ThemeManager.prototype.currentTheme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('matchina-theme', theme);
  }
  
  toggleTheme() {
    const newTheme = this.currentTheme === 'mocha' ? 'latte' : 'mocha';
    this.setTheme(newTheme);
  }
  
  init() {
    const savedTheme = localStorage.getItem('matchina-theme') as any;
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'mocha' : 'latte');
    }
  }
}
```

### React Hook Integration
```typescript
// src/themes/useTheme.ts
import { useEffect, useState } from 'react';
import { ThemeManager } from './ThemeManager';

export function useTheme() {
  const [theme, setTheme] = useState<'mocha' | 'latte' | 'frappe' | 'macchiato'>('mocha');
  
  useEffect(() => {
    const manager = ThemeManager.getInstance();
    manager.init();
    setTheme(manager['currentTheme']);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (!localStorage.getItem('matchina-theme')) {
        manager.setTheme(mediaQuery.matches ? 'mocha' : 'latte');
        setTheme(manager['currentTheme']);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  const toggleTheme = () => {
    const manager = ThemeManager.getInstance();
    manager.toggleTheme();
    setTheme(manager['currentTheme']);
  };
  
  return { theme, toggleTheme };
}
```

## Integration Steps

### Phase 1: Setup Theme Infrastructure
1. Create theme CSS files
2. Implement ThemeManager class
3. Add theme switching UI component
4. Test basic theme switching

### Phase 2: Update ReactFlow Inspector
1. Replace hardcoded colors with CSS variables
2. Update node styling for hierarchy
3. Enhance edge styling for transitions
4. Test with all examples

### Phase 3: Update Mermaid Inspector
1. Update theme CSS injection
2. Replace hardcoded colors
3. Enhance state highlighting
4. Test dark/light compatibility

### Phase 4: Update Sketch Inspector
1. Update CSS with new variables
2. Enhance active state styling
3. Improve nested state visualization
4. Test theme consistency

### Phase 5: Polish and Testing
1. Cross-browser testing
2. Accessibility validation
3. Performance optimization
4. User feedback integration

## Testing Strategy

### Automated Tests
```typescript
// test/themes.test.ts
describe('Theme System', () => {
  test('should apply correct CSS variables', () => {
    const manager = ThemeManager.getInstance();
    manager.setTheme('mocha');
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('mocha');
    expect(getComputedStyle(document.documentElement).getPropertyValue('--matchina-base')).toBe('#1e1e2e');
  });
  
  test('should persist theme choice', () => {
    const manager = ThemeManager.getInstance();
    manager.setTheme('latte');
    
    expect(localStorage.getItem('matchina-theme')).toBe('latte');
  });
  
  test('should detect system preference', () => {
    // Mock system preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
    
    const manager = ThemeManager.getInstance();
    manager.init();
    
    expect(manager['currentTheme']).toBe('mocha');
  });
});
```

### Visual Tests
```typescript
// test/themes.visual.ts
describe('Theme Visual Tests', () => {
  test.each(['mocha', 'latte', 'frappe', 'macchiato'])('should render correctly with %s theme', async (theme) => {
    const manager = ThemeManager.getInstance();
    manager.setTheme(theme);
    
    await expect(page).toHaveScreenshot(`reactflow-${theme}.png`);
    await expect(page).toHaveScreenshot(`mermaid-${theme}.png`);
    await expect(page).toHaveScreenshot(`sketch-${theme}.png`);
  });
});
```

### Accessibility Tests
```typescript
// test/themes.accessibility.ts
describe('Theme Accessibility', () => {
  test('should meet WCAG contrast requirements', async () => {
    const themes = ['mocha', 'latte'];
    
    for (const theme of themes) {
      const manager = ThemeManager.getInstance();
      manager.setTheme(theme);
      
      const results = await testContrast();
      expect(results).toEqual({
        'normal_text': expect.anythingMatching(/4\.5:1|greater/),
        'large_text': expect.anythingMatching(/3:1|greater/),
        'ui_components': expect.anythingMatching(/3:1|greater/),
      });
    }
  });
});
```

## Migration Guide

### From Current System
1. **Identify all hardcoded colors** in existing CSS files
2. **Map to semantic variables** using the new system
3. **Update component imports** to include theme CSS
4. **Test each visualizer** individually
5. **Validate theme switching** works correctly

### Backward Compatibility
- Maintain existing CSS class names
- Add deprecation warnings for old color usage
- Provide migration utilities if needed
- Document breaking changes clearly

## Performance Considerations

### CSS Variable Performance
- CSS variables are highly performant in modern browsers
- Theme switching is instantaneous without re-render
- No JavaScript runtime overhead for styling

### Bundle Size Impact
- Theme CSS adds ~2KB gzipped per theme
- CSS variables are deduplicated efficiently
- No significant impact on load times

### Runtime Performance
- Theme switching is O(1) operation
- No layout thrashing during theme changes
- Smooth transitions without performance penalties

---

**Next Steps:**
1. Create the theme CSS files
2. Implement ThemeManager class
3. Update each visualizer systematically
4. Add comprehensive testing
5. Document user-facing theme controls
