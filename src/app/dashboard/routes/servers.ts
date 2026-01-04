/**
 * Servers API routes
 */

import {Router, type Request, type Response} from 'express';
import type {DatabaseAdapter} from '../../../infrastructure/database/types.js';

export function createServersRoutes(db: DatabaseAdapter): Router {
	const router = Router();

	// GET /servers - List all unique servers
	router.get('/', (req: Request, res: Response) => {
		const servers = db.listServers();
		res.json(servers);
	});

	return router;
}

