/**
 * Configuration management for MCP Inspector
 */

import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {homedir} from 'os';
import {dirname, join} from 'path';

// ============================================================================
// Types
// ============================================================================

export interface MCPServerConfig {
	name?: string; // Friendly display name for the server
	command: string;
	args?: string[];
	env?: Record<string, string>;
}

export interface InspectorConfig {
	database?: string;
	port?: number;
	idleTimeout?: number;
	redaction?: {
		enabled?: boolean;
		keys?: string[];
	};
	servers?: Record<string, MCPServerConfig>;
}

// ============================================================================
// Default Paths
// ============================================================================

const CONFIG_FILE_NAME = 'argus.config.json';
const DEFAULT_DB_NAME = 'argus.db';

/**
 * Get the default data directory for Argus
 */
export function getDataDir(): string {
	const dir = join(homedir(), '.argus');
	return dir;
}

/**
 * Get the default database path
 */
export function getDefaultDbPath(): string {
	return join(getDataDir(), DEFAULT_DB_NAME);
}

/**
 * Ensure the data directory exists
 */
export function ensureDataDir(): void {
	const dir = getDataDir();
	if (!existsSync(dir)) {
		mkdirSync(dir, {recursive: true});
	}
}

// ============================================================================
// Config Loading
// ============================================================================

/**
 * Find config file in order of precedence:
 * 1. Explicit path provided
 * 2. Current directory
 * 3. Home directory (~/.argus/)
 */
export function findConfigFile(explicitPath?: string): string | null {
	if (explicitPath) {
		return existsSync(explicitPath) ? explicitPath : null;
	}

	// Check current directory
	const cwdConfig = join(process.cwd(), CONFIG_FILE_NAME);
	if (existsSync(cwdConfig)) {
		return cwdConfig;
	}

	// Check home directory
	const homeConfig = join(getDataDir(), CONFIG_FILE_NAME);
	if (existsSync(homeConfig)) {
		return homeConfig;
	}

	return null;
}

/**
 * Load configuration from file
 */
export async function loadConfig(
	explicitPath?: string
): Promise<InspectorConfig> {
	const configPath = findConfigFile(explicitPath);

	if (!configPath) {
		return {};
	}

	try {
		const content = readFileSync(configPath, 'utf-8');
		const config = JSON.parse(content) as InspectorConfig;

		// Expand environment variables in server configs
		if (config.servers) {
			for (const server of Object.values(config.servers)) {
				if (server.env) {
					for (const [key, value] of Object.entries(server.env)) {
						server.env[key] = expandEnvVars(value);
					}
				}
			}
		}

		// Expand ~ in database path
		if (config.database) {
			config.database = expandPath(config.database);
		}

		console.error(`[Config] Loaded from ${configPath}`);
		return config;
	} catch (error) {
		console.error(`[Config] Failed to load ${configPath}:`, error);
		return {};
	}
}

/**
 * Expand environment variables in a string (e.g., ${GITHUB_TOKEN})
 */
function expandEnvVars(value: string): string {
	return value.replace(/\$\{(\w+)\}/g, (_, name) => {
		return process.env[name] || '';
	});
}

/**
 * Expand ~ to home directory
 */
function expandPath(path: string): string {
	if (path.startsWith('~/')) {
		return join(homedir(), path.slice(2));
	}
	if (path.startsWith('~')) {
		return join(homedir(), path.slice(1));
	}
	return path;
}

// ============================================================================
// Config Writing
// ============================================================================

/**
 * Create a default config file
 */
export function createDefaultConfig(path?: string): string {
	const configPath = path || join(getDataDir(), CONFIG_FILE_NAME);

	ensureDataDir();

	const defaultConfig: InspectorConfig = {
		database: getDefaultDbPath(),
		port: 3000,
		idleTimeout: 60000,
		redaction: {
			enabled: true,
			keys: [
				'token',
				'secret',
				'password',
				'authorization',
				'cookie',
				'api_key',
				'private_key',
				'credential'
			]
		},
		servers: {
			// Example server configuration
			// "github": {
			//   "name": "GitHub Server",
			//   "command": "npx",
			//   "args": ["-y", "@modelcontextprotocol/server-github"],
			//   "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
			// },
			// "filesystem": {
			//   "name": "Filesystem Server",
			//   "command": "npx",
			//   "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
			// }
		}
	};

	// Ensure directory exists
	const dir = dirname(configPath);
	if (!existsSync(dir)) {
		mkdirSync(dir, {recursive: true});
	}

	writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
	return configPath;
}

// ============================================================================
// Claude Desktop Integration
// ============================================================================

export interface ClaudeDesktopConfig {
	mcpServers: Record<
		string,
		{
			command: string;
			args: string[];
			env?: Record<string, string>;
		}
	>;
}

/**
 * Generate Claude Desktop configuration for wrapping MCP servers with Argus
 */
export function generateClaudeDesktopConfig(
	servers: Record<string, MCPServerConfig>,
	inspectorPath: string,
	dbPath?: string
): ClaudeDesktopConfig {
	const config: ClaudeDesktopConfig = {
		mcpServers: {}
	};

	for (const [key, server] of Object.entries(servers)) {
		const args = ['tsx', join(inspectorPath, 'src/app/cli/index.ts'), 'wrap'];

		if (dbPath) {
			args.push('--db', dbPath);
		}

		// Add --name flag with server name (use config name, fallback to key)
		const serverName = server.name || key;
		args.push('--name', serverName);

		args.push('--', server.command, ...(server.args || []));

		config.mcpServers[key] = {
			command: 'npx',
			args,
			env: server.env
		};
	}

	return config;
}

/**
 * Get the path to Claude Desktop config file
 */
export function getClaudeDesktopConfigPath(): string {
	const platform = process.platform;

	if (platform === 'darwin') {
		return join(
			homedir(),
			'Library',
			'Application Support',
			'Claude',
			'claude_desktop_config.json'
		);
	} else if (platform === 'win32') {
		return join(
			process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'),
			'Claude',
			'claude_desktop_config.json'
		);
	} else {
		// Linux
		return join(
			process.env.XDG_CONFIG_HOME || join(homedir(), '.config'),
			'claude',
			'claude_desktop_config.json'
		);
	}
}
