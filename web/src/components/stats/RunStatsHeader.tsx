/**
 * Run stats header - displays stats for the selected run
 */

import {useDashboard} from '../../context/DashboardContext';
import {useRuns} from '../../hooks/useRuns';
import {useStats} from '../../hooks/useStats';
import {Icon} from '../common/Icon';

function formatLatency(ms: number | null): string {
	if (ms === null || ms === undefined) return '-';
	if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
	return `${Math.round(ms)}ms`;
}

function formatDuration(startedAt: number, endedAt?: number | null): string {
	const end = endedAt || Date.now();
	const durationMs = end - startedAt;
	const seconds = Math.floor(durationMs / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) return `${hours}h ${minutes % 60}m`;
	if (minutes > 0)
		return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(
			2,
			'0'
		)}`;
	return `00:${String(seconds).padStart(2, '0')}`;
}

function getTimeAgo(timestamp: number): string {
	const diff = Date.now() - timestamp;
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);

	if (hours > 0) return `${hours}h ago`;
	if (minutes > 0) return `${minutes}m ago`;
	return 'just now';
}

export function RunStatsHeader() {
	const {state} = useDashboard();
	const {runs} = useRuns();
	const {stats} = useStats(state.selectedRunId || undefined);

	// Get selected run or active run
	const selectedRun = state.selectedRunId
		? runs.find((r) => r.id === state.selectedRunId)
		: runs.find((r) => r.status === 'active') || runs[0];

	if (!selectedRun) {
		return (
			<div className='px-6 py-5 border-b border-border-color/50 bg-slate-900/20'>
				<div className='flex items-center justify-center py-8'>
					<div className='text-center'>
						<Icon
							name='inbox'
							size={48}
							className='text-slate-700 mx-auto mb-3'
						/>
						<p className='text-sm text-slate-500'>No runs available</p>
						<p className='text-xs text-slate-600 mt-1'>
							Start capturing to see data here
						</p>
					</div>
				</div>
			</div>
		);
	}

	const isActive = selectedRun.status === 'active';
	const errorRate = stats?.total_calls
		? ((stats.failed_calls / stats.total_calls) * 100).toFixed(1)
		: '0';

	return (
		<div className='px-6 py-5 border-b border-border-color/50 bg-slate-900/20'>
			{/* Run Header */}
			<div className='flex items-center justify-between mb-4'>
				<div className='flex items-center gap-3'>
					<h2 className='text-xl font-bold text-white tracking-tight flex items-center gap-3'>
						<span className='font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20'>
							#{selectedRun.id.slice(0, 4)}
						</span>
						<span>{isActive ? 'Active Capture' : 'Completed Run'}</span>
					</h2>
					{isActive && <span className='badge-info'>Active Run</span>}
				</div>
				<div className='flex items-center text-xs text-slate-400 font-mono gap-4'>
					<span className='flex items-center gap-1.5'>
						<Icon name='schedule' size={16} />
						Started {getTimeAgo(selectedRun.started_at)}
					</span>
					<span className='flex items-center gap-1.5'>
						<Icon name='timer' size={16} />
						Duration:{' '}
						{formatDuration(selectedRun.started_at, selectedRun.ended_at)}
					</span>
				</div>
			</div>

			{/* Stats Cards */}
			<div className='grid grid-cols-4 gap-4'>
				{/* Total Calls */}
				<div className='stat-card group hover:border-primary/50'>
					<div className='absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity'></div>
					<div className='relative'>
						<div className='flex justify-between items-start mb-2'>
							<p className='text-[10px] text-slate-400 uppercase font-bold tracking-wider'>
								Total Calls
							</p>
							<Icon
								name='list_alt'
								size={16}
								className='text-primary opacity-70'
							/>
						</div>
						<div className='flex items-baseline gap-2'>
							<span className='text-2xl font-mono font-bold text-white'>
								{(stats?.total_calls || 0).toLocaleString()}
							</span>
							{isActive && (
								<span className='text-[10px] text-emerald-400 font-medium'>
									+12/m
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Failed Calls */}
				<div className='stat-card group hover:border-error/50'>
					<div className='absolute inset-0 bg-gradient-to-br from-error/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity'></div>
					<div className='relative'>
						<div className='flex justify-between items-start mb-2'>
							<p className='text-[10px] text-slate-400 uppercase font-bold tracking-wider'>
								Failed Calls
							</p>
							<Icon
								name='error_outline'
								size={16}
								className='text-error opacity-70'
							/>
						</div>
						<div className='flex items-baseline gap-2'>
							<span className='text-2xl font-mono font-bold text-slate-200'>
								{stats?.failed_calls || 0}
							</span>
							<span className='text-[10px] text-error font-medium'>
								{errorRate}%
							</span>
						</div>
					</div>
				</div>

				{/* Max Latency */}
				<div className='stat-card group hover:border-warning/50'>
					<div className='absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity'></div>
					<div className='relative'>
						<div className='flex justify-between items-start mb-2'>
							<p className='text-[10px] text-slate-400 uppercase font-bold tracking-wider'>
								Max Latency
							</p>
							<Icon
								name='timer_off'
								size={16}
								className='text-warning opacity-70'
							/>
						</div>
						<div className='flex items-baseline gap-2'>
							<span className='text-2xl font-mono font-bold text-slate-200'>
								{formatLatency(stats?.max_latency || null)}
							</span>
							{stats?.top_tools?.[0] && (
								<span className='text-[10px] text-slate-500 font-medium'>
									{stats.top_tools[0].tool_name}
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Avg Latency */}
				<div className='stat-card group hover:border-secondary/50'>
					<div className='absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity'></div>
					<div className='relative'>
						<div className='flex justify-between items-start mb-2'>
							<p className='text-[10px] text-slate-400 uppercase font-bold tracking-wider'>
								Avg Latency
							</p>
							<Icon
								name='speed'
								size={16}
								className='text-secondary opacity-70'
							/>
						</div>
						<div className='flex items-baseline gap-2'>
							<span className='text-2xl font-mono font-bold text-slate-200'>
								{formatLatency(stats?.avg_latency || null)}
							</span>
							<span className='text-[10px] text-emerald-400 font-medium'>
								-5ms
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
