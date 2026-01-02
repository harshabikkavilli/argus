/**
 * Server-Sent Events (SSE) Manager
 * Handles real-time push notifications to connected clients
 */

import {Response} from 'express';

export type SSEEventType = 'call' | 'run' | 'stats' | 'ping';

export interface SSEEvent {
	type: SSEEventType;
	data: unknown;
}

export class SSEManager {
	private clients: Set<Response> = new Set();
	private pingInterval: NodeJS.Timeout | null = null;

	constructor() {
		// Send ping every 30 seconds to keep connections alive
		this.pingInterval = setInterval(() => {
			this.broadcast({type: 'ping', data: {time: Date.now()}});
		}, 30000);
	}

	/**
	 * Add a new SSE client connection
	 */
	addClient(res: Response): void {
		// Set SSE headers
		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Connection', 'keep-alive');
		res.setHeader('Access-Control-Allow-Origin', '*');

		// Send initial connection event
		res.write(`event: connected\ndata: ${JSON.stringify({time: Date.now()})}\n\n`);

		this.clients.add(res);

		// Remove client on close
		res.on('close', () => {
			this.clients.delete(res);
		});
	}

	/**
	 * Broadcast an event to all connected clients
	 */
	broadcast(event: SSEEvent): void {
		const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;

		for (const client of this.clients) {
			try {
				client.write(message);
			} catch {
				// Client disconnected, remove it
				this.clients.delete(client);
			}
		}
	}

	/**
	 * Notify clients of a new tool call
	 */
	notifyNewCall(callId: string, toolName: string, runId: string | null): void {
		this.broadcast({
			type: 'call',
			data: {id: callId, tool_name: toolName, run_id: runId, time: Date.now()}
		});
	}

	/**
	 * Notify clients of run changes
	 */
	notifyRunChange(
		runId: string,
		action: 'started' | 'ended' | 'updated'
	): void {
		this.broadcast({
			type: 'run',
			data: {id: runId, action, time: Date.now()}
		});
	}

	/**
	 * Get number of connected clients
	 */
	getClientCount(): number {
		return this.clients.size;
	}

	/**
	 * Cleanup
	 */
	close(): void {
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}

		for (const client of this.clients) {
			try {
				client.end();
			} catch {
				// Ignore
			}
		}
		this.clients.clear();
	}
}

// Singleton instance for global access
let globalSSEManager: SSEManager | null = null;

export function getSSEManager(): SSEManager {
	if (!globalSSEManager) {
		globalSSEManager = new SSEManager();
	}
	return globalSSEManager;
}

export function createSSEManager(): SSEManager {
	return new SSEManager();
}

