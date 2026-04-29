# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps
#   Install only production dependencies so the final image stays lean.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Copy manifests first to exploit Docker layer caching.
COPY package.json package-lock.json* ./

RUN npm ci --omit=dev --ignore-scripts


# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 — build
#   Install all dependencies (including devDeps) and compile TypeScript.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source
COPY tsconfig.json tsup.config.ts ./
COPY src/ ./src/

RUN npm run build


# ──────────────────────────────────────────────────────────────────────────────
# Stage 3 — runtime
#   Minimal image: Node + Anypoint CLI + compiled bundle + prod node_modules.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

# ── Security hardening ────────────────────────────────────────────────────────
# Run as non-root user
RUN addgroup -S mcp && adduser -S mcp -G mcp

# ── System dependencies ───────────────────────────────────────────────────────
# curl  — optional health-check tooling
# ca-certificates — required for HTTPS calls made by the CLI
RUN apk add --no-cache curl ca-certificates

WORKDIR /app

# ── Global CLI tools ─────────────────────────────────────────────────────────
# anypoint-cli-v4 — called by execa at runtime
# supergateway   — wraps stdio MCP server as StreamableHTTP
RUN npm install -g anypoint-cli-v4 supergateway

# ── Application files ─────────────────────────────────────────────────────────
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/dist         ./dist
COPY package.json ./

# Fix ownership so the non-root user can read everything
RUN chown -R mcp:mcp /app

USER mcp

# ── Runtime configuration ─────────────────────────────────────────────────────
# These are safe defaults — override all sensitive values at runtime via
# `docker run -e`, Docker Secrets, or an orchestrator secret store.
# NEVER bake real credentials into the image.

ENV NODE_ENV=production \
    LOG_LEVEL=info \
    CLI_TIMEOUT_MS=30000 \
    CLI_MAX_RETRIES=3 \
    RATE_LIMIT_RPS=10 \
    CACHE_TTL_SECONDS=300 \
    ANYPOINT_HOST=https://anypoint.mulesoft.com \
    SUPERGATEWAY_PORT=8000

# ── Exposed port (StreamableHTTP via supergateway) ────────────────────────────
EXPOSE 8000

# ── Health check ──────────────────────────────────────────────────────────────
# supergateway exposes GET /health on the same port.
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -sf http://localhost:8000/health || exit 1

# ── Entry point ───────────────────────────────────────────────────────────────
# supergateway bridges stdio ↔ StreamableHTTP.
# The inner command is the original MCP server.
ENTRYPOINT ["supergateway", "--stdio", "node dist/index.js", "--outputTransport", "streamableHttp", "--port", "8000"]
