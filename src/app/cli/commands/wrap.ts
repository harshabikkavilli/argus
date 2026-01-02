/**
 * Wrap command - Wrap an MCP server to record tool calls
 */

import {loadConfig, getDefaultDbPath, ensureDataDir} from '../../../config/index.js';
import {createSQLiteAdapter} from '../../../infrastructure/database/index.js';
import {MCPProxyServer} from '../../../infrastructure/mcp/index.js';
import {createNotifier} from '../../../infrastructure/notification/notifier.js';
import {createRedactionConfig} from '../../../core/redaction/redactor.js';

export async function handleWrapCommand(
	command: string,
	args: string[],
	options: {
		db?: string;
		api?: string;
		idleTimeout?: string;
		redact?: string | boolean;
	}
): Promise<void> {
	try {
		// Check Node.js version
		const nodeVersion = process.version;
		const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
		if (majorVersion < 18) {
			console.error(
				`[Argus] Warning: Node.js ${nodeVersion} detected. Node.js >=18 is recommended.`
			);
			console.error(
				`[Argus] If you encounter module errors, rebuild native modules:`
			);
			console.error(`[Argus]   npm rebuild better-sqlite3`);
		}

		// Load config
		const config = await loadConfig();

		// Determine database path
		const dbPath = options.db || config.database || getDefaultDbPath();
		ensureDataDir();

		// Use stderr for logging (doesn't interfere with stdio JSON-RPC)
		console.error(`[Argus] Wrapping: ${command} ${args.join(' ')}`);
		console.error(`[Argus] Database: ${dbPath}`);

		// Create database adapter
		const db = createSQLiteAdapter(dbPath);

		const redactKeys =
			typeof options.redact === 'string'
				? options.redact.split(',').map((k: string) => k.trim())
				: config.redaction?.keys || [];

		const redactionConfig = createRedactionConfig(
			options.redact !== false && config.redaction?.enabled !== false,
			redactKeys
		);

		const notifier = createNotifier({
			apiUrl: options.api,
			enabled: !!options.api
		});

		const proxy = new MCPProxyServer(db, command, {
			idleTimeout: parseInt(options.idleTimeout || '60') * 1000,
			redactionConfig,
			notifier
		});

		// Connect to upstream server
		console.error(`[Argus] Connecting to upstream server...`);
		await proxy.connectToUpstream(command, args);

		// Start proxy on stdio (this blocks and keeps process alive)
		console.error(`[Argus] Starting proxy server...`);
		await proxy.start();

		// Keep process alive - the MCP SDK handles this, but we catch errors
	} catch (error) {
		console.error(`[Argus] Fatal error:`, error);
		process.exit(1);
	}
}

