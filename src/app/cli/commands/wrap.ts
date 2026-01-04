/**
 * Wrap command - Wrap an MCP server to record tool calls
 */

import {createServer, type IncomingMessage, type ServerResponse} from 'http';
import {v4 as uuidv4} from 'uuid';
import {
	ensureDataDir,
	getDefaultDbPath,
	loadConfig
} from '../../../config/index.js';
import {
	createRedactionConfig,
	redact,
	type RedactionConfig
} from '../../../core/redaction/redactor.js';
import {
	createSQLiteAdapter,
	type SQLiteAdapter
} from '../../../infrastructure/database/index.js';
import {MCPProxyServer} from '../../../infrastructure/mcp/index.js';
import {
	createNotifier,
	type Notifier
} from '../../../infrastructure/notification/notifier.js';

export async function handleWrapCommand(
	command: string,
	args: string[],
	options: {
		db?: string;
		api?: string;
		proxyPort?: string;
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

		// Start a mini HTTP server for replay functionality
		const proxyPort = parseInt(options.proxyPort || '3001');
		startProxyAPIServer(proxy, db, proxyPort, redactionConfig, notifier);

		// Start proxy on stdio (this blocks and keeps process alive)
		console.error(`[Argus] Starting proxy server...`);
		await proxy.start();

		// Keep process alive - the MCP SDK handles this, but we catch errors
	} catch (error) {
		console.error(`[Argus] Fatal error:`, error);
		process.exit(1);
	}
}

/**
 * Start a mini HTTP server that exposes replay functionality
 */
function startProxyAPIServer(
	proxy: MCPProxyServer,
	db: SQLiteAdapter,
	port: number,
	redactionConfig: RedactionConfig,
	notifier: Notifier
): void {
	const server = createServer((req: IncomingMessage, res: ServerResponse) => {
		// CORS headers
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

		if (req.method === 'OPTIONS') {
			res.writeHead(200);
			res.end();
			return;
		}

		// Health check
		if (req.method === 'GET' && req.url === '/health') {
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.end(JSON.stringify({status: 'ok', proxy: 'connected'}));
			return;
		}

		// Replay endpoint
		if (req.method === 'POST' && req.url?.startsWith('/replay/')) {
			const callId = req.url.replace('/replay/', '');
			handleReplay(callId, proxy, db, redactionConfig, notifier, res);
			return;
		}

		res.writeHead(404, {'Content-Type': 'application/json'});
		res.end(JSON.stringify({error: 'Not found'}));
	});

	server.listen(port, () => {
		console.error(`[Argus] Proxy API running on http://localhost:${port}`);
	});

	server.on('error', (err) => {
		if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
			console.error(`[Argus] Port ${port} in use, trying ${port + 1}...`);
			server.listen(port + 1);
		} else {
			console.error(`[Argus] Proxy API error:`, err);
		}
	});
}

async function handleReplay(
	callId: string,
	proxy: MCPProxyServer,
	db: SQLiteAdapter,
	redactionConfig: RedactionConfig,
	notifier: Notifier,
	res: ServerResponse
): Promise<void> {
	try {
		const call = db.getToolCall(callId);
		if (!call) {
			res.writeHead(404, {'Content-Type': 'application/json'});
			res.end(JSON.stringify({error: 'Call not found'}));
			return;
		}

		const params = JSON.parse(call.params);
		const startTime = Date.now();

		// Replay the call through the proxy
		const result = await proxy.callTool(call.tool_name, params);
		const latency = Date.now() - startTime;

		// Create replay record
		const replayId = uuidv4();
		const redactedResult = JSON.stringify(redact(result, redactionConfig));

		const replayRecord = {
			id: replayId,
			timestamp: startTime,
			tool_name: call.tool_name,
			params: call.params,
			result: redactedResult,
			error: null,
			latency_ms: latency,
			mcp_server: call.mcp_server,
			run_id: proxy.getRunManager().getCurrentRunId(),
			replayed_from: call.id
		};

		db.insertToolCall(replayRecord);
		proxy.getRunManager().incrementToolCount(false);

		// Notify dashboard
		notifier.notifyNewCall(replayId, call.tool_name, replayRecord.run_id);

		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(
			JSON.stringify({
				original: call,
				replay: replayRecord,
				result_changed: call.result !== redactedResult
			})
		);
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		console.error(`[Argus] Replay error:`, errorMsg);
		res.writeHead(500, {'Content-Type': 'application/json'});
		res.end(JSON.stringify({error: errorMsg}));
	}
}
