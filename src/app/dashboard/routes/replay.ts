/**
 * Replay API routes (require proxy context)
 */

import {Router, Request, Response} from 'express';
import {v4 as uuidv4} from 'uuid';
import type {DatabaseAdapter, ToolCallRecord} from '../../../infrastructure/database/types.js';
import {diffJson, type DiffResult} from '../../../core/replay/diff.js';
import {redact, type RedactionConfig} from '../../../core/redaction/redactor.js';

export interface ReplayContext {
	callTool?: (
		name: string,
		args: Record<string, unknown>
	) => Promise<unknown>;
	getRunIdForActivity?: () => string | null;
	incrementToolCount?: (hasError: boolean) => void;
	redactionConfig?: RedactionConfig;
}

export function createReplayRoutes(
	db: DatabaseAdapter,
	getReplayContext: () => ReplayContext | null
): Router {
	const router = Router();

	// Start a new run manually
	router.post('/runs/start', (_req: Request, res: Response) => {
		const ctx = getReplayContext();
		if (!ctx?.getRunIdForActivity) {
			res.status(503).json({error: 'Proxy not running'});
			return;
		}

		const runId = ctx.getRunIdForActivity();
		res.json({run_id: runId});
	});

	// Replay a tool call
	router.post('/calls/:id/replay', async (req: Request, res: Response) => {
		const call = db.getToolCall(req.params.id);

		if (!call) {
			res.status(404).json({error: 'Call not found'});
			return;
		}

		const ctx = getReplayContext();
		if (!ctx?.callTool) {
			res.status(503).json({error: 'Proxy not running - cannot replay'});
			return;
		}

		try {
			const params = JSON.parse(call.params);
			const startTime = Date.now();

			// Replay the call
			const result = await ctx.callTool(call.tool_name, params);

			const latency = Date.now() - startTime;

			// Redact before storing
			const redactionConfig =
				ctx.redactionConfig || {enabled: true, sensitiveKeys: []};
			const redactedParams = JSON.stringify(redact(params, redactionConfig));
			const redactedResult = JSON.stringify(redact(result, redactionConfig));

			// Record replayed call
			const replayId = uuidv4();
			const replayRecord: ToolCallRecord = {
				id: replayId,
				timestamp: startTime,
				tool_name: call.tool_name,
				params: redactedParams,
				result: redactedResult,
				error: null,
				latency_ms: latency,
				mcp_server: call.mcp_server,
				run_id: ctx.getRunIdForActivity?.() || null,
				replayed_from: call.id
			};

			db.insertToolCall(replayRecord);
			if (ctx.incrementToolCount) {
				ctx.incrementToolCount(false);
			}

			// Compare with original
			const originalResult = call.result ? JSON.parse(call.result) : null;
			const diff: DiffResult = diffJson(originalResult, result);

			res.json({
				replay_id: replayId,
				original_latency: call.latency_ms,
				replay_latency: latency,
				result_changed: diff.changed,
				diff: diff.changes,
				result: result
			});
		} catch (error: unknown) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			const latency = Date.now() - Date.now(); // Will be 0, but keeping structure

			// Record failed replay
			const replayId = uuidv4();
			const params = JSON.parse(call.params);
			const redactionConfig =
				ctx?.redactionConfig || {enabled: true, sensitiveKeys: []};
			const redactedParams = JSON.stringify(redact(params, redactionConfig));

			const replayRecord: ToolCallRecord = {
				id: replayId,
				timestamp: Date.now(),
				tool_name: call.tool_name,
				params: redactedParams,
				result: null,
				error: errorMsg,
				latency_ms: latency,
				mcp_server: call.mcp_server,
				run_id: ctx?.getRunIdForActivity?.() || null,
				replayed_from: call.id
			};

			db.insertToolCall(replayRecord);
			if (ctx?.incrementToolCount) {
				ctx.incrementToolCount(true);
			}

			res.status(500).json({
				replay_id: replayId,
				error: errorMsg,
				original_latency: call.latency_ms,
				replay_latency: latency
			});
		}
	});

	return router;
}

