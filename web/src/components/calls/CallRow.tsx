import { ToolCallRecord } from '../../types/api';

interface CallRowProps {
	call: ToolCallRecord;
	index: number;
	onClick: () => void;
}

function formatTime(timestamp: number): string {
	return new Date(timestamp).toLocaleTimeString();
}

function formatLatency(ms: number): string {
	if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
	return `${ms}ms`;
}

function truncateParams(params: string, maxLength = 50): string {
	try {
		const parsed = JSON.parse(params);
		const str = JSON.stringify(parsed);
		if (str.length <= maxLength) return str;
		return str.slice(0, maxLength) + '...';
	} catch {
		return params.slice(0, maxLength) + (params.length > maxLength ? '...' : '');
	}
}

export function CallRow({ call, index, onClick }: CallRowProps) {
	return (
		<div
			onClick={onClick}
			className={`
				grid grid-cols-[60px_1fr_100px_80px_80px] gap-4 px-5 py-3.5 border-b border-border cursor-pointer
				hover:bg-bg-tertiary transition-colors
				${call.replayed_from ? 'bg-purple/10' : ''}
			`}
		>
			<div className="text-text-secondary text-xs font-mono">{String(index + 1).padStart(2, '0')}</div>
			<div>
				<div className="font-semibold text-accent">{call.tool_name}</div>
				<div className="text-xs text-text-secondary font-mono truncate">
					{truncateParams(call.params)}
				</div>
			</div>
			<div className="text-xs text-text-secondary font-mono">{formatTime(call.timestamp)}</div>
			<div className="text-sm">{formatLatency(call.latency_ms)}</div>
			<div className="flex items-center gap-2">
				<span className={`w-2 h-2 rounded-full ${call.error ? 'bg-error' : 'bg-success'}`}></span>
				<span className="text-xs">{call.error ? 'Error' : 'OK'}</span>
			</div>
		</div>
	);
}

