/**
 * Lightweight MCP Proxy
 * Records tool calls to database and optionally notifies dashboard
 */

import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import {v4 as uuidv4} from 'uuid';
import type {DatabaseAdapter, ToolCallRecord} from '../database/types.js';
import {createRedactionConfig, redact, type RedactionConfig} from '../../core/redaction/redactor.js';
import {RunManager} from '../../core/runs/runManager.js';
import {createNotifier, type Notifier} from '../notification/notifier.js';

// ============================================================================
// MCP Proxy Server
// ============================================================================

export interface ProxyOptions {
	idleTimeout?: number;
	redactionConfig?: RedactionConfig;
	notifier?: Notifier;
	apiUrl?: string;
}

export class MCPProxyServer {
	private server: Server;
	private upstreamClient: Client | null = null;
	private serverName: string;
	private db: DatabaseAdapter;
	private runManager: RunManager;
	private redactionConfig: RedactionConfig;
	private notifier: Notifier;
	private schemasCaptured: boolean = false;

	constructor(
		db: DatabaseAdapter,
		serverName: string = 'unknown',
		options: ProxyOptions = {}
	) {
		this.db = db;
		this.serverName = serverName;
		this.notifier =
			options.notifier ||
			createNotifier({
				apiUrl: options.apiUrl,
				enabled: !!options.apiUrl
			});
		this.runManager = new RunManager(db, serverName, {
			idleTimeoutMs: options.idleTimeout || 60000,
			notifier: this.notifier
		});
		this.redactionConfig =
			options.redactionConfig || createRedactionConfig(true);

		this.server = new Server(
			{
				name: 'argus-proxy',
				version: '1.0.0'
			},
			{
				capabilities: {
					tools: {}
				}
			}
		);

		this.setupHandlers();
	}

	async connectToUpstream(command: string, args: string[]): Promise<void> {
		try {
			const transport = new StdioClientTransport({
				command,
				args
			});

			this.upstreamClient = new Client(
				{
					name: 'argus-client',
					version: '1.0.0'
				},
				{
					capabilities: {}
				}
			);

			await this.upstreamClient.connect(transport);
			console.error(`[Argus] Connected to upstream MCP server: ${command}`);

			// Start a new run on connection
			this.runManager.startNewRun();
		} catch (error) {
			console.error(`[Argus] Failed to connect to upstream server:`, error);
			throw error;
		}
	}

	private setupHandlers(): void {
		// List available tools - proxy from upstream and capture schemas
		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			if (!this.upstreamClient) {
				return {tools: []};
			}

			const result = await this.upstreamClient.listTools();
			console.error(
				`[Argus] Proxying tools/list: ${result.tools?.length || 0} tools`
			);

			// Capture schemas on first list (per run)
			if (!this.schemasCaptured && result.tools) {
				this.runManager.captureToolSchemas(result.tools);
				this.schemasCaptured = true;
			}

			return result;
		});

		// Intercept and record tool calls
		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const callId = uuidv4();
			const startTime = Date.now();
			const toolName = request.params.name;
			const params = request.params.arguments ?? {};

			const runId = this.runManager.getRunIdForActivity();

			console.error(
				`[Argus] Tool call: ${toolName} (${callId}) [run: ${runId.slice(
					0,
					8
				)}]`
			);

			try {
				if (!this.upstreamClient) {
					throw new Error('No upstream MCP server connected');
				}

				// Forward to real MCP server
				const result = await this.upstreamClient.callTool({
					name: toolName,
					arguments: params
				});

				const latency = Date.now() - startTime;

				// Redact sensitive data before storing
				const redactedParams = JSON.stringify(
					redact(params, this.redactionConfig)
				);
				const redactedResult = JSON.stringify(
					redact(result, this.redactionConfig)
				);

				// Record successful call
				const record: ToolCallRecord = {
					id: callId,
					timestamp: startTime,
					tool_name: toolName,
					params: redactedParams,
					result: redactedResult,
					error: null,
					latency_ms: latency,
					mcp_server: this.serverName,
					run_id: runId,
					replayed_from: null
				};
				this.db.insertToolCall(record);
				this.runManager.incrementToolCount(false);

				// Notify dashboard
				this.notifier.notifyNewCall(callId, toolName, runId);

				console.error(`[Argus] ✓ ${toolName} completed in ${latency}ms`);
				return result;
			} catch (error: unknown) {
				const latency = Date.now() - startTime;
				const errorMsg = error instanceof Error ? error.message : String(error);

				// Redact sensitive data before storing
				const redactedParams = JSON.stringify(
					redact(params, this.redactionConfig)
				);

				// Record failed call
				const record: ToolCallRecord = {
					id: callId,
					timestamp: startTime,
					tool_name: toolName,
					params: redactedParams,
					result: null,
					error: errorMsg,
					latency_ms: latency,
					mcp_server: this.serverName,
					run_id: runId,
					replayed_from: null
				};
				this.db.insertToolCall(record);
				this.runManager.incrementToolCount(true);

				// Notify dashboard
				this.notifier.notifyNewCall(callId, toolName, runId);

				console.error(`[Argus] ✗ ${toolName} failed: ${errorMsg}`);
				throw error;
			}
		});
	}

	getUpstreamClient(): Client | null {
		return this.upstreamClient;
	}

	getRunManager(): RunManager {
		return this.runManager;
	}

	getRedactionConfig(): RedactionConfig {
		return this.redactionConfig;
	}

	async callTool(
		name: string,
		args: Record<string, unknown>
	): Promise<unknown> {
		if (!this.upstreamClient) {
			throw new Error('No upstream MCP server connected');
		}
		return this.upstreamClient.callTool({name, arguments: args});
	}

	async start(): Promise<void> {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
		console.error('[Argus] Proxy server started on stdio');
	}
}

