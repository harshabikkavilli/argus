import {useQuery, useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '../lib/queryClient';
import * as api from '../api/client';
import type {TopToolStat} from '../types/api';

interface NormalizedStats {
	total_calls: number;
	failed_calls: number;
	avg_latency: number;
	max_latency: number;
	top_tools: TopToolStat[];
}

export function useStats(runId?: string) {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: queryKeys.stats(runId),
		queryFn: async () => {
			const data = await api.getStats(runId);

			// Normalize stats into flat structure
			const normalized: NormalizedStats = {
				total_calls: data.overview?.total_calls ?? data.total_calls ?? 0,
				failed_calls: data.overview?.failed_calls ?? data.failed_calls ?? 0,
				avg_latency: data.overview?.avg_latency ?? data.avg_latency ?? 0,
				max_latency: data.overview?.max_latency ?? data.max_latency ?? 0,
				top_tools:
					data.top_tools ??
					data.by_tool?.map((t) => ({
						tool_name: t.tool_name,
						count: t.call_count
					})) ??
					[]
			};

			return normalized;
		}
	});

	const refresh = () => {
		queryClient.invalidateQueries({queryKey: ['stats']});
	};

	return {
		stats: query.data ?? null,
		loading: query.isLoading,
		error: query.error,
		refresh
	};
}
