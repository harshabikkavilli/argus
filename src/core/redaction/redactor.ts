/**
 * Redaction module for MCP Inspector
 * Redacts sensitive data from params and results before storing
 */

const DEFAULT_SENSITIVE_KEYS = [
	'token',
	'secret',
	'password',
	'authorization',
	'cookie',
	'api_key',
	'apikey',
	'private_key',
	'credential',
	'access_token',
	'refresh_token',
	'bearer',
	'auth',
	'key'
];

const REDACTED_VALUE = '[REDACTED]';

export interface RedactionConfig {
	enabled: boolean;
	sensitiveKeys: string[];
}

export function createRedactionConfig(
	enabled: boolean = true,
	extraKeys: string[] = []
): RedactionConfig {
	return {
		enabled,
		sensitiveKeys: [...DEFAULT_SENSITIVE_KEYS, ...extraKeys]
	};
}

/**
 * Check if a key matches any sensitive pattern (case-insensitive)
 */
function isSensitiveKey(key: string, sensitiveKeys: string[]): boolean {
	const lowerKey = key.toLowerCase();
	return sensitiveKeys.some((sensitive) =>
		lowerKey.includes(sensitive.toLowerCase())
	);
}

/**
 * Deep clone and redact sensitive values from an object
 * Also handles JSON strings that may contain sensitive data
 */
export function redact(obj: unknown, config: RedactionConfig): unknown {
	if (!config.enabled) {
		return obj;
	}

	return redactValue(obj, config.sensitiveKeys);
}

function redactValue(value: unknown, sensitiveKeys: string[]): unknown {
	if (value === null || value === undefined) {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map((item) => redactValue(item, sensitiveKeys));
	}

	if (typeof value === 'object') {
		const result: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
			if (isSensitiveKey(key, sensitiveKeys)) {
				// Redact the value but keep the key
				result[key] = REDACTED_VALUE;
			} else {
				result[key] = redactValue(val, sensitiveKeys);
			}
		}
		return result;
	}

	// Handle strings that might be JSON containing sensitive data
	if (typeof value === 'string') {
		return redactStringContent(value, sensitiveKeys);
	}

	return value;
}

/**
 * Redact sensitive data from string content
 * Handles both JSON strings and plain text containing sensitive patterns
 */
function redactStringContent(str: string, sensitiveKeys: string[]): string {
	// Try to parse as JSON first
	if (str.trim().startsWith('{') || str.trim().startsWith('[')) {
		try {
			const parsed = JSON.parse(str);
			const redacted = redactValue(parsed, sensitiveKeys);
			return JSON.stringify(redacted, null, 2);
		} catch {
			// Not valid JSON, continue to pattern matching
		}
	}

	// For non-JSON strings, use pattern-based redaction
	// This catches things like "password: secret123" or "api_key=abc123"
	let result = str;

	for (const sensitiveKey of sensitiveKeys) {
		// Match patterns like: "key": "value" or key=value or key: value
		const patterns = [
			// JSON style: "password": "secret"
			new RegExp(`("${sensitiveKey}"\\s*:\\s*)"([^"]*)"`, 'gi'),
			// Key=value style: password=secret
			new RegExp(`(${sensitiveKey}\\s*=\\s*)([^\\s,;&]+)`, 'gi'),
			// Key: value style (YAML-like): password: secret
			new RegExp(`(${sensitiveKey}\\s*:\\s*)([^\\s,;\\n}]+)`, 'gi')
		];

		for (const pattern of patterns) {
			result = result.replace(pattern, `$1${REDACTED_VALUE}`);
		}
	}

	return result;
}

/**
 * Redact a JSON string
 */
export function redactJsonString(
	jsonStr: string,
	config: RedactionConfig
): string {
	if (!config.enabled) {
		return jsonStr;
	}

	try {
		const parsed = JSON.parse(jsonStr);
		const redacted = redact(parsed, config);
		return JSON.stringify(redacted);
	} catch {
		// If parsing fails, return original
		return jsonStr;
	}
}

