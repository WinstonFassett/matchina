# V2 ReactFlow Theme Remediation Needed

## Theme Detection Anti-Pattern Found

### Problem: Hardcoded Theme Detection Everywhere

**Components with hardcoded theme detection:**
- `SimpleNode.tsx` - Line 19: `document.documentElement.getAttribute('data-theme') === 'dark'`
- `FloatingEdge.tsx` - Line 56: `document.documentElement.getAttribute('data-theme') === 'dark'`
- `MermaidInspector.tsx` - Line 322: `document.documentElement.getAttribute('data-theme') === 'dark'`
- `ReactFlowInspectorV2.tsx` - Line 72: `document.documentElement.getAttribute('data-theme') === 'dark'`

### Why This Is Wrong

1. **Code Duplication** - Same theme logic repeated in 4+ components
2. **Brittle** - Breaks if theme system changes from `data-theme` attribute
3. **Not Testable** - Hard to mock theme changes in tests
4. **Maintenance Nightmare** - Changes to theme system require updates everywhere
5. **Ignores Existing System** - Project has proper theme system at `src/viz/theme.ts`

## Existing Theme System (Unused)

The project has a mature theme system at `src/viz/theme.ts`:

```typescript
export interface InspectorTheme {
  values?: {
    colors?: Record<string, string>;
    spacing?: Record<string, string>;
    typography?: Record<string, string>;
    borders?: Record<string, string>;
  };
  classes?: {
    container?: string;
    activeState?: string;
    // ... more classes
  };
}

export const defaultTheme: InspectorTheme = {
  values: {
    colors: {
      background: 'var(--sl-color-bg)',
      text: 'var(--sl-color-text)',
      primary: 'var(--sl-color-blue)',
      // ... uses Starlight variables
    }
  }
};
```

**But NO components actually use this system!**

## Remediation Plan

### Phase 1: Create Theme Hook

**File: `src/viz/useTheme.ts`**
```typescript
import { useEffect, useState } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    // Check initial theme
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    updateTheme();
    
    // Listen for theme changes via CSS class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateTheme();
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  
  return {
    isDark,
    colors: {
      // Use Starlight CSS variables that automatically follow theme
      nodeBg: 'var(--sl-color-bg)',
      nodeText: 'var(--sl-color-text)',
      nodeBorder: 'var(--sl-color-gray-5)',
      nodeBorderHover: 'var(--sl-color-gray-6)',
      edgeStroke: 'var(--sl-color-gray-6)',
      edgeStrokeActive: 'var(--sl-color-blue)',
      labelBg: 'var(--sl-color-bg)',
      labelText: 'var(--sl-color-text)',
      labelBorder: 'var(--sl-color-gray-5)',
      activeBg: 'var(--sl-color-accent)',
      activeText: 'var(--sl-color-accent-contrast)',
      previousBg: 'var(--sl-color-gray-2)',
      previousText: 'var(--sl-color-gray-12)',
      compoundBg: 'var(--sl-color-purple-low)',
      compoundText: 'var(--sl-color-purple)',
      compoundBorder: 'var(--sl-color-purple)',
    }
  };
}
```

### Phase 2: Refactor Components

#### SimpleNode.tsx
```typescript
// BEFORE:
const isDarkTheme = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';

// AFTER:
import { useTheme } from '../useTheme';
const { colors, isDark } = useTheme();

// Replace hardcoded colors with theme variables
return {
  background: data?.isActive ? colors.activeBg : colors.nodeBg,
  color: data?.isActive ? colors.activeText : colors.nodeText,
  borderColor: data?.isPrevious ? colors.edgeStrokeActive : colors.nodeBorder,
  // ... remove all isDarkTheme ternaries
};
```

#### FloatingEdge.tsx
```typescript
// BEFORE:
const isDarkTheme = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';

// AFTER:
import { useTheme } from '../useTheme';
const { colors } = useTheme();

// Replace hardcoded colors with theme variables
background: isActive ? 'rgb(30 58 138)' : colors.labelBg,
border: isActive ? '2px solid rgb(59 130 246)' : `1px solid ${colors.labelBorder}`,
color: isActive ? 'rgb(147 197 253)' : colors.labelText,
```

#### ReactFlowInspectorV2.tsx
```typescript
// BEFORE: 
const [colorMode, setColorMode] = useState<'light' | 'dark' | 'system'>('system');
useEffect(() => {
  const updateTheme = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setColorMode(isDark ? 'dark' : 'light');
  };
  // ... MutationObserver setup
}, []);

// AFTER:
import { useTheme } from '../useTheme';
const { isDark } = useTheme();
// Use isDark directly for ReactFlow colorMode prop
```

#### MermaidInspector.tsx
```typescript
// BEFORE:
const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';

// AFTER:
import { useTheme } from '../useTheme';
const { colors, isDark } = useTheme();
// Apply theme via CSS classes or variables
```

### Phase 3: CSS-Based Styling

**Replace inline styles with CSS classes:**

```css
/* New CSS file: src/viz/ReactFlowV2/ReactFlowV2.theme.css */
.simple-node {
  background: var(--sl-color-bg);
  color: var(--sl-color-text);
  border: 1px solid var(--sl-color-gray-5);
}

.simple-node.active {
  background: var(--sl-color-accent);
  color: var(--sl-color-accent-contrast);
}

.simple-node.previous {
  background: var(--sl-color-gray-2);
  color: var(--sl-color-gray-12);
  border: 2px solid var(--sl-color-blue);
}

.simple-node.compound {
  background: var(--sl-color-purple-low);
  color: var(--sl-color-purple);
  border: 1px dashed var(--sl-color-purple);
}

.edge-label {
  background: var(--sl-color-bg);
  color: var(--sl-color-text);
  border: 1px solid var(--sl-color-gray-5);
}

.edge-label.active {
  background: rgb(30 58 138);
  color: rgb(147 197 253);
  border: 2px solid rgb(59 130 246);
}
```

### Phase 4: Remove Anti-Pattern Code

**Remove all instances of:**
```typescript
document.documentElement.getAttribute('data-theme') === 'dark'
typeof document !== 'undefined' && 
```

**Remove MutationObserver from ReactFlowInspectorV2** - let ReactFlow handle theme automatically.

## Benefits of Remediation

1. **Single Source of Truth** - Theme logic in one hook
2. **Automatic Theme Following** - CSS variables update with Starlight
3. **Testable** - Can mock `useTheme` hook in tests
4. **Maintainable** - Theme changes only require hook updates
5. **Consistent** - All components use same theme system
6. **Performance** - No DOM queries on every render

## Implementation Priority

1. **High Priority**: Create `useTheme` hook
2. **High Priority**: Refactor SimpleNode and FloatingEdge (most visible)
3. **Medium Priority**: Refactor ReactFlowInspectorV2
4. **Low Priority**: Refactor MermaidInspector (less critical)
5. **Low Priority**: Add CSS-based styling (nice to have)

## Testing Strategy

```typescript
// Mock theme for testing
jest.mock('../useTheme', () => ({
  isDark: false,
  colors: {
    nodeBg: '#ffffff',
    nodeText: '#000000',
    // ... mock values
  }
}));

// Test theme changes
const { rerender } = render(<SimpleNode data={{label: 'test'}} />);
expect(screen.getByText('test')).toHaveStyle({
  color: '#000000'
});

// Mock dark theme
mockTheme.mockImplementation(() => ({
  isDark: true,
  colors: {
    nodeBg: '#1f2937',
    nodeText: '#f9fafb',
    // ... dark theme values
  }
}));
rerender(<SimpleNode data={{label: 'test'}} />);
expect(screen.getByText('test')).toHaveStyle({
  color: '#f9fafb'
}));
```

## Files to Modify

1. **New**: `src/viz/useTheme.ts` - Theme hook
2. **Update**: `src/viz/ReactFlowV2/SimpleNode.tsx` - Remove hardcoded detection
3. **Update**: `src/viz/ReactFlowV2/FloatingEdge.tsx` - Remove hardcoded detection  
4. **Update**: `src/viz/ReactFlowV2/ReactFlowInspectorV2.tsx` - Remove MutationObserver
5. **Update**: `src/viz/MermaidInspector.tsx` - Remove hardcoded detection
6. **Optional**: `src/viz/ReactFlowV2/ReactFlowV2.theme.css` - CSS-based styling

## Success Criteria

- [ ] No more `document.documentElement.getAttribute('data-theme')` calls
- [ ] All components use `useTheme()` hook
- [ ] Theme changes work automatically without page reload
- [ ] Tests can mock theme behavior
- [ ] CSS variables follow Starlight theme automatically
- [ ] Code is DRY and maintainable
