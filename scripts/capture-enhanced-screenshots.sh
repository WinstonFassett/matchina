#!/bin/bash

# Enhanced Layout Screenshot Capture Script
# Captures screenshots of visualizer areas only (not whole pages) for all layouts and examples

set -e  # Exit on any error

# Configuration
BASE_URL="http://localhost:4321/matchina/examples"
OUTPUT_DIR="/Users/winston/dev/personal/matchina/review/screenshots"
VIEWPORT_SIZE="1920,1080"
COLOR_SCHEME="dark"

# Visualizers, layouts, and examples
VIZUALIZERS=("reactflow-v2" "reactflow" "sketch" "forcegraph" "mermaid-statechart" "mermaid-flowchart")
LAYOUTS=("sugiyama" "tree" "force" "organic" "circular" "grid")
EXAMPLES=("traffic-light" "hsm-combobox" "hsm-traffic-light" "toggle" "counter" "rock-paper-scissors" "async-calculator" "paren-checker" "fetcher-advanced" "promise-machine-fetcher" "reactflow-subflow-test" "stopwatch-overview" "stopwatch" "color-scheme-explorer" "auth-flow" "checkout" "hsm-checkout" "traffic-light-extended")

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Function to build URL with parameters
build_url() {
    local example=$1
    local viz=$2
    local layout=$3
    local settings=$4
    
    local url="${BASE_URL}/${example}"
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
        local encoded_settings=$(echo "$settings" | jq -r @uri)
        params+=("settings=${encoded_settings}")
    fi
    
    # Join parameters
    if [[ ${#params[@]} -gt 0 ]]; then
        url="${url}?$(IFS='&'; echo "${params[*]}")"
    fi
    
    echo "$url"
}

# Function to get wait selector based on visualizer
get_wait_selector() {
    local viz=$1
    case $viz in
        "reactflow"|"reactflow-v2")
            echo "button[data-testid='hsm-layout-trigger']"
            ;;
        "sketch")
            echo ".sketch-canvas"
            ;;
        "forcegraph")
            echo ".force-graph-canvas"
            ;;
        "mermaid-statechart"|"mermaid-flowchart")
            echo ".mermaid-container"
            ;;
        *)
            echo "body"  # Fallback
            ;;
    esac
}

# Function to capture screenshot of visualizer area only
capture_visualizer_screenshot() {
    local example=$1
    local viz=$2
    local layout=$3
    
    # Build URL - no hardcoded settings, let app handle defaults
    local url=$(build_url "$example" "$viz" "$layout" "null")
    
    # Generate filename
    local filename_parts=("$viz")
    if [[ -n "$layout" ]]; then
        filename_parts+=("$layout")
    fi
    filename_parts+=("$example")
    
    local filename=$(IFS='-'; echo "${filename_parts[*]}").png
    local filepath="${OUTPUT_DIR}/${filename}"
    
    echo "📸 Capturing: $viz"
    if [[ -n "$layout" ]]; then
        echo "   Layout: $layout"
    fi
    echo "   Example: $example"
    echo "   URL: $url"
    echo "   Output: $filepath"
    
    # Get wait selector for visualizer area
    local wait_selector=$(get_visualizer_selector "$viz")
    
    # Capture screenshot of visualizer area only
    npx playwright screenshot \
        --color-scheme="$COLOR_SCHEME" \
        --viewport-size="$VIEWPORT_SIZE" \
        --wait-for-selector="$wait_selector" \
        "$url" \
        "$filepath"
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Success: $filename"
        return 0
    else
        echo "   ❌ Failed: $filename"
        return 1
    fi
}

# Function to get visualizer area selector (not whole page)
get_visualizer_selector() {
    local viz=$1
    case $viz in
        "reactflow"|"reactflow-v2")
            echo "[data-testid='reactflow-visualizer']"
            ;;
        "sketch")
            echo "[data-testid='sketch-canvas']"
            ;;
        "forcegraph")
            echo "[data-testid='force-graph-canvas']"
            ;;
        "mermaid-statechart"|"mermaid-flowchart")
            echo "[data-testid='mermaid-container']"
            ;;
        *)
            echo "body"  # Fallback to whole page
            ;;
    esac
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

# Function to show progress
show_progress() {
    local current=$1
    local total=$2
    local description=$3
    
    echo ""
    echo "📊 Progress: $current/$total"
    echo "🎯 Current: $description"
    echo ""
}

# Help function
show_help() {
    echo "Enhanced Layout Screenshot Capture Script"
    echo "Usage: $0 [OPTIONS] [MODE]"
    echo ""
    echo "Modes:"
    echo "  basic              Capture basic layouts with app defaults (default)"
    echo "  all                 Capture all layouts with app defaults"
    echo "  custom              Custom configuration (see examples)"
    echo ""
    echo "Options:"
    echo "  -h, --help         Show this help message"
    echo "  -v, --verbose      Enable verbose output"
    echo "  -e, --example      Specific example only"
    echo "  -l, --layout       Specific layout only"
    echo "  -s, --viz          Specific visualizer only"
    echo ""
    echo "Examples:"
    echo "  $0                              # Capture all examples with ReactFlow V2"
    echo "  $0 -e traffic-light              # Only traffic light example"
    echo "  $0 -l grid -e hsm-combobox       # Grid layout on HSM only"
    echo "  $0 -s reactflow -e toggle         # ReactFlow original on toggle"
    echo ""
    echo "Available examples:"
    echo "  Basic: traffic-light, toggle, counter, rock-paper-scissors"
    echo "  Hierarchical: hsm-combobox, hsm-traffic-light, hsm-checkout"
    echo "  Advanced: async-calculator, auth-flow, checkout"
    echo "  Stopwatch: stopwatch-overview, stopwatch (multiple variants)"
    echo "  Testing: reactflow-subflow-test, paren-checker"
    echo "  Visual: color-scheme-explorer"
    echo "  Extended: traffic-light-extended"
    echo ""
    echo "Requirements:"
    echo "  - Playwright must be installed (npx playwright install)"
    echo "  - Development server must be running (npm run dev:docs)"
    echo "  - jq must be installed for JSON encoding"
    echo "  - Output directory must be writable"
}

# Parse command line arguments
VERBOSE=false
SPECIFIC_EXAMPLE=""
SPECIFIC_LAYOUT=""
SPECIFIC_VIZ=""
MODE="basic"

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
        -e|--example)
            SPECIFIC_EXAMPLE="$2"
            shift 2
            ;;
        -l|--layout)
            SPECIFIC_LAYOUT="$2"
            shift 2
            ;;
        -s|--viz)
            SPECIFIC_VIZ="$2"
            shift 2
            ;;
        basic|presets|all|custom)
            MODE="$1"
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

# Main execution functions
capture_basic() {
    local examples=("${SPECIFIC_EXAMPLE:-${EXAMPLES[@]}")
    local layouts=("${SPECIFIC_LAYOUT:-${LAYOUTS[@]}")
    local vizs=("${SPECIFIC_VIZ:-reactflow-v2}")
    
    local total=$((${#examples[@]} * ${#layouts[@]} * ${#viz[@]}))
    local current=0
    local success_count=0
    local failed_count=0
    
    for example in "${examples[@]}"; do
        for viz in "${vizs[@]}"; do
            for layout in "${layouts[@]}"; do
                current=$((current + 1))
                show_progress $current $total "$viz - $layout - $example"
                
                if capture_visualizer_screenshot "$example" "$viz" "$layout"; then
                    success_count=$((success_count + 1))
                else
                    failed_count=$((failed_count + 1))
                fi
                
                sleep 1
            done
        done
    done
    
    echo "Basic capture complete: $success_count success, $failed_count failed"
}

capture_presets() {
    echo "❌ Presets mode removed - let the app handle its own defaults"
    echo "Use basic mode to test layouts with app defaults"
    return 1
}

# Main execution
main() {
    echo "� Captures visualizer areas only (not whole pages)"
    echo "  Tests layout functionality without page chrome"
    echo "  Focused on the visualizer component area"
    echo ""
    
    # Check if server is running
    if ! check_server; then
        exit 1
    fi
    
    # Check dependencies
    if ! command -v jq &> /dev/null; then
        echo "❌ jq is required for JSON encoding. Please install jq."
        exit 1
    fi
    
    # Execute based on mode
    case $MODE in
        basic)
            capture_basic
            ;;
        presets)
            capture_presets
            ;;
        all)
            echo "🔄 Capturing all layouts with app defaults..."
            capture_basic
            ;;
        custom)
            echo "🔧 Custom mode - implement specific capture logic"
            # Add custom capture logic here
            ;;
        *)
            echo "Unknown mode: $MODE"
            show_help
            exit 1
            ;;
    esac
    
    echo ""
    echo "📊 Capture Complete!"
    echo "==================="
    echo "Mode: $MODE"
    echo "Visualizer-only capture: Yes"
    echo "Output directory: $OUTPUT_DIR"
    echo ""
    
    # List captured files
    echo "📁 Recent captures:"
    ls -la "$OUTPUT_DIR"/*.png 2>/dev/null | tail -10 | while read -r line; do
        echo "   $line"
    done
}

# Run main function
main "$@"
