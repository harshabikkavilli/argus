/**
 * Database migrations for SQLite
 */

import Database from 'better-sqlite3';
import {v4 as uuidv4} from 'uuid';

export function migrateDatabase(db: Database.Database): void {
	// Check which columns exist in tool_calls
	const columns = db.prepare('PRAGMA table_info(tool_calls)').all() as Array<{
		name: string;
	}>;
	const columnNames = new Set(columns.map((c) => c.name));

	// Migration: Add run_id column
	if (!columnNames.has('run_id')) {
		db.exec(`ALTER TABLE tool_calls ADD COLUMN run_id TEXT`);
	}

	// Migration: Add replayed_from column
	if (!columnNames.has('replayed_from')) {
		db.exec(`ALTER TABLE tool_calls ADD COLUMN replayed_from TEXT`);
	}

	// Create runs table
	db.exec(`
		CREATE TABLE IF NOT EXISTS runs (
			id TEXT PRIMARY KEY,
			started_at INTEGER,
			ended_at INTEGER,
			mcp_server TEXT,
			tool_count INTEGER DEFAULT 0,
			error_count INTEGER DEFAULT 0,
			status TEXT DEFAULT 'active'
		)
	`);

	// Create tool_schemas table
	db.exec(`
		CREATE TABLE IF NOT EXISTS tool_schemas (
			id TEXT PRIMARY KEY,
			run_id TEXT,
			mcp_server TEXT,
			captured_at INTEGER,
			tools_json TEXT,
			FOREIGN KEY (run_id) REFERENCES runs(id)
		)
	`);

	// Handle orphaned tool_calls (no run_id) - create a legacy run
	const orphanCount = db
		.prepare(`SELECT COUNT(*) as count FROM tool_calls WHERE run_id IS NULL`)
		.get() as {count: number};

	if (orphanCount.count > 0) {
		const legacyRunId = 'legacy-' + uuidv4().slice(0, 8);
		const earliestCall = db
			.prepare(
				`SELECT MIN(timestamp) as ts FROM tool_calls WHERE run_id IS NULL`
			)
			.get() as {ts: number | null};

		db.prepare(
			`INSERT INTO runs (id, started_at, ended_at, mcp_server, tool_count, error_count, status)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		).run(
			legacyRunId,
			earliestCall.ts || Date.now(),
			Date.now(),
			'legacy',
			orphanCount.count,
			0,
			'completed'
		);

		db.prepare(`UPDATE tool_calls SET run_id = ? WHERE run_id IS NULL`).run(
			legacyRunId
		);
	}
}

