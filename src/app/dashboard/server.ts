/**
 * Dashboard Server
 * Combines routes, SSE, and UI into a single Express server
 */

import express, {Express, Request, Response} from 'express';
import type {DatabaseAdapter} from '../../infrastructure/database/types.js';
import {createDashboardRoutes, type ReplayContext} from './routes/index.js';
import {createSSEManager, type SSEManager} from './realtime/sseManager.js';
import {getUIHTML} from './ui/index.js';

export interface DashboardServerOptions {
	port?: number;
	enableSSE?: boolean;
	getReplayContext?: () => ReplayContext | null;
}

export function createDashboardServer(
	db: DatabaseAdapter,
	options: DashboardServerOptions = {}
): {app: Express; sse: SSEManager} {
	const app = express();
	const sse = options.enableSSE !== false ? createSSEManager() : createSSEManager();

	app.use(express.json());

	// CORS for SSE
	app.use((_req, res, next) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
		next();
	});

	// Serve UI
	app.get('/', (_req: Request, res: Response) => {
		res.send(getUIHTML());
	});

	// SSE endpoint
	app.get('/api/events', (req: Request, res: Response) => {
		sse.addClient(res);
		req.on('close', () => {
			// Client disconnected - handled in SSEManager
		});
	});

	// Notification endpoint for proxies to notify of new events
	app.post('/api/notify', (req: Request, res: Response) => {
		const {type, callId, toolName, runId, action} = req.body;

		if (type === 'call') {
			sse.notifyNewCall(callId, toolName, runId);
		} else if (type === 'run') {
			sse.notifyRunChange(runId, action);
		}

		res.json({ok: true});
	});

	// SSE status
	app.get('/api/sse/status', (_req: Request, res: Response) => {
		res.json({clients: sse.getClientCount()});
	});

	// Mount API routes
	app.use('/api', createDashboardRoutes(db, options.getReplayContext));

	return {app, sse};
}

export function startDashboardServer(
	db: DatabaseAdapter,
	options: DashboardServerOptions & {port?: number} = {}
): {app: Express; sse: SSEManager} {
	const {port = 3000, ...serverOptions} = options;
	const {app, sse} = createDashboardServer(db, serverOptions);

	app.listen(port, () => {
		console.error(`[Dashboard] Server running on http://localhost:${port}`);
	});

	return {app, sse};
}

