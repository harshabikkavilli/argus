import {QueryClient} from '@tanstack/react-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5000, // Data is fresh for 5 seconds
			refetchOnWindowFocus: true,
			refetchOnReconnect: true,
			retry: 1
		}
	}
});

// Query keys for type-safe invalidation
export const queryKeys = {
	runs: () => ['runs'] as const,
	run: (id: string) => ['runs', id] as const,
	calls: (filters?: {run_id?: string; limit?: number}) => ['calls', filters] as const,
	call: (id: string) => ['calls', id] as const,
	stats: (runId?: string) => ['stats', runId] as const,
	servers: () => ['servers'] as const
};

