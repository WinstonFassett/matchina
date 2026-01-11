# Screenshot Automation Update Notes

## Problem Solved
- **Issue**: MCP Playwright tool restricted to temp directory, requiring manual copying
- **Solution**: Use Playwright CLI directly with proper options
- **Benefit**: Direct screenshots to target location, no copying needed

## New Screenshot Method

### Playwright CLI Command
```bash
npx playwright screenshot --color-scheme=dark --viewport-size=1920,1080 --wait-for-selector="selector" <url> <output-path>
```

### Key Options
- `--color-scheme=dark` - Automatic dark mode
- `--viewport-size=1920,1080` - Proper dimensions
- `--wait-for-selector="selector"` - Wait for element before capture
- `--full-page` - Optional for full page screenshots
- `-b chromium` - Specify browser if needed

### Examples
```bash
# Traffic light example
npx playwright screenshot --color-scheme=dark --viewport-size=1920,1080 --wait-for-selector="button[data-testid='hsm-layout-trigger']" http://localhost:4321/matchina/examples/traffic-light /Users/winston/dev/personal/matchina/review/screenshots/sugiyama-traffic-light.png

# HSM combobox example  
npx playwright screenshot --color-scheme=dark --viewport-size=1920,1080 --wait-for-selector="button[data-testid='hsm-layout-trigger']" http://localhost:4321/matchina/examples/hsm-combobox /Users/winston/dev/personal/matchina/review/screenshots/sugiyama-hsm-combobox.png
```

## Automation Script Plan

### Script Features
1. **Batch screenshot capture** - All layouts in one run
2. **Automatic dark mode** - Built-in
3. **Proper naming convention** - Consistent filenames
4. **Wait for ReactFlow V2** - Ensure visualizer loaded
5. **Layout switching** - Auto-select each layout
6. **Progress tracking** - Show what's being captured

### Script Structure
```bash
#!/bin/bash
# capture-layout-screenshots.sh

BASE_URL="http://localhost:4321/matchina/examples"
OUTPUT_DIR="/Users/winston/dev/personal/matchina/review/screenshots"
LAYOUTS=("sugiyama" "tree" "force" "organic" "circular" "grid")
EXAMPLES=("traffic-light" "hsm-combobox")

for example in "${EXAMPLES[@]}"; do
  for layout in "${LAYOUTS[@]}"; do
    # Capture screenshot with proper naming
  done
done
```

## Documentation Updates Needed

### 1. AGENTS.md Update
Add screenshot automation section:
```markdown
## Screenshot Automation

### Direct Method (Preferred)
```bash
npx playwright screenshot --color-scheme=dark --viewport-size=1920,1080 --wait-for-selector="selector" <url> <output-path>
```

### MCP Method (Limited)
- MCP Playwright tool restricted to temp directory
- Requires manual copying: `cp temp/file.png target/location.png`
- Use only when interactive browser control needed
```

### 2. LAYOUT_IMPLEMENTATION_SCREENSHOTS.md Update
Add automation section:
```markdown
## Screenshot Automation

### Script Method
```bash
./scripts/capture-layout-screenshots.sh
```

### Manual Method
```bash
npx playwright screenshot --color-scheme=dark --viewport-size=1920,1080 --wait-for-selector="button[data-testid='hsm-layout-trigger']" <url> <output-path>
```
```

### 3. New Script File
Create `/scripts/capture-layout-screenshots.sh` with full automation.

## Implementation Steps

1. ✅ **Research completed** - Playwright CLI method works
2. 🔄 **Create automation script** - Batch capture tool
3. 🔄 **Update documentation** - AGENTS.md and screenshot docs
4. 🔄 **Test automation** - Verify script works correctly
5. 🔄 **Update checklist** - Add automation to implementation checklist

## Benefits

### Before
- MCP tool → temp directory → manual copy → wrong location
- Interactive browser control needed
- Manual dark mode setting
- Manual layout switching

### After  
- Single command → direct location
- Automated batch processing
- Built-in dark mode
- Potential automated layout switching

## Decision Points

### Script Complexity
- **Simple version**: Just batch capture current state
- **Advanced version**: Auto-switch layouts, handle errors, progress reporting

### Error Handling
- Check if server is running
- Verify visualizer loaded
- Handle layout switching failures
- Validate screenshot creation

### Naming Convention
- `{layout}-{example}.png` - Current convention
- Include timestamp? - Probably not needed
- Include status? - Maybe for broken layouts

## Next Actions

1. Create automation script
2. Update documentation  
3. Test script functionality
4. Update implementation checklist
5. Use script for remaining screenshots
