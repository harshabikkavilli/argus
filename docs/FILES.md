# File Structure Overview

Quick reference for what each file does in the Argus codebase.

## Core Layer (`src/core/`)

Domain logic with no external dependencies.

| File                          | Purpose                                               | Status    |
| ----------------------------- | ----------------------------------------------------- | --------- |
| `core/types.ts`               | Shared domain types                                   | ✅ Active |
| `core/redaction/redactor.ts`  | Redact sensitive data (tokens, passwords, etc.)       | ✅ Active |
| `core/replay/diff.ts`         | JSON diff utilities for comparing tool call results   | ✅ Active |
| `core/runs/runManager.ts`     | Run/session lifecycle management                      | ✅ Active |
| `core/calls/schemaCapture.ts` | Tool schema capture logic                             | ✅ Active |

## Infrastructure Layer (`src/infrastructure/`)

Adapters that implement interfaces.

### Database

| File                                    | Purpose                                              | Status    |
| --------------------------------------- | ---------------------------------------------------- | --------- |
| `infrastructure/database/types.ts`      | Database adapter interface                           | ✅ Active |
| `infrastructure/database/sqlite/db.ts`  | SQLite implementation of DatabaseAdapter             | ✅ Active |
| `infrastructure/database/sqlite/migrations.ts` | Database migrations                        | ✅ Active |
| `infrastructure/database/index.ts`      | Database exports                                     | ✅ Active |

### MCP

| File                         | Purpose                                    | Status    |
| ---------------------------- | ------------------------------------------ | --------- |
| `infrastructure/mcp/proxy.ts` | Lightweight MCP proxy server              | ✅ Active |
| `infrastructure/mcp/index.ts` | MCP exports                                | ✅ Active |

### Notification

| File                              | Purpose                                      | Status    |
| --------------------------------- | -------------------------------------------- | --------- |
| `infrastructure/notification/notifier.ts` | HTTP notification client for SSE updates | ✅ Active |

## Application Layer (`src/app/`)

Applications built on infrastructure.

### CLI (`src/app/cli/`)

| File                        | Purpose                      | Status    |
| --------------------------- | ---------------------------- | --------- |
| `app/cli/index.ts`          | CLI entry point              | ✅ Active |
| `app/cli/commands/dashboard.ts` | Dashboard command handler | ✅ Active |
| `app/cli/commands/wrap.ts`  | Wrap command handler         | ✅ Active |
| `app/cli/commands/setup.ts` | Setup command handler        | ✅ Active |
| `app/cli/commands/stats.ts` | Stats command handler        | ✅ Active |
| `app/cli/commands/diagnose.ts` | Diagnose command handler | ✅ Active |

### Dashboard (`src/app/dashboard/`)

| File                                   | Purpose                                    | Status    |
| -------------------------------------- | ------------------------------------------ | --------- |
| `app/dashboard/index.ts`               | Dashboard entry point                      | ✅ Active |
| `app/dashboard/server.ts`              | Express server setup                       | ✅ Active |
| `app/dashboard/routes/index.ts`        | Route aggregator                           | ✅ Active |
| `app/dashboard/routes/runs.ts`         | Run API endpoints                          | ✅ Active |
| `app/dashboard/routes/calls.ts`        | Tool call API endpoints                    | ✅ Active |
| `app/dashboard/routes/stats.ts`        | Statistics API endpoints                   | ✅ Active |
| `app/dashboard/routes/replay.ts`       | Replay API endpoints                       | ✅ Active |
| `app/dashboard/realtime/sseManager.ts` | Server-Sent Events manager                 | ✅ Active |
| `app/dashboard/ui/index.ts`            | ~~Embedded web UI (HTML/CSS/JavaScript)~~  | ❌ Removed (replaced by React app in `web/`) |

## Web Application (`web/`)

| File/Directory              | Purpose                                    | Status    |
| --------------------------- | ------------------------------------------ | --------- |
| `web/src/main.tsx`          | React app entry point                      | ✅ Active |
| `web/src/App.tsx`           | Root React component                       | ✅ Active |
| `web/src/components/`       | React components (layout, calls, runs, etc)| ✅ Active |
| `web/src/hooks/`            | Custom React hooks (SSE, data fetching)    | ✅ Active |
| `web/src/context/`          | React context for global state             | ✅ Active |
| `web/src/api/`              | API client functions                       | ✅ Active |
| `web/src/types/`            | TypeScript type definitions                | ✅ Active |
| `web/src/styles/`           | Tailwind CSS and global styles             | ✅ Active |
| `web/vite.config.ts`        | Vite build configuration                   | ✅ Active |
| `web/tailwind.config.js`    | Tailwind CSS configuration                 | ✅ Active |
| `web/index.html`            | HTML entry point                           | ✅ Active |

## Configuration (`src/config/`)

| File              | Purpose                                                        | Status    |
| ----------------- | -------------------------------------------------------------- | --------- |
| `config/index.ts` | Configuration management (load config, generate Claude config) | ✅ Active |

## Dev Tools (`src/devtools/`)

| File                    | Purpose                              | Status    |
| ----------------------- | ------------------------------------ | --------- |
| `devtools/test-server.ts` | Test MCP server for development/demo | ✅ Active |
| `devtools/test-client.ts` | Test client for making tool calls    | ✅ Active |

## Documentation

| File            | Purpose                                      |
| --------------- | -------------------------------------------- |
| `README.md`     | User documentation and getting started guide |
| `ARCHITECTURE.md` | Technical architecture documentation        |
| `FILES.md`      | This file - quick reference                  |

---

## Architecture Overview

The codebase uses a **Clean Architecture** pattern:

```
┌─────────────────────────────────────────┐
│         Application Layer                │
│  (app/cli, app/dashboard)                │
└──────────────┬──────────────────────────┘
               │ depends on
┌──────────────▼──────────────────────────┐
│      Infrastructure Layer                │
│  (database, mcp, notification)           │
└──────────────┬──────────────────────────┘
               │ implements interfaces from
┌──────────────▼──────────────────────────┐
│          Core Layer                      │
│  (types, redaction, replay, runs)        │
└──────────────────────────────────────────┘
```

### Key Principles

- **Core** has no dependencies on infrastructure or applications
- **Infrastructure** implements interfaces defined by core
- **Applications** depend on both core and infrastructure
- **Clear boundaries** make the codebase maintainable and testable

### Recommended Usage

- **Production**: Use `dashboard` + `wrap` commands separately
- **Development/Testing**: Run `dashboard` in one terminal, `wrap` in another
- **Entry Point**: `npx tsx src/app/cli/index.ts <command>`
