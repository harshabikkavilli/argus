/**
 * SQLite implementation of the DatabaseAdapter
 */

import Database from 'better-sqlite3';
import type {
	DatabaseAdapter,
	ToolCallRecord,
	RunRecord,
	ToolSchemaRecord,
	StatsOverview,
	ToolStats,
	RunStats
} from '../types.js';

import {migrateDatabase} from './migrations.js';

// ============================================================================
// SQLite Adapter
// ============================================================================

export class SQLiteAdapter implements DatabaseAdapter {
	private db: Database.Database;
	private insertCallStmt: Database.Statement;
	private insertRunStmt: Database.Statement;
	private insertSchemaStmt: Database.Statement;

	constructor(dbPath: string = 'argus.db') {
		this.db = new Database(dbPath);

		// Create base tables
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS tool_calls (
				id TEXT PRIMARY KEY,
				timestamp INTEGER,
				tool_name TEXT,
				params TEXT,
				result TEXT,
				error TEXT,
				latency_ms INTEGER,
				mcp_server TEXT
			)
		`);

		// Run migrations
		migrateDatabase(this.db);

		// Prepare statements for performance
		this.insertCallStmt = this.db.prepare(`
			INSERT INTO tool_calls (id, timestamp, tool_name, params, result, error, latency_ms, mcp_server, run_id, replayed_from)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);

		this.insertRunStmt = this.db.prepare(`
			INSERT INTO runs (id, started_at, mcp_server, status)
			VALUES (?, ?, ?, 'active')
		`);

		this.insertSchemaStmt = this.db.prepare(`
			INSERT INTO tool_schemas (id, run_id, mcp_server, captured_at, tools_json)
			VALUES (?, ?, ?, ?, ?)
		`);
	}

	// =========== Runs ===========

	createRun(run: Pick<RunRecord, 'id' | 'started_at' | 'mcp_server'>): void {
		this.insertRunStmt.run(run.id, run.started_at, run.mcp_server);
	}

	updateRun(
		id: string,
		updates: Partial<Pick<RunRecord, 'ended_at' | 'status'>>
	): void {
		const setClauses: string[] = [];
		const params: (string | number | null)[] = [];

		if (updates.ended_at !== undefined) {
			setClauses.push('ended_at = ?');
			params.push(updates.ended_at);
		}
		if (updates.status !== undefined) {
			setClauses.push('status = ?');
			params.push(updates.status);
		}

		if (setClauses.length > 0) {
			params.push(id);
			this.db
				.prepare(`UPDATE runs SET ${setClauses.join(', ')} WHERE id = ?`)
				.run(...params);
		}
	}

	incrementRunToolCount(id: string, hasError: boolean): void {
		if (hasError) {
			this.db
				.prepare(
					`UPDATE runs SET tool_count = tool_count + 1, error_count = error_count + 1 WHERE id = ?`
				)
				.run(id);
		} else {
			this.db
				.prepare(`UPDATE runs SET tool_count = tool_count + 1 WHERE id = ?`)
				.run(id);
		}
	}

	getRun(id: string): RunRecord | undefined {
		return this.db.prepare('SELECT * FROM runs WHERE id = ?').get(id) as
			| RunRecord
			| undefined;
	}

	listRuns(options?: {status?: string; limit?: number}): RunRecord[] {
		const limit = options?.limit ?? 50;
		const status = options?.status;

		let query = 'SELECT * FROM runs';
		const params: (string | number)[] = [];

		if (status && status !== 'all') {
			query += ' WHERE status = ?';
			params.push(status);
		}

		query += ' ORDER BY started_at DESC LIMIT ?';
		params.push(limit);

		return this.db.prepare(query).all(...params) as RunRecord[];
	}

	// =========== Tool Calls ===========

	insertToolCall(call: ToolCallRecord): void {
		this.insertCallStmt.run(
			call.id,
			call.timestamp,
			call.tool_name,
			call.params,
			call.result,
			call.error,
			call.latency_ms,
			call.mcp_server,
			call.run_id,
			call.replayed_from
		);
	}

	getToolCall(id: string): ToolCallRecord | undefined {
		return this.db
			.prepare('SELECT * FROM tool_calls WHERE id = ?')
			.get(id) as ToolCallRecord | undefined;
	}

	listToolCalls(options?: {
		toolName?: string;
		hasError?: boolean;
		runId?: string;
		limit?: number;
	}): ToolCallRecord[] {
		const limit = options?.limit ?? 100;

		let query = 'SELECT * FROM tool_calls';
		const conditions: string[] = [];
		const params: (string | number)[] = [];

		if (options?.toolName) {
			conditions.push('tool_name = ?');
			params.push(options.toolName);
		}
		if (options?.hasError) {
			conditions.push('error IS NOT NULL');
		}
		if (options?.runId) {
			conditions.push('run_id = ?');
			params.push(options.runId);
		}

		if (conditions.length > 0) {
			query += ' WHERE ' + conditions.join(' AND ');
		}

		query += ' ORDER BY timestamp DESC LIMIT ?';
		params.push(limit);

		return this.db.prepare(query).all(...params) as ToolCallRecord[];
	}

	getToolCallsForRun(runId: string): ToolCallRecord[] {
		return this.db
			.prepare(
				'SELECT * FROM tool_calls WHERE run_id = ? ORDER BY timestamp ASC'
			)
			.all(runId) as ToolCallRecord[];
	}

	// =========== Tool Schemas ===========

	insertToolSchema(schema: ToolSchemaRecord): void {
		this.insertSchemaStmt.run(
			schema.id,
			schema.run_id,
			schema.mcp_server,
			schema.captured_at,
			schema.tools_json
		);
	}

	getSchemaForRun(runId: string): ToolSchemaRecord | undefined {
		return this.db
			.prepare('SELECT * FROM tool_schemas WHERE run_id = ?')
			.get(runId) as ToolSchemaRecord | undefined;
	}

	// =========== Stats ===========

	getStats(runId?: string): StatsOverview {
		let whereClause = '';
		const params: string[] = [];
		if (runId) {
			whereClause = ' WHERE run_id = ?';
			params.push(runId);
		}

		return this.db
			.prepare(
				`SELECT 
					COUNT(*) as total_calls,
					COUNT(CASE WHEN error IS NOT NULL THEN 1 END) as failed_calls,
					AVG(latency_ms) as avg_latency,
					MAX(latency_ms) as max_latency,
					MIN(latency_ms) as min_latency
				FROM tool_calls${whereClause}`
			)
			.get(...params) as StatsOverview;
	}

	getToolBreakdown(runId?: string): ToolStats[] {
		let whereClause = '';
		const params: string[] = [];
		if (runId) {
			whereClause = ' WHERE run_id = ?';
			params.push(runId);
		}

		return this.db
			.prepare(
				`SELECT 
					tool_name,
					COUNT(*) as call_count,
					AVG(latency_ms) as avg_latency,
					COUNT(CASE WHEN error IS NOT NULL THEN 1 END) as error_count
				FROM tool_calls${whereClause}
				GROUP BY tool_name
				ORDER BY call_count DESC`
			)
			.all(...params) as ToolStats[];
	}

	getRunStats(): RunStats {
		return this.db
			.prepare(
				`SELECT 
					COUNT(*) as total_runs,
					COUNT(CASE WHEN status = 'active' THEN 1 END) as active_runs
				FROM runs`
			)
			.get() as RunStats;
	}

	// =========== Servers ===========

	listServers(): { name: string; call_count: number; last_seen: number }[] {
		return this.db
			.prepare(
				`SELECT 
					mcp_server as name,
					COUNT(*) as call_count,
					MAX(timestamp) as last_seen
				FROM tool_calls
				WHERE mcp_server IS NOT NULL AND mcp_server != ''
				GROUP BY mcp_server
				ORDER BY call_count DESC`
			)
			.all() as { name: string; call_count: number; last_seen: number }[];
	}

	// =========== Cleanup ===========

	clearAll(): void {
		this.db.prepare('DELETE FROM tool_calls').run();
		this.db.prepare('DELETE FROM tool_schemas').run();
		this.db.prepare('DELETE FROM runs').run();
	}

	close(): void {
		this.db.close();
	}

	// =========== Raw Access (for backwards compatibility) ===========

	getRawDb(): Database.Database {
		return this.db;
	}
}

// Factory function
export function createSQLiteAdapter(dbPath?: string): SQLiteAdapter {
	return new SQLiteAdapter(dbPath);
}

