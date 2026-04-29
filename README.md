# MuleSoft MCP Server

A production-ready **Model Context Protocol (MCP) server** that wraps the [Anypoint CLI v4](https://docs.mulesoft.com/anypoint-cli/latest/) and exposes Anypoint Platform operations as structured MCP tools.

---

## Architecture

```
src/
├── config/
│   └── env.ts                        # Zod-validated environment variables
├── cli/
│   └── cli-service.ts                # Core execa wrapper (auth, JSON parsing, timeout, retry)
├── services/                         # Domain services
│   ├── design-center.service.ts
│   ├── runtime-manager.service.ts    # Includes CloudHub 1.0, CloudHub 2.0, standalone apps
│   ├── exchange.service.ts
│   ├── api-manager.service.ts
│   └── account.service.ts
├── mcp/
│   ├── server.ts                     # McpServer setup + transport
│   └── tools/                        # Tool registration per domain
│       ├── design-center.tools.ts
│       ├── runtime-manager.tools.ts  # CloudHub 2.0 + standalone runtime tools
│       ├── exchange.tools.ts
│       ├── api-manager.tools.ts
│       └── account.tools.ts
├── utils/
│   ├── logger.ts                     # Winston structured logger
│   ├── errors.ts                     # Typed error classes + formatter
│   ├── retry.ts                      # Exponential-backoff retry
│   ├── cache.ts                      # In-memory TTL cache
│   └── rate-limiter.ts               # Token-bucket rate limiter
├── types/
│   └── index.ts                      # Shared TypeScript interfaces
├── container.ts                      # Dependency-injection factory
└── index.ts                          # Entry point
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18 |
| anypoint-cli-v4 | latest |

```bash
npm install -g anypoint-cli-v4
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — supply **one** of the two auth options:

```env
# Option A: username / password
ANYPOINT_USERNAME=your-username
ANYPOINT_PASSWORD=your-password

# Option B: Connected App (recommended)
ANYPOINT_CLIENT_ID=your-client-id
ANYPOINT_CLIENT_SECRET=your-client-secret

# Required
ANYPOINT_ORG_ID=your-org-id

# Optional — defaults to Sandbox if not set; can be overridden per tool call
ANYPOINT_ENV_ID=Sandbox

# Optional — hostname only, no https:// prefix
ANYPOINT_HOST=anypoint.mulesoft.com
```

---

## Running with Node.js

### Development (hot-reload)

```bash
npm run dev
```

### Production

```bash
# Build first
npm run build

# Run
npm start
```

The server communicates over **stdio** using the MCP protocol. Use it directly with any MCP client (Claude Desktop, Postman, etc.).

### Connecting Claude Desktop (stdio)

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mulesoft": {
      "command": "node",
      "args": ["/absolute/path/to/mulesoft-mcp/dist/index.js"],
      "env": {
        "ANYPOINT_CLIENT_ID": "...",
        "ANYPOINT_CLIENT_SECRET": "...",
        "ANYPOINT_ORG_ID": "...",
        "ANYPOINT_ENV_ID": "Sandbox"
      }
    }
  }
}
```

---

## Running with Docker

The Docker image wraps the MCP server with [supergateway](https://github.com/supercorp-ai/supergateway), exposing it as a **StreamableHTTP** endpoint on port **8085** (host) → **8000** (container).

### Build and start

```bash
docker compose up -d --build
```

### Stop

```bash
docker compose down
```

### View logs

```bash
docker compose logs -f
```

### Connecting an MCP client (StreamableHTTP)

Point your MCP client at:

```
http://localhost:8085/mcp
```

For example, in Postman or another HTTP-based MCP client, use the URL above as the server endpoint.

### Environment variables (Docker)

All variables in `.env` are automatically loaded by `docker-compose.yml`. Sensitive values are never baked into the image.

| Variable | Default in Docker | Notes |
|---|---|---|
| `ANYPOINT_CLIENT_ID` | — | From `.env` |
| `ANYPOINT_CLIENT_SECRET` | — | From `.env` |
| `ANYPOINT_ORG_ID` | — | From `.env` |
| `ANYPOINT_ENV_ID` | — | From `.env`; overridable per tool call |
| `ANYPOINT_HOST` | `anypoint.mulesoft.com` | Hostname only |
| `LOG_LEVEL` | `info` | |
| `CLI_TIMEOUT_MS` | `30000` | |
| `RATE_LIMIT_RPS` | `10` | |
| `CACHE_TTL_SECONDS` | `300` | |

---

## Available MCP Tools

### Design Center (2 active tools)

| Tool | Description |
|---|---|
| `design_center_list_projects` | List all Design Center projects |
| `design_center_create_project` | Create a project (`raml`/`oas`/`wsdl`/`fragment`) |

### CloudHub 2.0 (4 active tools)

> CloudHub 1.0 tools are disabled. CloudHub 2.0 uses `runtime-mgr application` commands.

| Tool | Description | Key Parameters |
|---|---|---|
| `cloudhub2_list_deployments` | List all CH2 deployments | `environment?`, `target?` |
| `cloudhub2_describe_deployment` | Describe a CH2 deployment | `name`, `environment?` |
| `cloudhub2_deploy_application` | Deploy to CH2 | `name`, `artifactId`, `target`, `runtimeVersion?`, `replicas?`, `replicaSize?`, `environment?` |
| `cloudhub2_list_runtime_fabrics` | List available Shared/Private Space targets | — |

### Runtime Manager — Standalone Apps (6 active tools)

| Tool | Description | Key Parameters |
|---|---|---|
| `runtime_manager_list_applications` | List standalone apps | `limit?`, `offset?`, `sort?`, `environment?` |
| `runtime_manager_describe_application` | Describe an app | `name`, `environment?` |
| `runtime_manager_start_application` | Start an app | `name`, `environment?` |
| `runtime_manager_stop_application` | Stop an app | `name`, `environment?` |
| `runtime_manager_restart_application` | Restart an app | `name`, `environment?` |
| `runtime_manager_delete_application` | Delete an app | `name`, `environment?` |

### Runtime Manager — Servers & Clusters (4 active tools)

| Tool | Description |
|---|---|
| `runtime_manager_list_servers` | List registered Mule servers |
| `runtime_manager_describe_server` | Describe a server |
| `runtime_manager_list_clusters` | List server clusters |
| `runtime_manager_describe_cluster` | Describe a cluster |

### Exchange (2 active tools)

| Tool | Description | Key Parameters |
|---|---|---|
| `exchange_list_assets` | List assets | `search?`, `limit?`, `offset?`, `organizationOnly?` |
| `exchange_get_asset` | Get a specific asset version | `groupId`, `assetId`, `version` |

### API Manager (7 active tools)

| Tool | Description | Key Parameters |
|---|---|---|
| `api_manager_list_apis` | List API instances | `environment?` |
| `api_manager_describe_api` | Describe an API instance | `apiId`, `environment?` |
| `api_manager_manage_api` | Create a managed API from Exchange | `assetGroupId`, `assetId`, `assetVersion`, `environment?` |
| `api_manager_list_policies` | List policies on an API | `apiId`, `environment?` |
| `api_manager_apply_policy` | Apply a policy | `apiId`, `policyId`, `policyVersion`, `config?`, `environment?` |
| `api_manager_unapply_policy` | Remove a policy | `apiId`, `policyId`, `environment?` |
| `api_manager_list_contracts` | List client contracts | `apiId`, `environment?` |

### Account (4 active tools)

| Tool | Description |
|---|---|
| `account_describe_user` | Describe the authenticated user |
| `account_list_business_groups` | List business groups |
| `account_list_environments` | List environments in the org |
| `account_describe_environment` | Describe a specific environment |

**Total: 29 active MCP tools.**

> Tools marked as disabled in code (CloudHub 1.0, `cloudhub2_delete_deployment`, `exchange_copy_asset`, `exchange_delete_asset`, `api_manager_delete_api`, `design_center_delete/upload/download_project`, `account_create/delete_environment`) are commented out and can be re-enabled when needed.

---

## Environment Override

All environment-scoped tools accept an optional `environment` parameter. If omitted, the value from `ANYPOINT_ENV_ID` in your config is used as the default.

```json
{
  "tool": "cloudhub2_list_deployments",
  "arguments": {
    "environment": "Production"
  }
}
```

---

## Configuration Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANYPOINT_USERNAME` | ¹ | — | Anypoint username |
| `ANYPOINT_PASSWORD` | ¹ | — | Anypoint password |
| `ANYPOINT_CLIENT_ID` | ¹ | — | Connected App client ID |
| `ANYPOINT_CLIENT_SECRET` | ¹ | — | Connected App client secret |
| `ANYPOINT_ORG_ID` | ✅ | — | Organisation ID |
| `ANYPOINT_ENV_ID` | — | — | Default environment name (e.g. `Sandbox`) |
| `ANYPOINT_HOST` | — | `anypoint.mulesoft.com` | Hostname only — no `https://` prefix |
| `CLI_TIMEOUT_MS` | — | `30000` | CLI command timeout (ms) |
| `CLI_MAX_RETRIES` | — | `3` | Max retries for transient failures |
| `RATE_LIMIT_RPS` | — | `10` | Max CLI requests per second |
| `LOG_LEVEL` | — | `info` | `error` / `warn` / `info` / `debug` |
| `CACHE_TTL_SECONDS` | — | `300` | Read-cache TTL in seconds |

¹ Either username+password **or** client_id+client_secret must be provided.

---

## Production Features

| Feature | Implementation |
|---|---|
| **Structured logging** | Winston JSON format + credential redaction |
| **Retry with backoff** | Exponential backoff on transient errors (ECONNRESET, 503, rate-limit) |
| **Read-through cache** | In-memory TTL cache; write operations auto-invalidate |
| **Rate limiting** | Token-bucket limiter — configurable RPS |
| **Timeout handling** | Per-command timeout; surfaces as `TimeoutError` |
| **Input validation** | Zod schemas on all tool inputs and env vars |
| **Dependency injection** | `createContainer()` factory — easy to mock in tests |
| **Type safety** | `strict: true` TypeScript throughout |
| **Non-root Docker** | Runs as `mcp` user; no credentials baked into image |


---

## Architecture

```
src/
├── config/
│   └── env.ts                   # Zod-validated environment variables
├── cli/
│   └── cli-service.ts           # Core execa wrapper (auth, JSON parsing, timeout)
├── services/                    # Domain services (one per Anypoint domain)
│   ├── design-center.service.ts
│   ├── runtime-manager.service.ts
│   ├── cloudhub.service.ts
│   ├── cloudhub2.service.ts
│   ├── exchange.service.ts
│   ├── api-manager.service.ts
│   ├── flex-gateway.service.ts
│   ├── monitoring.service.ts
│   └── account.service.ts
├── mcp/
│   ├── server.ts                # McpServer setup + transport
│   └── tools/                   # One tool-registration file per domain
│       ├── design-center.tools.ts
│       ├── runtime-manager.tools.ts
│       ├── cloudhub.tools.ts
│       ├── cloudhub2.tools.ts
│       ├── exchange.tools.ts
│       ├── api-manager.tools.ts
│       ├── flex-gateway.tools.ts
│       ├── monitoring.tools.ts
│       └── account.tools.ts
├── utils/
│   ├── logger.ts                # Winston structured logger
│   ├── errors.ts                # Typed error classes + formatter
│   ├── retry.ts                 # Exponential-backoff retry helper
│   ├── cache.ts                 # In-memory TTL cache
│   └── rate-limiter.ts          # Token-bucket rate limiter
├── types/
│   └── index.ts                 # Shared TypeScript interfaces
├── container.ts                 # Dependency-injection factory
└── index.ts                     # Entry point
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18 |
| anypoint-cli-v4 | latest |

### Install Anypoint CLI

```bash
npm install -g anypoint-cli-v4
```

---

## Setup

### 1. Clone and install dependencies

```bash
cd mulesoft-mcp
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and supply credentials. You need **one** of:

- `ANYPOINT_USERNAME` + `ANYPOINT_PASSWORD` — username/password auth  
- `ANYPOINT_CLIENT_ID` + `ANYPOINT_CLIENT_SECRET` — Connected App auth (recommended for CI/CD)

And always:

- `ANYPOINT_ORG_ID` — your Anypoint organisation ID

### 3. Build

```bash
npm run build
```

### 4. Run in development (hot-reload)

```bash
npm run dev
```

### 5. Run production build

```bash
npm start
```

---

## Integrating with an MCP Client

Add the server to your MCP client configuration (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mulesoft": {
      "command": "node",
      "args": ["/absolute/path/to/mulesoft-mcp/dist/index.js"],
      "env": {
        "ANYPOINT_CLIENT_ID": "...",
        "ANYPOINT_CLIENT_SECRET": "...",
        "ANYPOINT_ORG_ID": "..."
      }
    }
  }
}
```

---

## Available MCP Tools

### Design Center (5 tools)

| Tool | Description |
|---|---|
| `design_center_list_projects` | List all projects |
| `design_center_create_project` | Create a project (raml/oas/wsdl/fragment) |
| `design_center_delete_project` | Delete a project |
| `design_center_upload_project` | Upload local files to a project |
| `design_center_download_project` | Download a project to a local directory |

### Runtime Manager (10 tools)

| Tool | Description |
|---|---|
| `runtime_manager_list_applications` | List applications |
| `runtime_manager_describe_application` | Describe an application |
| `runtime_manager_start_application` | Start an application |
| `runtime_manager_stop_application` | Stop an application |
| `runtime_manager_restart_application` | Restart an application |
| `runtime_manager_delete_application` | Delete an application |
| `runtime_manager_list_servers` | List registered servers |
| `runtime_manager_describe_server` | Describe a server |
| `runtime_manager_list_clusters` | List server clusters |
| `runtime_manager_describe_cluster` | Describe a cluster |

### CloudHub 1.0 (7 tools)

| Tool | Description |
|---|---|
| `cloudhub_list_applications` | List applications |
| `cloudhub_describe_application` | Describe an application |
| `cloudhub_deploy_application` | Deploy / redeploy an application |
| `cloudhub_start_application` | Start an application |
| `cloudhub_stop_application` | Stop an application |
| `cloudhub_restart_application` | Restart an application |
| `cloudhub_delete_application` | Delete an application |

### CloudHub 2.0 (5 tools)

| Tool | Description |
|---|---|
| `cloudhub2_list_deployments` | List deployments (filter by target) |
| `cloudhub2_describe_deployment` | Describe a deployment |
| `cloudhub2_deploy_application` | Deploy an application |
| `cloudhub2_delete_deployment` | Delete a deployment |
| `cloudhub2_list_targets` | List available Shared/Private Spaces |

### Exchange (4 tools)

| Tool | Description |
|---|---|
| `exchange_list_assets` | List assets (search + pagination) |
| `exchange_get_asset` | Get a specific asset version |
| `exchange_copy_asset` | Copy an asset to a new ID/version |
| `exchange_delete_asset` | Delete an asset version |

### API Manager (8 tools)

| Tool | Description |
|---|---|
| `api_manager_list_apis` | List API instances |
| `api_manager_describe_api` | Describe an API instance |
| `api_manager_manage_api` | Create a managed API from an Exchange asset |
| `api_manager_delete_api` | Delete an API instance |
| `api_manager_list_policies` | List policies on an API |
| `api_manager_apply_policy` | Apply a policy to an API |
| `api_manager_unapply_policy` | Remove a policy from an API |
| `api_manager_list_contracts` | List client application contracts |

### Flex Gateway (5 tools)

| Tool | Description |
|---|---|
| `flex_gateway_list` | List all Flex Gateways |
| `flex_gateway_describe` | Describe a gateway |
| `flex_gateway_add` | Register a new gateway |
| `flex_gateway_list_bindings` | List API bindings on a gateway |
| `flex_gateway_add_binding` | Bind an API instance to a gateway |

### Monitoring (3 tools)

| Tool | Description |
|---|---|
| `monitoring_list_apps` | List monitored applications |
| `monitoring_get_app_metrics` | Get metrics for an application |
| `monitoring_clear_cache` | Clear the monitoring cache |

### Account (6 tools)

| Tool | Description |
|---|---|
| `account_describe_user` | Describe the authenticated user |
| `account_list_business_groups` | List business groups |
| `account_list_environments` | List environments |
| `account_describe_environment` | Describe an environment |
| `account_create_environment` | Create an environment |
| `account_delete_environment` | Delete an environment |

**Total: 53 MCP tools across 9 domains.**

---

## Configuration Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANYPOINT_USERNAME` | ¹ | — | Anypoint username |
| `ANYPOINT_PASSWORD` | ¹ | — | Anypoint password |
| `ANYPOINT_CLIENT_ID` | ¹ | — | Connected App client ID |
| `ANYPOINT_CLIENT_SECRET` | ¹ | — | Connected App client secret |
| `ANYPOINT_ORG_ID` | ✅ | — | Organisation ID |
| `ANYPOINT_ENV_ID` | — | — | Default environment ID |
| `ANYPOINT_HOST` | — | `https://anypoint.mulesoft.com` | Anypoint platform host |
| `CLI_TIMEOUT_MS` | — | `30000` | CLI command timeout (ms) |
| `CLI_MAX_RETRIES` | — | `3` | Max retries for transient failures |
| `RATE_LIMIT_RPS` | — | `10` | Max CLI requests per second |
| `LOG_LEVEL` | — | `info` | Logging level (`error`/`warn`/`info`/`debug`) |
| `CACHE_TTL_SECONDS` | — | `300` | Read-cache TTL in seconds |

¹ Either username+password **or** client_id+client_secret must be provided.

---

## Production Features

| Feature | Implementation |
|---|---|
| **Structured logging** | Winston with JSON format + credential redaction |
| **Retry with backoff** | Exponential backoff on transient errors (ECONNRESET, 503, rate-limit, …) |
| **Read-through cache** | In-memory TTL cache; write operations auto-invalidate |
| **Rate limiting** | Token-bucket limiter — configurable RPS + burst |
| **Timeout handling** | Per-command timeout; surfaces as `TimeoutError` |
| **Input validation** | Zod schemas on all tool inputs and env vars |
| **Dependency injection** | `createContainer()` factory — easy to mock in tests |
| **Type safety** | `strict: true` TypeScript throughout |
| **Clean architecture** | CLI → Service → Tool layers; no CLI commands in controllers |
