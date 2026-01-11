# URL-Based Visualizer Control System

## Overview
URL-based parameters to control visualizer selection, layout types, and settings without manual UI interaction.

## URL Parameter Structure

### Base Format
```
{example-url}?viz={visualizer}&layout={layout}&settings={encoded-settings}
```

### Examples
```
# Traffic light with ReactFlow V2, Sugiyama layout
http://localhost:4321/matchina/examples/traffic-light?viz=reactflow-v2&layout=sugiyama

# HSM combobox with ReactFlow V2, Force layout, custom spacing
http://localhost:4321/matchina/examples/hsm-combobox?viz=reactflow-v2&layout=force&settings=nodeSpacing=150,layerSpacing=120

# Traffic light with ReactFlow V2, Grid layout, 3 columns
http://localhost:4321/matchina/examples/traffic-light?viz=reactflow-v2&layout=grid&settings=cols=3,direction=row
```

## Parameter Specifications

### viz (Visualizer)
- `reactflow` - Original ReactFlow
- `reactflow-v2` - ReactFlow V2 (default)
- `sketch` - Sketch visualizer
- `forcegraph` - ForceGraph visualizer
- `mermaid-statechart` - Mermaid statechart
- `mermaid-flowchart` - Mermaid flowchart

### layout (Layout Type)
- `sugiyama` - ELK layered algorithm
- `tree` - ELK mrtree algorithm
- `force` - ELK force algorithm
- `organic` - ELK stress algorithm
- `circular` - ELK radial/graphviz circo
- `grid` - Custom grid layout

### settings (Layout Settings)
URL-encoded JSON string with layout-specific parameters:
```
{
  "nodeSpacing": 120,
  "layerSpacing": 100,
  "direction": "DOWN",
  "compactness": 0.5
}
```

URL-encoded: `%7B%22nodeSpacing%22%3A120%2C%22layerSpacing%22%3A100%7D`

## Layout-Specific Settings

### Sugiyama (layered)
```json
{
  "nodeSpacing": 120,
  "layerSpacing": 100,
  "direction": "DOWN",
  "thoroughness": 7,
  "compactComponents": false
}
```

### Tree (mrtree)
```json
{
  "nodeSpacing": 120,
  "layerSpacing": 100,
  "direction": "DOWN"
}
```

### Force (force)
```json
{
  "nodeSpacing": 120,
  "layerSpacing": 200,
  "iterations": 300,
  "repulsion": 12,
  "attraction": 0.33
}
```

### Organic (stress)
```json
{
  "nodeSpacing": 100,
  "layerSpacing": 200,
  "descent": 0.5,
  "scale": 1.0
}
```

### Circular (radial/circo)
```json
{
  "nodeSpacing": 100,
  "radius": 200,
  "startAngle": 270,
  "clockwise": true
}
```

### Grid (custom)
```json
{
  "nodeSpacing": 120,
  "cols": 3,
  "maxCols": 6,
  "maxRows": 6,
  "direction": "row",
  "alignment": "center",
  "compactness": 0.5,
  "autoFit": false,
  "preferSquare": true
}
```

## Implementation Plan

### 1. URL Parameter Parser
```typescript
interface VisualizerConfig {
  viz: VisualizerType;
  layout?: LayoutType;
  settings?: Record<string, any>;
}

function parseVisualizerConfig(url: string): VisualizerConfig {
  const params = new URLSearchParams(url.split('?')[1] || '');
  
  return {
    viz: params.get('viz') as VisualizerType || 'reactflow-v2',
    layout: params.get('layout') as LayoutType,
    settings: params.get('settings') ? 
      JSON.parse(decodeURIComponent(params.get('settings'))) : 
      undefined
  };
}
```

### 2. Visualizer Component Updates
```typescript
// In ReactFlowInspectorV2.tsx
const [config, setConfig] = useState<VisualizerConfig>({
  viz: 'reactflow-v2',
  layout: undefined,
  settings: undefined
});

// Parse URL on mount
useEffect(() => {
  const urlConfig = parseVisualizerConfig(window.location.href);
  setConfig(urlConfig);
}, []);

// Apply config to visualizer
useEffect(() => {
  if (config.layout) {
    // Set layout type
    setSelectedLayout(config.layout);
  }
  if (config.settings) {
    // Apply layout settings
    updateLayoutSettings(config.settings);
  }
}, [config]);
```

### 3. Playwright URL Builder
```typescript
function buildVisualizerUrl(
  example: string,
  viz: string = 'reactflow-v2',
  layout?: string,
  settings?: Record<string, any>
): string {
  const baseUrl = `http://localhost:4321/matchina/examples/${example}`;
  const params = new URLSearchParams();
  
  params.set('viz', viz);
  
  if (layout) {
    params.set('layout', layout);
  }
  
  if (settings) {
    params.set('settings', encodeURIComponent(JSON.stringify(settings)));
  }
  
  return `${baseUrl}?${params.toString()}`;
}
```

## Enhanced Playwright Automation

### Universal Capture Function
```typescript
async function captureVisualizerScreenshot(
  example: string,
  viz: string = 'reactflow-v2',
  layout?: string,
  settings?: Record<string, any>,
  outputPath: string
): Promise<void> {
  const url = buildVisualizerUrl(example, viz, layout, settings);
  
  await npx playwright screenshot(
    '--color-scheme=dark',
    '--viewport-size=1920,1080',
    `--wait-for-selector=${getWaitSelector(viz)}`,
    url,
    outputPath
  );
}
```

### Batch Capture Script 2.0
```bash
#!/bin/bash
# Enhanced screenshot capture with URL parameters

EXAMPLES=("traffic-light" "hsm-combobox")
LAYOUTS=("sugiyama" "tree" "force" "organic" "circular" "grid")
VIZUALIZERS=("reactflow-v2")

# Predefined settings presets
declare -A SETTINGS_PRESETS
SETTINGS_PRESETS["compact"]='{"nodeSpacing":80,"layerSpacing":60}'
SETTINGS_PRESETS["spacious"]='{"nodeSpacing":200,"layerSpacing":150}'
SETTINGS_PRESETS["grid-3x2"]='{"cols":3,"direction":"row"}'
SETTINGS_PRESETS["grid-4x3"]='{"cols":4,"direction":"row"}'

for example in "${EXAMPLES[@]}"; do
  for viz in "${VIZUALIZERS[@]}"; do
    for layout in "${LAYOUTS[@]}"; do
      filename="${viz}-${layout}-${example}.png"
      url="${BASE_URL}/${example}?viz=${viz}&layout=${layout}"
      
      echo "📸 Capturing: $viz - $layout - $example"
      npx playwright screenshot \
        --color-scheme=dark \
        --viewport-size=1920,1080 \
        --wait-for-selector="button[data-testid='hsm-layout-trigger']" \
        "$url" \
        "$OUTPUT_DIR/$filename"
    done
  done
done
```

### Custom Settings Capture
```typescript
// Capture with custom settings
await captureVisualizerScreenshot(
  'traffic-light',
  'reactflow-v2',
  'grid',
  { cols: 4, direction: 'row', alignment: 'center' },
  'grid-4col-centered-traffic-light.png'
);
```

## Testing Scenarios

### 1. Layout Comparison
```bash
# Same example, different layouts
for layout in sugiyama tree force organic circular grid; do
  captureVisualizerScreenshot "traffic-light" "reactflow-v2" "$layout" "" "traffic-light-${layout}.png"
done
```

### 2. Settings Comparison
```bash
# Same layout, different settings
captureVisualizerScreenshot "traffic-light" "reactflow-v2" "grid" '{"cols":2}' "grid-2col-traffic-light.png"
captureVisualizerScreenshot "traffic-light" "reactflow-v2" "grid" '{"cols":4}' "grid-4col-traffic-light.png"
captureVisualizerScreenshot "traffic-light" "reactflow-v2" "grid" '{"cols":6}' "grid-6col-traffic-light.png"
```

### 3. Visualizer Comparison
```bash
# Same example, different visualizers
for viz in reactflow reactflow-v2 sketch forcegraph; do
  captureVisualizerScreenshot "traffic-light" "$viz" "" "" "traffic-light-${viz}.png"
done
```

## Benefits

### Before (Manual)
- Navigate to page
- Click visualizer dropdown
- Click layout dropdown
- Adjust settings manually
- Take screenshot
- Repeat for each combination

### After (URL-based)
- Single URL construction
- Direct navigation to configured state
- Immediate screenshot capture
- Batch processing possible

### Use Cases

1. **Automated Testing**: Test all layout/setting combinations
2. **Documentation**: Generate consistent screenshots
3. **Debugging**: Share exact configuration with others
4. **Benchmarks**: Compare performance across settings
5. **Reviews**: Link to specific configurations

## Implementation Priority

### Phase 1: Basic URL Control
- [ ] URL parameter parser
- [ ] Visualizer component integration
- [ ] Basic layout selection via URL

### Phase 2: Settings Integration
- [ ] Settings encoding/decoding
- [ ] Layout-specific settings support
- [ ] Default settings handling

### Phase 3: Enhanced Automation
- [ ] URL builder utilities
- [ ] Enhanced Playwright script
- [ ] Batch capture with custom settings

### Phase 4: Advanced Features
- [ ] Settings presets
- [ ] Configuration validation
- [ ] Error handling for invalid parameters

This system will eliminate the tedious manual clicking and enable powerful automated testing scenarios.
