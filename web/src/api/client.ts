/**
 * API client for dashboard
 */

import type {
	ListCallsOptions,
	ReplayResponse,
	RunRecord,
	RunWithCalls,
	ServerRecord,
	StatsResponse,
	ToolCallRecord
} from '../types/api';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
	const response = await fetch(url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options?.headers
		}
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({error: 'Unknown error'}));
		throw new Error(error.error || `HTTP ${response.status}`);
	}

	return response.json();
}

// Runs API
export async function getRuns(
	limit = 50,
	status?: string
): Promise<RunRecord[]> {
	const params = new URLSearchParams({limit: limit.toString()});
	if (status) params.append('status', status);
	return fetchJSON<RunRecord[]>(`${API_BASE}/runs?${params}`);
}

export async function getRun(id: string): Promise<RunWithCalls> {
	return fetchJSON<RunWithCalls>(`${API_BASE}/runs/${id}`);
}

export async function startRun(): Promise<{run_id: string}> {
	return fetchJSON<{run_id: string}>(`${API_BASE}/runs/start`, {
		method: 'POST'
	});
}

export async function stopRun(
	id: string
): Promise<{message: string; run: RunRecord}> {
	return fetchJSON<{message: string; run: RunRecord}>(
		`${API_BASE}/runs/${id}/stop`,
		{
			method: 'POST'
		}
	);
}

export async function getRunSchema(id: string): Promise<{tools: unknown[]}> {
	return fetchJSON<{tools: unknown[]}>(`${API_BASE}/runs/${id}/schema`);
}

// Calls API
export async function getCalls(
	options: ListCallsOptions = {}
): Promise<ToolCallRecord[]> {
	const params = new URLSearchParams();
	if (options.limit) params.append('limit', options.limit.toString());
	if (options.tool) params.append('tool', options.tool);
	if (options.error) params.append('error', 'true');
	if (options.run_id) params.append('run_id', options.run_id);
	return fetchJSON<ToolCallRecord[]>(`${API_BASE}/calls?${params}`);
}

export async function getCall(id: string): Promise<ToolCallRecord> {
	return fetchJSON<ToolCallRecord>(`${API_BASE}/calls/${id}`);
}

export async function replayCall(id: string): Promise<ReplayResponse> {
	return fetchJSON<ReplayResponse>(`${API_BASE}/calls/${id}/replay`, {
		method: 'POST'
	});
}

export async function clearAll(): Promise<{message: string}> {
	return fetchJSON<{message: string}>(`${API_BASE}/calls`, {
		method: 'DELETE'
	});
}

// Stats API
export async function getStats(runId?: string): Promise<StatsResponse> {
	const url = runId ? `${API_BASE}/stats?run_id=${runId}` : `${API_BASE}/stats`;
	return fetchJSON<StatsResponse>(url);
}

// Servers API
export async function getServers(): Promise<ServerRecord[]> {
	return fetchJSON<ServerRecord[]>(`${API_BASE}/servers`);
}
