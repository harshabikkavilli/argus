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
- 📁 Filter and analyze by run/session
- 📡 Real-time updates via SSE

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Argus Dashboard                               │
│                    http://localhost:3000                         │
│              (Web App with real-time SSE updates)                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ reads from
                           ▼
                   ┌───────────────┐
                   │    SQLite     │
                   │   Database    │
                   └───────────────┘
                           ▲
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴────┐       ┌────┴────┐       ┌────┴────┐
    │ wrap    │       │ wrap    │       │ wrap    │
    │ GitHub  │       │ Figma   │       │ Custom  │
    └────┬────┘       └────┬────┘       └────┬────┘
         │                 │                 │
    ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
    │ GitHub  │       │ Figma   │       │ Custom  │
    │   MCP   │       │   MCP   │       │   MCP   │
    └─────────┘       └─────────┘       └─────────┘
```

## Quick Start

```bash
# Install dependencies
npm install

# Start dashboard and proxy separately
npx tsx src/app/cli/index.ts dashboard &           # Start dashboard on :3000
npx tsx src/app/cli/index.ts wrap -- npx tsx src/devtools/test-server.ts  # Wrap test server

# Open the UI
open http://localhost:3000
```

## Commands

### `dashboard` - Start the Standalone Dashboard

The dashboard runs independently and shows recordings from all proxies:

```bash
npx tsx src/app/cli/index.ts dashboard

# With options
npx tsx src/app/cli/index.ts dashboard --port 4000 --db ./my-data.db
```

**Options:**

- `-p, --port <port>` - Dashboard port (default: 3000)
- `-d, --db <path>` - Database file path (default: ~/.argus/argus.db)
- `-c, --config <path>` - Config file path

### `wrap` - Wrap an MCP Server

Lightweight proxy that records tool calls to the database:

```bash
# Wrap any MCP server
npx tsx src/app/cli/index.ts wrap -- npx -y @modelcontextprotocol/server-filesystem /tmp

# With API notifications for real-time updates
npx tsx src/app/cli/index.ts wrap --api http://localhost:3000 -- npx tsx src/devtools/test-server.ts

# Custom database location
npx tsx src/app/cli/index.ts wrap --db ./my-data.db -- npx -y @modelcontextprotocol/server-github
```

**Options:**

- `-d, --db <path>` - Database file path
- `-a, --api <url>` - Dashboard API URL for real-time notifications
- `-t, --idle-timeout <seconds>` - Idle timeout before new run (default: 60)
- `--redact <keys>` - Additional keys to redact
- `--no-redact` - Disable redaction

### `setup` - Generate Configurations

```bash
# Create default config file
npx tsx src/app/cli/index.ts setup --init

# Generate Claude Desktop configuration
npx tsx src/app/cli/index.ts setup --claude
```

### `stats` - Quick Stats

```bash
npx tsx src/app/cli/index.ts stats
npx tsx src/app/cli/index.ts stats --run <run-id>
```

### `diagnose` - Diagnostic Information

```bash
npx tsx src/app/cli/index.ts diagnose
```

## Using with Claude Desktop

Run the setup command to generate the configuration:

```bash
npx tsx src/app/cli/index.ts setup --claude
```

This generates a `claude_desktop_config.json` snippet like:

```json
{
	"mcpServers": {
		"your-server": {
			"command": "npx",
			"args": [
				"tsx",
				"/path/to/argus/src/app/cli/index.ts",
				"wrap",
				"--db",
				"/Users/you/.argus/argus.db",
				"--",
				"npx",
				"-y",
				"@modelcontextprotocol/server-filesystem",
				"/tmp"
			]
		}
	}
}
```

Then run the dashboard separately:

```bash
npx tsx src/app/cli/index.ts dashboard
# Open http://localhost:3000
```

## Configuration File

Create `argus.config.json` for persistent settings:

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
			"command": "npx",
			"args": ["-y", "@modelcontextprotocol/server-github"],
			"env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"}
		}
	}
}
```

Initialize with:

```bash
npx tsx src/app/cli/index.ts setup --init
```

## Features

### Real-time Updates (SSE)

The dashboard uses Server-Sent Events for instant updates:

- New tool calls appear immediately
- Run status updates in real-time
- Fallback to polling if SSE unavailable

### Sessions/Runs

Tool calls are grouped into **runs**:

- New run on proxy connect
- New run after idle timeout (default: 60s)
- Manual start/stop via UI or API

### Redaction

Sensitive data is automatically redacted:

- `token`, `secret`, `password`, `authorization`
- `cookie`, `api_key`, `private_key`, `credential`

### Replay with Diff

Replay any tool call and see:

- Original vs replay latency
- JSON diff of results
- Linked call history

### Tool Schema Capture

Schemas are captured per run, enabling:

- Parameter hints in UI
- Required field validation

## REST API

### Runs

| Endpoint               | Method | Description                |
| ---------------------- | ------ | -------------------------- |
| `/api/runs`            | GET    | List all runs              |
| `/api/runs/:id`        | GET    | Get run details with calls |
| `/api/runs/:id/schema` | GET    | Get captured tool schemas  |
| `/api/runs/start`      | POST   | Manual start new run       |

### Calls

| Endpoint                | Method | Description                  |
| ----------------------- | ------ | ---------------------------- |
| `/api/calls`            | GET    | List all recorded calls      |
| `/api/calls/:id`        | GET    | Get call details with schema |
| `/api/calls/:id/replay` | POST   | Replay a call (returns diff) |
| `/api/calls`            | DELETE | Clear all recordings         |

### Real-time

| Endpoint          | Method | Description              |
| ----------------- | ------ | ------------------------ |
| `/api/events`     | GET    | SSE stream for real-time |
| `/api/notify`     | POST   | Notify of new events     |
| `/api/sse/status` | GET    | SSE connection count     |

### Stats

| Endpoint     | Method | Description    |
| ------------ | ------ | -------------- |
| `/api/stats` | GET    | Get statistics |

## Project Structure

```
src/
├── core/                          # Domain logic
│   ├── redaction/redactor.ts     # Sensitive data redaction
│   ├── replay/diff.ts            # JSON diff utility
│   ├── runs/runManager.ts        # Run/session management
│   ├── calls/schemaCapture.ts    # Tool schema capture
│   └── types.ts                  # Shared domain types
├── infrastructure/                # Adapters
│   ├── database/
│   │   ├── sqlite/db.ts          # SQLite implementation
│   │   ├── sqlite/migrations.ts  # Database migrations
│   │   ├── types.ts              # Database adapter interface
│   │   └── index.ts              # Database exports
│   ├── mcp/
│   │   ├── proxy.ts              # MCP proxy server
│   │   └── index.ts              # MCP exports
│   └── notification/
│       └── notifier.ts           # SSE notification client
├── app/
│   ├── cli/                      # CLI application
│   │   ├── commands/             # Command handlers
│   │   │   ├── dashboard.ts
│   │   │   ├── wrap.ts
│   │   │   ├── setup.ts
│   │   │   ├── stats.ts
│   │   │   └── diagnose.ts
│   │   └── index.ts              # CLI entry point
│   └── dashboard/                # Dashboard application
│       ├── routes/               # API routes
│       │   ├── runs.ts
│       │   ├── calls.ts
│       │   ├── stats.ts
│       │   ├── replay.ts
│       │   └── index.ts
│       ├── realtime/
│       │   └── sseManager.ts     # SSE manager
│       ├── ui/
│       │   └── index.ts          # Embedded web UI
│       ├── server.ts             # Express server setup
│       └── index.ts              # Dashboard entry point
├── config/
│   └── index.ts                  # Configuration management
└── devtools/
    ├── test-server.ts            # Test MCP server
    └── test-client.ts            # Test client
```

## Test Server Tools

| Tool             | Description                                  |
| ---------------- | -------------------------------------------- |
| `calculate`      | Basic math (add, subtract, multiply, divide) |
| `get_weather`    | Mock weather data for a city                 |
| `slow_operation` | Artificial delay for latency testing         |
| `random_failure` | 50% chance of failure                        |
| `always_fail`    | Always throws an error                       |
| `echo`           | Echoes back parameters                       |

## Troubleshooting

### Claude Desktop Shows "Server disconnected"

If Claude Desktop shows "Server disconnected" after configuring the wrap command:

1. **Node.js Version Mismatch (Most Common):**
   If you see errors about `NODE_MODULE_VERSION` mismatch:

   ```bash
   # Find which Node version Claude Desktop is using (check logs)
   # Then rebuild better-sqlite3 for that version:
   /path/to/node/v16.13.1/bin/npm rebuild better-sqlite3

   # Or rebuild for all Node versions you have:
   nvm use 16 && npm rebuild better-sqlite3
   nvm use 18 && npm rebuild better-sqlite3
   nvm use 20 && npm rebuild better-sqlite3
   ```

   **Note:** Claude Desktop may use a different Node version than your terminal. Check the logs to see which version it's using.

2. **Verify the command works manually:**

   ```bash
   npx tsx src/app/cli/index.ts wrap --db ~/.argus/argus.db -- npx -y @modelcontextprotocol/server-filesystem /tmp
   ```

   If this fails, check the error message.

3. **Check Claude Desktop logs:**

   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`
   - Linux: `~/.config/claude/logs/`

4. **Common issues:**

   - **`tsx` not found**: Make sure you use `npx tsx` in the command (not just `tsx`)
   - **Upstream server fails**: Test the upstream command directly:
     ```bash
     npx -y @modelcontextprotocol/server-filesystem /tmp
     ```
   - **Database path issues**: Ensure the database directory exists:
     ```bash
     mkdir -p ~/.argus
     ```

5. **Test the wrap command:**

   ```bash
   npx tsx src/app/cli/index.ts wrap -- npx tsx src/devtools/test-server.ts
   ```

6. **Verify your Claude Desktop config:**
   - Command should be: `npx`
   - First arg should be: `tsx`
   - Second arg should be: full path to `src/app/cli/index.ts`
   - Then: `wrap`, `--db`, `<path>`, `--`, and your MCP server command

### Dashboard Not Showing Updates

- Make sure the dashboard is running: `npx tsx src/app/cli/index.ts dashboard`
- Check that proxies are using `--api http://localhost:3000` to enable real-time updates
- Verify both dashboard and proxy are using the same database path

### Database Locked Errors

- Only one process can write to SQLite at a time
- Make sure you're not running multiple proxies with the same database
- Use separate database files for different servers if needed

## License

MIT
