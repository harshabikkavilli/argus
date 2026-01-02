/**
 * Tool schema capture logic
 */

import {v4 as uuidv4} from 'uuid';
import type {ToolSchemaRecord} from '../types.js';

export interface SchemaCapture {
	id: string;
	run_id: string;
	mcp_server: string;
	captured_at: number;
	tools_json: string;
}

export function createToolSchema(
	runId: string,
	mcpServer: string,
	tools: unknown[]
): ToolSchemaRecord {
	return {
		id: uuidv4(),
		run_id: runId,
		mcp_server: mcpServer,
		captured_at: Date.now(),
		tools_json: JSON.stringify(tools)
	};
}

