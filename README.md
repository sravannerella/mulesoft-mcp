# MuleSoft MCP Server

MCP server that wraps [Anypoint CLI v4](https://docs.mulesoft.com/anypoint-cli/latest/) and exposes Anypoint Platform operations as MCP tools.

---

## Prerequisites

- Node.js ≥ 18
- `anypoint-cli-v4` installed globally: `npm install -g anypoint-cli-v4`

---

## Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```env
# Auth — use one of the two options:
ANYPOINT_USERNAME=your-username
ANYPOINT_PASSWORD=your-password

# OR (recommended for CI/CD):
ANYPOINT_CLIENT_ID=your-client-id
ANYPOINT_CLIENT_SECRET=your-client-secret

# Required
ANYPOINT_ORG_ID=your-org-id

# Optional — default environment; can be overridden per tool call
ANYPOINT_ENV_ID=Sandbox

# Optional — hostname only, no https://
ANYPOINT_HOST=anypoint.mulesoft.com
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANYPOINT_USERNAME` | ¹ | — | Anypoint username |
| `ANYPOINT_PASSWORD` | ¹ | — | Anypoint password |
| `ANYPOINT_CLIENT_ID` | ¹ | — | Connected App client ID |
| `ANYPOINT_CLIENT_SECRET` | ¹ | — | Connected App client secret |
| `ANYPOINT_ORG_ID` | ✅ | — | Organisation ID |
| `ANYPOINT_ENV_ID` | — | — | Default environment (e.g. `Sandbox`) |
| `ANYPOINT_HOST` | — | `anypoint.mulesoft.com` | Hostname only — no `https://` |
| `CLI_TIMEOUT_MS` | — | `30000` | Command timeout (ms) |
| `CLI_MAX_RETRIES` | — | `3` | Retries on transient failures |
| `RATE_LIMIT_RPS` | — | `10` | Max CLI requests per second |
| `LOG_LEVEL` | — | `info` | `error` / `warn` / `info` / `debug` |
| `CACHE_TTL_SECONDS` | — | `300` | Read-cache TTL (seconds) |

¹ Either username+password **or** client_id+client_secret required.

---

## Running with Node.js

```bash
npm install

# Development (hot-reload)
npm run dev

# Production
npm run build
npm start
```

The server communicates over **stdio**. To connect Claude Desktop, add to `claude_desktop_config.json`:

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

The Docker image uses [supergateway](https://github.com/supercorp-ai/supergateway) to expose the MCP server as a **StreamableHTTP** endpoint on port `8085`.

```bash
# Start (builds if needed)
docker compose up -d --build

# Stop
docker compose down

# Logs
docker compose logs -f
```

Connect your MCP client to:

```
http://localhost:8085/mcp
```

All `.env` values are automatically loaded — credentials are never baked into the image.

---

## Available Tools (29 total)

All environment-scoped tools accept an optional `environment` parameter that overrides `ANYPOINT_ENV_ID`.

### Design Center

| Tool | Description |
|---|---|
| `design_center_list_projects` | List all projects |
| `design_center_create_project` | Create a project (`raml`/`oas`/`wsdl`/`fragment`) |

### CloudHub 2.0

| Tool | Description |
|---|---|
| `cloudhub2_list_deployments` | List deployments (filter by `target`, `environment`) |
| `cloudhub2_describe_deployment` | Describe a deployment |
| `cloudhub2_deploy_application` | Deploy from Exchange (`artifactId`, `target`, `runtimeVersion`, `replicas`, `replicaSize`) |
| `cloudhub2_list_runtime_fabrics` | List available Shared/Private Space targets |

### Runtime Manager — Standalone Apps

| Tool | Description |
|---|---|
| `runtime_manager_list_applications` | List apps (`limit`, `offset`, `sort`, `environment`) |
| `runtime_manager_describe_application` | Describe an app |
| `runtime_manager_start_application` | Start an app |
| `runtime_manager_stop_application` | Stop an app |
| `runtime_manager_restart_application` | Restart an app |
| `runtime_manager_delete_application` | Delete an app |

### Runtime Manager — Servers & Clusters

| Tool | Description |
|---|---|
| `runtime_manager_list_servers` | List registered Mule servers |
| `runtime_manager_describe_server` | Describe a server |
| `runtime_manager_list_clusters` | List server clusters |
| `runtime_manager_describe_cluster` | Describe a cluster |

### Exchange

| Tool | Description |
|---|---|
| `exchange_list_assets` | List assets (`search`, `limit`, `offset`, `organizationOnly`) |
| `exchange_get_asset` | Get a specific asset (`groupId`, `assetId`, `version`) |

### API Manager

| Tool | Description |
|---|---|
| `api_manager_list_apis` | List API instances |
| `api_manager_describe_api` | Describe an API instance |
| `api_manager_manage_api` | Create a managed API from an Exchange asset |
| `api_manager_list_policies` | List policies on an API |
| `api_manager_apply_policy` | Apply a policy (`policyId`, `policyVersion`, `config`) |
| `api_manager_unapply_policy` | Remove a policy |
| `api_manager_list_contracts` | List client contracts |

### Account

| Tool | Description |
|---|---|
| `account_describe_user` | Describe the authenticated user |
| `account_list_business_groups` | List business groups |
| `account_list_environments` | List environments |
| `account_describe_environment` | Describe an environment |
