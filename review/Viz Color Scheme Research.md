# Viz Color Scheme Research

## Goal
Research and design comprehensive color schemes for Matchina visualizers that support both dark and light themes with excellent accessibility and visual clarity.

## Current Matchina Color Analysis

### Existing Color Usage
Based on analysis of current Matchina visualizers:

**ReactFlow/HSM Inspector:**
- Uses Shadcn/UI variables (`--sl-color-*`)
- Active states: `var(--sl-color-blue)` (#3b82f6)
- Background: `var(--sl-color-bg)` (transparent/white)
- Text: `var(--sl-color-text)` (depends on theme)
- Accent: `var(--sl-color-accent-high)` (purple tones)

**Mermaid Inspector:**
- Active states: `rgb(147, 112, 219)` (purple) in light mode
- Dark mode: transparent fill with colored borders
- Uses CSS custom properties for theme switching
- Edge labels with contrast optimization

**Sketch Inspector:**
- Active states: `var(--sl-color-blue)` (#3b82f6)
- Active ancestors: rgba(59, 130, 246, 0.15) (light blue)
- Nested transparency hierarchy for visual depth

## Popular Color Scheme Analysis

### 1. Catppuccin (Most Popular 2024-2025)
**Why it's popular:** Community-driven pastel theme, soothing aesthetics, excellent balance

**Flavors:**
- **Latte** (Light): Lightest theme for daytime use
- **Frappé** (Dark): Less vibrant, muted aesthetic  
- **Macchiato** (Dark): Medium contrast, gentle colors
- **Mocha** (Dark): Original, richest colors

**Key Colors (Mocha - Most Popular Dark):**
- **Base**: #1e1e2e (background)
- **Text**: #cdd6f4 (primary text)
- **Rosewater**: #f5e0dc (accent)
- **Flamingo**: #f2cdcd (accent)
- **Pink**: #f5c2e7 (accent)
- **Mauve**: #cba6f7 (purple accent)
- **Red**: #f38ba8 (error/warning)
- **Maroon**: #eba0ac (subtle red)
- **Peach**: #fab387 (warning/info)
- **Yellow**: #f9e2af (highlight)
- **Green**: #a6e3a1 (success)
- **Teal**: #94e2d5 (info)
- **Sky**: #89dceb (info)
- **Sapphire**: #74c7ec (info)
- **Blue**: #89b4fa (primary)
- **Lavender**: #b4befe (accent)

**Strengths:**
- Excellent contrast ratios (WCAG AA compliant)
- Soothing pastel colors reduce eye strain
- Consistent semantic color mapping
- Large community support
- Comprehensive tool integrations

### 2. One Dark Pro
**Why it's popular:** VS Code's most popular theme, familiar to many developers

**Key Colors:**
- **Background**: #282c34 (dark gray)
- **Text**: #abb2bf (light gray)
- **Red**: #e06c75 (error)
- **Orange**: #d19a66 (warning)
- **Yellow**: #e5c07b (highlight)
- **Green**: #98c379 (success)
- **Cyan**: #56b6c2 (info)
- **Blue**: #61afef (primary)
- **Purple**: #c678dd (accent)

**Strengths:**
- High contrast, excellent readability
- Familiar to most developers
- Good semantic color separation
- Proven track record

**Weaknesses:**
- Higher contrast can cause eye strain
- Less sophisticated than modern themes
- Limited pastel options

### 3. Monokai Pro
**Why it's popular:** Classic theme, excellent syntax highlighting

**Key Colors:**
- **Background**: #2d2a2e (dark)
- **Text**: #f8f8f2 (light)
- **Red**: #ff6188 (error)
- **Orange**: #fc9867 (warning)
- **Yellow**: #ffd866 (highlight)
- **Green**: #a9dc76 (success)
- **Blue**: #78dce8 (primary)
- **Purple**: #ab9df2 (accent)

**Strengths:**
- Excellent for code readability
- High contrast for syntax
- Well-established color relationships

**Weaknesses:**
- Can be harsh for long sessions
- Less suitable for UI elements
- Focused on syntax, not UI

### 4. Tokyo Night
**Why it's popular:** Modern, clean aesthetic

**Key Colors:**
- **Background**: #1a1b26
- **Text**: #c0caf5
- **Blue**: #7aa2f7
- **Cyan**: #7dcfff
- **Teal**: #73daca
- **Green**: #9ece6a
- **Yellow**: #e0af68
- **Orange**: #ff9e64
- **Red**: #f7768e
- **Purple**: #bb9af7

**Strengths:**
- Modern, sophisticated appearance
- Good contrast ratios
- Excellent for both code and UI

## Data Visualization Best Practices

### Color Types for Visualizations

1. **Categorical Colors** (for different states/types)
   - Use distinct hues
   - Maximum 6-8 colors for clarity
   - Ensure colorblind accessibility

2. **Sequential Colors** (for intensity/progression)
   - Single hue, varying lightness
   - Good for showing state depth/hierarchy

3. **Diverging Colors** (for active/inactive states)
   - Two contrasting hues
   - Neutral middle ground
   - Excellent for state highlighting

### Accessibility Requirements

- **WCAG AA Contrast**: 4.5:1 minimum for normal text
- **Colorblind Safety**: Use patterns/labels in addition to color
- **Dark Theme**: Avoid saturated colors on dark backgrounds
- **Light Theme**: Ensure sufficient contrast without harshness

## State Machine Visualization Specific Needs

### Hierarchy Visualization
- **Parent States**: Subtle backgrounds/borders
- **Active States**: Clear highlighting
- **Ancestor States**: Moderate highlighting
- **Child States**: Clear relationship indicators

### State Types
- **Initial States**: Special marking (circles/arrows)
- **Final States**: Distinct styling (double borders)
- **Active States**: High contrast highlighting
- **Inactive States**: Muted, transparent styling

### Transitions
- **Available Transitions**: Clear, interactive styling
- **Unavailable Transitions**: Muted, disabled appearance
- **Recent Transitions**: Temporary highlighting
- **Hover States**: Clear affordance

## Recommendations for Matchina

### Primary Recommendation: Catppuccin-inspired Palette

**Why Catppuccin:**
- Most popular modern theme (2024-2025)
- Excellent accessibility built-in
- Soothing colors reduce eye strain
- Semantic color mapping
- Large community and tool support

### Proposed Matchina Color Palette

#### Dark Theme (Catppuccin Mocha-inspired)
```css
/* Core Semantic Colors */
--matchina-bg-primary: #1e1e2e;      /* Base background */
--matchina-bg-secondary: #181825;    /* Deeper backgrounds */
--matchina-text-primary: #cdd6f4;    /* Main text */
--matchina-text-secondary: #a6adc8;  /* Secondary text */
--matchina-text-muted: #6c7086;      /* Muted text */

/* State Machine Specific */
--matchina-state-active: #89b4fa;    /* Active state (blue) */
--matchina-state-ancestor: rgba(137, 180, 250, 0.2); /* Ancestor highlight */
--matchina-state-initial: #a6e3a1;   /* Initial state (green) */
--matchina-state-final: #f38ba8;     /* Final state (red) */
--matchina-state-border: #585b70;    /* Default state border */

/* Transition Colors */
--matchina-transition-available: #89b4fa;  /* Available transitions */
--matchina-transition-hover: #74c7ec;      /* Hover state */
--matchina-transition-recent: #f9e2af;     /* Recent transition highlight */
--matchina-transition-unavailable: #6c7086; /* Unavailable */

/* Accent Colors */
--matchina-accent-primary: #cba6f7;   /* Purple accent */
--matchina-accent-secondary: #f5c2e7; /* Pink accent */
--matchina-accent-tertiary: #94e2d5;   /* Teal accent */

/* Status Colors */
--matchina-success: #a6e3a1;          /* Success states */
--matchina-warning: #fab387;         /* Warning states */
--matchina-error: #f38ba8;           /* Error states */
--matchina-info: #89dceb;             /* Info states */
```

#### Light Theme (Catppuccin Latte-inspired)
```css
/* Core Semantic Colors */
--matchina-bg-primary: #eff1f5;       /* Base background */
--matchina-bg-secondary: #e6e9ef;     /* Secondary backgrounds */
--matchina-text-primary: #4c4f69;     /* Main text */
--matchina-text-secondary: #5c5f77;   /* Secondary text */
--matchina-text-muted: #6c6f85;       /* Muted text */

/* State Machine Specific */
--matchina-state-active: #1e66f5;    /* Active state (blue) */
--matchina-state-ancestor: rgba(30, 102, 245, 0.15); /* Ancestor highlight */
--matchina-state-initial: #40a02b;    /* Initial state (green) */
--matchina-state-final: #d20f39;      /* Final state (red) */
--matchina-state-border: #bcc0cc;     /* Default state border */

/* Transition Colors */
--matchina-transition-available: #1e66f5;  /* Available transitions */
--matchina-transition-hover: #209fb5;      /* Hover state */
--matchina-transition-recent: #df8e1d;     /* Recent transition highlight */
--matchina-transition-unavailable: #6c6f85; /* Unavailable */

/* Accent Colors */
--matchina-accent-primary: #8839ef;   /* Purple accent */
--matchina-accent-secondary: #ea76cb; /* Pink accent */
--matchina-accent-tertiary: #179299;   /* Teal accent */

/* Status Colors */
--matchina-success: #40a02b;          /* Success states */
--matchina-warning: #df8e1d;         /* Warning states */
--matchina-error: #d20f39;            /* Error states */
--matchina-info: #179299;             /* Info states */
```

### Implementation Strategy

#### Phase 1: Core Color Variables
1. Define CSS custom properties for all colors
2. Create theme switching mechanism
3. Update existing visualizers to use new variables

#### Phase 2: Visualizer Updates
1. **ReactFlow Inspector**: Update node/edge styling
2. **Mermaid Inspector**: Update theme CSS injection
3. **Sketch Inspector**: Update state styling hierarchy

#### Phase 3: Accessibility Enhancements
1. Add colorblind-safe patterns
2. Implement high-contrast mode
3. Add animation preferences (reduced motion)

#### Phase 4: Advanced Features
1. Theme customization options
2. Export/import theme configurations
3. Integration with system preferences

## Quality Assessment Framework

### Metrics for Success
- **Contrast Ratios**: All text meets WCAG AA (4.5:1)
- **Colorblind Safety**: Passes simulation tests
- **User Preference**: Positive feedback from testing
- **Consistency**: Unified across all visualizers
- **Performance**: No impact on rendering performance

### Testing Plan
1. **Automated Testing**: Contrast ratio validation
2. **Visual Testing**: Playwright screenshots per theme
3. **User Testing**: Feedback from actual users
4. **Accessibility Testing**: Screen reader compatibility

## Next Steps

1. **Validate color choices** with stakeholder feedback
2. **Create CSS implementation** with theme switching
3. **Update each visualizer** systematically
4. **Test across all examples** and scenarios
5. **Document theme customization** for users

---

**Research Sources:**
- Catppuccin official documentation and community
- VS Code theme marketplace analytics
- Data visualization best practices (Atlassian, Sigma)
- WCAG accessibility guidelines
- Material Design dark theme specifications
- Community feedback and usage trends (2024-2025)
