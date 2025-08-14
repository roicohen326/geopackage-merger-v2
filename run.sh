#!/bin/bash

set -e

# Configuration
CONTAINER_NAME="mapproxy-gpkg"
PORT=8081

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Cleanup function
cleanup() {
    log "Cleaning up previous containers..."
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
}

# Validate inputs
if [[ $# -ne 2 ]]; then
    error "Usage: $0 <file1_or_url> <file2_or_url>"
fi

FILE1="$1"
FILE2="$2"

log "Starting MapProxy setup..."

# Setup directories
mkdir -p data config cache

# Step 1: Handle input files (local or URLs)
log "Processing input files..."

# Handle FILE1
if [[ "$FILE1" == http* ]]; then
    if ! wget -q --show-progress -O data/file1.gpkg "$FILE1"; then
        error "Failed to download file 1"
    fi
else
    if [[ ! -f "$FILE1" ]]; then
        error "File doesn't exist: $FILE1"
    fi
    cp "$FILE1" data/file1.gpkg
fi

# Handle FILE2
if [[ "$FILE2" == http* ]]; then
    if ! wget -q --show-progress -O data/file2.gpkg "$FILE2"; then
        error "Failed to download file 2"
    fi
else
    if [[ ! -f "$FILE2" ]]; then
        error "File doesn't exist: $FILE2"
    fi
    cp "$FILE2" data/file2.gpkg
fi

# Verify input files
for file in data/file1.gpkg data/file2.gpkg; do
    if ! sqlite3 "$file" "SELECT name FROM sqlite_master WHERE type='table';" &>/dev/null; then
        error "Invalid GeoPackage: $file"
    fi
done

# Step 2: Merge GeoPackage files
log "Merging files..."

rm -f data/merged*.gpkg

if [[ -f "merge.ts" && -f "package.json" ]]; then
    npm install --silent
    npx tsc
    node dist/merge.js data/file1.gpkg data/file2.gpkg data/merged.gpkg
    
    # Check for timestamped output
    if ls data/merged_*.gpkg 1> /dev/null 2>&1; then
        MERGED_OUTPUT=$(ls data/merged_*.gpkg | head -1)
        cp "$MERGED_OUTPUT" data/merged.gpkg
    elif [[ ! -f "data/merged.gpkg" ]]; then
        error "Merge failed - no output file created"
    fi
    
    TILE_COUNT=$(sqlite3 data/merged.gpkg "SELECT COUNT(*) FROM merged_tiles;" 2>/dev/null || echo "0")
    log "Merged: ${TILE_COUNT} tiles"
else
    warn "TypeScript merger not found, using fallback"
    cp data/file2.gpkg data/merged.gpkg
    TILE_COUNT="unknown"
fi

# Step 3: Generate MapProxy config
log "Configuring MapProxy..."

# No need to check table structure - treat GeoPackage as source

cat > config/mapproxy.yaml << EOF
# Fixed MapProxy Configuration - Treat GeoPackage as Source

services:
  demo:
  tms:
    use_grid_names: true
    origin: 'nw'
  wmts:
  wms:
    md:
      title: Jordan + Syria Merged GeoPackage
      abstract: Merged satellite/map tiles from Jordan and Syria

layers:
  - name: merged_layer
    title: Jordan + Syria Merged
    sources: [merged_source]

# Treat GeoPackage as a SOURCE, not a cache
sources:
  merged_source:
    type: tile
    url: 'geopackage:///mapproxy/data/merged.gpkg'

grids:
  webmercator:
    base: GLOBAL_WEBMERCATOR

globals:
  cache:
    base_dir: '/mapproxy/cache'
EOF

log "MapProxy configuration generated"

# Step 4: Deploy container
log "Deploying container..."

cleanup

if ! docker images kartoza/mapproxy | grep -q kartoza; then
    docker pull kartoza/mapproxy
fi

# Deploy new container
docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${PORT}:8080 \
    -v "$(pwd)/config/mapproxy.yaml:/mapproxy/mapproxy.yaml:ro" \
    -v "$(pwd)/data:/mapproxy/data:ro" \
    -v "$(pwd)/cache:/mapproxy/cache" \
    kartoza/mapproxy

sleep 8

# Step 5: Verify deployment
if ! docker ps | grep -q ${CONTAINER_NAME}; then
    error "Container failed to start. Check: docker logs ${CONTAINER_NAME}"
fi

BASE_URL="http://localhost:${PORT}"

# Test tile request
TILE_URL="${BASE_URL}/tms/1.0.0/merged_layer/webmercator/1/0/0.png"
HTTP_CODE=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" "$TILE_URL" || echo "000")

if [[ "$HTTP_CODE" == "200" ]]; then
    log "✓ Service ready"
else
    warn "✗ Tile requests failing (HTTP $HTTP_CODE)"
fi

# Final status report
log "DEPLOYMENT COMPLETE"
echo "MapProxy Demo: ${BASE_URL}/demo/
QGIS WMS URL: ${BASE_URL}/service
Layer Name: merged_layer
Tiles: ${TILE_COUNT:-$SAMPLE_COUNT}
Management: docker logs/stop/rm ${CONTAINER_NAME}$(if [[ "$HTTP_CODE" != "200" ]]; then echo "
Debug: Check container logs: docker logs ${CONTAINER_NAME}"; fi)"