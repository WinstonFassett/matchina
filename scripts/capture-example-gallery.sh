#!/bin/bash

# Fast Example Gallery Capture Script
# Captures every example with its default visualizer and layout, updates documentation

set -e  # Exit on any error

# Configuration
BASE_URL="http://localhost:4321/matchina/examples"
OUTPUT_DIR="/Users/winston/dev/personal/matchina/review/screenshots"
DOCS_DIR="/Users/winston/dev/personal/matchina/review"
VIEWPORT_SIZE="1920,1080"
COLOR_SCHEME="dark"

# Only examples that use MachineVisualizer with ReactFlow visualizers
EXAMPLES=(
    "traffic-light"
    "toggle" 
    "counter"
    "rock-paper-scissors"
    "hsm-combobox"
    "hsm-traffic-light"
    "hsm-checkout"
    "async-calculator"
    "auth-flow"
    "checkout"
    "stopwatch"
    "reactflow-subflow-test"
    "traffic-light-extended"
    # Skip these - they don't use MachineVisualizer:
    # "stopwatch-overview" - link page, no visualizer
    # "paren-checker" - uses BalancedParenthesesDemo, no visualizer
    # "color-scheme-explorer" - uses MatchinaColorPalette, no visualizer
)

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Track failures
FAILED_EXAMPLES=()

# Function to capture example with defaults - visualizer only
capture_example() {
    local example=$1
    local url="${BASE_URL}/${example}"
    local filename="${example}.png"
    local filepath="${OUTPUT_DIR}/${filename}"
    
    echo "📸 Capturing: $example"
    echo "   URL: $url"
    echo "   Output: $filepath"
    
    # Try Node Playwright first for element-specific capture
    if command -v node &> /dev/null && node -e "require('playwright')" &> /dev/null; then
        echo "   Using Node Playwright for element capture..."
        
        node -e "
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Set viewport and color scheme
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Navigate to page
    await page.goto('$url');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Wait for visualizer container to load
    await page.waitForSelector('.w-full.h-full.border.border-gray-200, .react-flow__viewport', { timeout: 10000 });
    
    console.log('Found visualizer element');
    
    // Find the visualizer container
    const visualizer = await page.locator('.w-full.h-full.border.border-gray-200, .react-flow__viewport').first();
    
    // Wait for ReactFlow content to render (nodes and edges)
    await page.waitForSelector('.react-flow__node, .react-flow__edge', { timeout: 5000 });
    console.log('ReactFlow content rendered');
    
    // Wait for ReactFlow auto-zoom to complete (longer wait)
    await page.waitForTimeout(3000);
    
    // Screenshot just the visualizer
    await visualizer.screenshot({ path: '$filepath' });
    
    await browser.close();
  } catch (error) {
    console.log('ERROR: ' + error.message);
    await browser.close();
    process.exit(1);
  }
})();
"
    else
        echo "   Falling back to CLI Playwright (full page)..."
        # Fallback to CLI method if Node/Playwright not available
        npx playwright screenshot \
            --color-scheme="$COLOR_SCHEME" \
            --viewport-size="$VIEWPORT_SIZE" \
            --wait-for-selector=".react-flow__node, .react-flow__edge" \
            "$url" \
            "$filepath"
    fi
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Success: $filename"
        return 0
    else
        echo "   ❌ Failed: $filename"
        FAILED_EXAMPLES+=("$example")
        return 1
    fi
}

# Function to check if server is running
check_server() {
    echo "🔍 Checking if server is running..."
    if curl -s "$BASE_URL/traffic-light" > /dev/null; then
        echo "   ✅ Server is running"
        return 0
    else
        echo "   ❌ Server is not running at $BASE_URL"
        echo "   Please start the server with: npm run dev:docs"
        return 1
    fi
}

# Function to generate example gallery documentation
generate_gallery_doc() {
    local gallery_file="${DOCS_DIR}/EXAMPLE_GALLERY.md"
    
    echo "📝 Generating example gallery documentation..."
    
    cat > "$gallery_file" << 'EOF'
# Example Gallery

## Overview
Visual documentation of all Matchina examples with their default visualizers and layouts.

---

## Examples

EOF
    
    # Add each example to the gallery
    for example in "${EXAMPLES[@]}"; do
        local filename="${example}.png"
        local title=$(echo "$example" | sed 's/-/ /g' | sed 's/\b\w/\u&/g')
        
        # Add to gallery
        cat >> "$gallery_file" << EOF
### ${title}

![${title}](screenshots/${filename})

**URL:** [/${example}](/matchina/examples/${example})

---

EOF
    done
    
    # Add footer
    cat >> "$gallery_file" << 'EOF'
## Generation Info

- **Captured:** $(date)
- **Visualizer:** Default for each example
- **Theme:** Dark mode
- **Size:** 1920x1080
- **Script:** `scripts/capture-example-gallery.sh`

---

*This gallery is automatically generated. Run `./scripts/capture-example-gallery.sh` to update.*
EOF
    
    echo "   ✅ Gallery documentation updated: $gallery_file"
}

# Function to show progress
show_progress() {
    local current=$1
    local total=$2
    local example=$3
    
    echo ""
    echo "📊 Progress: $current/$total"
    echo "🎯 Current: $example"
    echo ""
}

# Help function
show_help() {
    echo "Fast Example Gallery Capture Script"
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Enable verbose output"
    echo ""
    echo "Description:"
    echo "  Captures every example with its default visualizer and layout"
    echo "  Captures ONLY the visualizer component (no page chrome)"
    echo "  Updates documentation gallery with all screenshots"
    echo "  Fast execution - no layout switching, just defaults"
    echo "  Uses element-specific capture like existing tests"
    echo ""
    echo "Requirements:"
    echo "  - Playwright must be installed (npx playwright install)"
    echo "  - Development server must be running (npm run dev:docs)"
    echo "  - Output directory must be writable"
}

# Parse command line arguments
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Set verbose mode if requested
if [ "$VERBOSE" = true ]; then
    set -x  # Enable command tracing
fi

# Main execution
main() {
    echo ""
    echo "Fast Example Gallery Capture"
    echo "======================================"
    echo "Examples: ${#EXAMPLES[@]} (MachineVisualizer examples only)"
    echo "Output Directory: $OUTPUT_DIR"
    echo "Gallery Doc: ${DOCS_DIR}/EXAMPLE_GALLERY.md"
    echo ""
    
    # Check if server is running
    if ! check_server; then
        exit 1
    fi
    
    local total=${#EXAMPLES[@]}
    local current=0
    local success_count=0
    local failed_count=0
    
    echo "📸 Capturing all examples with defaults..."
    echo ""
    
    # Capture each example
    for example in "${EXAMPLES[@]}"; do
        current=$((current + 1))
        show_progress $current $total "$example"
        
        if capture_example "$example"; then
            success_count=$((success_count + 1))
        else
            failed_count=$((failed_count + 1))
        fi
        
        # Small delay between captures
        sleep 0.5
    done
    
    echo ""
    echo "📊 Capture Complete!"
    echo "==================="
    echo "Total attempted: $total"
    echo "Successful: $success_count"
    echo "Failed: $failed_count"
    echo ""
    
    if [ $failed_count -gt 0 ]; then
        echo "❌ FAILED CAPTURES:"
        echo "==================="
        for failed_example in "${FAILED_EXAMPLES[@]}"; do
            echo "  - $failed_example"
        done
        echo ""
        echo "🔧 Fix these examples before re-running"
    fi
    
    # Generate gallery documentation
    generate_gallery_doc
    
    echo ""
    echo "✅ Example Gallery Complete!"
    echo "=========================="
    echo "📁 Screenshots: $OUTPUT_DIR"
    echo "📝 Gallery: ${DOCS_DIR}/EXAMPLE_GALLERY.md"
    echo ""
    echo "🔗 View the gallery at: ${DOCS_DIR}/EXAMPLE_GALLERY.md"
    echo ""
    
    # Only show successful captures, not all files
    if [ $success_count -gt 0 ]; then
        echo "📁 Successfully captured:"
        ls -la "$OUTPUT_DIR"/*.png 2>/dev/null | grep "$(date '+%Y-%m-%d')" | while read -r line; do
            echo "   $line"
        done
    fi
}

# Run main function
main "$@"
