# 👁️ Argus

**Datadog for MCPs** — See, replay, test, and understand every MCP tool call.

## What It Does

Argus is a standalone monitoring product for MCP (Model Context Protocol) servers. It records:

- ✅ Tool calls with full parameters
- ⏱️ Latency measurements
- ❌ Errors and stack traces
- 📊 Usage analytics
- 🔄 Sessions/Runs for organized debugging
- 🔐 Automatic redaction of sensitive data

Then lets you:

- 🔄 Replay tool calls without involving the LLM
- 📋 Compare original vs replayed results (diff view)
- 🔍 Debug issues visually with timeline UI
- 📡 Real-time updates via SSE

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Argus Dashboard                              │
│                  http://localhost:3000                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │ reads from
                           ▼
                   ┌───────────────┐
                   │    SQLite     │
                   └───────────────┘
                           ▲
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴────┐       ┌────┴────┐       ┌────┴────┐
    │ GitHub  │       │ Figma   │       │ Custom  │
    │ (wrap)  │       │ (wrap)  │       │ (wrap)  │
    └─────────┘       └─────────┘       └─────────┘
```

## Installation

```bash
npm install -g argus
# or use locally
npm install
```

## Quick Start

```bash
# 1. Start the dashboard
argus dashboard

# 2. In another terminal, wrap any MCP server
argus wrap -- npx -y @modelcontextprotocol/server-filesystem /tmp

# 3. Open the UI
open http://localhost:3000
```

## CLI Commands

### `argus dashboard`

Start the monitoring dashboard:

```bash
argus dashboard                    # Default port 3000
argus dashboard --port 4000        # Custom port
argus dashboard --db ./custom.db   # Custom database
```

**Options:**
| Flag | Description | Default |
|------|-------------|---------|
| `-p, --port` | Dashboard port | 3000 |
| `-d, --db` | Database path | ~/.argus/argus.db |

### `argus wrap`

Wrap an MCP server to record all tool calls:

```bash
# Basic usage
argus wrap -- npx -y @modelcontextprotocol/server-filesystem /tmp

# With real-time dashboard updates
argus wrap --api http://localhost:3000 -- npx -y @modelcontextprotocol/server-github

# Custom server name (shows in dashboard)
argus wrap --name "GitHub Server" -- npx -y @modelcontextprotocol/server-github
```

**Options:**
| Flag | Description | Default |
|------|-------------|---------|
| `-d, --db` | Database path | ~/.argus/argus.db |
| `-a, --api` | Dashboard URL for real-time updates | - |
| `-n, --name` | Server display name | command |
| `-t, --idle-timeout` | Seconds before new run | 60 |
| `--redact` | Additional keys to redact | - |
| `--no-redact` | Disable redaction | - |

### `argus setup`

Generate configuration files:

```bash
argus setup --init     # Create argus.config.json
argus setup --claude   # Generate Claude Desktop config
```

### `argus stats`

View recording statistics:

```bash
argus stats              # All stats
argus stats --run <id>   # Stats for specific run
```

### `argus diagnose`

Print diagnostic information for troubleshooting.

## Using with Claude Desktop

1. Generate the config:

   ```bash
   argus setup --claude
   ```

2. Copy the output to your `claude_desktop_config.json`

3. Start the dashboard separately:

   ```bash
   argus dashboard
   ```

4. Restart Claude Desktop

## Configuration File

Create `argus.config.json`:

```json
{
	"database": "~/.argus/data.db",
	"port": 3000,
	"idleTimeout": 60000,
	"redaction": {
		"enabled": true,
		"keys": ["token", "secret", "password", "api_key"]
	},
	"servers": {
		"github": {
			"name": "GitHub Server",
			"command": "npx",
			"args": ["-y", "@modelcontextprotocol/server-github"],
			"env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"}
		}
	}
}
```

## Features

### Real-time Updates

Dashboard updates instantly via Server-Sent Events when using `--api` flag.

### Sessions/Runs

Tool calls are grouped into runs:

- New run on proxy connect
- New run after idle timeout (default: 60s)

### Automatic Redaction

Sensitive data is automatically redacted:

- `token`, `secret`, `password`, `authorization`
- `cookie`, `api_key`, `private_key`, `credential`

### Replay with Diff

Replay any tool call and compare original vs replayed results.

## Troubleshooting

### Claude Desktop Shows "Server disconnected"

1. Test the wrap command manually:

   ```bash
   argus wrap -- npx -y @modelcontextprotocol/server-filesystem /tmp
   ```

2. Check Claude Desktop logs:

   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`

3. Verify your MCP server works:
   ```bash
   npx -y @modelcontextprotocol/server-filesystem /tmp
   ```

### Dashboard Not Showing Updates

- Ensure dashboard is running: `argus dashboard`
- Use `--api http://localhost:3000` with wrap command
- Both must use the same database path

## Development

```bash
# Install dependencies
npm install

# Build everything
npm run build

# Run dashboard (dev)
npm run start dashboard

# Run with hot reload (UI only)
npm run dev:ui
```

## License

MIT
