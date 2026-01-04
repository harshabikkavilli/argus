import { useDashboard } from '../../context/DashboardContext';

export function RunFilters() {
	const { state, setShowErrorsOnly, setShowSlowCallsOnly } = useDashboard();

	return (
		<div className="space-y-3">
			<label className="flex items-center gap-2 cursor-pointer">
				<input
					type="checkbox"
					checked={state.showErrorsOnly}
					onChange={(e) => setShowErrorsOnly(e.target.checked)}
					className="w-4 h-4 rounded border-border bg-bg-secondary text-accent focus:ring-accent"
				/>
				<span className="text-sm text-text-primary">Show Errors Only</span>
			</label>
			<label className="flex items-center gap-2 cursor-pointer">
				<input
					type="checkbox"
					checked={state.showSlowCallsOnly}
					onChange={(e) => setShowSlowCallsOnly(e.target.checked)}
					className="w-4 h-4 rounded border-border bg-bg-secondary text-accent focus:ring-accent"
				/>
				<span className="text-sm text-text-primary">Slow Calls (&gt;1s)</span>
			</label>
		</div>
	);
}

