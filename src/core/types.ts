/**
 * Core domain types for MCP Inspector
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
}

export interface RunRecord {
	id: string;
	started_at: number;
	ended_at: number | null;
	mcp_server: string;
	tool_count: number;
	error_count: number;
	status: 'active' | 'completed' | 'manual_stopped';
}

export interface ToolSchemaRecord {
	id: string;
	run_id: string;
	mcp_server: string;
	captured_at: number;
	tools_json: string;
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

export interface RunStats {
	total_runs: number;
	active_runs: number;
}

