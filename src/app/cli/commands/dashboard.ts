/**
 * Dashboard command - Start standalone web dashboard
 */

import chalk from 'chalk';

const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.magenta('👁️  Argus')} ${chalk.dim('v1.0.0')}                                         ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.dim('See, replay, test every MCP tool call')}                     ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════╝')}
`;

export async function handleDashboardCommand(options: {
	port?: string;
	db?: string;
	config?: string;
}): Promise<void> {
	console.log(banner);
	console.log(chalk.green('🖥️  Starting Argus Dashboard...'));
	console.log(chalk.dim('─'.repeat(60)));

	const {startDashboard} = await import('../../dashboard/index.js');

	await startDashboard({
		port: options.port ? parseInt(options.port) : undefined,
		dbPath: options.db,
		configPath: options.config
	});
}

