import { useDashboard } from '../../context/DashboardContext';
import { useRuns } from '../../hooks/useRuns';
import { RunCard } from './RunCard';

export function RunList() {
	const { state, setSelectedRunId, setActiveTab } = useDashboard();
	const { runs } = useRuns();

	const handleRunClick = (runId: string) => {
		setSelectedRunId(runId);
		setActiveTab('calls');
	};

	if (runs.length === 0) {
		return (
			<div className="text-center py-12 text-text-secondary">
				<div className="text-4xl mb-4 opacity-50">📂</div>
				<p>No runs recorded yet.</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			{runs.map((run) => (
				<RunCard
					key={run.id}
					run={run}
					isActive={state.selectedRunId === run.id}
					onClick={() => handleRunClick(run.id)}
				/>
			))}
		</div>
	);
}

