# Phase 2: Portal Rendering Debugging - Console Log Guide

## What's Been Added

Console logging and visual debugging to `src/viz/ReactFlowInspector/ReactFlowInspector.tsx`:

- **Button click detection**: Logs when "Layout" button is clicked
- **State change tracking**: Shows current showLayoutDialog state
- **Portal rendering logs**: Indicates when portal tries to render
- **Backdrop click detection**: Logs when backdrop (dimmed area) is clicked
- **Semi-transparent backdrop**: Renders visible rgba(0,0,0,0.1) so you can see the overlay even if panel doesn't appear
- **Layout options change**: Logs when layout algorithm/settings change

## How to Debug

### Step 1: Open Browser Console

1. Go to http://localhost:4321/matchina/examples/toggle
2. Open DevTools: **F12** or **Cmd+Option+I** (Mac)
3. Click **Console** tab
4. Look for logs starting with 🔍 [Portal]

### Step 2: Verify Button Exists and Works

Visual check:
- [ ] Top-right corner has "Layout" button (⚙️ icon + "Layout" text)
- [ ] Button has white background and border
- [ ] Button is clickable (cursor changes)

Console check:
Click the Layout button and look for:
```
🔍 [Portal] Layout button clicked, showLayoutDialog: false
```

This means:
- ✅ Button is wired to click handler
- ✅ State was false, about to become true
- Next click should show:
```
🔍 [Portal] Layout button clicked, showLayoutDialog: true
```

If you see NO logs:
- ❌ Button click not detected
- Check React DevTools to see if component is rendering
- Check for JavaScript errors above in console

### Step 3: Check Portal Rendering

After clicking Layout button, should see:
```
🔍 [Portal] Rendering portal to document.body
```

This means:
- ✅ showLayoutDialog state changed to true
- ✅ Portal render condition evaluated
- ✅ createPortal() was called
- Panel SHOULD appear on screen

**What you should see visually:**
- Semi-transparent dark overlay covering the page
- White panel in top-right corner with layout options
- Panel is above all other content

### Step 4: Check Backdrop

The semi-transparent background is now visible to help debug:

**If you see:**
- [ ] Dark overlay (rgba background) → Portal IS rendering, panel styling might be off
- [ ] No overlay AND no panel → Portal NOT rendering (state issue)
- [ ] Overlay but no panel → Panel exists but styled off-screen

**If overlay is visible but panel not:**

Inspect in DevTools:
1. Right-click on the dark overlay
2. Select "Inspect" or "Inspect Element"
3. Check in Elements tab what you see:
   - `<div style="background-color: rgba(0, 0, 0, 0.1)">` = backdrop is there
   - Look inside for `<div class="bg-white dark:bg-gray-800">` = panel should be there
   - If panel exists but not visible, it's a CSS issue

### Step 5: Test Backdrop Click

Click on the dark overlay (not the panel itself):

Should see:
```
🔍 [Portal] Backdrop clicked
```

And the dialog should close (overlay disappears).

If backdrop doesn't close dialog:
- Panel click might be interfering
- Check if panel is properly positioned inside the flex container

### Step 6: Test Layout Changes

Once panel appears, try changing options:

- Change algorithm dropdown
- Adjust Node Spacing slider
- Change Direction
- Toggle checkboxes

Should see:
```
🔍 [Layout] Options changed: {
  algorithm: "stress",
  direction: "DOWN",
  nodeSpacing: 100,
  ...
}
```

And canvas should relayout automatically.

## Debugging Scenarios

### ✅ Everything Works

- [x] Button visible in top-right
- [x] Button click logs appear
- [x] Portal renders (log appears)
- [x] Dark overlay visible
- [x] Panel appears with options
- [x] Layout changes apply

**Result: Phase 2 Complete ✅**

### ⚠️ Partial Working

**If overlay is visible but panel not:**

The backdrop is rendering (good), but the panel might be off-screen. Check:

1. **Z-index issue**: Panel is behind other content
   - Try: `z-index: 9999` in DevTools styles
   - Check ReactFlow container has `overflow: hidden`

2. **Positioning issue**: Panel positioned off-screen
   - Check: `mt-16 mr-4` might be wrong
   - Try: `mt-8 mr-8` or adjust margins

3. **Width issue**: Panel too wide, wrapped incorrectly
   - Check: `max-w-[300px]` is being respected
   - Try: `w-[300px]` for explicit width

**Fix approach:**
1. Open DevTools Inspector
2. Find the panel div (inside portal)
3. Edit inline styles
4. Once you find working values, apply to code

### ❌ Not Working

**If you see NO logs and NO overlay:**

The portal isn't rendering at all. Check:

1. **Button not clickable**
   - ❌ No log on click
   - ❌ Cursor doesn't change
   - Solution: Check if Panel is blocking button
   - Solution: Check button is inside ReactFlow Panel component

2. **State not updating**
   - ✅ Button log appears
   - ❌ No "Rendering portal" log
   - ❌ No overlay appears
   - Solution: setShowLayoutDialog might not be wired correctly
   - Solution: Check showLayoutDialog isn't undefined

3. **Portal to wrong element**
   - Logs appear
   - Overlay appears somewhere unexpected
   - Solution: Check `document.body` is correct target
   - Solution: Try `document.documentElement`

## Expected Console Flow

```
// Page loads
(ReactFlow renders normally)

// Click Layout button
🔍 [Portal] Layout button clicked, showLayoutDialog: false

// Portal renders
🔍 [Portal] Rendering portal to document.body

// You see: dark overlay + white panel in top-right

// Click on dark overlay
🔍 [Portal] Backdrop clicked

// Portal closes, you see normal canvas again
// Button now shows: showLayoutDialog: true → false

// Click button again
🔍 [Portal] Layout button clicked, showLayoutDialog: true

// Portal opens again
🔍 [Portal] Rendering portal to document.body

// Change an option (e.g., Algorithm)
🔍 [Layout] Options changed: {algorithm: "stress", ...}

// Canvas relayouts automatically
```

## Visual Debugging Checklist

| Item | Should | Status |
|------|--------|--------|
| Button visible | Yes - top right |  |
| Button hoverable | Yes - bg color changes |  |
| Dark overlay on click | Yes - rgba visible |  |
| Panel renders | Yes - white box appears |  |
| Panel in top-right | Yes - above overlay |  |
| Panel has options | Yes - dropdowns, sliders |  |
| Close on backdrop click | Yes - overlay disappears |  |
| Close on Esc key | Maybe - nice to have |  |
| Options apply | Yes - canvas relayouts |  |

## Common CSS Issues

### Panel Off-Screen (Right)
- Backdrop visible but panel not
- Panel is at the very edge or beyond viewport
- **Fix**: `mr-4` might be too small, change to `mr-8` or `mr-12`

### Panel Below Viewport
- Overlay visible but can't see panel
- Panel might be below fold
- **Fix**: `mt-16` is below button, try `mt-8` or `mt-2`

### Panel Behind Content
- See backdrop but no panel
- Panel exists but behind other elements
- **Fix**: `z-50` (500) might not be high enough
  - Try: `z-[9999]` for explicit high value
  - Check: ReactFlow container `overflow: hidden` might clip it

### Overlay Not Visible
- Click button, nothing appears
- Portal might be rendering but backdrop color too light
- **Fix**: Currently `rgba(0, 0, 0, 0.1)` - should be visible
  - Try: `rgba(0, 0, 0, 0.3)` or darker

## Next Steps

Once debugging is complete:

1. **If everything works**: Remove temporary rgba background, move to Phase 3
2. **If panel needs CSS fix**: Update coordinates (mt-X, mr-Y) or z-index
3. **If portal not rendering**: Check state management and click handlers
4. **If options don't apply**: Ensure handleLayoutChange is wired correctly

## Clean-up Plan

Once portal works, remove:
- Console.log() statements (keep during debugging)
- Semi-transparent background (changed to transparent or removed)
- Keep the portal structure - it's correct

The portal structure itself is sound. These logs and the visible backdrop are just for debugging.
