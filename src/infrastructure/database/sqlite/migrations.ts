/**
 * Database migrations for SQLite (sql.js)
 */

import type {Database as SqlJsDatabase} from 'sql.js';
import {v4 as uuidv4} from 'uuid';

interface ColumnInfo {
	name: string;
}

interface CountResult {
	count: number;
}

interface TimestampResult {
	ts: number | null;
}

/**
 * Helper to get a single value from a query
 */
function getOne<T>(
	db: SqlJsDatabase,
	sql: string,
	params: (string | number)[] = []
): T | undefined {
	const stmt = db.prepare(sql);
	stmt.bind(params);
	if (stmt.step()) {
		const result = stmt.getAsObject() as T;
		stmt.free();
		return result;
	}
	stmt.free();
	return undefined;
}

/**
 * Helper to get all rows from a query
 */
function getAll<T>(
	db: SqlJsDatabase,
	sql: string,
	params: (string | number)[] = []
): T[] {
	const results: T[] = [];
	const stmt = db.prepare(sql);
	stmt.bind(params);
	while (stmt.step()) {
		results.push(stmt.getAsObject() as T);
	}
	stmt.free();
	return results;
}

export function migrateDatabase(db: SqlJsDatabase): void {
	// Check which columns exist in tool_calls
	const columns = getAll<ColumnInfo>(db, 'PRAGMA table_info(tool_calls)');
	const columnNames = new Set(columns.map((c) => c.name));

	// Migration: Add run_id column
	if (!columnNames.has('run_id')) {
		db.run(`ALTER TABLE tool_calls ADD COLUMN run_id TEXT`);
	}

	// Migration: Add replayed_from column
	if (!columnNames.has('replayed_from')) {
		db.run(`ALTER TABLE tool_calls ADD COLUMN replayed_from TEXT`);
	}

	// Create runs table
	db.run(`
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
	db.run(`
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
	const orphanCount = getOne<CountResult>(
		db,
		`SELECT COUNT(*) as count FROM tool_calls WHERE run_id IS NULL`
	);

	if (orphanCount && orphanCount.count > 0) {
		const legacyRunId = 'legacy-' + uuidv4().slice(0, 8);
		const earliestCall = getOne<TimestampResult>(
			db,
			`SELECT MIN(timestamp) as ts FROM tool_calls WHERE run_id IS NULL`
		);

		db.run(
			`INSERT INTO runs (id, started_at, ended_at, mcp_server, tool_count, error_count, status)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[
				legacyRunId,
				earliestCall?.ts || Date.now(),
				Date.now(),
				'legacy',
				orphanCount.count,
				0,
				'completed'
			]
		);

		db.run(`UPDATE tool_calls SET run_id = ? WHERE run_id IS NULL`, [
			legacyRunId
		]);
	}
}
