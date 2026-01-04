/**
 * CallTimeline component - displays the list of tool calls
 */

import {useState} from 'react';
import {useDashboard} from '../../context/DashboardContext';
import {useCalls} from '../../hooks/useCalls';
import {useStats} from '../../hooks/useStats';
import type {ToolCallRecord} from '../../types/api';
import {Icon} from '../common/Icon';
import {RunStatsHeader} from '../stats/RunStatsHeader';

function formatParams(params: string | object): string {
	try {
		const obj = typeof params === 'string' ? JSON.parse(params) : params;
		const entries = Object.entries(obj);
		if (entries.length === 0) return '{}';

		return entries
			.slice(0, 3)
			.map(([key, value]) => {
				const strValue =
					typeof value === 'string'
						? `"${value.length > 30 ? value.slice(0, 30) + '...' : value}"`
						: JSON.stringify(value);
				return `${key}: ${strValue}`;
			})
			.join(', ');
	} catch {
		const str = String(params);
		return str.length > 60 ? str.slice(0, 60) + '...' : str;
	}
}

interface CallRowProps {
	call: ToolCallRecord;
	index: number;
	isSelected: boolean;
	onClick: () => void;
}

function CallRow({call, index, isSelected, onClick}: CallRowProps) {
	const hasError = !!call.error;
	const isHighLatency = call.latency_ms > 1000;

	if (isSelected) {
		return (
			<div
				onClick={onClick}
				className='relative flex items-center px-6 py-3 bg-gradient-to-r from-primary/10 to-transparent border-b border-primary/20 cursor-pointer group text-sm shadow-[inset_3px_0_0_0_#814AC8]'>
				<div className='w-14 text-center text-primary font-mono text-xs font-bold'>
					{String(index).padStart(2, '0')}
				</div>
				<div
					className='w-48 font-mono text-white font-semibold truncate pr-4 drop-shadow-sm'
					title={call.tool_name}>
					{call.tool_name}
				</div>
				<div className='w-28'>
					{hasError ? (
						<span className='badge-error shadow-[0_0_10px_rgba(244,63,94,0.2)]'>
							Error
						</span>
					) : (
						<span className='badge-success shadow-[0_0_10px_rgba(16,185,129,0.2)]'>
							Success
						</span>
					)}
				</div>
				<div className='flex-1 font-mono text-slate-300 text-xs truncate pr-6'>
					{formatParams(call.params)}
				</div>
				<div
					className={`w-24 text-right font-mono text-xs font-bold ${
						isHighLatency
							? 'text-warning drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]'
							: 'text-slate-500'
					}`}>
					{call.latency_ms >= 1000
						? `${call.latency_ms.toLocaleString()}ms`
						: `${call.latency_ms}ms`}
				</div>
			</div>
		);
	}

	if (hasError) {
		return (
			<div
				onClick={onClick}
				className='flex items-center px-6 py-3 border-b border-border-color/30 hover:bg-white/5 cursor-pointer group text-sm transition-all bg-error/5 border-l-2 border-l-error/40 pl-[22px]'>
				<div className='w-14 text-center text-slate-600 font-mono text-xs'>
					{String(index).padStart(2, '0')}
				</div>
				<div
					className='w-48 font-mono text-slate-200 truncate pr-4'
					title={call.tool_name}>
					{call.tool_name}
				</div>
				<div className='w-28'>
					<span className='badge-error'>Error</span>
				</div>
				<div className='flex-1 font-mono text-slate-500 text-xs truncate pr-6 group-hover:text-slate-400 transition-colors'>
					{formatParams(call.params)}
				</div>
				<div className='w-24 text-right font-mono text-slate-500 text-xs'>
					{call.latency_ms}ms
				</div>
			</div>
		);
	}

	return (
		<div
			onClick={onClick}
			className='flex items-center px-6 py-3 border-b border-border-color/30 hover:bg-white/5 cursor-pointer group text-sm transition-all'>
			<div className='w-14 text-center text-slate-600 font-mono text-xs'>
				{String(index).padStart(2, '0')}
			</div>
			<div
				className='w-48 font-mono text-slate-300 truncate pr-4'
				title={call.tool_name}>
				{call.tool_name}
			</div>
			<div className='w-28'>
				<span className='badge-success'>Success</span>
			</div>
			<div className='flex-1 font-mono text-slate-500 text-xs truncate pr-6 group-hover:text-slate-400 transition-colors'>
				{formatParams(call.params)}
			</div>
			<div
				className={`w-24 text-right font-mono text-xs ${
					isHighLatency ? 'text-warning font-bold' : 'text-slate-500'
				}`}>
				{call.latency_ms >= 1000
					? `${call.latency_ms.toLocaleString()}ms`
					: `${call.latency_ms}ms`}
			</div>
		</div>
	);
}

export function CallTimeline({
	onCallSelect
}: {
	onCallSelect: (call: ToolCallRecord) => void;
}) {
	const {state} = useDashboard();
	const [searchTerm, setSearchTerm] = useState('');

	const {calls} = useCalls({
		limit: 100,
		run_id: state.selectedRunId || undefined
	});
	const {stats} = useStats(state.selectedRunId || undefined);

	// Filter calls
	let filteredCalls = calls;
	if (state.showErrorsOnly) {
		filteredCalls = filteredCalls.filter((c) => c.error);
	}
	if (state.showSlowCalls) {
		filteredCalls = filteredCalls.filter((c) => c.latency_ms > 1000);
	}
	if (searchTerm) {
		const term = searchTerm.toLowerCase();
		filteredCalls = filteredCalls.filter(
			(c) =>
				c.tool_name.toLowerCase().includes(term) ||
				JSON.stringify(c.params).toLowerCase().includes(term)
		);
	}

	return (
		<main className='flex-1 flex flex-col min-w-0 relative z-10 bg-background-dark/80 backdrop-blur-xl'>
			{/* Run Stats Header */}
			<RunStatsHeader />

			{/* Search & Filter Bar */}
			<div className='flex items-center gap-4 p-4 border-b border-border-color/50 bg-background-dark/80 backdrop-blur-md relative z-20'>
				<div className='relative flex-1 group'>
					<span className='absolute left-3.5 top-2.5 text-slate-500 group-focus-within:text-primary transition-colors'>
						<Icon name='search' size={20} />
					</span>
					<input
						type='text'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder='Filter by tool name or params...'
						className='w-full bg-slate-900/50 border border-border-color rounded-lg text-sm text-white pl-11 pr-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-slate-600 font-mono transition-all hover:bg-slate-800/50'
					/>
				</div>
				<button className='h-10 px-3 flex items-center gap-2 rounded-lg bg-surface hover:bg-slate-700/50 border border-border-color hover:border-slate-500 text-slate-400 hover:text-white transition-all'>
					<Icon name='filter_list' size={20} />
					<span className='text-xs font-medium'>Filters</span>
				</button>
				<div className='flex items-center gap-2 border-l border-border-color/50 pl-4'>
					<button
						className='p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors'
						title='Clear Timeline'>
						<Icon name='block' size={20} />
					</button>
					<button
						className='p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors'
						title='Auto-scroll to bottom'>
						<Icon name='vertical_align_bottom' size={20} />
					</button>
				</div>
			</div>

			{/* Table Header */}
			<div className='flex items-center px-6 py-3 border-b border-border-color/50 bg-slate-900/40 text-xs font-bold text-slate-400 uppercase tracking-wider backdrop-blur-sm'>
				<div className='w-14 text-center'>#</div>
				<div className='w-48'>Tool Name</div>
				<div className='w-28'>Status</div>
				<div className='flex-1'>Parameters Preview</div>
				<div className='w-24 text-right'>Latency</div>
			</div>

			{/* Timeline List */}
			<div className='flex-1 overflow-y-auto'>
				{filteredCalls.length === 0 ? (
					<div className='flex flex-col items-center justify-center h-full text-center py-16'>
						<Icon name='inbox' size={56} className='text-slate-800 mb-4' />
						<p className='text-sm text-slate-500 mb-1'>No tool calls yet</p>
						<p className='text-xs text-slate-600'>
							Calls will appear here when captured
						</p>
					</div>
				) : (
					filteredCalls.map((call, index) => (
						<CallRow
							key={call.id}
							call={call}
							index={filteredCalls.length - index}
							isSelected={state.selectedCallId === call.id}
							onClick={() => onCallSelect(call)}
						/>
					))
				)}
			</div>

			{/* Bottom Status Bar */}
			<div className='h-10 border-t border-border-color/50 bg-slate-900/80 flex items-center px-6 text-[11px] text-slate-500 justify-between shrink-0 font-medium'>
				<div className='flex gap-6'>
					<span className='flex items-center gap-2'>
						<span className='w-1.5 h-1.5 rounded-full bg-slate-600'></span>
						Total Calls:{' '}
						<span className='text-slate-300'>{stats?.total_calls || 0}</span>
					</span>
					<span className='flex items-center gap-2'>
						<span className='w-1.5 h-1.5 rounded-full bg-primary'></span>
						Avg Latency:{' '}
						<span className='text-slate-300'>
							{Math.round(stats?.avg_latency || 0)}ms
						</span>
					</span>
					<span className='flex items-center gap-2'>
						<span className='w-1.5 h-1.5 rounded-full bg-error'></span>
						Error Rate:{' '}
						<span className='text-slate-300'>
							{stats?.total_calls
								? ((stats.failed_calls / stats.total_calls) * 100).toFixed(1)
								: 0}
							%
						</span>
					</span>
				</div>
				<div>
					<span>
						Last updated: <span className='text-slate-300'>just now</span>
					</span>
				</div>
			</div>
		</main>
	);
}
