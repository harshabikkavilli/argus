import { RunRecord } from '../../types/api';
import { Badge } from '../common/Badge';

interface RunCardProps {
	run: RunRecord;
	isActive: boolean;
	onClick: () => void;
}

export function RunCard({ run, isActive, onClick }: RunCardProps) {
	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp);
		const now = Date.now();
		const diff = now - timestamp;
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(minutes / 60);
		if (hours > 0) return `${hours}h ago`;
		if (minutes > 0) return `${minutes}m ago`;
		return 'Just now';
	};

	const statusVariant =
		run.status === 'active'
			? 'active'
			: run.status === 'completed'
				? 'success'
				: run.error_count > 0
					? 'error'
					: 'completed';

	return (
		<div
			onClick={onClick}
			className={`
				bg-bg-secondary border rounded-lg p-4 cursor-pointer transition-all
				${isActive ? 'border-success' : 'border-border hover:border-accent'}
			`}
		>
			<div className="flex justify-between items-center mb-2">
				<span className="text-sm font-mono text-accent">#{run.id.slice(0, 8)}</span>
				<Badge variant={statusVariant}>
					{run.status === 'active' ? 'Active' : run.status === 'completed' ? 'Success' : 'Stopped'}
				</Badge>
			</div>
			<div className="flex gap-4 text-xs text-text-secondary">
				<span>{run.tool_count} calls</span>
				{run.error_count > 0 && <span className="text-error">{run.error_count} errors</span>}
				<span>{formatTime(run.started_at)}</span>
			</div>
			{run.status === 'active' && (
				<div className="mt-2 h-1 bg-bg-tertiary rounded-full overflow-hidden">
					<div className="h-full bg-success w-1/3 animate-pulse"></div>
				</div>
			)}
		</div>
	);
}

