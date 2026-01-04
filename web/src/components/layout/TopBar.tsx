/**
 * TopBar component - header with server selector and capture status
 */

import {useDashboard} from '../../context/DashboardContext';
import {useRuns, useStopRun} from '../../hooks/useRuns';
import {useServers} from '../../hooks/useServers';
import {Icon} from '../common/Icon';

export function TopBar() {
	const {state, setSelectedServer} = useDashboard();
	const {runs} = useRuns();
	const {servers} = useServers();
	const stopRunMutation = useStopRun();

	const activeRun = runs.find((r) => r.status === 'active');

	const handleStopRun = () => {
		if (!activeRun) return;
		stopRunMutation.mutate(activeRun.id, {
			onError: (error) => {
				alert(
					'Failed to stop run: ' +
						(error instanceof Error ? error.message : 'Unknown error')
				);
			}
		});
	};

	return (
		<header className='h-16 border-b border-border-color/50 bg-background-dark/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-30 sticky top-0'>
			<div className='flex items-center gap-5'>
				{/* Brand */}
				<div className='flex items-center gap-3'>
					<div className='size-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20'>
						<Icon name='visibility' size={20} className='text-white' />
					</div>
					<h1 className='text-white text-xl font-bold tracking-tight gradient-text'>
						Argus
					</h1>
				</div>

				<div className='h-8 w-px bg-border-color/50 mx-2'></div>

				{/* Server Selector */}
				<div className='flex items-center gap-3'>
					<span className='text-[10px] text-slate-400 uppercase font-bold tracking-widest'>
						MCP Server
					</span>
					<div className='relative group'>
						<select
							value={state.selectedServer || ''}
							onChange={(e) => setSelectedServer(e.target.value || null)}
							className='appearance-none bg-surface/50 border border-border-color hover:border-primary/50 text-slate-200 text-sm rounded-lg h-9 pl-3 pr-10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer font-mono shadow-sm min-w-[180px]'>
							<option value=''>All Servers</option>
							{servers.map((server) => (
								<option key={server.name} value={server.name}>
									{server.name}
								</option>
							))}
						</select>
						<div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 group-hover:text-primary transition-colors'>
							<Icon name='expand_more' size={18} />
						</div>
					</div>
				</div>

				{/* Status Indicator */}
				{activeRun && (
					<div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] ml-2'>
						<span className='relative flex h-2 w-2'>
							<span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
							<span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500'></span>
						</span>
						<span className='text-xs font-semibold text-emerald-400 tracking-wide'>
							Capturing MCP traffic
						</span>
					</div>
				)}
			</div>

			<div className='flex items-center gap-3'>
				{activeRun && (
					<button
						onClick={handleStopRun}
						disabled={stopRunMutation.isPending}
						className='flex items-center gap-2 h-9 px-4 rounded-lg bg-error/10 hover:bg-error/20 border border-error/20 text-error hover:text-red-400 transition-all shadow-sm group disabled:opacity-50'>
						<Icon
							name='stop_circle'
							size={18}
							className='group-hover:scale-110 transition-transform'
						/>
						<span className='text-sm font-medium'>
							{stopRunMutation.isPending ? 'Stopping...' : 'Stop Capture'}
						</span>
					</button>
				)}
				<button className='size-9 flex items-center justify-center rounded-lg bg-surface hover:bg-slate-700/50 border border-border-color hover:border-slate-500 text-slate-400 hover:text-white transition-all shadow-sm'>
					<Icon name='settings' size={20} />
				</button>
				<div className='size-9 rounded-full p-0.5 bg-gradient-to-tr from-primary to-secondary shadow-lg shadow-purple-500/20 cursor-pointer hover:scale-105 transition-transform'>
					<div className='size-full rounded-full bg-background-dark flex items-center justify-center text-xs font-bold text-white'>
						JS
					</div>
				</div>
			</div>
		</header>
	);
}
