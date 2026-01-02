/**
 * Tool calls API routes
 */

import {Router, Request, Response} from 'express';
import type {DatabaseAdapter} from '../../../infrastructure/database/types.js';

export function createCallsRoutes(db: DatabaseAdapter): Router {
	const router = Router();

	// Get all tool calls
	router.get('/', (req: Request, res: Response) => {
		const limit = parseInt(req.query.limit as string) || 100;
		const toolName = req.query.tool as string;
		const hasError = req.query.error === 'true';
		const runId = req.query.run_id as string;

		const calls = db.listToolCalls({toolName, hasError, runId, limit});
		res.json(calls);
	});

	// Get single call with schema info
	router.get('/:id', (req: Request, res: Response) => {
		const call = db.getToolCall(req.params.id);

		if (!call) {
			res.status(404).json({error: 'Call not found'});
			return;
		}

		// Get schema for this call's run if available
		let toolSchema = null;
		if (call.run_id) {
			const schema = db.getSchemaForRun(call.run_id);

			if (schema) {
				const tools = JSON.parse(schema.tools_json) as Array<{
					name: string;
					inputSchema?: unknown;
				}>;
				toolSchema =
					tools.find((t) => t.name === call.tool_name)?.inputSchema || null;
			}
		}

		// Get original call if this is a replay
		let originalCall = null;
		if (call.replayed_from) {
			originalCall = db.getToolCall(call.replayed_from);
		}

		res.json({
			...call,
			tool_schema: toolSchema,
			original_call: originalCall
		});
	});

	// Clear all recordings
	router.delete('/', (_req: Request, res: Response) => {
		db.clearAll();
		res.json({message: 'All recordings cleared'});
	});

	return router;
}

