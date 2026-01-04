import { useState } from 'react';
import { ToolCallRecord, ReplayResponse, DiffChange } from '../../types/api';
import { Tabs } from '../common/Tabs';
import { Badge } from '../common/Badge';
import * as api from '../../api/client';

interface CallDetailPanelProps {
	call: ToolCallRecord;
	onReplayComplete?: () => void;
}

function formatTime(timestamp: number): string {
	return new Date(timestamp).toLocaleTimeString();
}

function formatLatency(ms: number): string {
	if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
	return `${ms}ms`;
}

function formatDateTime(timestamp: number): string {
	return new Date(timestamp).toLocaleString();
}

function JSONView({ data, title }: { data: unknown; title?: string }) {
	const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
	return (
		<div>
			{title && <h3 className="text-xs uppercase tracking-wide text-text-secondary mb-3">{title}</h3>}
			<pre className="bg-bg-primary border border-border rounded-lg p-4 overflow-x-auto text-sm font-mono">
				{jsonStr}
			</pre>
		</div>
	);
}

function DiffView({ diff }: { diff: DiffChange[] }) {
	return (
		<div className="space-y-2">
			{diff.map((change, index) => (
				<div
					key={index}
					className={`
						p-2 rounded text-xs font-mono
						${
							change.type === 'added'
								? 'bg-success/20 text-success'
								: change.type === 'removed'
									? 'bg-error/20 text-error'
									: 'bg-warning/20 text-warning'
						}
					`}
				>
					<div className="font-semibold">{change.path}</div>
					{change.oldValue !== undefined && (
						<div className="text-text-secondary">Old: {JSON.stringify(change.oldValue)}</div>
					)}
					{change.newValue !== undefined && (
						<div>New: {JSON.stringify(change.newValue)}</div>
					)}
				</div>
			))}
		</div>
	);
}

export function CallDetailPanel({ call, onReplayComplete }: CallDetailPanelProps) {
	const [activeTab, setActiveTab] = useState('summary');
	const [replayData, setReplayData] = useState<ReplayResponse | null>(null);
	const [replaying, setReplaying] = useState(false);

	const params = JSON.parse(call.params || '{}');
	const result = call.result ? JSON.parse(call.result) : null;
	const error = call.error;

	const handleReplay = async () => {
		setReplaying(true);
		try {
			const data = await api.replayCall(call.id);
			setReplayData(data);
			setActiveTab('replay');
			if (onReplayComplete) {
				onReplayComplete();
			}
		} catch (error) {
			alert('Failed to replay call: ' + (error instanceof Error ? error.message : 'Unknown error'));
		} finally {
			setReplaying(false);
		}
	};

	const tabs = [
		{ id: 'summary', label: 'Summary' },
		{ id: 'params', label: 'Params' },
		{ id: 'result', label: 'Result' }
	];

	if (call.replayed_from || replayData) {
		tabs.push({ id: 'replay', label: 'Replay' });
	}

	const avgLatency = call.tool_schema ? 0 : 0; // Would need stats context to calculate
	const isSlow = call.latency_ms > 1000;

	return (
		<div className="flex flex-col h-full border-l border-border bg-bg-secondary">
			<div className="p-4 border-b border-border">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<span className={`w-2 h-2 rounded-full ${error ? 'bg-error' : 'bg-success'}`}></span>
						<h2 className="text-lg font-semibold">{call.tool_name}</h2>
						{call.replayed_from && <Badge variant="replay">replay</Badge>}
					</div>
					<div className="text-sm text-text-secondary">{formatTime(call.timestamp)}</div>
				</div>
				<div className="text-sm text-text-secondary">Latency: {formatLatency(call.latency_ms)}</div>
				{isSlow && (
					<div className="mt-2 p-3 bg-warning/20 border border-warning/50 rounded-lg text-sm text-warning">
						High Latency Detected. This call took {formatLatency(call.latency_ms)}, which is slower
						than average.
					</div>
				)}
			</div>

			<Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

			<div className="flex-1 overflow-y-auto p-4">
				{activeTab === 'summary' && (
					<div className="space-y-4">
						<div>
							<h3 className="text-xs uppercase tracking-wide text-text-secondary mb-2">
								Metadata
							</h3>
							<div className="bg-bg-primary border border-border rounded-lg p-4 text-sm font-mono space-y-1">
								<div>Server: {call.mcp_server}</div>
								<div>Run ID: {call.run_id || 'N/A'}</div>
								<div>Timestamp: {formatDateTime(call.timestamp)}</div>
								{call.replayed_from && <div>Replayed from: {call.replayed_from}</div>}
							</div>
						</div>
						{error && (
							<div>
								<h3 className="text-xs uppercase tracking-wide text-text-secondary mb-2">Error</h3>
								<div className="bg-error/20 border border-error/50 rounded-lg p-4 text-error font-mono text-sm">
									{error}
								</div>
							</div>
						)}
						{call.tool_schema && (
							<div>
								<h3 className="text-xs uppercase tracking-wide text-text-secondary mb-2">
									Schema
								</h3>
								<div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-sm">
									<h4 className="text-xs uppercase text-accent mb-2">Expected Parameters</h4>
									{call.tool_schema.required && call.tool_schema.required.length > 0 && (
										<div className="mb-2">
											Required:{' '}
											{call.tool_schema.required.map((req) => (
												<span key={req} className="text-error">
													{req}*
												</span>
											))}
										</div>
									)}
									{call.tool_schema.properties &&
										Object.entries(call.tool_schema.properties).map(([key, value]) => (
											<div key={key}>
												{key} <span className="text-text-secondary">({value.type || 'any'})</span>
											</div>
										))}
								</div>
							</div>
						)}
					</div>
				)}

				{activeTab === 'params' && <JSONView data={params} title="Input Parameters" />}

				{activeTab === 'result' && (
					<div>
						{error ? (
							<div className="bg-error/20 border border-error/50 rounded-lg p-4 text-error font-mono text-sm">
								{error}
							</div>
						) : result ? (
							<JSONView data={result} title="Result" />
						) : (
							<div className="text-text-secondary">No result</div>
						)}
					</div>
				)}

				{activeTab === 'replay' && replayData && (
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="bg-bg-primary border border-border rounded-lg p-4 text-center">
								<div className="text-2xl font-bold">{formatLatency(replayData.original_latency)}</div>
								<div className="text-xs uppercase text-text-secondary">Original</div>
							</div>
							<div className="bg-bg-primary border border-border rounded-lg p-4 text-center">
								<div className="text-2xl font-bold">{formatLatency(replayData.replay_latency)}</div>
								<div className="text-xs uppercase text-text-secondary">Replay</div>
								<div
									className={`text-sm mt-1 ${
										replayData.replay_latency > replayData.original_latency
											? 'text-error'
											: 'text-success'
									}`}
								>
									{replayData.replay_latency > replayData.original_latency ? 'Slower' : 'Faster'}
								</div>
							</div>
						</div>
						<div>
							<Badge variant={replayData.result_changed ? 'warning' : 'success'}>
								{replayData.result_changed ? 'Changed' : 'Unchanged'}
							</Badge>
						</div>
						{replayData.diff && replayData.diff.length > 0 && (
							<div>
								<h3 className="text-xs uppercase tracking-wide text-text-secondary mb-2">Differences</h3>
								<DiffView diff={replayData.diff} />
							</div>
						)}
						{replayData.result && (
							<div>
								<h3 className="text-xs uppercase tracking-wide text-text-secondary mb-2">
									Replay Result
								</h3>
								<JSONView data={replayData.result} />
							</div>
						)}
					</div>
				)}
			</div>

			<div className="p-4 border-t border-border">
				<button
					onClick={handleReplay}
					disabled={replaying}
					className="w-full px-4 py-2 bg-accent border border-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{replaying ? 'Replaying...' : '▶ Replay Tool Call'}
				</button>
				<div className="text-xs text-text-secondary mt-2 text-center">
					Replaying will execute against the current live agent connection.
				</div>
			</div>
		</div>
	);
}

