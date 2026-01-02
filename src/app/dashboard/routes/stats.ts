/**
 * Statistics API routes
 */

import {Router, Request, Response} from 'express';
import type {DatabaseAdapter} from '../../../infrastructure/database/types.js';

export function createStatsRoutes(db: DatabaseAdapter): Router {
	const router = Router();

	// Stats endpoint
	router.get('/', (req: Request, res: Response) => {
		const runId = req.query.run_id as string;

		const stats = db.getStats(runId);
		const toolBreakdown = db.getToolBreakdown(runId);
		const runStats = db.getRunStats();

		res.json({overview: stats, by_tool: toolBreakdown, runs: runStats});
	});

	return router;
}

