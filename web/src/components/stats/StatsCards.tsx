import { useStats } from '../../hooks/useStats';
import { useDashboard } from '../../context/DashboardContext';

function formatLatency(ms: number | null): string {
	if (ms === null) return '-';
	if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
	return `${ms}ms`;
}

export function StatsCards() {
	const { state } = useDashboard();
	const { stats } = useStats(state.selectedRunId || undefined);

	if (!stats) {
		return (
			<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="bg-bg-secondary border border-border rounded-xl p-4">
						<div className="text-2xl font-bold mb-1">-</div>
						<div className="text-xs text-text-secondary uppercase tracking-wide">Loading...</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
			<div className="bg-bg-secondary border border-border rounded-xl p-4 hover:border-accent transition-colors">
				<div className="text-2xl font-bold mb-1 text-purple">{stats.runs.total_runs}</div>
				<div className="text-xs text-text-secondary uppercase tracking-wide">Runs</div>
			</div>
			<div className="bg-bg-secondary border border-border rounded-xl p-4 hover:border-accent transition-colors">
				<div className="text-2xl font-bold mb-1">{stats.overview.total_calls}</div>
				<div className="text-xs text-text-secondary uppercase tracking-wide">Total Calls</div>
			</div>
			<div className="bg-bg-secondary border border-border rounded-xl p-4 hover:border-accent transition-colors">
				<div className="text-2xl font-bold mb-1 text-error">{stats.overview.failed_calls}</div>
				<div className="text-xs text-text-secondary uppercase tracking-wide">Failed</div>
			</div>
			<div className="bg-bg-secondary border border-border rounded-xl p-4 hover:border-accent transition-colors">
				<div className="text-2xl font-bold mb-1 text-success">
					{formatLatency(stats.overview.avg_latency)}
				</div>
				<div className="text-xs text-text-secondary uppercase tracking-wide">Avg Latency</div>
			</div>
			<div className="bg-bg-secondary border border-border rounded-xl p-4 hover:border-accent transition-colors">
				<div className="text-2xl font-bold mb-1 text-warning">
					{formatLatency(stats.overview.max_latency)}
				</div>
				<div className="text-xs text-text-secondary uppercase tracking-wide">Max Latency</div>
			</div>
		</div>
	);
}

