import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '../lib/queryClient';
import * as api from '../api/client';
import type {ListCallsOptions} from '../types/api';

export function useCalls(options: ListCallsOptions = {}) {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: queryKeys.calls(options),
		queryFn: () => api.getCalls(options)
	});

	const refresh = () => {
		queryClient.invalidateQueries({queryKey: ['calls']});
	};

	return {
		calls: query.data ?? [],
		loading: query.isLoading,
		error: query.error,
		refresh
	};
}

export function useCall(id: string | null) {
	return useQuery({
		queryKey: queryKeys.call(id ?? ''),
		queryFn: () => api.getCall(id!),
		enabled: !!id
	});
}

export function useReplayCall() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => api.replayCall(id),
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: ['calls']});
			queryClient.invalidateQueries({queryKey: queryKeys.stats()});
		}
	});
}

export function useClearAll() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: api.clearAll,
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: ['calls']});
			queryClient.invalidateQueries({queryKey: queryKeys.runs});
			queryClient.invalidateQueries({queryKey: queryKeys.stats()});
		}
	});
}
