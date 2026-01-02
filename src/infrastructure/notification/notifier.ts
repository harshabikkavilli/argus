/**
 * Notifier - sends events to the API server for SSE broadcasting
 */

import {request} from 'http';
import {URL} from 'url';

export interface NotifierOptions {
	apiUrl?: string;
	enabled?: boolean;
}

export class Notifier {
	private apiUrl: string;
	private enabled: boolean;

	constructor(options: NotifierOptions = {}) {
		this.apiUrl = options.apiUrl || 'http://localhost:3000';
		this.enabled = options.enabled !== false;
		console.error(`[Notifier] Initialized: enabled=${this.enabled}, apiUrl=${this.apiUrl}`);
	}

	/**
	 * Notify the API of a new tool call
	 */
	async notifyNewCall(
		callId: string,
		toolName: string,
		runId: string | null
	): Promise<void> {
		if (!this.enabled) {
			console.error(`[Notifier] Notifications disabled`);
			return;
		}

		await this.sendNotification({
			type: 'call',
			callId,
			toolName,
			runId
		});
	}

	/**
	 * Notify the API of run changes
	 */
	async notifyRunChange(
		runId: string,
		action: 'started' | 'ended' | 'updated'
	): Promise<void> {
		if (!this.enabled) return;

		await this.sendNotification({
			type: 'run',
			runId,
			action
		});
	}

	private async sendNotification(data: unknown): Promise<void> {
		try {
			const url = new URL(`${this.apiUrl}/api/notify`);
			const body = JSON.stringify(data);

			console.error(`[Notifier] Sending notification to ${url.toString()}`);

			return new Promise((resolve, reject) => {
				const options = {
					hostname: url.hostname,
					port: url.port || (url.protocol === 'https:' ? 443 : 80),
					path: url.pathname,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Content-Length': Buffer.byteLength(body)
					}
				};

				const req = request(options, (res) => {
					if (res.statusCode === 200) {
						console.error(`[Notifier] ✓ Notification sent successfully`);
						resolve();
					} else {
						console.error(
							`[Notifier] Notification failed: ${res.statusCode} ${res.statusMessage}`
						);
						resolve(); // Don't reject, just log
					}
					res.on('data', () => {}); // Consume response
					res.on('end', () => {});
				});

				req.on('error', (error) => {
					console.error(`[Notifier] Notification error:`, error.message);
					resolve(); // Don't reject, just log
				});

				req.write(body);
				req.end();
			});
		} catch (error) {
			console.error(
				`[Notifier] Notification error:`,
				error instanceof Error ? error.message : String(error)
			);
		}
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
	}

	setApiUrl(url: string): void {
		this.apiUrl = url;
	}
}

export function createNotifier(options?: NotifierOptions): Notifier {
	return new Notifier(options);
}

