/**
 * API type definitions for dashboard
 */

export interface ToolCallRecord {
	id: string;
	timestamp: number;
	tool_name: string;
	params: string;
	result: string | null;
	error: string | null;
	latency_ms: number;
	mcp_server: string;
	run_id: string | null;
	replayed_from: string | null;
	tool_schema?: ToolSchema | null;
	original_call?: ToolCallRecord | null;
}

export interface RunRecord {
	id: string;
	started_at: number;
	ended_at: number | null;
	mcp_server: string;
	tool_count: number;
	error_count: number;
	status: 'active' | 'completed' | 'manual_stopped' | 'error';
	calls?: ToolCallRecord[];
}

export interface ToolSchema {
	type?: string;
	properties?: Record<string, { type?: string; description?: string }>;
	required?: string[];
}

export interface StatsOverview {
	total_calls: number;
	failed_calls: number;
	avg_latency: number | null;
	max_latency: number | null;
	min_latency: number | null;
}

export interface ToolStats {
	tool_name: string;
	call_count: number;
	avg_latency: number | null;
	error_count: number;
}

export interface TopToolStat {
	tool_name: string;
	count: number;
}

export interface RunStats {
	total_runs: number;
	active_runs: number;
}

export interface StatsResponse {
	overview: StatsOverview;
	by_tool: ToolStats[];
	runs: RunStats;
	// Flattened stats for easy access
	total_calls: number;
	failed_calls: number;
	avg_latency: number;
	max_latency: number;
	top_tools: TopToolStat[];
}

export interface ReplayResponse {
	original: ToolCallRecord;
	replay: ToolCallRecord;
	diff?: DiffChange[];
	result_changed?: boolean;
}

export interface DiffChange {
	type: 'added' | 'removed' | 'changed';
	path: string;
	oldValue?: unknown;
	newValue?: unknown;
}

export interface RunWithCalls extends RunRecord {
	calls: ToolCallRecord[];
}

export interface ListCallsOptions {
	limit?: number;
	tool?: string;
	error?: boolean;
	run_id?: string;
	server?: string;
}

export interface ServerRecord {
	name: string;
	call_count: number;
	last_seen: number;
}
