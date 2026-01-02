/**
 * Stats command - Display statistics
 */

import chalk from 'chalk';
import {existsSync} from 'fs';
import {loadConfig, getDefaultDbPath} from '../../../config/index.js';
import {createSQLiteAdapter} from '../../../infrastructure/database/index.js';

const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.magenta('👁️  Argus')} ${chalk.dim('v1.0.0')}                                         ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.dim('See, replay, test every MCP tool call')}                     ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════╝')}
`;

function formatLatency(ms: number | null): string {
	if (ms === null) return '-';
	return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

export async function handleStatsCommand(options: {run?: string}): Promise<void> {
	const config = await loadConfig();
	const dbPath = config.database || getDefaultDbPath();

	if (!existsSync(dbPath)) {
		console.log(banner);
		console.log(chalk.yellow('No database found at:'), dbPath);
		console.log(chalk.dim('\nRun some tool calls first, then try again.\n'));
		return;
	}

	const db = createSQLiteAdapter(dbPath);

	// Get stats using the adapter
	const runStats = db.getRunStats();
	const stats = db.getStats(options.run);
	const toolBreakdown = db.getToolBreakdown(options.run);

	console.log(banner);

	if (options.run) {
		console.log(chalk.dim(`Filtered by run: ${options.run}\n`));
	}

	console.log(chalk.bold('📊 Recording Stats\n'));

	console.log(
		chalk.magenta('Total Runs:     '),
		runStats.total_runs,
		runStats.active_runs > 0 ? chalk.green(`(${runStats.active_runs} active)`) : ''
	);
	console.log(chalk.cyan('Total Calls:    '), stats.total_calls);
	console.log(chalk.red('Failed Calls:   '), stats.failed_calls);
	console.log(
		chalk.yellow('Avg Latency:    '),
		formatLatency(stats.avg_latency)
	);
	console.log(chalk.yellow('Max Latency:    '), formatLatency(stats.max_latency));
	console.log(chalk.yellow('Min Latency:    '), formatLatency(stats.min_latency));

	if (toolBreakdown.length > 0) {
		console.log(chalk.bold('\n📈 By Tool\n'));
		toolBreakdown.forEach((tool) => {
			const avgLatency = formatLatency(tool.avg_latency);
			const errorRate =
				tool.call_count > 0
					? ((tool.error_count / tool.call_count) * 100).toFixed(1)
					: '0.0';

			console.log(chalk.cyan(tool.tool_name.padEnd(20)));
			console.log(
				chalk.dim('  Calls:      '),
				tool.call_count.toString().padStart(6)
			);
			console.log(
				chalk.dim('  Avg Latency:'),
				avgLatency.padStart(10)
			);
			console.log(
				chalk.dim('  Errors:     '),
				chalk.red(tool.error_count.toString().padStart(6)),
				chalk.dim(`(${errorRate}%)`)
			);
			console.log();
		});
	}

	db.close();
}

