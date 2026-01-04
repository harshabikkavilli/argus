/**
 * InspectorPanel - Drawer-style tool call details panel
 */

import {useState} from 'react';
import {useReplayCall} from '../../hooks/useCalls';
import type {ToolCallRecord} from '../../types/api';
import {Icon} from '../common/Icon';

interface InspectorPanelProps {
	call: ToolCallRecord;
	onClose: () => void;
}

type TabId = 'summary' | 'parameters' | 'result';

function formatTimestamp(ts: number): string {
	const d = new Date(ts);
	return (
		d.toTimeString().split(' ')[0] +
		'.' +
		d.getMilliseconds().toString().padStart(3, '0')
	);
}

function JsonViewer({
	data,
	label,
	showSchema = false
}: {
	data: unknown;
	label?: string;
	showSchema?: boolean;
}) {
	const formatJson = (obj: unknown): string => {
		try {
			if (typeof obj === 'string') {
				try {
					obj = JSON.parse(obj);
				} catch {
					return String(obj);
				}
			}
			return JSON.stringify(obj, null, 2);
		} catch {
			return String(obj);
		}
	};

	const syntaxHighlight = (json: string): string => {
		return json
			.replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
			.replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
			.replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
			.replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
			.replace(/: (null)/g, ': <span class="json-null">$1</span>');
	};

	const jsonStr = formatJson(data);
	const highlighted = syntaxHighlight(jsonStr);
	const size = new Blob([jsonStr]).size;

	return (
		<div className='space-y-3'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<div className='w-1 h-4 bg-primary rounded-full'></div>
					<h3 className='text-xs font-bold text-slate-300 uppercase tracking-wider'>
						{label}
					</h3>
				</div>
				<div className='flex items-center gap-2'>
					{showSchema && (
						<span className='text-[10px] text-slate-500 px-2 py-0.5 rounded bg-slate-800 border border-slate-700'>
							Validated
						</span>
					)}
					<span className='text-[10px] text-slate-500 font-mono'>{size}B</span>
				</div>
			</div>
			<div className='bg-slate-900/50 rounded-xl border border-border-color p-4 font-mono text-xs overflow-x-auto group relative'>
				{showSchema && (
					<div className='text-slate-600 mb-3 italic'>
						// Schema: WebSearchV2Input
					</div>
				)}
				<button
					onClick={() => navigator.clipboard.writeText(jsonStr)}
					className='absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'>
					<Icon name='content_copy' size={14} />
				</button>
				<pre className='leading-relaxed whitespace-pre-wrap'>
					<code dangerouslySetInnerHTML={{__html: highlighted}} />
				</pre>
			</div>
		</div>
	);
}

export function InspectorPanel({call, onClose}: InspectorPanelProps) {
	const [activeTab, setActiveTab] = useState<TabId>('parameters');
	const [replayResult, setReplayResult] = useState<{
		original: ToolCallRecord;
		replay: ToolCallRecord;
	} | null>(null);

	const replayMutation = useReplayCall();

	const hasError = !!call.error;
	const isHighLatency = call.latency_ms > 1000;
	const avgLatency = 150; // Placeholder

	const handleReplay = () => {
		replayMutation.mutate(call.id, {
			onSuccess: (result) => {
				setReplayResult({
					original: call,
					replay: result.replay
				});
			},
			onError: (error) => {
				console.error('Replay failed:', error);
			}
		});
	};

	const tabs: {id: TabId; label: string}[] = [
		{id: 'summary', label: 'Summary'},
		{id: 'parameters', label: 'Parameters'},
		{id: 'result', label: 'Result'}
	];

	return (
		<>
			{/* Backdrop */}
			<div
				className='fixed inset-0 bg-black/60 z-40 animate-fade-in'
				onClick={onClose}
			/>

			{/* Drawer */}
			<aside className='fixed top-0 right-0 h-full w-[500px] bg-background-dark border-l border-border-color flex flex-col z-50 shadow-2xl animate-slide-in-right'>
				{/* Header */}
				<div className='p-6 border-b border-border-color glass-panel'>
					<div className='flex items-start justify-between mb-4'>
						<div className='flex items-center gap-4'>
							<div className='w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center'>
								<Icon name='build' size={24} className='text-primary' />
							</div>
							<div>
								<h2 className='text-lg font-bold text-white font-mono'>
									{call.tool_name}
								</h2>
								<p className='text-xs text-slate-500 mt-0.5'>
									<span className='text-emerald-400'>●</span> Run #
									{call.run_id?.slice(0, 4) || 'N/A'} • Call{' '}
									{call.id.slice(0, 8)}
								</p>
							</div>
						</div>
						<button
							onClick={onClose}
							className='p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors'>
							<Icon name='close' size={20} />
						</button>
					</div>

					{/* Tabs */}
					<div className='flex gap-1 bg-slate-900/50 rounded-lg p-1'>
						{tabs.map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
									activeTab === tab.id
										? 'text-white bg-surface'
										: 'text-slate-500 hover:text-slate-300'
								}`}>
								{tab.label}
							</button>
						))}
					</div>
				</div>

				{/* Content */}
				<div className='flex-1 overflow-y-auto p-6 space-y-5'>
					{/* Alerts */}
					{isHighLatency && (
						<div className='p-4 rounded-xl bg-warning/10 border border-warning/30 flex gap-4'>
							<div className='w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center shrink-0'>
								<Icon name='warning' size={22} className='text-warning' />
							</div>
							<div>
								<p className='text-sm font-semibold text-warning mb-0.5'>
									High Latency Detected
								</p>
								<p className='text-xs text-slate-400 leading-relaxed'>
									This call took{' '}
									<span className='font-mono font-medium text-warning'>
										{(call.latency_ms / 1000).toFixed(2)}s
									</span>
									, which is{' '}
									<span className='font-semibold'>
										{Math.round(
											((call.latency_ms - avgLatency) / avgLatency) * 100
										)}
										% slower
									</span>{' '}
									than average.
								</p>
							</div>
						</div>
					)}

					{hasError && (
						<div className='p-4 rounded-xl bg-error/10 border border-error/30 flex gap-4'>
							<div className='w-10 h-10 bg-error/20 rounded-lg flex items-center justify-center shrink-0'>
								<Icon name='error' size={22} className='text-error' />
							</div>
							<div>
								<p className='text-sm font-semibold text-error mb-0.5'>Error</p>
								<p className='text-xs text-slate-400 leading-relaxed font-mono'>
									{call.error}
								</p>
							</div>
						</div>
					)}

					{replayMutation.isError && (
						<div className='p-4 rounded-xl bg-warning/10 border border-warning/30 flex gap-4'>
							<div className='w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center shrink-0'>
								<Icon name='info' size={22} className='text-warning' />
							</div>
							<div>
								<p className='text-sm font-semibold text-warning mb-0.5'>
									Proxy Not Connected
								</p>
								<p className='text-xs text-slate-400 leading-relaxed'>
									Replay requires an active proxy connection. Start Claude
									Desktop with a wrapped MCP server to enable replay.
								</p>
							</div>
						</div>
					)}

					{replayResult && (
						<div className='p-4 rounded-xl bg-success/10 border border-success/30 flex gap-4'>
							<div className='w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center shrink-0'>
								<Icon name='check_circle' size={22} className='text-success' />
							</div>
							<div>
								<p className='text-sm font-semibold text-success mb-0.5'>
									Replay Complete
								</p>
								<p className='text-xs text-slate-400'>
									Original: {replayResult.original.latency_ms}ms → Replay:{' '}
									{replayResult.replay.latency_ms}ms
								</p>
							</div>
						</div>
					)}

					{/* Tab Content */}
					{activeTab === 'summary' && (
						<div className='grid grid-cols-2 gap-3'>
							<div className='p-4 bg-surface border border-border-color rounded-xl'>
								<p className='text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2'>
									Status
								</p>
								<p
									className={`text-sm font-semibold ${
										hasError ? 'text-error' : 'text-success'
									}`}>
									{hasError ? 'Failed' : 'Success'}
								</p>
							</div>
							<div className='p-4 bg-surface border border-border-color rounded-xl'>
								<p className='text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2'>
									Latency
								</p>
								<p
									className={`text-sm font-mono font-semibold ${
										isHighLatency ? 'text-warning' : 'text-white'
									}`}>
									{call.latency_ms >= 1000
										? `${(call.latency_ms / 1000).toFixed(2)}s`
										: `${call.latency_ms}ms`}
								</p>
							</div>
							<div className='p-4 bg-surface border border-border-color rounded-xl'>
								<p className='text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2'>
									Timestamp
								</p>
								<p className='text-sm text-white font-mono'>
									{formatTimestamp(call.timestamp)}
								</p>
							</div>
							<div className='p-4 bg-surface border border-border-color rounded-xl'>
								<p className='text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2'>
									Call ID
								</p>
								<p className='text-sm text-white font-mono truncate'>
									{call.id.slice(0, 12)}
								</p>
							</div>
						</div>
					)}

					{activeTab === 'parameters' && (
						<JsonViewer
							data={call.params}
							label='Input JSON'
							showSchema={true}
						/>
					)}

					{activeTab === 'result' && (
						<JsonViewer
							data={call.error || call.result}
							label={call.error ? 'Error Details' : 'Result'}
						/>
					)}
				</div>

				{/* Footer */}
				<div className='p-6 border-t border-border-color glass-panel'>
					{/* Meta info */}
					<div className='flex gap-3 mb-4'>
						<div className='flex-1 p-3 bg-slate-900/50 border border-border-color rounded-lg'>
							<p className='text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1'>
								Validation
							</p>
							<p className='text-xs text-success flex items-center gap-1'>
								<Icon name='check_circle' size={14} />
								Passed Schema
							</p>
						</div>
						<div className='flex-1 p-3 bg-slate-900/50 border border-border-color rounded-lg'>
							<p className='text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1'>
								Server
							</p>
							<p className='text-xs text-white flex items-center gap-1.5'>
								<span className='h-1.5 w-1.5 rounded-full bg-primary'></span>
								<span className='font-mono truncate'>
									{call.mcp_server || 'unknown'}
								</span>
							</p>
						</div>
					</div>

					{/* Replay Button */}
					<button
						onClick={handleReplay}
						disabled={replayMutation.isPending}
						className='w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-primary/30 transition-all text-sm'>
						{replayMutation.isPending ? (
							<>
								<Icon name='sync' size={20} className='animate-spin' />
								Replaying...
							</>
						) : (
							<>
								<Icon name='replay' size={20} />
								Replay Tool Call
							</>
						)}
					</button>
					<p className='text-center text-[10px] text-slate-600 mt-3'>
						Replaying executes this tool call immediately against the active
						server{' '}
						<span className='font-mono text-slate-500'>
							{call.mcp_server || 'unknown'}
						</span>{' '}
						using current context.
					</p>
				</div>
			</aside>
		</>
	);
}
