/**
 * Sidebar component - runs list and tools
 */

import {useDashboard} from '../../context/DashboardContext';
import {useRuns} from '../../hooks/useRuns';
import {useStats} from '../../hooks/useStats';
import {useTick} from '../../hooks/useTick';
import type {RunRecord} from '../../types/api';
import {Icon} from '../common/Icon';

function getTimeAgo(timestamp: number): string {
	const diff = Date.now() - timestamp;
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);

	if (hours > 0) return `${hours}h`;
	if (minutes > 0) return `${minutes}m ago`;
	if (seconds > 10) return `${seconds}s ago`;
	return 'just now';
}

function RunItem({
	run,
	isSelected,
	onClick
}: {
	run: RunRecord;
	isSelected: boolean;
	onClick: () => void;
}) {
	const isActive = run.status === 'active';
	const hasErrors = run.error_count > 0;
	const isFailed = run.status === 'error';

	// Active run card
	if (isActive) {
		return (
			<div
				onClick={onClick}
				className='group relative flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20 cursor-pointer hover:shadow-md hover:shadow-primary/5 transition-all duration-300'>
				<div className='absolute inset-y-0 left-0 w-0.5 bg-primary rounded-l-lg'></div>
				<Icon
					name='play_circle'
					size={22}
					className='text-primary mt-0.5 animate-pulse-slow'
				/>
				<div className='flex flex-col min-w-0 flex-1'>
					<div className='flex justify-between items-center w-full mb-1'>
						<span className='text-sm font-bold text-white truncate font-mono'>
							#{run.id.slice(0, 4)}
						</span>
						<span className='text-[10px] text-emerald-400 font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20'>
							Running
						</span>
					</div>
					<span className='text-xs text-slate-400 truncate mb-2'>
						{getTimeAgo(run.started_at)} •{' '}
						{hasErrors ? (
							<span className='text-error'>{run.error_count} errors</span>
						) : (
							`${run.tool_count} calls`
						)}
					</span>
					{/* Progress bar */}
					<div className='w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden'>
						<div
							className='bg-gradient-to-r from-primary to-secondary h-full rounded-full'
							style={{width: '65%'}}
						/>
					</div>
				</div>
			</div>
		);
	}

	// Completed/failed run card
	return (
		<div
			onClick={onClick}
			className={`group flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-all duration-200 ${
				isSelected
					? 'bg-white/5 border-white/10'
					: 'border-transparent hover:bg-white/5 hover:border-white/10 opacity-60 hover:opacity-100'
			}`}>
			<Icon
				name={isFailed || hasErrors ? 'cancel' : 'check_circle'}
				size={22}
				className={`mt-0.5 opacity-80 group-hover:opacity-100 ${
					isFailed || hasErrors ? 'text-error' : 'text-emerald-500'
				}`}
			/>
			<div className='flex flex-col min-w-0 flex-1'>
				<div className='flex justify-between items-center w-full mb-0.5'>
					<span className='text-sm font-medium text-slate-300 group-hover:text-white truncate font-mono transition-colors'>
						#{run.id.slice(0, 4)}
					</span>
					<span className='text-[10px] text-slate-500 font-mono'>
						{getTimeAgo(run.started_at)}
					</span>
				</div>
				<span className='text-xs text-slate-500 group-hover:text-slate-400 transition-colors truncate'>
					{isFailed
						? 'Failed'
						: hasErrors
						? `${run.error_count} errors`
						: 'Success'}{' '}
					• {run.tool_count} calls
				</span>
			</div>
		</div>
	);
}

function ToolItem({
	name,
	count,
	color = 'blue'
}: {
	name: string;
	count: number;
	color?: 'blue' | 'purple' | 'pink';
}) {
	const colorClasses = {
		blue: 'bg-blue-400',
		purple: 'bg-purple-400',
		pink: 'bg-pink-400'
	};

	return (
		<div className='flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 cursor-pointer text-xs group transition-colors border border-transparent hover:border-white/5'>
			<div className='flex items-center gap-2'>
				<div
					className={`w-1.5 h-1.5 rounded-full ${colorClasses[color]}`}></div>
				<span className='font-mono text-slate-300 group-hover:text-white transition-colors'>
					{name}
				</span>
			</div>
			<span className='px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-mono'>
				{count}
			</span>
		</div>
	);
}

export function Sidebar() {
	const {state, setSelectedRunId} = useDashboard();
	const {runs} = useRuns();
	const {stats} = useStats(state.selectedRunId || undefined);

	// Force re-render every 30 seconds to update timeAgo
	const tick = useTick(30000);

	// Get top tools from stats
	const topTools = stats?.top_tools?.slice(0, 6) || [];
	const colors: Array<'blue' | 'purple' | 'pink'> = [
		'blue',
		'purple',
		'pink',
		'blue',
		'purple',
		'pink'
	];

	return (
		<aside className='w-72 bg-background-dark/80 border-r border-border-color/50 flex flex-col shrink-0 backdrop-blur-sm z-20'>
			{/* Runs Section */}
			<div className='flex flex-col border-b border-border-color/50 flex-1 min-h-0'>
				<div className='px-5 py-4 flex items-center justify-between'>
					<h3 className='text-xs font-bold text-slate-400 uppercase tracking-widest'>
						Runs
					</h3>
					<button className='text-slate-500 hover:text-primary transition-colors p-1 hover:bg-primary/10 rounded'>
						<Icon name='filter_list' size={18} />
					</button>
				</div>
				<div className='overflow-y-auto flex-1 px-3 pb-3 space-y-2'>
					{runs.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-8 text-center'>
							<Icon name='inbox' size={32} className='text-slate-700 mb-2' />
							<p className='text-xs text-slate-600'>No runs yet</p>
						</div>
					) : (
						runs
							.slice(0, 15)
							.map((run) => (
								<RunItem
									key={`${run.id}-${tick}`}
									run={run}
									isSelected={state.selectedRunId === run.id}
									onClick={() =>
										setSelectedRunId(
											run.id === state.selectedRunId ? null : run.id
										)
									}
								/>
							))
					)}
				</div>
			</div>

			{/* Tools Section */}
			<div className='flex flex-col h-1/3 min-h-[220px] bg-gradient-to-b from-transparent to-black/20 border-t border-border-color/30'>
				<div className='px-5 py-4 flex items-center justify-between'>
					<h3 className='text-xs font-bold text-slate-400 uppercase tracking-widest'>
						Tools
					</h3>
				</div>
				<div className='overflow-y-auto px-3 pb-3 space-y-1'>
					{topTools.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-4 text-center'>
							<p className='text-xs text-slate-600'>No tools called</p>
						</div>
					) : (
						topTools.map((tool, idx) => (
							<ToolItem
								key={tool.tool_name}
								name={tool.tool_name}
								count={tool.count}
								color={colors[idx % colors.length]}
							/>
						))
					)}
				</div>
			</div>
		</aside>
	);
}
