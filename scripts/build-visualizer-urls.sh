#!/bin/bash

# URL Builder Utility for Visualizer Testing
# Simple utility to build and test visualizer URLs

build_visualizer_url() {
    local example=$1
    local viz=${2:-"reactflow-v2"}
    local layout=$3
    local settings=$4
    
    local url="http://localhost:4321/matchina/examples/${example}"
    local params=()
    
    # Add visualizer parameter
    params+=("viz=${viz}")
    
    # Add layout parameter if specified
    if [[ -n "$layout" ]]; then
        params+=("layout=${layout}")
    fi
    
    # Add settings parameter if specified
    if [[ -n "$settings" && "$settings" != "null" ]]; then
        # URL encode the JSON settings
        local encoded_settings=$(echo "$settings" | jq -r @uri 2>/dev/null || echo "$settings")
        params+=("settings=${encoded_settings}")
    fi
    
    # Join parameters
    if [[ ${#params[@]} -gt 0 ]]; then
        url="${url}?$(IFS='&'; echo "${params[*]}")"
    fi
    
    echo "$url"
}

# Test URLs
echo "🔗 Visualizer URL Examples"
echo "========================="
echo ""

# Basic examples
echo "Basic Examples:"
echo "1. Traffic light, ReactFlow V2, Sugiyama:"
build_visualizer_url "traffic-light" "reactflow-v2" "sugiyama"
echo ""

echo "2. HSM combobox, ReactFlow V2, Force:"
build_visualizer_url "hsm-combobox" "reactflow-v2" "force"
echo ""

# Settings examples
echo "Settings Examples:"
echo "3. Traffic light, ReactFlow V2, Grid with custom settings:"
build_visualizer_url "traffic-light" "reactflow-v2" "grid" '{"cols":4,"direction":"row","alignment":"center"}'
echo ""

echo "4. HSM combobox, ReactFlow V2, Force with custom settings:"
build_visualizer_url "hsm-combobox" "reactflow-v2" "force" '{"nodeSpacing":150,"repulsion":15}'
echo ""

# Different visualizers
echo "Different Visualizers:"
echo "5. Traffic light, ReactFlow (original):"
build_visualizer_url "traffic-light" "reactflow"
echo ""

echo "6. Traffic light, ForceGraph:"
build_visualizer_url "traffic-light" "forcegraph"
echo ""

echo "7. Traffic light, Sketch:"
build_visualizer_url "traffic-light" "sketch"
echo ""

echo "8. Traffic light, Mermaid Statechart:"
build_visualizer_url "traffic-light" "mermaid-statechart"
echo ""

# Complex example
echo "Complex Example:"
echo "9. HSM combobox, ReactFlow V2, Grid with 4 columns and center alignment:"
build_visualizer_url "hsm-combobox" "reactflow-v2" "grid" '{"cols":4,"direction":"row","alignment":"center","compactness":0.3}'
echo ""

echo "📋 Usage Examples:"
echo "   # Open in browser"
echo "   open \"$(build_visualizer_url 'traffic-light' 'reactflow-v2' 'sugiyama')\""
echo ""
echo "   # Screenshot with Playwright"
echo "   npx playwright screenshot --color-scheme=dark --viewport-size=1920,1080 --wait-for-selector=\"button[data-testid='hsm-layout-trigger']\" \"$(build_visualizer_url 'traffic-light' 'reactflow-v2' 'sugiyama')\" screenshot.png"
echo ""
