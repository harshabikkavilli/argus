/**
 * Hook for fetching and managing servers data
 */

import {useQuery} from '@tanstack/react-query';
import {getServers} from '../api/client';
import {queryKeys} from '../lib/queryClient';

export function useServers() {
	const {data: servers = [], isLoading, error} = useQuery({
		queryKey: queryKeys.servers(),
		queryFn: getServers
	});

	return {servers, isLoading, error};
}

