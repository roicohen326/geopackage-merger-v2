#!/bin/bash
set -euo pipefail

readonly SERVICES=("http://localhost:8080/" "http://localhost:8081/")
readonly PROTOCOLS=("WMS" "WMTS" "TMS")
readonly BASE_URL="http://localhost:8080"

log() { echo "$(date '+%H:%M:%S') $*"; }
error() { log "ERROR: $*" >&2; exit 1; }

check_requirements() {
    command -v docker-compose >/dev/null || error "docker-compose not found"
    command -v curl >/dev/null || error "curl not found"
    [[ -f merge.ts ]] || error "merge.ts not found"
    [[ -f package.json ]] || error "package.json not found"
}

verify_files() {
    # Create mapproxy directories if they don't exist
    mkdir -p ./mapproxy/{data,cache}
    
    # Check if mapproxy.yaml exists
    [[ -f "./mapproxy/mapproxy.yaml" ]] || error "mapproxy.yaml not found in ./mapproxy/ directory"
    
    # Check for any .gpkg files in the project (dynamic discovery)
    local gpkg_count=$(find . -name "*.gpkg" -type f | wc -l)
    if [[ $gpkg_count -eq 0 ]]; then
        log "Warning: No GeoPackage files found in project directory"
        log "Place your .gpkg files anywhere in the project - they will be auto-discovered"
    else
        log "Found $gpkg_count GeoPackage file(s) for processing"
        find . -name "*.gpkg" -type f | while read -r file; do
            log "  - $(basename "$file") ($(du -h "$file" | cut -f1))"
        done
    fi
    
    log "Configuration verified - setup is fully dynamic"
}

build_and_start() {
    log "Building and starting services"
    docker-compose down --remove-orphans 2>/dev/null || true
    docker-compose build --quiet
    docker-compose up -d
    
    local retries=60  # Increased timeout for tile processing
    for service in "${SERVICES[@]}"; do
        log "Waiting for $service to start..."
        while ! curl -sf "$service" >/dev/null 2>&1 && ((retries-- > 0)); do
            sleep 2
        done
        [[ $retries -gt 0 ]] || error "Service $service failed to start"
        log "✓ $service is ready"
    done
    log "All services started successfully"
}

test_protocols() {
    local endpoints=(
        "service?SERVICE=WMS&REQUEST=GetCapabilities"
        "wmts/1.0.0/WMTSCapabilities.xml"
        "tms/1.0.0/"
    )
    
    log "Testing MapProxy protocols..."
    for i in "${!PROTOCOLS[@]}"; do
        local protocol="${PROTOCOLS[$i]}"
        local endpoint="${endpoints[$i]}"
        if curl -sf "${BASE_URL}/${endpoint}" >/dev/null; then
            log "✓ $protocol protocol working"
        else
            error "✗ $protocol protocol failed"
        fi
    done
}

verify_layers() {
    log "Verifying available layers..."
    local capabilities
    capabilities=$(curl -sf "${BASE_URL}/service?SERVICE=WMS&REQUEST=GetCapabilities") || error "Failed to get WMS capabilities"
    
    local layers=("bluemarble" "syria" "composite" "merged")
    local found_layers=0
    
    for layer in "${layers[@]}"; do
        if grep -q "<Name>$layer</Name>" <<< "$capabilities"; then
            log "✓ Layer '$layer' available"
            ((found_layers++))
        else
            log "✗ Layer '$layer' not found"
        fi
    done
    
    log "Found $found_layers/${#layers[@]} layers"
    [[ $found_layers -gt 0 ]] || error "No layers found in MapProxy"
}

test_qgis_connectivity() {
    log "Testing QGIS connectivity endpoints..."
    
    # Get first available layer dynamically
    local capabilities
    capabilities=$(curl -sf "${BASE_URL}/service?SERVICE=WMS&REQUEST=GetCapabilities" 2>/dev/null) || {
        log "✗ Could not get capabilities for QGIS test"
        return 1
    }
    
    local first_layer=$(echo "$capabilities" | grep -o '<Layer[^>]*><n>[^<]*</n>' | head -1 | sed 's/.*<n>\([^<]*\)<\/Name>.*/\1/' 2>/dev/null)
    
    if [[ -n "$first_layer" ]]; then
        # Test WMS GetMap request with dynamically found layer
        local wms_url="${BASE_URL}/service?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=${first_layer}&SRS=EPSG:4326&BBOX=-180,-90,180,90&WIDTH=256&HEIGHT=256&FORMAT=image/jpeg"
        if curl -sf "$wms_url" >/dev/null; then
            log "✓ WMS GetMap request successful (tested with layer: $first_layer)"
        else
            log "✗ WMS GetMap request failed"
        fi
    fi
    
    # Show connection URLs for QGIS
    log ""
    log "🗺️  QGIS Connection URLs:"
    log "   WMS: ${BASE_URL}/service?"
    log "   WMTS: ${BASE_URL}/wmts/1.0.0/WMTSCapabilities.xml"
    log "   TMS: ${BASE_URL}/tms/1.0.0/"
    log ""
    log "💡 Available layers will be auto-discovered in QGIS from your GeoPackage files"
}

show_logs() {
    log "Recent MapProxy logs:"
    docker-compose logs --tail=20 mapproxy
}

main() {
    case "${1:-all}" in
        "build") 
            check_requirements
            verify_files
            build_and_start 
            ;;
        "test") 
            test_protocols 
            verify_layers
            test_qgis_connectivity
            ;;
        "logs")
            show_logs
            ;;
        "all") 
            check_requirements
            verify_files
            build_and_start
            test_protocols
            verify_layers
            test_qgis_connectivity
            log ""
            log "🚀 Setup complete!"
            log "   MapProxy Demo: ${BASE_URL}/demo/"
            log "   File Browser: http://localhost:8081/"
            log "   Layers: Auto-discovered from your GeoPackage files"
            log ""
            log "📋 Usage:"
            log "   1. Place any .gpkg files in your project directory"
            log "   2. Run './setup.sh build' to process them"
            log "   3. Connect QGIS to: ${BASE_URL}/service?"
            log "   4. All layers will be automatically available"
            ;;
        *) 
            error "Usage: $0 [build|test|logs|all]" 
            ;;
    esac
}

main "$@"