/**
 * Runs API routes
 */

import {Router, Request, Response} from 'express';
import type {DatabaseAdapter} from '../../../infrastructure/database/types.js';

export function createRunsRoutes(db: DatabaseAdapter): Router {
	const router = Router();

	// List all runs
	router.get('/', (req: Request, res: Response) => {
		const limit = parseInt(req.query.limit as string) || 50;
		const status = req.query.status as string;

		const runs = db.listRuns({status, limit});
		res.json(runs);
	});

	// Get single run with its calls
	router.get('/:id', (req: Request, res: Response) => {
		const run = db.getRun(req.params.id);

		if (!run) {
			res.status(404).json({error: 'Run not found'});
			return;
		}

		const calls = db.getToolCallsForRun(req.params.id);
		res.json({...run, calls});
	});

	// Get schema for a run
	router.get('/:id/schema', (req: Request, res: Response) => {
		const schema = db.getSchemaForRun(req.params.id);

		if (!schema) {
			res.status(404).json({error: 'Schema not found for this run'});
			return;
		}

		res.json({
			...schema,
			tools: JSON.parse(schema.tools_json)
		});
	});

	return router;
}

