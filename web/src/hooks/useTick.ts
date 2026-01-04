import {useEffect, useState} from 'react';

/**
 * Forces a re-render at the specified interval
 * Useful for updating relative timestamps like "2m ago"
 */
export function useTick(intervalMs: number = 30000) {
	const [tick, setTick] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setTick((t) => t + 1);
		}, intervalMs);

		return () => clearInterval(interval);
	}, [intervalMs]);

	return tick;
}

