/**
 * Replay API routes
 * Proxies to the wrap command's API server for actual replay execution
 */

import {Router, Request, Response} from 'express';
import {request} from 'http';
import type {DatabaseAdapter} from '../../../infrastructure/database/types.js';

export interface ReplayContext {
	callTool?: (
		name: string,
		args: Record<string, unknown>
	) => Promise<unknown>;
	getRunIdForActivity?: () => string | null;
	incrementToolCount?: (hasError: boolean) => void;
}

// Default proxy API port (where wrap command listens)
const PROXY_API_PORT = 3001;

export function createReplayRoutes(
	db: DatabaseAdapter,
	_getReplayContext?: () => ReplayContext | null
): Router {
	const router = Router();

	// Start a new run manually - requires direct proxy context
	router.post('/runs/start', (_req: Request, res: Response) => {
		// This requires the proxy to be running in the same process
		// For now, just return an error since we don't have that capability
		res.status(503).json({
			error: 'Not supported in standalone mode',
			message: 'Starting runs manually requires the proxy and dashboard to run together.'
		});
	});

	// Replay a tool call - proxies to wrap command's API
	router.post('/calls/:id/replay', async (req: Request, res: Response) => {
		const callId = req.params.id;

		// First check if the call exists
		const call = db.getToolCall(callId);
		if (!call) {
			res.status(404).json({error: 'Call not found'});
			return;
		}

		// Try to call the proxy API
		try {
			const proxyResponse = await callProxyAPI(callId);
			res.json(proxyResponse);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			
			if (message.includes('ECONNREFUSED')) {
				res.status(503).json({
					error: 'Proxy not connected',
					message: 'Replay requires an active proxy connection. Make sure Claude Desktop is running with a wrapped MCP server.'
				});
			} else {
				res.status(500).json({error: message});
			}
		}
	});

	return router;
}

/**
 * Call the wrap command's proxy API for replay
 */
function callProxyAPI(callId: string): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const options = {
			hostname: 'localhost',
			port: PROXY_API_PORT,
			path: `/replay/${callId}`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			timeout: 30000 // 30 second timeout for replay
		};

		const req = request(options, (res) => {
			let data = '';
			res.on('data', (chunk) => {
				data += chunk;
			});
			res.on('end', () => {
				try {
					const parsed = JSON.parse(data);
					if (res.statusCode === 200) {
						resolve(parsed);
					} else {
						reject(new Error(parsed.error || `HTTP ${res.statusCode}`));
					}
				} catch {
					reject(new Error('Invalid response from proxy'));
				}
			});
		});

		req.on('error', (error) => {
			reject(error);
		});

		req.on('timeout', () => {
			req.destroy();
			reject(new Error('Replay request timed out'));
		});

		req.end();
	});
}
