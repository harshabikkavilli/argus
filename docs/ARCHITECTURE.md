# Argus Architecture

## Overview

Argus is a standalone monitoring tool for Model Context Protocol (MCP) tool calls. It follows a clean, modular architecture with clear separation of concerns between core domain logic, infrastructure adapters, and application layers.

## Architecture Principles

The codebase follows **Clean Architecture** principles:

- **Core layer** (`src/core/`) - Pure domain logic, no dependencies on infrastructure
- **Infrastructure layer** (`src/infrastructure/`) - Adapters (database, MCP, HTTP)
- **Application layer** (`src/app/`) - Applications (CLI, Dashboard)

**Dependency Rule**: Core → Infrastructure → Application

## File Structure

### Core Layer (`src/core/`)

Domain logic with no external dependencies:

#### `core/types.ts`

**Purpose**: Shared domain types
**Types**: `ToolCallRecord`, `RunRecord`, `ToolSchemaRecord`, `StatsOverview`, etc.

#### `core/redaction/redactor.ts`

**Purpose**: Redact sensitive data from tool calls
**Features**:

- Configurable redaction keys
- Redacts values for keys like `token`, `secret`, `password`, etc.
- Handles nested objects and JSON strings

#### `core/replay/diff.ts`

**Purpose**: JSON diff utilities
**Features**:

- Compare tool call results
- Generate diff between recorded and replayed calls
- Format diff results

#### `core/runs/runManager.ts`

**Purpose**: Run/session lifecycle management
**Features**:

- Start/end runs
- Idle timeout detection
- Tool count tracking
- Schema capture coordination

#### `core/calls/schemaCapture.ts`

**Purpose**: Tool schema capture logic
**Features**:

- Create tool schema records
- Link schemas to runs

### Infrastructure Layer (`src/infrastructure/`)

Adapters that implement interfaces defined by core:

#### `infrastructure/database/`

**Purpose**: Database abstraction
**Files**:

- `types.ts` - `DatabaseAdapter` interface
- `sqlite/db.ts` - SQLite implementation
- `sqlite/migrations.ts` - Database migrations
- `index.ts` - Exports

**Features**:

- Swappable database backends
- Currently SQLite-only (PostgreSQL can be added later)
- Handles runs, tool calls, schemas, stats

#### `infrastructure/mcp/`

**Purpose**: MCP protocol handling
**Files**:

- `proxy.ts` - Lightweight MCP proxy server
- `index.ts` - Exports

**Features**:

- Intercepts tool calls between agent and MCP server
- Records calls to database
- Manages runs via `RunManager`
- Supports redaction
- Sends notifications to dashboard

#### `infrastructure/notification/`

**Purpose**: Real-time notifications
**Files**:

- `notifier.ts` - HTTP notification client

**Features**:

- Sends notifications from proxy to dashboard API
- Compatible with Node.js v16 (uses `http.request`)
- Optional (can be disabled)

### Application Layer (`src/app/`)

Applications built on top of infrastructure:

#### `app/cli/`

**Purpose**: Command-line interface
**Files**:

- `index.ts` - Main CLI entry point
- `commands/` - Command handlers
  - `dashboard.ts` - Start dashboard
  - `wrap.ts` - Wrap MCP server
  - `setup.ts` - Generate configs
  - `stats.ts` - Show statistics
  - `diagnose.ts` - Diagnostic info

**Usage**: `npx tsx src/app/cli/index.ts <command>`

#### `app/dashboard/`

**Purpose**: Web dashboard application
**Files**:

- `index.ts` - Dashboard entry point
- `server.ts` - Express server setup
- `routes/` - API route handlers
  - `runs.ts` - Run endpoints
  - `calls.ts` - Tool call endpoints
  - `stats.ts` - Statistics endpoints
  - `replay.ts` - Replay endpoints
  - `index.ts` - Route aggregator
- `realtime/sseManager.ts` - Server-Sent Events manager
- ~~`ui/index.ts`~~ - Removed (replaced by React app in `web/`)

**Features**:

- REST API for querying recordings
- Real-time updates via SSE
- Replay functionality

### Web Application (`web/`)

React + Vite application for the dashboard UI.

**Structure**:
- `src/main.tsx` - Entry point
- `src/App.tsx` - Root component
- `src/components/` - React components (layout, calls, runs, stats, common)
- `src/hooks/` - Custom hooks (useSSE, useRuns, useCalls, useStats)
- `src/context/` - React Context for global state
- `src/api/` - API client functions
- `src/types/` - TypeScript type definitions
- `src/styles/` - Tailwind CSS styles
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind configuration

**Features**:
- Component-based React architecture
- Real-time updates via SSE
- Multi-panel layout (sidebar, main, detail)
- Tool call visualization and replay
- Run management and filtering
- Statistics dashboard

### Configuration (`src/config/`)

#### `config/index.ts`

**Purpose**: Configuration management
**Features**:

- Load `argus.config.json`
- Generate default config
- Generate Claude Desktop config
- Manage data directory

### Dev Tools (`src/devtools/`)

#### `devtools/test-server.ts`

**Purpose**: Test MCP server for development/demo
**Features**: Multiple test tools (echo, delay, random_fail, etc.)

#### `devtools/test-client.ts`

**Purpose**: Test client to make tool calls
**Features**: Can connect to proxy or direct server

---

## Architecture Flow

### Standalone Dashboard Mode

```
User → npx tsx src/app/cli/index.ts dashboard
  → app/cli/commands/dashboard.ts
    → app/dashboard/index.ts
      → infrastructure/database/sqlite/db.ts (creates DB adapter)
      → app/dashboard/server.ts (starts Express server)
        → app/dashboard/routes/ (API routes)
        → app/dashboard/realtime/sseManager.ts (SSE)
        → dist/web/ (serves built React app)
```

### Proxy Mode (Wrap Command)

```
Claude Desktop → npx tsx src/app/cli/index.ts wrap <server>
  → app/cli/commands/wrap.ts
    → infrastructure/mcp/proxy.ts (creates proxy)
      → infrastructure/database/sqlite/db.ts (records calls)
      → core/runs/runManager.ts (manages runs)
      → core/redaction/redactor.ts (redacts sensitive data)
      → infrastructure/notification/notifier.ts (sends notifications)
        → app/dashboard/server.ts /api/notify endpoint
          → app/dashboard/realtime/sseManager.ts (broadcasts to dashboard)
```

---

## Data Flow

1. **Tool Call Recording**:

   - Agent makes tool call → Proxy intercepts → Redact → Store in DB → Notify dashboard

2. **Real-time Updates**:

   - Proxy sends notification → API receives → SSE broadcasts → Dashboard updates

3. **Replay**:
   - User clicks replay → API endpoint → Proxy makes call → Store result → Return diff

---

## Key Design Decisions

### Why Separate Core and Infrastructure?

- **Testability**: Core logic can be tested without database/MCP dependencies
- **Flexibility**: Easy to swap database backends or add new adapters
- **Clarity**: Clear boundaries make the codebase easier to understand

### Why Split CLI Commands?

- **Maintainability**: Each command in its own file is easier to maintain
- **Clarity**: Clear separation of concerns
- **Scalability**: Easy to add new commands

### Why Separate Dashboard Routes?

- **Organization**: Routes split by domain (runs, calls, stats, replay)
- **Maintainability**: Each route file is focused and easier to understand
- **Testability**: Routes can be tested independently

### Database Abstraction

- **Current**: SQLite only (via `DatabaseAdapter` interface)
- **Future**: Can add PostgreSQL/other backends without changing core logic
- **Rationale**: Abstraction is lightweight - only added because it's actually needed

---

## Migration Status

✅ **Complete**: All code migrated to new structure
✅ **Clean**: No legacy files remain
✅ **Organized**: Clear separation of concerns
✅ **Documented**: Architecture and file structure documented
