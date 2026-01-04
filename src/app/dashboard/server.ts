/**
 * Dashboard Server
 * Combines routes, SSE, and UI into a single Express server
 */

import express, {Express, Request, Response} from 'express';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';
import type {DatabaseAdapter} from '../../infrastructure/database/types.js';
import {createDashboardRoutes, type ReplayContext} from './routes/index.js';
import {createSSEManager, type SSEManager} from './realtime/sseManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

	// Serve static files from dist/web (built React app)
	const webDistPath = join(__dirname, '../../../../dist/web');
	app.use(express.static(webDistPath));

	// SPA fallback: serve index.html for all non-API routes
	app.use((req: Request, res: Response, next) => {
		// Don't serve index.html for API routes
		if (req.path.startsWith('/api')) {
			return next();
		}
		// For all other routes, serve the React app
		res.sendFile(join(webDistPath, 'index.html'));
	});

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

