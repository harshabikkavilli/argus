import { DashboardProvider } from './context/DashboardContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

export function App() {
	return (
		<DashboardProvider>
			<DashboardLayout />
		</DashboardProvider>
	);
}

