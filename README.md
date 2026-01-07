# 👁️ Argus

**Datadog for MCPs** — See, replay, test, and understand every MCP tool call.

[![npm version](https://img.shields.io/npm/v/@argusai/cli.svg)](https://www.npmjs.com/package/@argusai/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What It Does

Argus is a standalone monitoring dashboard for MCP (Model Context Protocol) servers. It records:

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

## Installation

```bash
npm install -g @argusai/cli
```

## Quick Start

```bash
# 1. Start the dashboard (opens browser automatically)
argus dashboard --open

# 2. In another terminal, wrap any MCP server
argus wrap --api http://localhost:3000 -- npx -y @modelcontextprotocol/server-filesystem /tmp
```

That's it! Make tool calls and watch them appear in real-time.

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

## CLI Commands

### `argus dashboard`

Start the monitoring dashboard:

```bash
argus dashboard                    # Default port 3000
argus dashboard --open             # Open browser automatically
argus dashboard --port 4000        # Custom port
argus dashboard --db ./custom.db   # Custom database
```

| Flag         | Description                | Default           |
| ------------ | -------------------------- | ----------------- |
| `-p, --port` | Dashboard port             | 3000              |
| `-o, --open` | Open browser automatically | false             |
| `-d, --db`   | Database path              | ~/.argus/argus.db |

### `argus wrap`

Wrap an MCP server to record all tool calls:

```bash
# Basic usage
argus wrap -- npx -y @modelcontextprotocol/server-filesystem /tmp

# With real-time dashboard updates (recommended)
argus wrap --api http://localhost:3000 -- npx -y @modelcontextprotocol/server-github

# Custom server name (shows in dashboard)
argus wrap --name "GitHub" --api http://localhost:3000 -- npx -y @modelcontextprotocol/server-github
```

| Flag                 | Description                         | Default           |
| -------------------- | ----------------------------------- | ----------------- |
| `-a, --api`          | Dashboard URL for real-time updates | -                 |
| `-n, --name`         | Server display name                 | command           |
| `-d, --db`           | Database path                       | ~/.argus/argus.db |
| `-t, --idle-timeout` | Seconds before new run              | 60                |
| `--redact`           | Additional keys to redact           | -                 |
| `--no-redact`        | Disable redaction                   | -                 |

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

3. Start the dashboard:

   ```bash
   argus dashboard --open
   ```

4. Restart Claude Desktop

Now all MCP tool calls from Claude will be recorded in Argus!

## Configuration File

Create `argus.config.json` for advanced setups:

```json
{
	"database": "~/.argus/argus.db",
	"port": 3000,
	"idleTimeout": 60,
	"redaction": {
		"enabled": true,
		"keys": ["token", "secret", "password", "api_key"]
	},
	"servers": {
		"github": {
			"name": "GitHub",
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

### Dashboard Not Showing Updates

- Ensure dashboard is running: `argus dashboard`
- Use `--api http://localhost:3000` with wrap command
- Both must use the same database path

## Development

```bash
# Clone the repo
git clone https://github.com/harshabikkavilli/argus.git
cd argus

# Install dependencies
npm install

# Build everything
npm run build

# Run dashboard
npm run start dashboard

# Development (UI hot reload)
npm run dev:ui
```

## License

MIT
