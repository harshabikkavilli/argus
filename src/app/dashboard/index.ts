/**
 * Dashboard Entry Point
 * Standalone dashboard that can run independently
 */

import {createSQLiteAdapter} from '../../infrastructure/database/index.js';
import {startDashboardServer} from './server.js';
import {loadConfig, getDefaultDbPath, ensureDataDir} from '../../config/index.js';

export interface DashboardOptions {
	port?: number;
	dbPath?: string;
	configPath?: string;
}

export async function startDashboard(options: DashboardOptions = {}): Promise<void> {
	// Load config file if present
	const config = await loadConfig(options.configPath);

	// Merge options with config (CLI options take precedence)
	const port = options.port || config.port || 3000;
	const dbPath = options.dbPath || config.database || getDefaultDbPath();

	// Ensure data directory exists
	ensureDataDir();

	console.error(`[Dashboard] Starting Argus Dashboard`);
	console.error(`[Dashboard] Database: ${dbPath}`);
	console.error(`[Dashboard] Port: ${port}`);

	// Create database adapter
	const db = createSQLiteAdapter(dbPath);

	// Start dashboard server (no replay context since we're standalone)
	const {sse} = startDashboardServer(db, {
		port,
		enableSSE: true
	});

	console.error(`[Dashboard] Ready at http://localhost:${port}`);
	console.error(`[Dashboard] SSE enabled for real-time updates`);

	// Handle graceful shutdown
	process.on('SIGINT', () => {
		console.error('\n[Dashboard] Shutting down...');
		sse.close();
		db.close();
		process.exit(0);
	});

	process.on('SIGTERM', () => {
		console.error('\n[Dashboard] Shutting down...');
		sse.close();
		db.close();
		process.exit(0);
	});
}

