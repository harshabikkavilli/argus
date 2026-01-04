/**
 * DashboardLayout - Main layout component
 */

import {useEffect, useRef, useState} from 'react';
import {useDashboard} from '../../context/DashboardContext';
import {useCalls} from '../../hooks/useCalls';
import {useRuns} from '../../hooks/useRuns';
import {useSSE} from '../../hooks/useSSE';
import type {ToolCallRecord} from '../../types/api';
import {CallTimeline} from '../calls/CallTimeline';
import {InspectorPanel} from '../calls/InspectorPanel';
import {LoadingScreen} from '../common/LoadingScreen';
import {Sidebar} from './Sidebar';
import {TopBar} from './TopBar';

export function DashboardLayout() {
	const {state, setSelectedCallId, setDrawerOpen} = useDashboard();
	const [selectedCall, setSelectedCall] = useState<ToolCallRecord | null>(null);
	const [isInitializing, setIsInitializing] = useState(true);
	const prevRunIdRef = useRef<string | null>(state.selectedRunId);

	const {isLoading: runsLoading} = useRuns();
	const {calls} = useCalls({
		limit: 100,
		run_id: state.selectedRunId || undefined
	});

	// SSE integration - invalidates queries automatically on events
	useSSE();

	// Hide loading screen after initial data load
	useEffect(() => {
		if (!runsLoading) {
			// Add a small delay for smoother transition
			const timer = setTimeout(() => setIsInitializing(false), 800);
			return () => clearTimeout(timer);
		}
	}, [runsLoading]);

	// Clear selected call when run changes
	useEffect(() => {
		if (prevRunIdRef.current !== state.selectedRunId) {
			setSelectedCallId(null);
			setSelectedCall(null);
			prevRunIdRef.current = state.selectedRunId;
		}
	}, [state.selectedRunId, setSelectedCallId]);

	// Update selected call when it changes in the calls list
	useEffect(() => {
		if (state.selectedCallId && calls.length > 0) {
			const call = calls.find((c) => c.id === state.selectedCallId);
			if (call) {
				setSelectedCall(call);
			} else {
				setSelectedCall(null);
			}
		} else if (!state.selectedCallId) {
			setSelectedCall(null);
		}
	}, [state.selectedCallId, calls]);

	const handleCallSelect = (call: ToolCallRecord) => {
		setSelectedCallId(call.id);
		setSelectedCall(call);
	};

	const handleCloseInspector = () => {
		setSelectedCallId(null);
		setSelectedCall(null);
		setDrawerOpen(false);
	};

	// Show loading screen during initialization
	if (isInitializing) {
		return <LoadingScreen />;
	}

	return (
		<div className='h-screen flex flex-col selection:bg-primary/30 bg-[#0a0e14]'>
			<TopBar />
			<div className='flex flex-1 overflow-hidden'>
				<Sidebar />
				<CallTimeline onCallSelect={handleCallSelect} />
			</div>

			{/* Drawer overlay */}
			{selectedCall && state.isDrawerOpen && (
				<InspectorPanel call={selectedCall} onClose={handleCloseInspector} />
			)}
		</div>
	);
}
