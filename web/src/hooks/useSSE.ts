import {useQueryClient} from '@tanstack/react-query';
import {useEffect, useRef} from 'react';
import {queryKeys} from '../lib/queryClient';

export type SSEEventType = 'call' | 'run' | 'ping' | 'connected';

export interface SSEEventData {
	id?: string;
	tool_name?: string;
	run_id?: string | null;
	action?: 'started' | 'ended' | 'updated';
	time?: number;
}

export function useSSE() {
	const queryClient = useQueryClient();
	const eventSourceRef = useRef<EventSource | null>(null);

	useEffect(() => {
		console.log('[SSE] Connecting to /api/events...');
		const eventSource = new EventSource('/api/events');
		eventSourceRef.current = eventSource;

		eventSource.onopen = () => {
			console.log('[SSE] Connection opened');
		};

		// Handle named events
		eventSource.addEventListener('connected', (event) => {
			console.log('[SSE] Connected:', event.data);
		});

		eventSource.addEventListener('call', (event) => {
			try {
				const data = JSON.parse(event.data) as SSEEventData;
				console.log('[SSE] New call event:', data);

				// Invalidate calls, runs (for tool_count), stats, and servers queries
				queryClient.invalidateQueries({queryKey: ['calls']});
				queryClient.invalidateQueries({queryKey: queryKeys.runs()});
				queryClient.invalidateQueries({queryKey: ['stats']});
				queryClient.invalidateQueries({queryKey: queryKeys.servers()});
			} catch (error) {
				console.error('[SSE] Failed to parse call event:', error);
			}
		});

		eventSource.addEventListener('run', (event) => {
			try {
				const data = JSON.parse(event.data) as SSEEventData;
				console.log('[SSE] Run event:', data);

				// Invalidate runs, stats, and servers queries
				queryClient.invalidateQueries({queryKey: queryKeys.runs()});
				queryClient.invalidateQueries({queryKey: queryKeys.stats()});
				queryClient.invalidateQueries({queryKey: queryKeys.servers()});
			} catch (error) {
				console.error('[SSE] Failed to parse run event:', error);
			}
		});

		eventSource.addEventListener('ping', () => {
			// Keep-alive ping, no action needed
		});

		eventSource.onerror = (error) => {
			console.error('[SSE] Connection error:', error);
			// EventSource will automatically reconnect
		};

		return () => {
			console.log('[SSE] Disconnecting...');
			eventSource.close();
			eventSourceRef.current = null;
		};
	}, [queryClient]);
}
