import { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useCalls } from '../../hooks/useCalls';
import { CallRow } from './CallRow';
import type { ToolCallRecord } from '../../types/api';

interface CallListProps {
	onCallClick: (call: ToolCallRecord) => void;
}

export function CallList({ onCallClick }: CallListProps) {
	const { state } = useDashboard();
	const [searchQuery, setSearchQuery] = useState('');

	const { calls, loading } = useCalls({
		limit: 100,
		run_id: state.selectedRunId || undefined,
		error: state.showErrorsOnly ? true : undefined
	});

	const filteredCalls = useMemo(() => {
		let filtered = calls;

		// Filter by slow calls
		if (state.showSlowCallsOnly) {
			filtered = filtered.filter((call) => call.latency_ms > 1000);
		}

		// Filter by search query
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(call) =>
					call.tool_name.toLowerCase().includes(query) ||
					call.params.toLowerCase().includes(query) ||
					call.mcp_server.toLowerCase().includes(query)
			);
		}

		return filtered;
	}, [calls, state.showSlowCallsOnly, searchQuery]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12 text-text-secondary">
				<div className="animate-pulse">Loading calls...</div>
			</div>
		);
	}

	return (
		<div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
			<div className="p-4 border-b border-border">
				<input
					type="text"
					placeholder="Filter by tool name or params..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full px-4 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
				/>
			</div>
			<div>
				<div className="grid grid-cols-[60px_1fr_100px_80px_80px] gap-4 px-5 py-3.5 bg-bg-tertiary border-b border-border text-xs uppercase tracking-wide text-text-secondary">
					<div>#</div>
					<div>Tool Name</div>
					<div>Time</div>
					<div>Latency</div>
					<div>Status</div>
				</div>
				{filteredCalls.length === 0 ? (
					<div className="text-center py-12 text-text-secondary">
						<p>No calls found</p>
					</div>
				) : (
					filteredCalls.map((call, index) => (
						<CallRow key={call.id} call={call} index={index} onClick={() => onCallClick(call)} />
					))
				)}
			</div>
		</div>
	);
}

