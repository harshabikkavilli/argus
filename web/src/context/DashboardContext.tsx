import {createContext, useContext, useState, type ReactNode} from 'react';

interface DashboardState {
	activeTab: 'calls' | 'runs';
	selectedServer: string | null; // null means "All Servers"
	selectedRunId: string | null;
	selectedCallId: string | null;
	showErrorsOnly: boolean;
	showSlowCalls: boolean;
	isDrawerOpen: boolean;
}

interface DashboardContextValue {
	state: DashboardState;
	setActiveTab: (tab: 'calls' | 'runs') => void;
	setSelectedServer: (server: string | null) => void;
	setSelectedRunId: (id: string | null) => void;
	setSelectedCallId: (id: string | null) => void;
	setShowErrorsOnly: (value: boolean) => void;
	setShowSlowCalls: (value: boolean) => void;
	setDrawerOpen: (open: boolean) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({children}: {children: ReactNode}) {
	const [state, setState] = useState<DashboardState>({
		activeTab: 'calls',
		selectedServer: null,
		selectedRunId: null,
		selectedCallId: null,
		showErrorsOnly: false,
		showSlowCalls: false,
		isDrawerOpen: false
	});

	const setActiveTab = (tab: 'calls' | 'runs') => {
		setState((prev) => ({...prev, activeTab: tab}));
	};

	const setSelectedServer = (server: string | null) => {
		setState((prev) => ({
			...prev,
			selectedServer: server,
			// Reset run selection when server changes
			selectedRunId: null,
			selectedCallId: null,
			isDrawerOpen: false
		}));
	};

	const setSelectedRunId = (id: string | null) => {
		setState((prev) => ({
			...prev,
			selectedRunId: id,
			// Reset call selection when run changes
			selectedCallId: null,
			isDrawerOpen: false
		}));
	};

	const setSelectedCallId = (id: string | null) => {
		setState((prev) => ({
			...prev,
			selectedCallId: id,
			isDrawerOpen: id !== null
		}));
	};

	const setShowErrorsOnly = (value: boolean) => {
		setState((prev) => ({...prev, showErrorsOnly: value}));
	};

	const setShowSlowCalls = (value: boolean) => {
		setState((prev) => ({...prev, showSlowCalls: value}));
	};

	const setDrawerOpen = (open: boolean) => {
		setState((prev) => ({
			...prev,
			isDrawerOpen: open,
			selectedCallId: open ? prev.selectedCallId : null
		}));
	};

	return (
		<DashboardContext.Provider
			value={{
				state,
				setActiveTab,
				setSelectedServer,
				setSelectedRunId,
				setSelectedCallId,
				setShowErrorsOnly,
				setShowSlowCalls,
				setDrawerOpen
			}}>
			{children}
		</DashboardContext.Provider>
	);
}

export function useDashboard() {
	const context = useContext(DashboardContext);
	if (!context) {
		throw new Error('useDashboard must be used within a DashboardProvider');
	}
	return context;
}
