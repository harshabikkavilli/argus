/**
 * Run Manager - manages run/session lifecycle
 */

import {v4 as uuidv4} from 'uuid';
import type {DatabaseAdapter, ToolSchemaRecord} from '../../infrastructure/database/types.js';
import type {Notifier} from '../../infrastructure/notification/notifier.js';

export class RunManager {
	private db: DatabaseAdapter;
	private currentRunId: string | null = null;
	private lastActivityTime: number = 0;
	private idleTimeoutMs: number;
	private serverName: string;
	private notifier: Notifier;

	constructor(
		db: DatabaseAdapter,
		serverName: string,
		options: {idleTimeoutMs?: number; notifier?: Notifier} = {}
	) {
		this.db = db;
		this.serverName = serverName;
		this.idleTimeoutMs = options.idleTimeoutMs || 60000;
		this.notifier = options.notifier!;
	}

	/**
	 * Start a new run
	 */
	startNewRun(): string {
		if (this.currentRunId) {
			this.endCurrentRun('completed');
		}

		const runId = uuidv4();
		const now = Date.now();

		this.db.createRun({
			id: runId,
			started_at: now,
			mcp_server: this.serverName
		});

		this.currentRunId = runId;
		this.lastActivityTime = now;

		console.error(`[Inspector] Started new run: ${runId}`);
		this.notifier.notifyRunChange(runId, 'started');

		return runId;
	}

	/**
	 * End current run
	 */
	endCurrentRun(status: 'completed' | 'manual_stopped' = 'completed'): void {
		if (!this.currentRunId) return;

		this.db.updateRun(this.currentRunId, {
			ended_at: Date.now(),
			status
		});

		console.error(`[Inspector] Ended run: ${this.currentRunId} (${status})`);
		this.notifier.notifyRunChange(this.currentRunId, 'ended');
		this.currentRunId = null;
	}

	/**
	 * Get run ID for current activity, creating new run if needed
	 */
	getRunIdForActivity(): string {
		const now = Date.now();

		if (this.currentRunId) {
			const idleTime = now - this.lastActivityTime;
			if (idleTime > this.idleTimeoutMs) {
				console.error(
					`[Inspector] Idle timeout (${Math.round(
						idleTime / 1000
					)}s) - starting new run`
				);
				this.startNewRun();
			}
		} else {
			this.startNewRun();
		}

		this.lastActivityTime = now;
		return this.currentRunId!;
	}

	/**
	 * Increment tool count for current run
	 */
	incrementToolCount(hasError: boolean): void {
		if (!this.currentRunId) return;
		this.db.incrementRunToolCount(this.currentRunId, hasError);
	}

	getCurrentRunId(): string | null {
		return this.currentRunId;
	}

	/**
	 * Store tool schemas for current run
	 */
	captureToolSchemas(tools: unknown[]): void {
		if (!this.currentRunId) return;

		const schema: ToolSchemaRecord = {
			id: uuidv4(),
			run_id: this.currentRunId,
			mcp_server: this.serverName,
			captured_at: Date.now(),
			tools_json: JSON.stringify(tools)
		};
		this.db.insertToolSchema(schema);

		console.error(`[Inspector] Captured ${tools.length} tool schemas for run`);
	}
}

