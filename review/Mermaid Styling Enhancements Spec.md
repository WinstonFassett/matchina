# Mermaid Styling Enhancements Spec

## Mission
Implement NEW style enhancements that have never been done before, focusing on grouping nodes and their active/inactive styling.

## Requirements

### 1. Grouping Nodes (Both Statechart & Flowchart)

#### Inactive State:
- **Background**: Transparent (no white background)
- **Border**: `--sl-color-text-accent` color
- **Text**: `--sl-color-text` color (normal text color)
- **Consistency**: Must be identical across both statechart and flowchart

#### Active State:
- **Main Background**: Transparent (same as inactive)
- **Border**: `--sl-color-text-accent` color
- **Title/Header Area**: Solid `--sl-color-text-accent` background (like a card header)
- **Title Text**: `--sl-color-bg` color (for contrast against accent header)
- **Appearance**: Like a note card with colored header area and transparent body

### 2. Edge Styling

#### Inactive Edges:
- **Color**: Regular edge color (not accent)
- **Style**: Normal appearance

#### Active Edges:
- **Color**: `--sl-color-text-accent` color
- **Style**: Should work the same way as inactive edges but with accent color

### 3. Hover Styling (Edge Labels)

#### Current Problem:
- Shows bright purple with white text (gross)
- Same issue on both themes

#### Required Fix:
- **Background**: `--sl-color-text-accent` color
- **Foreground**: `--sl-color-bg` color
- **Result**: Proper contrast using accent background with background text

### 4. Active State Colors

#### Current Problem:
- Bright purple color is disliked

#### Required Fix:
- Replace bright purple with `--sl-color-text-accent` color
- Apply consistently across all active states

### 5. Consistency Requirements

#### Flowchart vs Statechart:
- Grouping styling must be as consistent as possible between both diagram types
- Same transparent backgrounds, same accent borders, same active styling
- Same text color behavior (flip to bg when active)

#### Theme Consistency:
- Must work properly in both light and dark themes
- Use CSS variables for proper theme support

## Implementation Notes

### CSS Variables to Use:
- `--sl-color-text-accent` - For borders, active fills, hover backgrounds
- `--sl-color-text` - For normal text color
- `--sl-color-bg` - For text color when active (contrast against accent)
- `--sl-color-text-secondary` - For inactive edges

### Key Styling Rules:
1. **Inactive grouping**: transparent + accent border + normal text
2. **Active grouping**: solid accent fill + accent border + bg text
3. **Hover**: accent background + bg text
4. **Active edges**: accent color (not bright purple)
5. **Consistency**: identical behavior across both diagram types

## Success Criteria

1. ✅ Grouping nodes have transparent backgrounds when inactive
2. ✅ Grouping nodes have solid accent fill with bg text when active
3. ✅ Hover uses accent background with bg text (no more purple)
4. ✅ Active edges use accent color (no more bright purple)
5. ✅ Styling is consistent between statechart and flowchart
6. ✅ Works in both light and dark themes
