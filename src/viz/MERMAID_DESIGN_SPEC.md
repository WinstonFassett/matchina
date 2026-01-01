# Mermaid Diagram Styling Specification

## Design Approach
Monochromatic theme using 3 colors:
1. **App Background** - the main page background color
2. **App Text** - the main text color (white on dark, black on light)
3. **Accent** - the theme title color (light purple on dark, dark purple on light)

## Non-Active Nodes

**All themes:**
- Background: `transparent` (shows app bg underneath)
- Border: `accent` color, 2px
- Text: `app text` color

## Active Nodes (Currently Highlighted State)

**All themes:**
- Background: `accent` color (filled solid)
- Border: `accent` color, 2px (same as fill and inactive)
- Text: `app bg` color (opposite of normal text)

## CSS Color Mappings

### Dark Mode
- App BG: black/dark
- App Text: `--sl-color-gray-3` (light gray)
- Accent: `--sl-color-accent-high` (light purple)
- Active text should be: dark/black

### Light Mode
- App BG: white/light
- App Text: `--sl-color-text` (dark text)
- Accent: `--sl-color-accent` (dark purple, the title color)
- Active text should be: white/light

## Selectors

- **Normal rects**: `.state rect`, `.node rect`
- **Active states**: Elements with `.state-highlight` or `.node.active` class
- **Active rects**: `.state-highlight rect`, `.node.active rect`, and children of `g.state-highlight`, `g.node.active`
