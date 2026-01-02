/**
 * JSON diff utility for comparing tool call results
 */

export interface DiffChange {
	path: string;
	type: 'added' | 'removed' | 'changed';
	oldValue?: unknown;
	newValue?: unknown;
}

export interface DiffResult {
	changed: boolean;
	changes: DiffChange[];
}

/**
 * Compare two JSON values and return a list of changes
 */
export function diffJson(original: unknown, replay: unknown): DiffResult {
	const changes: DiffChange[] = [];
	compareValues(original, replay, '', changes);

	return {
		changed: changes.length > 0,
		changes
	};
}

function compareValues(
	original: unknown,
	replay: unknown,
	path: string,
	changes: DiffChange[]
): void {
	// Both null/undefined
	if (original === replay) {
		return;
	}

	// One is null/undefined
	if (original === null || original === undefined) {
		changes.push({path: path || '(root)', type: 'added', newValue: replay});
		return;
	}
	if (replay === null || replay === undefined) {
		changes.push({path: path || '(root)', type: 'removed', oldValue: original});
		return;
	}

	// Different types
	if (typeof original !== typeof replay) {
		changes.push({
			path: path || '(root)',
			type: 'changed',
			oldValue: original,
			newValue: replay
		});
		return;
	}

	// Arrays
	if (Array.isArray(original) && Array.isArray(replay)) {
		const maxLen = Math.max(original.length, replay.length);
		for (let i = 0; i < maxLen; i++) {
			const itemPath = path ? `${path}[${i}]` : `[${i}]`;
			if (i >= original.length) {
				changes.push({path: itemPath, type: 'added', newValue: replay[i]});
			} else if (i >= replay.length) {
				changes.push({path: itemPath, type: 'removed', oldValue: original[i]});
			} else {
				compareValues(original[i], replay[i], itemPath, changes);
			}
		}
		return;
	}

	// Objects
	if (typeof original === 'object' && typeof replay === 'object') {
		const origObj = original as Record<string, unknown>;
		const replayObj = replay as Record<string, unknown>;
		const allKeys = new Set([
			...Object.keys(origObj),
			...Object.keys(replayObj)
		]);

		for (const key of allKeys) {
			const keyPath = path ? `${path}.${key}` : key;
			if (!(key in origObj)) {
				changes.push({path: keyPath, type: 'added', newValue: replayObj[key]});
			} else if (!(key in replayObj)) {
				changes.push({path: keyPath, type: 'removed', oldValue: origObj[key]});
			} else {
				compareValues(origObj[key], replayObj[key], keyPath, changes);
			}
		}
		return;
	}

	// Primitives
	if (original !== replay) {
		changes.push({
			path: path || '(root)',
			type: 'changed',
			oldValue: original,
			newValue: replay
		});
	}
}

/**
 * Format a diff result as a human-readable string
 */
export function formatDiff(diff: DiffResult): string {
	if (!diff.changed) {
		return 'No changes';
	}

	return diff.changes
		.map((change) => {
			switch (change.type) {
				case 'added':
					return `+ ${change.path}: ${JSON.stringify(change.newValue)}`;
				case 'removed':
					return `- ${change.path}: ${JSON.stringify(change.oldValue)}`;
				case 'changed':
					return `~ ${change.path}: ${JSON.stringify(
						change.oldValue
					)} → ${JSON.stringify(change.newValue)}`;
			}
		})
		.join('\n');
}

