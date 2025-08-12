#!/bin/bash
set -euo pipefail

IMAGE_NAME="my-mapproxy"
CONTAINER_NAME="mapproxy-server"
PORT="8080"

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "Container is already running"
        echo "Access at: http://localhost:${PORT}/demo/"
        exit 0
    else
        echo "Starting existing container..."
        docker start ${CONTAINER_NAME}
        echo "Container started"
        exit 0
    fi
fi

docker build -t ${IMAGE_NAME} .

docker run -d \
  --name ${CONTAINER_NAME} \
  -p ${PORT}:8080 \
  -v "$(pwd)/config:/mapproxy" \
  -v "$(pwd)/cache:/mapproxy/cache" \
  -v "$(pwd)/data:/mapproxy/data" \
  ${IMAGE_NAME}

echo "MapProxy started successfully"
