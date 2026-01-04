/**
 * Database types and adapter interface
 */

import type {
	ToolCallRecord,
	RunRecord,
	ToolSchemaRecord,
	StatsOverview,
	ToolStats,
	RunStats
} from '../../core/types.js';

// Re-export types
export type {
	ToolCallRecord,
	RunRecord,
	ToolSchemaRecord,
	StatsOverview,
	ToolStats,
	RunStats
};

export interface DatabaseAdapter {
	// Runs
	createRun(run: Pick<RunRecord, 'id' | 'started_at' | 'mcp_server'>): void;
	updateRun(
		id: string,
		updates: Partial<Pick<RunRecord, 'ended_at' | 'status'>>
	): void;
	incrementRunToolCount(id: string, hasError: boolean): void;
	getRun(id: string): RunRecord | undefined;
	listRuns(options?: {
		status?: string;
		limit?: number;
	}): RunRecord[];

	// Tool Calls
	insertToolCall(call: ToolCallRecord): void;
	getToolCall(id: string): ToolCallRecord | undefined;
	listToolCalls(options?: {
		toolName?: string;
		hasError?: boolean;
		runId?: string;
		limit?: number;
	}): ToolCallRecord[];
	getToolCallsForRun(runId: string): ToolCallRecord[];

	// Tool Schemas
	insertToolSchema(schema: ToolSchemaRecord): void;
	getSchemaForRun(runId: string): ToolSchemaRecord | undefined;

	// Stats
	getStats(runId?: string): StatsOverview;
	getToolBreakdown(runId?: string): ToolStats[];
	getRunStats(): RunStats;

	// Servers
	listServers(): { name: string; call_count: number; last_seen: number }[];

	// Cleanup
	clearAll(): void;

	// Close connection
	close(): void;
}

