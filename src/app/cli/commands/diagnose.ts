/**
 * Diagnose command - Diagnostic information
 */

import chalk from 'chalk';
import {existsSync} from 'fs';
import {loadConfig, getDefaultDbPath} from '../../../config/index.js';

const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.magenta('👁️  Argus')} ${chalk.dim('v1.0.0')}                                         ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.dim('See, replay, test every MCP tool call')}                     ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════╝')}
`;

export async function handleDiagnoseCommand(): Promise<void> {
	console.log(banner);
	console.log(chalk.bold('🔍 Diagnostic Information\n'));

	const config = await loadConfig();
	const inspectorPath = process.cwd();
	const dbPath = config.database || getDefaultDbPath();

	console.log(chalk.cyan('Argus Path:'), inspectorPath);
	console.log(chalk.cyan('Database Path:'), dbPath);
	console.log(
		chalk.cyan('Database Exists:'),
		existsSync(dbPath) ? chalk.green('Yes') : chalk.red('No')
	);

	// Check if tsx is available
	const {execSync} = await import('child_process');
	try {
		execSync('npx tsx --version', {stdio: 'ignore'});
		console.log(chalk.cyan('npx tsx:'), chalk.green('Available'));
	} catch {
		console.log(chalk.cyan('npx tsx:'), chalk.red('Not found'));
	}

	// Check Node.js version
	console.log(chalk.cyan('Node.js:'), process.version);
	console.log(chalk.cyan('Platform:'), process.platform);
	console.log(chalk.cyan('Architecture:'), process.arch);

	console.log();
}

