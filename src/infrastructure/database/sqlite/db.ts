/**
 * SQLite implementation of the DatabaseAdapter using sql.js (pure JavaScript)
 *
 * sql.js is WebAssembly-based, works everywhere without native compilation.
 * No more Node version mismatch issues!
 */

import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {dirname} from 'path';
import initSqlJs, {type Database as SqlJsDatabase} from 'sql.js';
import type {
	DatabaseAdapter,
	RunRecord,
	RunStats,
	StatsOverview,
	ToolCallRecord,
	ToolSchemaRecord,
	ToolStats
} from '../types.js';

import {migrateDatabase} from './migrations.js';

// ============================================================================
// SQLite Adapter (sql.js - pure JavaScript)
// ============================================================================

export class SQLiteAdapter implements DatabaseAdapter {
	private db: SqlJsDatabase;
	private dbPath: string;
	private SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

	private constructor(
		db: SqlJsDatabase,
		dbPath: string,
		SQL: Awaited<ReturnType<typeof initSqlJs>>
	) {
		this.db = db;
		this.dbPath = dbPath;
		this.SQL = SQL;
	}

	/**
	 * Create a new SQLiteAdapter instance (async factory)
	 */
	static async create(dbPath: string = 'argus.db'): Promise<SQLiteAdapter> {
		// Initialize sql.js
		const SQL = await initSqlJs();

		let db: SqlJsDatabase;

		// Load existing database or create new one
		if (existsSync(dbPath)) {
			try {
				const fileBuffer = readFileSync(dbPath);
				db = new SQL.Database(fileBuffer);
			} catch (error) {
				console.error(
					`[Database] Failed to load ${dbPath}, creating new:`,
					error
				);
				db = new SQL.Database();
			}
		} else {
			// Ensure directory exists
			const dir = dirname(dbPath);
			if (dir && !existsSync(dir)) {
				mkdirSync(dir, {recursive: true});
			}
			db = new SQL.Database();
		}

		const adapter = new SQLiteAdapter(db, dbPath, SQL);

		// Create base tables
		adapter.db.run(`
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
		migrateDatabase(adapter.db);

		// Save initial state
		adapter.saveToFile();

		return adapter;
	}

	/**
	 * Reload database from file (for multi-process scenarios)
	 * Call this when you know another process has written to the file
	 */
	reload(): void {
		if (!this.SQL) {
			console.error('[Database] Cannot reload: SQL not initialized');
			return;
		}

		try {
			if (existsSync(this.dbPath)) {
				const fileBuffer = readFileSync(this.dbPath);
				// Close old database
				this.db.close();
				// Create new database from file
				this.db = new this.SQL.Database(fileBuffer);
			}
		} catch (error) {
			console.error('[Database] Failed to reload:', error);
		}
	}

	/**
	 * Save database to file (immediate - required for multi-process scenarios)
	 */
	private saveToFile(): void {
		try {
			const data = this.db.export();
			const buffer = Buffer.from(data);
			writeFileSync(this.dbPath, buffer);
		} catch (error) {
			console.error('[Database] Failed to save:', error);
		}
	}

	// =========== Helper Methods ===========

	private runQuery(sql: string, params: (string | number | null)[] = []): void {
		this.db.run(sql, params);
		this.saveToFile();
	}

	private getOne<T>(
		sql: string,
		params: (string | number | null)[] = []
	): T | undefined {
		const stmt = this.db.prepare(sql);
		stmt.bind(params);
		if (stmt.step()) {
			const result = stmt.getAsObject() as T;
			stmt.free();
			return result;
		}
		stmt.free();
		return undefined;
	}

	private getAll<T>(sql: string, params: (string | number | null)[] = []): T[] {
		const results: T[] = [];
		const stmt = this.db.prepare(sql);
		stmt.bind(params);
		while (stmt.step()) {
			results.push(stmt.getAsObject() as T);
		}
		stmt.free();
		return results;
	}

	// =========== Runs ===========

	createRun(run: Pick<RunRecord, 'id' | 'started_at' | 'mcp_server'>): void {
		this.runQuery(
			`INSERT INTO runs (id, started_at, mcp_server, status) VALUES (?, ?, ?, 'active')`,
			[run.id, run.started_at, run.mcp_server]
		);
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
			this.runQuery(
				`UPDATE runs SET ${setClauses.join(', ')} WHERE id = ?`,
				params
			);
		}
	}

	incrementRunToolCount(id: string, hasError: boolean): void {
		if (hasError) {
			this.runQuery(
				`UPDATE runs SET tool_count = tool_count + 1, error_count = error_count + 1 WHERE id = ?`,
				[id]
			);
		} else {
			this.runQuery(
				`UPDATE runs SET tool_count = tool_count + 1 WHERE id = ?`,
				[id]
			);
		}
	}

	getRun(id: string): RunRecord | undefined {
		return this.getOne<RunRecord>('SELECT * FROM runs WHERE id = ?', [id]);
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

		return this.getAll<RunRecord>(query, params);
	}

	// =========== Tool Calls ===========

	insertToolCall(call: ToolCallRecord): void {
		this.runQuery(
			`INSERT INTO tool_calls (id, timestamp, tool_name, params, result, error, latency_ms, mcp_server, run_id, replayed_from)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
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
			]
		);
	}

	getToolCall(id: string): ToolCallRecord | undefined {
		return this.getOne<ToolCallRecord>(
			'SELECT * FROM tool_calls WHERE id = ?',
			[id]
		);
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

		return this.getAll<ToolCallRecord>(query, params);
	}

	getToolCallsForRun(runId: string): ToolCallRecord[] {
		return this.getAll<ToolCallRecord>(
			'SELECT * FROM tool_calls WHERE run_id = ? ORDER BY timestamp ASC',
			[runId]
		);
	}

	// =========== Tool Schemas ===========

	insertToolSchema(schema: ToolSchemaRecord): void {
		this.runQuery(
			`INSERT INTO tool_schemas (id, run_id, mcp_server, captured_at, tools_json)
			 VALUES (?, ?, ?, ?, ?)`,
			[
				schema.id,
				schema.run_id,
				schema.mcp_server,
				schema.captured_at,
				schema.tools_json
			]
		);
	}

	getSchemaForRun(runId: string): ToolSchemaRecord | undefined {
		return this.getOne<ToolSchemaRecord>(
			'SELECT * FROM tool_schemas WHERE run_id = ?',
			[runId]
		);
	}

	// =========== Stats ===========

	getStats(runId?: string): StatsOverview {
		let whereClause = '';
		const params: string[] = [];
		if (runId) {
			whereClause = ' WHERE run_id = ?';
			params.push(runId);
		}

		const result = this.getOne<StatsOverview>(
			`SELECT 
				COUNT(*) as total_calls,
				COUNT(CASE WHEN error IS NOT NULL THEN 1 END) as failed_calls,
				AVG(latency_ms) as avg_latency,
				MAX(latency_ms) as max_latency,
				MIN(latency_ms) as min_latency
			FROM tool_calls${whereClause}`,
			params
		);

		return (
			result || {
				total_calls: 0,
				failed_calls: 0,
				avg_latency: 0,
				max_latency: 0,
				min_latency: 0
			}
		);
	}

	getToolBreakdown(runId?: string): ToolStats[] {
		let whereClause = '';
		const params: string[] = [];
		if (runId) {
			whereClause = ' WHERE run_id = ?';
			params.push(runId);
		}

		return this.getAll<ToolStats>(
			`SELECT 
				tool_name,
				COUNT(*) as call_count,
				AVG(latency_ms) as avg_latency,
				COUNT(CASE WHEN error IS NOT NULL THEN 1 END) as error_count
			FROM tool_calls${whereClause}
			GROUP BY tool_name
			ORDER BY call_count DESC`,
			params
		);
	}

	getRunStats(): RunStats {
		const result = this.getOne<RunStats>(
			`SELECT 
				COUNT(*) as total_runs,
				COUNT(CASE WHEN status = 'active' THEN 1 END) as active_runs
			FROM runs`
		);

		return result || {total_runs: 0, active_runs: 0};
	}

	// =========== Servers ===========

	listServers(): {name: string; call_count: number; last_seen: number}[] {
		return this.getAll<{name: string; call_count: number; last_seen: number}>(
			`SELECT 
				mcp_server as name,
				COUNT(*) as call_count,
				MAX(timestamp) as last_seen
			FROM tool_calls
			WHERE mcp_server IS NOT NULL AND mcp_server != ''
			GROUP BY mcp_server
			ORDER BY call_count DESC`
		);
	}

	// =========== Cleanup ===========

	clearAll(): void {
		this.runQuery('DELETE FROM tool_calls');
		this.runQuery('DELETE FROM tool_schemas');
		this.runQuery('DELETE FROM runs');
	}

	close(): void {
		this.saveToFile();
		this.db.close();
	}
}

// ============================================================================
// Factory function (async)
// ============================================================================

export async function createSQLiteAdapter(
	dbPath?: string
): Promise<SQLiteAdapter> {
	return SQLiteAdapter.create(dbPath);
}
