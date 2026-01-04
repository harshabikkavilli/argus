/**
 * Runs API routes
 */

import {Request, Response, Router} from 'express';
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

	// Stop a run manually
	router.post('/:id/stop', (req: Request, res: Response) => {
		const run = db.getRun(req.params.id);

		if (!run) {
			res.status(404).json({error: 'Run not found'});
			return;
		}

		if (run.status !== 'active') {
			res.json({message: 'Run already stopped', run});
			return;
		}

		db.updateRun(req.params.id, {
			ended_at: Date.now(),
			status: 'manual_stopped'
		});

		const updatedRun = db.getRun(req.params.id);
		res.json({message: 'Run stopped', run: updatedRun});
	});

	return router;
}
