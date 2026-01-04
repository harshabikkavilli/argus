import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '../lib/queryClient';
import * as api from '../api/client';

export function useRuns(limit = 50, status?: string) {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: queryKeys.runs(),
		queryFn: () => api.getRuns(limit, status)
	});

	const refresh = () => {
		queryClient.invalidateQueries({queryKey: queryKeys.runs()});
	};

	return {
		runs: query.data ?? [],
		loading: query.isLoading,
		isLoading: query.isLoading,
		error: query.error,
		refresh
	};
}

export function useRun(id: string | null) {
	return useQuery({
		queryKey: queryKeys.run(id ?? ''),
		queryFn: () => api.getRun(id!),
		enabled: !!id
	});
}

export function useStartRun() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: api.startRun,
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: queryKeys.runs()});
		}
	});
}

export function useStopRun() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => api.stopRun(id),
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: queryKeys.runs()});
		}
	});
}
