FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    sqlite3 \
    libsqlite3-dev \
    gdal-bin \
    libgdal-dev \
    python3-gdal \
    curl \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get update \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir MapProxy[yaml] Pillow

RUN useradd -m mapproxy \
    && mkdir -p /mapproxy/data /mapproxy/cache /mapproxy/logs \
    && chown -R mapproxy:mapproxy /mapproxy

COPY package*.json tsconfig.json merge.ts /merger/
WORKDIR /merger
RUN npm ci && npm run build

USER mapproxy
WORKDIR /mapproxy
RUN mapproxy-util create -t base-config /mapproxy

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl -f http://localhost:8080/ || exit 1

CMD ["mapproxy-util", "serve-develop", "/mapproxy/mapproxy.yaml", "-b", "0.0.0.0:8080"]