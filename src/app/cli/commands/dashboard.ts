/**
 * Dashboard command - Start standalone web dashboard
 */

import chalk from 'chalk';
import {exec, execSync} from 'child_process';
import {existsSync} from 'fs';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.magenta('👁️  Argus')} ${chalk.dim(
	'v1.0.0'
)}                                         ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.dim(
	'See, replay, test every MCP tool call'
)}                     ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════╝')}
`;

/**
 * Open URL in default browser (cross-platform)
 */
function openBrowser(url: string): void {
	const platform = process.platform;
	let command: string;

	switch (platform) {
		case 'darwin':
			command = `open "${url}"`;
			break;
		case 'win32':
			command = `start "" "${url}"`;
			break;
		default:
			command = `xdg-open "${url}"`;
	}

	exec(command, (error) => {
		if (error) {
			console.log(chalk.dim(`Could not open browser. Visit: ${url}`));
		}
	});
}

export async function handleDashboardCommand(options: {
	port?: string;
	db?: string;
	config?: string;
	open?: boolean;
}): Promise<void> {
	console.log(banner);

	// Check if UI is built
	const webDistPath = join(__dirname, '../../../../dist/web/index.html');
	const projectRoot = join(__dirname, '../../../..');

	if (!existsSync(webDistPath)) {
		console.log(chalk.yellow('⚠️  Dashboard UI not built yet.'));
		console.log(chalk.dim('Building UI... (this only happens once)\n'));

		try {
			execSync('npm run build:ui', {
				cwd: projectRoot,
				stdio: 'inherit'
			});
			console.log(chalk.green('\n✓ UI built successfully!\n'));
		} catch (error) {
			console.error(chalk.red('\n✗ Failed to build UI.'));
			console.log(chalk.dim('Try running manually: npm run build:ui\n'));
			process.exit(1);
		}
	}

	console.log(chalk.green('🖥️  Starting Argus Dashboard...'));
	console.log(chalk.dim('─'.repeat(60)));

	const {startDashboard} = await import('../../dashboard/index.js');

	const port = options.port ? parseInt(options.port) : 3000;

	await startDashboard({
		port,
		dbPath: options.db,
		configPath: options.config
	});

	// Open browser if --open flag is set
	if (options.open) {
		const url = `http://localhost:${port}`;
		console.log(chalk.cyan(`\n🌐 Opening ${url} in browser...`));
		openBrowser(url);
	}
}
